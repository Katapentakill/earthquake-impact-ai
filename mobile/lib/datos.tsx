// Los datos que comparten las pantallas: sismos del período, alertas, estado de la conexión y el sismo elegido.
// Recarga cada 3 minutos (como la web) y cuando el WebSocket avisa de un sismo nuevo.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { eventsApi, mensajeDeError } from './api';
import { WS_URL } from './config';
import { useAjustes } from './ajustes';
import type { SeismicEvent } from './types';
import WebSocketClient from './websocket';

export type Periodo = '24h' | '7d' | '30d';
export const PERIODOS: Record<Periodo, { horas: number; corta: string; etiqueta: string }> = {
  '24h': { horas: 24, corta: '24 h', etiqueta: 'últimas 24 h' },
  '7d': { horas: 24 * 7, corta: '7 días', etiqueta: 'últimos 7 días' },
  '30d': { horas: 24 * 30, corta: '30 días', etiqueta: 'últimos 30 días' },
};

const LIMITE = 500;
const DIAS_ALERTAS = 30;
const REFRESCO_MS = 3 * 60 * 1000;
const desde = (horas: number) => new Date(Date.now() - horas * 3600e3).toISOString().slice(0, 19);

export type EstadoCarga = 'cargando' | 'ok' | 'error';

interface Datos {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  eventos: SeismicEvent[];
  /** Sismos de magnitud igual o mayor al umbral en los últimos 30 días. */
  alertas: SeismicEvent[];
  estado: EstadoCarga;
  /** Mensaje del último fallo (puede haber datos viejos a la vista). */
  error: string | null;
  ultimaActualizacion: number | null;
  recargar: () => Promise<void>;
  /** Hora actual, refrescada cada 30 s, para los «hace 5 min». */
  ahora: number;
  /** ¿Está conectado el WebSocket? */
  enVivo: boolean;
  /** Sismos anunciados por el WebSocket desde que se abrió la app. */
  nuevos: string[];
  elegido: string | null;
  elegir: (id: string | null) => void;
}

const Contexto = createContext<Datos | null>(null);

export function DatosProvider({ children }: { children: ReactNode }) {
  const { umbral } = useAjustes();
  const [periodo, setPeriodo] = useState<Periodo>('24h');
  const [eventos, setEventos] = useState<SeismicEvent[]>([]);
  const [alertas, setAlertas] = useState<SeismicEvent[]>([]);
  const [estado, setEstado] = useState<EstadoCarga>('cargando');
  const [error, setError] = useState<string | null>(null);
  const [ultima, setUltima] = useState<number | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [enVivo, setEnVivo] = useState(false);
  const [nuevos, setNuevos] = useState<string[]>([]);
  const [elegido, elegir] = useState<string | null>(null);
  const peticion = useRef(0);

  const cargar = useCallback(async () => {
    const n = ++peticion.current;
    try {
      const [lista, avisos] = await Promise.all([
        eventsApi.getEvents({ limit: LIMITE, start_date: desde(PERIODOS[periodo].horas) }),
        eventsApi.getEvents({ limit: 100, min_magnitude: umbral, start_date: desde(24 * DIAS_ALERTAS) }),
      ]);
      if (n !== peticion.current) return; // llegó otra petición más nueva
      setEventos(lista.events);
      setAlertas(avisos.events);
      setEstado('ok');
      setError(null);
      setUltima(Date.now());
      setAhora(Date.now());
    } catch (e) {
      if (n !== peticion.current) return;
      setError(mensajeDeError(e));
      setEstado((previo) => (previo === 'ok' ? 'ok' : 'error'));
    }
  }, [periodo, umbral]);

  useEffect(() => {
    setEstado('cargando');
    cargar();
  }, [cargar]);

  useEffect(() => {
    const t = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    const t = setInterval(() => setAhora(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  // El WebSocket se abre una sola vez; usa siempre la versión más reciente de `cargar`.
  const cargarActual = useRef(cargar);
  useEffect(() => {
    cargarActual.current = cargar;
  }, [cargar]);
  useEffect(() => {
    const ws = new WebSocketClient(WS_URL);
    ws.onStatus(setEnVivo);
    ws.onMessage((m) => {
      if (m.type !== 'new_earthquake') return;
      const id = m.data?.event.event_id;
      if (id) setNuevos((prev) => (prev.includes(id) ? prev : [id, ...prev].slice(0, 50)));
      cargarActual.current();
    });
    ws.connect();
    return () => ws.disconnect();
  }, []);

  const valor = useMemo<Datos>(
    () => ({ periodo, setPeriodo, eventos, alertas, estado, error, ultimaActualizacion: ultima, recargar: cargar, ahora, enVivo, nuevos, elegido, elegir }),
    [periodo, eventos, alertas, estado, error, ultima, cargar, ahora, enVivo, nuevos, elegido],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDatos(): Datos {
  const v = useContext(Contexto);
  if (!v) throw new Error('useDatos debe usarse dentro de DatosProvider');
  return v;
}
