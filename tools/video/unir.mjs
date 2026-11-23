// Une el tramo de la web (salida/video_<idioma>.mp4) con el del celular (salida/movil/video_<idioma>.mp4) en el video final,
// con un fundido de 0,8 s entre los dos, y lo codifica para que pese menos de 9,8 MB (el tope de las subidas automatizadas
// es 10 MB): empieza con crf 24 y sube de a 2 hasta que cabe, con el audio en mono a 64 kb/s.
//   node tools/video/unir.mjs      ->  salida/final/video_es.mp4 y video_en.mp4
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.join(AQUI, 'salida');
const DESTINO = path.join(SALIDA, 'final');
const TOPE_MB = 9.8;
const FUNDIDO = 0.8;
fs.mkdirSync(DESTINO, { recursive: true });

const duracion = (archivo) => {
  const t = (spawnSync(ffmpeg, ['-i', archivo], { encoding: 'utf8' }).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/) || []).slice(1).map(Number);
  if (t.length !== 3) throw new Error(`No se pudo leer la duración de ${archivo}`);
  return t[0] * 3600 + t[1] * 60 + t[2];
};

for (const lang of ['es', 'en']) {
  const web = path.join(SALIDA, `video_${lang}.mp4`);
  const movil = path.join(SALIDA, 'movil', `video_${lang}.mp4`);
  for (const f of [web, movil]) if (!fs.existsSync(f)) throw new Error(`Falta ${f}: graba y monta los dos tramos primero`);
  const offset = duracion(web) - FUNDIDO;
  const grafo = `[0:v]settb=AVTB,fps=30,format=yuv420p[a];[1:v]settb=AVTB,fps=30,format=yuv420p[b];[a][b]xfade=transition=fade:duration=${FUNDIDO}:offset=${offset.toFixed(3)}[v];[0:a][1:a]acrossfade=d=${FUNDIDO}[s]`;
  let hecho = false;
  for (let crf = 24; crf <= 32 && !hecho; crf += 2) {
    const salida = path.join(DESTINO, `video_${lang}.mp4`);
    const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', web, '-i', movil, '-filter_complex', grafo, '-map', '[v]', '-map', '[s]',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '64k', '-ac', '1', salida],
      { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (r.status !== 0) { console.error(r.stderr.slice(-2500)); process.exit(1); }
    const mb = fs.statSync(salida).size / 1e6;
    console.log(`video_${lang}.mp4 · crf ${crf} · ${(duracion(salida)).toFixed(1)} s · ${mb.toFixed(2)} MB`);
    hecho = mb <= TOPE_MB;
  }
  if (!hecho) throw new Error(`video_${lang}.mp4 no cabe en ${TOPE_MB} MB ni con crf 32: hay que acortarlo`);
}
console.log('✓ salida/final/');
