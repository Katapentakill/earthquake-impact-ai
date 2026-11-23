// Los mismos colores de la web (frontend/src/app/globals.css): un crema atenuado y un oscuro cálido.
// Los pares de texto sobre fondo se midieron en la web con contraste de al menos 4,5:1.

export type NombreTema = 'claro' | 'oscuro';

export interface Paleta {
  nombre: NombreTema;
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  muted: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  focus: string;
  ocean: string;
  markerStroke: string;
  /** Verde del indicador «En vivo». */
  vivo: string;
  /** Sombra de las tarjetas (React Native Web la traduce a box-shadow). */
  sombra: { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number }; elevation: number };
}

export const CLARO: Paleta = {
  nombre: 'claro',
  bg: '#e7dfcb', surface: '#f3ecdb', surface2: '#ebe3cf', surface3: '#e2d9c2',
  border: '#d2c7ac', borderStrong: '#b9ad8f',
  text: '#2a2418', text2: '#4d4535', muted: '#655c49',
  accent: '#a63f14', accentSoft: 'rgba(166, 63, 20, 0.13)', onAccent: '#fffaf0',
  focus: '#1f5d9b',
  ocean: '#c3d0cc', markerStroke: '#2a2418', vivo: '#2d7d4f',
  sombra: { shadowColor: '#4a3a16', shadowOpacity: 0.09, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
};

export const OSCURO: Paleta = {
  nombre: 'oscuro',
  bg: '#13110e', surface: '#1c1915', surface2: '#25211b', surface3: '#2f2a23',
  border: '#38332b', borderStrong: '#4d463b',
  text: '#eee7d6', text2: '#cfc6b1', muted: '#a39a86',
  accent: '#f0a15e', accentSoft: 'rgba(240, 161, 94, 0.15)', onAccent: '#1a1510',
  focus: '#7db4ee',
  ocean: '#0f1519', markerStroke: '#13110e', vivo: '#6fcf97',
  sombra: { shadowColor: '#000000', shadowOpacity: 0.38, shadowRadius: 13, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
};

/** Escala de magnitud (la misma en el mapa y en las insignias): fondo y color del texto encima. */
export const ESCALA_MAGNITUD = {
  1: { fondo: '#5fb8ad', texto: '#1f1a10' },
  2: { fondo: '#e3b341', texto: '#1f1a10' },
  3: { fondo: '#e8863a', texto: '#1f1a10' },
  4: { fondo: '#d23a2e', texto: '#ffffff' },
} as const;

export const RADIO = { lg: 16, md: 11, sm: 8 } as const;
