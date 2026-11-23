"""Estimación de impacto por reglas, para cuando el modelo de IA no está disponible.

Es una función pura (sin red ni base de datos) para poder probarla sola. La regla es deliberadamente
simple: parte de la magnitud y la atenúa según la profundidad, porque un sismo profundo libera su
energía lejos de la superficie y casi no se siente en ella.
"""
from typing import Any, Dict, List

# Textos que marcan una estimación como "de respaldo". También los reconoce el resumen de impactos,
# incluida la marca en inglés que dejaron las filas guardadas antes de este cambio.
MARCA_FUENTE = "Estimación por reglas (respaldo) - modelo de IA no disponible"

SUPERFICIAL_HASTA_KM = 70
INTERMEDIA_HASTA_KM = 300


def _num(valor: float, decimales: int) -> str:
    """Número con coma decimal, como se lee en español: 5,4 · 117 · 0,4."""
    return f"{valor:.{decimales}f}".rstrip("0").rstrip(".").replace(".", ",") if decimales else f"{valor:.0f}"


def clase_profundidad(profundidad_km: float) -> str:
    """superficial (menos de 70 km), intermedia (70 a 300 km) o profunda (más de 300 km)."""
    if profundidad_km < SUPERFICIAL_HASTA_KM:
        return "superficial"
    if profundidad_km <= INTERMEDIA_HASTA_KM:
        return "intermedia"
    return "profunda"


def factor_profundidad(profundidad_km: float) -> float:
    """Cuánto del efecto llega a la superficie: 1 si es superficial, menos mientras más profundo."""
    return {"superficial": 1.0, "intermedia": 0.4, "profunda": 0.02}[clase_profundidad(profundidad_km)]


def estimacion_respaldo(magnitud: float, profundidad: float) -> List[Dict[str, Any]]:
    """Devuelve una lista con una sola estimación, con las mismas claves que entrega el modelo de IA."""
    if magnitud >= 7.0:
        nivel = 2  # ALTO
        muertes = 1000 * (magnitud - 6)
        heridos = muertes * 5
        perdidas = 1e9 * magnitud
    elif magnitud >= 6.0:
        nivel = 1  # MODERADO
        muertes = 100 * (magnitud - 5)
        heridos = muertes * 3
        perdidas = 1e8 * magnitud
    else:
        nivel = 0  # BAJO
        muertes = 0.0
        heridos = 10 * magnitud
        perdidas = 1e6 * magnitud

    factor = factor_profundidad(profundidad)
    if factor < 0.5:
        nivel = max(0, nivel - 1)  # un sismo profundo o intermedio baja un nivel
    niveles = ["BAJO", "MODERADO", "ALTO"]
    clase = clase_profundidad(profundidad)

    return [
        {
            "pais": "Región sin identificar",
            "ciudades_afectadas": [],
            "muertes_estimadas": int(muertes * factor),
            "heridos_estimados": int(heridos * factor),
            "perdidas_monetarias_usd": int(perdidas * factor),
            "nivel_destruccion": niveles[nivel],
            "razonamiento": (
                f"Estimación por reglas con magnitud {_num(magnitud, 1)} y {_num(profundidad, 0)} km de profundidad ({clase}). "
                f"La profundidad atenúa el efecto en superficie (x{_num(factor, 2)}). No hay modelo de IA disponible, "
                "así que no se conoce el país ni su contexto."
            ),
            "factores_considerados": [
                f"Magnitud {_num(magnitud, 1)}",
                f"Profundidad {_num(profundidad, 0)} km ({clase})",
                f"Atenuación por profundidad x{_num(factor, 2)}",
                "Cálculo por reglas",
            ],
            "fuentes_inferidas": [MARCA_FUENTE],
            "nivel_preparacion_sismica": "Media",
            "densidad_poblacional": "Media",
        }
    ]
