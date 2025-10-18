import httpx
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class HuggingFaceInferenceClient:
    """
    Client for Hugging Face Chat Completion API
    Uses chat models to infer seismic impact
    """

    def __init__(self):
        self.api_token = settings.huggingface_api_token
        self.model = settings.huggingface_model or "Qwen/Qwen2.5-7B-Instruct"
        # New chat completion endpoint
        self.api_url = "https://router.huggingface.co/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    async def infer_impact(
        self,
        latitud: float,
        longitud: float,
        magnitud: float,
        profundidad: float,
        radio_km: float,
        lugar: str = "",
        historical_context: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Use AI to infer impact on countries and cities

        Args:
            historical_context: Optional dict with historical earthquake data from the region

        Returns:
            List of impact predictions per country
        """
        system_message = self._build_system_message()
        user_message = self._build_user_message(
            latitud, longitud, magnitud, profundidad, radio_km, lugar, historical_context
        )

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.api_url,
                    headers=self.headers,
                    json={
                        "model": self.model,
                        "messages": [
                            {"role": "system", "content": system_message},
                            {"role": "user", "content": user_message}
                        ],
                        "max_tokens": 2000,
                        "temperature": 0.3,
                        "top_p": 0.9,
                    },
                )

                if response.status_code == 503:
                    # Model is loading, wait and retry
                    logger.warning("Model is loading, retrying in 20 seconds...")
                    await asyncio.sleep(20)
                    return await self.infer_impact(latitud, longitud, magnitud, profundidad, radio_km, lugar)

                response.raise_for_status()
                result = response.json()

                # Extract generated text from chat completion response
                generated_text = result.get("choices", [{}])[0].get("message", {}).get("content", "")

                logger.info(f"Received response from HF API. Model: {result.get('model', 'unknown')}")
                logger.debug(f"Generated text: {generated_text[:200]}...")

                # Parse JSON from response
                parsed_impacts = self._parse_ai_response(generated_text)

                if not parsed_impacts:
                    logger.warning("AI returned empty or invalid response, using fallback")
                    return self._fallback_estimation(latitud, longitud, magnitud, profundidad, radio_km)

                # Apply post-processing to fix unrealistic estimates
                parsed_impacts = self._apply_magnitude_based_corrections(parsed_impacts, magnitud, profundidad)

                return parsed_impacts

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error calling Hugging Face API: {e.response.status_code} - {e.response.text}")
            return self._fallback_estimation(latitud, longitud, magnitud, profundidad, radio_km)
        except Exception as e:
            logger.error(f"Error calling Hugging Face API: {e}")
            # Return fallback estimation
            return self._fallback_estimation(latitud, longitud, magnitud, profundidad, radio_km)

    def _build_system_message(self) -> str:
        """Build system message for the AI"""
        return """You are an expert seismologist and disaster assessment specialist. Your task is to analyze earthquake data and provide impact predictions in JSON format.

You must respond ONLY with a valid JSON array, without any additional text or explanation."""

    def _build_user_message(
        self,
        latitud: float,
        longitud: float,
        magnitud: float,
        profundidad: float,
        radio_km: float,
        lugar: str,
    ) -> str:
        """Build user message with earthquake data"""
        return f"""Analyze this earthquake and provide REALISTIC impact assessment with numerical estimates:

Earthquake Data:
- Location: {lugar if lugar else 'Unknown'}
- Epicenter coordinates: Latitude {latitud}, Longitude {longitud}
- Magnitude: {magnitud}
- Depth: {profundidad} km
- Impact radius: {radio_km} km

Based on your knowledge of world geography, population density, and seismic preparedness, identify all countries and major cities within the impact radius.

IMPORTANT - Provide REALISTIC numerical estimates based on magnitude:
- Magnitude 4.0-4.9: 0 deaths, 10-100 injuries, $1-5 million damages, nivel_destruccion: "BAJO"
- Magnitude 5.0-5.9: 0-50 deaths, 100-500 injuries, $10-50 million damages, nivel_destruccion: "BAJO" or "MODERADO"
- Magnitude 6.0-6.9: 50-500 deaths, 500-3000 injuries, $100-500 million damages, nivel_destruccion: "MODERADO"
- Magnitude 7.0+: 500+ deaths, 3000+ injuries, $1+ billion damages, nivel_destruccion: "ALTO" or "CATASTROFICO"

