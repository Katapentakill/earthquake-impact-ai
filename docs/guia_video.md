# Guía del video: cómo se grabó y qué se aprendió

El video explica **cómo funciona** la app: el camino de cada sismo (USGS → backend → estimación por IA o por reglas → MariaDB → WebSocket → web y celular), la interfaz web con un sismo estimado por la IA y otro por reglas, la rueda de carga mientras la IA estima, y el cliente móvil. Es silencioso, con subtítulos en español e inglés, sonidos de clic y de teclas y una música suave sintetizada. Dura 4:36 y pesa unos 9,5 MB por idioma. Se graba **la app corriendo** dentro de Electron, sin depender del escritorio, y se monta con `ffmpeg-static`. Todo el kit vive en `tools/video/`.

## Cómo se regraba

Con la app encendida y con sismos cargados (`docker compose up -d db backend frontend`), el backend con un token de Hugging Face (el video muestra un sismo estimado por la IA) y Expo web corriendo en el puerto 8081 (`cd mobile; $env:EXPO_PUBLIC_API_URL = "http://localhost:8010/api"; npx expo start --web --port 8081`; ver [mobile/README.md](../mobile/README.md)):

```powershell
npm install --prefix tools/video         # una vez: instala Electron y ffmpeg-static
npm run video:todo --prefix tools/video  # web + celular + unión -> tools/video/salida/final/video_es.mp4 y video_en.mp4
npm run revisar --prefix tools/video     # un cuadro por escena del tramo web + hoja de contactos
npm run revisar:movil --prefix tools/video
```

La grabación dura unos 5 minutos y abre dos ventanas de Electron, una detrás de la otra (1280×800 y 390×844): hay que dejarlas visibles y no tapar su área. Los `.mp4`, el `.mkv` de las tomas y los `.wav` no van al repositorio (están ignorados). `grabar.js` acepta `--url`, `--api`, `--db` y `--modelo`.

## Piezas

| Archivo | Para qué sirve |
|---|---|
| `director.js` | Se inyecta en la página web. Dibuja un cursor y un anillo en cada clic, muestra las tarjetas (portada, el camino de los datos, paso al celular), recorre el guion con clics del DOM, elige un sismo estimado por la IA y otro por reglas (los pide a la API), lee de la pantalla los datos del día y anota en `__D.log` la hora de cada clic, tecla y escena. |
| `grabar.js` | Abre la web en 1280×800, parte siempre del tema crema, inyecta el director y captura la página a 30 cuadros por segundo con `capturePage()` hacia ffmpeg. Cuando el director lo pide, reprocesa un sismo (ver más abajo). |
| `director_movil.js`, `grabar_movil.js` | Lo mismo para el cliente Expo corriendo en el navegador, en una ventana de 390×844, con un «dedo» en lugar del cursor. |
| `sonido.mjs` | Sintetiza clics, teclas y una cama de música (un acorde de La menor con vibrato lento). Sin archivos de audio ni derechos de autor. |
| `componer.mjs`, `componer_movil.mjs` | Convierten el registro de escenas en subtítulos (ES y EN), mezclan el audio y montan cada tramo en 1920×1080: la web con una banda inferior para los subtítulos; el celular a la izquierda y los subtítulos a la derecha, bajo una etiqueta fija «vista web a tamaño de teléfono». |
| `unir.mjs` | Une los dos tramos con un fundido de 0,8 s y codifica el resultado para que pese menos de 9,8 MB. |
| `revisar.mjs` | Extrae un cuadro por escena y arma una hoja de contactos para revisar a simple vista. |

El guion con las escenas está en [`video_guion.md`](video_guion.md).

## La rueda de carga en vivo

Para enseñar la rueda de carga hace falta que un sismo se esté estimando mientras se graba. El director pide (`window.__D.pedir`) que se reprocese un sismo; `grabar.js` lo borra de la base de datos **local** (`docker exec` en el contenedor de MariaDB) y le pide al backend que lo vuelva a procesar (`POST /api/events/process`). Es el camino real de un sismo nuevo (se guarda, aparece con la rueda, la IA estima, el panel se completa solo), pero está disparado a propósito, y el subtítulo lo dice: «Para mostrarlo se reprocesa este sismo». La IA tardó unos 20 s en la toma publicada; la rueda se ve todo ese tiempo.

