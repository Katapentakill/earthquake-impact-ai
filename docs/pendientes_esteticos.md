# Pendientes estéticos

Lista de lo estético, con lo hecho marcado. Lo funcional va primero; esto es lo que se pulió y lo que quedó pendiente a propósito.

- [x] Paleta con dos temas a partir de variables CSS: crema atenuado (sin blancos puros) y oscuro cálido, con un solo acento.
- [x] Sin degradados azul y morado; escala de magnitud de cuatro colores igual en ambos temas.
- [x] Tarjetas de resumen (sismos, mayor magnitud, magnitud media, de 5 o más) con su minigráfico.
- [x] Mapa Leaflet con teselas teñidas por tema, círculos por magnitud, radio de afectación del sismo elegido y botones de acercar, alejar y ver todo.
- [x] Panel del sismo elegido con la hora, la profundidad, las coordenadas, el impacto estimado, el nivel de destrucción y de dónde sale la estimación.
- [x] Gráficos en SVG propio: magnitud en el tiempo, sismos por tramo de magnitud y por profundidad.
- [x] Tabla ordenable con exportación a CSV, búsqueda y filtros por período, magnitud y profundidad.
- [x] Interfaz en español, con coma decimal y hora UTC.
- [x] Estados de carga (esqueletos), de error con «Reintentar» y de lista vacía.
- [x] Foco visible, uso completo con teclado, etiquetas en los controles y texto alternativo en los gráficos.
- [x] Contraste de texto de al menos 4,5:1 medido por script en crema, oscuro y celular.
- [x] Sin desborde horizontal en celular; el panel baja bajo el mapa.
- [x] Respeta «reducir movimiento» y la preferencia de tema del sistema.
- [x] Capturas en crema, oscuro y celular en el README, y el «antes» en `docs/img/antes/`.
- [x] Prototipo interactivo previo en `docs/prototipo_visual.html`.
- [x] README en inglés y español con «Límites, con honestidad».
- [ ] Valores al pasar el mouse sobre los puntos y barras de los gráficos (hoy salen como título nativo).
- [ ] Paginación de la tabla (hoy se desplaza; el tope es de 500 eventos).
- [ ] Traducir los nombres de lugar del USGS.
- [ ] Versión en inglés de la interfaz.
- [ ] Hoja de estilos de impresión para el resumen.
- [x] Cliente móvil (Expo) rediseñado con la misma paleta: cuatro pestañas, detalle del sismo, mapa, alertas en vivo y ajustes (ver [mobile/README.md](../mobile/README.md)).
- [ ] Teselas de un proveedor propio en lugar de las de OpenStreetMap.
- [ ] Probar el cliente móvil en un teléfono real (mapa nativo, gestos, vibración, rendimiento con 500 sismos); hoy solo se vio en el navegador y se compiló para Android e iOS.
- [ ] Marcadores del mapa nativo como círculos por magnitud (hoy son pines teñidos) y estilo oscuro del mapa en Android.
- [ ] Notificaciones push de los sismos grandes.
- [ ] Quitar de `mobile/package.json` las dependencias de la plantilla que ya no se usan (`react-native-reanimated`, `react-native-worklets`, `expo-image`, `expo-web-browser`).
