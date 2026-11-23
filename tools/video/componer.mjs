// Montaje del video de la web («cómo funciona»): subtítulos ES/EN sincronizados con los eventos de la toma, sonidos de clic y
// teclas, música suave y ffmpeg. Sin voz: el video es silencioso con subtítulos, como los de los otros proyectos.
//   node tools/video/componer.mjs [carpeta]      (después de tools/video/grabar.js)  ->  video_es.mp4 y video_en.mp4
// Las cifras y los lugares de los subtítulos salen de lo que mostraba la pantalla durante la toma (registro «info»),
// no de texto escrito a mano: así el video dice lo mismo que se ve aunque los sismos del día sean otros.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { efectos, cama, mezclar, escribirWav } from './sonido.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(process.argv[2] || path.join(AQUI, 'salida'));

const meta = JSON.parse(fs.readFileSync(path.join(SALIDA, 'meta.json'), 'utf8'));
const eventos = JSON.parse(fs.readFileSync(path.join(SALIDA, 'eventos.json'), 'utf8'));
if (meta.error) throw new Error(`La grabación terminó con error: ${meta.error}`);

const rel = (t) => (t - meta.t0) / 1000; // segundos desde el primer cuadro
const escena = {};
for (const e of eventos) if (e.k === 'scene') escena[e.name] = rel(e.t);
const I = Object.assign({}, ...eventos.filter((e) => e.k === 'info'));
const DURACION = meta.segundos;

const num = (x, lang) => x.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---------- guion: cada línea dura desde su escena (+ un margen) hasta el comienzo de la escena siguiente ----------
const GUION = [
  { de: 'portada', mas: 0.5, hasta: 'flujo-1',
    es: () => 'Monitor sísmico global: así funciona, del USGS a tu pantalla.',
    en: () => 'Global seismic monitor: how it works, from USGS to your screen.' },
  { de: 'flujo-1', mas: 0.8, hasta: 'flujo-2',
    es: () => 'Cada 3 minutos, el backend consulta al USGS los sismos de magnitud 4,5 o más y calcula el radio que afectan.',
    en: () => 'Every 3 minutes, the backend asks USGS for magnitude 4.5+ earthquakes and works out the radius they affect.' },
  { de: 'flujo-2', mas: 0.8, hasta: 'flujo-3',
    es: () => 'Luego estima el impacto: una IA (Llama 3.3 70B, por Hugging Face) razona país por país; sin token, o si falla, unas reglas por profundidad.',
    en: () => 'Then it estimates the impact: an AI (Llama 3.3 70B, through Hugging Face) reasons country by country; with no token, or if it fails, depth-based rules.' },
  { de: 'flujo-3', mas: 0.8, hasta: 'resumen',
    es: () => 'Todo se guarda en MariaDB y se avisa por WebSocket a la web y al celular.',
    en: () => 'Everything is stored in MariaDB and announced over WebSocket to the web and the phone.' },
  { de: 'resumen', mas: 0.8, hasta: 'mapa',
    es: (l) => `La web muestra las últimas 24 horas: ${I.total} sismos; el mayor, de magnitud ${num(I.mayorMag, l)}.`,
    en: (l) => `The web shows the last 24 hours: ${I.total} earthquakes; the largest, magnitude ${num(I.mayorMag, l)}.` },
  { de: 'mapa', mas: 0.8, hasta: 'panel-ia',
    es: () => 'Cada epicentro lleva el color de su magnitud.',
    en: () => 'Every epicenter takes the color of its magnitude.' },
  { de: 'panel-ia', mas: 1.0, hasta: 'estimando-pedir',
    es: (l) => `Un clic abre el panel: para este sismo de magnitud ${num(I.iaMag, l)} a ${I.iaProf} km, la IA estimó ${I.iaMuertes} muertes y ${I.iaHeridos} heridos, y explica su razonamiento.`,
    en: (l) => `A click opens the panel: for this magnitude ${num(I.iaMag, l)} quake at ${I.iaProf} km, the AI estimated ${I.iaMuertes} deaths and ${I.iaHeridos} injured, and explains its reasoning.` },
  { de: 'estimando', mas: 0.2, hasta: 'panel-reglas',
    es: () => 'Para mostrarlo se reprocesa este sismo: aparece al instante con una rueda de carga mientras la IA lo estima y, al terminar, el panel se completa solo.',
    en: () => 'To show it, this quake is reprocessed: it appears at once with a loading wheel while the AI estimates it and, when done, the panel fills in by itself.' },
  { de: 'panel-reglas', mas: 0.8, hasta: 'filtros',
    es: (l) => `Este otro (M ${num(I.reglasMag, l)}, ${I.reglasProf} km) lo calcularon las reglas, y el panel lo dice: «Cálculo por reglas · sin IA».`,
    en: (l) => `This other one (M ${num(I.reglasMag, l)}, ${I.reglasProf} km) was calculated by the rules, and the panel says so: «Cálculo por reglas · sin IA».` },
  { de: 'filtros', mas: 0.8, hasta: 'busqueda',
    es: () => 'Filtros por magnitud y profundidad: el mapa, los gráficos y la tabla se actualizan juntos.',
    en: () => 'Filters by magnitude and depth: the map, charts and table update together.' },
  { de: 'busqueda', mas: 0.6, hasta: 'periodo',
    es: () => 'La búsqueda filtra por lugar o ID mientras escribes.',
    en: () => 'Search filters by place or ID as you type.' },
  { de: 'periodo', mas: 0.5, hasta: 'graficos',
    es: () => 'El período llega hasta 30 días.',
    en: () => 'The period goes up to 30 days.' },
  { de: 'graficos', mas: 0.5, hasta: 'graficos-2',
    es: () => 'La magnitud de cada sismo a lo largo del período.',
    en: () => 'The magnitude of every quake over the period.' },
  { de: 'graficos-2', mas: 0.5, hasta: 'tabla',
    es: () => 'Y cuántos sismos hay por magnitud y por profundidad.',
    en: () => 'And how many quakes there are by magnitude and by depth.' },
  { de: 'tabla', mas: 0.5, hasta: 'oscuro',
    es: () => 'La tabla se ordena por cualquier columna y se exporta a CSV.',
    en: () => 'The table sorts by any column and exports to CSV.' },
  { de: 'oscuro', mas: 0.8, hasta: 'envivo',
    es: () => 'El tema oscuro cálido, con un contraste de texto de al menos 4,5 a 1, medido por script.',
    en: () => 'The warm dark theme, with text contrast of at least 4.5 to 1, measured by script.' },
  { de: 'envivo', mas: 0.6, hasta: 'celular',
    es: () => '«En vivo» indica que el WebSocket está conectado: un sismo nuevo aparece sin recargar la página.',
    en: () => '«En vivo» means the WebSocket is connected: a new quake shows up without reloading the page.' },
  { de: 'celular', mas: 0.6, hasta: 'fin',
    es: () => 'Y la misma información, en el celular.',
    en: () => 'And the same information, on the phone.' },
];

