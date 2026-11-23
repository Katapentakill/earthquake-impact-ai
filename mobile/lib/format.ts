// Copia de frontend/src/lib/format.ts (la misma lógica que la web). Si cambias algo aquí, cámbialo allá también.
// Formatos en español de Chile (coma decimal, hora UTC). Sin dependencias de React.
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const nf1 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const p2 = (n: number) => String(n).padStart(2, '0');

/** 6,5 */
export const fmtMagnitud = (m: number) => nf1.format(m);
export const fmtDecimal = (n: number) => nf1.format(n);
/** 1.234 */
export const fmtEntero = (n: number) => nf0.format(n);

/** 02:40 (UTC) a partir de un instante en milisegundos. */
export function fmtHora(t: number): string {
  const d = new Date(t);
  return `${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`;
}

/** 23 nov · 02:40 (UTC) */
export function fmtFecha(t: number): string {
  const d = new Date(t);
  return `${p2(d.getUTCDate())} ${MESES[d.getUTCMonth()]} · ${fmtHora(t)}`;
}

/** 23 nov */
export function fmtDia(t: number): string {
  const d = new Date(t);
  return `${p2(d.getUTCDate())} ${MESES[d.getUTCMonth()]}`;
}

/** El instante de un evento a partir de la fecha ISO sin zona que entrega la API (siempre UTC). */
export const instante = (isoUtc: string) => Date.parse(isoUtc.endsWith('Z') ? isoUtc : isoUtc + 'Z');

/** hace 31 min · hace 5 h 36 min · hace 3 d */
export function fmtRelativo(t: number, ahora: number): string {
  const min = Math.max(0, Math.round((ahora - t) / 60000));
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 48) return min % 60 ? `hace ${h} h ${min % 60} min` : `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/** 13,66° S, 172,24° E */
export function fmtCoordenadas(lat: number, lon: number): string {
  const dec = (n: number) => nf2.format(Math.abs(n));
  return `${dec(lat)}° ${lat < 0 ? 'S' : 'N'}, ${dec(lon)}° ${lon < 0 ? 'O' : 'E'}`;
}

/** US$ 650 millones · US$ 1,2 mil millones · US$ 5 mil */
export function fmtDinero(usd: number): string {
  if (usd >= 1e9) return `US$ ${nf1.format(usd / 1e9)} mil millones`;
  if (usd >= 1e6) return `US$ ${nf0.format(usd / 1e6)} millones`;
  if (usd >= 1e3) return `US$ ${nf0.format(usd / 1e3)} mil`;
  return `US$ ${nf0.format(usd)}`;
}
