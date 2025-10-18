# Ejemplos de Uso de la API

## Índice
- [Obtener Eventos](#obtener-eventos)
- [Filtrar Eventos](#filtrar-eventos)
- [Detalles de Evento](#detalles-de-evento)
- [Eventos por País](#eventos-por-país)
- [Estadísticas](#estadísticas)
- [Procesamiento Manual](#procesamiento-manual)
- [WebSocket](#websocket)

---

## Obtener Eventos

### Últimos 50 eventos
```bash
curl http://localhost:8000/api/events/
```

**Respuesta:**
```json
{
  "total": 50,
  "limit": 50,
  "offset": 0,
  "events": [
    {
      "event_id": "us6000m9ab",
      "magnitud": 6.2,
      "profundidad": 10.5,
      "latitud": -18.456,
      "longitud": -70.234,
      "fecha_utc": "2025-10-17T14:30:00",
      "lugar": "Near the coast of northern Chile",
      "radio_afectacion_km": 280.5,
      "fuente_api": "USGS"
    }
  ]
}
```

### Con límite y offset (paginación)
```bash
curl "http://localhost:8000/api/events/?limit=10&offset=20"
```

---

## Filtrar Eventos

### Por magnitud mínima
```bash
curl "http://localhost:8000/api/events/?min_magnitude=6.0"
```

### Por rango de magnitud
```bash
curl "http://localhost:8000/api/events/?min_magnitude=5.0&max_magnitude=7.0"
```

### Por fechas
```bash
curl "http://localhost:8000/api/events/?start_date=2025-10-01T00:00:00&end_date=2025-10-17T23:59:59"
```

### Combinando filtros
```bash
curl "http://localhost:8000/api/events/?min_magnitude=6.5&start_date=2025-10-01T00:00:00&limit=20"
```

---

## Detalles de Evento

### Obtener evento completo con impactos
```bash
curl http://localhost:8000/api/events/us6000m9ab
```

**Respuesta:**
```json
{
  "event": {
    "event_id": "us6000m9ab",
    "magnitud": 7.2,
    "profundidad": 35.0,
    "latitud": -18.456,
    "longitud": -70.234,
    "fecha_utc": "2025-10-17T14:30:00",
    "lugar": "Near the coast of northern Chile",
    "radio_afectacion_km": 450.0,
    "fuente_api": "USGS"
  },
  "impacts": [
    {
      "pais": "Chile",
      "ciudades_afectadas": ["Arica", "Iquique", "Alto Hospicio"],
      "muertes_estimadas": 180,
      "heridos_estimados": 950,
      "perdidas_monetarias_usd": 2500000000,
      "nivel_destruccion": "Alto",
      "fuentes_inferidas": [
        "Alta densidad urbana costera",
        "Infraestructura antisísmica media",
        "Proximidad al epicentro"
      ],
      "nivel_preparacion_sismica": "Media",
      "densidad_poblacional": "Alta"
    },
    {
      "pais": "Peru",
      "ciudades_afectadas": ["Tacna"],
      "muertes_estimadas": 45,
      "heridos_estimados": 230,
      "perdidas_monetarias_usd": 500000000,
      "nivel_destruccion": "Moderado",
      "fuentes_inferidas": [
        "Distancia moderada del epicentro",
        "Infraestructura variable"
      ],
      "nivel_preparacion_sismica": "Baja",
      "densidad_poblacional": "Media"
    }
  ]
}
```

---

## Eventos por País

### Todos los eventos que afectaron a Chile
```bash
curl http://localhost:8000/api/events/country/Chile
```

**Respuesta:**
```json
{
  "country": "Chile",
  "total": 15,
  "results": [
    {
      "event": {
        "event_id": "us6000m9ab",
        "magnitud": 7.2,
        "fecha_utc": "2025-10-17T14:30:00",
        "lugar": "Near the coast of northern Chile"
      },
      "impact": {
        "ciudades_afectadas": ["Arica", "Iquique"],
        "muertes_estimadas": 180,
        "heridos_estimados": 950,
        "perdidas_monetarias_usd": 2500000000,
        "nivel_destruccion": "Alto"
      }
    }
  ]
}
```

### Con paginación
```bash
curl "http://localhost:8000/api/events/country/Japan?limit=10&offset=0"
```

---

## Estadísticas

### Resumen de últimos 30 días (default)
```bash
curl http://localhost:8000/api/events/stats/summary
```

**Respuesta:**
```json
{
  "period_days": 30,
  "total_events": 245,
  "average_magnitude": 5.4,
  "highest_magnitude_event": {
    "event_id": "us6000m9ab",
    "magnitud": 7.8,
    "lugar": "Papua New Guinea",
    "fecha_utc": "2025-10-10T08:15:00"
  },
  "estimated_casualties": {
    "deaths": 1250,
    "injuries": 8900,
    "economic_losses_usd": 15000000000
  },
  "most_affected_countries": [
    {
      "country": "Indonesia",
      "event_count": 28,
      "total_deaths": 450
    },
    {
      "country": "Chile",
      "event_count": 15,
      "total_deaths": 280
    },
    {
      "country": "Japan",
      "event_count": 22,
      "total_deaths": 120
    }
  ]
}
```

### Últimos 7 días
```bash
curl "http://localhost:8000/api/events/stats/summary?days=7"
```

### Últimos 90 días
```bash
curl "http://localhost:8000/api/events/stats/summary?days=90"
```

---

## Procesamiento Manual

### Forzar actualización desde USGS
```bash
curl -X POST http://localhost:8000/api/events/process
```

**Respuesta:**
```json
{
  "message": "Processing completed",
  "processed_count": 3,
  "event_ids": [
    "us6000m9cd",
    "us6000m9ce",
    "us6000m9cf"
  ]
}
```

---

## WebSocket

### Ejemplo en JavaScript (Browser)
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to seismic monitoring system');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'connection':
      console.log('Connection established:', data.message);
      break;

    case 'new_earthquake':
      console.log('NEW EARTHQUAKE DETECTED!');
      console.log('Event:', data.data.event);
      console.log('Impacts:', data.data.impacts);

      // Aquí puedes actualizar tu UI
      updateMap(data.data.event);
      showNotification(data.data.event);
      break;

    case 'pong':
      console.log('Server is alive');
      break;
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
  // Intentar reconectar
  setTimeout(() => connectWebSocket(), 5000);
};

// Keepalive (ping cada 30 segundos)
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send('ping');
  }
}, 30000);
```

### Ejemplo en Python
```python
import asyncio
import websockets
import json

async def monitor_earthquakes():
    uri = "ws://localhost:8000/ws"

    async with websockets.connect(uri) as websocket:
        print("Connected to seismic monitoring system")

        # Recibir mensajes
        async for message in websocket:
            data = json.loads(message)

            if data['type'] == 'new_earthquake':
                event = data['data']['event']
                print(f"\n🚨 NEW EARTHQUAKE!")
                print(f"Magnitude: {event['magnitud']}")
                print(f"Location: {event['lugar']}")
                print(f"Impacts: {len(data['data']['impacts'])} countries")

                # Procesar impactos
                for impact in data['data']['impacts']:
                    print(f"  → {impact['pais']}: {impact['nivel_destruccion']}")

# Ejecutar
asyncio.run(monitor_earthquakes())
```

---

## Ejemplos con Python Requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Obtener eventos recientes
response = requests.get(f"{BASE_URL}/api/events/")
events = response.json()['events']

for event in events[:5]:
    print(f"{event['lugar']}: Magnitude {event['magnitud']}")

# Filtrar por magnitud
response = requests.get(
    f"{BASE_URL}/api/events/",
    params={
        'min_magnitude': 6.0,
        'limit': 10
    }
)

# Obtener detalles de un evento específico
event_id = "us6000m9ab"
response = requests.get(f"{BASE_URL}/api/events/{event_id}")
event_data = response.json()

print(f"Event: {event_data['event']['lugar']}")
print(f"Countries affected: {len(event_data['impacts'])}")

# Estadísticas
response = requests.get(
    f"{BASE_URL}/api/events/stats/summary",
    params={'days': 7}
)
stats = response.json()

print(f"Total events (7 days): {stats['total_events']}")
print(f"Average magnitude: {stats['average_magnitude']:.2f}")

# Forzar actualización
response = requests.post(f"{BASE_URL}/api/events/process")
result = response.json()
print(f"Processed {result['processed_count']} new events")
```

---

## Health Check

### Verificar estado del sistema
```bash
curl http://localhost:8000/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "polling_active": true
}
```

---

## Documentación Interactiva

FastAPI genera automáticamente documentación interactiva:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Desde allí puedes:
- Ver todos los endpoints
- Probar requests directamente
- Ver schemas de datos
- Descargar especificación OpenAPI