const faltan = [...new Set(GUION.flatMap((g) => [g.de, g.hasta]).filter((n) => !(n in escena)))];
if (faltan.length) throw new Error(`Faltan escenas en el registro de la toma: ${faltan.join(', ')}`);

// Aviso de lectura: con unos 17 caracteres por segundo se lee bien; más de 21 va apurado.
for (const lang of ['es', 'en']) {
  for (const g of GUION) {
    const dur = Math.min(DURACION, escena[g.hasta] - 0.25) - (escena[g.de] + g.mas);
    const cps = g[lang](lang).length / Math.max(0.1, dur);
    if (cps > 21) console.warn(`⚠ ${lang} «${g.de}»: ${g[lang](lang).length} caracteres en ${dur.toFixed(1)} s (${cps.toFixed(0)} por segundo)`);
  }
}

const tiempoSrt = (s) => {
  const ms = Math.round(Math.max(0, s) * 1000);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`;
};
for (const lang of ['es', 'en']) {
  const srt = GUION.map((g, i) => `${i + 1}\n${tiempoSrt(escena[g.de] + g.mas)} --> ${tiempoSrt(Math.min(DURACION, escena[g.hasta] - 0.25))}\n${g[lang](lang)}\n`).join('\n');
  fs.writeFileSync(path.join(SALIDA, `subs_${lang}.srt`), srt, 'utf8');
}

// ---------- audio ----------
const sonidos = [];
for (const e of eventos) {
  if (e.k === 'click') sonidos.push({ tipo: 'clic', t: rel(e.t) - 0.04 });
  if (e.k === 'key') sonidos.push({ tipo: 'tecla', t: rel(e.t) - 0.02 });
}
console.log(`duración ${DURACION.toFixed(1)} s · clics ${sonidos.filter((s) => s.tipo === 'clic').length} · teclas ${sonidos.filter((s) => s.tipo === 'tecla').length}`);
escribirWav(path.join(SALIDA, 'audio.wav'), mezclar(efectos(sonidos, DURACION), cama(DURACION), Number(process.env.MUSICA || 0.12)));

// ---------- video: 1280x800 -> 1600x1000 centrado en 1920x1080, con una banda inferior de 80 px para los subtítulos ----------
// Este tramo se une después con el del celular (unir.mjs), que es el que fija el tamaño final.
const estilo = 'FontName=Segoe UI Semibold,FontSize=9,PrimaryColour=&H00FFFFFF&,OutlineColour=&H80000000&,BorderStyle=1,Outline=2,Shadow=0,MarginV=10,MarginL=40,MarginR=40,Alignment=2';
for (const lang of ['es', 'en']) {
  const grafo = `scale=1600:1000:flags=lanczos,pad=1920:1080:160:0:color=0x13110e,subtitles=subs_${lang}.srt:force_style='${estilo}'`;
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', 'toma.mkv', '-i', 'audio.wav', '-vf', grafo,
    '-map', '0:v', '-map', '1:a', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', `video_${lang}.mp4`], { cwd: SALIDA, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) { console.error(r.stderr.slice(-2500)); process.exit(1); }
  const info = spawnSync(ffmpeg, ['-i', path.join(SALIDA, `video_${lang}.mp4`)], { encoding: 'utf8' }).stderr;
  console.log(`✓ video_${lang}.mp4 · ${(info.match(/Duration: ([\d:.]+)/) || [])[1]} · ${(fs.statSync(path.join(SALIDA, `video_${lang}.mp4`)).size / 1e6).toFixed(1)} MB`);
}
