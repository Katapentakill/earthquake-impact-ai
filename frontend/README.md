# ⚛️ Frontend - Sistema de Monitoreo Sísmico

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-18-blue?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4+-38bdf8?logo=tailwindcss&logoColor=white)

Interfaz web moderna para el Sistema Global de Monitoreo Sísmico con visualización en tiempo real

[Componentes](#-componentes-principales) •
[Tecnologías](#-stack-tecnológico) •
[Estructura](#-estructura-del-proyecto) •
[UI/UX](#-diseño-y-experiencia) •
[Desarrollo](#-desarrollo)

</div>

---

## 📋 Descripción

Frontend construido con **Next.js 14** (App Router) que proporciona:
- 🗺️ **Visualización interactiva** de eventos sísmicos en mapa global
- 📊 **Tabla completa** con todos los eventos y sincronización en tiempo real
- 🎨 **UI moderna** con gradientes, animaciones y diseño responsive
- 🔄 **Auto-actualización** cada 3 minutos via polling y WebSocket
- 📱 **Mobile-first** optimizado para todos los dispositivos
- 🤖 **Razonamiento IA visible** mostrando transparencia en decisiones

---

## 🛠️ Stack Tecnológico

### Framework y Bibliotecas Core

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![Next.js](https://img.shields.io/badge/Next.js-14.1-black?logo=next.js) | 14.1.0 | Framework React con App Router |
| ![React](https://img.shields.io/badge/React-18-blue?logo=react) | 18 | Biblioteca UI declarativa |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript) | 5+ | Tipado estático y seguridad |

### Estilos

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4+-38bdf8?logo=tailwindcss) | 3.4+ | Framework CSS utility-first |
| **CSS Custom** | - | Scrollbars personalizados y animaciones |

### Mapas y Visualización

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![Leaflet](https://img.shields.io/badge/Leaflet-1.9+-green?logo=leaflet) | 1.9+ | Mapas interactivos |
| **OpenStreetMap** | - | Tiles de mapas base |

### Utilidades

| Tecnología | Versión | Uso |
|------------|---------|-----|
| ![date-fns](https://img.shields.io/badge/date--fns-3.0+-purple) | 3.0+ | Formateo de fechas |
| **WebSocket** | Nativo | Conexión en tiempo real con backend |

### Dependencias Principales

```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "leaflet": "^1.9.4",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/leaflet": "^1.9.8",
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
```

---

## 🏗️ Estructura del Proyecto

```
frontend/
├── src/
│   ├── app/                        # 📱 App Router de Next.js 14
│   │   ├── layout.tsx             # Layout raíz (HTML, metadata)
│   │   ├── page.tsx               # Página principal del dashboard
│   │   └── globals.css            # Estilos globales y custom scrollbar
│   │
│   ├── components/                 # 🧩 Componentes React
│   │   ├── SeismicMap.tsx         # 🗺️ Mapa interactivo Leaflet
│   │   ├── EventList.tsx          # 📋 Lista de eventos recientes (top 3)
│   │   ├── EventsTable.tsx        # 📊 Tabla completa de eventos
│   │   ├── ImpactPanel.tsx        # 💥 Panel de impacto con IA reasoning
│   │   └── FilterPanel.tsx        # 🔍 Panel de filtros avanzados
│   │
│   ├── lib/                        # 🔧 Utilidades y clientes
│   │   ├── api.ts                 # Cliente REST API
│   │   └── websocket.ts           # Cliente WebSocket
│   │
│   └── types/                      # 📝 Definiciones TypeScript
│       └── index.ts               # Interfaces y tipos
│
├── public/                         # 📁 Assets estáticos
├── package.json                    # 📦 Dependencias
├── tsconfig.json                   # ⚙️ Config TypeScript
├── tailwind.config.ts              # 🎨 Config Tailwind
├── next.config.js                  # ⚙️ Config Next.js
├── Dockerfile                      # 🐳 Imagen Docker
└── README.md                       # 📖 Esta documentación
```

---

## 🧩 Componentes Principales

### 1. SeismicMap (`SeismicMap.tsx`)

**Responsabilidad**: Mapa interactivo con marcadores de epicentros

```typescript
interface SeismicMapProps {
  events: SeismicEvent[];
  selectedEvent?: SeismicEvent | null;
  onEventClick?: (event: SeismicEvent) => void;
}
```

**Features**:
- ✅ Marcadores circulares con colores según magnitud
- ✅ Círculos de radio de impacto (no interactivos)
- ✅ Popups con información del evento
- ✅ Auto-zoom al evento seleccionado
- ✅ Carga dinámica (solo client-side)

**Colores por Magnitud**:
```typescript
Mag >= 8.0 → 🔴 Rojo (Catastrófico)
Mag 7.0-7.9 → 🟠 Naranja (Alto)
Mag 6.0-6.9 → 🟡 Amarillo (Moderado)
Mag 5.0-5.9 → 🟢 Verde (Bajo)
Mag < 5.0 → 🔵 Azul (Menor)
```

---

### 2. EventsTable (`EventsTable.tsx`)

**Responsabilidad**: Tabla completa con todos los eventos filtrados

```typescript
interface EventsTableProps {
  events: SeismicEvent[];
  selectedEvent?: SeismicEvent | null;
  onEventSelect?: (event: SeismicEvent) => void;
}
```

**Columnas**:
| Columna | Tipo | Ejemplo |
|---------|------|---------|
| Event ID | Monospace | `us6000rhzq` |
| Location | Text | "58 km ENE of Hualien City, Taiwan" |
| Date & Time | DateTime | Oct 18, 2025<br>02:04:14 |
| Magnitude | Badge | `5.0` (con color según severidad) |
| Depth (km) | Number | 39.8 |
| Impact Radius (km) | Number | 65.3 |
| Coordinates | Lat/Lon | 24.2442°<br>122.1061° |
| Actions | Button | "View" |

**Features**:
- ✅ Selección visual (borde azul izquierdo)
- ✅ Hover con fondo gris
- ✅ Click en fila para seleccionar
- ✅ Botón "View" individual
- ✅ Footer con estadísticas (total, promedio, máximo)
- ✅ Estado vacío con mensaje amigable

---

### 3. EventList (`EventList.tsx`)

**Responsabilidad**: Lista compacta de los 3 eventos más recientes

```typescript
interface EventListProps {
  events: SeismicEvent[];  // Solo top 3
  selectedEvent?: SeismicEvent | null;
  onEventSelect?: (event: SeismicEvent) => void;
}
```

**Features**:
- ✅ Cards con gradientes según selección
- ✅ Animación hover (escala 1.02)
- ✅ Iconos SVG para fecha, profundidad y radio
- ✅ Magnitud con badge circular y gradiente
- ✅ Truncado de texto para ubicaciones largas

---

### 4. ImpactPanel (`ImpactPanel.tsx`)

**Responsabilidad**: Visualización detallada de impactos por país

```typescript
interface ImpactPanelProps {
  impacts: ImpactData[];
}
```

**Secciones**:

#### a) Resumen General
```
┌─────────────────────────────────────┐
│ Overall Impact Summary              │
├──────────┬──────────┬───────────────┤
│ Deaths   │ Injuries │ Losses        │
│ 450      │ 3,200    │ $0.85B        │
└──────────┴──────────┴───────────────┘
```

#### b) Por País
Para cada país afectado:
- **Header**: Nombre + badge de nivel de destrucción
- **Ciudades afectadas**: Lista separada por comas
- **Estimaciones**: Grid 2x2 (muertes, heridos, pérdidas, infraestructura)
- **🔵 Building Code**: Info del código de construcción
- **🟣 AI Reasoning**: Razonamiento detallado de la IA
- **🟣 Factors Considered**: Lista de factores analizados
- **⚪ Data Sources**: Fuentes de datos utilizadas

**Ejemplo Visual**:
```
┌─────────────────────────────────────────────────────┐
│ 🇹🇼 Taiwan                    [MODERADO]           │
├─────────────────────────────────────────────────────┤
│ Affected cities: Hualien City                       │
│                                                      │
│ Deaths: 100    Injuries: 500                        │
│ Losses: $150M  Infrastructure: Alta                 │
│                                                      │
│ 🔵 Building Code:                                   │
│    Alta (Taiwan Earthquake Law 2001)                │
│                                                      │
│ 🟣 AI Assessment Reasoning:                         │
│    Magnitude 5.0 at 39.8km depth. Applied -30%      │
│    for deep earthquake. Taiwan has strict building  │
│    codes (2001 law). Adjusted estimates: base 150   │
│    deaths * 0.7 (depth) * 0.8 (prep) = 84 deaths... │
│                                                      │
│ 🟣 Factors Considered:                              │
│    • Magnitude 5.0 - light                          │
│    • Depth 39.8km - reduced surface impact          │
│    • Strict building codes - 2001 law               │
│    • Historical pattern - 2016 reference            │
│                                                      │
│ ⚪ Data Sources:                                    │
│    • Taiwan 2014 Building Code                      │
│    • Population census data                         │
└─────────────────────────────────────────────────────┘
```

---

### 5. FilterPanel (`FilterPanel.tsx`)

**Responsabilidad**: Controles de filtrado de eventos

```typescript
interface FilterPanelProps {
  onFilterChange: (filters: FilterValues) => void;
}

interface FilterValues {
  min_magnitude?: number;
  max_magnitude?: number;
  start_date?: string;  // ISO 8601
  end_date?: string;    // ISO 8601
}
```

**Controles**:
- 📊 **Rango de magnitud**: Min/Max sliders
- 📅 **Rango de fechas**: Date pickers
- ⚡ **Filtros rápidos**:
  - Last 24 hours
  - Last 7 days
  - Magnitude 6.0+

---

## 📐 Tipos TypeScript

### Interfaces Principales

```typescript
// types/index.ts

export interface SeismicEvent {
  event_id: string;
  magnitud: number;
  profundidad: number;
  latitud: number;
  longitud: number;
  fecha_utc: string;  // ISO 8601
  lugar: string;
  radio_afectacion_km: number | null;
  fuente_api: string;
}

export interface ImpactData {
  pais: string;
  ciudades_afectadas: string[];
  muertes_estimadas: number;
  heridos_estimados: number;
  perdidas_monetarias_usd: number;
  nivel_destruccion: 'BAJO' | 'MODERADO' | 'ALTO' | 'CATASTROFICO';
  fuentes_inferidas: string[];

  // ⭐ NUEVOS CAMPOS
  razonamiento_ia?: string;
  factores_considerados?: string[];
  codigo_construccion?: string;

  nivel_preparacion_sismica?: string;
  densidad_poblacional?: string;
}

export interface EventWithImpacts {
  event: SeismicEvent;
  impacts: ImpactData[];
}

export interface EventsResponse {
  total: number;
  limit: number;
  offset: number;
  events: SeismicEvent[];
}

export interface Statistics {
  period_days: number;
  total_events: number;
  average_magnitude: number;
  highest_magnitude_event: SeismicEvent | null;
  estimated_casualties: {
    deaths: number;
    injuries: number;
    economic_losses_usd: number;
  };
  most_affected_countries: {
    country: string;
    event_count: number;
    total_deaths: number;
  }[];
}
```

---

## 🔌 Integración con Backend

### Cliente REST API (`lib/api.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const eventsApi = {
  // GET /api/events/
  async getEvents(params?: {
    limit?: number;
    offset?: number;
    min_magnitude?: number;
    max_magnitude?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<EventsResponse> {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();

    const response = await fetch(`${API_BASE_URL}/api/events/?${queryString}`);
    return response.json();
  },

  // GET /api/events/{id}
  async getEventDetail(eventId: string): Promise<EventWithImpacts> {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
    return response.json();
  },

  // GET /api/events/stats/summary
  async getStatistics(days: number = 30): Promise<Statistics> {
    const response = await fetch(
      `${API_BASE_URL}/api/events/stats/summary?days=${days}`
    );
    return response.json();
  }
};
```

### Cliente WebSocket (`lib/websocket.ts`)

```typescript
class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: ((data: any) => void)[] = [];

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageHandlers.forEach(handler => handler(data));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
  }

  disconnect() {
    this.ws?.close();
  }
}

export default WebSocketClient;
```

### Uso en Componentes

```typescript
// page.tsx
const [events, setEvents] = useState<SeismicEvent[]>([]);

// Polling cada 3 minutos
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchEvents();
  }, 3 * 60 * 1000);

  return () => clearInterval(intervalId);
}, []);

// WebSocket para updates en tiempo real
useEffect(() => {
  const wsClient = new WebSocketClient('ws://localhost:8000/ws');

  wsClient.onMessage((message) => {
    if (message.type === 'new_earthquake') {
      fetchEvents();  // Recargar lista
    }
  });

  wsClient.connect();

  return () => wsClient.disconnect();
}, []);
```

---

## 🎨 Diseño y Experiencia (UI/UX)

### Paleta de Colores

#### Gradientes Principales
```css
/* Header */
bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600

/* Recent Events Panel */
bg-gradient-to-br from-blue-50 to-indigo-50

/* Impact Panel */
bg-gradient-to-br from-purple-50 to-pink-50

/* Events Table Header */
bg-gradient-to-r from-green-50 to-teal-50
```

#### Badges de Magnitud
```css
Mag >= 8.0: bg-gradient-to-br from-red-600 to-red-800
Mag 7.0-7.9: bg-gradient-to-br from-orange-500 to-red-600
Mag 6.0-6.9: bg-gradient-to-br from-yellow-500 to-orange-500
Mag 5.0-5.9: bg-gradient-to-br from-green-500 to-yellow-500
Mag < 5.0: bg-gradient-to-br from-blue-500 to-green-500
```

### Animaciones

```css
/* Hover en cards de eventos */
transition-all duration-200 hover:scale-[1.02]

/* Indicador en vivo (pulsante) */
animate-pulse

/* Fade in para nuevos elementos */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Scrollbar Personalizado

```css
/* globals.css */
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #8b5cf6, #6366f1);
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #7c3aed, #4f46e5);
}
```

### Responsive Design

```typescript
// Breakpoints de Tailwind
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large

// Ejemplo de uso
<div className="col-span-12 lg:col-span-6">
  {/* 100% en mobile, 50% en desktop */}
</div>
```

---

## 🚀 Desarrollo

### Requisitos
```bash
Node.js >= 18.17
npm >= 9.0
```

### Instalación

```bash
cd frontend

# Instalar dependencias
npm install
```

### Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev
# → http://localhost:3000

# Build de producción
npm run build

# Iniciar servidor de producción
npm start

# Linting
npm run lint
```

### Variables de Entorno

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

⚠️ **Importante**: Variables con prefijo `NEXT_PUBLIC_` son accesibles en el cliente

---

## 📱 Características Responsive

### Layout en Mobile
```
┌─────────────────────┐
│ Header (full width) │
├─────────────────────┤
│ Filters (collapse)  │
├─────────────────────┤
│ Map (400px height)  │
├─────────────────────┤
│ Recent Events (3)   │
├─────────────────────┤
│ Impact Panel        │
├─────────────────────┤
│ Full Table          │
└─────────────────────┘
```

### Layout en Desktop
```
┌───────────────────────────────────────────────┐
│          Header (with stats badges)           │
├───────┬────────────────────┬──────────────────┤
│       │                    │ Recent Events(3) │
│Filter │   Map + Summary    │──────────────────│
│Panel  │                    │  Impact Panel    │
│       │                    │  (if selected)   │
├───────┴────────────────────┴──────────────────┤
│            Full Events Table                   │
└───────────────────────────────────────────────┘
```

---

## 🧪 Testing Manual

### Checklist de Funcionalidades

- [ ] **Mapa carga correctamente** con tiles de OpenStreetMap
- [ ] **Marcadores aparecen** en ubicaciones correctas
- [ ] **Círculos de radio** se muestran y no interfieren con clicks
- [ ] **Popup abre** al hacer click en marcador
- [ ] **Tabla muestra todos los eventos** con datos correctos
- [ ] **Filtros funcionan** (magnitud, fecha)
- [ ] **Selección sincronizada** entre mapa, tabla y panel
- [ ] **Panel de impacto** muestra razonamiento de IA
- [ ] **Auto-refresh** funciona cada 3 minutos
- [ ] **WebSocket** conecta y recibe notificaciones
- [ ] **Responsive** se ve bien en mobile y desktop

---

## 🔧 Troubleshooting

### Error: "Mapa no carga"

**Problema**: Leaflet requiere client-side rendering

**Solución**: Asegurarse de usar `dynamic` import:
```typescript
const SeismicMap = dynamic(() => import('@/components/SeismicMap'), {
  ssr: false
});
```

### Error: "CORS bloqueado"

**Problema**: Backend no permite requests desde frontend

**Solución**: Verificar configuración CORS en backend:
```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Error: "WebSocket desconecta constantemente"

**Problema**: Auto-reconnect muy agresivo

**Solución**: Aumentar delay en `websocket.ts`:
```typescript
setTimeout(() => this.connect(), 10000);  // 10 segundos
```

---

## 📚 Referencias

- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Leaflet**: https://leafletjs.com/reference.html
- **date-fns**: https://date-fns.org/docs

---

## 📄 Licencia

MIT License - Ver archivo principal de LICENSE del proyecto

---

<div align="center">

**Frontend desarrollado con ⚛️ React y 🎨 Tailwind CSS**

[Volver al README principal](../README.md)

</div>
