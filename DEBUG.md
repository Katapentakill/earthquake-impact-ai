# 🔍 Debugging Guide - Monitoreo del Sistema Sísmico

Este documento explica cómo verificar que:
1. ✅ Los datos persisten aunque reinicies Docker
2. ✅ La API de USGS se está llamando cada 3 minutos
3. ✅ Los terremotos nuevos se están procesando

---

## 📊 Problema Resuelto

### Antes ❌
- Sin volumen → Datos se perdían al reiniciar
- Sin logging → No había forma de saber si la API se llamaba
- Sin visibilidad → ¿Se estaban procesando terremotos?

### Ahora ✅
- **Volumen persistente** → Datos permanecen incluso si bajas el contenedor
- **Logging detallado** → Puedes ver cada poll de USGS en la consola y archivos
- **Endpoints de salud** → Endpoints para verificar que está corriendo

---

## 🚀 Cómo Empezar

### 1. Reconstruir y Reiniciar con Volúmenes

```bash
# Detener los servicios
docker compose down

# Reconstruir sin eliminar volúmenes
docker compose up -d --build

# Verificar que todo inició correctamente
docker compose ps
```

Expected output:
```
NAME                   STATUS      PORTS
seismic_mariadb        healthy     0.0.0.0:3306->3306/tcp
seismic_backend        up          0.0.0.0:8000->8000/tcp
seismic_frontend       up          0.0.0.0:3000->3000/tcp
seismic_mobile         up          0.0.0.0:8081->8081/tcp
```

---

## 🔎 Verificar Que el Polling Está Activo

### Opción 1: Endpoint de Salud (Más Rápido)

```bash
# Verificar estado del polling
curl http://localhost:8000/polling-status

# Output esperado:
# {
#   "polling_active": true,
#   "message": "✅ Polling is ACTIVE and running",
#   "polling_interval_seconds": 180,
#   "description": "USGS API is checked every 180 seconds for new earthquakes with magnitude >= 4.5",
#   "log_file": "/app/logs/seismic_system_2025-11-21.log"
# }
```

### Opción 2: Ver Logs en Tiempo Real

```bash
# Ver logs del backend en vivo
docker compose logs -f backend

# Output esperado (cada 3 minutos):
# ================================================================================
# 🌍 EARTHQUAKE POLLING TASK STARTED
#    Polling interval: 180 seconds
#    Minimum magnitude threshold: 4.5
#    USGS API: https://earthquake.usgs.gov/fdsnws/event/1/query
# ================================================================================
#
# ────────────────────────────────────────────────────────────────────────────
# 📡 POLL #1 - 2025-11-21 10:30:45
#    Querying USGS API for new earthquakes (mag >= 4.5)...
#    ℹ️  No new earthquakes found in 1.23s
#    Next poll in 180 seconds
# ────────────────────────────────────────────────────────────────────────────
#
# ────────────────────────────────────────────────────────────────────────────
# 📡 POLL #2 - 2025-11-21 10:33:45
#    Querying USGS API for new earthquakes (mag >= 4.5)...
#    ✅ SUCCESS: Processed 1 new earthquake(s) in 2.15s
#       [1] Event: us1000lll1 | Magnitude: 5.2 | Location: 23 km NE of Anchorage, Alaska
#       [1] WebSocket notification sent
#    Next poll in 180 seconds
# ────────────────────────────────────────────────────────────────────────────
```

### Opción 3: Ver Archivo de Log Persistente

El archivo se guarda en un volumen Docker y persiste entre reinicios:

```bash
# Ver los logs guardados (inside the container)
docker compose exec backend cat /app/logs/seismic_system_2025-11-21.log

# O desde tu PC (si tienes acceso a Docker volumes)
docker volume inspect seismic_backend_logs
```

---

## 📈 Interpretar los Logs

### Cuando hay un terremoto nuevo ✅

