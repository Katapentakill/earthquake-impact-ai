"""Lectura y saneamiento de la respuesta del modelo de IA.

Son funciones puras, sin red ni configuración: `pytest` las prueba sin FastAPI ni Docker (ver tests/test_respuesta_ia.py).
El cliente de Hugging Face (app/inference/huggingface_client.py) las usa para convertir el texto que devuelve el modelo
en la lista de impactos por país que guarda la base de datos.
"""
import json
import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

NIVELES_DESTRUCCION = ("BAJO", "MODERADO", "ALTO", "CATASTROFICO")
CAMPOS_OBLIGATORIOS = (
    "pais",
    "ciudades_afectadas",
    "muertes_estimadas",
    "heridos_estimados",
    "perdidas_monetarias_usd",
    "nivel_destruccion",
)
CAMPOS_NUMERICOS = ("muertes_estimadas", "heridos_estimados", "perdidas_monetarias_usd")

# El texto de ejemplo de .env.example no es un token: no tiene sentido llamar a Hugging Face con él.
TOKEN_DE_EJEMPLO = "hf_your_token_here"


def tiene_token(token: Optional[str]) -> bool:
    """¿Hay un token de Hugging Face de verdad (no vacío y no el texto de ejemplo)?"""
    limpio = (token or "").strip()
    return bool(limpio) and limpio != TOKEN_DE_EJEMPLO


def _a_entero(valor: Any) -> Optional[int]:
    """Convierte un número que el modelo escribió como número, como texto («1,200», «$15 000») o con decimales."""
    if isinstance(valor, bool):
        return None
    if isinstance(valor, (int, float)):
        return int(valor)
    if isinstance(valor, str):
        limpio = re.sub(r"[^\d.\-]", "", valor.replace(",", ""))
        try:
            return int(float(limpio))
        except ValueError:
            return None
    return None


def extraer_lista_json(texto: str) -> Optional[list]:
    """Saca la lista JSON de la respuesta, aunque venga entre ```json ... ``` o con texto antes y después.

    Devuelve None si no hay una lista o no se puede leer. Repara un error frecuente de los modelos chicos: la coma
    sobrante antes de un cierre (`[1, 2,]`).
    """
    inicio = texto.find("[")
    fin = texto.rfind("]") + 1
    if inicio == -1 or fin == 0:
        logger.warning("La respuesta de la IA no trae una lista JSON")
        return None
    candidato = texto[inicio:fin]
    for intento in (candidato, re.sub(r",\s*([\]}])", r"\1", candidato)):
        try:
            leido = json.loads(intento)
        except json.JSONDecodeError as error:
            ultimo_error = error
            continue
        return leido if isinstance(leido, list) else None
    logger.error(f"JSON inválido en la respuesta de la IA: {ultimo_error}")
    return None


def validar_impacto(impacto: Dict[str, Any]) -> bool:
    """Comprueba los campos obligatorios y deja el impacto listo para guardar (corrige tipos y valores opcionales).

    Modifica `impacto` en el lugar. Devuelve False si falta un campo o una cifra no es un número.
    """
    if not isinstance(impacto, dict):
        return False
    for campo in CAMPOS_OBLIGATORIOS:
        if campo not in impacto:
            logger.warning(f"Al impacto le falta el campo obligatorio: {campo}")
            return False

    for campo in CAMPOS_NUMERICOS:
        numero = _a_entero(impacto[campo])
        if numero is None or numero < 0:
            logger.warning(f"El campo {campo} no es un número válido: {impacto[campo]!r}")
            return False
        impacto[campo] = numero

    nivel = str(impacto.get("nivel_destruccion", "")).upper()
    if nivel not in NIVELES_DESTRUCCION:
        logger.warning(f"nivel_destruccion inválido ({impacto.get('nivel_destruccion')!r}): se usa BAJO")
        nivel = "BAJO"
    impacto["nivel_destruccion"] = nivel

    for campo, por_defecto in (
        ("ciudades_afectadas", []),
        ("fuentes_inferidas", ["Análisis por IA"]),
        ("factores_considerados", ["Análisis sísmico estándar"]),
    ):
        valor = impacto.get(campo)
        if valor is None:
            impacto[campo] = list(por_defecto)
        elif not isinstance(valor, list):
            impacto[campo] = [str(valor)]
    return True


