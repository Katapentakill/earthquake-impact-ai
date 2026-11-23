'use strict';
/**
 * Graba la web que está corriendo en el navegador de Electron, sin depender del escritorio: abre la página, inyecta el
 * director (director.js), captura la ventana a 30 cuadros por segundo con capturePage() y la entrega a ffmpeg.
 *
 *   npx electron tools/video/grabar.js [--url http://localhost:3000] [--api http://localhost:8010/api] [--salida carpeta]
 *                                      [--db seismic_mariadb] [--modelo "Llama 3.3 70B"]
 *
 * Antes hay que tener la app encendida (docker compose up -d) y con sismos cargados, y el backend con un token de
 * Hugging Face (el video muestra un sismo estimado por la IA). Escribe en la carpeta de salida (por defecto
 * tools/video/salida/): toma.mkv, eventos.json y meta.json. Después: node tools/video/componer.mjs
 *
 * Para enseñar la rueda de carga en vivo, el director pide (window.__D.pedir) que se reprocese un sismo: este programa lo
 * borra de la base de datos local (docker exec en el contenedor de MariaDB) y le pide al backend que lo vuelva a procesar.
 * Es el camino real de un sismo nuevo; solo se dispara a propósito, y la guía del video lo dice.
 */
const { app, BrowserWindow } = require('electron');
const { spawn, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

const argumentos = process.argv.slice(2);
const opcion = (nombre, porDefecto) => { const i = argumentos.indexOf(`--${nombre}`); return i >= 0 ? argumentos[i + 1] : porDefecto; };
const URL = opcion('url', 'http://localhost:3000');
const API = opcion('api', 'http://localhost:8010/api');
const CONTENEDOR_DB = opcion('db', 'seismic_mariadb');
const MODELO = opcion('modelo', 'Llama 3.3 70B');
const salida = path.resolve(opcion('salida', path.join(__dirname, 'salida')));
const FPS = 30;
const ANCHO = 1280;
const ALTO = 800;

fs.mkdirSync(salida, { recursive: true });
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWindowOcclusion');
app.commandLine.appendSwitch('force-device-scale-factor', '1');

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// Borra el sismo de la base local y pide al backend que lo procese otra vez (sin esperar a que termine).
function reprocesar(id) {
  const sql = `DELETE FROM eventos_sismicos WHERE event_id='${String(id).replace(/[^\w.-]/g, '')}'`;
  execFile('docker', ['exec', CONTENEDOR_DB, 'sh', '-c', `C=$(command -v mariadb || command -v mysql); "$C" -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" -e "${sql}"`], (error) => {
    if (error) { console.error('No se pudo borrar el sismo de la base local:', error.message); return; }
    fetch(`${API}/events/process`, { method: 'POST' })
      .then((r) => r.json()).then((j) => console.log(`reprocesado ${id}:`, JSON.stringify(j)))
      .catch((e) => console.error('No se pudo pedir el procesamiento:', e.message));
  });
}

app.whenReady().then(() => grabar().catch((error) => {
  console.error('Falló la grabación:', error);
  app.exit(1);
}));

async function grabar() {
  const ventana = new BrowserWindow({ width: ANCHO, height: ALTO, useContentSize: true, resizable: false, show: true, backgroundColor: '#e7dfcb',
    webPreferences: { backgroundThrottling: false } });
  ventana.removeMenu();
  const js = (codigo) => ventana.webContents.executeJavaScript(codigo, true);

  // Siempre se parte del tema crema y con el almacenamiento del navegador limpio de elecciones anteriores.
  await ventana.loadURL(URL);
  await js("localStorage.setItem('tema', 'light')");
  await ventana.loadURL(URL);
  for (let i = 0; i < 240 && !(await js("document.querySelectorAll('tbody tr[tabindex]').length > 0")); i++) await esperar(500);
  if (!(await js("document.querySelectorAll('tbody tr[tabindex]').length > 0"))) throw new Error(`La app de ${URL} no mostró sismos. ¿Está encendida?`);
  await esperar(7000); // teselas del mapa
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

  await js(fs.readFileSync(path.join(__dirname, 'director.js'), 'utf8'));
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
  // El director pide acciones que solo este proceso puede hacer (tocar la base de datos local).
  const atento = (async () => {
    while (grabando) {
      const id = await js('window.__D.pedir || null');
      if (id) { await js('window.__D.pedir = null'); reprocesar(id); }
      await esperar(150);
    }
  })();

  js(`window.__D.run2(${JSON.stringify({ modelo: MODELO })})`);
  const inicioGuion = Date.now();
  while (!(await js('window.__D.done')) && Date.now() - inicioGuion < 10 * 60 * 1000) await esperar(500);
  await esperar(400);
  grabando = false;
  await bucle;
  await atento;
  cmd.stdin.end();
  await terminoFfmpeg;

  const eventos = JSON.parse(await js('JSON.stringify(window.__D.log)'));
  const error = await js('window.__D.err');
  fs.writeFileSync(path.join(salida, 'eventos.json'), JSON.stringify(eventos, null, 1));
  fs.writeFileSync(path.join(salida, 'meta.json'), JSON.stringify({ t0, fps: FPS, ancho, alto, cuadros, segundos: cuadros / FPS, url: URL, error }, null, 1));
  console.log(`${cuadros} cuadros (${(cuadros / FPS).toFixed(1)} s), ${eventos.length} eventos${error ? ` · ERROR del guion: ${error}` : ''}`);
  app.exit(error ? 1 : 0);
}
