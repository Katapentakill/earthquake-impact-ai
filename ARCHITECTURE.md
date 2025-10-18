# Arquitectura del Sistema

## Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                      FUENTES EXTERNAS                            │
├─────────────────────────────────────────────────────────────────┤
│  USGS API                           Hugging Face API            │
│  (Sismos globales)                  (Inferencia IA)             │
└───────┬─────────────────────────────────────┬───────────────────┘
        │                                     │
        │ 1. Polling cada 3min                │ 3. Inferencia
        ▼                                     │
┌─────────────────────────────────────────────┼───────────────────┐
│               BACKEND (FastAPI)             │                   │
├─────────────────────────────────────────────┴───────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │ USGS Service   │  │ Radius Calculator│  │ HF AI Client    │ │
│  │                │  │                  │  │                 │ │
│  │ • Fetch events │─▶│ • Calculate      │─▶│ • Build prompt  │ │
│  │ • Parse JSON   │  │   impact radius  │  │ • Call HF API   │ │
│  └────────────────┘  └──────────────────┘  │ • Parse response│ │
│                                             └────────┬────────┘ │
│                                                      │          │
│  ┌──────────────────────────────────────────────────▼────────┐ │
│  │            Seismic Processor (Orchestrator)               │ │
│  │  • Coordina todos los servicios                           │ │
│  │  • Maneja pipeline completo                               │ │
│  │  • Guarda en DB                                           │ │
│  └──────────────────────────────┬────────────────────────────┘ │
│                                  │                              │
│  ┌───────────────────────────────▼──────────────────────────┐  │
│  │                    API REST Endpoints                     │  │
│  │  GET  /api/events/              (Lista eventos)           │  │
│  │  GET  /api/events/{id}          (Detalles + impactos)    │  │
│  │  GET  /api/events/country/{name} (Por país)              │  │
│  │  GET  /api/events/stats/summary  (Estadísticas)          │  │
│  │  POST /api/events/process        (Forzar actualización)  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                WebSocket (/ws)                            │   │
│  │  • Notificaciones en tiempo real                          │   │
│  │  • Nuevos sismos detectados                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────┬───────────────────────────┬───────────────────┘
                   │                           │
        2. Save    │                           │ 4. API calls / WS
                   ▼                           ▼
     ┌─────────────────────┐      ┌──────────────────────────────┐
     │   MariaDB           │      │   FRONTEND (Next.js)         │
     ├─────────────────────┤      ├──────────────────────────────┤
     │                     │      │                              │
     │ eventos_sismicos    │      │  ┌────────────────────────┐  │
     │ ├─ event_id (PK)    │      │  │   SeismicMap           │  │
     │ ├─ magnitud         │      │  │   (Leaflet)            │  │
     │ ├─ profundidad      │      │  │   • Círculos de impacto│  │
     │ ├─ latitud/longitud │      │  │   • Markers por evento │  │
     │ ├─ fecha_utc        │      │  └────────────────────────┘  │
     │ └─ radio_km         │      │                              │
     │                     │      │  ┌────────────────────────┐  │
     │ impactos_pais       │      │  │   EventList            │  │
     │ ├─ event_id (FK)    │      │  │   • Lista cronológica  │  │
     │ ├─ pais             │      │  │   • Selección de items │  │
     │ ├─ ciudades[]       │      │  └────────────────────────┘  │
     │ ├─ muertes_est      │      │                              │
     │ ├─ heridos_est      │      │  ┌────────────────────────┐  │
     │ ├─ perdidas_usd     │      │  │   ImpactPanel          │  │
     │ └─ nivel_destruccion│      │  │   • Por país           │  │
     │                     │      │  │   • Métricas           │  │
     │ cache_inferencias   │      │  │   • Fuentes inferidas  │  │
     │ ├─ hash (PK)        │      │  └────────────────────────┘  │
     │ └─ respuesta_ia     │      │                              │
     └─────────────────────┘      │  ┌────────────────────────┐  │
                                  │  │   FilterPanel          │  │
                                  │  │   • Magnitud           │  │
                                  │  │   • Fechas             │  │
                                  │  │   • Filtros rápidos    │  │
                                  │  └────────────────────────┘  │
                                  └──────────────────────────────┘
```

## Pipeline de Procesamiento de Eventos

```
1. INGESTA
   ↓
   USGS API devuelve GeoJSON con sismos recientes
   ↓
   Parsear: event_id, mag, depth, lat, lon, time, place

2. CÁLCULO DE RADIO
   ↓
   Formula: radius = 10^(0.5*mag - 0.8) * depth_factor
   ↓
   Ajustes por profundidad y magnitud
   ↓
   Resultado: radio_afectacion_km

