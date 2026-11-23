// Comprueba la rueda de carga mientras la IA estima un sismo, en la web y en el móvil (Expo web), sobre la app real:
// borra un sismo de la base de datos local, pide al backend que lo vuelva a procesar y mira la pantalla cada medio segundo.
// El backend guarda el sismo antes de pedirle la estimación a la IA, así que durante unos segundos la interfaz lo ve
// «estimando»; después aparece «Análisis con IA» (o «Cálculo por reglas» si no hay token).
//   npm run estimando --prefix tools/video      (con la app web en :3000, Expo web en :8081 y el backend en :8010)
// Variables: WEB, MOVIL, API (por defecto http://localhost:3000, http://localhost:8081, http://localhost:8010/api),
//            CONTENEDOR_DB (seismic_mariadb), EVENTO (el sismo a reprocesar; por defecto el de mayor magnitud del día), OUT_DIR.
const { app, BrowserWindow } = require('electron');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const WEB = process.env.WEB || 'http://localhost:3000';
const MOVIL = process.env.MOVIL || 'http://localhost:8081';
const API = process.env.API || 'http://localhost:8010/api';
const DB = process.env.CONTENEDOR_DB || 'seismic_mariadb';
const OUT = process.env.OUT_DIR || path.join(__dirname, 'salida');
fs.mkdirSync(OUT, { recursive: true });
app.commandLine.appendSwitch('force-device-scale-factor', '1');
// Al cerrar la ventana de la web se abre la del móvil: la aplicación no debe terminar entre una y otra.
app.on('window-all-closed', () => {});
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const informe = { web: {}, movil: {} };

function borrar(id) {
  const sql = `DELETE FROM eventos_sismicos WHERE event_id='${id.replace(/[^\w.-]/g, '')}'`;
  return new Promise((resolver, rechazar) => execFile('docker', ['exec', DB, 'sh', '-c', `C=$(command -v mariadb || command -v mysql); "$C" -uroot -p"$MARIADB_ROOT_PASSWORD" "$MARIADB_DATABASE" -e "${sql}"`],
    (error, _o, e) => (error ? rechazar(new Error(e || error.message)) : resolver())));
}
const reprocesar = async (id) => { await borrar(id); return fetch(`${API}/events/process`, { method: 'POST' }).then((r) => r.json()); };
const mayorDelDia = async () => {
  const desde = new Date(Date.now() - 24 * 3600e3).toISOString().slice(0, 19);
  const { events } = await (await fetch(`${API}/events/?limit=500&start_date=${desde}`)).json();
  return events.reduce((a, b) => (b.magnitud > a.magnitud ? b : a));
};

app.whenReady().then(async () => {
  const mayor = process.env.EVENTO ? { event_id: process.env.EVENTO } : await mayorDelDia();
  const id = mayor.event_id;
  console.log('sismo a reprocesar:', id, mayor.magnitud ? `M ${mayor.magnitud} ${mayor.lugar}` : '');

  // ───────── web ─────────
  let win = new BrowserWindow({ width: 1440, height: 900, useContentSize: true, show: true, backgroundColor: '#e7dfcb', webPreferences: { backgroundThrottling: false } });
  let wc = win.webContents;
  const js = (c) => wc.executeJavaScript(c, true);
  await win.loadURL(WEB);
  await js("localStorage.setItem('tema','light')");
  await win.loadURL(WEB);
  for (let i = 0; i < 90 && !(await js(`document.querySelectorAll('tbody tr[tabindex]').length > 0`)); i++) await dormir(1000);
  await dormir(5000);
  const elegir = () => js(`(() => { const tr = Array.from(document.querySelectorAll('tbody tr[tabindex]')).find((r) => r.textContent.includes(${JSON.stringify(mayor.lugar || '')}) && r.textContent.includes(${JSON.stringify(mayor.magnitud ? String(mayor.magnitud).replace('.', ',') : '')})); if (!tr) return false; tr.click(); return true; })()`);
  informe.web.filaElegida = await elegir();
  await dormir(3500);
  informe.web.antes = (await js(`document.querySelector('.panel-lado')?.innerText`)).includes('Análisis con IA') ? 'IA' : 'otro';
  const t0 = Date.now();
  const proceso = reprocesar(id).then((r) => { informe.web.process = r; });
  let vistoSpinner = false; let vistoFila = false; let listo = false;
  for (let i = 0; i < 120 && !listo; i++) {
    await dormir(400);
    const e = await js(`({ rueda: !!document.querySelector('.panel-lado .estimando'), fila: !!document.querySelector('tbody .nivel-chip .rueda'), ia: /Análisis con IA|Cálculo por reglas/.test(document.querySelector('.panel-lado')?.innerText || '') })`);
    if (e.rueda && !vistoSpinner) {
      vistoSpinner = true; informe.web.spinnerA = (Date.now() - t0) / 1000;
      fs.writeFileSync(path.join(OUT, 'estimando-web.png'), (await wc.capturePage()).toPNG());
    }
    if (e.fila) vistoFila = true;
    if (vistoSpinner && e.ia && !e.rueda) { listo = true; informe.web.listoA = (Date.now() - t0) / 1000; await dormir(800); fs.writeFileSync(path.join(OUT, 'estimado-web.png'), (await wc.capturePage()).toPNG()); }
  }
  await proceso;
  Object.assign(informe.web, { vistoSpinnerEnPanel: vistoSpinner, vistoRuedaEnTabla: vistoFila, terminoConEstimacion: listo });
  console.log('web:', JSON.stringify(informe.web));
  win.destroy();

  // ───────── móvil ─────────
  await dormir(1500);
  win = new BrowserWindow({ width: 390, height: 844, useContentSize: true, show: true, backgroundColor: '#e7dfcb', webPreferences: { backgroundThrottling: false } });
  wc = win.webContents;
  await win.loadURL(`${MOVIL}/ajustes`);
  await js(`localStorage.setItem('ajustes-v1', JSON.stringify({ tema: 'claro', umbral: 6 }))`);
  await win.loadURL(`${MOVIL}/evento/${encodeURIComponent(id)}`);
  for (let i = 0; i < 60 && !(await js(`/impacto estimado/i.test(document.body.innerText)`)); i++) await dormir(500);
  await dormir(1500);
  const t1 = Date.now();
  const proceso2 = reprocesar(id).then((r) => { informe.movil.process = r; });
  let vistoM = false; let listoM = false;
  for (let i = 0; i < 120 && !listoM; i++) {
    await dormir(400);
    const e = await js(`({ rueda: /Estimando el impacto/.test(document.body.innerText), ia: /Análisis con IA|Cálculo por reglas/.test(document.body.innerText) })`);
    if (e.rueda && !vistoM) { vistoM = true; informe.movil.spinnerA = (Date.now() - t1) / 1000; fs.writeFileSync(path.join(OUT, 'estimando-movil.png'), (await wc.capturePage()).toPNG()); }
    if (vistoM && e.ia && !e.rueda) { listoM = true; informe.movil.listoA = (Date.now() - t1) / 1000; await dormir(800); fs.writeFileSync(path.join(OUT, 'estimado-movil.png'), (await wc.capturePage()).toPNG()); }
  }
  await proceso2;
  Object.assign(informe.movil, { vistoSpinner: vistoM, terminoConEstimacion: listoM });

  fs.writeFileSync(path.join(OUT, 'informe_estimando.json'), JSON.stringify(informe, null, 2));
  console.log(JSON.stringify(informe));
  app.quit();
}).catch((e) => { console.error('ERROR', e); app.exit(1); });
