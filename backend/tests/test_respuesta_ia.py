"""La lectura de la respuesta del modelo de IA debe tolerar lo que los modelos devuelven de verdad."""
import json

from app.services.respuesta_ia import (
    corregir_ceros,
    extraer_lista_json,
    parsear_respuesta,
    tiene_token,
    validar_impacto,
)


def impacto(**cambios):
    base = {
        "pais": "Vanuatu",
        "ciudades_afectadas": ["Port Vila"],
        "muertes_estimadas": 15,
        "heridos_estimados": 120,
        "perdidas_monetarias_usd": 15_000_000,
        "nivel_destruccion": "MODERADO",
    }
    base.update(cambios)
    return base


# ───────── token ─────────

def test_tiene_token_rechaza_vacio_y_texto_de_ejemplo():
    assert not tiene_token("")
    assert not tiene_token("   ")
    assert not tiene_token(None)
    assert not tiene_token("hf_your_token_here")


def test_tiene_token_acepta_un_token():
    assert tiene_token("hf_abcdefghijklmnopqrstuvwxyz0123456789")


# ───────── extraer la lista JSON ─────────

def test_extrae_una_lista_limpia():
    assert extraer_lista_json(json.dumps([impacto()])) == [impacto()]


def test_extrae_entre_comillas_de_markdown_y_con_texto_alrededor():
    texto = "Claro, aquí está:\n```json\n" + json.dumps([impacto()]) + "\n```\nEspero que sirva."
    assert extraer_lista_json(texto) == [impacto()]


def test_repara_la_coma_sobrante_de_los_modelos_chicos():
    texto = '[{"pais": "Chile", "ciudades_afectadas": ["Santiago",], "muertes_estimadas": 1,}]'
    assert extraer_lista_json(texto) == [{"pais": "Chile", "ciudades_afectadas": ["Santiago"], "muertes_estimadas": 1}]


def test_sin_lista_o_con_json_roto_devuelve_none():
    assert extraer_lista_json("No puedo ayudar con eso.") is None
    assert extraer_lista_json('[{"pais": "Chile" "muertes": 1}]') is None


# ───────── validar un impacto ─────────

def test_un_impacto_completo_es_valido_y_recibe_los_valores_opcionales_en_espanol():
    i = impacto()
    assert validar_impacto(i)
    assert i["fuentes_inferidas"] == ["Análisis por IA"]
    assert i["factores_considerados"] == ["Análisis sísmico estándar"]


def test_falta_un_campo_obligatorio():
    i = impacto()
    del i["heridos_estimados"]
    assert not validar_impacto(i)


def test_las_cifras_escritas_como_texto_se_convierten_en_enteros():
    i = impacto(muertes_estimadas="15", heridos_estimados="1,200", perdidas_monetarias_usd="$75 000 000", ciudades_afectadas="Port Vila")
    assert validar_impacto(i)
    assert (i["muertes_estimadas"], i["heridos_estimados"], i["perdidas_monetarias_usd"]) == (15, 1200, 75_000_000)
    assert i["ciudades_afectadas"] == ["Port Vila"]


def test_una_cifra_que_no_es_un_numero_invalida_el_impacto():
    assert not validar_impacto(impacto(muertes_estimadas="muchas"))
    assert not validar_impacto(impacto(muertes_estimadas=-3))
    assert not validar_impacto(impacto(muertes_estimadas=None))


def test_el_nivel_se_normaliza_y_uno_desconocido_pasa_a_bajo():
    assert validar_impacto(i := impacto(nivel_destruccion="alto")) and i["nivel_destruccion"] == "ALTO"
    assert validar_impacto(i := impacto(nivel_destruccion="Extremo")) and i["nivel_destruccion"] == "BAJO"


def test_parsear_respuesta_descarta_solo_los_impactos_invalidos():
    malo = impacto()
    del malo["pais"]
    resultado = parsear_respuesta(json.dumps([impacto(pais="Chile"), malo, "texto suelto"]))
    assert [r["pais"] for r in resultado] == ["Chile"]


def test_parsear_respuesta_sin_json_devuelve_lista_vacia():
    assert parsear_respuesta("Lo siento, no puedo.") == []


# ───────── corrección de ceros ─────────

def ceros(**cambios):
    return impacto(muertes_estimadas=0, heridos_estimados=0, perdidas_monetarias_usd=0, **cambios)


def test_corrige_los_ceros_de_un_sismo_de_magnitud_6_o_mas():
    [i] = corregir_ceros([ceros()], magnitud=6.5, profundidad=40)
    assert i["muertes_estimadas"] > 0 and i["heridos_estimados"] > 0 and i["perdidas_monetarias_usd"] > 0
    assert "Corrección automática" in i["razonamiento"]
    assert "Corrección por magnitud" in i["fuentes_inferidas"]


def test_la_correccion_atenua_un_sismo_profundo():
    [superficial] = corregir_ceros([ceros()], magnitud=6.5, profundidad=10)
    [profundo] = corregir_ceros([ceros()], magnitud=6.5, profundidad=600)
    assert profundo["muertes_estimadas"] < superficial["muertes_estimadas"]


def test_no_toca_las_cifras_que_la_ia_si_dio():
    [i] = corregir_ceros([impacto()], magnitud=7.2, profundidad=10)
    assert (i["muertes_estimadas"], i["heridos_estimados"]) == (15, 120)
    assert "razonamiento" not in i


def test_ceros_en_un_sismo_chico_y_de_nivel_bajo_se_dejan_como_estan():
    [i] = corregir_ceros([ceros(nivel_destruccion="BAJO")], magnitud=4.8, profundidad=10)
    assert i["muertes_estimadas"] == 0 and i["heridos_estimados"] == 0
