/* ---------- comentarios de la beta ---------- */
let ffilt = 'nuevo';
const FCAT = { idea:'💡 Idea', error:'🐞 Algo falló', confuso:'🤔 No entendió algo', otro:'💬 Otro' };
function renderFeedback(){
  const F = P.feedback || [], c = k => F.filter(x => k === 'todos' || x.status === k).length;
  $('#fN').textContent = c('nuevo') + ' nuevos';
  $('#fChips').innerHTML = [['nuevo', 'Nuevos'], ['visto', 'Vistos'], ['resuelto', 'Resueltos'], ['todos', 'Todos']].map(([k, l]) => '<button type="button" data-ff="' + k + '" aria-pressed="' + (ffilt === k) + '">' + l + '<i>' + c(k) + '</i></button>').join('');
  const L = F.filter(x => ffilt === 'todos' || x.status === ffilt);
  $('#fList').innerHTML = L.length ? L.map((x, i) => '<div class="row" style="--i:' + i + '"><span class="av r-' + rc(x.rank) + '">' + ini(x.who) + '</span><div class="tx"><b>' + esc(FCAT[x.cat] || x.cat) + ' · ' + esc(x.who) + '</b><small style="white-space:normal">' + esc(x.text) + '</small><small>' + esc(PAGES[x.page] || x.page || '') + ' · ' + ago(x.t) + (x.by ? ' · ' + esc(x.status) + ' por ' + esc(x.by) : '') + '</small></div><div class="tags">' + ['visto', 'resuelto'].filter(s => s !== x.status).map(s => '<button class="mini' + (s === 'resuelto' ? ' gold' : '') + '" type="button" data-fs="' + s + '" data-id="' + esc(x.id) + '">' + (s === 'visto' ? 'Visto' : 'Resuelto ✓') + '</button>').join('') + (x.sub ? '<button class="mini" type="button" data-reach="' + esc(x.sub) + '" data-nm="' + esc(x.who) + '">Responder</button>' : '') + '</div></div>').join('') : '<div class="empty">Nada por aquí. ✨</div>';
}
$('#fChips').addEventListener('click', e => { const b = e.target.closest('[data-ff]'); if (!b) return; ffilt = b.dataset.ff; renderFeedback(); });
$('#fList').addEventListener('click', async e => { const b = e.target.closest('[data-fs]'); if (!b) return; b.disabled = true; try{ const d = await api('help', { method:'POST', body:{ action:'fbset', id:b.dataset.id, status:b.dataset.fs }, keep:true }); const i = P.feedback.findIndex(x => x.id === d.item.id); if (i > -1) P.feedback[i] = d.item; renderFeedback(); toast('Marcado como ' + d.item.status + '.'); }catch(er){ b.disabled = false; toast(er.message); } });

/* ---------- pintar todo ---------- */
/* v2.0 · ALERTA: un proveedor pidió pago o quitó lo gratis */
function renderAlerts(){
  let b = $('#pAlert'); const L = P.alerts || [];
  if (!L.length){ if (b) b.remove(); return; }
  if (!b){ b = document.createElement('div'); b.id = 'pAlert'; b.className = 'card palert'; const m = $('main') || document.body; m.insertBefore(b, m.firstChild); }
  b.innerHTML = '<b>⚠ Alerta de las IAs</b><p>' + L.map(a => '<strong>' + esc(a.name) + '</strong> pidió pago o cambió su plan gratis' + (a.t ? ' (' + ago(a.t) + ')' : '') + (a.msg ? ': «' + esc(a.msg) + '»' : '')).join('<br>') + '</p><p class="cnote">Sinapse ya pausó esas llaves: nunca se paga nada. Revisa la cuenta del proveedor y pulsa «Probar» en la llave cuando lo arregles; si vuelve a funcionar, la alerta se quita sola.</p>';
}
function render(){
  renderAlerts();
  renderHealth(); renderOnline(); renderTrouble(); renderLoad(); renderKeys(); renderHelp(); renderFeedback();
  if (!booted){ booted = true; renderMyKeys(); renderSettings(); $('#kMine').textContent = P.rank === 'Symmetrix' ? 'Puedes agregar tus llaves y probarlas. Ver todo, sí; cambiar ajustes, solo Prime y ZFlow.' : 'Cada cuenta del equipo agrega las suyas. Todas se juntan y se comparten con todos, sin que nadie las vea.';
    const cards = $$('.card'); cards.forEach((c, i) => setTimeout(() => c.classList.add('in'), SZ.reduce ? 0 : 80 + i * 90)); }
  $('#pLive').classList.remove('off'); $('#pLiveT').textContent = 'en vivo · ahora';
}
load();
})();

