import logging
from typing import Any, Awaitable, Callable, Dict, List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.seismic_event import EventoSismico, ImpactoPais
from app.services import estimando
from app.services.radius_calculator import RadiusCalculator
from app.services.usgs_service import USGSService
from app.inference.huggingface_client import HuggingFaceInferenceClient

logger = logging.getLogger(__name__)


class SeismicProcessor:
    """
    Main processor for seismic events
    Orchestrates the entire pipeline from ingestion to impact assessment
    """

    def __init__(self):
        self.usgs_service = USGSService()
        self.radius_calculator = RadiusCalculator()
        self.ai_client = HuggingFaceInferenceClient()

    async def process_new_earthquakes(
        self,
        db: AsyncSession,
        notificar: Optional[Callable[[str], Awaitable[None]]] = None,
    ) -> List[str]:
        """
        Consulta al USGS y procesa los sismos nuevos.

        `notificar(event_id)` se llama dos veces por sismo: cuando queda guardado (todavía sin estimación, así que las
        interfaces lo muestran con una rueda de carga) y cuando la estimación está lista.

        Returns:
            Lista de IDs de los sismos procesados
        """
        earthquakes = await self.usgs_service.fetch_recent_earthquakes()

        processed_ids = []

        for eq_data in earthquakes:
            try:
                existing = await self._get_event_by_id(db, eq_data["event_id"])
                if existing and await self._tiene_impactos(db, eq_data["event_id"]):
                    logger.info(f"Event {eq_data['event_id']} already processed, skipping")
                    continue
                if existing:
                    # Quedó guardado sin estimación (por ejemplo, el servidor se reinició a la mitad): se completa.
                    logger.info(f"Event {eq_data['event_id']} was saved without an estimate: completing it")

                event_id = await self.process_single_earthquake(db, eq_data, notificar, existing)
                if event_id:
                    processed_ids.append(event_id)

            except Exception as e:
                logger.error(f"Error processing earthquake {eq_data.get('event_id')}: {e}")
                continue

        return processed_ids

    async def process_single_earthquake(
        self,
        db: AsyncSession,
        eq_data: Dict[str, Any],
        notificar: Optional[Callable[[str], Awaitable[None]]] = None,
        existente: Optional[EventoSismico] = None,
    ) -> Optional[str]:
        """
        Procesa un sismo por todo el camino:
        1. Calcula el radio afectado
        2. Guarda el sismo (ya se puede ver, con la marca «estimando»)
        3. Le pide la estimación a la IA (o a las reglas) y guarda los impactos

        Returns:
            El ID del sismo si salió bien, None si no
        """
        event_id = eq_data["event_id"]
        try:
            radio_km = self.radius_calculator.calculate_radius(
                eq_data["magnitud"],
                eq_data["profundidad"]
            )

            eq_data["radio_afectacion_km"] = radio_km

            logger.info(
                f"Processing earthquake {event_id}: "
                f"Mag {eq_data['magnitud']}, Depth {eq_data['profundidad']}km, "
                f"Radius {radio_km}km"
            )

            # Primero se marca y se guarda: la IA puede tardar, y mientras tanto las interfaces
            # ven el sismo con su rueda de carga en lugar de no ver nada.
            estimando.marcar(event_id)
            if existente is None:
                db.add(EventoSismico(**eq_data))
                await db.commit()
            await self._avisar(notificar, event_id)

            impacts = await self.ai_client.infer_impact(
                latitud=eq_data["latitud"],
                longitud=eq_data["longitud"],
                magnitud=eq_data["magnitud"],
                profundidad=eq_data["profundidad"],
                radio_km=radio_km,
                lugar=eq_data.get("lugar", ""),
            )

            for impact_data in impacts:
                impacto = ImpactoPais(
                    event_id=event_id,
                    pais=impact_data["pais"],
                    ciudades_afectadas=impact_data.get("ciudades_afectadas", []),
                    muertes_estimadas=impact_data.get("muertes_estimadas", 0),
                    heridos_estimados=impact_data.get("heridos_estimados", 0),
                    perdidas_monetarias_usd=impact_data.get("perdidas_monetarias_usd", 0),
                    nivel_destruccion=impact_data.get("nivel_destruccion", "Bajo"),
                    fuentes_inferidas=impact_data.get("fuentes_inferidas", []),
                    razonamiento_ia=impact_data.get("razonamiento"),
                    factores_considerados=impact_data.get("factores_considerados"),
                    codigo_construccion=impact_data.get("codigo_construccion"),
                    nivel_preparacion_sismica=impact_data.get("nivel_preparacion_sismica", "Media"),
                    densidad_poblacional=impact_data.get("densidad_poblacional", "Media"),
                )
                db.add(impacto)

            await db.commit()
            estimando.liberar(event_id)
            await self._avisar(notificar, event_id)

            logger.info(
                f"Successfully processed earthquake {event_id} "
                f"with {len(impacts)} impact assessments"
            )

            return event_id

        except Exception as e:
            # El sismo (si llegó a guardarse) queda sin estimación y se completa en la consulta siguiente.
            await db.rollback()
            logger.error(f"Error in process_single_earthquake: {e}")
            return None
        finally:
            estimando.liberar(event_id)

    async def _avisar(self, notificar: Optional[Callable[[str], Awaitable[None]]], event_id: str) -> None:
        """Avisa a quien escucha (el WebSocket); un fallo al avisar no debe frenar el procesamiento."""
        if notificar is None:
            return
        try:
            await notificar(event_id)
        except Exception as e:
            logger.warning(f"No se pudo avisar del sismo {event_id}: {e}")

    async def _tiene_impactos(self, db: AsyncSession, event_id: str) -> bool:
        result = await db.execute(
            select(ImpactoPais.event_id).where(ImpactoPais.event_id == event_id).limit(1)
        )
        return result.first() is not None

    async def _get_event_by_id(self, db: AsyncSession, event_id: str) -> Optional[EventoSismico]:
        """Get event by ID from database"""
        result = await db.execute(
            select(EventoSismico).where(EventoSismico.event_id == event_id)
        )
        return result.scalar_one_or_none()

    async def get_event_with_impacts(
        self,
        db: AsyncSession,
        event_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get complete event data with all impact assessments
        """
        # Get event
        event = await self._get_event_by_id(db, event_id)
        if not event:
            return None

        # Get impacts
        result = await db.execute(
            select(ImpactoPais).where(ImpactoPais.event_id == event_id)
        )
        impacts = result.scalars().all()

        return {
            "event": {
                "event_id": event.event_id,
                "magnitud": float(event.magnitud),
                "profundidad": float(event.profundidad),
                "latitud": float(event.latitud),
                "longitud": float(event.longitud),
                "fecha_utc": event.fecha_utc.isoformat(),
                "lugar": event.lugar,
                "radio_afectacion_km": float(event.radio_afectacion_km) if event.radio_afectacion_km else None,
                "fuente_api": event.fuente_api,
                "estimando": estimando.esta_estimando(event.event_id),
            },
            "impacts": [
                {
                    "pais": impact.pais,
                    "ciudades_afectadas": impact.ciudades_afectadas,
                    "muertes_estimadas": impact.muertes_estimadas,
                    "heridos_estimados": impact.heridos_estimados,
                    "perdidas_monetarias_usd": impact.perdidas_monetarias_usd,
                    # Recién guardado, el nivel puede seguir en memoria como texto y no como la enumeración.
                    "nivel_destruccion": getattr(impact.nivel_destruccion, "value", impact.nivel_destruccion),
                    "fuentes_inferidas": impact.fuentes_inferidas,
                    "razonamiento_ia": impact.razonamiento_ia,  # NEW: AI reasoning
                    "factores_considerados": impact.factores_considerados,  # NEW: Factors considered
                    "codigo_construccion": impact.codigo_construccion,  # NEW: Building code
                    "nivel_preparacion_sismica": impact.nivel_preparacion_sismica,
                    "densidad_poblacional": impact.densidad_poblacional,
                }
                for impact in impacts
            ],
        }
