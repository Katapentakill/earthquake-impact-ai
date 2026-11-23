// Director de la toma de la app. Lo inyecta tools/video/grabar.js dentro de la página (executeJavaScript) y lo lanza
// con window.__D.run2().
// - Todo ocurre dentro de la página con clics del DOM: no hay ratón real ni ventanas ajenas en la toma.
// - Dibuja su propio cursor y el anillo de cada clic.
// - Guarda en __D.log la hora exacta (Date.now()) de cada clic, tecla y escena, y los datos que muestra la pantalla
//   (cuántos sismos hay, el mayor, etc.); el montaje (componer.mjs) los usa para sincronizar y escribir los subtítulos.
//   Date.now() es el mismo reloj que usa el grabador, así que no hace falta detectar escenas en el video.
// - Usa setTimeout y no requestAnimationFrame: rAF se detiene si la ventana queda tapada y el guion se congelaría.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const log = [];
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  document.getElementById('__dst')?.remove();
  document.getElementById('__dcur')?.remove();

  const st = document.createElement('style');
  st.id = '__dst';
  st.textContent = `
    @keyframes __ring{0%{transform:translate(-50%,-50%) scale(.2);opacity:.95}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
    .__ring{position:fixed;width:110px;height:110px;border-radius:50%;border:5px solid #e8863a;box-shadow:0 0 18px #e8863a88;pointer-events:none;z-index:2147483646;animation:__ring .7s ease-out forwards}
    .__card{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:#13110e;color:#eee7d6;font-family:Inter,"Segoe UI",system-ui,sans-serif;opacity:0;transition:opacity .8s}
    .__card.__on{opacity:1}
    .__card h1{font-size:46px;letter-spacing:-.02em;margin:18px 0 8px;font-weight:700}
    .__card p{font-size:20px;color:#b7ae98;margin:0}
    .__marcaapp{width:78px;height:78px;border-radius:22px;background:#f0a15e;display:inline-grid;place-items:center}
    .__marcaapp svg{width:46px;height:46px;fill:none;stroke:#1a1510;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
    .__antes{background:#e7dfcb;color:#2a2418}
    .__antes .__marco{display:grid;gap:14px;justify-items:center}
    .__antes .__marco img{border-radius:14px;box-shadow:0 12px 40px rgba(60,45,15,.3);border:1px solid #b9ad8f}
    .__etiqueta{display:inline-block;background:#a63f14;color:#fffaf0;border-radius:999px;padding:6px 18px;font-weight:700;font-size:18px;letter-spacing:.06em}
    .__como{gap:26px;align-content:center;padding:0 80px}
    .__flujo{display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:nowrap}
    .__caja{background:#1c1915;border:1px solid #4d463b;border-radius:16px;padding:16px 14px;width:222px;text-align:center}
    .__caja b{display:block;font-size:20px;color:#eee7d6}
    .__caja span{font-size:14px;color:#b7ae98}
    .__flecha{font-size:30px;color:#f0a15e}
    .__datos{display:flex;gap:18px;justify-content:center;margin-top:8px}
    .__dato{background:#2f2a23;border-radius:14px;padding:14px 22px;text-align:center}
    .__dato b{display:block;font-size:32px;color:#f0a15e}
    .__dato span{font-size:15px;color:#cfc6b1}
    .__moviles{display:flex;gap:44px;justify-content:center;align-items:flex-start}
    .__moviles div{width:290px;height:560px;border-radius:30px;border:9px solid #0b0a08;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.55);background:#000}
    .__moviles img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
  `;
  document.head.appendChild(st);

  const cur = document.createElement('div');
  cur.id = '__dcur';
  cur.style.cssText = 'position:fixed;left:0;top:0;width:32px;height:32px;pointer-events:none;z-index:2147483647;transform:translate(-9999px,-9999px)';
  cur.innerHTML = '<svg width="32" height="32" viewBox="0 0 32 32"><path d="M4 2 L4 24 L10 19 L14 28 L18 26 L14 17 L22 17 Z" fill="#fff" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
  document.body.appendChild(cur);

  let cx = -1; let cy = -1;
  const setCur = (x, y) => { cx = x; cy = y; cur.style.transform = `translate(${x - 4}px,${y - 2}px)`; };
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const glide = async (x, y, ms = 800) => {
    if (cx < 0) setCur(x - 200, y + 120);
    const x0 = cx; const y0 = cy; const t0 = Date.now();
    for (;;) {
      const p = Math.min(1, (Date.now() - t0) / ms);
      setCur(x0 + (x - x0) * ease(p), y0 + (y - y0) * ease(p));
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
  const clic = async (el, etiqueta, ms = 800) => {
    const [x, y] = centro(el);
    await glide(x, y, ms);
    await sleep(160);
    anillo(x, y);
    log.push({ t: Date.now(), k: 'click', x, y, label: etiqueta });
    await sleep(60);
    el.click();
  };
  const pasear = async (puntos, ms = 900, pausa = 350) => {
    for (const [fx, fy] of puntos) { await glide(innerWidth * fx, innerHeight * fy, ms); await sleep(pausa); }
  };
  const marca = (nombre) => log.push({ t: Date.now(), k: 'scene', name: nombre });
  const info = (datos) => log.push({ t: Date.now(), k: 'info', ...datos });

  // Desplaza la página con un movimiento suave (setTimeout, no rAF).
  const desplazar = async (y, ms = 900) => {
    const y0 = scrollY; const t0 = Date.now();
    for (;;) {
      const p = Math.min(1, (Date.now() - t0) / ms);
      scrollTo(0, y0 + (y - y0) * ease(p));
      if (p >= 1) break;
      await sleep(16);
    }
  };
  const verEn = (el, arriba = 96) => desplazar(Math.max(0, el.getBoundingClientRect().top + scrollY - arriba), 900);

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
  const MARCA = '<div class="__marcaapp"><svg viewBox="0 0 24 24"><path d="M2.5 12.5h4l2.2-6.5 3.6 12 2.4-7 1.6 1.5h5.2"/></svg></div>';

  const cardPortada = () => tarjeta(`<div style="text-align:center">${MARCA}
    <h1>Monitor sísmico global</h1><p>FastAPI · Next.js · MariaDB · USGS en tiempo real</p></div>`);
  const cardAntes = (src, ancho, nota) => tarjeta(`<div class="__marco"><span class="__etiqueta">ANTES</span>
    <img src="${src}" alt="" style="width:${ancho}px"><p style="color:#4d4535;font-size:20px">${nota}</p></div>`, '__antes');
  const cardMoviles = (a, b) => tarjeta(`<div style="text-align:center"><h1 style="margin-top:0;margin-bottom:24px">También en el celular</h1>
    <div class="__moviles"><div><img src="${a}" alt=""></div><div><img src="${b}" alt=""></div></div></div>`);
  const cardComo = (cifras) => tarjeta(`<div style="text-align:center"><h1 style="margin-top:0">Cómo está hecho</h1>
    <div class="__flujo" style="margin-top:26px">
      <div class="__caja"><b>USGS</b><span>catálogo público de sismos</span></div><span class="__flecha">→</span>
      <div class="__caja"><b>FastAPI</b><span>consulta cada 3 min · API y WebSocket</span></div><span class="__flecha">→</span>
      <div class="__caja"><b>MariaDB</b><span>eventos e impactos</span></div><span class="__flecha">→</span>
      <div class="__caja"><b>Next.js</b><span>mapa Leaflet, gráficos y tabla</span></div>
    </div>
    <div class="__datos">
      <div class="__dato"><b>${cifras.js}</b><span>pruebas de JavaScript</span></div>
      <div class="__dato"><b>${cifras.py}</b><span>pruebas de Python</span></div>
      <div class="__dato"><b>4,5 : 1</b><span>contraste mínimo medido</span></div>
      <div class="__dato"><b>2</b><span>temas de color</span></div>
    </div></div>`, '__como');
  const cardCierre = () => tarjeta(`<div style="text-align:center">${MARCA}
    <h1>Alexander Tapia</h1>
    <p>Rediseño de la interfaz, estimación por profundidad, pruebas y documentación</p>
    <p style="margin-top:16px;font-size:18px">Datos: USGS Earthquake Catalog · Mapa © OpenStreetMap</p>
    <p style="margin-top:22px;color:#f0a15e">github.com/Katapentakill/earthquake-impact-ai</p></div>`);

  // ---------- gestos y lectura de la pantalla ----------
  const boton = (texto, ambito = 'button') => $$(ambito).find((b) => b.textContent.trim().startsWith(texto));
  const escribir = async (input, texto, pausa = 190) => {
    input.focus();
    const poner = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    let v = '';
    for (const c of texto) {
      v += c;
      log.push({ t: Date.now(), k: 'key', ch: c });
      poner.call(input, v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await sleep(pausa);
    }
  };
  const vaciar = (input) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ''); input.dispatchEvent(new Event('input', { bubbles: true })); };
  const filas = () => $$('tbody tr[tabindex]').map((tr) => ({
    tr,
    mag: parseFloat(tr.querySelector('.mag').textContent.replace(',', '.')),
    lugar: tr.querySelector('.lugar b').textContent,
    prof: parseInt(tr.children[3].textContent, 10),
    clase: tr.children[3].querySelector('.sub')?.textContent.trim(),
    elegida: tr.getAttribute('aria-selected') === 'true',
  }));
  const marcador = (lugar) => $$('path.mk').find((p) => (p.getAttribute('aria-label') || '').includes(lugar));
  const entero = (s) => parseInt(String(s).replace(/\D/g, ''), 10);

  window.__D = { sleep, log, glide, clic, setCur, anillo };

  window.__D.run = async (opciones = {}) => {
    const D = window.__D;
    const S = sleep;
    log.length = 0; D.done = false; D.err = null;
    const cifras = opciones.cifras || { js: '20', py: '19' };
    const imgs = opciones.imgs;
    const Y_MAPA = 150; // con el mapa, el panel y la barra de filtros a la vista

    // Lo que muestra la pantalla al empezar: el resumen del día y dos sismos para contar la historia.
    const f = filas();
    const mayor = f.find((x) => x.elegida) || f.reduce((a, b) => (b.mag > a.mag ? b : a));
    const superficiales = f.filter((x) => x.clase === 'Superficial' && x !== mayor).sort((a, b) => b.mag - a.mag);
    const otro = superficiales[0] || f.filter((x) => x !== mayor).sort((a, b) => b.mag - a.mag)[0];
    const termino = (otro.lugar.includes(',') ? otro.lugar.split(',').pop() : otro.lugar.split(' ').pop()).trim();
    info({
      mayorClase: mayor.clase, otroClase: otro.clase,
      total: entero($$('.kpi .v')[0].firstChild.textContent),
      mayorMag: mayor.mag, mayorLugar: mayor.lugar, mayorProf: mayor.prof,
      otroMag: otro.mag, otroLugar: otro.lugar, otroProf: otro.prof, termino,
      deCinco: entero($$('.kpi .v')[3].firstChild.textContent),
    });

    // --- portada y «antes» ---
    marca('portada');
    const c1 = cardPortada(); await mostrar(c1); await S(4600);
    marca('antes-1');
    const c2 = cardAntes(imgs.antes1, 900, 'La interfaz original: degradados azul y morado, todo en inglés'); await mostrar(c2); await ocultar(c1); await S(5400);
    marca('antes-2');
    const c3 = cardAntes(imgs.antes2, 250, 'En el celular, los filtros ocupaban la primera pantalla'); await mostrar(c3); await ocultar(c2); await S(5600);

    // --- resumen del día ---
    marca('resumen-1');
    await ocultar(c3);
    await pasear([[0.2, 0.2], [0.42, 0.2], [0.64, 0.2], [0.84, 0.2]], 900, 650);
    await S(1600);

    // --- mapa y panel ---
    marca('mapa-1');
    await desplazar(Y_MAPA, 1100);
    await pasear([[0.2, 0.55], [0.42, 0.5], [0.3, 0.7]], 1100, 900);
    await S(900);
    marca('panel-1');
    await glide(innerWidth * 0.8, innerHeight * 0.62, 1200); await S(6400);
    marca('mapa-2');
    const mk = marcador(otro.lugar);
    if (!mk) throw new Error(`No se encontró el marcador de «${otro.lugar}» en el mapa`);
    await D.clic(mk, 'marcador', 1300);
    await S(6200);

    // --- filtros ---
    marca('filtros-1');
    await D.clic(boton('5,0 o más', '.chip'), 'magnitud 5', 1000); await S(2400);
    await D.clic(boton('Superficial', '.chip'), 'profundidad superficial', 900); await S(2600);
    await D.clic(boton('Restablecer'), 'restablecer', 900); await S(1400);
    marca('filtros-2');
    await D.clic($('#q'), 'buscar', 900); await S(300);
    await escribir($('#q'), termino, 190); await S(2800);
    vaciar($('#q')); await S(700);
    marca('periodo');
    await D.clic(boton('7 días', '.chip'), 'periodo 7', 900); await S(3000);
    await D.clic(boton('24 horas', '.chip'), 'periodo 24', 800); await S(1500);

    // --- gráficos y tabla ---
    marca('graficos');
    await verEn($('#h-tiempo'), 110);
    await pasear([[0.3, 0.45], [0.6, 0.55], [0.4, 0.7]], 1000, 1100); await S(1200);
    marca('graficos-2');
    await verEn($('#h-hist'), 110);
    await pasear([[0.3, 0.45], [0.75, 0.45]], 1000, 1500); await S(1800);
    marca('tabla');
    await verEn($('#h-tabla'), 100);
    await S(1200);
    await D.clic(boton('Magnitud', 'thead th button'), 'ordenar por magnitud', 1000); await S(2000);
    marca('tabla-2');
    const segunda = filas().filter((x) => x.lugar !== mayor.lugar).sort((a, b) => b.mag - a.mag)[0];
    await D.clic(segunda.tr, 'fila', 1000); await S(500);
    await desplazar(Y_MAPA, 1200); await S(4600);

    // --- tema oscuro ---
    marca('oscuro');
    await D.clic(boton('Oscuro', '.seg button'), 'tema oscuro', 1100); await S(1800);
    await pasear([[0.25, 0.5], [0.55, 0.6], [0.8, 0.5]], 1000, 900);
    await verEn($('#h-tiempo'), 110); await S(2600);
    await desplazar(0, 1000); await S(800);
    await D.clic(boton('Crema', '.seg button'), 'tema crema', 900); await S(1200);

    // --- celular ---
    cur.style.display = 'none'; // sin cursor sobre las tarjetas finales
    marca('celular');
    const c4 = cardMoviles(imgs.cel1, imgs.cel2); await mostrar(c4); await S(5200);

    // --- cómo está hecho y cierre ---
    marca('como');
    const c5 = cardComo(cifras); await mostrar(c5); await ocultar(c4); await S(9800);
    marca('cierre');
    const c6 = cardCierre(); await mostrar(c6); await ocultar(c5); await S(7200);
    marca('fin');
    D.done = true;
  };
  window.__D.run2 = async (opciones) => {
    try { await window.__D.run(opciones); } catch (e) { window.__D.err = `${e.message} @${String(e.stack || '').slice(0, 400)}`; window.__D.done = true; }
  };
  return 'director instalado';
})();
