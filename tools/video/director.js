// Director de la toma de la web. Lo inyecta tools/video/grabar.js dentro de la página (executeJavaScript) y lo lanza
// con window.__D.run2(). El video explica CÓMO FUNCIONA la app (el flujo de los datos, la estimación por IA o por reglas,
// y lo que ofrece la interfaz); no compara con la versión anterior.
// - Todo ocurre dentro de la página con clics del DOM: no hay ratón real ni ventanas ajenas en la toma.
// - Dibuja su propio cursor y el anillo de cada clic.
// - Guarda en __D.log la hora exacta (Date.now()) de cada clic, tecla y escena, y los datos que muestra la pantalla
//   (cuántos sismos hay, el mayor, qué sismo estimó la IA y cuál las reglas); el montaje (componer.mjs) los usa para
//   sincronizar y escribir los subtítulos. Date.now() es el mismo reloj que usa el grabador.
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
    .__flujo{display:grid;grid-template-columns:repeat(3,300px);gap:20px 56px;justify-content:center;margin-top:30px;position:relative}
    .__caja{background:#1c1915;border:2px solid #38332b;border-radius:18px;padding:18px 16px;text-align:center;opacity:.28;transition:opacity .7s,border-color .7s,box-shadow .7s;position:relative}
    .__caja.__on{opacity:1;border-color:#f0a15e;box-shadow:0 0 0 4px rgba(240,161,94,.14)}
    .__caja b{display:block;font-size:22px;color:#eee7d6;margin-bottom:4px}
    .__caja span{display:block;font-size:15px;color:#b7ae98;line-height:1.35}
    .__caja i{display:inline-block;margin-top:6px;font-style:normal;font-size:13px;font-weight:700;border-radius:999px;padding:3px 12px}
    .__caja i.__ia{background:rgba(240,161,94,.2);color:#f0a15e}
    .__caja i.__re{background:#2f2a23;color:#cfc6b1}
    .__caja:not(:nth-child(3n))::after{content:"→";position:absolute;right:-44px;top:50%;transform:translateY(-50%);font-size:30px;color:#f0a15e}
    .__caja:nth-child(3)::after{display:none}
    .__nota{margin-top:26px;font-size:17px;color:#b7ae98;text-align:center}
    .__nota b{color:#f0a15e}
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
    if (!el) throw new Error(`No se encontró el elemento «${etiqueta}»`);
    const [x, y] = centro(el);
    await glide(x, y, ms);
    await sleep(160);
    anillo(x, y);
    log.push({ t: Date.now(), k: 'click', x, y, label: etiqueta });
    await sleep(60);
    // Los círculos del mapa son SVG y no tienen .click(): se les manda el evento de clic.
    if (typeof el.click === 'function') el.click();
    else el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, clientX: x, clientY: y }));
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
    <h1>Monitor sísmico global</h1><p style="color:#f0a15e;font-weight:600;font-size:24px">Cómo funciona</p>
    <p style="margin-top:14px">USGS · FastAPI · IA o reglas · MariaDB · Next.js · Expo</p></div>`);
  // El flujo de los datos, en tres pasos que se iluminan de a uno.
  const cardFlujo = (modelo) => tarjeta(`<div style="text-align:center"><h1 style="margin-top:0">El camino de cada sismo</h1>
    <div class="__flujo">
      <div class="__caja" data-paso="1"><b>1 · USGS</b><span>catálogo público: sismos de magnitud 4,5 o más</span></div>
      <div class="__caja" data-paso="1"><b>2 · FastAPI</b><span>lo consulta cada 3 minutos y calcula el radio afectado</span></div>
      <div class="__caja" data-paso="2"><b>3 · Estimación del impacto</b><span>muertes, heridos, pérdidas y nivel de destrucción</span>
        <i class="__ia">IA · ${modelo}</i> <i class="__re">o reglas por profundidad</i></div>
      <div class="__caja" data-paso="3"><b>4 · MariaDB</b><span>guarda cada evento y su impacto por país</span></div>
      <div class="__caja" data-paso="3"><b>5 · API y WebSocket</b><span>entrega la lista y avisa de cada sismo nuevo</span></div>
      <div class="__caja" data-paso="3"><b>6 · Web y celular</b><span>Next.js con mapa Leaflet · Expo (React Native)</span></div>
    </div>
    <div class="__nota" id="__nota">&nbsp;</div></div>`);
  const paso = (c, n, nota) => {
    c.querySelectorAll('.__caja').forEach((b) => b.classList.toggle('__on', Number(b.dataset.paso) === n));
    const el = c.querySelector('#__nota');
    if (el) el.innerHTML = nota;
  };
  const cardCelular = () => tarjeta(`<div style="text-align:center">${MARCA}
    <h1>Y la misma información, en el celular</h1><p>Cliente Expo (React Native) con el mismo backend</p></div>`);

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
  const entero = (s) => parseInt(String(s).replace(/\D/g, ''), 10);
  const coma = (m) => m.toFixed(1).replace('.', ',');
  const esperarQue = async (cond, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (cond()) return true; await sleep(250); } return false; };
  // El marcador de un sismo en el mapa (varios pueden llamarse igual: se busca por magnitud y lugar).
  const marcador = (e) => $$('path.mk').find((p) => (p.getAttribute('aria-label') || '').startsWith(`Magnitud ${coma(e.magnitud)}, ${e.lugar}`));
  const textoPanel = () => ($('.panel-lado') || document.body).innerText;
  // Eventos del período con su origen de estimación (ia o reglas), pedidos a la misma API que usa la página.
  const eventosApi = async () => {
    const url = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\/api\/events\/\?/.test(n));
    if (!url) throw new Error('No se encontró la dirección de la API en las peticiones de la página');
    const desde = new Date(Date.now() - 24 * 3600e3).toISOString().slice(0, 19);
    const r = await fetch(`${new URL(url).origin}/api/events/?limit=500&start_date=${desde}`);
    return (await r.json()).events;
  };

  window.__D = { sleep, log, glide, clic, setCur, anillo };

  window.__D.run = async (opciones = {}) => {
    const D = window.__D;
    const S = sleep;
    log.length = 0; D.done = false; D.err = null;
    const cifras = opciones.cifras || { py: '36', web: '20', movil: '30' };
    const modelo = opciones.modelo || 'Llama 3.3 70B';
    const Y_MAPA = 150; // con el mapa, el panel y la barra de filtros a la vista

    // Lo que muestra la pantalla al empezar: el resumen del día, un sismo estimado por la IA y otro por las reglas.
    const lista = await eventosApi();
    const porMag = (a, b) => b.magnitud - a.magnitud;
    const ia = lista.filter((e) => e.estimacion === 'ia').sort(porMag)[0];
    if (!ia) throw new Error('Ningún sismo del período tiene estimación de la IA: ¿el backend tiene token y modelo?');
    const reglas = lista.filter((e) => e.estimacion === 'reglas' && e.profundidad < 70).sort(porMag)[0]
      || lista.filter((e) => e.estimacion === 'reglas').sort(porMag)[0];
    if (!reglas) throw new Error('Ningún sismo del período tiene estimación por reglas');
    const termino = (reglas.lugar.includes(',') ? reglas.lugar.split(',').pop() : reglas.lugar.split(' ').pop()).trim();
    info({
      total: entero($$('.kpi .v')[0].firstChild.textContent),
      mayorMag: Math.max(...lista.map((e) => e.magnitud)),
      iaMag: ia.magnitud, iaLugar: ia.lugar, iaProf: Math.round(ia.profundidad), iaMuertes: ia.muertes_estimadas, iaHeridos: ia.heridos_estimados, iaNivel: ia.nivel_destruccion,
      reglasMag: reglas.magnitud, reglasLugar: reglas.lugar, reglasProf: Math.round(reglas.profundidad), reglasMuertes: reglas.muertes_estimadas, reglasHeridos: reglas.heridos_estimados,
      termino,
    });
    const mayor = lista.reduce((a, b) => (b.magnitud > a.magnitud ? b : a));
    info({ mayorLugar: mayor.lugar, mayorProf: Math.round(mayor.profundidad), mayorEs: mayor.estimacion });

    // --- portada y el camino de los datos ---
    marca('portada');
    const c1 = cardPortada(); await mostrar(c1); await S(4600);
    marca('flujo-1');
    const c2 = cardFlujo(modelo); await mostrar(c2); await ocultar(c1);
    paso(c2, 1, 'Cada 3 minutos, el backend <b>pide al USGS</b> los sismos nuevos.'); await S(6800);
    marca('flujo-2');
    paso(c2, 2, 'Con un token de Hugging Face, <b>una IA</b> estima el impacto; sin él, o si falla, <b>unas reglas</b>.'); await S(7800);
    marca('flujo-3');
    paso(c2, 3, 'Todo se guarda y <b>se avisa en vivo</b> a la web y al celular.'); await S(6600);
    marca('resumen');
    await ocultar(c2);

    // --- resumen del día ---
    await pasear([[0.2, 0.2], [0.42, 0.2], [0.64, 0.2], [0.84, 0.2]], 900, 600);
    await S(900);

    // --- mapa ---
    marca('mapa');
    await desplazar(Y_MAPA, 1100);
    await pasear([[0.2, 0.55], [0.42, 0.5], [0.3, 0.7]], 1000, 700);
    await S(300);

    // --- un sismo estimado por la IA ---
    marca('panel-ia');
    const mkIa = marcador(ia);
    if (!mkIa) throw new Error(`No se encontró el marcador de M ${coma(ia.magnitud)} «${ia.lugar}» en el mapa`);
    await D.clic(mkIa, 'sismo estimado por la IA', 1300);
    if (!(await esperarQue(() => /Análisis con IA/.test(textoPanel()) && textoPanel().includes(ia.lugar), 20000))) throw new Error('El panel no mostró «Análisis con IA» para el sismo elegido');
    await S(2000);
    marca('panel-ia-2');
    await verEn($('.panel-lado .detalle') || $('.panel-lado'), 150); await S(6800);
    await desplazar(Y_MAPA, 900); await S(300);

    // --- la rueda de carga, en vivo: se reprocesa este mismo sismo ---
    marca('estimando-pedir');
    D.pedir = ia.event_id; // grabar.js lo borra de la base local y le pide al backend que lo vuelva a procesar
    if (!(await esperarQue(() => !!$('.panel-lado .estimando'), 30000))) throw new Error('No apareció la rueda de carga: ¿el backend guarda el sismo antes de la IA?');
    marca('estimando');
    if (!(await esperarQue(() => /Análisis con IA/.test(textoPanel()) && !$('.panel-lado .estimando'), 120000))) throw new Error('La IA no terminó de estimar el sismo en dos minutos');
    marca('estimado');
    await S(1600);
    await verEn($('.panel-lado .detalle') || $('.panel-lado'), 150); await S(4800);
    await desplazar(Y_MAPA, 900); await S(300);

    // --- un sismo estimado por reglas ---
    marca('panel-reglas');
    const mkRe = marcador(reglas);
    if (!mkRe) throw new Error(`No se encontró el marcador de M ${coma(reglas.magnitud)} «${reglas.lugar}» en el mapa`);
    await D.clic(mkRe, 'sismo estimado por reglas', 1300);
    if (!(await esperarQue(() => /Cálculo por reglas/.test(textoPanel()) && textoPanel().includes(reglas.lugar), 20000))) throw new Error('El panel no mostró «Cálculo por reglas» para el sismo elegido');
    await S(6400);

    // --- filtros y búsqueda ---
    marca('filtros');
    await D.clic(boton('5,0 o más', '.chip'), 'magnitud 5', 1000); await S(2000);
    await D.clic(boton('Superficial', '.chip'), 'profundidad superficial', 900); await S(2200);
    await D.clic(boton('Restablecer'), 'restablecer', 900); await S(1000);
    marca('busqueda');
    await D.clic($('#q'), 'buscar', 900); await S(300);
    await escribir($('#q'), termino, 190); await S(2200);
    vaciar($('#q')); await S(600);
    marca('periodo');
    await D.clic(boton('7 días', '.chip'), 'periodo 7', 900); await S(2600);
    await D.clic(boton('24 horas', '.chip'), 'periodo 24', 800); await S(1000);

    // --- gráficos y tabla ---
    marca('graficos');
    await verEn($('#h-tiempo'), 110);
    await pasear([[0.3, 0.45], [0.6, 0.55]], 1000, 1000); await S(800);
    marca('graficos-2');
    await verEn($('#h-hist'), 110);
    await pasear([[0.3, 0.45], [0.75, 0.45]], 1000, 1200); await S(1200);
    marca('tabla');
    await verEn($('#h-tabla'), 100);
    await S(800);
    await D.clic(boton('Magnitud', 'thead th button'), 'ordenar por magnitud', 1000); await S(1500);
    const csv = boton('Exportar CSV');
    if (csv) { const [x, y] = centro(csv); await glide(x, y, 900); await S(1500); }

    // --- tema oscuro ---
    marca('oscuro');
    await desplazar(0, 1000); await S(400);
    await D.clic(boton('Oscuro', '.seg button'), 'tema oscuro', 1100); await S(1600);
    await pasear([[0.25, 0.5], [0.55, 0.6], [0.8, 0.5]], 1000, 800);
    await verEn($('#h-tiempo'), 110); await S(1600);
    await desplazar(0, 1000); await S(500);
    await D.clic(boton('Crema', '.seg button'), 'tema crema', 900); await S(800);

    // --- en vivo ---
    marca('envivo');
    const vivo = $('.live');
    if (vivo) { const [x, y] = centro(vivo); await glide(x, y, 1100); }
    await S(5600);

    // --- paso al celular ---
    cur.style.display = 'none'; // sin cursor sobre las tarjetas
    marca('celular');
    const c4 = cardCelular(); await mostrar(c4); await S(3400);
    marca('fin');
    D.done = true;
  };
  window.__D.run2 = async (opciones) => {
    try { await window.__D.run(opciones); } catch (e) { window.__D.err = `${e.message} @${String(e.stack || '').slice(0, 400)}`; window.__D.done = true; }
  };
  return 'director instalado';
})();
