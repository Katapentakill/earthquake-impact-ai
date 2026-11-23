// Genera los íconos de la app móvil (ícono, ícono adaptable de Android, pantalla de inicio y favicon) con Electron:
// ondas sísmicas (anillos que se apagan) en el acento de la app sobre el crema. Escribe en mobile/assets/images/.
//   cd tools/video && npx electron ../capturas/generar_iconos.js
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const OUT = process.env.OUT_DIR || path.join(__dirname, '..', '..', 'mobile', 'assets', 'images');
const CREMA = '#e7dfcb';
const ACENTO = '#a63f14';
const AMBAR = '#e3b341';
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.commandLine.appendSwitch('disable-gpu');

/** Anillos concéntricos sobre un círculo central; `k` los encoge hacia el centro (el ícono adaptable usa solo ~66 % del lienzo). */
function ondas({ color, centro, k = 1, fondo = null, mono = false }) {
  const c = (r, w, o) => `<circle cx="512" cy="512" r="${r * k}" fill="none" stroke="${color}" stroke-width="${w * k}" opacity="${o}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${fondo ? `<rect width="1024" height="1024" fill="${fondo}"/>` : ''}
    ${c(440, 34, 0.32)}${c(335, 36, 0.62)}${c(230, 38, 1)}
    <circle cx="512" cy="512" r="${112 * k}" fill="${mono ? color : centro}"/>
  </svg>`;
}

const ARCHIVOS = [
  { nombre: 'icon.png', tam: 1024, svg: ondas({ color: ACENTO, centro: ACENTO, fondo: CREMA }) },
  { nombre: 'android-icon-background.png', tam: 1024, svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${CREMA}"/></svg>` },
  { nombre: 'android-icon-foreground.png', tam: 1024, svg: ondas({ color: ACENTO, centro: ACENTO, k: 0.68 }), alfa: true },
  { nombre: 'android-icon-monochrome.png', tam: 1024, svg: ondas({ color: '#000000', centro: '#000000', k: 0.68, mono: true }), alfa: true },
  { nombre: 'splash-icon.png', tam: 1024, svg: ondas({ color: ACENTO, centro: AMBAR }), alfa: true },
  { nombre: 'favicon.png', tam: 48, svg: ondas({ color: ACENTO, centro: ACENTO, fondo: CREMA }) },
];

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // Una sola ventana con transparencia: los íconos opacos llevan su propio fondo en el SVG, y el favicon se reduce al final.
  const win = new BrowserWindow({ show: false, width: 1024, height: 1024, useContentSize: true, transparent: true, frame: false, backgroundColor: '#00000000', webPreferences: { offscreen: true } });
  for (const a of ARCHIVOS) {
    const html = '<html><body style="margin:0;background:transparent;overflow:hidden">' + a.svg.replace(/width="1024" height="1024"/, 'width="1024" height="1024" style="display:block"') + '</body></html>';
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    await new Promise((r) => setTimeout(r, 600));
    let img = await win.webContents.capturePage({ x: 0, y: 0, width: 1024, height: 1024 });
    if (a.tam !== 1024) img = img.resize({ width: a.tam, height: a.tam, quality: 'best' });
    fs.writeFileSync(path.join(OUT, a.nombre), img.toPNG());
    const b = img.toBitmap();
    console.log('ícono', a.nombre, img.getSize().width + 'x' + img.getSize().height, 'alfa de la esquina:', b[3]);
  }
  app.quit();
}).catch((e) => { console.error('ERROR', e); app.exit(1); });
