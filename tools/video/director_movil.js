// Director de la toma del cliente móvil (Expo corriendo en el navegador, ventana de 390x844). Lo inyecta grabar_movil.js
// dentro de la página y lo lanza con window.__D.run2(). Misma idea que director.js (ver su cabecera): todo ocurre dentro de
// la página con clics del DOM, dibuja su propio «dedo» y anota en __D.log la hora de cada toque, tecla y escena, y los datos que
// muestra la pantalla, para que componer_movil.mjs sincronice y escriba los subtítulos.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  document.getElementById('__dst')?.remove();
  document.getElementById('__ddedo')?.remove();

  const st = document.createElement('style');
  st.id = '__dst';
  st.textContent = `
    @keyframes __ring{0%{transform:translate(-50%,-50%) scale(.3);opacity:.95}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
    .__ring{position:fixed;width:84px;height:84px;border-radius:50%;border:4px solid #e8863a;box-shadow:0 0 14px #e8863a88;pointer-events:none;z-index:2147483646;animation:__ring .65s ease-out forwards}
    .__card{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#13110e;color:#eee7d6;font-family:Inter,"Segoe UI",system-ui,sans-serif;opacity:0;transition:opacity .8s;padding:0 22px;box-sizing:border-box}
    .__card.__on{opacity:1}
    .__card h1{font-size:30px;letter-spacing:-.02em;margin:16px 0 6px;font-weight:700;line-height:1.15}
    .__card p{font-size:16px;color:#b7ae98;margin:0;line-height:1.35}
    .__marcaapp{width:84px;height:84px;border-radius:24px;background:#e7dfcb;display:inline-grid;place-items:center}
    .__marcaapp svg{width:64px;height:64px}
    .__antes{background:#e7dfcb;color:#2a2418}
    .__antes .__marco{display:grid;gap:12px;justify-items:center}
    .__antes .__marco img{border-radius:14px;box-shadow:0 12px 36px rgba(60,45,15,.3);border:1px solid #b9ad8f}
    .__etiqueta{display:inline-block;background:#a63f14;color:#fffaf0;border-radius:999px;padding:5px 16px;font-weight:700;font-size:15px;letter-spacing:.06em}
    .__pila{display:grid;gap:8px;justify-items:center;margin-top:18px}
    .__caja{background:#1c1915;border:1px solid #4d463b;border-radius:14px;padding:10px 14px;width:290px;text-align:center}
    .__caja b{display:block;font-size:17px;color:#eee7d6}
    .__caja span{font-size:13px;color:#b7ae98}
    .__flecha{font-size:20px;color:#f0a15e;line-height:1}
    .__datos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px;width:310px}
    .__dato{background:#2f2a23;border-radius:12px;padding:10px 8px;text-align:center}
    .__dato b{display:block;font-size:26px;color:#f0a15e}
    .__dato span{font-size:12.5px;color:#cfc6b1}
  `;
  document.head.appendChild(st);

  // El «dedo»: un círculo translúcido que se desliza hasta el punto tocado.
  const dedo = document.createElement('div');
  dedo.id = '__ddedo';
  dedo.style.cssText = 'position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(232,134,58,.35);border:3px solid #e8863a;pointer-events:none;z-index:2147483647;transform:translate(-9999px,-9999px);box-sizing:border-box';
  document.body.appendChild(dedo);

  let cx = -1; let cy = -1;
  const setDedo = (x, y) => { cx = x; cy = y; dedo.style.transform = `translate(${x}px,${y}px)`; };
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const glide = async (x, y, ms = 700) => {
    if (cx < 0) setDedo(x, innerHeight + 40);
    const x0 = cx; const y0 = cy; const t0 = Date.now();
    for (;;) {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setDedo(x0 + (x - x0) * ease(p), y0 + (y - y0) * ease(p));
      if (p >= 1) break;
      await sleep(16);
    }
  };
  const centro = (el) => { const b = el.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const anillo = (x, y) => {
    const r = document.createElement('div');
    r.className = '__ring'; r.style.left = `${x}px`; r.style.top = `${y}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 800);
  };
  const toque = async (el, etiqueta, ms = 700) => {
    if (!el) throw new Error(`No se encontró el elemento «${etiqueta}»`);
    const [x, y] = centro(el);
    await glide(x, y, ms);
    await sleep(140);
    anillo(x, y);
    log.push({ t: Date.now(), k: 'click', x, y, label: etiqueta });
    await sleep(60);
    // Los círculos del mapa son SVG y no tienen .click(): se les manda el evento.
    if (typeof el.click === 'function') el.click();
    else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }));
  };
  const marca = (nombre) => log.push({ t: Date.now(), k: 'scene', name: nombre });
  const info = (datos) => log.push({ t: Date.now(), k: 'info', ...datos });

  // ---------- lectura de la pantalla ----------
  const filas = () => $$('[role=button]').filter((b) => /^Magnitud \d/.test(b.getAttribute('aria-label') || ''));
  const pestana = (t) => $$('[role=tab]').find((x) => x.textContent.includes(t));
  const chip = (t) => $$('[role=radio]').find((x) => x.textContent.includes(t));
  const boton = (t) => $$('[role=button]').find((x) => (x.getAttribute('aria-label') || x.textContent).includes(t));
  const texto = () => document.body.innerText;
  const numero = (s) => parseFloat(String(s).replace(',', '.'));
  // La lista o la pantalla que se desplaza (la de mayor recorrido y ancho completo).
  const scroller = () => $$('div')
    .filter((d) => d.scrollHeight > d.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(d).overflowY) && d.clientWidth > innerWidth * 0.8)
    .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0];
  const desplazar = async (y, ms = 900) => {
    const el = scroller();
    if (!el) return;
    const y0 = el.scrollTop; const t0 = Date.now();
    for (;;) {
      const p = Math.min(1, (Date.now() - t0) / ms);
      el.scrollTop = y0 + (y - y0) * ease(p);
      if (p >= 1) break;
      await sleep(16);
    }
  };
  const escribir = async (input, txt, pausa = 200) => {
    input.focus();
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    let v = '';
    for (const c of txt) {
      v += c;
      log.push({ t: Date.now(), k: 'key', ch: c });
      poner.call(input, v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(pausa);
    }
  };
  const vaciar = (input) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); };
  const esperarQue = async (cond, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await sleep(250); } return false; };

  // ---------- tarjetas a pantalla completa ----------
  const tarjeta = (html, clase = '') => {
    const c = document.createElement('div');
    c.className = `__card ${clase}`;
    c.innerHTML = html;
    document.body.appendChild(c);
    return c;
  };
  const mostrar = async (c) => { c.getBoundingClientRect(); c.classList.add('__on'); await sleep(850); };
  const ocultar = async (c) => { c.classList.remove('__on'); await sleep(850); c.remove(); };
  const ONDAS = '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="43" fill="none" stroke="#a63f14" stroke-width="4" opacity=".32"/><circle cx="50" cy="50" r="32" fill="none" stroke="#a63f14" stroke-width="4" opacity=".62"/><circle cx="50" cy="50" r="22" fill="none" stroke="#a63f14" stroke-width="4"/><circle cx="50" cy="50" r="10" fill="#a63f14"/></svg>';
  const MARCA = `<div class="__marcaapp">${ONDAS}</div>`;
  const cardPortada = () => tarjeta(`<div style="text-align:center">${MARCA}
    <h1>Monitor sísmico</h1><p style="color:#f0a15e;font-weight:600;font-size:18px">Cliente móvil</p>
    <p style="margin-top:14px">Expo · React Native · TypeScript</p></div>`);
  const cardAntes = (src, ancho, nota) => tarjeta(`<div class="__marco"><span class="__etiqueta">ANTES</span>
    <img src="${src}" alt="" style="width:${ancho}px"><p style="color:#4d4535;font-size:15px;text-align:center">${nota}</p></div>`, '__antes');
  const cardComo = (c) => tarjeta(`<div style="text-align:center"><h1 style="margin-top:0">Cómo está hecho</h1>
    <div class="__pila">
      <div class="__caja"><b>USGS → FastAPI → MariaDB</b><span>el mismo backend de la web</span></div><span class="__flecha">↓</span>
      <div class="__caja"><b>REST y WebSocket</b><span>alertas en vivo</span></div><span class="__flecha">↓</span>
      <div class="__caja"><b>Expo · expo-router</b><span>cuatro pestañas y un detalle</span></div>
    </div>
    <div class="__datos">
      <div class="__dato"><b>${c.pruebas}</b><span>pruebas</span></div>
      <div class="__dato"><b>3</b><span>compilaciones: Android, iOS y web</span></div>
      <div class="__dato"><b>4,5 : 1</b><span>contraste mínimo medido</span></div>
      <div class="__dato"><b>2</b><span>temas de color</span></div>
    </div></div>`);
  const cardCierre = () => tarjeta(`<div style="text-align:center">${MARCA}
    <h1>Alexander Tapia</h1>
    <p>Rediseño del cliente móvil, pruebas y documentación</p>
    <p style="margin-top:14px;font-size:14px">Datos: USGS Earthquake Catalog<br>Mapa © colaboradores de OpenStreetMap</p>
    <p style="margin-top:18px;color:#f0a15e;font-size:14px">github.com/Katapentakill/<br>earthquake-impact-ai</p></div>`);

  window.__D = { sleep, log, glide, toque, setDedo, anillo };

  window.__D.run = async (opciones = {}) => {
    const D = window.__D;
    const S = sleep;
    log.length = 0; D.done = false; D.err = null;
    const imgs = opciones.imgs;
    const cifras = opciones.cifras || { pruebas: '30' };

    // Lo que muestra la pantalla al empezar: el resumen del día y un segundo sismo para la búsqueda.
    const t = texto();
    const kpi = $('[aria-label$="registrados en las últimas 24 h"]');
    const total = kpi ? parseInt(kpi.getAttribute('aria-label'), 10) : 0;
    if (!total) throw new Error('No se encontró la tarjeta «Sismos registrados» (¿la app terminó de cargar?)');
    const m = t.match(/MAYOR MAGNITUD\s*\n\s*([\d,]+)\s*\n\s*([^\n]+?) · (\d+) km/i);
    if (!m) throw new Error('No se encontró la tarjeta «Mayor magnitud» en la pantalla');
    const lista = filas().map((b) => {
      const l = b.getAttribute('aria-label');
      const mm = l.match(/^Magnitud ([\d.]+), (.*), hace .*, profundidad (\d+) kil/);
      return { el: b, mag: mm ? parseFloat(mm[1]) : 0, lugar: mm ? mm[2] : '', prof: mm ? parseInt(mm[3], 10) : 0 };
    }).sort((a, b) => b.mag - a.mag);
    const mayor = lista[0];
    const otro = lista.find((x) => x.lugar !== mayor.lugar && /,/.test(x.lugar)) || lista[1] || lista[0];
    const termino = (otro.lugar.includes(',') ? otro.lugar.split(',').pop() : otro.lugar.split(' ').pop()).trim();
    info({ total, mayorMag: numero(m[1]), mayorLugar: m[2], mayorProf: parseInt(m[3], 10), termino, otroLugar: otro.lugar });

    // --- portada y «antes» ---
    marca('portada');
    const c1 = cardPortada(); await mostrar(c1); await S(5600);
    marca('antes-1');
    const c2 = cardAntes(imgs.antes1, 290, 'Alertas del cliente original: «Profundidad: km» sin dato'); await mostrar(c2); await ocultar(c1); await S(5200);
    marca('antes-2');
    const c3 = cardAntes(imgs.antes2, 290, 'Sistema: «Total de eventos: 1», un dato incorrecto'); await mostrar(c3); await ocultar(c2); await S(5200);

    // --- resumen ---
    marca('resumen-1');
    await ocultar(c3);
    await S(900);
    await glide(innerWidth * 0.3, 190, 900); await S(600);
    await glide(innerWidth * 0.75, 190, 900); await S(600);
    await glide(innerWidth * 0.3, 345, 900); await S(600);
    await glide(innerWidth * 0.75, 345, 900); await S(1300);
    marca('resumen-2');
    await desplazar(430, 1200); await S(4200);

    // --- filtros y búsqueda ---
    marca('filtros');
    await D.toque(chip('7 días'), 'periodo 7 días', 800); await S(2400);
    await D.toque(chip('5,0 o más'), 'magnitud 5', 800); await S(2000);
    await D.toque(chip('Superficial'), 'profundidad superficial', 800); await S(2200);
    await D.toque(boton('Restablecer'), 'restablecer', 800); await S(900);
    await D.toque(chip('24 h'), 'periodo 24 h', 800); await S(1500);
    marca('busqueda');
    await desplazar(560, 900); await S(500);
    const q = $('input[placeholder="Buscar lugar o ID"]');
    await D.toque(q, 'buscar', 800); await S(300);
    await escribir(q, termino, 200); await S(2600);
    vaciar(q); await S(700);
    await desplazar(0, 900); await S(700);

    // --- detalle ---
    marca('detalle-1');
    // Varios sismos pueden compartir el nombre del lugar («Vanuatu region»): se busca por magnitud y lugar.
    const fila = filas().find((b) => b.getAttribute('aria-label').startsWith(`Magnitud ${mayor.mag}, ${mayor.lugar},`));
    if (!fila) throw new Error(`No se encontró la fila del sismo mayor (M ${mayor.mag}, ${mayor.lugar})`);
    await D.toque(fila, 'sismo mayor', 900);
    await esperarQue(() => /impacto estimado/i.test(texto()), 15000);
    await S(4600);
    const d = texto();
    // El subtítulo habla de este sismo: si el detalle abierto no es el mismo, la toma no sirve.
    if (!d.includes(`${mayor.prof} km`) || !d.includes(mayor.lugar)) throw new Error(`El detalle abierto no es el sismo mayor (se esperaba ${mayor.lugar}, ${mayor.prof} km)`);
    const origen = /Análisis con IA/.test(d) ? 'ia' : /Cálculo por reglas/.test(d) ? 'reglas' : 'desconocido';
    const claseProf = (d.match(/PROFUNDIDAD\s*\n[^\n]*\n\s*(Superficial|Intermedia|Profunda)/i) || [])[1] || '';
    info({ origen, claseProf, detalleMuertes: (d.match(/(\d[\d.]*)\s*\n\s*Muertes/) || [])[1] || '' });
    marca('detalle-2');
    await desplazar(420, 1400); await S(5800);

    // --- mapa ---
    marca('mapa-1');
    await desplazar(100000, 900); await S(300);
    await D.toque(boton('Ver en el mapa'), 'ver en el mapa', 900);
    await esperarQue(() => /ver impacto estimado/i.test(texto()), 15000);
    await S(4800);
    marca('mapa-2');
    await D.toque(boton('Ver todo el mundo'), 'ver todo el mundo', 800); await S(3000);
    const marcadores = $$('path.leaflet-interactive').filter((p) => { const b = p.getBoundingClientRect(); return b.width > 6 && b.x > 10 && b.x + b.width < innerWidth - 10 && b.y > 130 && b.y + b.height < innerHeight - 140 && p.getAttribute('stroke-width') !== '3'; })
      .sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width);
    if (marcadores.length) { await D.toque(marcadores[0], 'otro epicentro', 1000); await S(4200); } else { await S(2000); }

    // --- alertas y ajustes ---
    marca('alertas');
    await D.toque(pestana('Alertas'), 'pestaña Alertas', 900); await S(1000);
    await glide(innerWidth * 0.5, 330, 900); await S(4200);
    marca('ajustes-1');
    await D.toque(pestana('Ajustes'), 'pestaña Ajustes', 800); await S(1200);
    await desplazar(330, 1300); await S(3200);
    await desplazar(0, 900); await S(500);

    // --- tema oscuro ---
    marca('oscuro');
    await D.toque(chip('Oscuro'), 'tema oscuro', 800); await S(2000);
    await D.toque(pestana('Resumen'), 'pestaña Resumen', 800); await S(2600);
    await D.toque(pestana('Mapa'), 'pestaña Mapa', 800); await S(4200);
    await D.toque(pestana('Ajustes'), 'pestaña Ajustes', 800); await S(900);
    await D.toque(chip('Crema'), 'tema crema', 800); await S(1200);

    // --- cómo está hecho y cierre ---
    dedo.style.display = 'none';
    marca('como');
    const c5 = cardComo(cifras); await mostrar(c5); await S(8800);
    marca('cierre');
    const c6 = cardCierre(); await mostrar(c6); await ocultar(c5); await S(6200);
    marca('fin');
    D.done = true;
  };
  window.__D.run2 = async (opciones) => {
    try { await window.__D.run(opciones); } catch (e) { window.__D.err = `${e.message} @${String(e.stack || '').slice(0, 400)}`; window.__D.done = true; }
  };
  return 'director móvil instalado';
})();