3. INFERENCIA DE IA
   ↓
   Construir prompt con:
   - Coordenadas + radio
   - Magnitud + profundidad
   - Lugar
   ↓
   Enviar a Hugging Face API (Mistral-7B)
   ↓
   IA responde con JSON:
   [
     {
       "pais": "Chile",
       "ciudades_afectadas": ["Arica", "Iquique"],
       "muertes_estimadas": 180,
       "heridos_estimados": 950,
       "perdidas_monetarias_usd": 2500000000,
       "nivel_destruccion": "Alto",
       "fuentes_inferidas": ["..."],
       "nivel_preparacion_sismica": "Media",
       "densidad_poblacional": "Alta"
     }
   ]

4. PERSISTENCIA
   ↓
   Guardar en eventos_sismicos
   ↓
   Guardar cada impacto en impactos_pais
   ↓
   Commit a base de datos

5. NOTIFICACIÓN
   ↓
   WebSocket broadcast a todos los clientes conectados
   ↓
   Frontend actualiza mapa y lista automáticamente
```

## Tecnologías Utilizadas

### Backend
- **FastAPI**: Framework web asíncrono
- **SQLAlchemy**: ORM para base de datos
- **aiomysql**: Driver asíncrono para MariaDB
- **httpx**: Cliente HTTP asíncrono
- **websockets**: Comunicación tiempo real
- **huggingface-hub**: Cliente para API de HF

### Frontend
- **Next.js 14**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Leaflet**: Biblioteca de mapas interactivos
- **Tailwind CSS**: Framework CSS utility-first
- **Axios**: Cliente HTTP
- **date-fns**: Manejo de fechas

### Infraestructura
- **Docker**: Contenedorización
- **Docker Compose**: Orquestación multi-contenedor
- **MariaDB**: Base de datos relacional

### APIs Externas
- **USGS Earthquake Catalog**: Datos sísmicos globales
- **Hugging Face Inference API**: Modelos de IA

## Modelos de Datos

### EventoSismico (DB Table)
```python
{
  "id": int,                    # Primary key
  "event_id": str,              # USGS event ID (unique)
  "magnitud": decimal(3,1),     # Richter/Moment magnitude
  "profundidad": decimal(6,2),  # Depth in km
  "latitud": decimal(9,6),      # Latitude
  "longitud": decimal(9,6),     # Longitude
  "fecha_utc": datetime,        # UTC timestamp
  "lugar": str,                 # Location description
  "radio_afectacion_km": decimal(8,2),  # Impact radius
  "fuente_api": str,            # Always "USGS"
  "created_at": timestamp       # Record creation time
}
```

### ImpactoPais (DB Table)
```python
{
  "id": int,                              # Primary key
  "event_id": str,                        # Foreign key
  "pais": str,                            # Country name
  "ciudades_afectadas": json,             # Array of cities
  "muertes_estimadas": int,               # Estimated deaths
  "heridos_estimados": int,               # Estimated injuries
  "perdidas_monetarias_usd": bigint,      # Economic losses
  "nivel_destruccion": enum,              # Bajo|Moderado|Alto|Catastrofico
  "fuentes_inferidas": json,              # Array of reasoning
  "nivel_preparacion_sismica": str,       # Alta|Media|Baja
  "densidad_poblacional": str,            # Alta|Media|Baja
  "created_at": timestamp
}
```

## Configuración de Entorno

### Variables Críticas
```env
HUGGINGFACE_API_TOKEN       # Token de acceso (obligatorio)
HUGGINGFACE_MODEL           # Modelo a usar (default: Mistral-7B)
POLLING_INTERVAL_SECONDS    # Frecuencia de polling (default: 180)
MIN_MAGNITUDE_THRESHOLD     # Magnitud mínima (default: 4.5)
```

### Puertos Expuestos
```
3000  → Frontend (Next.js)
8000  → Backend (FastAPI)
3306  → MariaDB
```

## Escalabilidad

### Optimizaciones Implementadas
1. **Pooling de conexiones**: SQLAlchemy con pool_size configurable
2. **Async/Await**: Todo el backend es asíncrono
3. **Cache de inferencias**: Tabla `cache_inferencias` para respuestas repetidas
4. **Índices DB**: Optimización de consultas frecuentes
5. **WebSocket**: Comunicación eficiente vs polling del cliente

### Posibles Mejoras Futuras
- Redis para cache distribuido
- Kubernetes para multi-instancia
- CDN para frontend estático
- Cola de mensajes (RabbitMQ/Kafka) para procesamiento masivo
- Modelo de IA local con GPU para mayor velocidad
