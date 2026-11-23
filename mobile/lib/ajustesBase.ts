// Lo puro de los ajustes (sin React Native), para poder probarlo: valores posibles y validación de lo guardado.

export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro';

export interface Ajustes {
  tema: PreferenciaTema;
  /** Magnitud mínima de las alertas. */
  umbral: number;
}

export const UMBRALES = [5, 5.5, 6, 6.5, 7];
export const AJUSTES_POR_DEFECTO: Ajustes = { tema: 'sistema', umbral: 6 };

/** Acepta solo valores válidos; lo demás vuelve al valor por defecto. */
export function sanearAjustes(crudo: unknown): Ajustes {
  const o = (crudo && typeof crudo === 'object' ? crudo : {}) as Partial<Ajustes>;
  return {
    tema: o.tema === 'claro' || o.tema === 'oscuro' || o.tema === 'sistema' ? o.tema : AJUSTES_POR_DEFECTO.tema,
    umbral: typeof o.umbral === 'number' && UMBRALES.includes(o.umbral) ? o.umbral : AJUSTES_POR_DEFECTO.umbral,
  };
}
