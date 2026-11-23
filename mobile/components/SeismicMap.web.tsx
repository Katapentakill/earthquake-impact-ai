// Mapa para la web (`expo start --web`), con Leaflet: react-native-maps no existe en el navegador.
// Sirve para ver y probar la app en un PC; en el teléfono se usa SeismicMap.tsx (mapa nativo).
import L from 'leaflet';
import './leaflet.css';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ESCALA_MAGNITUD } from '@/constants/paleta';
import { useTema } from '@/lib/ajustes';
import { nivelMagnitud } from '@/lib/seismic';
import type { SeismicEvent } from '@/lib/types';
import { Icono } from './Icono';

export interface PropsMapa {
  eventos: SeismicEvent[];
  elegido: string | null;
  onElegir: (id: string) => void;
}

const MUNDO: L.LatLngBoundsExpression = [[-58, -178], [78, 178]];
/** Todo el mundo a lo ancho, centrado en el ecuador, para que las franjas vacías (polos) queden parejas arriba y abajo. */
const verMundo = (m: L.Map, animar = false) => m.setView([0, 0], m.getBoundsZoom(MUNDO), { animate: animar });
const radioPx = (m: number) => 5 + Math.max(0, m - 4.5) * 2.4;
// Las teselas de OpenStreetMap se tiñen con un filtro para que combinen con cada tema (los mismos filtros de la web).
const FILTRO_TESELAS = {
  claro: 'sepia(0.5) saturate(0.7) hue-rotate(-12deg) brightness(0.97) contrast(0.9)',
  oscuro: 'invert(1) hue-rotate(180deg) brightness(0.72) contrast(0.95) saturate(0.4) sepia(0.3)',
};

export function SeismicMap({ eventos, elegido, onElegir }: PropsMapa) {
  const p = useTema();
  const cont = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capas = useRef<{ marcas: L.LayerGroup; radio: L.LayerGroup } | null>(null);
  const alElegir = useRef(onElegir);
  // Lo último que el mapa debe saber al encuadrarse por primera vez (el sismo elegido puede venir de la pantalla de detalle).
  const ultimo = useRef({ eventos, elegido });
  const encuadrado = useRef(false);
  useEffect(() => {
    alElegir.current = onElegir;
    ultimo.current = { eventos, elegido };
  }, [onElegir, eventos, elegido]);

  // El mapa se crea una sola vez.
  useEffect(() => {
    if (!cont.current || mapa.current) return;
    const m = L.map(cont.current, { zoomControl: false, attributionControl: false, minZoom: 0, zoomSnap: 0.25, worldCopyJump: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 12 }).addTo(m);
    m.setView([0, 0], 1, { animate: false });
    capas.current = { radio: L.layerGroup().addTo(m), marcas: L.layerGroup().addTo(m) };
    mapa.current = m;
    // La primera vez que el contenedor tiene tamaño real se encuadra (el sismo elegido o, si no hay, el mundo); después solo se ajusta al cambiar de tamaño.
    const observador = new ResizeObserver(() => {
      m.invalidateSize();
      if (!encuadrado.current && m.getSize().x > 0 && m.getSize().y > 0) {
        encuadrado.current = true;
        const e = ultimo.current.eventos.find((x) => x.event_id === ultimo.current.elegido);
        if (e) m.setView([e.latitud, e.longitud], 4.5, { animate: false });
        else verMundo(m);
      }
    });
    observador.observe(cont.current);
    return () => {
      observador.disconnect();
      m.remove();
      mapa.current = null;
      capas.current = null;
      encuadrado.current = false;
    };
  }, []);

  // Colores según el tema: fondo del océano y filtro de las teselas.
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    m.getContainer().style.background = p.ocean;
    m.getPane('tilePane')!.style.filter = FILTRO_TESELAS[p.nombre];
  }, [p]);

  // Un círculo por sismo (los más grandes debajo); el elegido lleva borde de acento y su radio de afectación.
  useEffect(() => {
    const c = capas.current;
    if (!c) return;
    c.marcas.clearLayers();
    c.radio.clearLayers();
    [...eventos]
      .sort((a, b) => b.magnitud - a.magnitud)
      .forEach((e) => {
        const esElegido = e.event_id === elegido;
        const marca = L.circleMarker([e.latitud, e.longitud], {
          radius: radioPx(e.magnitud),
          color: esElegido ? p.accent : p.markerStroke,
          weight: esElegido ? 3 : 1,
          fillColor: ESCALA_MAGNITUD[nivelMagnitud(e.magnitud)].fondo,
          fillOpacity: 0.85,
        });
        marca.on('click', () => alElegir.current(e.event_id));
        marca.addTo(c.marcas);
        if (esElegido) {
          marca.bringToFront();
          if (e.radio_afectacion_km) {
            L.circle([e.latitud, e.longitud], { radius: e.radio_afectacion_km * 1000, color: p.accent, weight: 1.5, dashArray: '5 5', fillColor: p.accent, fillOpacity: 0.1, interactive: false }).addTo(c.radio);
          }
        }
      });
  }, [eventos, elegido, p]);

  // Acercarse al sismo elegido.
  useEffect(() => {
    const m = mapa.current;
    const e = eventos.find((x) => x.event_id === elegido);
    if (!m || !e || !encuadrado.current) return;
    m.flyTo([e.latitud, e.longitud], Math.max(m.getZoom(), 4.5), { duration: 0.8 });
    // Solo debe moverse cuando cambia el sismo elegido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elegido]);

  const boton = { width: 44, height: 44, borderRadius: 11, borderWidth: 1, borderColor: p.border, backgroundColor: p.surface, alignItems: 'center' as const, justifyContent: 'center' as const };
  return (
    <View style={StyleSheet.absoluteFill}>
      <div ref={cont} role="group" aria-label="Mapa mundial con los epicentros de los sismos" style={{ width: '100%', height: '100%', isolation: 'isolate' }} />
      <View style={{ position: 'absolute', top: 12, right: 12, gap: 8 }}>
        <Pressable accessibilityLabel="Acercar" accessibilityRole="button" style={boton} onPress={() => mapa.current?.zoomIn()}>
          <Icono nombre="add" color={p.text} />
        </Pressable>
        <Pressable accessibilityLabel="Alejar" accessibilityRole="button" style={boton} onPress={() => mapa.current?.zoomOut()}>
          <Icono nombre="remove" color={p.text} />
        </Pressable>
        <Pressable accessibilityLabel="Ver todo el mundo" accessibilityRole="button" style={boton} onPress={() => mapa.current && verMundo(mapa.current, true)}>
          <Icono nombre="zoom-out-map" color={p.text} />
        </Pressable>
      </View>
      <Text style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: p.surface, color: p.text2, fontSize: 11, paddingHorizontal: 8, paddingVertical: 3, borderTopLeftRadius: 8 }}>
        © colaboradores de OpenStreetMap
      </Text>
    </View>
  );
}
