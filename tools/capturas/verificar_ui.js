// Verificación de la interfaz sobre la app real (con la app encendida): captura las pantallas en crema, oscuro y celular,
// prueba filtros, orden, búsqueda, teclado y selección, y mide el contraste de TODO el texto visible (mínimo 4,5:1, o 3:1
// en texto grande). Escribe las capturas y informe.json en tools/capturas/salida/ (o en OUT_DIR).
//   npm run ui --prefix tools/video      (usa el Electron que instala tools/video)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const URL = process.env.TARGET_URL || 'http://localhost:3000';
const OUT = process.env.OUT_DIR || path.join(__dirname, 'salida');
fs.mkdirSync(OUT, { recursive: true });
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
      if (n.closest && n.closest('#mapa') && n.tagName.toLowerCase() === 'text') { const o = parse(getComputedStyle(document.querySelector('#mapa .oceano')).fill); if (o) { capas.push(o); break; } }
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) capas.push(bg);
      if (bg && bg.a >= 0.999) break;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = capas.length - 1; i >= 0; i--) base = over(capas[i], base);
    return base;
  };
  const malos = [], total = { n: 0 };
  const els = document.querySelectorAll('body *');
  els.forEach((el) => {
    if (el.closest('defs, symbol, .sr-only, .skip, script, style')) return;
    const tag = el.tagName.toLowerCase();
    const propio = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length);
    if (!propio) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    let op = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
    if (op < 0.5) return;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return;
    const col = parse(tag === 'text' || el instanceof SVGElement ? cs.fill : cs.color); if (!col) return;
    const bg = fondo(el);
    const fg = over(col, bg);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const grande = px >= 24 || (px >= 18.66 && bold);
    const min = grande ? 3 : 4.5, c = ratio(fg, bg);
    total.n++;
    if (c < min) malos.push({ el: tag + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).join('.') : ''), texto: el.textContent.trim().slice(0, 40), ratio: +c.toFixed(2), min });
  });
  return { revisados: total.n, fallan: malos };
})()`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 1440, height: 900, useContentSize: true, show: true, backgroundColor: '#e7dfcb', webPreferences: { backgroundThrottling: false } });
  const wc = win.webContents;
  wc.on('console-message', (e) => { if (e.level === 'error' || e.level === 'warning') informe.consola.push(String(e.message).slice(0, 220)); });
  wc.session.webRequest.onErrorOccurred((d) => { if (!/tile\.openstreetmap/.test(d.url)) informe.fallos.push(`${d.error} ${d.url.slice(0, 100)}`); else informe.tilesFallidos = (informe.tilesFallidos || 0) + 1; });
  const js = (c) => wc.executeJavaScript(c, true);
  const foto = async (nombre, rect) => { const img = await wc.capturePage(rect); fs.writeFileSync(path.join(OUT, nombre), img.toPNG()); const s = img.getSize(); console.log('foto', nombre, s.width + 'x' + s.height); };
  const completa = async (nombre, ancho, alto) => {
    const h = await js('document.documentElement.scrollHeight');
    win.setContentSize(ancho, Math.min(h, 7000)); await dormir(1500);
    await foto(nombre);
    win.setContentSize(ancho, alto); await dormir(800);
  };
  const auditar = async (k) => { informe.contraste[k] = await js(AUDITORIA); };
  const clic = (texto, sel = 'button') => js(`(() => { const b = Array.from(document.querySelectorAll('${sel}')).find(x => x.textContent.trim().startsWith(${JSON.stringify(texto)})); if (!b) return false; b.click(); return true; })()`);
  const filas = () => js(`document.querySelectorAll('tbody tr[tabindex]').length`);

  await win.loadURL(URL);
  let n = 0;
  for (let i = 0; i < 120; i++) { n = await filas(); if (n > 0) break; await dormir(1000); }
  informe.interaccion.filasIniciales = n;
  await dormir(6000);

  // claro
  await clic('Crema'); await dormir(600);
  await foto('claro-1-general.png');
  informe.interaccion.enVivo = await js(`document.querySelector('.live')?.textContent.trim()`);
  await completa('claro-2-pagina-completa.png', 1440, 900);
  await auditar('claro');

  // elegir un sismo de la tabla (el de Perú) y mirar el panel
  const elegido = await js(`(() => { const tr = Array.from(document.querySelectorAll('tbody tr[tabindex]')).find(r => /Carhuamayo/.test(r.textContent)) || document.querySelector('tbody tr[tabindex]'); tr.click(); return tr.querySelector('b')?.textContent; })()`);
  informe.interaccion.elegido = elegido;
  await dormir(3500);
  informe.interaccion.panelTitulo = await js(`document.getElementById('h-evento')?.textContent`);
  informe.interaccion.panelTieneImpacto = await js(`!!document.querySelector('.panel-lado .nivel-t')`);
  await js('window.scrollTo(0,0)'); await dormir(500);
  await foto('claro-3-evento.png');
  await auditar('claro-evento');

  // filtros, orden y búsqueda
  await clic('6,0 o más'); await dormir(500);
  informe.interaccion.filasMag6 = await filas();
  await clic('Restablecer'); await dormir(400);
  await clic('Superficial'); await dormir(400);
  informe.interaccion.filasSuperficiales = await filas();
  await clic('Restablecer'); await dormir(400);
  await js(`(() => { const i = document.getElementById('q'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(i, 'Peru'); i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await dormir(500);
  informe.interaccion.filasBusquedaPeru = await filas();
  await clic('Restablecer'); await dormir(400);
  await clic('Magnitud', 'thead th button'); await dormir(400);
  informe.interaccion.primeraFilaOrdenadaPorMagnitud = await js(`document.querySelector('tbody tr[tabindex] .mag')?.textContent`);
  informe.interaccion.ariaSort = await js(`document.querySelector('thead th[aria-sort="descending"], thead th[aria-sort="ascending"]')?.textContent.trim()`);
  await clic('7 días'); await dormir(2500);
  informe.interaccion.filas7dias = await filas();
  informe.interaccion.tituloGrafico = await js(`document.getElementById('h-tiempo')?.textContent`);
  await clic('24 horas'); await dormir(1500);
  // teclado: enfocar una fila y presionar Enter
  informe.interaccion.teclado = await js(`(() => { const trs = document.querySelectorAll('tbody tr[tabindex]'); const t = trs[trs.length - 1]; t.focus(); t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return t.getAttribute('aria-selected'); })()`);
  await dormir(600);
  informe.interaccion.tecladoSeleccion = await js(`document.querySelector('tbody tr[aria-selected="true"]')?.textContent.slice(0, 40)`);
  informe.interaccion.csvBoton = await js(`!!Array.from(document.querySelectorAll('button')).find(b => /Exportar CSV/.test(b.textContent))`);

  // oscuro
  await clic('Oscuro'); await dormir(800);
  await js(`(() => { const tr = Array.from(document.querySelectorAll('tbody tr[tabindex]')).find(r => /Carhuamayo/.test(r.textContent)); tr && tr.click(); window.scrollTo(0,0); })()`); await dormir(3500);
  await foto('oscuro-1-general.png');
  await completa('oscuro-2-pagina-completa.png', 1440, 900);
  await auditar('oscuro');

  // celular
  for (const t of ['Crema', 'Oscuro']) {
    await clic(t); await dormir(500);
    win.setContentSize(390, 844); await dormir(1800);
    await js('window.scrollTo(0,0)'); await dormir(600);
    await completa((t === 'Crema' ? 'claro' : 'oscuro') + '-3-celular.png', 390, 844);
    informe.interaccion['desborde-' + t] = await js(`document.documentElement.scrollWidth > document.documentElement.clientWidth`);
    await auditar('celular-' + t);
  }
  informe.interaccion.temaGuardado = await js(`localStorage.getItem('tema')`);
  fs.writeFileSync(path.join(OUT, 'informe.json'), JSON.stringify(informe, null, 2));
  console.log('listo');
  app.quit();
}).catch((e) => { console.error('ERROR', e); fs.writeFileSync(path.join(OUT, 'informe.json'), JSON.stringify({ ...informe, error: String(e) }, null, 2)); app.exit(1); });
