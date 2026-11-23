// Sonidos sintetizados (sin archivos de audio ni derechos de autor): clics, teclas y una cama de música suave.
import fs from 'node:fs';

export const SR = 44100;

function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Efectos de clic y de tecla en los instantes dados: [{ tipo: 'clic' | 'tecla', t: segundos }]. */
export function efectos(eventos, duracion) {
  const n = Math.ceil(duracion * SR);
  const salida = new Float32Array(n);
  const r = azar(7);
  const sumar = (inicio, largo, fn) => {
    const i0 = Math.floor(inicio * SR);
    for (let i = 0; i < largo && i0 + i < n; i++) if (i0 + i >= 0) salida[i0 + i] += fn(i / SR);
  };
  for (const e of eventos) {
    if (e.tipo === 'clic') {
      // golpe seco: un tono que cae de ~1800 a ~700 Hz y un soplo de ruido muy corto
      sumar(e.t, Math.floor(0.12 * SR), (t) => Math.exp(-t * 55) * 0.5 * Math.sin(2 * Math.PI * (700 + 1100 * Math.exp(-t * 90)) * t) + Math.exp(-t * 400) * 0.25 * (r() * 2 - 1));
    } else {
      const f = 1300 + 700 * r(); // cada tecla suena un poco distinta
      sumar(e.t, Math.floor(0.08 * SR), (t) => Math.exp(-t * 90) * 0.3 * Math.sin(2 * Math.PI * f * t) + Math.exp(-t * 500) * 0.2 * (r() * 2 - 1));
    }
  }
  return salida;
}

/** Cama de música: un acorde de La menor con vibrato lento, entrada y salida de 2,5 s. Normalizada a pico 1. */
export function cama(duracion) {
  const n = Math.ceil(duracion * SR);
  const salida = new Float32Array(n);
  [110, 130.81, 164.81, 220, 329.63].forEach((f, k) => {
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.05 + 0.013 * k) * t + k);
      salida[i] += (Math.sin(2 * Math.PI * f * t) * 0.18 + Math.sin(2 * Math.PI * f * 1.003 * t) * 0.1) * lfo;
    }
  });
  const fundido = 2.5 * SR;
  let pico = 0;
  for (let i = 0; i < n; i++) {
    salida[i] *= Math.min(1, i / fundido, (n - i) / fundido);
    pico = Math.max(pico, Math.abs(salida[i]));
  }
  for (let i = 0; i < n; i++) salida[i] /= pico || 1;
  return salida;
}

/** Suma los efectos y la música (a `volumenMusica` del máximo) con un limitador suave. */
export function mezclar(efectosS, musicaS, volumenMusica = 0.12) {
  const n = Math.max(efectosS.length, musicaS.length);
  const salida = new Float32Array(n);
  for (let i = 0; i < n; i++) salida[i] = Math.tanh((efectosS[i] || 0) + (musicaS[i] || 0) * volumenMusica);
  return salida;
}

/** WAV de 16 bits, mono. */
export function escribirWav(ruta, muestras) {
  const datos = Buffer.alloc(muestras.length * 2);
  for (let i = 0; i < muestras.length; i++) datos.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(muestras[i] * 32767))), i * 2);
  const cabecera = Buffer.alloc(44);
  cabecera.write('RIFF', 0); cabecera.writeUInt32LE(36 + datos.length, 4); cabecera.write('WAVE', 8);
  cabecera.write('fmt ', 12); cabecera.writeUInt32LE(16, 16); cabecera.writeUInt16LE(1, 20); cabecera.writeUInt16LE(1, 22);
  cabecera.writeUInt32LE(SR, 24); cabecera.writeUInt32LE(SR * 2, 28); cabecera.writeUInt16LE(2, 32); cabecera.writeUInt16LE(16, 34);
  cabecera.write('data', 36); cabecera.writeUInt32LE(datos.length, 40);
  fs.writeFileSync(ruta, Buffer.concat([cabecera, datos]));
}
