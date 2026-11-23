import asyncio
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.services.respaldo import estimacion_respaldo
from app.services.respuesta_ia import corregir_ceros, parsear_respuesta, tiene_token

logger = logging.getLogger(__name__)

# Si el modelo está cargándose (503) se espera y se reintenta, pero no para siempre.
MAX_INTENTOS = 3
ESPERA_503_SEGUNDOS = 20
# Los modelos a veces devuelven un JSON que no se puede leer (por ejemplo, comillas dobles sin escapar dentro de un
# texto): se vuelve a pedir, hasta 3 veces en total, antes de caer a las reglas. Tardar más no importa; una estimación
# por reglas cuando la IA sí puede darla, sí.
MAX_INTENTOS_RESPUESTA = 3


class HuggingFaceInferenceClient:
    """Cliente de la API de chat de Hugging Face (Inference Providers, compatible con OpenAI).

    Le pide a un modelo de lenguaje el impacto de un sismo por país, con su razonamiento. Si no hay token o algo falla,
    usa la estimación por reglas de app/services/respaldo.py. La lectura de la respuesta está en app/services/respuesta_ia.py.
    """

    def __init__(self):
        self.api_token = settings.huggingface_api_token
        self.model = settings.huggingface_model  # su valor por defecto está en app/config.py
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
        """Pide a la IA el impacto por país. Si no hay token, o la llamada falla, o la respuesta no sirve,
        devuelve la estimación por reglas (app/services/respaldo.py): esta función nunca lanza una excepción.

        Args:
            historical_context: datos históricos opcionales de la región.

        Returns:
            Lista de impactos, uno por país (el de respaldo trae uno solo, con país «Región sin identificar»).
        """
        if not tiene_token(self.api_token):
            logger.info("Sin token de Hugging Face: se usa la estimación por reglas")
            return self._fallback_estimation(latitud, longitud, magnitud, profundidad, radio_km)

        solicitud = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": self._build_system_message()},
                {"role": "user", "content": self._build_user_message(
                    latitud, longitud, magnitud, profundidad, radio_km, lugar, historical_context
                )},
            ],
            "max_tokens": 2500,
            "temperature": 0.3,
            "top_p": 0.9,
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                for intento in range(1, MAX_INTENTOS_RESPUESTA + 1):
                    result = await self._llamar(client, solicitud)
                    texto = result.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
                    logger.info(f"Respuesta de Hugging Face. Modelo: {result.get('model', 'desconocido')}")

                    impactos = parsear_respuesta(texto)
                    if impactos:
                        return corregir_ceros(impactos, magnitud, profundidad)
                    logger.warning(f"La IA devolvió una respuesta que no se pudo leer (intento {intento}/{MAX_INTENTOS_RESPUESTA})")

                logger.warning("La IA no dio una respuesta válida: se usa la estimación por reglas")

        except httpx.HTTPStatusError as e:
            logger.error(f"Error HTTP de Hugging Face: {e.response.status_code} - {e.response.text}")
        except Exception as e:
            logger.error(f"Error al llamar a Hugging Face: {e}")
        return self._fallback_estimation(latitud, longitud, magnitud, profundidad, radio_km)

    async def _llamar(self, client: httpx.AsyncClient, solicitud: Dict[str, Any]) -> Dict[str, Any]:
        """Una llamada a la API; si el modelo se está cargando (503) espera y reintenta hasta MAX_INTENTOS veces."""
        for intento in range(1, MAX_INTENTOS + 1):
            response = await client.post(self.api_url, headers=self.headers, json=solicitud)
            if response.status_code == 503 and intento < MAX_INTENTOS:
                logger.warning(f"El modelo se está cargando; se reintenta en {ESPERA_503_SEGUNDOS} s ({intento}/{MAX_INTENTOS})")
                await asyncio.sleep(ESPERA_503_SEGUNDOS)
                continue
            break
        response.raise_for_status()
        return response.json()

    def _build_system_message(self) -> str:
        """Build system message for the AI"""
        return """You are an expert seismologist and disaster impact assessment specialist with deep knowledge of:
- Global seismic codes and building standards
- Historical earthquake impacts worldwide
- Population density and urban planning
- Infrastructure quality by country/region

Your task is to analyze earthquake data with REAL-WORLD context and provide detailed, realistic impact assessments with EXPLICIT REASONING.

You must respond ONLY with a valid JSON array. The JSON keys stay as specified, but every free-text value
(razonamiento, factores_considerados, codigo_construccion, fuentes_inferidas) must be written in SPANISH, because the
interface that shows it is in Spanish."""

    def _build_user_message(
        self,
        latitud: float,
        longitud: float,
        magnitud: float,
        profundidad: float,
        radio_km: float,
        lugar: str,
        historical_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build user message with earthquake data - AI uses its own knowledge"""

        # Build comprehensive prompt WITHOUT hardcoded data
        # Let the AI use its trained knowledge about all 200+ countries
        prompt = f"""## EARTHQUAKE TO ANALYZE:

**Location**: {lugar if lugar else 'Unknown'}
**Coordinates**: Latitude {latitud}, Longitude {longitud}
**Magnitude**: {magnitud}
**Depth**: {profundidad} km
**Impact Radius**: {radio_km} km

## YOUR TASK (use YOUR knowledge of global seismology):
1. Identify ALL countries and major cities within {radio_km}km radius
2. For EACH affected country, provide:
   - Realistic casualty estimates (deaths, injuries)
   - Economic damage estimates (USD)
   - Destruction level assessment
   - **DETAILED REASONING** explaining your estimates

## MAGNITUDE REFERENCE (use as baseline, then adjust):
- **Mag 4.0-4.9**: Minor damage, 0 deaths, 10-100 injuries, $1-5M damages → "BAJO"
- **Mag 5.0-5.9**: Light damage, 0-50 deaths, 100-500 injuries, $10-50M → "BAJO" or "MODERADO"
- **Mag 6.0-6.9**: Moderate damage, 50-500 deaths, 500-3000 injuries, $100-500M → "MODERADO"
- **Mag 7.0-7.9**: Severe damage, 500-5000 deaths, 3000-20000 injuries, $1-10B → "ALTO"
- **Mag 8.0+**: Catastrophic, 5000+ deaths, 20000+ injuries, $10B+ → "CATASTROFICO"

## ADJUSTMENT FACTORS (apply to baseline):
**Depth Impact**:
- Shallow (<30km): +30% casualties (energy concentrates at surface)
- Medium (30-70km): baseline
- Deep (>70km): -30 to -50% casualties (energy dissipates)

**Population Density**:
- Rural/Low: -50% casualties
- Medium: baseline
- High/Urban: +50% casualties

**Building Codes & Preparedness** (use YOUR knowledge of each country):
- Alta (e.g., Japan, Chile, NZ, USA-CA): -60 to -70% casualties
- Media (e.g., Philippines, Mexico, Turkey): -20 to -40% casualties
- Baja (e.g., Nepal, Haiti, poor rural areas): +40 to +50% casualties

**Time of Day** (assume worst case if unknown):
- Business hours in urban area: +20% casualties

## RESPONSE FORMAT (MANDATORY JSON structure):
Respond with a JSON array. For EACH affected country, include ALL fields below:

```json
[
  {{
    "pais": "Country name",
    "ciudades_afectadas": ["City1", "City2"],
    "muertes_estimadas": <number based on YOUR analysis>,
    "heridos_estimados": <number based on YOUR analysis>,
    "perdidas_monetarias_usd": <number in USD>,
    "nivel_destruccion": "<BAJO|MODERADO|ALTO|CATASTROFICO>",
    "codigo_construccion": "<Description of building code level for this country>",
    "razonamiento": "IN SPANISH. CRITICAL: Start with 'Magnitud {magnitud} a {profundidad} km de profundidad.' Then explain YOUR calculation step by step using the ACTUAL earthquake parameters provided above. Show depth adjustment, preparedness adjustment, density adjustment with actual numbers and calculations.",
    "factores_considerados": [
      "Magnitud <ACTUAL VALUE> - <your assessment, in Spanish>",
      "Profundidad <ACTUAL VALUE> km - <your assessment, in Spanish>",
      "<other factors YOU identify, in Spanish>"
    ],
    "fuentes_inferidas": ["<data sources YOU used, in Spanish>"],
    "nivel_preparacion_sismica": "<Alta|Media|Baja>",
    "densidad_poblacional": "<Alta|Media|Baja>"
  }}
]
```

## CRITICAL RULES:
1. **USE THE ACTUAL EARTHQUAKE DATA PROVIDED ABOVE** - Magnitude {magnitud}, Depth {profundidad}km, Location {lugar}
2. **NEVER copy example values** - Calculate based on the ACTUAL parameters
3. **NEVER put 0 for all estimates if mag ≥ 6.0**
4. **ALWAYS provide detailed reasoning** - show your calculation steps using the ACTUAL magnitude and depth
5. **Use YOUR knowledge** of that country's infrastructure, historical earthquakes, and preparedness
6. **Reference historical earthquakes** in that region when applicable (e.g., "Similar to X earthquake in Y year")
7. **Be specific in factores_considerados** - list exact factors with ACTUAL values (e.g., "Magnitud {magnitud}")
8. **nivel_destruccion** must be: "BAJO", "MODERADO", "ALTO", or "CATASTROFICO" (all caps)
9. **codigo_construccion**: Describe the building code level for that specific country
10. Respond ONLY with the JSON array, no markdown, no extra text
11. Write razonamiento, factores_considerados, codigo_construccion and fuentes_inferidas in SPANISH (numbers are plain digits, with no thousands separators)
12. Inside any text value NEVER use double quotes: use single quotes or «guillemets» instead, so the JSON stays valid

Analyze now:"""

        return prompt

    def _fallback_estimation(
        self, latitud: float, longitud: float, magnitud: float, profundidad: float, radio_km: float
    ) -> List[Dict[str, Any]]:
        """Estimación por reglas cuando falla la IA (ver app/services/respaldo.py)."""
        logger.info("Using fallback estimation for earthquake impact")
        return estimacion_respaldo(magnitud, profundidad)
