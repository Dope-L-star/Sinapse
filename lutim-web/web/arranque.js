// Puente mínimo entre la página y el Wasm de Rust.
// Rust decide todo y devuelve HTML; aquí solo se cargan los bytes, se reenvían
// los eventos y se guarda el estado en este navegador para poder retomar.

const CLAVE = 'lutim-web-vista-previa-v1';
const raiz = document.getElementById('app');
const codificar = new TextEncoder();
const descodificar = new TextDecoder();
let wasm;

function llamar(funcion, texto) {
  const bytes = codificar.encode(texto);
  const entrada = wasm.lw_reservar(bytes.length);
  new Uint8Array(wasm.memory.buffer, entrada, bytes.length).set(bytes);
  const salida = wasm[funcion](bytes.length);
  return descodificar.decode(new Uint8Array(wasm.memory.buffer, salida, wasm.lw_largo()));
}

function leerGuardado() {
  try { return localStorage.getItem(CLAVE) || ''; } catch { return ''; }
}

function pintar(html) {
  raiz.innerHTML = html;
  const mensajes = document.getElementById('mensajes');
  if (raiz.querySelector('.creacion')) {
    // En pantallas estrechas la creación ocupa toda la vista: se muestra desde arriba.
    window.scrollTo(0, 0);
  } else if (mensajes && mensajes.lastElementChild) {
    mensajes.lastElementChild.scrollIntoView({ block: 'nearest' });
  }
  const foco = raiz.querySelector('[data-foco]');
  if (foco) foco.focus({ preventScroll: true });
  try { localStorage.setItem(CLAVE, llamar('lw_guardado', '')); } catch { /* sin almacenamiento: sigue funcionando */ }
}

function evento(nombre, valor = '') {
  if (nombre === 'reiniciar') {
    try { localStorage.removeItem(CLAVE); } catch { /* nada que borrar */ }
  }
  pintar(llamar('lw_evento', nombre + '\t' + valor.replace(/\s+/g, ' ')));
}

raiz.addEventListener('click', (e) => {
  const boton = e.target.closest('[data-ev]');
  if (boton) evento(boton.dataset.ev, boton.dataset.val || '');
});

raiz.addEventListener('submit', (e) => {
  e.preventDefault();
  const texto = e.target.elements.texto.value.trim();
  if (texto) evento(e.target.dataset.form, texto);
});

raiz.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.target.matches('textarea')) {
    e.preventDefault();
    e.target.form.requestSubmit();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && raiz.querySelector('.creacion')) evento('cerrar-panel');
});

try {
  const respuesta = await fetch('lutim_web.wasm');
  if (!respuesta.ok) throw new Error('HTTP ' + respuesta.status);
  const { instance } = await WebAssembly.instantiate(await respuesta.arrayBuffer(), {});
  wasm = instance.exports;
  pintar(llamar('lw_iniciar', leerGuardado()));
} catch (error) {
  console.error(error);
  raiz.innerHTML = '<p class="cargando" role="alert">No se pudo abrir la vista previa. Recarga la página; si sigue igual, tu navegador puede no admitir WebAssembly.</p>';
}
