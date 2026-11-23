from enum import Enum
from types import SimpleNamespace as NS

from app.services.resumen import resumen_impactos
from app.services.respaldo import MARCA_FUENTE


class Nivel(str, Enum):
    BAJO = "BAJO"
    ALTO = "ALTO"
    CATASTROFICO = "CATASTROFICO"


def impacto(nivel="BAJO", muertes=0, heridos=0, perdidas=0, fuentes=None):
    return NS(nivel_destruccion=nivel, muertes_estimadas=muertes, heridos_estimados=heridos,
              perdidas_monetarias_usd=perdidas, fuentes_inferidas=fuentes or [])


def test_sin_impactos_todo_es_nulo():
    r = resumen_impactos([])
    assert r["nivel_destruccion"] is None and r["estimacion"] is None and r["muertes_estimadas"] is None


def test_toma_el_nivel_mas_alto_y_suma():
    r = resumen_impactos([impacto("BAJO", 1, 2, 10), impacto("ALTO", 5, 6, 20), impacto("MODERADO", 0, 0, 0)])
    assert r["nivel_destruccion"] == "ALTO"
    assert (r["muertes_estimadas"], r["heridos_estimados"], r["perdidas_monetarias_usd"]) == (6, 8, 30)


def test_acepta_el_enum_del_orm():
    assert resumen_impactos([impacto(Nivel.CATASTROFICO)])["nivel_destruccion"] == "CATASTROFICO"


def test_reconoce_la_estimacion_por_reglas_nueva_y_la_antigua():
    assert resumen_impactos([impacto(fuentes=[MARCA_FUENTE])])["estimacion"] == "reglas"
    assert resumen_impactos([impacto(fuentes=["Fallback estimation - AI unavailable"])])["estimacion"] == "reglas"


def test_si_alguno_viene_de_la_ia_se_marca_como_ia():
    r = resumen_impactos([impacto(fuentes=[MARCA_FUENTE]), impacto(fuentes=["USGS PAGER"])])
    assert r["estimacion"] == "ia"


def test_valores_desconocidos_cuentan_como_bajo():
    assert resumen_impactos([impacto("RARO")])["nivel_destruccion"] == "BAJO"
