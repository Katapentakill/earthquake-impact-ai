# Herramientas del video de la app

Kit autónomo para grabar la app corriendo y montar el video «cómo funciona» (silencioso, con subtítulos ES/EN). La explicación y lo que se aprendió están en [`docs/guia_video.md`](../../docs/guia_video.md); el guion, en [`docs/video_guion.md`](../../docs/video_guion.md).

```powershell
npm install --prefix tools/video             # una vez: instala Electron y ffmpeg-static
npm run video:todo --prefix tools/video      # web + celular + unión -> salida/final/video_es.mp4 y video_en.mp4
npm run video --prefix tools/video           # solo el tramo de la web -> salida/video_es.mp4 y video_en.mp4
npm run video:movil --prefix tools/video     # solo el tramo del celular -> salida/movil/
npm run unir --prefix tools/video            # une los dos tramos
npm run revisar --prefix tools/video         # cuadro por escena + hoja de contactos (también revisar:movil)
npm run ui --prefix tools/video              # verificación de la web y auditoría de contraste (tools/capturas)
npm run movil --prefix tools/video           # lo mismo para el cliente móvil en el navegador
npm run estimando --prefix tools/video       # comprueba la rueda de carga mientras la IA estima un sismo
```

Hace falta la app encendida (`docker compose up -d db backend frontend`) con sismos cargados y un token de Hugging Face en el backend, y Expo web en el puerto 8081 para el celular.

- `director.js`, `grabar.js`: la web (1280×800). `director_movil.js`, `grabar_movil.js`: el celular (390×844).
- `sonido.mjs`: clics, teclas y música sintetizados.
- `componer.mjs`, `componer_movil.mjs`: subtítulos, mezcla de audio y montaje de cada tramo en 1920×1080.
- `unir.mjs`: une los tramos con un fundido y lo deja por debajo de 9,8 MB.
- `revisar.mjs`: revisión a simple vista del video.

Los `.mp4`, el `.mkv` de la toma y los `.wav` quedan en `salida/`, que está ignorada por git.
