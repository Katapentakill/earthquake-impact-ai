// Montaje del video de la app: subtítulos ES/EN sincronizados con los eventos de la toma, sonidos de clic y teclas,
// música suave y ffmpeg. Sin voz: el video es silencioso con subtítulos, como los de los otros proyectos.
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
const clase = (km) => (km < 70 ? 'superficial' : km <= 300 ? 'intermedia' : 'profunda');
const historia = clase(I.mayorProf) === 'profunda' && clase(I.otroProf) === 'superficial'; // el contraste que cuenta el video
const JS = '20', PY = '19'; // las mismas cifras que se pasan al grabador (npm run grabar)

// ---------- guion: cada línea dura desde su escena (+ un margen) hasta el comienzo de la escena siguiente ----------
const GUION = [
  { de: 'portada', mas: 0.5, hasta: 'antes-1',
    es: () => 'Monitor sísmico global: sismos del USGS en tiempo real, con estimación de impacto.',
    en: () => 'Global seismic monitor: live USGS earthquakes with an impact estimate.' },
  { de: 'antes-1', mas: 1.0, hasta: 'antes-2',
    es: () => 'Antes: degradados azul y morado, interfaz en inglés y un fondo blanco que cansa la vista.',
    en: () => 'Before: blue and purple gradients, an English interface and a white background that tires the eyes.' },
  { de: 'antes-2', mas: 1.4, hasta: 'resumen-1',
    es: () => 'En el celular, los filtros ocupaban la primera pantalla. Y sin IA, un sismo a 601 km de profundidad estimaba 150 muertos.',
    en: () => 'On a phone, the filters filled the first screen. And without AI, a quake 601 km deep was estimated at 150 deaths.' },
  { de: 'resumen-1', mas: 1.0, hasta: 'mapa-1',
    es: (l) => `Ahora: ${I.total} sismos en las últimas 24 horas. El mayor, de magnitud ${num(I.mayorMag, l)}, en ${I.mayorLugar}.`,
    en: (l) => `Now: ${I.total} earthquakes in the last 24 hours. The largest, magnitude ${num(I.mayorMag, l)}, at ${I.mayorLugar}.` },
  { de: 'mapa-1', mas: 1.0, hasta: 'panel-1',
    es: () => 'El mapa muestra cada epicentro con el color de su magnitud, sobre un tema crema que no cansa la vista.',
    en: () => 'The map shows every epicenter in the color of its magnitude, on a cream theme that is easy on the eyes.' },
  { de: 'panel-1', mas: 0.8, hasta: 'mapa-2',
    es: () => `Sin IA, el impacto sale de reglas. Un sismo profundo (${I.mayorProf} km) casi no se siente en superficie.`,
    en: () => `Without AI, the impact comes from rules. A deep quake (${I.mayorProf} km) is barely felt at the surface.` },
  { de: 'mapa-2', mas: 1.6, hasta: 'filtros-1',
    es: () => (historia ? `Otro sismo, superficial (${I.otroProf} km): aquí el cálculo estima más heridos que para el profundo.` : 'Un clic en el mapa cambia el sismo del panel.'),
    en: () => (historia ? `Another quake, shallow (${I.otroProf} km): here the estimate has more injured than for the deep one.` : 'A click on the map changes the quake in the panel.') },
  { de: 'filtros-1', mas: 1.0, hasta: 'filtros-2',
    es: () => 'Filtros por magnitud y profundidad: el mapa, los gráficos y la tabla se actualizan juntos.',
    en: () => 'Filters by magnitude and depth: the map, charts and table update together.' },
  { de: 'filtros-2', mas: 1.4, hasta: 'periodo',
    es: () => 'La búsqueda filtra por lugar o ID mientras escribes.',
    en: () => 'Search filters by place or ID as you type.' },
  { de: 'periodo', mas: 1.0, hasta: 'graficos',
    es: () => 'El período se amplía a 7 o 30 días.',
    en: () => 'The period extends to 7 or 30 days.' },
  { de: 'graficos', mas: 1.0, hasta: 'graficos-2',
    es: () => 'La magnitud de cada sismo a lo largo de las últimas 24 horas.',
    en: () => 'The magnitude of every quake over the last 24 hours.' },
  { de: 'graficos-2', mas: 0.8, hasta: 'tabla',
    es: () => 'Y cuántos sismos hay por tramo de magnitud y por profundidad.',
    en: () => 'And how many quakes there are by magnitude range and by depth.' },
  { de: 'tabla', mas: 1.0, hasta: 'tabla-2',
    es: () => 'La tabla se ordena por cualquier columna y se puede exportar a CSV.',
    en: () => 'The table sorts by any column and can be exported to CSV.' },
  { de: 'tabla-2', mas: 0.8, hasta: 'oscuro',
    es: () => 'Un clic en una fila lleva el mapa hasta ese sismo.',
    en: () => 'A click on a row takes the map to that quake.' },
  { de: 'oscuro', mas: 1.2, hasta: 'celular',
    es: () => 'El tema oscuro cálido. El contraste del texto es de al menos 4,5 a 1 en los dos temas, medido por script.',
    en: () => 'The warm dark theme. Text contrast is at least 4.5 to 1 in both themes, measured by script.' },
  { de: 'celular', mas: 0.8, hasta: 'como',
    es: () => 'Y se adapta al celular.',
    en: () => 'And it adapts to phones.' },
  { de: 'como', mas: 1.2, hasta: 'cierre',
    es: () => `Cómo está hecho: el backend consulta al USGS cada 3 minutos, guarda en MariaDB y avisa por WebSocket. ${JS} pruebas de JavaScript y ${PY} de Python.`,
    en: () => `How it is built: the backend polls USGS every 3 minutes, stores in MariaDB and notifies over WebSocket. ${JS} JavaScript and ${PY} Python tests.` },
  { de: 'cierre', mas: 1.2, hasta: 'fin',
    es: () => 'Rediseño, estimación por profundidad, pruebas y documentación: Alexander Tapia. Datos del USGS; mapa de OpenStreetMap.',
    en: () => 'Redesign, depth-based estimate, tests and documentation: Alexander Tapia. Data from USGS; map from OpenStreetMap.' },
];

const faltan = [...new Set(GUION.flatMap((g) => [g.de, g.hasta]).filter((n) => !(n in escena)))];
if (faltan.length) throw new Error(`Faltan escenas en el registro de la toma: ${faltan.join(', ')}`);

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
// Pesa unos 9 MB por idioma (crf 20, audio 128 kb/s): cabe en las subidas automatizadas con tope de 10 MB.
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
