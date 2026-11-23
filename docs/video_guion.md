# Guion del video (≈ 4:36, solo la app, sin voz)

Video silencioso con **subtítulos en español e inglés**, un círculo en cada clic (un «dedo» en el celular), sonido de clics y de escritura y música ambiental a poco volumen (sintetizada, sin derechos de autor). Explica cómo funciona la app, con los sismos reales del momento. Los subtítulos salen de `tools/video/componer.mjs` (web) y `componer_movil.mjs` (celular) y se sincronizan con la hora real de cada escena; las cifras y los lugares entre llaves (`{…}`) se toman de lo que mostraba la pantalla durante la toma, no de texto escrito a mano.

Cómo se graba y se monta: [`guia_video.md`](guia_video.md). Los tiempos son los de la última grabación (23 de noviembre de 2026).

## Tramo 1: la web (2:41)

| Tiempo | Escena | Acción en pantalla | Subtítulo (ES) |
|---|---|---|---|
| 0:00 | `portada` | Tarjeta con la marca y «Cómo funciona». | Monitor sísmico global: así funciona, del USGS a tu pantalla. |
| 0:05 | `flujo-1` | El camino de cada sismo: se ilumina USGS y FastAPI. | Cada 3 minutos, el backend consulta al USGS los sismos de magnitud 4,5 o más y calcula el radio que afectan. |
| 0:14 | `flujo-2` | Se ilumina la estimación: IA o reglas. | Luego estima el impacto: una IA (Llama 3.3 70B, por Hugging Face) razona país por país; sin token, o si falla, unas reglas por profundidad. |
| 0:22 | `flujo-3` | Se iluminan MariaDB, WebSocket y las dos apps. | Todo se guarda en MariaDB y se avisa por WebSocket a la web y al celular. |
| 0:28 | `resumen` | El cursor recorre las cuatro tarjetas. | La web muestra las últimas 24 horas: {total} sismos; el mayor, de magnitud {mayorMag}. |
| 0:36 | `mapa` | La página baja al mapa. | Cada epicentro lleva el color de su magnitud. |
| 0:43 | `panel-ia` | Clic en el sismo estimado por la IA; el panel dice «Análisis con IA» y se ve su razonamiento. | Un clic abre el panel: para este sismo de magnitud {iaMag} a {iaProf} km, la IA estimó {iaMuertes} muertes y {iaHeridos} heridos, y explica su razonamiento. |
| 0:55 | `estimando-pedir` → `estimando` → `estimado` | Se reprocesa ese sismo: el panel muestra «Estimando el impacto…» con una rueda de carga hasta que la IA responde y el panel se completa solo. | Para mostrarlo se reprocesa este sismo: aparece al instante con una rueda de carga mientras la IA lo estima y, al terminar, el panel se completa solo. |
| 1:26 | `panel-reglas` | Clic en otro sismo; el panel dice «Cálculo por reglas · sin IA». | Este otro (M {reglasMag}, {reglasProf} km) lo calcularon las reglas, y el panel lo dice: «Cálculo por reglas · sin IA». |
| 1:35 | `filtros` | «5,0 o más», «Superficial» y «Restablecer». | Filtros por magnitud y profundidad: el mapa, los gráficos y la tabla se actualizan juntos. |
| 1:44 | `busqueda` | Se escribe una palabra en la búsqueda. | La búsqueda filtra por lugar o ID mientras escribes. |
| 1:49 | `periodo` | «7 días» y de vuelta a «24 horas». | El período llega hasta 30 días. |
| 1:55 | `graficos`, `graficos-2` | La magnitud en el tiempo, y los histogramas por magnitud y por profundidad. | La magnitud de cada sismo a lo largo del período. / Y cuántos sismos hay por magnitud y por profundidad. |
| 2:07 | `tabla` | Orden por «Magnitud» y el botón «Exportar CSV». | La tabla se ordena por cualquier columna y se exporta a CSV. |
| 2:14 | `oscuro` | Tema oscuro y vuelta a crema. | El tema oscuro cálido, con un contraste de texto de al menos 4,5 a 1, medido por script. |
| 2:30 | `envivo` | El cursor sobre «En vivo». | «En vivo» indica que el WebSocket está conectado: un sismo nuevo aparece sin recargar la página. |
| 2:36 | `celular` | Tarjeta «Y la misma información, en el celular». | Y la misma información, en el celular. |

## Tramo 2: el celular (1:55)

El teléfono queda a la izquierda, con la etiqueta fija «Cliente móvil · vista web a tamaño de teléfono», y los subtítulos a la derecha.

| Escena | Acción en pantalla | Subtítulo (ES) |
|---|---|---|
| `resumen-1` | Las cuatro tarjetas de la pestaña Resumen. | El celular recibe lo mismo: {total} sismos en las últimas 24 horas; el mayor, de magnitud {mayorMag}, en {mayorLugar}. |
| `resumen-2`, `filtros` | Los chips de período, magnitud y profundidad. | Debajo, los filtros… / Cada filtro actualiza las tarjetas y la lista al instante. |
| `busqueda` | Se escribe en la búsqueda. | La búsqueda filtra por lugar mientras escribes. |
| `detalle-1`, `detalle-2` | Un toque abre el detalle del sismo mayor; baja hasta el razonamiento. | Un toque abre el detalle… / El detalle dice de dónde sale la estimación: «Análisis con IA», con su razonamiento en español ({detalleMuertes} muertes para este sismo). |
| `mapa-1`, `mapa-2` | «Ver en el mapa»; «Ver todo el mundo»; un toque en otro epicentro. | «Ver en el mapa» lleva al epicentro y dibuja su radio de afectación. / Al tocar otro epicentro, el mapa muestra su resumen. |
| `alertas` | La pestaña Alertas. | Alertas: los sismos desde el umbral elegido. Los nuevos llegan en vivo por WebSocket. |
| `ajustes-1` | La pestaña Ajustes. | Ajustes: el tema, el umbral de las alertas y el estado de la conexión. |
| `oscuro` | Tema oscuro; Resumen, Mapa y Ajustes; vuelta a crema. | El tema oscuro cálido, con el mismo contraste medido: al menos 4,5 a 1. |
| `como` | Tarjeta «Cómo se comprueba»: 39 pruebas del backend, 20 de la web, 30 del celular. | 39 pruebas del backend, 20 de la web y 30 del celular. Se vio en un navegador, no en un teléfono. |
| `cierre` | Tarjeta con el nombre, los créditos y el repositorio. | Diseño, backend, IA, interfaz, pruebas y documentación: Alexander Tapia. Datos del USGS; mapa de OpenStreetMap. |

El subtítulo de `detalle-2` pasa a un texto sobre las reglas si el sismo mayor no lo estimó la IA, para no afirmar algo que la pantalla no muestra.
