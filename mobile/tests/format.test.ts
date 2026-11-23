import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtCoordenadas, fmtDinero, fmtEntero, fmtFecha, fmtMagnitud, fmtRelativo, instante } from '../lib/format.ts';

const AHORA = Date.UTC(2026, 10, 23, 3, 12);

test('magnitud y enteros usan la coma decimal y el punto de miles', () => {
  assert.equal(fmtMagnitud(6.5), '6,5');
  assert.equal(fmtMagnitud(5), '5,0');
  assert.equal(fmtEntero(12345), '12.345');
});

test('instante: la fecha de la API es UTC, con o sin Z', () => {
  assert.equal(instante('2026-11-23T02:40:57'), Date.UTC(2026, 10, 23, 2, 40, 57));
  assert.equal(instante('2026-11-23T02:40:57Z'), Date.UTC(2026, 10, 23, 2, 40, 57));
});

test('fmtFecha muestra día, mes y hora UTC', () => {
  assert.equal(fmtFecha(Date.UTC(2026, 10, 23, 2, 40)), '23 nov · 02:40');
});

test('fmtRelativo: minutos, horas con minutos, y días', () => {
  assert.equal(fmtRelativo(AHORA, AHORA), 'ahora mismo');
  assert.equal(fmtRelativo(AHORA - 31 * 60000, AHORA), 'hace 31 min');
  assert.equal(fmtRelativo(AHORA - 5 * 3600e3 - 36 * 60000, AHORA), 'hace 5 h 36 min');
  assert.equal(fmtRelativo(AHORA - 3 * 3600e3, AHORA), 'hace 3 h');
  assert.equal(fmtRelativo(AHORA - 72 * 3600e3, AHORA), 'hace 3 d');
  assert.equal(fmtRelativo(AHORA + 60000, AHORA), 'ahora mismo');
});

test('fmtCoordenadas: hemisferios en español (O por oeste)', () => {
  assert.equal(fmtCoordenadas(-13.6607, 172.2423), '13,66° S, 172,24° E');
  assert.equal(fmtCoordenadas(10.83, -76.02), '10,83° N, 76,02° O');
});

test('fmtDinero: escala en mil, millones y mil millones', () => {
  assert.equal(fmtDinero(0), 'US$ 0');
  assert.equal(fmtDinero(5000), 'US$ 5 mil');
  assert.equal(fmtDinero(650e6), 'US$ 650 millones');
  assert.equal(fmtDinero(1.2e9), 'US$ 1,2 mil millones');
});
