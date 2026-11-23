# Guía del video: cómo se grabó y qué se aprendió

El video de la app es silencioso, con subtítulos en español e inglés, sonidos de clic y de teclas y una música suave sintetizada. Se graba **la app corriendo** dentro de Electron, sin depender del escritorio, y se monta con `ffmpeg-static`. Todo el kit vive en `tools/video/` y no necesita nada de otros proyectos.

## Cómo se regraba

Con la app encendida y con sismos cargados (`docker compose up -d db backend frontend`, y esperar a que la tabla tenga filas):

```powershell
npm install --prefix tools/video      # una vez: instala Electron y ffmpeg-static
npm run video --prefix tools/video    # graba y monta video_es.mp4 y video_en.mp4 en tools/video/salida/
npm run revisar --prefix tools/video  # un cuadro por escena + hoja de contactos para revisar a simple vista
```

La grabación dura unos 2,5 minutos y abre una ventana de Electron de 1280×800: hay que dejarla visible y no tapar su área con otra ventana. Los `.mp4`, el `.mkv` de la toma y los `.wav` no van al repositorio (están ignorados). Para grabar otra dirección: `electron grabar.js --url http://…`.

## Piezas

| Archivo | Para qué sirve |
|---|---|
| `director.js` | Se inyecta en la página. Dibuja un cursor y un anillo en cada clic, recorre el guion con clics del DOM, muestra las tarjetas (portada, «antes», celular, «cómo está hecho», créditos), lee de la pantalla los datos del día y anota en `__D.log` la hora de cada clic, tecla y escena. |
| `grabar.js` | Abre la app en una ventana de 1280×800, parte siempre del tema crema, inyecta el director y captura la página a 30 cuadros por segundo con `capturePage()` hacia ffmpeg. Escribe `toma.mkv`, `eventos.json` y `meta.json`. |
| `sonido.mjs` | Sintetiza clics, teclas y una cama de música (un acorde de La menor con vibrato lento). Sin archivos de audio ni derechos de autor. |
| `componer.mjs` | Convierte el registro de escenas en subtítulos `.srt` (ES y EN), mezcla el audio y monta el video final de 1920×1080. |
| `revisar.mjs` | Extrae un cuadro por escena del video final y arma una hoja de contactos. |

El guion con los tiempos está en [`video_guion.md`](video_guion.md).

## Lo que se aprendió

1. **Los sismos son en vivo, así que los subtítulos no pueden llevar cifras escritas a mano.** El director lee de la pantalla cuántos sismos hay, el mayor, su profundidad y el de la historia del contraste, y los guarda como registro `info`; `componer.mjs` los pone en los subtítulos. Si el sismo mayor del día no es profundo, el subtítulo cambia a un texto genérico.
2. **Los círculos del mapa son SVG y no tienen `.click()`.** La primera grabación falló a los 46 s con `el.click is not a function`. El director manda un `MouseEvent('click')` cuando el elemento no lo tiene, y Leaflet lo recibe como un clic de verdad.
3. **El reloj de la página y el del grabador son el mismo.** El director anota `Date.now()` y el grabador mide sus cuadros contra su propio `Date.now()` de inicio, así que los subtítulos y los sonidos se sincronizan sin detectar escenas en el video.
4. **`capturePage` puede ser más lento que un cuadro.** Cuando una captura tarda más de 33 ms, el grabador repite el último cuadro hasta alcanzar la hora real: la duración del video sigue siendo la del reloj.
5. **Las teselas del mapa tardan.** Antes de empezar, el grabador espera a que haya filas en la tabla y 7 segundos más para que las teselas estén cargadas.
6. **Cuidado con las hojas de contactos de ffmpeg.** El filtro `fps` toma el *último* cuadro de cada intervalo; `revisar.mjs` busca el cuadro de cada escena con `-ss`, que no tiene ese problema.
7. **Cada subtítulo necesita su tiempo.** Con unos 17 caracteres por segundo se lee bien; las escenas largas se partieron en dos subtítulos (`graficos` y `graficos-2`, `tabla` y `tabla-2`).
8. **Cada `.mp4` queda en unos 9,5 MB** (H.264 con `-crf 20`, audio a 128 kb/s, 1080p, 2:28), así que cabe en las subidas automatizadas con tope de 10 MB.
9. **El cursor se oculta sobre las tarjetas finales** para que no quede una flecha suelta en los créditos.

## Qué se ve en el video

Sismos reales del USGS del momento de la grabación (23 de noviembre de 2026), sin estimación de IA: no hay token, así que el panel muestra «Cálculo por reglas · sin IA» y el video lo dice. Las capturas de la interfaz original en las tarjetas «ANTES» están en `docs/img/antes/`. La interfaz está en español en las dos versiones; solo cambian los subtítulos.

## Dónde está publicado

Todavía no se sube a YouTube.
