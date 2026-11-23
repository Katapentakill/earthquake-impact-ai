import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTROS_INICIALES, aCsv, claseProfundidad, esRespaldo, filtrarEventos, histograma, indiceDestruccion,
  marcasDeTiempo, mayorEvento, nivelMagnitud, ordenarEventos, repartoProfundidad, resumir,
} from '../lib/seismic.ts';

const AHORA = Date.UTC(2026, 10, 23, 3, 12);
const hace = (min: number) => new Date(AHORA - min * 60000).toISOString().slice(0, 19);
let n = 0;
const ev = (o: Record<string, unknown> = {}) => ({
  event_id: `us${++n}`, magnitud: 5, profundidad: 10, latitud: 0, longitud: 0, fecha_utc: hace(60),
  lugar: 'Algún lugar', radio_afectacion_km: 50, fuente_api: 'USGS', ...o,
}) as any;

test('nivelMagnitud: los cortes son 5, 6 y 7', () => {
  assert.deepEqual([4.5, 4.9, 5, 5.9, 6, 6.9, 7, 8.2].map(nivelMagnitud), [1, 1, 2, 2, 3, 3, 4, 4]);
});

test('claseProfundidad: superficial, intermedia y profunda', () => {
  assert.deepEqual([0, 69.9, 70, 300, 300.1, 601].map(claseProfundidad), ['superficial', 'superficial', 'intermedia', 'intermedia', 'profunda', 'profunda']);
});

test('indiceDestruccion acepta mayúsculas, minúsculas y tildes, y lo desconocido es 0', () => {
  assert.equal(indiceDestruccion('CATASTROFICO'), 3);
  assert.equal(indiceDestruccion('Catastrófico'), 3);
  assert.equal(indiceDestruccion('moderado'), 1);
  assert.equal(indiceDestruccion('raro'), 0);
  assert.equal(indiceDestruccion(null), 0);
});

test('esRespaldo reconoce la marca nueva y la antigua, y exige que todos los impactos la tengan', () => {
  const imp = (f: string[]) => ({ fuentes_inferidas: f }) as any;
  assert.equal(esRespaldo([]), false);
  assert.equal(esRespaldo([imp(['Estimación por reglas (respaldo) - modelo de IA no disponible'])]), true);
  assert.equal(esRespaldo([imp(['Fallback estimation - AI unavailable'])]), true);
  assert.equal(esRespaldo([imp(['Fallback estimation']), imp(['USGS PAGER'])]), false);
  assert.equal(esRespaldo([imp([])]), false);
});

test('filtrarEventos combina magnitud, profundidad y texto', () => {
  const a = ev({ magnitud: 6.1, profundidad: 10, lugar: 'Vanuatu region' });
  const b = ev({ magnitud: 4.7, profundidad: 150, lugar: '9 km N of Carhuamayo, Peru' });
  const c = ev({ magnitud: 5.5, profundidad: 500, lugar: 'south of the Fiji Islands' });
  const todos = [a, b, c];
  assert.equal(filtrarEventos(todos, FILTROS_INICIALES).length, 3);
  assert.deepEqual(filtrarEventos(todos, { ...FILTROS_INICIALES, magMin: 5 }), [a, c]);
  assert.deepEqual(filtrarEventos(todos, { ...FILTROS_INICIALES, profundidad: 'profunda' }), [c]);
  assert.deepEqual(filtrarEventos(todos, { ...FILTROS_INICIALES, texto: ' peru ' }), [b]);
  assert.deepEqual(filtrarEventos(todos, { ...FILTROS_INICIALES, texto: b.event_id.toUpperCase() }), [b]);
  assert.deepEqual(filtrarEventos(todos, { magMin: 5, profundidad: 'superficial', texto: 'vanuatu' }), [a]);
});

test('ordenarEventos ordena por columna y desempata por fecha reciente', () => {
  const a = ev({ magnitud: 5, fecha_utc: hace(300), lugar: 'b' });
  const b = ev({ magnitud: 6, fecha_utc: hace(200), lugar: 'a' });
  const c = ev({ magnitud: 5, fecha_utc: hace(100), lugar: 'c' });
  assert.deepEqual(ordenarEventos([a, b, c], 'magnitud', -1).map((e) => e.lugar), ['a', 'c', 'b']);
  assert.deepEqual(ordenarEventos([a, b, c], 'lugar', 1).map((e) => e.lugar), ['a', 'b', 'c']);
  assert.deepEqual(ordenarEventos([a, b, c], 'fecha', -1).map((e) => e.lugar), ['c', 'a', 'b']);
});

