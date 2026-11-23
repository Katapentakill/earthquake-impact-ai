"""Resumen de los impactos de un evento, para la lista de sismos.

Una función pura: recibe los impactos (objetos del ORM o cualquier cosa con esos atributos) y devuelve
el nivel más alto, las sumas y si la estimación salió de reglas o del modelo de IA.
"""
from typing import Any, Dict, Iterable

NIVELES = ["BAJO", "MODERADO", "ALTO", "CATASTROFICO"]
MARCAS_RESPALDO = ("fallback", "respaldo")


def _texto(valor: Any) -> str:
    return str(getattr(valor, "value", valor) or "").upper()


def _es_respaldo(impacto: Any) -> bool:
    fuentes = getattr(impacto, "fuentes_inferidas", None) or []
    return any(any(m in str(f).lower() for m in MARCAS_RESPALDO) for f in fuentes)


def resumen_impactos(impactos: Iterable[Any]) -> Dict[str, Any]:
    impactos = list(impactos)
    if not impactos:
        return {
            "nivel_destruccion": None,
            "muertes_estimadas": None,
            "heridos_estimados": None,
            "perdidas_monetarias_usd": None,
            "estimacion": None,
        }
    indices = [NIVELES.index(n) if (n := _texto(getattr(i, "nivel_destruccion", None))) in NIVELES else 0 for i in impactos]
    return {
        "nivel_destruccion": NIVELES[max(indices)],
        "muertes_estimadas": sum(int(getattr(i, "muertes_estimadas", 0) or 0) for i in impactos),
        "heridos_estimados": sum(int(getattr(i, "heridos_estimados", 0) or 0) for i in impactos),
        "perdidas_monetarias_usd": sum(int(getattr(i, "perdidas_monetarias_usd", 0) or 0) for i in impactos),
        "estimacion": "reglas" if all(_es_respaldo(i) for i in impactos) else "ia",
    }
