// Montaje del video del cliente móvil: subtítulos ES/EN sincronizados con los eventos de la toma, sonidos de toque y teclas,
// música suave y ffmpeg. Sin voz, como el de la web. La toma es portrait (390x844): se coloca a la izquierda de un lienzo de
// 1920x1080 y los subtítulos van a la derecha, con una etiqueta fija que dice qué se está viendo.
//   node tools/video/componer_movil.mjs [carpeta]      (después de tools/video/grabar_movil.js)  ->  video_es.mp4 y video_en.mp4
// Las cifras y los lugares de los subtítulos salen de lo que mostraba la pantalla durante la toma (registro «info»).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import { efectos, cama, mezclar, escribirWav } from './sonido.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SALIDA = path.resolve(process.argv[2] || path.join(AQUI, 'salida', 'movil'));

const meta = JSON.parse(fs.readFileSync(path.join(SALIDA, 'meta.json'), 'utf8'));
const eventos = JSON.parse(fs.readFileSync(path.join(SALIDA, 'eventos.json'), 'utf8'));
if (meta.error) throw new Error(`La grabación terminó con error: ${meta.error}`);

const rel = (t) => (t - meta.t0) / 1000; // segundos desde el primer cuadro
const escena = {};
for (const e of eventos) if (e.k === 'scene') escena[e.name] = rel(e.t);
const I = Object.assign({}, ...eventos.filter((e) => e.k === 'info'));
const DURACION = meta.segundos;
const PRUEBAS = '30'; // las mismas cifras que se pasan al grabador (--pruebas)