def parsear_respuesta(texto: str) -> List[Dict[str, Any]]:
    """Texto del modelo → lista de impactos válidos (vacía si no hay ninguno que sirva)."""
    lista = extraer_lista_json(texto)
    if lista is None:
        return []
    validos = [impacto for impacto in lista if validar_impacto(impacto)]
    logger.info(f"{len(validos)} de {len(lista)} impactos de la IA pasaron la validación")
    return validos


def corregir_ceros(impactos: List[Dict[str, Any]], magnitud: float, profundidad: float) -> List[Dict[str, Any]]:
    """Si la IA devuelve todo en cero para un sismo que no lo justifica (magnitud 6 o más, o un nivel de destrucción
    que no es BAJO), reemplaza las cifras por un mínimo calculado con magnitud, profundidad, preparación y densidad.

    Las cifras que la IA sí dio no se tocan. Modifica los impactos en el lugar y los devuelve.
    """
    for impacto in impactos:
        nivel = impacto.get("nivel_destruccion", "BAJO")
        todo_cero = (
            impacto.get("muertes_estimadas", 0) == 0
            and impacto.get("heridos_estimados", 0) == 0
            and impacto.get("perdidas_monetarias_usd", 0) == 0
        )
        if not (todo_cero and (magnitud >= 6.0 or nivel in ("MODERADO", "ALTO", "CATASTROFICO"))):
            continue
        logger.warning(f"La IA devolvió todo en cero para magnitud {magnitud} (nivel {nivel}): se corrige")

        if magnitud >= 7.0:
            base_muertes = int(500 * (magnitud - 6))
            base_heridos = base_muertes * 4
            base_perdidas = int(1e9 * magnitud)
        elif magnitud >= 6.0:
            base_muertes = int(100 * (magnitud - 5))
            base_heridos = base_muertes * 3
            base_perdidas = int(1e8 * magnitud)
        elif magnitud >= 5.0:
            base_muertes = 0 if magnitud < 5.5 else int(10 * (magnitud - 5))
            base_heridos = int(50 * magnitud)
            base_perdidas = int(1e7 * magnitud)
        else:
            base_muertes = 0
            base_heridos = int(10 * magnitud)
            base_perdidas = int(1e6 * magnitud)

        # Un sismo profundo daña menos la superficie; uno superficial, más.
        factor_profundidad = 0.5 if profundidad > 100 else 0.7 if profundidad > 70 else 1.3 if profundidad < 30 else 1.0
        preparacion = impacto.get("nivel_preparacion_sismica", "Media")
        factor_preparacion = {"Alta": 0.6, "Baja": 1.5}.get(preparacion, 1.0)
        densidad = impacto.get("densidad_poblacional", "Media")
        factor_densidad = {"Alta": 1.5, "Baja": 0.5}.get(densidad, 1.0)

        impacto["muertes_estimadas"] = int(base_muertes * factor_profundidad * factor_preparacion * factor_densidad)
        impacto["heridos_estimados"] = int(base_heridos * factor_profundidad * factor_preparacion * factor_densidad)
        impacto["perdidas_monetarias_usd"] = int(base_perdidas * factor_profundidad * factor_densidad)

        nota = (
            f"Corrección automática: la IA devolvió ceros, así que las cifras se ajustaron por profundidad "
            f"({profundidad} km, factor {factor_profundidad}), preparación sísmica ({preparacion}, factor {factor_preparacion}) "
            f"y densidad de población ({densidad}, factor {factor_densidad})."
        )
        impacto["razonamiento"] = f"{impacto['razonamiento']} {nota}" if impacto.get("razonamiento") else nota
        fuentes = impacto.setdefault("fuentes_inferidas", [])
        if "Corrección por magnitud" not in fuentes:
            fuentes.append("Corrección por magnitud")
    return impactos
