// Dónde está el backend, decidido con una función pura (sin Expo ni React Native) para poder probarla.
// El puerto 8000 es el que publica docker-compose; con otro, usa EXPO_PUBLIC_API_URL.

export const PUERTO_API = 8000;

export interface EntornoRed {
  /** Platform.OS: 'web', 'android' o 'ios'. */
  plataforma: string;
  /** EXPO_PUBLIC_API_URL, si está definida (gana sobre todo lo demás). */
  urlApi?: string | null;
  /** Host del servidor de Expo, por ejemplo '192.168.1.20:8081'; en Expo Go es la PC del desarrollador. */
  hostEmpaquetador?: string | null;
}

/** '192.168.1.20:8081' → '192.168.1.20'; '[::1]:8081' → '[::1]'. Vacío o ilegible → null. */
export function soloHost(hostUri?: string | null): string | null {
  const limpio = String(hostUri ?? '').trim().replace(/^[a-z]+:\/\//i, '').split('/')[0];
  if (!limpio) return null;
  const host = limpio.startsWith('[') ? limpio.slice(0, limpio.indexOf(']') + 1) : limpio.split(':')[0];
  return host || null;
}

/** Base de la API REST, siempre sin barra final y terminada en /api. */
export function resolverUrlApi(e: EntornoRed): string {
  const fija = String(e.urlApi ?? '').trim().replace(/\/+$/, '');
  if (fija) return fija;
  if (e.plataforma === 'web') return `http://localhost:${PUERTO_API}/api`;
  const host = soloHost(e.hostEmpaquetador);
  if (host) return `http://${host}:${PUERTO_API}/api`;
  // Sin servidor de Expo a la vista: el emulador de Android ve la PC como 10.0.2.2.
  return `http://${e.plataforma === 'android' ? '10.0.2.2' : 'localhost'}:${PUERTO_API}/api`;
}

/** Dirección del WebSocket (el backend lo sirve en /ws, fuera de /api) a partir de la base REST. */
export function urlWebSocket(urlApi: string): string {
  return urlApi.replace(/\/+$/, '').replace(/\/api$/, '').replace(/^http/i, 'ws') + '/ws';
}
