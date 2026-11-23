"""Qué sismos se están estimando en este momento.

Un sismo nuevo se guarda antes de pedirle la estimación a la IA (que puede tardar varios segundos) para que las
interfaces lo muestren enseguida con una rueda de carga; este registro dice cuáles siguen esperando su estimación.
Vive en la memoria del proceso, como la lista de conexiones del WebSocket: con varias réplicas del backend cada
una vería solo los suyos.
"""
from typing import FrozenSet, Set

_en_curso: Set[str] = set()


def marcar(event_id: str) -> None:
    """El sismo empezó a estimarse."""
    _en_curso.add(event_id)


def liberar(event_id: str) -> None:
    """El sismo terminó de estimarse (o falló): ya no se espera nada de él."""
    _en_curso.discard(event_id)


def esta_estimando(event_id: str) -> bool:
    return event_id in _en_curso


def en_curso() -> FrozenSet[str]:
    return frozenset(_en_curso)
