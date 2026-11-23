# Decisiones

Registro de lo que se decidió al rediseñar el proyecto (noviembre de 2026) y por qué. Cada una nace de algo concreto que se vio en la versión original o al probar la nueva.

## Diseño

1. **Crema atenuado en lugar de blanco.** El claro usa un fondo `#E7DFCB` y tarjetas `#F3ECDB` con texto casi negro cálido: sin blancos puros, para no cansar la vista. El oscuro es un gris con un toque marrón, no un negro azulado.
2. **Un solo acento, sin degradados.** La interfaz original usaba degradados azul y morado. Ahora hay un acento (ámbar quemado en claro, ámbar claro en oscuro) y todo lo demás sale de los neutros.
3. **La escala de magnitud es la misma en los dos temas** (verde azulado, ámbar, naranja, rojo) y cada insignia trae su propio color de texto, elegido para que el contraste pase en ambos fondos.
4. **El mapa conserva las teselas de OpenStreetMap y las tiñe por tema** con un filtro CSS (sepia suave en crema, invertido y atenuado en oscuro). No se cambió de proveedor: así no hay una dependencia nueva ni una clave. Para un despliegue público habría que usar un proveedor con sus propios términos.
5. **Gráficos propios en SVG.** Sin librería de gráficos: la lógica de las series se prueba en Node. `recharts` y `react-leaflet` siguen en `package.json` pero ya no se usan.
6. **Interfaz en español.** El README ya estaba en español y la interfaz en inglés. Los nombres de lugar siguen en inglés porque vienen así del USGS.
7. **El mapa abre mostrando el mundo y no se reencuadra** cuando llegan sismos o se filtra, para no quitarle al usuario la vista que eligió. Solo se acerca cuando se elige un sismo desde la tabla o el gráfico; el clic en el mapa solo selecciona.
8. **Una selección compartida.** Mapa, gráfico, tabla y panel muestran el mismo sismo. Si el elegido deja de cumplir los filtros, el panel pasa al de mayor magnitud.
9. **Contraste medido, no supuesto.** `tools/capturas/verificar_ui.js` calcula el contraste de cada texto visible (4,5:1, o 3:1 si es grande) en crema, oscuro y celular. Se corrige con la medición, no a ojo.
10. **El panel dice de dónde sale la estimación** («Cálculo por reglas · sin IA» o «Análisis con IA») y nunca presenta una como la otra.

## Datos y backend

11. **La estimación de respaldo atenúa por profundidad.** Hallazgo: para un sismo de magnitud 6,5 a 601 km daba 150 muertes. Ahora escala muertes, heridos y pérdidas por clase de profundidad (superficial 1, intermedia 0,4, profunda 0,02) y baja un nivel de destrucción si no es superficial; el mismo sismo da 3 muertes. Los factores son decisión mía, no sismología: ver «Límites» del README.
12. **La lista de sismos trae el resumen del impacto** (nivel más alto, sumas y si salió de reglas o de la IA). Así la tabla puede ordenar por impacto y mostrarlo sin pedir el detalle de cada evento.
13. **Funciones puras y probables.** `respaldo.py` y `resumen.py` no importan la configuración ni la base de datos, así que `pytest` las prueba sin FastAPI ni Docker.
14. **El texto de la estimación de respaldo está en español** y usa coma decimal. El del modelo de IA sigue en inglés (su prompt está en inglés); queda pendiente.
15. **Las filas guardadas antes de este cambio se siguen reconociendo.** La marca «Fallback» de la versión anterior cuenta como estimación por reglas.
16. **Período y tope.** La interfaz pide al backend los eventos del período elegido (24 horas, 7 o 30 días) con `start_date` y un tope de 500.
17. **El eco de SQL queda apagado** (`SQL_ECHO`). Llenaba el log con cada consulta.

## Pruebas y entrega

18. **La lógica de la interfaz vive en módulos sin React ni alias de rutas** (`lib/seismic.ts`, `lib/format.ts`) para probarla con `node:test`, sin instalar nada: Node 22.6 o superior quita los tipos al ejecutar.
19. **Verificación sobre la app real bajo Electron**, no sobre jsdom: así se miden el contraste y el diseño de verdad, con el mapa y las teselas.
20. **`.env.example` apunta a una dirección que el navegador alcanza.** Decía `http://backend:8000`, un nombre que solo existe dentro de la red de Docker.
21. **`.claude/settings.local.json` salió del repositorio.** Son permisos y rutas de un equipo; sigue en el historial antiguo.
22. **Sin insignia de CI.** El workflow existe, pero GitHub detiene las ejecuciones por un problema de facturación de la cuenta; las pruebas se corrieron en local (mismo trato que los otros proyectos).
23. **Kit de video autónomo.** Graba la app que está corriendo; como los sismos son en vivo, los subtítulos toman las cifras y los lugares de lo que mostraba la pantalla durante la toma. Ver [guía del video](guia_video.md).

## Cliente móvil