const num = (x, lang) => x.toLocaleString(lang === 'es' ? 'es-CL' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const profundoSinIa = I.origen === 'reglas' && I.claseProf === 'Profunda';

// ---------- guion: cada línea dura desde su escena (+ un margen) hasta el comienzo de la escena siguiente ----------
const GUION = [
  { de: 'portada', mas: 0.5, hasta: 'antes-1',
    es: () => 'El monitor sísmico, ahora en el celular: los mismos sismos del USGS y la misma estimación de impacto.',
    en: () => 'The seismic monitor, now on the phone: the same USGS earthquakes and the same impact estimate.' },
  { de: 'antes-1', mas: 1.0, hasta: 'antes-2',
    es: () => 'Antes: la profundidad salía vacía, porque la app leía un campo que la API nunca mandó.',
    en: () => 'Before: the depth showed blank, because the app read a field the API never sent.' },
  { de: 'antes-2', mas: 1.0, hasta: 'resumen-1',
    es: () => 'Y «Total de eventos: 1», un dato incorrecto. Ni siquiera arrancaba en el navegador.',
    en: () => 'And «Total events: 1», a wrong figure. It did not even start in a browser.' },
  { de: 'resumen-1', mas: 1.0, hasta: 'resumen-2',
    es: (l) => `Ahora: ${I.total} sismos en las últimas 24 horas. El mayor, de magnitud ${num(I.mayorMag, l)}, en ${I.mayorLugar}.`,
    en: (l) => `Now: ${I.total} earthquakes in the last 24 hours. The largest, magnitude ${num(I.mayorMag, l)}, at ${I.mayorLugar}.` },
  { de: 'resumen-2', mas: 0.8, hasta: 'filtros',
    es: () => 'Debajo, los filtros por período, magnitud y profundidad.',
    en: () => 'Below, the filters by period, magnitude and depth.' },
  { de: 'filtros', mas: 1.0, hasta: 'busqueda',
    es: () => 'Cada filtro actualiza las tarjetas y la lista al instante.',
    en: () => 'Each filter updates the cards and the list instantly.' },
  { de: 'busqueda', mas: 1.6, hasta: 'detalle-1',
    es: () => 'La búsqueda filtra por lugar mientras escribes.',
    en: () => 'Search filters by place as you type.' },
  { de: 'detalle-1', mas: 1.2, hasta: 'detalle-2',
    es: () => 'Un toque abre el detalle: muertes, heridos y pérdidas estimados.',
    en: () => 'A tap opens the detail: estimated deaths, injured and losses.' },
  { de: 'detalle-2', mas: 0.6, hasta: 'mapa-1',
    es: () => (profundoSinIa
      ? `Sin IA, el impacto sale de reglas: a ${I.mayorProf} km de profundidad el efecto se atenúa y estima ${I.detalleMuertes} muertes.`
      : 'El detalle dice de dónde sale la estimación: de reglas o de la IA.'),
    en: () => (profundoSinIa
      ? `Without AI, the impact comes from rules: at ${I.mayorProf} km deep the effect fades and it estimates ${I.detalleMuertes} deaths.`
      : 'The detail says where the estimate comes from: rules or the AI.') },
  { de: 'mapa-1', mas: 1.4, hasta: 'mapa-2',
    es: () => '«Ver en el mapa» lleva al epicentro y dibuja su radio de afectación.',
    en: () => '«See on the map» goes to the epicenter and draws its affected radius.' },
  { de: 'mapa-2', mas: 1.4, hasta: 'alertas',
    es: () => 'Al tocar otro epicentro, el mapa muestra su resumen.',
    en: () => 'Tapping another epicenter shows its summary on the map.' },
  { de: 'alertas', mas: 1.0, hasta: 'ajustes-1',
    es: () => 'Alertas: los sismos desde el umbral elegido. Los nuevos llegan en vivo por WebSocket.',
    en: () => 'Alerts: quakes at or above the chosen threshold. New ones arrive live over WebSocket.' },
  { de: 'ajustes-1', mas: 1.0, hasta: 'oscuro',
    es: () => 'Ajustes: el tema, el umbral de las alertas y el estado de la conexión.',
    en: () => 'Settings: the theme, the alert threshold and the connection status.' },
  { de: 'oscuro', mas: 1.2, hasta: 'como',
    es: () => 'El tema oscuro cálido, con el mismo contraste medido: al menos 4,5 a 1.',
    en: () => 'The warm dark theme, with the same measured contrast: at least 4.5 to 1.' },
  { de: 'como', mas: 1.0, hasta: 'cierre',
    es: () => `Cómo está hecho: Expo y TypeScript, ${PRUEBAS} pruebas, y la dirección de la API se calcula sola. Probado en el navegador y compilado para Android e iOS.`,
    en: () => `How it is built: Expo and TypeScript, ${PRUEBAS} tests, and the API address works itself out. Tested in a browser and compiled for Android and iOS.` },
  { de: 'cierre', mas: 1.2, hasta: 'fin',
    es: () => 'Rediseño del cliente móvil, pruebas y documentación: Alexander Tapia. Datos del USGS; mapa de OpenStreetMap.',
    en: () => 'Mobile client redesign, tests and documentation: Alexander Tapia. Data from USGS; map from OpenStreetMap.' },
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

// ---------- subtítulos (ASS, para colocarlos a la derecha del teléfono) ----------
const t = (s) => {
  const cs = Math.round(Math.max(0, s) * 100);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${Math.floor(cs / 360000)}:${p(Math.floor((cs % 360000) / 6000))}:${p(Math.floor((cs % 6000) / 100))}.${p(cs % 100)}`;
};
const ETIQUETA = {
  es: ['MONITOR SÍSMICO · CLIENTE MÓVIL', 'App Expo (React Native), vista web a tamaño de teléfono'],
  en: ['SEISMIC MONITOR · PHONE CLIENT', 'Expo (React Native) app, web view at phone size'],
};
const X = 800; // la columna de texto empieza a la derecha del teléfono
for (const lang of ['es', 'en']) {
  const lineas = GUION.map((g) => {
    const fin = Math.min(DURACION, escena[g.hasta] - 0.25);
    return `Dialogue: 0,${t(escena[g.de] + g.mas)},${t(fin)},Cap,,0,0,0,,${g[lang](lang).replace(/\n/g, '\\N')}`;
  });
  const ass = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Segoe UI Semibold,52,&H00D6E7EE,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,4,${X},140,0,1
Style: Marca,Segoe UI Semibold,30,&H005EA1F0,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,0,0,7,${X},140,0,1
Style: Nota,Segoe UI,27,&H0098AEB7,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,${X},140,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,${t(0)},${t(DURACION)},Marca,,0,0,0,,{\\pos(${X},130)}${ETIQUETA[lang][0]}
Dialogue: 0,${t(0)},${t(DURACION)},Nota,,0,0,0,,{\\pos(${X},178)}${ETIQUETA[lang][1]}
${lineas.join('\n')}
`;
  fs.writeFileSync(path.join(SALIDA, `subs_${lang}.ass`), ass, 'utf8');
}

// ---------- audio ----------
const sonidos = [];
for (const e of eventos) {
  if (e.k === 'click') sonidos.push({ tipo: 'clic', t: rel(e.t) - 0.04 });
  if (e.k === 'key') sonidos.push({ tipo: 'tecla', t: rel(e.t) - 0.02 });
}
console.log(`duración ${DURACION.toFixed(1)} s · toques ${sonidos.filter((s) => s.tipo === 'clic').length} · teclas ${sonidos.filter((s) => s.tipo === 'tecla').length}`);
escribirWav(path.join(SALIDA, 'audio.wav'), mezclar(efectos(sonidos, DURACION), cama(DURACION), Number(process.env.MUSICA || 0.12)));

// ---------- video: 390x844 -> 450x974 con un marco de 6 px, a la izquierda de un lienzo oscuro de 1920x1080 ----------
// Pesa unos 5 a 8 MB por idioma (crf 20, audio 128 kb/s): cabe en las subidas automatizadas con tope de 10 MB.
for (const lang of ['es', 'en']) {
  const grafo = `scale=450:974:flags=lanczos,pad=462:986:6:6:color=0x4d463b,pad=1920:1080:210:47:color=0x13110e,subtitles=subs_${lang}.ass`;
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', 'toma.mkv', '-i', 'audio.wav', '-vf', grafo,
    '-map', '0:v', '-map', '1:a', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-shortest', `video_${lang}.mp4`], { cwd: SALIDA, encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) { console.error(r.stderr.slice(-2500)); process.exit(1); }
  const info = spawnSync(ffmpeg, ['-i', path.join(SALIDA, `video_${lang}.mp4`)], { encoding: 'utf8' }).stderr;
  console.log(`✓ video_${lang}.mp4 · ${(info.match(/Duration: ([\d:.]+)/) || [])[1]} · ${(fs.statSync(path.join(SALIDA, `video_${lang}.mp4`)).size / 1e6).toFixed(1)} MB`);
}
