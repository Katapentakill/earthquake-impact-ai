'use strict';
/**
 * Graba el cliente móvil (Expo corriendo en el navegador con `expo start --web`) en una ventana de 390x844, sin depender del
 * escritorio: abre la página, inyecta el director (director_movil.js), captura la ventana a 30 cuadros por segundo con
 * capturePage() y la entrega a ffmpeg. Es la misma mecánica de grabar.js.
 *
 *   cd mobile && EXPO_PUBLIC_API_URL=http://localhost:8010/api npx expo start --web --port 8081     (con el backend encendido)
 *   npx electron tools/video/grabar_movil.js [--url http://localhost:8081] [--salida carpeta] [--pruebas 30]
 *
 * Escribe en tools/video/salida/movil/: toma.mkv, eventos.json y meta.json. Después: node tools/video/componer_movil.mjs
 */
const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

const argumentos = process.argv.slice(2);
const opcion = (nombre, porDefecto) => { const i = argumentos.indexOf(`--${nombre}`); return i >= 0 ? argumentos[i + 1] : porDefecto; };
const URL = opcion('url', 'http://localhost:8081');
const salida = path.resolve(opcion('salida', path.join(__dirname, 'salida', 'movil')));
const cifras = { pruebas: opcion('pruebas', '30') };
const FPS = 30;
const ANCHO = 390;
const ALTO = 844;
const RAIZ = path.resolve(__dirname, '..', '..');

fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWindowOcclusion');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const imagen = (archivo) => `data:image/png;base64,${fs.readFileSync(path.join(RAIZ, 'docs', 'img', archivo)).toString('base64')}`;

app.whenReady().then(() => grabar().catch((error) => {
  console.error('Falló la grabación:', error);
  app.exit(1);
}));

async function grabar() {
  const ventana = new BrowserWindow({ width: ANCHO, height: ALTO, useContentSize: true, resizable: false, show: true, backgroundColor: '#e7dfcb',
    webPreferences: { backgroundThrottling: false } });
  ventana.removeMenu();
  const js = (codigo) => ventana.webContents.executeJavaScript(codigo, true);
  const hayFilas = () => js(`document.querySelectorAll('[role=button][aria-label^="Magnitud "]').length > 0`);

  // Siempre se parte del tema crema, con el umbral por defecto y el almacenamiento limpio de elecciones anteriores.
  await ventana.loadURL(`${URL}/ajustes`);
  await js(`localStorage.setItem('ajustes-v1', JSON.stringify({ tema: 'claro', umbral: 6 }))`);
  await ventana.loadURL(`${URL}/`);
  for (let i = 0; i < 240 && !(await hayFilas()); i++) await esperar(500);
  if (!(await hayFilas())) throw new Error(`La app de ${URL} no mostró sismos. ¿Está encendida, con el backend y CORS para el puerto 8081?`);
  await esperar(3500);
  ventana.setContentSize(ANCHO, ALTO);
  await esperar(800);

  const prueba = await ventana.webContents.capturePage();
  const { width: ancho, height: alto } = prueba.getSize();
  console.log(`cuadro de ${ancho}x${alto} a ${FPS} fps`);

  const cmd = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgra', '-s', `${ancho}x${alto}`,
    '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '14', '-pix_fmt', 'yuv420p',
    path.join(salida, 'toma.mkv')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const terminoFfmpeg = new Promise((resolver) => cmd.on('close', resolver));
  cmd.stdin.on('error', () => { /* ffmpeg cerró la entrada: se informa al terminar */ });
  const escribir = (buffer) => (cmd.stdin.write(buffer) ? Promise.resolve() : new Promise((r) => cmd.stdin.once('drain', r)));

  await js(fs.readFileSync(path.join(__dirname, 'director_movil.js'), 'utf8'));
  await js('window.__D.done = false');

  let grabando = true;
  const t0 = Date.now();
  let cuadros = 0;
  const paso = 1000 / FPS;
  const bucle = (async () => {
    while (grabando) {
      const captura = await ventana.webContents.capturePage();
      const buffer = captura.toBitmap();
      const debidos = Math.floor((Date.now() - t0) / paso); // si la captura fue lenta, se repite el cuadro y la duración sigue siendo real
      while (cuadros <= debidos) { await escribir(buffer); cuadros++; }
      const espera = cuadros * paso - (Date.now() - t0);
      if (espera > 0) await esperar(espera);
    }
  })();

  const opciones = { cifras, imgs: { antes1: imagen('movil/antes/alertas.png'), antes2: imagen('movil/antes/sistema.png') } };
  js(`window.__D.run2(${JSON.stringify(opciones)})`);
  const inicioGuion = Date.now();
  while (!(await js('window.__D.done')) && Date.now() - inicioGuion < 8 * 60 * 1000) await esperar(500);
  await esperar(400);
  grabando = false;
  await bucle;
  cmd.stdin.end();
  await terminoFfmpeg;

  const eventos = JSON.parse(await js('JSON.stringify(window.__D.log)'));
  const error = await js('window.__D.err');
  fs.writeFileSync(path.join(salida, 'eventos.json'), JSON.stringify(eventos, null, 1));
  fs.writeFileSync(path.join(salida, 'meta.json'), JSON.stringify({ t0, fps: FPS, ancho, alto, cuadros, segundos: cuadros / FPS, url: URL, error }, null, 1));
  console.log(`${cuadros} cuadros (${(cuadros / FPS).toFixed(1)} s), ${eventos.length} eventos${error ? ` · ERROR del guion: ${error}` : ''}`);
  app.exit(error ? 1 : 0);
}
