// Verificación del cliente móvil (Expo) corriendo en el navegador con `expo start --web`: recorre las cuatro pestañas y el detalle
// en crema y oscuro a 390x844, prueba período, filtros y navegación, mide el contraste de TODO el texto visible (mínimo 4,5:1, o 3:1
// en texto grande) y registra los errores de consola. Escribe las capturas en docs/img/movil/ (o en OUT_DIR) y el informe en tools/capturas/salida/.
//   cd mobile && npx expo start --web --port 8081     (con el backend encendido y EXPO_PUBLIC_API_URL apuntando a él)
//   npm run movil --prefix tools/video
// Límite: es react-native-web, no un teléfono. El mapa nativo, los gestos, la vibración y el rendimiento no se ven aquí.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const BASE = process.env.TARGET_URL || 'http://localhost:8081';
const OUT = process.env.OUT_DIR || path.join(__dirname, '..', '..', 'docs', 'img', 'movil');
const OUT_INFORME = process.env.INFORME_DIR || path.join(__dirname, 'salida');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(OUT_INFORME, { recursive: true });
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const informe = { consola: [], fallos: [], contraste: {}, interaccion: {} };

const AUDITORIA = `(() => {
  const parse = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const fondo = (el) => {
    const capas = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) capas.push(bg);
      if (bg && bg.a >= 0.999) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = capas.length - 1; i >= 0; i--) base = over(capas[i], base);
    return base;
  };
  const malos = [], total = { n: 0 };
  document.querySelectorAll('body *').forEach((el) => {
    if (el.closest('script, style, .leaflet-container')) return;
    const propio = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length);
    if (!propio) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    let op = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    if (op < 0.5) return;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
    const col = parse(cs.color); if (!col) return;
    const bg = fondo(el);
    const fg = over(col, bg);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const grande = px >= 24 || (px >= 18.66 && bold);
    const min = grande ? 3 : 4.5, c = ratio(fg, bg);
    total.n++;
    if (c < min) malos.push({ texto: el.textContent.trim().slice(0, 40), ratio: +c.toFixed(2), min, color: cs.color });
  });
  return { revisados: total.n, fallan: malos };
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 390, height: 844, useContentSize: true, show: true, backgroundColor: '#e7dfcb', webPreferences: { backgroundThrottling: false } });
  const wc = win.webContents;
  wc.on('console-message', (e) => {
    if ((e.level === 'error' || e.level === 'warning') && !/Electron Security Warning/.test(String(e.message))) informe.consola.push(String(e.message).slice(0, 240));
  });
  wc.session.webRequest.onErrorOccurred((d) => {
    if (/tile\.openstreetmap/.test(d.url)) informe.tilesFallidos = (informe.tilesFallidos || 0) + 1;
    else if (!/ERR_CACHE_MISS|ERR_ABORTED/.test(d.error)) informe.fallos.push(`${d.error} ${d.url.slice(0, 100)}`);
  });
  const js = (c) => wc.executeJavaScript(c, true);
  const foto = async (nombre) => { const img = await wc.capturePage(); fs.writeFileSync(path.join(OUT, nombre), img.toPNG()); console.log('foto', nombre); };
  const auditar = async (k) => { informe.contraste[k] = await js(AUDITORIA); };
  const ir = async (ruta, espera = 2500) => { await win.loadURL(BASE + ruta); await dormir(espera); };
  // Pulsa el primer elemento interactivo cuyo texto (o etiqueta) contiene `texto` (los botones con ícono empiezan con su glifo).
  const tocar = (texto) => js(`(() => {
    const t = ${JSON.stringify(texto)};
    const el = Array.from(document.querySelectorAll('[role=button],[role=radio],[role=tab],a,button')).find((x) => (x.getAttribute('aria-label') || x.textContent || '').includes(t));
    if (!el) return false; el.click(); return true;
  })()`);
  const textoVisible = () => js(`document.body.innerText`);
  const filas = () => js(`Array.from(document.querySelectorAll('[role=button]')).filter((x) => /^Magnitud [0-9]/.test(x.getAttribute('aria-label') || '')).length`);
  const esperarFilas = async () => { for (let i = 0; i < 90; i++) { if ((await filas()) > 0) return; await dormir(1000); } };
  const fijarTema = async (tema, umbral = 6) => { await js(`localStorage.setItem('ajustes-v1', JSON.stringify({ tema: ${JSON.stringify(tema)}, umbral: ${umbral} }))`); };

  await win.loadURL(BASE + '/ajustes');
  for (const [tema, sufijo] of [['claro', 'crema'], ['oscuro', 'oscuro']]) {
    await fijarTema(tema);
    await ir('/', 2000);
    await esperarFilas(); await dormir(1500);
    informe.interaccion['filas-' + tema] = await filas();
    await foto(`resumen-${sufijo}.png`); await auditar('resumen-' + sufijo);

    if (tema === 'claro') {
      // período, filtro de magnitud y búsqueda
      const antes = await filas();
      await tocar('7 días'); await dormir(2500);
      informe.interaccion.filas7dias = await filas();
      await tocar('6,0 o más'); await dormir(600);
      informe.interaccion.filasMag6 = await filas();
      await tocar('Restablecer'); await dormir(400);
      await tocar('24 h'); await dormir(2500);
      informe.interaccion.filas24hDeNuevo = await filas();
      informe.interaccion.filas24hInicial = antes;
    }

    // el detalle de un sismo desde la lista
    await js(`Array.from(document.querySelectorAll('[role=button]')).find((x) => /^Magnitud [0-9]/.test(x.getAttribute('aria-label') || '')).click()`);
    await dormir(3500);
    informe.interaccion['detalle-url-' + tema] = await js('location.pathname');
    informe.interaccion['detalle-impacto-' + tema] = /impacto estimado/i.test(await textoVisible());
    informe.interaccion['detalle-origen-' + tema] = (await textoVisible()).match(/Cálculo por reglas · sin IA|Análisis con IA/)?.[0] || null;
    informe.interaccion['detalle-sin-undefined-' + tema] = !/undefined|NaN/.test(await textoVisible());
    await foto(`detalle-${sufijo}.png`); await auditar('detalle-' + sufijo);

    // del detalle al mapa con el sismo elegido
    await tocar('Ver en el mapa'); await dormir(4500);
    informe.interaccion['mapa-url-' + tema] = await js('location.pathname');
    informe.interaccion['mapa-hoja-' + tema] = /ver impacto estimado/i.test(await textoVisible());
    await foto(`mapa-${sufijo}.png`); await auditar('mapa-' + sufijo);

    await ir('/alertas', 3500);
    await esperarFilas();
    informe.interaccion['alertas-filas-' + tema] = await filas();
    await foto(`alertas-${sufijo}.png`); await auditar('alertas-' + sufijo);

    await ir('/ajustes', 2500);
    informe.interaccion['ajustes-api-' + tema] = /Conectado/.test(await textoVisible());
    await foto(`ajustes-${sufijo}.png`); await auditar('ajustes-' + sufijo);
  }

  // el cambio de tema desde Ajustes se guarda
  await fijarTema('claro');
  await ir('/ajustes', 2500);
  await tocar('Oscuro'); await dormir(800);
  informe.interaccion.temaGuardado = await js(`JSON.parse(localStorage.getItem('ajustes-v1')).tema`);
  informe.interaccion.barraOscura = await js(`getComputedStyle(document.querySelector('[role=tablist]').parentElement).backgroundColor`);

  const fallos = Object.entries(informe.contraste).flatMap(([k, v]) => v.fallan.map((f) => `${k}: ${f.texto} (${f.ratio})`));
  informe.resumen = { textosRevisados: Object.values(informe.contraste).reduce((s, v) => s + v.revisados, 0), fallosDeContraste: fallos.length, erroresDeConsola: informe.consola.length, fallosDeRed: informe.fallos.length };
  fs.writeFileSync(path.join(OUT_INFORME, 'informe_movil.json'), JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe.resumen), fallos.slice(0, 10));
  console.log('listo');
  app.quit();
}).catch((e) => { console.error('ERROR', e); fs.writeFileSync(path.join(OUT_INFORME, 'informe_movil.json'), JSON.stringify({ ...informe, error: String(e) }, null, 2)); app.exit(1); });
