// Copia de frontend/src/lib/seismic.ts (la misma lógica que la web). Si cambias algo aquí, cámbialo allá también.
// Lógica pura de la interfaz (sin React ni DOM): niveles, filtros, orden, resúmenes y CSV.
// Se prueba con `npm test` (node:test), por eso no usa alias de rutas ni enums.
import type { ImpactData, SeismicEvent } from './types';

/** Instante (ms) de la fecha ISO sin zona que entrega la API; siempre es UTC. */
const ts = (iso: string): number => Date.parse(iso.endsWith('Z') ? iso : iso + 'Z');

/* ───────── Niveles ───────── */

export type NivelMagnitud = 1 | 2 | 3 | 4;

/** 1: menos de 5 · 2: de 5 a 5,9 · 3: de 6 a 6,9 · 4: 7 o más (la escala de color del mapa y las insignias). */
export function nivelMagnitud(m: number): NivelMagnitud {
  return m >= 7 ? 4 : m >= 6 ? 3 : m >= 5 ? 2 : 1;
}

export type ClaseProfundidad = 'superficial' | 'intermedia' | 'profunda';

export const ETIQUETA_PROFUNDIDAD: Record<ClaseProfundidad, string> = {
  superficial: 'Superficial',
  intermedia: 'Intermedia',
  profunda: 'Profunda',
};

export function claseProfundidad(km: number): ClaseProfundidad {
  return km < 70 ? 'superficial' : km <= 300 ? 'intermedia' : 'profunda';
}

export const NIVELES_DESTRUCCION = ['BAJO', 'MODERADO', 'ALTO', 'CATASTROFICO'];
export const ETIQUETA_DESTRUCCION = ['Bajo', 'Moderado', 'Alto', 'Catastrófico'];

