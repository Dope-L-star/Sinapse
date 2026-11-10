
/* ===== v2.4 · Pulsem como un tablero común: menú a la izquierda y una sección a la vez ===== */
(() => {
const nav = document.getElementById('dNav'); if (!nav) return;
const I = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const V = [
  ['res', 'Resumen', 'Cómo está Sinapse ahora mismo: salud, quién está en línea, dificultades y carga.', I('<path d="M4 13h4l2-5 4 10 2-5h4"/>'), null],
  ['keys', 'Llaves', 'Las llaves gratis que comparten las IAs conectadas, y las tuyas.', I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M15 8l2 2"/>'), null],
  ['set', 'Ajustes', 'Tope diario, imágenes, cuentas y aviso de mantenimiento.', I('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>'), null],
  ['fb', 'Comentarios', 'Lo que escriben en «Cuéntanos qué mejorar».', I('<path d="M5 5h14v10H9l-4 4z"/>'), 'fN'],
  ['help', 'Ayuda', 'Pedidos de ayuda de los Synthers.', I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5M12 17h.01"/>'), 'hN']];
nav.innerHTML = '<p class="dn-l">Pulsem</p>' + V.map(([k, l, , ic]) => '<button type="button" class="dn-i" data-v="' + k + '">' + ic + '<span>' + l + '</span><i class="dn-b" data-b="' + k + '" hidden></i></button>').join('')
  + '<a class="dn-i dn-x" href="chat.html">' + I('<path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4V7a2 2 0 0 1 2-2z"/>') + '<span>Ir a Sonyx</span></a>';
let cur = 'res';
function show(k, quiet){
  if (!V.some(v => v[0] === k)) k = 'res';
  cur = k; try{ localStorage.setItem('synthz:pulsemView', k); }catch(e){}
  document.querySelectorAll('#app [data-view]').forEach(s => { s.hidden = s.dataset.view !== k; });
  nav.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-current', String(b.dataset.v === k)));
  const v = V.find(x => x[0] === k); document.getElementById('dTitle').textContent = v[1]; document.getElementById('dSub').textContent = v[2];
  if (!quiet) window.scrollTo({ top:0, behavior:'smooth' });
}
nav.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) show(b.dataset.v); });
let k0 = 'res'; try{ k0 = localStorage.getItem('synthz:pulsemView') || 'res'; }catch(e){} show(k0, true);
/* los numeritos del menú salen de lo que ya dice cada sección (comentarios nuevos, ayuda esperando, dificultades) */
function badges(){
  V.forEach(([k, , , , src]) => { const b = nav.querySelector('[data-b="' + k + '"]'), el = src && document.getElementById(src); if (!b) return; const n = el ? parseInt(el.textContent, 10) || 0 : 0; b.hidden = !n; b.textContent = n; });
  const t = document.getElementById('tSum'), br = nav.querySelector('[data-b="res"]'), n = t ? parseInt(t.textContent, 10) || 0 : 0; if (br){ br.hidden = !n; br.textContent = n; br.classList.add('warn'); }
}
{ const mo = new MutationObserver(badges); ['fN', 'hN', 'tSum'].forEach(id => { const el = document.getElementById(id); if (el) mo.observe(el, { subtree:true, childList:true, characterData:true }); }); badges(); }
})();
