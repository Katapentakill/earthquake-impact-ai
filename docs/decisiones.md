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
