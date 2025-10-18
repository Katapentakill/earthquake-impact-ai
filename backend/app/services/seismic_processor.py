import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.seismic_event import EventoSismico, ImpactoPais
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

    async def process_new_earthquakes(self, db: AsyncSession) -> List[str]:
        """
        Fetch and process new earthquakes from USGS

        Returns:
            List of processed event IDs
        """
        # Fetch recent earthquakes
        earthquakes = await self.usgs_service.fetch_recent_earthquakes()

        processed_ids = []

        for eq_data in earthquakes:
            try:
                # Check if event already exists
                existing = await self._get_event_by_id(db, eq_data["event_id"])
                if existing:
                    logger.info(f"Event {eq_data['event_id']} already processed, skipping")
                    continue

                # Process the earthquake
                event_id = await self.process_single_earthquake(db, eq_data)
                if event_id:
                    processed_ids.append(event_id)

            except Exception as e:
                logger.error(f"Error processing earthquake {eq_data.get('event_id')}: {e}")
                continue

        return processed_ids

    async def process_single_earthquake(
        self,
        db: AsyncSession,
        eq_data: Dict[str, Any]
    ) -> Optional[str]:
        """
        Process a single earthquake event through the complete pipeline

        Pipeline:
        1. Calculate impact radius
        2. Use AI to infer affected countries and impact
        3. Save to database

        Returns:
            Event ID if successful, None otherwise
        """
        try:
            # Step 1: Calculate radius
            radio_km = self.radius_calculator.calculate_radius(
                eq_data["magnitud"],
                eq_data["profundidad"]
            )

            eq_data["radio_afectacion_km"] = radio_km

            logger.info(
                f"Processing earthquake {eq_data['event_id']}: "
                f"Mag {eq_data['magnitud']}, Depth {eq_data['profundidad']}km, "
                f"Radius {radio_km}km"
            )

            # Step 2: Create event record
            evento = EventoSismico(**eq_data)
            db.add(evento)
            await db.flush()  # Get the ID without committing

            # Step 3: Use AI to infer impact
            impacts = await self.ai_client.infer_impact(
                latitud=eq_data["latitud"],
                longitud=eq_data["longitud"],
                magnitud=eq_data["magnitud"],
                profundidad=eq_data["profundidad"],
                radio_km=radio_km,
                lugar=eq_data.get("lugar", ""),
            )

            # Step 4: Save impact assessments
            for impact_data in impacts:
                impacto = ImpactoPais(
                    event_id=eq_data["event_id"],
                    pais=impact_data["pais"],
                    ciudades_afectadas=impact_data.get("ciudades_afectadas", []),
                    muertes_estimadas=impact_data.get("muertes_estimadas", 0),
                    heridos_estimados=impact_data.get("heridos_estimados", 0),
                    perdidas_monetarias_usd=impact_data.get("perdidas_monetarias_usd", 0),
                    nivel_destruccion=impact_data.get("nivel_destruccion", "Bajo"),
                    fuentes_inferidas=impact_data.get("fuentes_inferidas", []),
                    razonamiento_ia=impact_data.get("razonamiento"),  # NEW: AI reasoning
                    factores_considerados=impact_data.get("factores_considerados"),  # NEW: Factors considered
                    codigo_construccion=impact_data.get("codigo_construccion"),  # NEW: Building code
                    nivel_preparacion_sismica=impact_data.get("nivel_preparacion_sismica", "Media"),
                    densidad_poblacional=impact_data.get("densidad_poblacional", "Media"),
                )
                db.add(impacto)

            await db.commit()

            logger.info(
                f"Successfully processed earthquake {eq_data['event_id']} "
                f"with {len(impacts)} impact assessments"
            )

            return eq_data["event_id"]

        except Exception as e:
            await db.rollback()
            logger.error(f"Error in process_single_earthquake: {e}")
            return None

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
            },
            "impacts": [
                {
                    "pais": impact.pais,
                    "ciudades_afectadas": impact.ciudades_afectadas,
                    "muertes_estimadas": impact.muertes_estimadas,
                    "heridos_estimados": impact.heridos_estimados,
                    "perdidas_monetarias_usd": impact.perdidas_monetarias_usd,
                    "nivel_destruccion": impact.nivel_destruccion.value,
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