/** Posición (0 a 3) de un nivel de destrucción; acepta mayúsculas, minúsculas y tildes. Lo desconocido es 0. */
export function indiceDestruccion(nivel?: string | null): number {
  const limpio = String(nivel ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const i = NIVELES_DESTRUCCION.indexOf(limpio);
  return i < 0 ? 0 : i;
}

/** ¿La estimación de este evento salió de las reglas de respaldo (sin IA)? */
export function esRespaldo(impactos: ImpactData[]): boolean {
  return impactos.length > 0 && impactos.every((i) => (i.fuentes_inferidas ?? []).some((f) => /fallback|respaldo/i.test(f)));
}

/* ───────── Filtros y orden ───────── */

export interface Filtros {
  magMin: number;
  profundidad: ClaseProfundidad | 'todas';
  texto: string;
}

export const FILTROS_INICIALES: Filtros = { magMin: 0, profundidad: 'todas', texto: '' };

export function filtrarEventos(eventos: SeismicEvent[], f: Filtros): SeismicEvent[] {
  const q = f.texto.trim().toLowerCase();
  return eventos.filter(
    (e) =>
      e.magnitud >= f.magMin &&
      (f.profundidad === 'todas' || claseProfundidad(e.profundidad) === f.profundidad) &&
      (!q || `${e.lugar ?? ''} ${e.event_id}`.toLowerCase().includes(q)),
  );
}

export type ClaveOrden = 'magnitud' | 'lugar' | 'fecha' | 'profundidad' | 'radio' | 'impacto';

export function ordenarEventos(eventos: SeismicEvent[], clave: ClaveOrden, dir: 1 | -1): SeismicEvent[] {
  const valor = (e: SeismicEvent): number | string => {
    switch (clave) {
      case 'magnitud': return e.magnitud;
      case 'lugar': return (e.lugar ?? '').toLowerCase();
      case 'fecha': return ts(e.fecha_utc);
      case 'profundidad': return e.profundidad;
      case 'radio': return e.radio_afectacion_km ?? 0;
      case 'impacto': return e.nivel_destruccion ? indiceDestruccion(e.nivel_destruccion) : -1;
    }
  };
  return [...eventos].sort((a, b) => {
    const x = valor(a), y = valor(b);
    const c = x < y ? -1 : x > y ? 1 : 0;
    return c * dir || ts(b.fecha_utc) - ts(a.fecha_utc);
  });
}

/** El sismo de mayor magnitud (el más reciente si hay empate); null si la lista está vacía. */
export function mayorEvento(eventos: SeismicEvent[]): SeismicEvent | null {
  return eventos.reduce<SeismicEvent | null>(
    (a, b) => (!a || b.magnitud > a.magnitud || (b.magnitud === a.magnitud && b.fecha_utc > a.fecha_utc) ? b : a),
    null,
  );
}

/* ───────── Resúmenes ───────── */

export interface Resumen {
  total: number;
  mayor: SeismicEvent | null;
  media: number;
  deCincoOMas: number;
  porNivel: [number, number, number, number];
  /** Cantidad de sismos en cada tramo del período (de más antiguo a más reciente). */
  actividad: number[];
}

export function resumir(eventos: SeismicEvent[], ahora: number, horasPeriodo: number, tramos = 8): Resumen {
  const porNivel: [number, number, number, number] = [0, 0, 0, 0];
  const actividad = new Array<number>(tramos).fill(0);
  const ancho = (horasPeriodo * 3600e3) / tramos;
  let suma = 0;
  let deCincoOMas = 0;
  for (const e of eventos) {
    suma += e.magnitud;
    if (e.magnitud >= 5) deCincoOMas++;
    porNivel[nivelMagnitud(e.magnitud) - 1]++;
    const hace = ahora - ts(e.fecha_utc);
    const i = tramos - 1 - Math.min(tramos - 1, Math.max(0, Math.floor(hace / ancho)));
    actividad[i]++;
  }
  return { total: eventos.length, mayor: mayorEvento(eventos), media: eventos.length ? suma / eventos.length : 0, deCincoOMas, porNivel, actividad };
}

export interface Tramo { desde: number; hasta: number; nivel: NivelMagnitud; cantidad: number }

export const TRAMOS_MAGNITUD: [number, number, NivelMagnitud][] = [
  [4.5, 5, 1], [5, 5.5, 2], [5.5, 6, 2], [6, 6.5, 3], [6.5, 7, 3], [7, 99, 4],
];

export function histograma(eventos: SeismicEvent[]): Tramo[] {
  return TRAMOS_MAGNITUD.map(([desde, hasta, nivel]) => ({
    desde, hasta, nivel, cantidad: eventos.filter((e) => e.magnitud >= desde && e.magnitud < hasta).length,
  }));
}

export function repartoProfundidad(eventos: SeismicEvent[]): Record<ClaseProfundidad, number> {
  const r: Record<ClaseProfundidad, number> = { superficial: 0, intermedia: 0, profunda: 0 };
  eventos.forEach((e) => { r[claseProfundidad(e.profundidad)]++; });
  return r;
}

/** Marcas del eje de tiempo, alineadas a horas o días UTC "redondos" dentro de [inicio, fin]. */
export function marcasDeTiempo(inicio: number, fin: number, horasPeriodo: number): number[] {
  const paso = (horasPeriodo <= 24 ? 4 : horasPeriodo <= 24 * 8 ? 24 : 24 * 5) * 3600e3;
  const marcas: number[] = [];
  for (let t = Math.ceil(inicio / paso) * paso; t <= fin; t += paso) marcas.push(t);
  return marcas;
}

/* ───────── CSV ───────── */

export function aCsv(eventos: SeismicEvent[]): string {
  const cab = 'id,magnitud,lugar,fecha_utc,profundidad_km,latitud,longitud,radio_km,nivel_destruccion,estimacion';
  const filas = eventos.map((e) =>
    [
      e.event_id, e.magnitud, `"${(e.lugar ?? '').replace(/"/g, '""')}"`, `${e.fecha_utc}Z`, e.profundidad,
      e.latitud, e.longitud, e.radio_afectacion_km ?? '', e.nivel_destruccion ?? '', e.estimacion ?? '',
    ].join(','),
  );
  return [cab, ...filas].join('\n');
}
