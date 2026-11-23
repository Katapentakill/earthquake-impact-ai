'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Icono from './Icono';
import type { SeismicEvent } from '@/types';
import { nivelMagnitud } from '@/lib/seismic';
import { fmtEntero, fmtMagnitud, fmtRelativo, instante } from '@/lib/format';

/** Pedido de acercarse a un sismo; `nonce` cambia en cada pedido para que se repita aunque sea el mismo sismo. */
export interface Enfoque {
  id: string;
  nonce: number;
}

interface Props {
  eventos: SeismicEvent[];
  seleccionado: string | null;
  enfoque: Enfoque | null;
  ahora: number;
  onElegir: (id: string) => void;
}

const MUNDO: L.LatLngBoundsExpression = [[-58, -178], [78, 178]];
const radioPx = (m: number) => 5 + Math.max(0, m - 4.5) * 2.4;
const escapar = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function htmlGlobo(e: SeismicEvent, ahora: number): string {
  return `<b>M ${fmtMagnitud(e.magnitud)} · ${escapar(e.lugar ?? 'Sin nombre')}</b><span>${fmtRelativo(instante(e.fecha_utc), ahora)} · ${fmtEntero(e.profundidad)} km de profundidad</span>`;
}

export default function SeismicMap({ eventos, seleccionado, enfoque, ahora, onElegir }: Props) {
  const contRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<L.Map | null>(null);
  const capasRef = useRef<{ radio: L.LayerGroup; marcas: L.LayerGroup; pulso: L.LayerGroup } | null>(null);
  const marcasRef = useRef<Map<string, L.CircleMarker>>(new Map());
  // Valores que los manejadores del mapa leen al momento de usarse, para no rehacer el mapa cuando cambian.
  const ahoraRef = useRef(ahora);
  const eventosRef = useRef(eventos);
  const onElegirRef = useRef(onElegir);
  ahoraRef.current = ahora;
  eventosRef.current = eventos;
  onElegirRef.current = onElegir;

  // El mapa se crea una sola vez.
  useEffect(() => {
    if (!contRef.current || mapaRef.current) return;
    const mapa = L.map(contRef.current, { zoomControl: false, minZoom: 1, zoomSnap: 0.25, worldCopyJump: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      maxZoom: 12,
    }).addTo(mapa);
    mapa.fitBounds(MUNDO, { animate: false });
    capasRef.current = { radio: L.layerGroup().addTo(mapa), marcas: L.layerGroup().addTo(mapa), pulso: L.layerGroup().addTo(mapa) };
    mapaRef.current = mapa;
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(contRef.current);
    return () => {
      observador.disconnect();
      mapa.remove();
      mapaRef.current = null;
      capasRef.current = null;
      marcasRef.current.clear();
    };
  }, []);

  // Un círculo por sismo: los más grandes quedan debajo para que no tapen a los chicos.
  useEffect(() => {
    const capas = capasRef.current;
    if (!capas) return;
    capas.marcas.clearLayers();
    marcasRef.current.clear();
    [...eventos]
      .sort((a, b) => b.magnitud - a.magnitud)
      .forEach((e) => {
        const r = radioPx(e.magnitud);
        const marca = L.circleMarker([e.latitud, e.longitud], { radius: r, className: `mk l${nivelMagnitud(e.magnitud)}` });
        marca.bindTooltip(() => htmlGlobo(e, ahoraRef.current), { direction: 'top', offset: [0, -r], className: 'tip-sismo', opacity: 1 });
        marca.on('click', () => onElegirRef.current(e.event_id));
        // Los círculos de Leaflet son SVG: se les da rol de botón y foco para poder usarlos con teclado.
        marca.on('add', () => {
          const el = marca.getElement();
          if (!el) return;
          el.setAttribute('tabindex', '0');
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', `Magnitud ${fmtMagnitud(e.magnitud)}, ${e.lugar ?? 'sin nombre'}`);
          el.addEventListener('keydown', (ev: Event) => {
            const k = (ev as KeyboardEvent).key;
            if (k === 'Enter' || k === ' ') {
              ev.preventDefault();
              onElegirRef.current(e.event_id);
            }
          });
        });
        marca.addTo(capas.marcas);
        marcasRef.current.set(e.event_id, marca);
      });
  }, [eventos]);

  // El sismo elegido: borde de acento, radio de afectación y un pulso.
  useEffect(() => {
    const capas = capasRef.current;
    if (!capas) return;
    capas.radio.clearLayers();
    capas.pulso.clearLayers();
    marcasRef.current.forEach((m, id) => m.getElement()?.classList.toggle('sel', id === seleccionado));
    const e = eventos.find((x) => x.event_id === seleccionado);
    const marca = seleccionado ? marcasRef.current.get(seleccionado) : undefined;
    if (!e || !marca) return;
    if (e.radio_afectacion_km) {
      L.circle([e.latitud, e.longitud], { radius: e.radio_afectacion_km * 1000, className: 'radio', interactive: false }).addTo(capas.radio);
    }
    L.circleMarker([e.latitud, e.longitud], { radius: radioPx(e.magnitud) + 3, className: 'pulso', interactive: false }).addTo(capas.pulso);
    marca.bringToFront();
  }, [seleccionado, eventos]);

  // Acercarse cuando se elige desde la tabla o el gráfico.
  useEffect(() => {
    const mapa = mapaRef.current;
    const e = enfoque && eventosRef.current.find((x) => x.event_id === enfoque.id);
    if (!mapa || !e) return;
    const zoom = Math.max(mapa.getZoom(), 4.5);
    if (sinMovimiento()) mapa.setView([e.latitud, e.longitud], zoom);
    else mapa.flyTo([e.latitud, e.longitud], zoom, { duration: 0.8 });
  }, [enfoque]);

  return (
    <div className="mapa-wrap">
      <div ref={contRef} role="group" aria-label="Mapa mundial con los epicentros de los sismos" style={{ width: '100%', height: '100%' }} />
      <div className="mapa-ctl">
        <button className="btn-ico" type="button" aria-label="Acercar" onClick={() => mapaRef.current?.zoomIn()}>
          <Icono nombre="mas" />
        </button>
        <button className="btn-ico" type="button" aria-label="Alejar" onClick={() => mapaRef.current?.zoomOut()}>
          <Icono nombre="menos" />
        </button>
        <button className="btn-ico" type="button" aria-label="Ver todo el mundo" onClick={() => mapaRef.current?.fitBounds(MUNDO)}>
          <Icono nombre="ajustar" />
        </button>
      </div>
    </div>
  );
}