```
📡 POLL #5 - 2025-11-21 10:45:00
   Querying USGS API for new earthquakes (mag >= 4.5)...
   ✅ SUCCESS: Processed 2 new earthquake(s) in 1.84s
      [1] Event: us1000mmm1 | Magnitude: 5.8 | Location: 45 km E of Tokyo, Japan
      [1] WebSocket notification sent
      [2] Event: us1000mmm2 | Magnitude: 4.9 | Location: 12 km SW of Istanbul, Turkey
      [2] WebSocket notification sent
   Next poll in 180 seconds
```

**Significa:**
- ✅ USGS API respondió exitosamente
- ✅ Se encontraron 2 terremotos nuevos
- ✅ Se procesaron con IA (impactos calculados)
- ✅ Se notificó a clientes WebSocket

### Cuando no hay terremotos nuevos ℹ️

```
📡 POLL #3 - 2025-11-21 10:36:45
   Querying USGS API for new earthquakes (mag >= 4.5)...
   ℹ️  No new earthquakes found in 0.95s
   Next poll in 180 seconds
```

**Significa:**
- ✅ USGS API respondió exitosamente
- ℹ️ Pero no hay terremotos nuevos en las últimas 24 horas con mag >= 4.5
- ✅ Sistema está funcionando correctamente

### Cuando hay error ❌

```
📡 POLL #2 - 2025-11-21 10:33:45
   Querying USGS API for new earthquakes (mag >= 4.5)...
   ❌ ERROR in polling task: Connection timeout
   ❌ USGS API Error: Failed to fetch earthquakes from USGS: [Errno -2] Name or service not known
   Retrying in 180 seconds...
```

**Significa:**
- ❌ Error de conexión a USGS (probablemente internet)
- ✅ El sistema reintentar automáticamente
- 💡 Verifica tu conexión a internet

---

## 💾 Verificar Que los Datos Persisten

### Test 1: Reiniciar Docker y Verificar Datos

```bash
# 1. Ver cuántos eventos hay ahora
curl http://localhost:8000/api/events/?limit=1 | jq '.total'
# Output: 15

# 2. Detener todos los contenedores (pero NO eliminar volúmenes)
docker compose down

# 3. Volver a iniciar
docker compose up -d

# 4. Verificar que los datos siguen ahí
curl http://localhost:8000/api/events/?limit=1 | jq '.total'
# Output: 15  ✅ (Los datos persisten!)

# 5. Si hubiera eliminado volúmenes (docker compose down -v)
# Output: 0  ❌ (Datos perdidos - por eso NO usar -v)
```

### Test 2: Verificar Base de Datos Directamente

```bash
# Conectarse a MariaDB dentro del contenedor
docker compose exec db mariadb -u seismic_user -pseismic_password_2025 seismic_db

# Ver cuántos eventos hay
SELECT COUNT(*) as total_eventos FROM eventos_sismicos;

# Ver eventos más recientes
SELECT event_id, magnitud, fecha_utc, lugar FROM eventos_sismicos ORDER BY fecha_utc DESC LIMIT 5;

# Salir de MariaDB
exit
```

---

## 🧪 Test Manual del Polling

Si quieres simular un terremoto para probar:

### Opción 1: Esperar 3 minutos
Los logs mostrarán automáticamente cada poll. Espera a que aparezca un "POLL #X".

### Opción 2: Cambiar el Intervalo de Polling (Para testing)

En `.env`:
```env
# ANTES: Cada 180 segundos
POLLING_INTERVAL_SECONDS=180

# CAMBIAR A: Cada 30 segundos (para testing)
POLLING_INTERVAL_SECONDS=30
```

Luego reinicia:
```bash
docker compose restart backend
```

Ahora verás "POLL #1, #2, #3..." cada 30 segundos en lugar de cada 3 minutos.

---

## 📡 Endpoints Útiles para Debugging

### 1. Health Check General
```bash
curl http://localhost:8000/health

# Output:
{
  "status": "healthy",
  "timestamp": "2025-11-21T10:45:30.123456",
  "polling": {
    "active": true,
    "interval_seconds": 180,
    "min_magnitude": 4.5
  },
  "database": {
    "host": "db",
    "database": "seismic_db"
  },
  "api": {
    "usgs": "https://earthquake.usgs.gov/fdsnws/event/1/query"
  }
}
```

