'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { eventsApi } from '@/lib/api';
import WebSocketClient from '@/lib/websocket';
import { useAhora, useMontado, useTema } from '@/lib/hooks';
import { FILTROS_INICIALES, filtrarEventos, mayorEvento, resumir } from '@/lib/seismic';
import type { Filtros } from '@/lib/seismic';
import type { SeismicEvent } from '@/types';
import TopBar from '@/components/TopBar';
import KpiCards from '@/components/KpiCards';
import FilterBar, { PERIODOS } from '@/components/FilterBar';
import type { Periodo } from '@/components/FilterBar';
import EventPanel from '@/components/EventPanel';
import EventsTable from '@/components/EventsTable';
import { BarrasProfundidad, GraficoTiempo, Histograma } from '@/components/Charts';
import type { Enfoque } from '@/components/SeismicMap';

// El mapa usa Leaflet, que necesita el navegador: no se dibuja en el servidor.
const SeismicMap = dynamic(() => import('@/components/SeismicMap'), {
  ssr: false,
  loading: () => <div className="mapa-wrap esqueleto" aria-busy="true" aria-label="Cargando el mapa" />,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Home() {
  const { tema, elegir: elegirTema } = useTema();
  const ahora = useAhora(30_000);
  const montado = useMontado();

  const [periodo, setPeriodo] = useState<Periodo>('24h');
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [eventos, setEventos] = useState<SeismicEvent[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');
  const [ultimaCarga, setUltimaCarga] = useState<number | null>(null);
  const [conectado, setConectado] = useState(false);
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [enfoque, setEnfoque] = useState<Enfoque | null>(null);

  const cargar = useCallback(async () => {
    try {
      // La API entrega fechas UTC sin zona: se le pasa el inicio del período en el mismo formato.
      const desde = new Date(Date.now() - PERIODOS[periodo].horas * 3600e3).toISOString().slice(0, 19);
      const respuesta = await eventsApi.getEvents({ limit: 500, start_date: desde });
      setEventos(respuesta.events);
      setEstado('listo');
      setUltimaCarga(Date.now());
    } catch (error) {
      console.error('No se pudieron cargar los sismos:', error);
      setEstado((e) => (e === 'listo' ? e : 'error'));
    }
  }, [periodo]);

  // Carga al abrir y al cambiar de período; luego, cada 3 minutos (lo mismo que consulta el backend al USGS).
  useEffect(() => {
    cargar();
    const id = setInterval(cargar, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, [cargar]);

  // Aviso en tiempo real de sismos nuevos.
  useEffect(() => {
    const ws = new WebSocketClient(`${API_URL.replace(/^http/, 'ws')}/ws`);
    ws.onStatus(setConectado);
    ws.onMessage((mensaje) => {
      if (mensaje.type === 'new_earthquake') cargar();
    });
    ws.connect();
    return () => ws.disconnect();
  }, [cargar]);

  const visibles = useMemo(() => filtrarEventos(eventos, filtros), [eventos, filtros]);
  const resumen = useMemo(() => resumir(visibles, ahora, PERIODOS[periodo].horas), [visibles, ahora, periodo]);
  // Si el sismo elegido ya no cumple los filtros, el panel muestra el de mayor magnitud.
  const idActivo = useMemo(() => {
    if (seleccion && visibles.some((e) => e.event_id === seleccion)) return seleccion;
    return mayorEvento(visibles)?.event_id ?? null;
  }, [seleccion, visibles]);
  const activo = visibles.find((e) => e.event_id === idActivo) ?? null;

  const elegirDesdeMapa = useCallback((id: string) => setSeleccion(id), []);
  const elegirYAcercar = useCallback((id: string) => {
    setSeleccion(id);
    setEnfoque((e) => ({ id, nonce: (e?.nonce ?? 0) + 1 }));
  }, []);

  return (
    <>
      <a className="skip" href="#contenido">Saltar al contenido</a>
      <TopBar tema={tema} onTema={elegirTema} conectado={conectado} ultimaCarga={ultimaCarga} ahora={ahora} />

      <main id="contenido" className="wrap">
        {estado === 'error' && (
          <div className="error-banner" role="alert">
            No se pudo conectar con el servidor ({API_URL}). Revisa que el backend esté encendido.
            <button type="button" className="link" onClick={cargar}>Reintentar</button>
          </div>
        )}

        <KpiCards resumen={resumen} ahora={ahora} horasPeriodo={PERIODOS[periodo].horas} etiquetaPeriodo={PERIODOS[periodo].etiqueta} cargando={estado === 'cargando'} />

        <FilterBar periodo={periodo} filtros={filtros} mostrando={visibles.length} total={eventos.length} onPeriodo={setPeriodo} onFiltros={setFiltros} />

        <div className="rejilla">
          <div className="col">
            <section className="card" aria-labelledby="h-mapa">
              <div className="card-h">
                <div>
                  <h2 id="h-mapa">Mapa de epicentros</h2>
                  <p>Arrastra para mover · el círculo punteado es el radio de afectación</p>
                </div>
              </div>
              <SeismicMap eventos={visibles} seleccionado={idActivo} enfoque={enfoque} ahora={ahora} onElegir={elegirDesdeMapa} />
              <div className="leyenda" aria-label="Leyenda de magnitud">
                <span><i className="dot l1" /> 4,5 a 4,9</span>
                <span><i className="dot l2" /> 5,0 a 5,9</span>
                <span><i className="dot l3" /> 6,0 a 6,9</span>
                <span><i className="dot l4" /> 7,0 o más</span>
              </div>
            </section>

            <section className="card graf" aria-labelledby="h-tiempo">
              <div className="card-h">
                <div>
                  <h2 id="h-tiempo">Magnitud en {PERIODOS[periodo].titulo}</h2>
                  <p>Cada punto es un sismo; haz clic para ver su detalle</p>
                </div>
              </div>
              <div className="card-b">
                {montado ? (
                  <GraficoTiempo eventos={visibles} seleccionado={idActivo} ahora={ahora} horasPeriodo={PERIODOS[periodo].horas} onElegir={elegirYAcercar} />
                ) : (
                  <div className="esqueleto" style={{ height: 214 }} aria-busy="true" />
                )}
              </div>
            </section>
          </div>

          <aside className="panel-lado card" aria-labelledby="h-evento">
            <EventPanel evento={activo} ahora={ahora} />
          </aside>
        </div>

        <div className="dos">
          <section className="card graf" aria-labelledby="h-hist">
            <div className="card-h"><div><h2 id="h-hist">Sismos por magnitud</h2><p>Cuántos hay en cada tramo</p></div></div>
            <div className="card-b"><Histograma eventos={visibles} /></div>
          </section>
          <section className="card" aria-labelledby="h-prof">
            <div className="card-h"><div><h2 id="h-prof">Sismos por profundidad</h2><p>Cuanto más profundo, menos se siente en superficie</p></div></div>
            <div className="card-b"><BarrasProfundidad eventos={visibles} /></div>
          </section>
        </div>

        <EventsTable eventos={visibles} total={eventos.length} seleccionado={idActivo} ahora={ahora} onElegir={elegirYAcercar} />
      </main>

      <footer>
        <div className="wrap">
          <span>Fuente: USGS Earthquake Catalog (dominio público). Las estimaciones de impacto son automáticas y no son información oficial.</span>
          <span>Mapa © OpenStreetMap</span>
        </div>
      </footer>
    </>
  );
}
