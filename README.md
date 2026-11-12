# 🌍 Sistema Global de Monitoreo Sísmico con IA

<div align="center">

![Status](https://img.shields.io/badge/Estado-Activo-success?style=for-the-badge)
![License](https://img.shields.io/badge/Licencia-MIT-blue?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/IA-Powered-purple?style=for-the-badge)
![Real-time](https://img.shields.io/badge/Tiempo%20Real-WebSocket-red?style=for-the-badge)

**Sistema de monitoreo en tiempo real de eventos sísmicos globales con evaluación de impacto impulsada por inteligencia artificial**

[Características](#-características-principales) •
[Tecnologías](#-stack-tecnológico) •
[Instalación](#-instalación-rápida) •
[Arquitectura](#-arquitectura) •
[Documentación](#-documentación-detallada)

</div>

---

## 📋 Descripción

Sistema integral de monitoreo sísmico que combina datos en tiempo real del **USGS** (United States Geological Survey) con análisis de impacto impulsado por **inteligencia artificial** para proporcionar evaluaciones detalladas y transparentes de terremotos a nivel mundial.

El sistema procesa automáticamente eventos sísmicos, calcula radios de afectación geográfica, estima impactos por país (víctimas, daños económicos, nivel de destrucción), y muestra el **razonamiento completo de la IA** para cada decisión.

---

## 🎯 Características Principales

### Monitoreo y Datos
- ✅ **Ingesta Automática**: Polling del API de USGS cada 3 minutos para eventos mag ≥ 4.5
- ✅ **Tiempo Real**: WebSocket para notificaciones instantáneas de nuevos sismos
- ✅ **Base de Datos Completa**: Almacenamiento persistente en MariaDB con historial completo
- ✅ **Sincronización Total**: Mapa, tabla y filtros sincronizados en tiempo real

### Análisis con IA
- 🤖 **Evaluación de Impacto**: Modelos de Hugging Face (Qwen2.5-7B-Instruct)
- 🧠 **Razonamiento Transparente**: Explicación paso a paso de cómo la IA llegó a sus conclusiones
- 📊 **Factores Considerados**: Lista detallada de variables analizadas (magnitud, profundidad, densidad poblacional, códigos de construcción)
- 🏗️ **Contexto por País**: Evaluación específica de preparación sísmica y códigos de construcción

### Visualización
- 🗺️ **Mapa Interactivo**: Leaflet con marcadores de epicentros y círculos de radio de impacto
- 📋 **Tabla Completa**: Vista tabular de todos los eventos con ordenamiento y filtrado
- 🎨 **UI Moderna**: Interfaz con gradientes, animaciones y diseño responsive
- 📱 **Mobile-Friendly**: Optimizado para dispositivos móviles

### Estimaciones Inteligentes
- 💀 **Víctimas**: Muertes y heridos estimados por país
- 💰 **Daños Económicos**: Pérdidas monetarias en USD
- 🏚️ **Nivel de Destrucción**: Clasificación (BAJO, MODERADO, ALTO, CATASTRÓFICO)
- 🌆 **Ciudades Afectadas**: Lista de ciudades dentro del radio de impacto

---

## 🛠️ Stack Tecnológico

### Backend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| ![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python) | 3.11 | Lenguaje de programación principal |
| ![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi) | 0.104+ | Framework web asíncrono de alto rendimiento |
| ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0+-red?logo=sqlalchemy) | 2.0+ | ORM para gestión de base de datos |
| ![MariaDB](https://img.shields.io/badge/MariaDB-11-blue?logo=mariadb) | 11 | Base de datos relacional |
| ![Uvicorn](https://img.shields.io/badge/Uvicorn-0.24+-purple) | 0.24+ | Servidor ASGI |
| ![Hugging Face](https://img.shields.io/badge/HuggingFace-API-yellow?logo=huggingface) | API | Modelos de IA (Qwen2.5-7B-Instruct) |
| ![HTTPX](https://img.shields.io/badge/HTTPX-0.25+-orange) | 0.25+ | Cliente HTTP asíncrono |
| ![Pydantic](https://img.shields.io/badge/Pydantic-2.0+-pink) | 2.0+ | Validación de datos y settings |

**Dependencias clave:**
- `aiomysql` - Driver async para MySQL/MariaDB
- `python-dotenv` - Gestión de variables de entorno
- `python-dateutil` - Manejo de fechas y zonas horarias

### Frontend

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| ![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js) | 14.1.0 | Framework React con App Router |
| ![React](https://img.shields.io/badge/React-18-blue?logo=react) | 18 | Biblioteca UI |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript) | 5+ | Tipado estático y seguridad |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38bdf8?logo=tailwindcss) | 3.4+ | Framework CSS utility-first |
| ![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-green?logo=leaflet) | 1.9+ | Mapas interactivos |
| ![date-fns](https://img.shields.io/badge/date--fns-3.0+-purple) | 3.0+ | Manipulación de fechas |

**Dependencias clave:**
- `@types/*` - Definiciones de tipos TypeScript
- `eslint` - Linting y calidad de código

### Infraestructura

| Tecnología | Descripción |
|------------|-------------|
| ![Docker](https://img.shields.io/badge/Docker-20.10+-blue?logo=docker) | Contenedorización de servicios |
| ![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2.0+-blue?logo=docker) | Orquestación multi-contenedor |
| ![Nginx](https://img.shields.io/badge/Nginx-Proxy-green?logo=nginx) | Proxy reverso (producción) |

---

## 🚀 Instalación Rápida

### Prerrequisitos

```bash
# Verificar versiones
docker --version          # >= 20.10
docker compose version    # >= 2.0
```

**Obtener Token de Hugging Face**:
1. Crear cuenta en [HuggingFace](https://huggingface.co/)
2. Ir a [Settings → Tokens](https://huggingface.co/settings/tokens)
3. Crear un nuevo token de **lectura**

### Pasos de Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/Katapentakill/earthquake-impact-ai.git
cd earthquake-impact-ai
```

#### 2. Configurar variables de entorno

**IMPORTANTE:** El archivo `.env` contiene contraseñas y tokens. **NO está incluido en Git** por seguridad.

```bash
# Copiar archivo de ejemplo
copy .env.example .env

# Editar .env
notepad .env
```

⚠️ **Paso crítico para usuarios de dispositivos móviles:**

Si planeas usar la aplicación móvil en Expo Go:
1. Encuentra tu IP de PC: `ipconfig` → busca "IPv4 Address" (ej: 192.168.1.126)
2. Reemplaza `192.168.1.126` en `.env`:
   - `EXPO_PUBLIC_API_URL=http://tu-ip:8000/api`
   - `EXPO_PUBLIC_WEBSOCKET_URL=ws://tu-ip:8000/api/ws`
3. Reemplaza también en `docker-compose.yml` (sección `mobile:`)

Ver [DEPLOYMENT.md](DEPLOYMENT.md) para instrucciones detalladas.

Contenido del `.env`:
```env
# Hugging Face
HUGGINGFACE_API_TOKEN=<tu_token_de_huggingface>
HUGGINGFACE_MODEL=Qwen/Qwen2.5-7B-Instruct

# Base de datos (MariaDB)
MARIADB_ROOT_PASSWORD=cambia_esta_clave_root
MARIADB_DATABASE=seismic_db
MARIADB_USER=seismic_user
MARIADB_PASSWORD=cambia_esta_clave
MARIADB_HOST=db
MARIADB_PORT=3306

# Backend API
USGS_API_URL=https://earthquake.usgs.gov/fdsnws/event/1/query
POLLING_INTERVAL_SECONDS=180
FASTAPI_HOST=0.0.0.0
FASTAPI_PORT=8000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### 3. Iniciar servicios
```bash
docker compose up -d
```

Este comando iniciará:
- 🐳 **MariaDB** en puerto `3306`
- 🚀 **Backend FastAPI** en puerto `8000`
- ⚛️ **Frontend Next.js** en puerto `3000`

#### 4. Verificar estado
```bash
docker compose ps
```

Salida esperada:
```
NAME               STATUS      PORTS
seismic_mariadb    healthy     0.0.0.0:3306->3306/tcp
seismic_backend    up          0.0.0.0:8000->8000/tcp
seismic_frontend   up          0.0.0.0:3000->3000/tcp
```

#### 5. Acceder a la aplicación

- 🌐 **Frontend**: http://localhost:3000
- 📡 **API**: http://localhost:8000
- 📚 **Documentación API**: http://localhost:8000/docs
- 🔌 **WebSocket**: ws://localhost:8000/ws

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUARIO                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js + TypeScript)                │
│  ┌───────────────┬───────────────┬──────────────────────────┐   │
│  │ Mapa Leaflet  │ Tabla         │ Panel de Impacto         │   │
│  │ - Epicentros  │ - Todos los   │ - Razonamiento IA        │   │
│  │ - Radios      │   eventos     │ - Factores considerados  │   │
│  │ - Interactivo │ - Filtrable   │ - Códigos construcción   │   │
│  └───────────────┴───────────────┴──────────────────────────┘   │
│           │ REST API (HTTP)  │ WebSocket (WS)                   │
└───────────┼──────────────────┼──────────────────────────────────┘
            │                  │
            ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 BACKEND (FastAPI + Python)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API REST + WebSocket                  │    │
│  │  - GET /api/events (lista, filtros)                     │    │
│  │  - GET /api/events/{id} (detalles + impactos)           │    │
│  │  - GET /api/events/stats/summary (estadísticas)         │    │
│  │  - WS /ws (notificaciones en tiempo real)               │    │
│  └──────────────────────┬──────────────────────────────────┘    │
│                         │                                        │
│  ┌──────────────────────┴──────────────────────────────────┐    │
│  │            SERVICIOS DE PROCESAMIENTO                    │    │
│  │                                                           │    │
│  │  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐ │    │
│  │  │ USGS Poller     │  │ Radius Calc  │  │ IA Client  │ │    │
│  │  │ (cada 3 min)    │→ │ - Magnitud   │→ │ HuggingFace│ │    │
│  │  │ - Fetch nuevos  │  │ - Profundidad│  │ - Qwen2.5  │ │    │
│  │  │ - Mag >= 4.5    │  │ - Fórmula    │  │ - Reasoning│ │    │
│  │  └─────────────────┘  └──────────────┘  └────────────┘ │    │
│  │                                                           │    │
│  │  ┌───────────────────────────────────────────────────┐  │    │
│  │  │      Procesador de Eventos Sísmicos               │  │    │
│  │  │  1. Recibe datos USGS                             │  │    │
│  │  │  2. Calcula radio de impacto                      │  │    │
│  │  │  3. Solicita análisis IA                          │  │    │
│  │  │  4. Guarda en BD (evento + impactos)              │  │    │
│  │  │  5. Notifica vía WebSocket                        │  │    │
│  │  └───────────────────────────────────────────────────┘  │    │
│  └──────────────────────┬──────────────────────────────────┘    │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS (MariaDB 11)                     │
│  ┌──────────────────────────┬──────────────────────────────┐    │
│  │  eventos_sismicos (PK)   │  impactos_pais (FK)          │    │
│  │  - event_id              │  - event_id ───────┐         │    │
│  │  - magnitud              │  - pais             │         │    │
│  │  - profundidad           │  - ciudades_afectadas        │    │
│  │  - latitud/longitud      │  - muertes_estimadas         │    │
│  │  - fecha_utc             │  - heridos_estimados         │    │
│  │  - lugar                 │  - perdidas_monetarias_usd   │    │
│  │  - radio_afectacion_km   │  - nivel_destruccion         │    │
│  │  - fuente_api (USGS)     │  - razonamiento_ia ⭐        │    │
│  │                          │  - factores_considerados ⭐  │    │
│  │                          │  - codigo_construccion ⭐    │    │
│  └──────────────────────────┴──────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────┴───────────┐
                    │                        │
                    ▼                        ▼
          ┌──────────────────┐    ┌──────────────────┐
          │   USGS API       │    │  Hugging Face    │
          │   (earthquake    │    │  Inference API   │
          │    catalog)      │    │  (Qwen2.5-7B)    │
          └──────────────────┘    └──────────────────┘
```

### Flujo de Datos Detallado

1. **Ingesta (cada 3 minutos)**
   - USGS Poller consulta el API de USGS
   - Filtra eventos con magnitud >= 4.5
   - Detecta eventos nuevos (no existentes en BD)

2. **Procesamiento**
   - Calcula radio de impacto: `radio = 10 * (mag^2.5) * ajuste_profundidad`
   - Crea registro en tabla `eventos_sismicos`

3. **Análisis con IA**
   - Construye prompt con datos del evento
   - Solicita a Hugging Face análisis de impacto
   - IA retorna JSON con:
     - Países y ciudades afectadas
     - Estimaciones (muertes, heridos, daños USD)
     - **Razonamiento**: Explicación paso a paso
     - **Factores considerados**: Variables analizadas
     - **Código de construcción**: Info específica del país

4. **Almacenamiento**
   - Guarda impactos en tabla `impactos_pais`
   - Relación FK: `event_id`

5. **Notificación**
   - Envía mensaje WebSocket a clientes conectados
   - Frontend actualiza automáticamente

6. **Visualización**
   - Usuario consulta vía REST API
   - Tabla muestra todos los eventos
   - Mapa renderiza epicentros y radios
   - Panel muestra impactos con razonamiento IA

---

## 📖 Documentación Detallada

- **[📘 Backend README](backend/README.md)** - Arquitectura, servicios, modelos, API
- **[📗 Frontend README](frontend/README.md)** - Componentes, estructura, UI/UX
- **[📕 API Documentation](http://localhost:8000/docs)** - Swagger UI interactivo (cuando los servicios estén corriendo)
- **[📙 Deployment Guide](DEPLOYMENT.md)** - Configuración multi-dispositivo, WiFi LAN, producción
- **[📔 Environment Variables](.env.example)** - Plantilla de configuración con explicaciones

---

## 🎮 Uso del Sistema

### Panel de Filtros
- **Rango de magnitud**: Deslizadores para min/max
- **Rango de fechas**: Selector de fechas inicio/fin
- **Filtros rápidos**:
  - Últimas 24 horas
  - Últimos 7 días
  - Magnitud >= 6.0

### Mapa Interactivo
- **Marcadores**: Cada evento es un círculo con color según magnitud
  - 🔴 Rojo: Mag >= 8.0 (Catastrófico)
  - 🟠 Naranja: Mag 7.0-7.9 (Alto)
  - 🟡 Amarillo: Mag 6.0-6.9 (Moderado)
  - 🟢 Verde: Mag 5.0-5.9 (Bajo)
  - 🔵 Azul: Mag < 5.0 (Menor)
- **Círculos de radio**: Área de impacto calculada
- **Click**: Selecciona evento y muestra detalles

### Tabla de Eventos
- **Columnas**: ID, Ubicación, Fecha, Magnitud, Profundidad, Radio, Coordenadas
- **Selección**: Click en fila para ver detalles
- **Sincronización**: Eventos seleccionados en tabla se reflejan en mapa
- **Estadísticas**: Footer con totales y promedios

### Panel de Impacto
Cuando seleccionas un evento, verás:
- **Resumen**: Total de muertes, heridos y pérdidas económicas
- **Por país**:
  - Ciudades afectadas
  - Estimaciones detalladas
  - Nivel de destrucción
  - 🏗️ **Código de construcción**
  - 🧠 **Razonamiento de IA**: Explicación completa
  - 📋 **Factores considerados**: Lista de variables
  - 📊 **Fuentes de datos**: Referencias utilizadas

---

## 🔧 Comandos Útiles

### Docker

```bash
# Ver logs en tiempo real
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Reiniciar servicios
docker compose restart backend
docker compose restart frontend

# Reconstruir contenedores
docker compose build backend
docker compose build frontend

# Detener todo
docker compose down

# Detener y eliminar volúmenes (⚠️ borra la BD)
docker compose down -v

# Ver estado de contenedores
docker compose ps
```

### Base de Datos

```bash
# Conectarse a MariaDB
docker compose exec db mariadb -useismic_user -p seismic_db

# Consultas útiles
SELECT COUNT(*) FROM eventos_sismicos;
SELECT * FROM eventos_sismicos ORDER BY fecha_utc DESC LIMIT 10;
SELECT pais, SUM(muertes_estimadas) FROM impactos_pais GROUP BY pais;

# Exportar datos
docker compose exec db mariadb-dump -useismic_user -p seismic_db > backup.sql
```

### API (curl)

```bash
# Listar eventos
curl http://localhost:8000/api/events/

# Evento específico
curl http://localhost:8000/api/events/us6000rhzq

# Filtrar por magnitud
curl "http://localhost:8000/api/events/?min_magnitude=6.0"

# Estadísticas
curl http://localhost:8000/api/events/stats/summary?days=30

# Forzar procesamiento
curl -X POST http://localhost:8000/api/events/process
```

---

## 🌟 Características Avanzadas

### 1. Razonamiento Transparente de IA

Cada evaluación de impacto incluye:

```json
{
  "razonamiento_ia": "Magnitude 5.0 at 39.8km depth. Applied -30% for deep earthquake. Taiwan has strict building codes (2001 law). Low population density in rural areas (Hualien) but urban areas nearby. Historical data shows similar quakes (2016, 5.8 mag, 2 injuries) with minimal impact due to good infrastructure. Adjusted estimates: base 150 deaths * 0.7 (depth) * 0.8 (prep) * 1.0 (density) = 84 deaths, rounded to 100 considering uncertainties.",

  "factores_considerados": [
    "Magnitude 5.0 - light",
    "Depth 39.8km - reduced surface impact",
    "Urban area nearby - Hualien",
    "Strict building codes - 2001 law",
    "Historical pattern - 2016 reference",
    "Low population density - rural Hualien"
  ],

  "codigo_construccion": "Alta (Taiwan Earthquake and Tsunami Mitigation Law 2001)"
}
```

### 2. Cálculo Dinámico de Radio de Impacto

```python
# Fórmula base
radio_base = 10 * (magnitud ** 2.5)

# Ajuste por profundidad (terremotos profundos impactan menos la superficie)
ajuste_profundidad = max(0.3, 1 - (profundidad / 500))

# Radio final
radio_km = radio_base * ajuste_profundidad
```

Ejemplos:
- Mag 5.0, Prof 10km → Radio ~551 km
- Mag 6.0, Prof 50km → Radio ~1301 km
- Mag 7.0, Prof 100km → Radio ~2846 km

### 3. Auto-Actualización cada 3 Minutos

- **Backend**: Polling del USGS cada 3 minutos
- **Frontend**: WebSocket + polling como backup
- **Sin intervención manual**: Sistema completamente automático

---

## 🛡️ Seguridad

- ✅ Variables de entorno para secrets (`.env` no versionado)
- ✅ Validación de datos con Pydantic
- ✅ Queries parametrizadas (SQLAlchemy ORM previene SQL injection)
- ✅ CORS configurado correctamente
- ✅ Sin exposición de tokens en frontend
- ✅ Health checks en contenedores Docker

---

## 📈 Roadmap Futuro

### Próximas Funcionalidades
- [ ] Exportación de tabla a CSV/Excel
- [ ] Paginación de tabla para grandes volúmenes
- [ ] Ordenamiento de columnas (click en headers)
- [ ] Búsqueda por texto (ubicación, Event ID)
- [ ] Notificaciones push para eventos críticos (Mag > 7.0)
- [ ] Comparación histórica de eventos similares
- [ ] Dashboard administrativo
- [ ] API pública con autenticación JWT
- [ ] Soporte multi-idioma (EN/ES/FR)
- [ ] Machine Learning para mejora continua de estimaciones

### Optimizaciones Técnicas
- [ ] Rate limiting en API
- [ ] Cache de respuestas frecuentes (Redis)
- [ ] Compresión de respuestas (gzip)
- [ ] CDN para assets estáticos
- [ ] Tests unitarios y de integración
- [ ] CI/CD con GitHub Actions

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor sigue estos pasos:

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/NuevaCaracteristica`
3. Commit tus cambios: `git commit -m 'Add: nueva característica X'`
4. Push a la rama: `git push origin feature/NuevaCaracteristica`
5. Abre un Pull Request

### Guías de Estilo
- **Python**: PEP 8, type hints, docstrings
- **TypeScript**: ESLint config, interfaces para tipos
- **Commits**: Conventional Commits (feat, fix, docs, refactor)

---

## 🐛 Troubleshooting

### Error: "Backend no conecta a BD"
```bash
# Verificar estado de MariaDB
docker compose ps db

# Ver logs
docker compose logs db --tail 50

# Reiniciar
docker compose restart db
```

### Error: "Frontend no carga el mapa"
```bash
# Limpiar caché de Next.js
docker compose exec frontend rm -rf .next

# Reconstruir
docker compose restart frontend
```

### Error: "No aparecen eventos"
El sistema busca eventos con magnitud >= 4.5. Ajusta en `backend/app/config.py`:
```python
min_magnitude_threshold: float = 4.0  # Cambiar aquí
```

### Error: "IA tarda mucho / timeout"
El primer request puede tardar 20-30s (cold start de modelo). Considera:
- Usar modelo más ligero: `HUGGINGFACE_MODEL=google/flan-t5-large`
- Aumentar timeout en `backend/app/inference/huggingface_client.py`

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autores

- **Alexander Tapia Olmedo** - *Desarrollo completo* - [GitHub](https://github.com/Katapentakill)

---

## 🙏 Agradecimientos

- **[USGS](https://earthquake.usgs.gov/)** - Datos sísmicos en tiempo real
- **[Hugging Face](https://huggingface.co/)** - Modelos de IA open source
- **[OpenStreetMap](https://www.openstreetmap.org/)** - Mapas base
- **[Leaflet](https://leafletjs.com/)** - Biblioteca de mapas interactivos
- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework backend moderno
- **[Next.js](https://nextjs.org/)** - Framework React de producción

---

## 📞 Soporte y Contacto

¿Necesitas ayuda o tienes preguntas?

- 💼 **Contacto**: [LinkedIn](https://www.linkedin.com/in/alexander-gubier-oscar-tapia-olmedo-10aa3725b)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Katapentakill/earthquake-impact-ai/issues)

---

<div align="center">

**⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub ⭐**

**Desarrollado con ❤️ y mucho ☕**

![Made with Love](https://img.shields.io/badge/Made%20with-❤️-red?style=for-the-badge)
![Coffee](https://img.shields.io/badge/Powered%20by-☕-brown?style=for-the-badge)

</div>
