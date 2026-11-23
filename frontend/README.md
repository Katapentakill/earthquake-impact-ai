# Frontend: monitor sísmico global

Interfaz en **Next.js 14** (App Router), TypeScript y Leaflet. Es un tablero de una sola página que consulta el backend por REST, se entera de los sismos nuevos por WebSocket y se dibuja con dos temas de color (crema y oscuro). Visión general y capturas: [README del proyecto](../README.es.md).

## Estructura

```
src/
├── app/
│   ├── layout.tsx        # idioma, metadatos y tema inicial (sin destello)
│   ├── page.tsx          # estado de la página: período, filtros, selección, carga y WebSocket
│   └── globals.css       # variables de los dos temas y estilos de todos los componentes
├── components/
│   ├── TopBar.tsx        # marca, estado «En vivo» y selector de tema
│   ├── KpiCards.tsx      # cuatro tarjetas de resumen
│   ├── FilterBar.tsx     # período, magnitud, profundidad y búsqueda
│   ├── SeismicMap.tsx    # mapa Leaflet (solo en el navegador)
│   ├── EventPanel.tsx    # sismo elegido: datos, impacto estimado y su origen
│   ├── Charts.tsx        # tres gráficos en SVG propio
│   ├── EventsTable.tsx   # tabla ordenable con exportación a CSV
│   └── Icono.tsx         # íconos de trazo
├── lib/
│   ├── seismic.ts        # lógica pura: niveles, filtros, orden, resúmenes, CSV
│   ├── format.ts         # formatos en español de Chile (coma decimal, hora UTC)
│   ├── hooks.ts          # tema, hora actual y «montado»
│   ├── api.ts            # cliente REST (axios)
│   └── websocket.ts      # cliente WebSocket con reconexión y estado
└── types/index.ts        # tipos de la API
tests/                    # pruebas node:test de lib/seismic.ts y lib/format.ts
```

## Cómo se mantiene simple

- **Los temas son variables CSS** (`[data-theme='light' | 'dark']` en `globals.css`). Para cambiar un color se toca una línea y se vuelve a medir el contraste.
- **La lógica no sabe de React.** Todo lo que se puede probar sin navegador está en `lib/seismic.ts` y `lib/format.ts`; los componentes solo dibujan.
- **Una sola selección.** `page.tsx` guarda el sismo elegido y el mapa, el gráfico, la tabla y el panel lo leen. Solo la tabla y el gráfico piden acercar el mapa.
- **El mapa no depende de la hora.** Los marcadores se rehacen solo cuando cambia la lista; los textos de «hace 5 min» se calculan al pasar el mouse.

## Comandos

```powershell
npm install
npm run dev          # http://localhost:3000 (necesita el backend: NEXT_PUBLIC_API_URL)
npm test             # 20 pruebas de la lógica (Node 22.6 o superior)
npm run typecheck    # TypeScript
npm run build        # compilación de producción
```

`NEXT_PUBLIC_API_URL` es la dirección del backend **vista desde el navegador** (por ejemplo `http://localhost:8000`). Con Docker Compose se define en el `.env` de la raíz.
