/* ---------- v2.1 · «Buscar en internet»: la IA responde con información de hoy y te muestra sus fuentes ----------
   Se activa con el botón del globo, sola cuando la pregunta lo pide (hoy, precio, noticias…) o cuando el agente lo decide. */
const WEB_RX = /\b(hoy|ahora mismo|actualmente|actual(es)?|[uú]ltim[oa]s?|esta semana|este mes|este a[ñn]o|noticias?|precio|cu[aá]nto (cuesta|vale)|cotizaci[oó]n|d[oó]lar|clima|resultado|qui[eé]n gan[oó]|en vivo|202[5-9]|busca(r|me)? en (internet|google|la web)|seg[uú]n internet|fuentes?)\b/i;
let webOn = false;
const webBtn = $('#webBtn') || document.createElement('button');
if (!webBtn.isConnected){ webBtn.type = 'button'; webBtn.className = 'attach webb'; webBtn.id = 'webBtn'; webBtn.setAttribute('aria-pressed', 'false'); webBtn.setAttribute('aria-label', 'Buscar en internet'); webBtn.dataset.tip = 'Buscar en internet';
webBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/></svg>';
{ const ib = $('#imgBtn') || $('#attachBtn'); if (ib) ib.after(webBtn); } }
function setWeb(on){ webOn = !!on; webBtn.setAttribute('aria-pressed', String(webOn)); document.body.classList.toggle('webbing', webOn); if (webOn) toast('Buscar en internet: tu próximo mensaje se responde con información de hoy y sus fuentes.'); }
webBtn.addEventListener('click', () => { if (imgMode) setImgMode(false); setWeb(!webOn); });
const needsWeb = text => webOn || (SZ.CFG.autoWeb !== false && (WEB_RX.test(text) || WEB_RX_EN.test(text)));
/* v3.8 · también en inglés */
const WEB_RX_EN = /\b(today|right now|currently|latest|this (week|month|year)|news|price of|how much (is|does)|exchange rate|weather|who won|score|live|search (the web|online|google)|according to (the )?internet)\b/i;
/* v3.8 · la IA decide sola: si le falta un dato de hoy, en vez de inventar pide una búsqueda con [BUSCAR: …] y SynthFlow busca, lee y le vuelve a preguntar */
const webAskSys = () => 'Hoy es ' + new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + '. Tienes una herramienta de búsqueda en internet. Si para responder bien necesitas información actual o que no conoces con certeza (noticias, precios, resultados, clima, versiones o lanzamientos recientes, personas, empresas o hechos posteriores a lo que aprendiste), NO inventes ni digas que no tienes internet: responde ÚNICAMENTE con una línea exacta así: [BUSCAR: consulta corta para un buscador, en el idioma de la persona] y nada más. Si no hace falta buscar, responde normal sin mencionar esta herramienta.';
const WEB_Q_RX = /^\s*\[(?:BUSCAR|SEARCH)\s*:\s*([^\]\n]{2,200})\]?/i;
const CUTOFF_RX = /(no tengo acceso a (internet|la web|informaci[oó]n (en tiempo real|actual(izada)?)|datos (en tiempo real|actuales))|no puedo (navegar|buscar en internet|acceder a internet|consultar internet)|mi (conocimiento|informaci[oó]n|entrenamiento) (llega|est[aá] actualizad[oa]|se actualiz[oó]|tiene fecha de corte) hasta|fecha de corte de mi|as of my (last )?(knowledge|training)|knowledge cut-?off|i (don'?t|do not|can'?t|cannot) (have )?(access|browse|search)( to)? (the )?(internet|real-time|current|web))/i;
/* mientras llega la respuesta: ¿empieza como «[BUSCAR…»? entonces no se muestra (se queda «pensando») */
const webMaybe = t => { t = String(t || '').replace(/^\s+/, ''); return !t || /^\[(?:B(?:U(?:S(?:C(?:A(?:R)?)?)?)?)?|S(?:E(?:A(?:R(?:C(?:H)?)?)?)?)?)?$/i.test(t) || /^\[(BUSCAR|SEARCH)\b/i.test(t); };
function webCard(){
  const el = document.createElement('div'); el.className = 'agrun webrun';
  el.innerHTML = '<div class="ag-h"><span class="pxw">' + SZ.pixelGrid() + '</span><span class="ag-t"><b>Buscando en internet</b><small>Leo varias páginas para responderte con datos de hoy…</small></span></div>';
  /* v3.8 · con SynthFlow en React la búsqueda se ve como un radar (#41) y, al llegar, las fuentes aparecen como chips */
  const fx = document.createElement('div'); fx.className = 'fxhost';
  if (window.SZFx && window.SZFx.mount(fx, 'radar', { lang:SZ.lang(), modo:'web' })){ el.innerHTML = ''; el.classList.add('fxr'); el.appendChild(fx); el._fx = fx; el._px = { stop(){} }; return el; }
  el._px = SZ.pixelRun($('.pxw', el)); return el;
}
async function webSearch(q){
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'search', q:q.slice(0, 300), lang:SZ.lang() === 'en' ? 'en' : 'es' }) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(d.error || 'No pude buscar en internet ahora.'), { code:d.code, status:r.status });
  return d;
}
/* lo que le llega a la IA: tu mensaje + los resultados numerados (tú sigues viendo solo tu mensaje) */
function webAsk(text, R){
  const day = new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  /* v3.8 · además del resumen del buscador, va el texto que se leyó de las primeras páginas (cabe en ~9.000 letras) */
  return text + '\n\n---\nResultados de una búsqueda en internet hecha hoy, ' + day + (R.via === 'wikipedia' ? ' (en Wikipedia)' : R.via === 'noticias' ? ' (noticias)' : '') + '. Responde con estos datos, que son más nuevos que lo que sabes; cita cada dato con su número entre corchetes, por ejemplo [1]; si los resultados no lo dicen, dilo, y no inventes nada que no esté aquí:\n'
    + R.results.map((x, i) => '[' + (i + 1) + '] ' + x.t + ' — ' + x.u + '\n' + String(x.s || '').slice(0, 320) + (x.c ? '\nLo que dice la página:\n' + x.c.slice(0, 1900) : '')).join('\n\n');
}
/* busca antes de enviar; si falla, se envía igual (sin fuentes) */
async function webPrep(msg, text){
  const card = webCard(); lane.appendChild(card); jump();
  try{
    const R = await webSearch(text);
    if (R.results && R.results.length){
      msg.ask = webAsk(msg.ask || text, R); msg.sources = R.results.map(x => ({ t:x.t, u:x.u })); msg.web = R.via;
      if (card._fx){ const host = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } }, hs = [...new Set(R.results.map(x => host(x.u)).filter(Boolean))];
        window.SZFx.mount(card._fx, 'radar', { lang:SZ.lang(), modo:'web', hallazgos:hs }); await new Promise(r => setTimeout(r, !SZ.CFG.anim ? 0 : 900)); }
    }
    else toast('No encontré nada en internet para eso; te respondo con lo que sabe la IA.');
  }catch(e){ toast(e.message + (e.code === 's_guest' ? '' : ' Te respondo con lo que sabe la IA.')); if (e.code === 's_guest') setTimeout(() => SZ.guestGate({ mode:'signup' }), 400); }
  finally{ try{ card._px.stop(); }catch(e){} card.remove(); if (webOn) setWeb(false); }
}
const hostOf = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } };
/* debajo de tu mensaje: «Busqué en internet · 5 fuentes ▸» */
function sourcesEl(m){
  const el = document.createElement('div'); el.className = 'agsum websum';
  el.innerHTML = '<button type="button" class="ag-row" aria-expanded="false"><span class="ag-ic">' + webBtn.innerHTML + '</span><span class="ag-tx">' + (m.web === 'wikipedia' ? 'Busqué en Wikipedia' : 'Busqué en internet') + ' · <b>' + m.sources.length + (m.sources.length === 1 ? ' fuente' : ' fuentes') + '</b></span><svg class="ag-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="ag-d" hidden><ol class="srcl"></ol></div>';
  const ol = $('.srcl', el);
  m.sources.forEach((x, i) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = x.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.innerHTML = '<b></b><small></small>'; $('b', a).textContent = '[' + (i + 1) + '] ' + (x.t || hostOf(x.u)); $('small', a).textContent = hostOf(x.u); li.appendChild(a); ol.appendChild(li); });
  const row = $('.ag-row', el), d = $('.ag-d', el);
  row.addEventListener('click', () => { const on = d.hidden; d.hidden = !on; row.setAttribute('aria-expanded', String(on)); el.classList.toggle('open', on); });
  return el;
}
/* en la respuesta, cada [1], [2]… se vuelve un enlace a su fuente */
function citeLinks(body, sources){
  if (!body || !sources || !sources.length) return;
  const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, { acceptNode:n => n.parentElement && n.parentElement.closest('pre, code, a, .fcard') ? NodeFilter.FILTER_REJECT : /\[\d{1,2}\]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
  const L = []; while (w.nextNode()) L.push(w.currentNode);
  L.forEach(n => {
    const frag = document.createDocumentFragment(); let last = 0; const s = n.nodeValue;
    s.replace(/\[(\d{1,2})\]/g, (all, num, at) => { const x = sources[+num - 1]; if (!x) return all; frag.appendChild(document.createTextNode(s.slice(last, at))); const a = document.createElement('a'); a.className = 'cite'; a.href = x.u; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = (x.t || '') + ' · ' + hostOf(x.u); a.textContent = num; frag.appendChild(a); last = at + all.length; return all; });
    if (last){ frag.appendChild(document.createTextNode(s.slice(last))); n.replaceWith(frag); }
  });
}
