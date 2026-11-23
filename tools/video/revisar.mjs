// Revisión del video final: extrae un cuadro por escena (3 s después de que empieza) y arma una hoja de contactos,
// para comprobar a simple vista subtítulos, encuadre y datos visibles sin ver los dos videos completos.
//   node tools/video/revisar.mjs [es|en] [carpeta]     ->  salida/revision/NN-escena.png y salida/revision/hoja_<idioma>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const idioma = process.argv[2] === 'en' ? 'en' : 'es';
const SALIDA = path.resolve(process.argv[3] || path.join(AQUI, 'salida'));
const DESTINO = path.join(SALIDA, 'revision', idioma); // una carpeta por idioma: revisar en no borra lo de es
fs.rmSync(DESTINO, { recursive: true, force: true });
fs.mkdirSync(DESTINO, { recursive: true });

const meta = JSON.parse(fs.readFileSync(path.join(SALIDA, 'meta.json'), 'utf8'));
const escenas = JSON.parse(fs.readFileSync(path.join(SALIDA, 'eventos.json'), 'utf8')).filter((e) => e.k === 'scene' && e.name !== 'fin');
escenas.forEach((e, i) => {
  const t = (e.t - meta.t0) / 1000 + 3;
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', t.toFixed(2), '-i', path.join(SALIDA, `video_${idioma}.mp4`),
    '-frames:v', '1', '-vf', 'scale=640:-1', path.join(DESTINO, `rev_${String(i + 1).padStart(2, '0')}.png`)], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr);
  console.log(`${String(i + 1).padStart(2, '0')}  ${t.toFixed(1).padStart(6)} s  ${e.name}`);
});
const filas = Math.ceil(escenas.length / 3);
const hoja = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-i', path.join(DESTINO, 'rev_%02d.png'),
  '-vf', `tile=3x${filas}`, '-frames:v', '1', path.join(DESTINO, `hoja_${idioma}.png`)], { encoding: 'utf8' });
if (hoja.status !== 0) throw new Error(hoja.stderr);
console.log(`hoja de contactos: ${path.join(DESTINO, `hoja_${idioma}.png`)}`);
