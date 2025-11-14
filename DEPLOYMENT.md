# 🚀 Deployment & Multi-Device Configuration Guide

Este documento explica cómo configurar el proyecto para ejecutarse en diferentes dispositivos y redes.

## 📋 Tabla de Contenidos

1. [Configuración Inicial](#configuración-inicial)
2. [Entender la Arquitectura de Red](#entender-la-arquitectura-de-red)
3. [Configuración para Diferentes Dispositivos](#configuración-para-diferentes-dispositivos)
4. [Solución de Problemas](#solución-de-problemas)

---

## Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/seismic-impact-monitor.git
cd seismic-impact-monitor
```

### 2. Crear el Archivo `.env`

**El archivo `.env` NO está incluido en el repositorio por razones de seguridad** (contiene tokens y contraseñas).

Debes crear el archivo manualmente:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 3. Obtener Token de Hugging Face

1. Ir a [huggingface.co](https://huggingface.co/)
2. Crear cuenta (si no tienes)
3. Ir a [Settings → Tokens](https://huggingface.co/settings/tokens)
4. Crear un nuevo token de **lectura**
5. Copiar el token y pegarlo en `.env`:

```env
HUGGINGFACE_API_TOKEN=hf_tu_token_aqui
```

### 4. Iniciar Docker Compose

```bash
docker compose up -d
```

Esto iniciará 4 contenedores:
- `seismic_mariadb` - Base de datos (puerto 3306)
- `seismic_backend` - FastAPI (puerto 8000)
- `seismic_frontend` - Next.js (puerto 3000)
- `seismic_mobile` - Expo/React Native (puerto 8081)

---

## Entender la Arquitectura de Red

### El Problema: Docker Service Names vs IP Addresses

Cuando ejecutas Docker, los contenedores pueden comunicarse entre sí usando **nombres de servicio** (ej: `backend`, `db`). Pero cuando accedes desde FUERA de Docker (como un navegador en tu PC o una app en tu teléfono), esos nombres no funcionan.

```
┌─────────────────────────────────────┐
│        Docker Network               │
│                                     │
│  ┌──────────┐      ┌──────────┐   │
│  │ backend  │      │    db    │   │
│  │ :8000   │◄────►│ :3306    │   │
│  └──────────┘      └──────────┘   │
│    (Funciona!)                     │
│                                     │
└─────────────────────────────────────┘
         ▲
         │ Acceso EXTERNO
         │ (NO funciona "backend:8000")
         │ (SÍ funciona "192.168.1.126:8000")
         │
    ┌────┴────┐
    │ Tu PC   │
    └─────────┘
```

### Los 3 Escenarios

#### Escenario 1: Backend (Docker) → Base de Datos (Docker)
**Funciona con:** `http://db:3306`
**Porque:** Ambos están dentro de la red Docker

#### Escenario 2: Frontend (Docker) → Backend (Docker)
**Funciona con:** `http://backend:8000`
**Porque:** Ambos están dentro de la red Docker

#### Escenario 3: Mobile App (Tu Teléfono) → Backend (Docker)
**NO funciona con:** `http://backend:8000`
**Funciona con:** `http://192.168.1.126:8000`
**Porque:** El teléfono está FUERA de la red Docker, necesita tu dirección IP real

---

## Configuración para Diferentes Dispositivos

### Encontrar tu Dirección IP de PC

#### En Windows:
```bash
ipconfig
```

Busca en la salida:
```
Adaptador de Ethernet / Adaptador inalámbrico:
  Configuración IPv4 . . . . . . . . : 192.168.1.XXX  ← ESTA ES TU IP
```

#### En macOS/Linux:
```bash
ifconfig
```

Busca `inet` bajo tu adaptador de red (ej: `en0`, `wlan0`):
```
en0: flags=8863...
    inet 192.168.1.XXX netmask 0xffffff00  ← ESTA ES TU IP
```

---

### 📱 Configuración para Aplicación Móvil (Expo Go)

#### Requisitos:
- ✅ Teléfono y PC en la **misma red WiFi**
- ✅ Firewall permite puerto 8000 y 8081
- ✅ Tu PC IP es conocida (ej: 192.168.1.126)

#### Pasos:

**1. Encuentra tu IP de PC**
```bash
# Windows
ipconfig
```

**2. Abre `.env` y actualiza:**
```env
# Reemplaza 192.168.1.126 con tu IP real
EXPO_PUBLIC_API_URL=http://192.168.1.126:8000/api
EXPO_PUBLIC_WEBSOCKET_URL=ws://192.168.1.126:8000/api/ws
```

**3. Abre `docker-compose.yml` y actualiza también:**

Busca la sección `mobile:` y reemplaza:
```yaml
mobile:
  ...
  environment:
    EXPO_PUBLIC_API_URL: "http://192.168.1.126:8000/api"         # ← CAMBIAR IP
    EXPO_PUBLIC_WEBSOCKET_URL: "ws://192.168.1.126:8000/api/ws"  # ← CAMBIAR IP
    REACT_NATIVE_PACKAGER_HOSTNAME: "192.168.1.126"               # ← CAMBIAR IP
    EXPO_PACKAGER_HOSTNAME: "192.168.1.126"                       # ← CAMBIAR IP
```

**4. Reinicia el servicio móvil:**
```bash
docker compose down mobile
docker compose up -d --build mobile
```

**5. Abre Expo Go en tu teléfono:**
- Descarga [Expo Go](https://expo.dev/clients) desde App Store o Google Play
- Abre la app
- Escanea el código QR que aparece en los logs:
```bash
docker logs seismic_mobile
```

---

### 💻 Configuración para Desarrollo Local (Sin Docker)

Si quieres ejecutar el frontend o mobile **sin Docker**:

#### Frontend (Next.js):
```bash
cd frontend
npm install
# En .env.local o variables de entorno:
NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# Abierto en http://localhost:3000
```

#### Mobile (React Native):
```bash
cd mobile
npm install
# En .env o variables de entorno:
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_WEBSOCKET_URL=ws://localhost:8000/api/ws

npm start -- --lan
# Escanea el QR con Expo Go
```

---

### 🌍 Configuración para Producción

Para desplegar en un servidor remoto (ej: AWS, DigitalOcean):

**1. Actualiza las URLs en `.env`:**
```env
# Para frontend (en la red Docker)
NEXT_PUBLIC_API_URL=http://backend:8000

# Para móvil (desde internet)
EXPO_PUBLIC_API_URL=https://tu-dominio.com:8000/api
EXPO_PUBLIC_WEBSOCKET_URL=wss://tu-dominio.com:8000/api/ws
```

**2. Configura CORS en `.env`:**
```env
CORS_ORIGINS=https://tu-dominio.com,https://www.tu-dominio.com,http://localhost:3000
```

**3. Actualiza `docker-compose.yml`:**
```yaml
frontend:
  environment:
    NEXT_PUBLIC_API_URL: https://tu-dominio.com

mobile:
  environment:
    EXPO_PUBLIC_API_URL: https://tu-dominio.com:8000/api
    EXPO_PUBLIC_WEBSOCKET_URL: wss://tu-dominio.com:8000/api/ws
```

---

## Solución de Problemas

### ❌ Error: "Unable to connect to http://backend:8000/api"

**Causa:** La app móvil intenta conectar con el nombre de servicio Docker, que no existe fuera de Docker.

**Solución:**
1. Verifica tu IP real: `ipconfig`
2. Reemplaza `192.168.1.126` con tu IP en `.env` y `docker-compose.yml`
3. Reinicia mobile: `docker compose restart mobile`

### ❌ Error: "Network request failed" en teléfono

**Causa:** Teléfono e IP no están en la misma red, o firewall bloquea puerto.

**Solución:**
```bash
# 1. Verifica que estén en la misma red WiFi
ipconfig  # Ver IP de PC
# En teléfono, Settings → WiFi, debe ser la misma red

# 2. Verifica conectividad
ping <tu-ip>  # Desde PC hacia teléfono (requiere apps adicionales)
# O simplemente intenta acceder desde navegador del teléfono:
# http://192.168.1.126:8000/docs
```

### ❌ Error: "Metro bundler not connecting"

**Causa:** `REACT_NATIVE_PACKAGER_HOSTNAME` es incorrecto.

**Solución:**
```bash
# En docker-compose.yml, asegúrate que:
REACT_NATIVE_PACKAGER_HOSTNAME: "192.168.1.126"  # Tu IP real
EXPO_PACKAGER_HOSTNAME: "192.168.1.126"
```

### ❌ Error: "MARIADB_USER not found"

**Causa:** Variables de entorno mal configuradas.

**Solución:**
```bash
# En .env, asegúrate de tener:
MARIADB_USER=seismic_user         # NO "MYSQL_USER"
MARIADB_PASSWORD=seismic_password_2025
MARIADB_DATABASE=seismic_db

# Luego reinicia:
docker compose down
docker compose up -d
```

### ❌ Error: "Hugging Face token invalid"

**Causa:** Token no válido o sin permiso de lectura.

**Solución:**
1. Ve a [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Verifica que tengas un token de **lectura**
3. Cópialo exactamente (sin espacios): `hf_ZXeipzyUG...`
4. Pégalo en `.env`: `HUGGINGFACE_API_TOKEN=hf_ZXeipzyUG...`
5. Reinicia backend: `docker compose restart backend`

---

## 📝 Checklist de Configuración

Antes de ejecutar en un nuevo dispositivo:

- [ ] Archivo `.env` creado (copia de `.env.example`)
- [ ] Token Hugging Face agregado a `.env`
- [ ] Tu IP de PC identificada con `ipconfig`
- [ ] IP reemplazada en `.env`:
  - `EXPO_PUBLIC_API_URL`
  - `EXPO_PUBLIC_WEBSOCKET_URL`
- [ ] IP reemplazada en `docker-compose.yml` (sección `mobile:`)
- [ ] Teléfono en la misma red WiFi que PC
- [ ] Docker running: `docker compose up -d`
- [ ] Verificar logs: `docker compose logs -f mobile`

---

## 🔗 Referencias Rápidas

| Componente | Dentro de Docker | Fuera de Docker |
|-----------|------------------|-----------------|
| Backend → DB | `db:3306` | N/A |
| Frontend → Backend | `backend:8000` | `http://localhost:8000` |
| Mobile → Backend | ❌ NO! | `http://192.168.1.126:8000` |
| Browser → Frontend | N/A | `http://localhost:3000` |
| Browser → API | N/A | `http://localhost:8000/docs` |

---

## 📖 Documentación Relacionada

- [README.md](README.md) - Descripción general del proyecto
- [Backend README](backend/README.md) - Documentación del backend
- [Frontend README](frontend/README.md) - Documentación del frontend
- [.env.example](.env.example) - Plantilla de variables de entorno

---

**Última actualización:** Noviembre 2025
**Estado:** Totalmente funcional ✅