### 2. Status de Polling
```bash
curl http://localhost:8000/polling-status

# Output:
{
  "polling_active": true,
  "message": "✅ Polling is ACTIVE and running",
  "polling_interval_seconds": 180,
  "description": "USGS API is checked every 180 seconds...",
  "log_file": "/app/logs/seismic_system_2025-11-21.log"
}
```

### 3. Listar Eventos
```bash
# Todos los eventos
curl http://localhost:8000/api/events/?limit=100

# Eventos recientes (últimos 7 días)
curl "http://localhost:8000/api/events/?limit=100&days=7"

# Con filtros
curl "http://localhost:8000/api/events/?min_magnitude=5.0&limit=50"
```

### 4. Detalles de un Evento Específico
```bash
curl http://localhost:8000/api/events/us1000mmm1

# Verás impactos calculados por IA, razonamiento, factores considerados, etc.
```

---

## 🔧 Troubleshooting

### Problema: "Polling no está activo"

**Diagnóstico:**
```bash
# Verificar estado
curl http://localhost:8000/polling-status

# Si dice: "polling_active": false
```

**Solución:**
```bash
# Ver logs del error
docker compose logs backend | tail -50

# Si ves errores de conexión a BD:
docker compose logs db | tail -20

# Reiniciar backend
docker compose restart backend

# Verificar que BD está healthy
docker compose ps db  # Debe decir "healthy"
```

### Problema: "Logs muy grandes"

Los logs se guardan diariamente. Si ocupan mucho espacio:

```bash
# Ver tamaño de logs
docker volume inspect seismic_backend_logs

# Limpiar logs antiguos (desde dentro del contenedor)
docker compose exec backend sh -c "rm /app/logs/*.log"

# O mejor: configura rotación de logs
# (Agregando logrotate al contenedor)
```

### Problema: "Los datos se perdieron después de reiniciar"

```bash
# NUNCA usar: docker compose down -v
# El -v elimina los volúmenes (datos se pierden)

# CORRECTO:
docker compose down          # Datos persisten
docker compose up -d         # Reconstruir

# INCORRECTO:
docker compose down -v       # ⚠️ Elimina volúmenes
```

---

## 📝 Resumen del Sistema de Logging

| Componente | Dónde Ver | Frecuencia | Propósito |
|-----------|-----------|-----------|----------|
| **Console** | `docker compose logs -f backend` | En tiempo real | Debugging rápido |
| **Archivo** | `/app/logs/seismic_system_YYYY-MM-DD.log` | Persistente | Auditoría, historial |
| **Endpoint** | `GET /polling-status` | On-demand | Estado actual |
| **Health** | `GET /health` | On-demand | Salud general sistema |
| **Base de Datos** | `SELECT FROM eventos_sismicos` | Directa | Verificar persistencia |

---

## ✅ Checklist de Verificación

- [ ] Volumen `backend_logs` existe: `docker volume ls | grep backend_logs`
- [ ] Logs se guardan: `docker compose exec backend ls -la /app/logs/`
- [ ] Polling está activo: `curl http://localhost:8000/polling-status`
- [ ] Datos persisten después de `docker compose down` (sin -v)
- [ ] Cada 3 minutos aparece "POLL #X" en los logs
- [ ] Si hay terremotos, ve "✅ SUCCESS: Processed X earthquake(s)"
- [ ] Puedes acceder a los datos vía API: `curl http://localhost:8000/api/events/`

---

## 🆘 Necesitas Más Ayuda?

Si algo no funciona como se describe:

1. **Revisa los logs:**
   ```bash
   docker compose logs backend 2>&1 | grep -i "error"
   ```

2. **Verifica la conexión a USGS:**
   ```bash
   curl -I "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
   # Debe responder 200 OK
   ```

3. **Verifica la base de datos:**
   ```bash
   docker compose exec db mariadb -u seismic_user -pseismic_password_2025 seismic_db -e "SHOW TABLES;"
   ```

---

**Última actualización:** Noviembre 2025
**Estado:** ✅ Sistema completamente monitoreable
