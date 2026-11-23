# 🚀 Backend - Sistema de Monitoreo Sísmico

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-11-blue?logo=mariadb&logoColor=white)
![AI](https://img.shields.io/badge/AI-Hugging%20Face-yellow?logo=huggingface&logoColor=white)

Backend del Sistema Global de Monitoreo Sísmico con análisis de impacto impulsado por IA

[Arquitectura](#-arquitectura) •
[Tecnologías](#-stack-tecnológico) •
[Servicios](#-servicios-principales) •
[API](#-endpoints-de-la-api) •
[Modelos](#-modelos-de-datos)

</div>

---

## 📋 Descripción

Backend basado en **FastAPI** que proporciona:
- 🔄 **Ingesta automática** de datos sísmicos del USGS cada 3 minutos
- 🤖 **Análisis con IA** usando modelos de Hugging Face para evaluación de impacto
- 📊 **API REST completa** con endpoints para consultas, filtros y estadísticas
- 🔌 **WebSocket** para notificaciones en tiempo real
- 💾 **Persistencia** en base de datos MariaDB con SQLAlchemy ORM

---

## 🛠️ Stack Tecnológico

### Framework y Servidor

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python) | 3.11 | Lenguaje de programación |
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi) | 0.104+ | Framework web asíncrono |
| ![Uvicorn](https://img.shields.io/badge/Uvicorn-0.24+-purple) | 0.24+ | Servidor ASGI de alto rendimiento |
| ![Pydantic](https://img.shields.io/badge/Pydantic-2.0+-pink) | 2.0+ | Validación de datos y configuración |

### Base de Datos

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![MariaDB](https://img.shields.io/badge/MariaDB-11-blue?logo=mariadb) | 11 | Base de datos relacional |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red?logo=sqlalchemy) | 2.0+ | ORM asíncrono |
| ![aiomysql](https://img.shields.io/badge/aiomysql-0.2+-orange) | 0.2+ | Driver MySQL asíncrono |

### APIs Externas

| Servicio | Uso |
|----------|-----|
| **USGS Earthquake API** | Datos sísmicos en tiempo real |
| **Hugging Face Inference API** | Modelos de IA para análisis de impacto |

### Dependencias Principales

```python
fastapi>=0.104.1        # Framework web
uvicorn>=0.24.0        # Servidor ASGI
sqlalchemy>=2.0.23     # ORM
aiomysql>=0.2.0        # Driver MySQL async
pydantic>=2.5.0        # Validación
pydantic-settings>=2.1.0  # Config con .env
httpx>=0.25.1          # Cliente HTTP async
python-dateutil>=2.8.2 # Manejo de fechas
python-dotenv>=1.0.0   # Variables de entorno
```

---

## 🏗️ Arquitectura

```
backend/
├── app/
│   ├── main.py                 # 🚀 Punto de entrada FastAPI
│   ├── config.py               # ⚙️ Configuración global
│   ├── database.py             # 💾 Conexión a BD
│   │
│   ├── models/                 # 📊 Modelos SQLAlchemy
│   │   └── seismic_event.py   # EventoSismico, ImpactoPais
│   │
│   ├── routes/                 # 🛣️ Endpoints API
│   │   └── events.py          # GET/POST /api/events/*
│   │
│   ├── services/               # 🔧 Lógica de negocio
│   │   ├── usgs_service.py        # Ingesta USGS
│   │   ├── radius_calculator.py   # Cálculo de radios
│   │   └── seismic_processor.py   # Orquestador principal
│   │
│   └── inference/              # 🤖 Cliente de IA
│       └── huggingface_client.py  # Inferencia con HF
│
├── init.sql                    # 📝 Schema de base de datos
├── requirements.txt            # 📦 Dependencias Python
├── Dockerfile                  # 🐳 Imagen Docker
└── README.md                   # 📖 Esta documentación
```

---

## 🔄 Servicios Principales

### 1. USGS Service (`usgs_service.py`)

**Responsabilidad**: Obtención de datos sísmicos del API de USGS

```python
class USGSService:
    async def fetch_recent_earthquakes(
        self,
        min_magnitude: float = 4.5,
        lookback_hours: int = 24
    ) -> List[Dict]:
        """
        Consulta eventos sísmicos recientes del USGS

        Returns:
            Lista de eventos con:
            - event_id: str
            - magnitud: float
            - profundidad: float
            - latitud: float
            - longitud: float
            - fecha_utc: datetime
            - lugar: str
        """
```

**Features**:
- ✅ Polling cada 3 minutos (configurable)
- ✅ Filtro por magnitud mínima (default: 4.5)
- ✅ Manejo de errores y reintentos
- ✅ Normalización de datos USGS a formato interno

**Endpoint USGS**:
```
https://earthquake.usgs.gov/fdsnws/event/1/query
?format=geojson
&minmagnitude=4.5
&orderby=time
&limit=100
```

---

### 2. Radius Calculator (`radius_calculator.py`)

**Responsabilidad**: Cálculo del radio de afectación geográfica

```python
class RadiusCalculator:
    def calculate_radius(
        self,
        magnitud: float,
        profundidad: float
    ) -> float:
        """
        Calcula el radio de impacto en kilómetros

        Fórmula:
        - radio_base = 10 * (magnitud ** 2.5)
        - ajuste_profundidad = max(0.3, 1 - (profundidad / 500))
        - radio_final = radio_base * ajuste_profundidad

        Returns:
            Radio en km (redondeado a 2 decimales)
        """
```

**Ejemplos de Cálculo**:

| Magnitud | Profundidad | Radio Calculado |
|----------|-------------|-----------------|
| 4.5      | 10 km       | 310 km          |
| 5.0      | 40 km       | 510 km          |
| 6.0      | 50 km       | 1300 km         |
| 7.0      | 100 km      | 2850 km         |
| 8.0      | 150 km      | 4800 km         |

**Justificación**:
- Terremotos superficiales (< 50km) → Mayor radio
- Terremotos profundos (> 100km) → Menor radio (energía se disipa)
- Factor exponencial 2.5 refleja la escala logarítmica de Richter

---

### 3. Hugging Face Client (`huggingface_client.py`)

**Responsabilidad**: Análisis de impacto usando IA, con la estimación por reglas como respaldo.

```python
class HuggingFaceInferenceClient:
    async def infer_impact(self, latitud, longitud, magnitud, profundidad, radio_km, lugar="", historical_context=None) -> List[Dict]:
        """
        Devuelve la lista de impactos por país; nunca lanza una excepción:
        sin token real, con un error de la API o con una respuesta que no sirve, devuelve la estimación por reglas
        (app/services/respaldo.py: un solo impacto, con país «Región sin identificar»).

        Cada impacto trae: pais, ciudades_afectadas, muertes_estimadas, heridos_estimados, perdidas_monetarias_usd,
        nivel_destruccion (BAJO|MODERADO|ALTO|CATASTROFICO), razonamiento, factores_considerados, codigo_construccion,
        fuentes_inferidas, nivel_preparacion_sismica y densidad_poblacional.
        """
```

La lectura de la respuesta del modelo está aparte, en `app/services/respuesta_ia.py` (funciones puras con pruebas): saca la lista JSON aunque venga entre ```json, repara una coma sobrante, convierte cifras escritas como texto, normaliza el nivel de destrucción y, si la IA devuelve todo en cero para un sismo que no lo justifica, corrige las cifras con magnitud, profundidad, preparación y densidad. Si el modelo está cargándose (503) se reintenta hasta 3 veces, y si la respuesta no se puede leer (casi siempre una comilla doble sin escapar dentro de un texto) se vuelve a pedir hasta 3 veces antes de caer a las reglas.

**Modelo utilizado**: `meta-llama/Llama-3.3-70B-Instruct` (por defecto, en `app/config.py`). El modelo debe estar servido por un proveedor de Inference Providers: la lista está en https://router.huggingface.co/v1/models. `Qwen/Qwen2.5-7B-Instruct`, el anterior, ya no lo sirve ninguno. Probados el 23-nov-2026: `Qwen/Qwen2.5-72B-Instruct` (JSON válido, 11 a 13 s, razonamiento en inglés) y `meta-llama/Llama-3.3-70B-Instruct` (JSON válido, 5 a 14 s, razonamiento en español); `meta-llama/Llama-3.1-8B-Instruct` devolvió JSON roto.

**Prompt Engineering**:
El prompt incluye:
1. **Datos del evento**: Magnitud, profundidad, ubicación, radio
2. **Instrucciones**: Análisis realista basado en conocimiento del modelo
3. **Formato de respuesta**: JSON estructurado
4. **Reglas críticas**:
   - Usar datos REALES del evento (no copiar ejemplos)
   - Proporcionar razonamiento detallado
   - Referencias históricas cuando sea posible
   - Información de códigos de construcción por país

**Ejemplo de respuesta de la IA** (la guardada para el sismo M 6,5 de «Vanuatu region» a 598 km, el 23-nov-2026):
```json
{
  "pais": "Vanuatu",
  "ciudades_afectadas": ["Port Vila"],
  "muertes_estimadas": 15,
  "heridos_estimados": 120,
  "perdidas_monetarias_usd": 15000000,
  "nivel_destruccion": "MODERADO",
  "razonamiento": "Magnitud 6.5 a 598.0 km de profundidad. Considerando la profundidad del terremoto, se aplicaría una reducción del 40% en el número de víctimas, ya que la energía se disipa con la distancia. Sin embargo, la falta de preparación sísmica y la baja calidad de las construcciones en Vanuatu aumentan el riesgo de daños. [...]",
  "factores_considerados": [
    "Magnitud 6.5 - Terremoto de moderada intensidad",
    "Profundidad 598.0 km - Reducción del 40% en el número de víctimas",
    "Preparación sísmica baja - Aumento del riesgo de daños",
    "Densidad poblacional media - Número de víctimas moderado"
  ],
  "codigo_construccion": "La construcción en Vanuatu es en general de baja calidad, con algunas estructuras resistentes a terremotos, pero la mayoría no cumple con los estándares internacionales",
  "nivel_preparacion_sismica": "Baja",
  "densidad_poblacional": "Media"
}
```

(La clave que pide el prompt es `razonamiento`; la base de datos la guarda como `razonamiento_ia`.)

---

### 4. Seismic Processor (`seismic_processor.py`)

**Responsabilidad**: Orquestación del pipeline completo

```python
class SeismicProcessor:
    async def process_new_earthquakes(
        self,
        db: AsyncSession
    ) -> List[str]:
        """
        Pipeline completo:
        1. Fetch eventos USGS
        2. Filtrar nuevos (no en BD)
        3. Para cada evento:
           a. Calcular radio
           b. Guardar el evento y avisar por WebSocket (todavía sin estimación: `estimando: true`)
           c. Solicitar análisis IA (o reglas)
           d. Guardar los impactos y avisar por WebSocket de nuevo

        Returns:
            Lista de event_ids procesados
        """
```

**Flujo Detallado**:

```
1. USGS Service
   └─> Fetch eventos (mag >= 4.5, últimas 24h)
       └─> [us6000abc, us6000xyz, ...]

2. Para cada evento NO en BD:
   ├─> Radius Calculator
   │   └─> radio_km = f(magnitud, profundidad)
   │
   ├─> Guardar EventoSismico en BD            (ya se ve en las interfaces, con la rueda de carga)
   │   └─> WebSocket: {"type": "new_earthquake", "data": {"event": {..., "estimando": true}, "impacts": []}}
   │
   ├─> Hugging Face Client (puede tardar varios segundos)
   │   └─> Análisis de impacto por país
   │       └─> [{pais, estimaciones, razonamiento, ...}, ...]
   │
   ├─> Guardar ImpactoPais[] en BD
   │
   └─> WebSocket: {"type": "new_earthquake", "data": {"event": {..., "estimando": false}, "impacts": [...]}}

3. Return processed IDs
```

---

## 📊 Modelos de Datos

### EventoSismico

```python
class EventoSismico(Base):
    __tablename__ = "eventos_sismicos"

    id = Column(Integer, primary_key=True)
    event_id = Column(String(50), unique=True, index=True)
    magnitud = Column(DECIMAL(3, 1), nullable=False)
    profundidad = Column(DECIMAL(6, 2), nullable=False)
    latitud = Column(DECIMAL(9, 6), nullable=False)
    longitud = Column(DECIMAL(9, 6), nullable=False)
    fecha_utc = Column(DateTime, nullable=False, index=True)
    lugar = Column(String(255))
    radio_afectacion_km = Column(DECIMAL(8, 2))
    fuente_api = Column(String(50), default="USGS")
    created_at = Column(TIMESTAMP, server_default=func.now())
```

### ImpactoPais

```python
class ImpactoPais(Base):
    __tablename__ = "impactos_pais"

    id = Column(Integer, primary_key=True)
    event_id = Column(String(50), ForeignKey("eventos_sismicos.event_id"))
    pais = Column(String(100), nullable=False, index=True)
    ciudades_afectadas = Column(JSON)
    muertes_estimadas = Column(Integer, default=0)
    heridos_estimados = Column(Integer, default=0)
    perdidas_monetarias_usd = Column(BigInteger, default=0)
    nivel_destruccion = Column(Enum(NivelDestruccion), default="BAJO")
    fuentes_inferidas = Column(JSON)

    # ⭐ NUEVOS CAMPOS
    razonamiento_ia = Column(Text, nullable=True)
    factores_considerados = Column(JSON, nullable=True)
    codigo_construccion = Column(String(255), nullable=True)

    nivel_preparacion_sismica = Column(String(50))
    densidad_poblacional = Column(String(50))
    created_at = Column(TIMESTAMP, server_default=func.now())
```

### Enum: NivelDestruccion

```python
class NivelDestruccion(str, enum.Enum):
    BAJO = "BAJO"
    MODERADO = "MODERADO"
    ALTO = "ALTO"
    CATASTROFICO = "CATASTROFICO"
```

---

## 🛣️ Endpoints de la API

### Base URL
```
http://localhost:8000
```

### Documentación Interactiva
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

### GET `/api/events/`

**Descripción**: Lista de eventos sísmicos con filtros opcionales

**Query Parameters**:
```typescript
{
  limit?: number;           // Default: 100
  offset?: number;          // Default: 0
  min_magnitude?: float;    // Ej: 5.0
  max_magnitude?: float;    // Ej: 8.0
  start_date?: datetime;    // ISO 8601
  end_date?: datetime;      // ISO 8601
}
```

**Ejemplo**:
```bash
curl "http://localhost:8000/api/events/?min_magnitude=6.0&limit=10"
```

**Response 200**:
```json
{
  "total": 13,
  "limit": 10,
  "offset": 0,
  "events": [
    {
      "event_id": "us6000rhzq",
      "magnitud": 5.0,
      "profundidad": 39.77,
      "latitud": 24.2442,
      "longitud": 122.1061,
      "fecha_utc": "2025-10-18T02:04:14",
      "lugar": "58 km ENE of Hualien City, Taiwan",
      "radio_afectacion_km": 65.27,
      "fuente_api": "USGS"
    }
  ]
}
```

---

### GET `/api/events/{event_id}`

**Descripción**: Detalles completos de un evento incluyendo impactos

**Ejemplo**:
```bash
curl http://localhost:8000/api/events/us6000rhzq
```

**Response 200**:
```json
{
  "event": {
    "event_id": "us6000rhzq",
    "magnitud": 5.0,
    "profundidad": 39.77,
    "latitud": 24.2442,
    "longitud": 122.1061,
    "fecha_utc": "2025-10-18T02:04:14",
    "lugar": "58 km ENE of Hualien City, Taiwan",
    "radio_afectacion_km": 65.27,
    "fuente_api": "USGS"
  },
  "impacts": [
    {
      "pais": "Taiwan",
      "ciudades_afectadas": ["Hualien City"],
      "muertes_estimadas": 100,
      "heridos_estimados": 500,
      "perdidas_monetarias_usd": 150000000,
      "nivel_destruccion": "MODERADO",
      "fuentes_inferidas": ["Taiwan 2014 Building Code"],
      "razonamiento_ia": "Magnitude 5.0 at 39.8km depth...",
      "factores_considerados": ["Magnitude 5.0 - light", "Depth 39.8km..."],
      "codigo_construccion": "Alta (Taiwan Earthquake Law 2001)",
      "nivel_preparacion_sismica": "Alta",
      "densidad_poblacional": "Media"
    }
  ]
}
```

---

### GET `/api/events/country/{country_name}`

**Descripción**: Eventos que afectaron a un país específico

**Ejemplo**:
```bash
curl http://localhost:8000/api/events/country/Taiwan
```

**Response 200**: Similar a GET `/api/events/` pero filtrado por país

---

### GET `/api/events/stats/summary`

**Descripción**: Estadísticas agregadas

**Query Parameters**:
```typescript
{
  days?: number;  // Default: 30
}
```

**Ejemplo**:
```bash
curl "http://localhost:8000/api/events/stats/summary?days=7"
```

**Response 200**:
```json
{
  "period_days": 7,
  "total_events": 13,
  "average_magnitude": 4.9,
  "highest_magnitude_event": {
    "event_id": "us6000rhs3",
    "magnitud": 5.5,
    "lugar": "Afghanistan"
  },
  "estimated_casualties": {
    "deaths": 450,
    "injuries": 3200,
    "economic_losses_usd": 850000000
  },
  "most_affected_countries": [
    {
      "country": "Philippines",
      "event_count": 3,
      "total_deaths": 350
    }
  ]
}
```

---

### POST `/api/events/process`

**Descripción**: Fuerza procesamiento manual de eventos USGS

**Ejemplo**:
```bash
curl -X POST http://localhost:8000/api/events/process
```

**Response 200**:
```json
{
  "processed": 2,
  "event_ids": ["us6000abc", "us6000xyz"]
}
```

---

### WebSocket `/ws`

**Descripción**: Notificaciones en tiempo real

**Ejemplo (JavaScript)**:
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'new_earthquake') {
    console.log('Nuevo terremoto:', data.data);
  }
};
```

**Mensaje de notificación**:
```json
{
  "type": "new_earthquake",
  "data": {
    "event_id": "us6000new",
    "magnitud": 6.2,
    "lugar": "Pacific Ocean",
    "fecha_utc": "2025-10-18T10:30:00"
  }
}
```

---

## ⚙️ Configuración

### Variables de Entorno (`.env`)

La plantilla completa y comentada es [`.env.example`](../.env.example). Lo que lee el backend (`app/config.py`):

```env
# Hugging Face (opcional: sin token se usa la estimación por reglas)
HUGGINGFACE_API_TOKEN=
HUGGINGFACE_MODEL=meta-llama/Llama-3.3-70B-Instruct

# Base de datos
MARIADB_HOST=db
MARIADB_PORT=3306
MARIADB_DATABASE=seismic_db
MARIADB_USER=seismic_user
MARIADB_PASSWORD=<tu contraseña>

# Consulta al USGS
POLLING_INTERVAL_SECONDS=180   # 3 minutos
MIN_MAGNITUDE_THRESHOLD=4.5

# Orígenes que pueden llamar a la API desde un navegador (la web y Expo web)
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Archivo `config.py`

Es una clase de `pydantic-settings` (`app/config.py`) con un campo por variable de arriba; cada una se puede cambiar con una variable de entorno del mismo nombre. El modelo por defecto y su comentario están ahí.

---

## 🔧 Desarrollo Local

### Requisitos
```bash
python >= 3.11
pip >= 23.0
```

### Instalación

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt
```

### Ejecutar sin Docker

```bash
# Asegurarse de que MariaDB está corriendo
docker compose up -d db

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Variables de entorno para desarrollo local

```env
MARIADB_HOST=localhost
MARIADB_PASSWORD=<la de tu .env>
```

---

## 🧪 Testing

### Pruebas automáticas

```bash
pip install -r requirements-dev.txt
python -m pytest        # 39 pruebas de funciones puras: no necesitan Docker ni base de datos
```

Cubren la estimación por reglas (`respaldo.py`), el resumen de impactos (`resumen.py`) la lectura de la respuesta de la IA (`respuesta_ia.py`) y el registro de sismos en estimación (`estimando.py`).

### Pruebas Manuales con curl

```bash
# Health check
curl http://localhost:8000/health

# Lista de eventos
curl http://localhost:8000/api/events/ | jq

# Evento específico
curl http://localhost:8000/api/events/us6000rhzq | jq

# Filtros
curl "http://localhost:8000/api/events/?min_magnitude=6.0" | jq

# Estadísticas
curl http://localhost:8000/api/events/stats/summary | jq

# Forzar procesamiento
curl -X POST http://localhost:8000/api/events/process | jq
```

### Logs

```bash
# Ver logs en tiempo real
docker compose logs -f backend

# Últimas 100 líneas
docker compose logs backend --tail 100

# Buscar errores
docker compose logs backend | grep ERROR
```

---

## 📈 Monitoreo y Performance

### Métricas Clave

- **Polling interval**: 3 minutos (180 segundos)
- **API response time**: < 500ms (promedio)
- **IA inference time**: 2-5 segundos (primera vez: 20-30s)
- **Database queries**: < 100ms

### Optimizaciones

1. **Connection Pooling**: SQLAlchemy con pool de 5-20 conexiones
2. **Async I/O**: Todas las operaciones de red son asíncronas
3. **Batch Processing**: Eventos procesados en lotes
4. **Índices de BD**:
   - `event_id` (PK + UNIQUE)
   - `fecha_utc` (para queries por fecha)
   - `magnitud` (para filtros)
   - `pais` (para búsquedas por país)

---

## 🐛 Troubleshooting

### Error: "Connection to database failed"

```bash
# Verificar que MariaDB está corriendo
docker compose ps db

# Ver logs de BD
docker compose logs db

# Reiniciar BD
docker compose restart db
```

### Error: "Hugging Face API timeout"

```python
# En huggingface_client.py, aumentar timeout
self.client = httpx.AsyncClient(timeout=60.0)  # De 30 a 60 segundos
```

### Error: "No new earthquakes found"

Es normal si no hay eventos recientes con mag >= 4.5. Puedes:
- Reducir `MIN_MAGNITUDE_THRESHOLD` en `.env`
- Verificar manualmente en USGS: https://earthquake.usgs.gov/earthquakes/map/

---

## 📚 Referencias

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy 2.0**: https://docs.sqlalchemy.org/en/20/
- **USGS API**: https://earthquake.usgs.gov/fdsnws/event/1/
- **Hugging Face**: https://huggingface.co/docs/api-inference/index
- **Pydantic**: https://docs.pydantic.dev/latest/

---

## 📄 Licencia

MIT License - Ver archivo principal de LICENSE del proyecto

---

<div align="center">

**Backend desarrollado con ⚡ FastAPI y 🤖 IA**

[Volver al README principal](../README.md)

</div>

---

## Novedades del rediseño (noviembre de 2026)

- **Estimación de respaldo por profundidad.** Cuando el modelo de IA no está disponible, [`app/services/respaldo.py`](app/services/respaldo.py) estima el impacto por reglas y lo atenúa según la profundidad (superficial 1, intermedia 0,4, profunda 0,02). Antes un sismo de magnitud 6,5 a 601 km daba 150 muertes; ahora da 3. Es una función pura, sin red ni base de datos.
- **Resumen de impactos en la lista.** `GET /api/events/` devuelve, por cada evento, `nivel_destruccion` (el más alto), `muertes_estimadas`, `heridos_estimados`, `perdidas_monetarias_usd` (sumas) y `estimacion` (`reglas` o `ia`), calculados por [`app/services/resumen.py`](app/services/resumen.py).
- **Eco de SQL apagado.** `SQL_ECHO=true` lo vuelve a encender para depurar.
- **Pruebas.** `pip install -r requirements-dev.txt` y `python -m pytest` (19 pruebas de las dos funciones puras; no necesitan FastAPI ni MariaDB).
