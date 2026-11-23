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
4. Crear un nuevo token con el preset **Inference** («Make calls to Inference Providers»)
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
**Funciona con:** `http://<IP de tu PC>:8000`
**Porque:** El teléfono está FUERA de la red Docker, necesita la dirección real de tu PC en la red local.
**La app la deduce sola:** toma la dirección del servidor de Expo (que corre en tu PC) y le agrega el puerto 8000 (`mobile/lib/direccion.ts`, con pruebas). Ya no hay una IP escrita a mano en el código.

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
- ✅ El firewall deja pasar los puertos 8000 (API) y 8081 (Expo)
- ✅ La app Expo Go en el teléfono ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

#### Pasos (sin Docker, lo más simple):

```bash
docker compose up -d db backend      # la API en http://<IP de tu PC>:8000
cd mobile
npm install
npx expo start --lan                 # muestra un código QR
```

Escanea el QR con Expo Go (Android) o con la cámara (iOS). La app encuentra la API sola: usa la dirección del servidor de Expo y el puerto 8000. Si tu API está en otro puerto o en otro equipo, define `EXPO_PUBLIC_API_URL` (por ejemplo `http://192.168.1.50:9000/api`) antes de `npx expo start`; el WebSocket se deduce de ella (`/ws`).

#### Pasos (con el servicio `mobile` de Docker):

**1.** Averigua la IP de tu PC con `ipconfig`.

**2.** En `.env` escribe solo esa IP, para que Expo la anuncie en el QR (dentro del contenedor no la conoce):
```env
LAN_IP=192.168.1.XXX
```

**3.** Levanta el servicio y lee el QR:
```bash
docker compose up -d --build mobile
docker logs seismic_mobile
```

#### Para verlo en el navegador de la PC (sin teléfono):

```bash
cd mobile
EXPO_PUBLIC_API_URL=http://localhost:8000/api npx expo start --web --port 8081
```

El navegador necesita que el backend acepte el origen `http://localhost:8081` (ya viene en `CORS_ORIGINS` de `.env.example`). En la web el mapa lo dibuja Leaflet, no el mapa nativo del teléfono; ver [mobile/README.md](mobile/README.md) para lo que esta vista no puede comprobar.

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
npm test                  # 30 pruebas: la lógica compartida con la web, el resolvedor de direcciones y los ajustes
npx expo start --lan      # escanea el QR con Expo Go; la API se deduce sola
```

---

### 🌍 Configuración para Producción

Para desplegar en un servidor remoto (ej: AWS, DigitalOcean):

**1. Actualiza las URLs en `.env`:**
```env
# Para frontend (en la red Docker)
NEXT_PUBLIC_API_URL=http://backend:8000

# Para móvil (desde internet): el WebSocket se deduce de esta (wss://tu-dominio.com/ws)
EXPO_PUBLIC_API_URL=https://tu-dominio.com/api
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
    EXPO_PUBLIC_API_URL: https://tu-dominio.com/api
```

---

## Solución de Problemas

### ❌ Error: "Unable to connect to http://backend:8000/api"

**Causa:** Se definió `EXPO_PUBLIC_API_URL` con el nombre de servicio Docker, que no existe fuera de Docker.

**Solución:** quita esa variable (la app deduce la dirección de la PC) o ponle la IP real de tu PC: `http://192.168.1.XXX:8000/api`. En **Ajustes → Conexión** la app muestra la dirección que está usando.

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
# http://<IP de tu PC>:8000/docs
```

### ❌ Error: "Metro bundler not connecting"

**Causa:** Con el servicio `mobile` de Docker, Expo anuncia la dirección que le da `LAN_IP`; si falta o es incorrecta, el QR apunta a una dirección que el teléfono no alcanza.

**Solución:** en `.env` pon `LAN_IP=` con la IP de tu PC (`ipconfig`) y `docker compose up -d --force-recreate mobile`. O corre Expo sin Docker: `cd mobile && npx expo start --lan`.

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

### ❌ Error: "The requested model ... is not supported by any provider"

**Causa:** el token es válido, pero ningún proveedor de Inference Providers sirve ese modelo (le pasó a `Qwen/Qwen2.5-7B-Instruct`). El backend lo registra y usa la estimación por reglas.

**Solución:** pon en `.env` un modelo de la lista https://router.huggingface.co/v1/models (por defecto, `meta-llama/Llama-3.3-70B-Instruct`) y `docker compose restart backend`. Comprueba en el log: «Respuesta de Hugging Face. Modelo: …» y «1 de 1 impactos de la IA pasaron la validación».

### ❌ Error: "Hugging Face token invalid"

**Causa:** Token no válido o sin permiso de lectura.

**Solución:**
1. Ve a [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Verifica que sea un token con el preset **Inference** («Make calls to Inference Providers»)
3. Cópialo exactamente (sin espacios): `hf_ZXeipzyUG...`
4. Pégalo en `.env`: `HUGGINGFACE_API_TOKEN=hf_ZXeipzyUG...`
5. Reinicia backend: `docker compose restart backend`

---

## 📝 Checklist de Configuración

Antes de ejecutar en un nuevo dispositivo:

- [ ] Archivo `.env` creado (copia de `.env.example`)
- [ ] Token Hugging Face agregado a `.env`
- [ ] Para el servicio `mobile` de Docker: tu IP de PC (`ipconfig`) escrita en `.env` como `LAN_IP`
- [ ] Teléfono en la misma red WiFi que PC
- [ ] Docker running: `docker compose up -d`
- [ ] Verificar logs: `docker compose logs -f mobile`

---

## 🔗 Referencias Rápidas

| Componente | Dentro de Docker | Fuera de Docker |
|-----------|------------------|-----------------|
| Backend → DB | `db:3306` | N/A |
| Frontend → Backend | `backend:8000` | `http://localhost:8000` |
| Mobile → Backend | ❌ NO! | `http://<IP de tu PC>:8000` (la app la deduce) |
| Browser → Frontend | N/A | `http://localhost:3000` |
| Browser → API | N/A | `http://localhost:8000/docs` |

---

## 📖 Documentación Relacionada

- [README.md](README.md) - Descripción general del proyecto
- [Backend README](backend/README.md) - Documentación del backend
- [Frontend README](frontend/README.md) - Documentación del frontend
- [.env.example](.env.example) - Plantilla de variables de entorno

---

**Última actualización:** 23 de noviembre de 2026 (cliente móvil rediseñado; ya no lleva una IP escrita a mano)
