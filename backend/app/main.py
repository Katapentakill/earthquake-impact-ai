from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from app.config import settings
from app.database import AsyncSessionLocal
from app.routes import events, websocket
from app.services.seismic_processor import SeismicProcessor

# Create logs directory if it doesn't exist
log_dir = Path("/app/logs")
log_dir.mkdir(exist_ok=True)

# Configure logging with both console and file
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler(f"/app/logs/seismic_system_{datetime.now().strftime('%Y-%m-%d')}.log")  # File output
    ]
)
logger = logging.getLogger(__name__)

# Background task control
background_task = None


async def polling_task():
    """
    Background task that polls USGS API for new earthquakes
    Logs every poll attempt with detailed information
    """
    logger.info("=" * 80)
    logger.info("🌍 EARTHQUAKE POLLING TASK STARTED")
    logger.info(f"   Polling interval: {settings.polling_interval_seconds} seconds")
    logger.info(f"   Minimum magnitude threshold: {settings.min_magnitude_threshold}")
    logger.info(f"   USGS API: {settings.usgs_api_url}")
    logger.info("=" * 80)

    processor = SeismicProcessor()
    poll_count = 0

    while True:
        poll_count += 1
        poll_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        try:
            logger.info("")
            logger.info("-" * 80)
            logger.info(f"📡 POLL #{poll_count} - {poll_time}")
            logger.info(f"   Querying USGS API for new earthquakes (mag >= {settings.min_magnitude_threshold})...")

            async with AsyncSessionLocal() as db:
                start_time = datetime.now()
                processed_ids = await processor.process_new_earthquakes(db)
                elapsed_time = (datetime.now() - start_time).total_seconds()

                if processed_ids:
                    logger.info(f"   ✅ SUCCESS: Processed {len(processed_ids)} new earthquake(s) in {elapsed_time:.2f}s")

                    # Log details for each processed event
                    for idx, event_id in enumerate(processed_ids, 1):
                        event_data = await processor.get_event_with_impacts(db, event_id)
                        if event_data:
                            mag = event_data.get('magnitud', 'N/A')
                            lugar = event_data.get('lugar', 'Unknown location')
                            logger.info(f"      [{idx}] Event: {event_id} | Magnitude: {mag} | Location: {lugar}")

                            # Notify WebSocket clients
                            await websocket.notify_new_earthquake(event_data)
                            logger.info(f"      [{idx}] WebSocket notification sent")
                else:
                    logger.info(f"   ℹ️  No new earthquakes found in {elapsed_time:.2f}s")

            logger.info(f"   Next poll in {settings.polling_interval_seconds} seconds")
            logger.info("-" * 80)

        except Exception as e:
            logger.error(f"   ❌ ERROR in polling task: {e}", exc_info=True)
            logger.info(f"   Retrying in {settings.polling_interval_seconds} seconds...")
            logger.info("-" * 80)

        # Wait before next poll
        await asyncio.sleep(settings.polling_interval_seconds)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info("Starting Seismic Monitoring System")
    logger.info(f"Polling interval: {settings.polling_interval_seconds} seconds")

    # Start background polling task
    global background_task
    background_task = asyncio.create_task(polling_task())

    yield

    # Shutdown
    logger.info("Shutting down Seismic Monitoring System")
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            logger.info("Background task cancelled successfully")


# Create FastAPI app
app = FastAPI(
    title="Seismic Monitoring System",
    description="Global earthquake evaluation and impact assessment system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(events.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Seismic Monitoring System API",
        "version": "1.0.0",
        "endpoints": {
            "events": "/api/events",
            "websocket": "/ws",
            "docs": "/docs",
        },
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint
    Returns polling status and system information
    """
    polling_active = background_task is not None and not background_task.done()

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "polling": {
            "active": polling_active,
            "interval_seconds": settings.polling_interval_seconds,
            "min_magnitude": settings.min_magnitude_threshold,
        },
        "database": {
            "host": settings.mariadb_host,
            "database": settings.mariadb_database,
        },
        "api": {
            "usgs": settings.usgs_api_url,
        }
    }

@app.get("/polling-status")
async def polling_status():
    """
    Detailed polling status endpoint
    Shows if polling task is running and when next poll will occur
    """
    polling_active = background_task is not None and not background_task.done()

    return {
        "polling_active": polling_active,
        "message": "✅ Polling is ACTIVE and running" if polling_active else "❌ Polling is NOT running",
        "polling_interval_seconds": settings.polling_interval_seconds,
        "description": f"USGS API is checked every {settings.polling_interval_seconds} seconds for new earthquakes with magnitude >= {settings.min_magnitude_threshold}",
        "log_file": f"/app/logs/seismic_system_{datetime.now().strftime('%Y-%m-%d')}.log"
    }
