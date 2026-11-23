"""La estimación por reglas debe atenuar con la profundidad (antes ignoraba casi por completo la profundidad)."""
import pytest

from app.services.respaldo import (
    MARCA_FUENTE,
    clase_profundidad,
    estimacion_respaldo,
    factor_profundidad,
)


@pytest.mark.parametrize(
    "km, clase",
    [(0, "superficial"), (10, "superficial"), (69.9, "superficial"), (70, "intermedia"), (300, "intermedia"), (300.1, "profunda"), (601, "profunda")],
)
def test_clase_de_profundidad(km, clase):
    assert clase_profundidad(km) == clase


def test_el_factor_baja_con_la_profundidad():
    assert factor_profundidad(10) == 1.0
    assert 0 < factor_profundidad(150) < 1.0
    assert 0 < factor_profundidad(600) < factor_profundidad(150)


def test_un_sismo_profundo_causa_mucho_menos_que_uno_superficial():
    superficial = estimacion_respaldo(6.5, 10)[0]
    profundo = estimacion_respaldo(6.5, 601)[0]
    assert superficial["muertes_estimadas"] == 150
    assert profundo["muertes_estimadas"] < superficial["muertes_estimadas"] / 10
    assert profundo["perdidas_monetarias_usd"] < superficial["perdidas_monetarias_usd"] / 10


def test_el_nivel_baja_si_el_sismo_no_es_superficial():
    assert estimacion_respaldo(6.5, 10)[0]["nivel_destruccion"] == "MODERADO"
    assert estimacion_respaldo(6.5, 601)[0]["nivel_destruccion"] == "BAJO"
    assert estimacion_respaldo(7.4, 20)[0]["nivel_destruccion"] == "ALTO"
    assert estimacion_respaldo(7.4, 150)[0]["nivel_destruccion"] == "MODERADO"


def test_un_sismo_chico_no_causa_muertes_y_el_nivel_es_bajo():
    e = estimacion_respaldo(4.7, 40)[0]
    assert e["muertes_estimadas"] == 0
    assert e["nivel_destruccion"] == "BAJO"


def test_tiene_las_claves_que_espera_el_procesador():
    e = estimacion_respaldo(5.4, 117.4)[0]
    for clave in ("pais", "ciudades_afectadas", "muertes_estimadas", "heridos_estimados", "perdidas_monetarias_usd",
                  "nivel_destruccion", "razonamiento", "factores_considerados", "fuentes_inferidas"):
        assert clave in e
    assert e["fuentes_inferidas"] == [MARCA_FUENTE]
    assert "intermedia" in e["razonamiento"]


def test_los_numeros_del_texto_usan_coma_decimal():
    e = estimacion_respaldo(5.4, 117.396)[0]
    assert "magnitud 5,4" in e["razonamiento"]
    assert "117 km" in e["razonamiento"]
    assert "x0,4" in e["razonamiento"]
    assert "Magnitud 5,4" in e["factores_considerados"]
    assert "Atenuación por profundidad x0,4" in e["factores_considerados"]