Adjust based on: population density, building codes, depth (deeper = less damage), preparedness level.

Respond with a JSON array with this EXACT structure:
[
  {{
    "pais": "Country name",
    "ciudades_afectadas": ["City1", "City2"],
    "muertes_estimadas": 100,
    "heridos_estimados": 500,
    "perdidas_monetarias_usd": 200000000,
    "nivel_destruccion": "MODERADO",
    "fuentes_inferidas": ["Geographic proximity", "Population density"],
    "nivel_preparacion_sismica": "Alta",
    "densidad_poblacional": "Media"
  }}
]

Guidelines:
- nivel_destruccion: "BAJO", "MODERADO", "ALTO", or "CATASTROFICO"
- nivel_preparacion_sismica: "Alta", "Media", or "Baja"
- densidad_poblacional: "Alta", "Media", or "Baja"
- NEVER put 0 for all estimates if magnitude >= 6.0 or nivel_destruccion is MODERADO/ALTO/CATASTROFICO
- Consider: proximity to epicenter, depth, infrastructure, building codes
- Higher magnitude + shallow depth = more damage
- Coastal areas may face tsunami risk

Respond ONLY with the JSON array, no other text."""

    def _parse_ai_response(self, text: str) -> List[Dict[str, Any]]:
        """Parse JSON from AI response"""
        try:
            # Try to find JSON array in the response
            start_idx = text.find("[")
            end_idx = text.rfind("]") + 1

            if start_idx == -1 or end_idx == 0:
                logger.warning("No JSON array found in AI response")
                return []

            json_text = text[start_idx:end_idx]
            parsed = json.loads(json_text)

            # Validate structure
            if not isinstance(parsed, list):
                logger.warning("AI response is not a list")
                return []

            # Validate each impact entry
            validated = []
            for impact in parsed:
                if self._validate_impact_structure(impact):
                    validated.append(impact)

            logger.info(f"Successfully parsed {len(validated)} impact assessments from AI")
            return validated

        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {e}")
            logger.debug(f"Raw response: {text}")
            return []
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
            logger.debug(f"Raw response: {text}")
            return []

    def _validate_impact_structure(self, impact: Dict[str, Any]) -> bool:
        """Validate that impact has required fields"""
        required_fields = [
            "pais",
            "ciudades_afectadas",
            "muertes_estimadas",
            "heridos_estimados",
            "perdidas_monetarias_usd",
            "nivel_destruccion",
            "fuentes_inferidas",
        ]

        for field in required_fields:
            if field not in impact:
                logger.warning(f"Impact entry missing required field: {field}")
                return False

        # Validate nivel_destruccion values and normalize to uppercase
        valid_levels = ["BAJO", "MODERADO", "ALTO", "CATASTROFICO"]
        nivel = str(impact.get("nivel_destruccion", "")).upper()
        if nivel not in valid_levels:
            logger.warning(f"Invalid nivel_destruccion: {impact.get('nivel_destruccion')}, defaulting to BAJO")
            impact["nivel_destruccion"] = "BAJO"
        else:
            impact["nivel_destruccion"] = nivel

        # Ensure ciudades_afectadas is a list
        if not isinstance(impact.get("ciudades_afectadas"), list):
            impact["ciudades_afectadas"] = [str(impact.get("ciudades_afectadas", "Unknown"))]

        # Ensure fuentes_inferidas is a list
        if not isinstance(impact.get("fuentes_inferidas"), list):
            impact["fuentes_inferidas"] = [str(impact.get("fuentes_inferidas", "AI inference"))]

        return True

    def _apply_magnitude_based_corrections(
        self, impacts: List[Dict[str, Any]], magnitud: float, profundidad: float
    ) -> List[Dict[str, Any]]:
        """
        Apply intelligent corrections when AI gives unrealistic estimates
        (e.g., all zeros for a magnitude 6+ earthquake)
        """
        for impact in impacts:
            nivel = impact.get("nivel_destruccion", "BAJO")
            muertes = impact.get("muertes_estimadas", 0)
            heridos = impact.get("heridos_estimados", 0)
            perdidas = impact.get("perdidas_monetarias_usd", 0)

            # Check if estimates are unrealistically low
            all_zero = (muertes == 0 and heridos == 0 and perdidas == 0)
            magnitude_high = magnitud >= 6.0
            nivel_high = nivel in ["MODERADO", "ALTO", "CATASTROFICO"]

            if all_zero and (magnitude_high or nivel_high):
                logger.warning(
                    f"AI returned all zeros for magnitude {magnitud} with nivel {nivel}. Applying corrections."
                )

                # Calculate realistic minimum estimates based on magnitude
                if magnitud >= 7.0:
                    # High magnitude - significant damage expected
                    base_muertes = int(500 * (magnitud - 6))
                    base_heridos = base_muertes * 4
                    base_perdidas = int(1e9 * magnitud)  # Billions
                elif magnitud >= 6.0:
                    # Moderate magnitude - moderate damage
                    base_muertes = int(100 * (magnitud - 5))
                    base_heridos = base_muertes * 3
                    base_perdidas = int(1e8 * magnitud)  # Hundreds of millions
                elif magnitud >= 5.0:
                    # Lower magnitude - minor damage
                    base_muertes = 0 if magnitud < 5.5 else int(10 * (magnitud - 5))
                    base_heridos = int(50 * magnitud)
                    base_perdidas = int(1e7 * magnitud)  # Tens of millions
                else:
                    # Very low magnitude
                    base_muertes = 0
                    base_heridos = int(10 * magnitud)
                    base_perdidas = int(1e6 * magnitud)

                # Adjust for depth (deeper earthquakes cause less surface damage)
                depth_factor = 1.0
                if profundidad > 100:
                    depth_factor = 0.5  # Deep earthquakes - reduce estimates
                elif profundidad > 70:
                    depth_factor = 0.7
                elif profundidad < 30:
                    depth_factor = 1.3  # Shallow earthquakes - increase estimates

                # Adjust for preparedness (if available)
                prep_factor = 1.0
                preparacion = impact.get("nivel_preparacion_sismica", "Media")
                if preparacion == "Alta":
                    prep_factor = 0.6  # Good infrastructure reduces casualties
                elif preparacion == "Baja":
                    prep_factor = 1.5  # Poor infrastructure increases casualties

                # Adjust for population density
                dens_factor = 1.0
                densidad = impact.get("densidad_poblacional", "Media")
                if densidad == "Alta":
                    dens_factor = 1.5  # More people = more affected
                elif densidad == "Baja":
                    dens_factor = 0.5  # Fewer people = fewer affected

                # Apply all factors
                final_muertes = int(base_muertes * depth_factor * prep_factor * dens_factor)
                final_heridos = int(base_heridos * depth_factor * prep_factor * dens_factor)
                final_perdidas = int(base_perdidas * depth_factor * dens_factor)

                # Update the impact
                impact["muertes_estimadas"] = final_muertes
                impact["heridos_estimados"] = final_heridos
                impact["perdidas_monetarias_usd"] = final_perdidas

                # Add note about correction
                if "fuentes_inferidas" in impact:
                    if "Magnitude-based correction applied" not in impact["fuentes_inferidas"]:
                        impact["fuentes_inferidas"].append("Magnitude-based correction applied")

                logger.info(
                    f"Applied corrections: {final_muertes} deaths, {final_heridos} injuries, ${final_perdidas:,} damages"
                )

        return impacts

    def _fallback_estimation(
        self, latitud: float, longitud: float, magnitud: float, profundidad: float, radio_km: float
    ) -> List[Dict[str, Any]]:
        """Fallback estimation when AI fails"""
        logger.info("Using fallback estimation for earthquake impact")

        # Simple rule-based estimation
        if magnitud >= 7.0:
            nivel = "ALTO"
            muertes = int(1000 * (magnitud - 6))
            heridos = muertes * 5
            perdidas = int(1e9 * magnitud)
        elif magnitud >= 6.0:
            nivel = "MODERADO"
            muertes = int(100 * (magnitud - 5))
            heridos = muertes * 3
            perdidas = int(1e8 * magnitud)
        else:
            nivel = "BAJO"
            muertes = 0
            heridos = int(10 * magnitud)
            perdidas = int(1e6 * magnitud)

        return [
            {
                "pais": "Unknown Region",
                "ciudades_afectadas": ["Unknown"],
                "muertes_estimadas": muertes,
                "heridos_estimados": heridos,
                "perdidas_monetarias_usd": perdidas,
                "nivel_destruccion": nivel,
                "fuentes_inferidas": ["Fallback estimation based on magnitude"],
                "nivel_preparacion_sismica": "Media",
                "densidad_poblacional": "Media",
            }
        ]
