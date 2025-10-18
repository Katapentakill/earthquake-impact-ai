from sqlalchemy import Column, Integer, String, DECIMAL, DateTime, Enum, ForeignKey, JSON, TIMESTAMP, Index, Text
from sqlalchemy.sql import func
from app.database import Base
import enum


class NivelDestruccion(str, enum.Enum):
    BAJO = "BAJO"
    MODERADO = "MODERADO"
    ALTO = "ALTO"
    CATASTROFICO = "CATASTROFICO"


class EventoSismico(Base):
    __tablename__ = "eventos_sismicos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(50), unique=True, nullable=False, index=True)
    magnitud = Column(DECIMAL(3, 1), nullable=False)
    profundidad = Column(DECIMAL(6, 2), nullable=False)
    latitud = Column(DECIMAL(9, 6), nullable=False)
    longitud = Column(DECIMAL(9, 6), nullable=False)
    fecha_utc = Column(DateTime, nullable=False, index=True)
    lugar = Column(String(255))
    radio_afectacion_km = Column(DECIMAL(8, 2))
    fuente_api = Column(String(50), default="USGS")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    __table_args__ = (
        Index('idx_magnitud', 'magnitud'),
    )


class ImpactoPais(Base):
    __tablename__ = "impactos_pais"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(50), ForeignKey('eventos_sismicos.event_id', ondelete='CASCADE'), nullable=False)
    pais = Column(String(100), nullable=False)
    ciudades_afectadas = Column(JSON)
    muertes_estimadas = Column(Integer, default=0)
    heridos_estimados = Column(Integer, default=0)
    perdidas_monetarias_usd = Column(Integer, default=0)  # Changed from BIGINT
    nivel_destruccion = Column(Enum(NivelDestruccion), default=NivelDestruccion.BAJO)
    fuentes_inferidas = Column(JSON)
    razonamiento_ia = Column(Text, nullable=True)  # NEW: AI reasoning explanation
    factores_considerados = Column(JSON, nullable=True)  # NEW: Factors considered by AI
    codigo_construccion = Column(String(255), nullable=True)  # NEW: Building code info
    nivel_preparacion_sismica = Column(String(50))
    densidad_poblacional = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

    __table_args__ = (
        Index('idx_event_pais', 'event_id', 'pais'),
        Index('idx_pais', 'pais'),
        Index('idx_nivel', 'nivel_destruccion'),
        Index('idx_fecha', 'created_at'),
    )


class CacheInferencia(Base):
    __tablename__ = "cache_inferencias"

    id = Column(Integer, primary_key=True, autoincrement=True)
    hash_consulta = Column(String(64), unique=True, nullable=False, index=True)
    respuesta_ia = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    expires_at = Column(TIMESTAMP, nullable=True, index=True)
