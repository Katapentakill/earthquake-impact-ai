import test from 'node:test';
import assert from 'node:assert/strict';
import { AJUSTES_POR_DEFECTO, UMBRALES, sanearAjustes } from '../lib/ajustesBase.ts';

test('sanearAjustes: lo válido se conserva', () => {
  assert.deepEqual(sanearAjustes({ tema: 'oscuro', umbral: 6.5 }), { tema: 'oscuro', umbral: 6.5 });
  assert.deepEqual(sanearAjustes({ tema: 'sistema', umbral: 5 }), { tema: 'sistema', umbral: 5 });
});

test('sanearAjustes: lo inválido o ausente vuelve al valor por defecto', () => {
  assert.deepEqual(sanearAjustes({ tema: 'rosado', umbral: 9 }), AJUSTES_POR_DEFECTO);
  assert.deepEqual(sanearAjustes({ umbral: '6' }), AJUSTES_POR_DEFECTO);
  assert.deepEqual(sanearAjustes(null), AJUSTES_POR_DEFECTO);
  assert.deepEqual(sanearAjustes('texto'), AJUSTES_POR_DEFECTO);
  assert.deepEqual(sanearAjustes(undefined), AJUSTES_POR_DEFECTO);
});

test('sanearAjustes: lo parcial completa con el valor por defecto', () => {
  assert.deepEqual(sanearAjustes({ tema: 'claro' }), { tema: 'claro', umbral: AJUSTES_POR_DEFECTO.umbral });
});

test('el umbral por defecto es uno de los que se pueden elegir', () => {
  assert.ok(UMBRALES.includes(AJUSTES_POR_DEFECTO.umbral));
});
