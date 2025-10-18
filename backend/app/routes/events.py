from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db
from app.models.seismic_event import EventoSismico, ImpactoPais, NivelDestruccion
from app.services.seismic_processor import SeismicProcessor

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/")
async def get_events(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    min_magnitude: Optional[float] = Query(None, ge=0, le=10),
    max_magnitude: Optional[float] = Query(None, ge=0, le=10),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Get list of seismic events with optional filters
    """
    query = select(EventoSismico).order_by(desc(EventoSismico.fecha_utc))

    # Apply filters
    filters = []
    if min_magnitude is not None:
        filters.append(EventoSismico.magnitud >= min_magnitude)
    if max_magnitude is not None:
        filters.append(EventoSismico.magnitud <= max_magnitude)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            filters.append(EventoSismico.fecha_utc >= start_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid start_date format")
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            filters.append(EventoSismico.fecha_utc <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid end_date format")

    if filters:
        query = query.where(and_(*filters))

    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    events = result.scalars().all()

    return {
        "total": len(events),
        "limit": limit,
        "offset": offset,
        "events": [
            {
                "event_id": event.event_id,
                "magnitud": float(event.magnitud),
                "profundidad": float(event.profundidad),
                "latitud": float(event.latitud),
                "longitud": float(event.longitud),
                "fecha_utc": event.fecha_utc.isoformat(),
                "lugar": event.lugar,
                "radio_afectacion_km": float(event.radio_afectacion_km) if event.radio_afectacion_km else None,
                "fuente_api": event.fuente_api,
            }
            for event in events
        ],
    }


@router.get("/{event_id}")
async def get_event_detail(
    event_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific event including all impact assessments
    """
    processor = SeismicProcessor()
    event_data = await processor.get_event_with_impacts(db, event_id)

    if not event_data:
        raise HTTPException(status_code=404, detail="Event not found")

    return event_data


@router.get("/country/{country_name}")
async def get_events_by_country(
    country_name: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all events that affected a specific country
    """
    # Get impacts for the country
    query = (
        select(ImpactoPais)
        .where(ImpactoPais.pais.ilike(f"%{country_name}%"))
        .order_by(desc(ImpactoPais.created_at))
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    impacts = result.scalars().all()

    # Get event IDs
    event_ids = [impact.event_id for impact in impacts]

    # Get events
    events_query = select(EventoSismico).where(EventoSismico.event_id.in_(event_ids))
    events_result = await db.execute(events_query)
    events = {event.event_id: event for event in events_result.scalars().all()}

    return {
        "country": country_name,
        "total": len(impacts),
        "results": [
            {
                "event": {
                    "event_id": impact.event_id,
                    "magnitud": float(events[impact.event_id].magnitud),
                    "fecha_utc": events[impact.event_id].fecha_utc.isoformat(),
                    "lugar": events[impact.event_id].lugar,
                },
                "impact": {
                    "ciudades_afectadas": impact.ciudades_afectadas,
                    "muertes_estimadas": impact.muertes_estimadas,
                    "heridos_estimados": impact.heridos_estimados,
                    "perdidas_monetarias_usd": impact.perdidas_monetarias_usd,
                    "nivel_destruccion": impact.nivel_destruccion.value,
                },
            }
            for impact in impacts
            if impact.event_id in events
        ],
    }


@router.get("/stats/summary")
async def get_statistics(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
):
    """
    Get statistical summary of recent seismic activity
    """
    start_date = datetime.utcnow() - timedelta(days=days)

    # Total events
    total_query = select(func.count(EventoSismico.id)).where(
        EventoSismico.fecha_utc >= start_date
    )
    total_result = await db.execute(total_query)
    total_events = total_result.scalar()

    # Average magnitude
    avg_mag_query = select(func.avg(EventoSismico.magnitud)).where(
        EventoSismico.fecha_utc >= start_date
    )
    avg_mag_result = await db.execute(avg_mag_query)
    avg_magnitude = avg_mag_result.scalar()

    # Highest magnitude
    max_mag_query = (
        select(EventoSismico)
        .where(EventoSismico.fecha_utc >= start_date)
        .order_by(desc(EventoSismico.magnitud))
        .limit(1)
    )
    max_mag_result = await db.execute(max_mag_query)
    highest_event = max_mag_result.scalar_one_or_none()

    # Total estimated casualties
    casualties_query = select(
        func.sum(ImpactoPais.muertes_estimadas),
        func.sum(ImpactoPais.heridos_estimados),
        func.sum(ImpactoPais.perdidas_monetarias_usd),
    ).join(EventoSismico, ImpactoPais.event_id == EventoSismico.event_id).where(
        EventoSismico.fecha_utc >= start_date
    )
    casualties_result = await db.execute(casualties_query)
    deaths, injuries, losses = casualties_result.one()

    # Most affected countries
    countries_query = (
        select(
            ImpactoPais.pais,
            func.count(ImpactoPais.id).label("event_count"),
            func.sum(ImpactoPais.muertes_estimadas).label("total_deaths"),
        )
        .join(EventoSismico, ImpactoPais.event_id == EventoSismico.event_id)
        .where(EventoSismico.fecha_utc >= start_date)
        .group_by(ImpactoPais.pais)
        .order_by(desc("total_deaths"))
        .limit(10)
    )
    countries_result = await db.execute(countries_query)
    affected_countries = [
        {"country": row[0], "event_count": row[1], "total_deaths": row[2]}
        for row in countries_result.all()
    ]

    return {
        "period_days": days,
        "total_events": total_events,
        "average_magnitude": float(avg_magnitude) if avg_magnitude else 0,
        "highest_magnitude_event": {
            "event_id": highest_event.event_id,
            "magnitud": float(highest_event.magnitud),
            "lugar": highest_event.lugar,
            "fecha_utc": highest_event.fecha_utc.isoformat(),
        }
        if highest_event
        else None,
        "estimated_casualties": {
            "deaths": deaths or 0,
            "injuries": injuries or 0,
            "economic_losses_usd": losses or 0,
        },
        "most_affected_countries": affected_countries,
    }


@router.post("/process")
async def trigger_processing(
    db: AsyncSession = Depends(get_db),
):
    """
    Manually trigger processing of new earthquakes from USGS
    """
    processor = SeismicProcessor()
    processed_ids = await processor.process_new_earthquakes(db)

    return {
        "message": "Processing completed",
        "processed_count": len(processed_ids),
        "event_ids": processed_ids,
    }
