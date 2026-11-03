/* ---------- v2.1 · «Buscar en internet»: la IA responde con información de hoy y te muestra sus fuentes ----------
   Se activa con el botón del globo, sola cuando la pregunta lo pide (hoy, precio, noticias…) o cuando el agente lo decide. */
/* v4.2 · REGLA FIJA (pedido de Sammuel, 3 nov: «las IAs buscan porque sí y porque no, ESO NO PUEDE PASAR»).
   Ya no decide la IA ni el azar: la misma pregunta da SIEMPRE la misma decisión, con cualquier IA, en Comparar y en A.L.I.A.S.
   · Se busca: si lo pides («busca en internet», «con fuentes», «investiga»), o si preguntas algo que cambia con el tiempo
     (noticias, precios, cotizaciones, clima, resultados, horarios, «hoy», «esta semana», lo más reciente…).
   · No se busca: charla, opinión, código, tareas, explicaciones generales, escribir o crear algo.
   · Tú mandas: en «+» puedes forzar «Buscar en internet» o «No buscar» para el próximo mensaje, y en Ajustes apagar la búsqueda sola.
   La misma regla está en api/_web-regla.js (servidor, A.L.I.A.S.); t/web/regla.test.mjs revisa que las dos digan lo mismo. */
function webRule(text){
  let s = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/```/.test(s) || (s.split('\n').filter(l => /[;{}]\s*$|^\s*(def|function|const|let|var|import|class|return|if|for|while|<\w+)/.test(l)).length >= 3)) return { go:false, why:'codigo' };
  /* frases que nombran la conversación o saludan no cuentan («tu última respuesta», «¿cómo estás hoy?») */
  s = s.replace(/\b(tu|la|el|lo|mi|su) (ultim[oa]|anterior) (respuesta|mensaje|parrafo|linea|punto|pregunta|version que (me )?diste)\b|\blo ultimo que (dijiste|escribiste)\b|\b(your|the|my) (last|latest|previous) (answer|message|reply|paragraph|line|point)\b/g, ' ')
       .replace(/\b(como|que tal) (estas|te va|andas|amaneciste|te sientes)\b[^?.!]*|\bhow (are|r) (you|u)\b[^?.!]*|\bhow('s| is) (your|it going)\b[^?.!]*/g, ' ');
  for (const [why, rx] of WEB_RULES) if (rx.test(s)) return { go:true, why };
  return { go:false, why:'general' };
}
const WEB_RULES = [
  ['pedido', /\b(busca(r|me|lo)?|buscame|investiga(r|me)?|averigua(r|me)?)\b[^.?!]{0,40}\b(en )?(internet|google|la web|linea|online)\b|\b(investiga|averigua)\b|\bcon (sus )?fuentes\b|\b(dame|pasame|necesito|quiero) (las )?(fuentes|links?|enlaces?)\b|\b(pagina|sitio|web) oficial\b|\bsegun internet\b|\b(search|look up|google)\b[^.?!]{0,30}\b(web|online|internet|it)\b|\bwith sources\b|\b(find|give) me (the )?(sources|links)\b|\bofficial (site|website|page)\b/],
  ['hoy', /\b(noticias?|titulares|ultima hora|que (paso|esta pasando|ha pasado)|hoy en dia no|hoy|ayer|esta semana|este mes|este ano|ahora mismo|en este momento|actualmente|en vivo|news|headlines|breaking|what('s| is) happening|today|yesterday|this (week|month|year)|right now|currently|live)\b/],
  ['reciente', /\b(lo mas (nuevo|reciente)|mas recientes?|recientes?|ultim[oa]s? (version|versiones|modelo|modelos|actualizacion|novedades?|lanzamientos?|estrenos?|episodios?|temporadas?)|novedades|estrenos?|latest|newest|most recent|recent(ly)?|new release)\b/],
  ['precio', /\b(precios?|cuanto (cuesta|vale|sale|cobra)|cotizacion|tipo de cambio|a como (esta|va)|dolar|dolares|euros?|bitcoin|criptos?|acciones de|bolsa de valores|tarifa|prices?|how much (is|does|do|are)|cost of|exchange rate|stock price|crypto)\b/],
  ['evento', /\b(clima|pronostico|temperatura (en|de hoy)|va a llover|quien gano|ganador(es)? de|resultados? (del|de la|de los|de las) (partido|juego|elecciones?|sorteo|loteria|carrera|final|mundial)|marcador|tabla de posiciones|elecciones|weather|forecast|who won|winner of|score of|standings|election results?)\b/],
  ['lugar', /\b(horarios? de|a que hora (abre|cierra)|esta abierto|direccion de|telefono de|donde queda|como llego a|opening hours|is it open|address of|phone number of|how do i get to)\b/]
];
let webMode = 'auto';   /* 'auto' (sigue la regla) · 'on' (busca sí o sí) · 'off' (no busca); vale para el próximo mensaje */
const webBtn = $('#webBtn') || document.createElement('button');
if (!webBtn.isConnected){ webBtn.type = 'button'; webBtn.className = 'attach webb'; webBtn.id = 'webBtn'; webBtn.setAttribute('aria-pressed', 'false'); webBtn.setAttribute('aria-label', 'Buscar en internet'); webBtn.dataset.tip = 'Buscar en internet';
webBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/></svg>';
{ const ib = $('#imgBtn') || $('#attachBtn'); if (ib) ib.after(webBtn); } }
function setWebMode(m, quiet){
  webMode = m === 'on' || m === 'off' ? m : 'auto';
  webBtn.setAttribute('aria-pressed', String(webMode === 'on')); document.body.classList.toggle('webbing', webMode === 'on'); document.body.classList.toggle('nowebbing', webMode === 'off');
  if (quiet) return;
  if (webMode === 'on') toast(SZ.lang() === 'en' ? 'Search the web: your next message is answered with today\'s information and its sources.' : 'Buscar en internet: tu próximo mensaje se responde con información de hoy y sus fuentes.');
  if (webMode === 'off') toast(SZ.lang() === 'en' ? 'No web search: your next message is answered only with what the AI knows.' : 'Sin internet: tu próximo mensaje se responde solo con lo que sabe la IA.');
}
function setWeb(on){ setWebMode(on ? 'on' : 'auto'); }
webBtn.addEventListener('click', () => { if (imgMode) setImgMode(false); setWebMode(webMode === 'on' ? 'auto' : 'on'); });
/* la decisión para un mensaje: qué se hace y por qué (se guarda en el mensaje para mostrarlo) */
function webDecide(text){
  if (webMode === 'on') return { go:true, why:'tu' };
  if (webMode === 'off') return { go:false, why:'apagado' };
  if (SZ.CFG.autoWeb === false) return { go:false, why:'ajustes' };
  return webRule(text);
}
const needsWeb = text => webDecide(text).go;
/* al enviar: se toma la decisión UNA vez, se anota en tu mensaje y lo que forzaste vuelve a «automático» */
function webTake(text){ const d = webDecide(text); if (webMode !== 'auto') setWebMode('auto', true); return d; }
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
async function webPrep(msg, text, why){
  const card = webCard(); lane.appendChild(card); jump();
  try{
    const R = await webSearch(text);
    if (R.results && R.results.length){
      msg.ask = webAsk(msg.ask || text, R); msg.sources = R.results.map(x => ({ t:x.t, u:x.u })); msg.web = R.via; if (why) msg.webWhy = why;
      if (card._fx){ const host = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } }, hs = [...new Set(R.results.map(x => host(x.u)).filter(Boolean))];
        window.SZFx.mount(card._fx, 'radar', { lang:SZ.lang(), modo:'web', hallazgos:hs }); await new Promise(r => setTimeout(r, !SZ.CFG.anim ? 0 : 900)); }
    }
    else toast('No encontré nada en internet para eso; te respondo con lo que sabe la IA.');
  }catch(e){ toast(e.message + (e.code === 's_guest' ? '' : ' Te respondo con lo que sabe la IA.')); if (e.code === 's_guest') setTimeout(() => SZ.guestGate({ mode:'signup' }), 400); }
  finally{ try{ card._px.stop(); }catch(e){} card.remove(); }
}
const hostOf = u => { try{ return new URL(u).hostname.replace(/^www\./, ''); }catch(e){ return ''; } };
/* v4.2 · por qué se buscó, dicho claro (y en el idioma de la página) */
const WEB_WHY = { es:{ tu:'porque lo pediste', pedido:'porque lo pediste', hoy:'porque preguntaste por algo de hoy', reciente:'porque preguntaste por algo reciente', precio:'porque los precios cambian', evento:'porque preguntaste por un resultado o el clima', lugar:'porque preguntaste por un lugar u horario' },
  en:{ tu:'because you asked', pedido:'because you asked', hoy:'because you asked about something current', reciente:'because you asked about something recent', precio:'because prices change', evento:'because you asked about a result or the weather', lugar:'because you asked about a place or opening hours' } };
function webSaid(m){
  const en = SZ.lang() === 'en', n = m.sources.length, why = (WEB_WHY[en ? 'en' : 'es'] || {})[m.webWhy];
  return (en ? (m.web === 'wikipedia' ? 'Searched Wikipedia' : 'Searched the web') : (m.web === 'wikipedia' ? 'Busqué en Wikipedia' : 'Busqué en internet')) + (why ? ' ' + why : '') + ' · <b>' + n + (en ? (n === 1 ? ' source' : ' sources') : (n === 1 ? ' fuente' : ' fuentes')) + '</b>';
}
/* debajo de tu mensaje: «Busqué en internet · 5 fuentes ▸» */
function sourcesEl(m){
  const el = document.createElement('div'); el.className = 'agsum websum';
  el.innerHTML = '<button type="button" class="ag-row" aria-expanded="false"><span class="ag-ic">' + webBtn.innerHTML + '</span><span class="ag-tx">' + webSaid(m) + '</span><svg class="ag-c" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg></button><div class="ag-d" hidden><ol class="srcl"></ol></div>';
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
