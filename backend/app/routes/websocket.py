from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections for real-time updates"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to client: {e}")
                disconnected.append(connection)

        # Remove disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time earthquake updates
    """
    await manager.connect(websocket)

    try:
        # Send welcome message
        await manager.send_personal_message(
            {
                "type": "connection",
                "message": "Connected to seismic monitoring system",
                "timestamp": asyncio.get_event_loop().time(),
            },
            websocket,
        )

        # Keep connection alive and listen for messages
        while True:
            data = await websocket.receive_text()

            # Handle ping/pong
            if data == "ping":
                await manager.send_personal_message({"type": "pong"}, websocket)
            else:
                # Echo back for testing
                await manager.send_personal_message(
                    {"type": "echo", "data": data}, websocket
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


async def notify_new_earthquake(event_data: dict):
    """
    Notify all connected clients about a new earthquake

    Call this function when a new earthquake is processed
    """
    message = {
        "type": "new_earthquake",
        "data": event_data,
        "timestamp": asyncio.get_event_loop().time(),
    }
    await manager.broadcast(message)
