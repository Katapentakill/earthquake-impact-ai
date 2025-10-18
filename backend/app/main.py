from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
from app.config import settings
from app.database import AsyncSessionLocal
from app.routes import events, websocket
from app.services.seismic_processor import SeismicProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Background task control
background_task = None


async def polling_task():
    """
    Background task that polls USGS API for new earthquakes
    """
    logger.info("Starting earthquake polling task")
    processor = SeismicProcessor()

    while True:
        try:
            logger.info("Polling for new earthquakes...")

            async with AsyncSessionLocal() as db:
                processed_ids = await processor.process_new_earthquakes(db)

                if processed_ids:
                    logger.info(f"Processed {len(processed_ids)} new earthquakes")

                    # Notify WebSocket clients
                    for event_id in processed_ids:
                        event_data = await processor.get_event_with_impacts(db, event_id)
                        if event_data:
                            await websocket.notify_new_earthquake(event_data)
                else:
                    logger.info("No new earthquakes found")

        except Exception as e:
            logger.error(f"Error in polling task: {e}")

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
    """Health check endpoint"""
    return {
        "status": "healthy",
        "polling_active": background_task is not None and not background_task.done(),
    }
