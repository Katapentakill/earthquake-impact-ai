"""El registro de sismos que se están estimando (para mostrar la rueda de carga)."""
from app.services import estimando


def setup_function():
    for event_id in estimando.en_curso():
        estimando.liberar(event_id)


def test_un_sismo_marcado_esta_estimandose_hasta_que_se_libera():
    assert not estimando.esta_estimando("us1")
    estimando.marcar("us1")
    assert estimando.esta_estimando("us1")
    estimando.liberar("us1")
    assert not estimando.esta_estimando("us1")


def test_liberar_un_sismo_que_no_estaba_no_falla():
    estimando.liberar("nunca-marcado")
    assert estimando.en_curso() == frozenset()


def test_marcar_dos_veces_cuenta_una_sola_vez_y_hay_varios_a_la_vez():
    estimando.marcar("us1")
    estimando.marcar("us1")
    estimando.marcar("us2")
    assert estimando.en_curso() == frozenset({"us1", "us2"})
    estimando.liberar("us1")
    assert estimando.en_curso() == frozenset({"us2"})
