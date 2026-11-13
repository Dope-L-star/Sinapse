// Puente mínimo entre la página y el Wasm de Rust.
// Rust decide todo y devuelve HTML; aquí solo se cargan los bytes, se reenvían
// los eventos y las rutas, y se guarda el estado en este navegador para retomar.

const CLAVE = 'lutim-web-vista-previa-v1';
const raiz = document.getElementById('app');
const codificar = new TextEncoder();
const descodificar = new TextDecoder();
let wasm;
let rutaPintada = null;

function llamar(funcion, texto) {
  const bytes = codificar.encode(texto);
  // Reservar puede agrandar la memoria: el búfer se lee siempre después de cada llamada.
  const entrada = wasm.lw_reservar(bytes.length);
  new Uint8Array(wasm.memory.buffer, entrada, bytes.length).set(bytes);
  const salida = wasm[funcion](bytes.length);
  return descodificar.decode(new Uint8Array(wasm.memory.buffer, salida, wasm.lw_largo()));
}

function leerGuardado() {
  try { return localStorage.getItem(CLAVE) || ''; } catch { return ''; }
}

// La conversación (o página) de una ruta, sin la parte de la creación abierta.
const base = (ruta) => (ruta || '').split('/').slice(0, 3).join('/');

function pintar(html, sincronizarRuta) {
  // Lo que Rust no conoce de la página: secciones plegadas y desplazamiento del menú.
  const plegables = {};
  raiz.querySelectorAll('details[data-plegable]').forEach((d) => { plegables[d.dataset.plegable] = d.open; });
  const menuArriba = raiz.querySelector('.lateral-rollo')?.scrollTop || 0;

  raiz.innerHTML = html;
  const lx = raiz.firstElementChild;
  raiz.querySelectorAll('details[data-plegable]').forEach((d) => {
    if (d.dataset.plegable in plegables) d.open = plegables[d.dataset.plegable];
  });
  const menu = raiz.querySelector('.lateral-rollo');
  if (menu) menu.scrollTop = menuArriba;

  document.documentElement.dataset.tema = lx.dataset.tema;
  document.title = lx.dataset.titulo;

  const ruta = lx.dataset.ruta;
  if (sincronizarRuta && ruta && ruta !== (location.hash || '#/')) history.pushState(null, '', ruta);

  // Al cambiar de página se empieza arriba; dentro de una conversación se sigue el último mensaje.
  const rollo = raiz.querySelector('[data-rollo]');
  if (base(ruta) !== base(rutaPintada)) {
    document.getElementById('principal').scrollTop = 0;
    if (rollo) rollo.scrollTop = 0;
  } else if (rollo) {
    rollo.scrollTop = rollo.scrollHeight;
  }
  rutaPintada = ruta;

  const foco = raiz.querySelector('[data-foco]');
  if (foco) foco.focus({ preventScroll: true });
  try { localStorage.setItem(CLAVE, llamar('lw_guardado', '')); } catch { /* sin almacenamiento: sigue funcionando */ }
}

function evento(nombre, valor = '') {
  if (nombre === 'reiniciar') {
    try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
  }
  pintar(llamar('lw_evento', nombre + '\t' + valor.replace(/\s+/g, ' ')), nombre !== 'ruta');
}

window.addEventListener('hashchange', () => evento('ruta', location.hash));

raiz.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-ev]');
  if (boton) return evento(boton.dataset.ev, boton.dataset.val || '');
  // Un enlace a la página donde ya estás no cambia la dirección: se avisa a Rust igual
  // (por ejemplo, para cerrar el menú del celular).
  const enlace = e.target.closest('a[href^="#/"]');
  if (enlace && enlace.getAttribute('href') === (location.hash || '#/')) {
    e.preventDefault();
    evento('ruta', location.hash);
  }
});

raiz.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = e.target.elements.texto.value.trim();
  if (texto || e.target.dataset.form === 'buscar') evento(e.target.dataset.form, texto);
});

raiz.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.matches('textarea')) {
    e.preventDefault();
    e.target.form.requestSubmit();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const cerrar = raiz.querySelector('[data-cerrar]');
    if (cerrar) cerrar.click();
    else if (raiz.querySelector('.menu-abierto')) evento('menu');
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    location.hash = '#/buscar';
  }
});

try {
  const respuesta = await fetch('lutim_web.wasm');
  if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
  const { instance } = await WebAssembly.instantiate(await respuesta.arrayBuffer(), {});
  wasm = instance.exports;
  pintar(llamar('lw_iniciar', leerGuardado()), false);
  if (location.hash && location.hash !== '#/') evento('ruta', location.hash);
} catch (error) {
  console.error(error);
  raiz.innerHTML = '<p class="cargando" role="alert">No se pudo abrir la vista previa. Recarga la página; si sigue igual, tu navegador puede no admitir WebAssembly.</p>';
}