24. **El cliente móvil se valida en el navegador con `expo start --web`.** Es una vista de `react-native-web`: sirve para el diseño, los datos, la navegación y el contraste, y no para el mapa nativo, los gestos, la vibración ni el rendimiento. Eso se dice en [mobile/README.md](../mobile/README.md#honest-limits) y falta la prueba en un teléfono real.
25. **El mapa del navegador es otro; el del teléfono sigue siendo `react-native-maps`.** Esa librería no tiene versión web: la app original ni siquiera arrancaba con `--web`. `SeismicMap.web.tsx` dibuja los mismos datos con Leaflet (teselas teñidas por tema, círculos por magnitud) solo para poder verlos y probarlos en un PC.
26. **La dirección de la API se calcula, no se escribe.** `lib/direccion.ts` es una función pura con pruebas: la variable `EXPO_PUBLIC_API_URL` si existe, `localhost` en la web, la PC que sirve la app en Expo Go y `10.0.2.2` en el emulador de Android. Antes había una IP de red local escrita en tres archivos y el WebSocket apuntaba a `/api/ws`, una ruta que el backend no sirve (la correcta es `/ws`).
27. **Los tipos son los de la web.** El cliente leía `profundidad_km`, `id` y `created_at`, que la API nunca mandó: «Profundidad: km» salía vacío y el detalle esperaba un evento suelto cuando la API devuelve `{event, impacts}`. Ahora `lib/types.ts` es una copia de los tipos de la web.
28. **La lógica compartida se copia, no se publica como paquete.** Metro no resuelve archivos fuera de `mobile/` sin configuración extra, y un monorepo para tres archivos sería más maquinaria que problema. `seismic.ts`, `format.ts` y `websocket.ts` llevan un comentario de origen y sus pruebas corren de los dos lados: quien cambie uno debe cambiar el otro.
29. **Cuatro pestañas y una pantalla de detalle.** Resumen, Mapa, Alertas y Ajustes; el toque en un sismo (de la lista, del mapa o de las alertas) abre el detalle, que antes solo hacía `console.log`. «Sistema» pasó a ser «Ajustes», con el tema y el umbral de las alertas guardados en el teléfono.
30. **Alertas sin notificaciones push.** Se avisa por WebSocket solo con la app abierta: push necesita una compilación nativa y un servicio de tokens que no valía para este alcance.
31. **El aviso en vivo se probó de punta a punta.** Se borró de la base local un sismo de magnitud 6,5; el backend lo volvió a ingresar en su siguiente consulta y la app, abierta en Alertas, mostró «Llegó un sismo nuevo: M 6,5» y la etiqueta NUEVO a los 116 segundos.
32. **Íconos propios.** El ícono, el adaptable de Android, la pantalla de inicio y el favicon eran los de la plantilla de Expo. Ahora son ondas sísmicas en el acento de la app, generadas por `tools/capturas/generar_iconos.js`.
33. **Se borraron los restos de la plantilla** (`hello-wave`, `parallax-scroll-view`, `collapsible`, `reset-project`, el logo de React y los colores del tema por defecto) y los íconos pasaron a un solo juego (Material) para que la app se vea igual en web, Android e iOS.
34. **El origen `http://localhost:8081` entra en `CORS_ORIGINS` de `.env.example`**: sin él, el navegador bloquea las llamadas de Expo web al backend.

## La IA

35. **El modelo por defecto pasó a `meta-llama/Llama-3.3-70B-Instruct`.** El proyecto traía `Qwen/Qwen2.5-7B-Instruct`, que el 23 de noviembre de 2026 ya no sirve ningún proveedor de Inference Providers: con un token válido, la API contestaba «model not supported by any provider» y el backend caía al respaldo sin que se notara. Se compararon Qwen2.5-72B y Llama-3.3-70B con tres sismos (superficial en zona preparada, moderado, profundo): los dos dieron JSON válido siempre; Llama tardó de 5 a 14 s por respuesta contra 11 a 13 s de Qwen, razonó en español cuando se le pidió y lo sirven muchos más proveedores (Qwen2.5-72B, solo dos). Llama-3.1-8B devolvió JSON roto.
36. **La lectura de la respuesta de la IA es una función pura con pruebas** (`app/services/respuesta_ia.py`, 17 pruebas): tolera el markdown alrededor del JSON, una coma sobrante y cifras escritas como texto; descarta los impactos inválidos en lugar de fallar todos.
37. **Sin token real no se llama a Hugging Face.** Antes, un `.env` con el texto de ejemplo hacía una llamada que fallaba por cada sismo nuevo. Ahora se usa el respaldo directamente y el token puede quedar vacío.
38. **El razonamiento se pide en español**, que es el idioma de la interfaz; las claves del JSON no cambian. Antes salía en inglés dentro de una interfaz en español.
39. **El reintento por modelo cargándose (503) está acotado a 3 intentos.** El anterior volvía a llamarse a sí mismo sin límite y, además, perdía el contexto histórico.
40. **La IA y las reglas se muestran como lo que son.** Para el M 6,5 a 598 km, la IA estimó 15 muertes y las reglas 3; el panel dice cuál de las dos produjo cada estimación y el README dice que ninguna está validada.
41. **El sismo se guarda antes de pedirle la estimación a la IA, y las interfaces muestran una rueda de carga mientras tanto.** La IA puede tardar varios segundos y antes el sismo no existía para nadie hasta que terminaba. Ahora el backend lo guarda y lo anuncia por WebSocket (`estimando: true`), pide la estimación, guarda los impactos y lo anuncia otra vez. La marca vive en un registro en memoria (`app/services/estimando.py`, como la lista de conexiones del WebSocket). Un sismo que quedó guardado sin estimación (el servidor se reinició a mitad) se completa en la consulta siguiente.
42. **Las pantallas miran la marca de la lista, que se actualiza con el WebSocket, no solo la del detalle.** En el móvil, el detalle abierto se quedaba con los datos viejos y no se enteraba; ahora vuelve a pedirse cuando la lista dice que el sismo empezó o terminó de estimarse, y cada 4 segundos mientras está pendiente.
43. **El aviso por WebSocket pasó a ser responsabilidad del procesador** y ya no de la consulta periódica: así lo envían igual la consulta cada 3 minutos y el procesamiento manual (`POST /api/events/process`), que antes no avisaba.