## Lo que se aprendió

1. **Los sismos son en vivo, así que los subtítulos no pueden llevar cifras escritas a mano.** El director lee de la pantalla (y de la API) cuántos sismos hay, el mayor, qué sismo estimó la IA y cuántas muertes y heridos dio, y los guarda como registro `info`; los `componer*.mjs` los ponen en los subtítulos.
2. **Dos sismos pueden llamarse igual.** Una toma abrió el detalle de un M 4,5 de «Vanuatu region» mientras el subtítulo hablaba del M 6,5 que también era «Vanuatu region». Los directores buscan por magnitud y lugar y **fallan la toma si lo que muestra la pantalla no es lo que dirá el subtítulo**.
3. **El subtítulo no puede contradecir la pantalla.** «Casi no se siente en superficie» chocaba con las 3 muertes que mostraba el detalle: ahora cita la cifra leída de la pantalla.
4. **Un fallo real de la IA salió en la toma.** Llama devolvió JSON ilegible dos veces seguidas y el backend cayó a las reglas; el director lo detectó (esperaba «Análisis con IA») y falló en lugar de grabar algo falso. Esa toma sirvió para arreglar el backend: ahora vuelve a pedir hasta 3 veces (ver [las decisiones](decisiones.md), punto 44).
5. **Los círculos del mapa son SVG y no tienen `.click()`.** El director manda un `MouseEvent('click')` cuando el elemento no lo tiene.
6. **El reloj de la página y el del grabador son el mismo.** El director anota `Date.now()` y el grabador mide sus cuadros contra su propio `Date.now()`, así que subtítulos y sonidos se sincronizan sin detectar escenas en el video.
7. **`capturePage` puede ser más lento que un cuadro.** Cuando tarda más de 33 ms, el grabador repite el último cuadro hasta alcanzar la hora real.
8. **Los `componer*.mjs` avisan si un subtítulo dura menos de lo que hace falta para leerlo** (más de 21 caracteres por segundo). Con unos 17 se lee bien.
9. **Cuidado con las hojas de contactos de ffmpeg.** El filtro `fps` toma el *último* cuadro de cada intervalo; `revisar.mjs` busca el cuadro de cada escena con `-ss`.
10. **El peso importa.** Las subidas automatizadas topan en 10 MB: `unir.mjs` sube el `crf` de a 2 hasta que cabe (con `crf 26`, 4:36 y audio mono a 64 kb/s pesa unos 9,5 MB).
11. **El servidor de desarrollo de Docker en Windows no ve los cambios de archivos.** Tras editar el frontend hay que reiniciar el contenedor (`docker compose restart frontend`) antes de grabar.

## Qué se ve en el video

Sismos reales del USGS del momento de la grabación (23 de noviembre de 2026). Uno de ellos lo estimó la IA (`meta-llama/Llama-3.3-70B-Instruct` por Hugging Face) y otro las reglas por profundidad; el panel dice cuál es cuál. El tramo del celular es la versión web de la app (`expo start --web`), no un teléfono: el mapa que se ve es el de Leaflet, no el nativo, y el video lo dice. La interfaz está en español en las dos versiones; solo cambian los subtítulos.

## Dónde está publicado

Subidos el 23 de noviembre de 2026 al canal Alexander Gubier Tapia Olmedo como **No listados** (solo los ve quien tenga el enlace); cada descripción enlaza a la otra versión. Reemplazan a los dos videos anteriores (de 2:29, que comparaban con la interfaz original), que se borraron del canal.

| Subtítulos | Enlace |
|---|---|
| Español | <https://youtu.be/1XgrETnC1eA> |
| English | <https://youtu.be/SQEuXKzsK_Q> |

Ajustes del formulario de subida: «No, no es contenido creado para niños»; sin promoción pagada; contenido alterado o sintético: «No» (es una grabación de la app con sismos reales y sonidos sintetizados por código); idioma del video: español (Latinoamérica) e inglés (Estados Unidos). Al abrir YouTube Studio hay que cambiar a la cuenta y al canal correctos antes de subir: por defecto abre otro canal de la misma cuenta de Google, y si el navegador se reinicia a mitad de la subida el video queda como borrador (se retoma desde Contenido → Editar borrador).
