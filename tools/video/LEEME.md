# Herramientas del video de la app

Kit autónomo para grabar la app corriendo y montar el video (silencioso, con subtítulos ES/EN). La explicación y lo que se aprendió están en [`docs/guia_video.md`](../../docs/guia_video.md); el guion con los tiempos, en [`docs/video_guion.md`](../../docs/video_guion.md).

```powershell
npm install --prefix tools/video       # una vez: instala Electron y ffmpeg-static
npm run video --prefix tools/video     # graba y monta -> tools/video/salida/video_es.mp4 y video_en.mp4
npm run revisar --prefix tools/video   # cuadro por escena + hoja de contactos -> tools/video/salida/revision/
npm run ui --prefix tools/video        # verificación de la interfaz y auditoría de contraste (tools/capturas)
```

Para el cliente móvil (Expo en el navegador, ventana de 390×844) hay un kit paralelo que no toca el de la web:

```powershell
cd mobile; $env:EXPO_PUBLIC_API_URL = "http://localhost:8000/api"; npx expo start --web --port 8081   # en otra terminal, con el backend encendido
npm run video:movil --prefix tools/video      # graba y monta -> tools/video/salida/movil/video_es.mp4 y video_en.mp4
npm run revisar:movil --prefix tools/video    # cuadro por escena + hoja de contactos
```

`grabar_movil.js`, `director_movil.js` y `componer_movil.mjs` hacen lo mismo que sus pares de la web, con un «dedo» en lugar del cursor y los subtítulos a la derecha del teléfono. Ver [la guía](../../docs/guia_video.md#video-del-cliente-móvil).

La app de la web tiene que estar encendida (`docker compose up -d db backend frontend`) y con sismos cargados.

- `director.js`: se inyecta en la página; cursor, anillos de clic, tarjetas, lectura de los datos del día y registro de tiempos.
- `grabar.js`: abre la app en Electron y captura la página a 30 cuadros por segundo hacia ffmpeg.
- `sonido.mjs`: clics, teclas y música sintetizados.
- `componer.mjs`: subtítulos, mezcla de audio y montaje final de 1920×1080.
- `revisar.mjs`: revisión a simple vista del video final.

Los `.mp4`, el `.mkv` de la toma y los `.wav` quedan en `salida/`, que está ignorada por git.
