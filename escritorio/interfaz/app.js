/* SymphorIA · Obertura: lo que hace la ventana del instalador. Habla solo con el .exe (misma dirección, 127.0.0.1). */
(() => {
'use strict';
const T = {
  es: {
    kick: 'Obertura · instalador gratis', titulo: 'Lleva <em>SymphorIA</em> a tu escritorio',
    sub: 'Todas tus IAs en una sola ventana, a un clic desde el escritorio o Inicio.',
    p1: '<b>Su propia ventana</b>, sin pestañas ni barra del navegador.',
    p2: '<b>Siempre al día</b>: se actualiza sola, sin que hagas nada.',
    p3: '<b>Sin permisos de administrador</b>. Gratis, y la quitas cuando quieras.',
    opEscritorio: 'Crear acceso directo en el escritorio', donde: 'Se instala en',
    ahoraNo: 'Ahora no', instalar: 'Instalar', soloAbrir: 'Solo abrirla, sin cambiar nada',
    yaKick: 'Ya la tienes', yaTitulo: 'SymphorIA ya está <em>instalada</em>',
    yaSub: 'Tienes la versión {v}. Puedo dejarla al día con la {n}.', yaSubIgual: 'Tienes la versión {v}, la más nueva. Puedo reinstalarla si algo no anda bien.',
    actualizar: 'Actualizar', reinstalar: 'Reinstalar',
    trabajando: 'Instalando…', trabajandoSub: 'Tarda unos segundos. No cierres esta ventana.',
    copiar: 'Copiando la app', atajos: 'Creando los accesos directos', registro: 'Registrándola en Windows', listo: '¡Lista!',
    listoTitulo: '¡SymphorIA quedó <em>instalada</em>!', listoSub: 'La encuentras en el escritorio y en el menú Inicio. Se actualiza sola.',
    listoSubYa: 'Quedó al día. La encuentras en el escritorio y en el menú Inicio.',
    abrir: 'Abrir SymphorIA', cerrar: 'Cerrar',
    errorTitulo: 'Algo no salió bien', errorSub: 'Puedes reintentar sin problema. Si vuelve a pasar, cuéntanos desde Ayuda en la página.',
    verDetalle: 'Ver el detalle', reintentar: 'Reintentar',
    pie: 'gratis · hecho por SymphorIA', poder: 'Impulsado por Claude',
    dKick: 'Quitar del equipo', dTitulo: '¿Quitar <em>SymphorIA</em>?',
    dSub: 'Se borran la app, sus accesos directos y su entrada en Windows. Tus chats siguen en tu cuenta.',
    dP1: '<b>Tus chats no se pierden</b>: viven en tu cuenta, no en este equipo.', dP2: '<b>Limpio</b>: no queda nada guardado aquí.', dP3: '<b>Vuelves cuando quieras</b> desde symphoria.pages.dev.',
    cancelar: 'Cancelar', quitar: 'Quitar', quitando: 'Quitando…', quitandoSub: 'Un momento.',
    quitar_: 'Borrando accesos directos y registro', limpiar: 'Limpiando los datos', quitadoTitulo: 'SymphorIA se quitó', quitadoSub: '¡Gracias por probarla! Tus chats siguen en tu cuenta.',
    otroIdioma: 'English',
  },
  en: {
    kick: 'Overture · free installer', titulo: 'Bring <em>SymphorIA</em> to your desktop',
    sub: 'All your AIs in one window, one click away from your desktop or Start.',
    p1: '<b>Its own window</b>, no tabs or browser bar.',
    p2: '<b>Always up to date</b>: it updates itself, nothing to do.',
    p3: '<b>No administrator rights</b>. Free, and you can remove it anytime.',
    opEscritorio: 'Add a desktop shortcut', donde: 'Installs to',
    ahoraNo: 'Not now', instalar: 'Install', soloAbrir: 'Just open it, change nothing',
    yaKick: 'Already here', yaTitulo: 'SymphorIA is already <em>installed</em>',
    yaSub: 'You have version {v}. I can bring it up to {n}.', yaSubIgual: 'You have version {v}, the newest one. I can reinstall it if something is off.',
    actualizar: 'Update', reinstalar: 'Reinstall',
    trabajando: 'Installing…', trabajandoSub: 'It takes a few seconds. Please keep this window open.',
    copiar: 'Copying the app', atajos: 'Creating the shortcuts', registro: 'Registering it with Windows', listo: 'Done!',
    listoTitulo: 'SymphorIA is <em>installed</em>!', listoSub: 'Find it on your desktop and in the Start menu. It updates itself.',
    listoSubYa: 'It\'s up to date. Find it on your desktop and in the Start menu.',
    abrir: 'Open SymphorIA', cerrar: 'Close',
    errorTitulo: 'Something went wrong', errorSub: 'You can safely try again. If it happens again, tell us from Help on the website.',
    verDetalle: 'Show details', reintentar: 'Try again',
    pie: 'free · made by SymphorIA', poder: 'Powered by Claude',
    dKick: 'Remove from this PC', dTitulo: 'Remove <em>SymphorIA</em>?',
    dSub: 'The app, its shortcuts and its Windows entry are deleted. Your chats stay in your account.',
    dP1: '<b>Your chats are safe</b>: they live in your account, not on this PC.', dP2: '<b>Clean</b>: nothing is left behind.', dP3: '<b>Come back anytime</b> at symphoria.pages.dev.',
    cancelar: 'Cancel', quitar: 'Remove', quitando: 'Removing…', quitandoSub: 'One moment.',
    quitar_: 'Deleting shortcuts and registry entry', limpiar: 'Cleaning up the data', quitadoTitulo: 'SymphorIA was removed', quitadoSub: 'Thanks for trying it! Your chats stay in your account.',
    otroIdioma: 'Español',
  },
};
const base = location.pathname.replace(/[^/]*$/, '');
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let E = null, L = 'es', vista = 'hola', sondeo = 0, cerrando = false;

const api = (que, metodo = 'GET', extra = {}) =>
  fetch(base + 'api/' + que, Object.assign({ method: metodo, headers: { 'X-Obertura': '1' }, cache: 'no-store' }, extra));

const pasosDe = () => E && E.modo === 'desinstalar' ? ['quitar', 'limpiar', 'listo'] : ['copiar', 'atajos', 'registro', 'listo'];
const fmt = (s, o) => s.replace(/\{(\w)\}/g, (_, k) => o[k] || '');

function textos(){
  const t = T[L], des = E.modo === 'desinstalar', eq = E.equipo || {};
  document.documentElement.lang = L;
  const pone = (k, v) => $$('[data-t="' + k + '"]').forEach(el => { el.innerHTML = v; });
  Object.keys(t).forEach(k => pone(k, t[k]));
  $('#idioma').textContent = L === 'es' ? 'EN' : 'ES';
  $('#idioma').setAttribute('aria-label', t.otroIdioma);
  $('#version').textContent = 'Obertura ' + (E.version || '');
  $('#carpeta').textContent = eq.carpeta || '';
  $$('[data-solo="instalar"]').forEach(el => { el.hidden = des; });
  const pri = $('[data-vista="hola"] .btn.pri span');
  if (des){
    pone('kick', t.dKick); pone('titulo', t.dTitulo); pone('sub', t.dSub);
    pone('p1', t.dP1); pone('p2', t.dP2); pone('p3', t.dP3);
    pone('ahoraNo', t.cancelar); pri.innerHTML = t.quitar;
    pone('trabajando', t.quitando); pone('trabajandoSub', t.quitandoSub);
    pone('listoTitulo', t.quitadoTitulo); pone('listoSub', t.quitadoSub);
    $('[data-vista="hola"] .btn.pri').classList.add('peligro');
  } else if (eq.instalada){
    const igual = eq.versionInstalada && !mayor(E.version, eq.versionInstalada);
    pone('kick', t.yaKick); pone('titulo', t.yaTitulo);
    pone('sub', eq.versionInstalada ? fmt(igual ? t.yaSubIgual : t.yaSub, { v: eq.versionInstalada, n: E.version }) : t.sub);
    pri.innerHTML = igual ? t.reinstalar : t.actualizar;
    $('[data-accion="soloAbrir"]').hidden = false;
    $('.donde').hidden = true;
    if (E.habia) pone('listoSub', t.listoSubYa);
  }
  pintarPasos();
}

function mayor(a, b){
  const p = v => String(v || '').split('-')[0].split('.').map(n => +n || 0);
  const x = p(a), y = p(b);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  return false;
}

function pintarPasos(){
  const t = T[L], ol = $('#pasos'), lista = pasosDe();
  const ahora = E.trabajo === 'listo' ? lista.length : Math.max(0, lista.indexOf(E.paso));
  ol.innerHTML = lista.map((p, i) => '<li class="' + (i < ahora || E.trabajo === 'listo' ? 'hecho' : i === ahora ? 'ahora' : '') + '"><span class="p-ico"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span><span>'
    + (t[p === 'quitar' ? 'quitar_' : p] || p) + '</span></li>').join('');
  const frac = E.trabajo === 'listo' ? 1 : (ahora + .5) / lista.length;
  $('#anillo').style.strokeDashoffset = String(339.3 * (1 - frac));
}

function mostrar(v){
  if (vista === v) return;
  vista = v;
  $$('.vista').forEach(s => { s.hidden = s.dataset.vista !== v; });
  const f = $('.vista:not([hidden]) .btn.pri:not([hidden])') || $('.vista:not([hidden]) .btn');
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 350);
  if (v === 'listo' && E.modo !== 'desinstalar') confeti();
}

async function leer(){
  const r = await api('estado');
  E = await r.json();
  if (!L0) { L = E.idioma === 'en' ? 'en' : 'es'; L0 = true; }
  textos();
  if (E.trabajo === 'trabajando') mostrar('trabajando');
  else if (E.trabajo === 'listo') mostrar('listo');
  else if (E.trabajo === 'error'){ $('#errorTxt').textContent = E.error || ''; mostrar('error'); }
  return E;
}
let L0 = false;

async function empezar(){
  mostrar('trabajando');
  E.trabajo = 'trabajando'; E.paso = ''; pintarPasos();
  const des = E.modo === 'desinstalar';
  try{
    const q = des ? 'desinstalar' : 'instalar?escritorio=' + ($('#escritorio').checked ? '1' : '0');
    const r = await api(q, 'POST');
    if (!r.ok && r.status !== 409) throw new Error('HTTP ' + r.status);
  }catch(e){ E.trabajo = 'error'; E.error = String(e.message || e); $('#errorTxt').textContent = E.error; mostrar('error'); return; }
  clearInterval(sondeo);
  sondeo = setInterval(async () => {
    try{ await leer(); if (E.trabajo !== 'trabajando') clearInterval(sondeo); }catch(e){}
  }, 220);
}

function cerrar(){
  if (cerrando || (E && E.trabajo === 'trabajando')) return;
  cerrando = true;
  api('cerrar', 'POST', { keepalive: true }).catch(() => {}).finally(() => { setTimeout(() => window.close(), 120); });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-accion]'); if (!b) return;
  const a = b.dataset.accion;
  if (a === 'empezar') empezar();
  else if (a === 'cerrar') cerrar();
  else if (a === 'abrir' || a === 'soloAbrir'){ b.disabled = true; api('abrir', 'POST').finally(() => setTimeout(cerrar, 500)); }
});
$('#idioma').addEventListener('click', () => { L = L === 'es' ? 'en' : 'es'; textos(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrar();
});
addEventListener('pagehide', () => { if (!cerrando) api('cerrar', 'POST', { keepalive: true }).catch(() => {}); });
/* da señales de vida mientras la ventana está abierta (si se cierra de golpe, el .exe se entera y termina) */
setInterval(() => { api('latido', 'POST').catch(() => {}); }, 10000);

/* confeti con los colores del logo, una sola vez y corto */
function confeti(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confeti'), x = c.getContext('2d'), dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; x.scale(dpr, dpr);
  const col = ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45', '#ffc857', '#4ce3a4'];
  const cx = innerWidth / 2, cy = innerHeight * .3;
  const ps = Array.from({ length: 120 }, () => {
    const a = Math.random() * Math.PI * 2, v = 3 + Math.random() * 6;
    return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 3, r: 2 + Math.random() * 3.5, c: col[(Math.random() * col.length) | 0], g: Math.random() * Math.PI, w: Math.random() < .5 };
  });
  const t0 = performance.now();
  (function cuadro(t){
    const dt = t - t0; x.clearRect(0, 0, innerWidth, innerHeight);
    x.globalAlpha = Math.max(0, 1 - dt / 2200);
    ps.forEach(p => {
      p.vy += .16; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.g += .2;
      x.fillStyle = p.c;
      if (p.w){ x.save(); x.translate(p.x, p.y); x.rotate(p.g); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); }
      else { x.beginPath(); x.arc(p.x, p.y, p.r / 1.4, 0, 6.3); x.fill(); }
    });
    if (dt < 2200) requestAnimationFrame(cuadro); else x.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

leer().catch(() => { document.body.classList.add('sin-exe'); });
})();