test('ordenarEventos por impacto deja primero los más graves y al final los sin estimación', () => {
  const sin = ev({ lugar: 'sin' });
  const alto = ev({ lugar: 'alto', nivel_destruccion: 'ALTO' });
  const bajo = ev({ lugar: 'bajo', nivel_destruccion: 'BAJO' });
  assert.deepEqual(ordenarEventos([sin, bajo, alto], 'impacto', -1).map((e) => e.lugar), ['alto', 'bajo', 'sin']);
});

test('mayorEvento: la mayor magnitud, y el más reciente si empatan', () => {
  assert.equal(mayorEvento([]), null);
  const a = ev({ magnitud: 6, fecha_utc: hace(300) });
  const b = ev({ magnitud: 6, fecha_utc: hace(10) });
  const c = ev({ magnitud: 5.9 });
  assert.equal(mayorEvento([a, c, b]), b);
});

test('resumir: totales, media, niveles y actividad por tramo', () => {
  const lista = [
    ev({ magnitud: 4.6, fecha_utc: hace(5) }),
    ev({ magnitud: 5.2, fecha_utc: hace(60 * 23) }),
    ev({ magnitud: 6.4, fecha_utc: hace(60 * 12) }),
    ev({ magnitud: 7.1, fecha_utc: hace(60 * 12) }),
  ];
  const r = resumir(lista, AHORA, 24, 8);
  assert.equal(r.total, 4);
  assert.equal(r.deCincoOMas, 3);
  assert.equal(r.mayor?.magnitud, 7.1);
  assert.ok(Math.abs(r.media - (4.6 + 5.2 + 6.4 + 7.1) / 4) < 1e-9);
  assert.deepEqual(r.porNivel, [1, 1, 1, 1]);
  assert.equal(r.actividad.length, 8);
  assert.equal(r.actividad.reduce((a, b) => a + b, 0), 4);
  assert.equal(r.actividad[7], 1); // el de hace 5 min cae en el último tramo
  assert.equal(r.actividad[0], 1); // el de hace 23 h, en el primero
});

test('resumir con lista vacía no divide por cero', () => {
  const r = resumir([], AHORA, 24);
  assert.deepEqual([r.total, r.media, r.mayor, r.deCincoOMas], [0, 0, null, 0]);
});

test('histograma reparte todos los sismos en los tramos', () => {
  const lista = [4.5, 4.9, 5, 5.4, 5.5, 6, 6.5, 7.2].map((m) => ev({ magnitud: m }));
  const h = histograma(lista);
  assert.deepEqual(h.map((t) => t.cantidad), [2, 2, 1, 1, 1, 1]);
  assert.equal(h.reduce((s, t) => s + t.cantidad, 0), lista.length);
});

test('repartoProfundidad cuenta por clase', () => {
  const r = repartoProfundidad([ev({ profundidad: 5 }), ev({ profundidad: 70 }), ev({ profundidad: 300 }), ev({ profundidad: 450 })]);
  assert.deepEqual(r, { superficial: 1, intermedia: 2, profunda: 1 });
});

test('marcasDeTiempo: horas UTC redondas cada 4 h en 24 h y días en 7 días', () => {
  const m24 = marcasDeTiempo(AHORA - 24 * 3600e3, AHORA, 24);
  assert.ok(m24.length >= 5 && m24.length <= 7);
  assert.ok(m24.every((t) => t % (4 * 3600e3) === 0));
  assert.ok(m24.every((t) => t >= AHORA - 24 * 3600e3 && t <= AHORA));
  const m7 = marcasDeTiempo(AHORA - 7 * 24 * 3600e3, AHORA, 24 * 7);
  assert.ok(m7.every((t) => t % (24 * 3600e3) === 0));
  assert.ok(m7.length >= 6 && m7.length <= 8);
});

test('aCsv: encabezado, comillas escapadas y fecha con Z', () => {
  const csv = aCsv([ev({ event_id: 'x1', lugar: 'a "b", c', fecha_utc: '2026-11-23T02:40:57', nivel_destruccion: 'BAJO', estimacion: 'reglas', radio_afectacion_km: null })]);
  const [cab, fila] = csv.split('\n');
  assert.ok(cab.startsWith('id,magnitud,lugar,fecha_utc'));
  assert.ok(fila.includes('"a ""b"", c"'));
  assert.ok(fila.includes('2026-11-23T02:40:57Z'));
  assert.ok(fila.endsWith(',BAJO,reglas'));
});
