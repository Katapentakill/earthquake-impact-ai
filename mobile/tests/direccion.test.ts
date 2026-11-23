import test from 'node:test';
import assert from 'node:assert/strict';
import { resolverUrlApi, soloHost, urlWebSocket } from '../lib/direccion.ts';

test('soloHost: quita el puerto y el esquema', () => {
  assert.equal(soloHost('192.168.1.20:8081'), '192.168.1.20');
  assert.equal(soloHost('exp://192.168.1.20:8081'), '192.168.1.20');
  assert.equal(soloHost('[::1]:8081'), '[::1]');
  assert.equal(soloHost(''), null);
  assert.equal(soloHost(null), null);
});

test('resolverUrlApi: la variable de entorno gana y pierde la barra final', () => {
  assert.equal(resolverUrlApi({ plataforma: 'web', urlApi: 'http://localhost:8010/api/' }), 'http://localhost:8010/api');
  assert.equal(resolverUrlApi({ plataforma: 'android', urlApi: 'https://mi.api/api', hostEmpaquetador: '10.0.0.5:8081' }), 'https://mi.api/api');
});

test('resolverUrlApi: en web es localhost', () => {
  assert.equal(resolverUrlApi({ plataforma: 'web' }), 'http://localhost:8000/api');
});

test('resolverUrlApi: en el teléfono usa la PC que sirve la app (Expo Go)', () => {
  assert.equal(resolverUrlApi({ plataforma: 'android', hostEmpaquetador: '192.168.1.20:8081' }), 'http://192.168.1.20:8000/api');
  assert.equal(resolverUrlApi({ plataforma: 'ios', hostEmpaquetador: '192.168.1.20:8081' }), 'http://192.168.1.20:8000/api');
});

test('resolverUrlApi: sin pistas, el emulador de Android usa 10.0.2.2 y iOS localhost', () => {
  assert.equal(resolverUrlApi({ plataforma: 'android' }), 'http://10.0.2.2:8000/api');
  assert.equal(resolverUrlApi({ plataforma: 'ios' }), 'http://localhost:8000/api');
});

test('urlWebSocket: /ws fuera de /api, y wss si la API es https', () => {
  assert.equal(urlWebSocket('http://localhost:8010/api'), 'ws://localhost:8010/ws');
  assert.equal(urlWebSocket('https://mi.api/api/'), 'wss://mi.api/ws');
});
