import httpx
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class USGSService:
    """
    Service to fetch earthquake data from USGS API
    """

    def __init__(self):
        self.api_url = settings.usgs_api_url
        self.min_magnitude = settings.min_magnitude_threshold

    async def fetch_recent_earthquakes(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        min_magnitude: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch recent earthquakes from USGS

        Args:
            start_time: Start time for query (default: last 24 hours)
            end_time: End time for query (default: now)
            min_magnitude: Minimum magnitude filter

        Returns:
            List of earthquake events
        """
        if start_time is None:
            start_time = datetime.utcnow() - timedelta(hours=24)

        if end_time is None:
            end_time = datetime.utcnow()

        if min_magnitude is None:
            min_magnitude = self.min_magnitude

        params = {
            "format": "geojson",
            "starttime": start_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "endtime": end_time.strftime("%Y-%m-%dT%H:%M:%S"),
            "minmagnitude": min_magnitude,
            "orderby": "time",
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(self.api_url, params=params)
                response.raise_for_status()
                data = response.json()

                earthquakes = []
                for feature in data.get("features", []):
                    earthquake = self._parse_earthquake_feature(feature)
                    if earthquake:
                        earthquakes.append(earthquake)

                logger.info(f"Fetched {len(earthquakes)} earthquakes from USGS")
                return earthquakes

        except Exception as e:
            logger.error(f"Error fetching earthquakes from USGS: {e}")
            return []

    def _parse_earthquake_feature(self, feature: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse USGS GeoJSON feature into standardized format

        USGS format reference:
        https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
        """
        try:
            properties = feature.get("properties", {})
            geometry = feature.get("geometry", {})
            coordinates = geometry.get("coordinates", [])

            if len(coordinates) < 3:
                return None

            # Extract data
            event_id = feature.get("id", "")
            magnitude = properties.get("mag")
            place = properties.get("place", "")
            time_ms = properties.get("time")

            # Coordinates: [longitude, latitude, depth]
            longitude = coordinates[0]
            latitude = coordinates[1]
            depth = coordinates[2]  # Depth in km

            if magnitude is None or longitude is None or latitude is None:
                return None

            # Convert time from milliseconds to datetime
            fecha_utc = datetime.utcfromtimestamp(time_ms / 1000)

            return {
                "event_id": event_id,
                "magnitud": float(magnitude),
                "profundidad": float(depth),
                "latitud": float(latitude),
                "longitud": float(longitude),
                "fecha_utc": fecha_utc,
                "lugar": place,
                "fuente_api": "USGS",
            }

        except Exception as e:
            logger.error(f"Error parsing earthquake feature: {e}")
            return None

    async def fetch_single_earthquake(self, event_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch details for a specific earthquake by ID
        """
        url = f"https://earthquake.usgs.gov/fdsnws/event/1/query"
        params = {
            "format": "geojson",
            "eventid": event_id,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                features = data.get("features", [])
                if features:
                    return self._parse_earthquake_feature(features[0])

                return None

        except Exception as e:
            logger.error(f"Error fetching earthquake {event_id}: {e}")
            return None
