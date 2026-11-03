/* ---------- BETA: «Cuéntanos qué mejorar» (llega a Pulsem) ---------- */
function feedbackModal(){
  if ($('#szFb')) return;
  const o = document.createElement('div'); o.id = 'szFb'; o.className = 'szm';
  const C = [['idea', '💡', 'Una idea'], ['error', '🐞', 'Algo falló'], ['confuso', '🤔', 'No entendí algo'], ['otro', '💬', 'Otra cosa']];
  o.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Cuéntanos qué mejorar"><div class="word">' + zWord('Synth') + '</div><div class="tn">BETA · TU OPINIÓN</div><div class="tb"><h3>Cuéntanos qué mejorar</h3><p>Lo lee el equipo de SymphorIA. No hace falta saber de tecnología: escríbelo como se lo dirías a un amigo.</p></div>'
    + '<div class="fbc" role="radiogroup">' + C.map(([k, e, l], i) => '<button type="button" role="radio" data-c="' + k + '" aria-checked="' + (i === 0) + '"><span>' + e + '</span>' + l + '</button>').join('') + '</div>'
    + '<label class="fbt"><textarea maxlength="1000" rows="4" placeholder="Por ejemplo: no encontré dónde cambiar de IA…"></textarea></label>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Cancelar</button><button class="btn sm" type="button" data-send>Enviar</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  let cat = 'idea';
  const close = () => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); };
  $('[data-close]', o).addEventListener('click', close); o.addEventListener('pointerdown', e => { if (e.target === o) close(); });
  $$('[data-c]', o).forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; $$('[data-c]', o).forEach(x => x.setAttribute('aria-checked', String(x === b))); SND.tap(); }));
  setTimeout(() => $('textarea', o).focus(), 120);
  $('[data-send]', o).addEventListener('click', async e => {
    const t = $('textarea', o).value.trim(); if (t.length < 3){ toast('Cuéntanos un poquito más.'); return; }
    e.currentTarget.disabled = true;
    try{ await api('help', { method:'POST', body:{ action:'feedback', cat, text:t, page:telPage() }, keep:true }); close(); toast('¡Gracias! El equipo ya lo recibió. 💛'); SND.done(); }
    catch(er){ e.currentTarget.disabled = false; toast(er.message || 'No pude enviarlo. Intenta de nuevo.'); }
  });
}
const betaTx = k => t(k);   /* fuera de betaMk: adentro «t» es el botón */
onLang(() => document.querySelectorAll('.beta-tag').forEach(b => { b.title = betaTx('beta.title'); b.dataset.tip = betaTx('beta.tip'); }));
function betaMk(){
  const t = document.createElement('button'); t.type = 'button'; t.className = 'beta-tag'; t.textContent = 'BETA'; t.title = betaTx('beta.title'); t.dataset.tip = betaTx('beta.tip');
  t.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); feedbackModal(); });
  return t;
}
/* SymphorIA: el BETA va al lado del logo pero FUERA del enlace (antes a veces no se podía tocar) */
function betaTags(){
  if (isFlow()) return betaBot();
  const a = document.querySelector('#nav .logo'); if (!a || document.querySelector('#nav .beta-tag')) return;
  const w = document.createElement('div'); w.className = 'logow'; a.before(w); w.append(a, betaMk());
}
/* SynthFlow: el BETA va pegadito a la bolita de SynthonIA y la sigue si la mueves */
function betaBot(){
  const b = BOT.el; if (!b || !isFlow()) return;
  let t = document.getElementById('betaBot');
  if (!t){ t = betaMk(); t.id = 'betaBot'; t.classList.add('bb'); (b.classList.contains('inhead') ? b.parentNode : document.body).appendChild(t); }
  const put = () => {
    const r = b.getBoundingClientRect(); if (!b.isConnected || !t.isConnected || !r.width) return;
    const w = t.offsetWidth || 46, h = t.offsetHeight || 18;
    if (b.dataset.reactComponent === 'synthonia-avatar'){
      /* React owns both controls: keep BETA fixed to the avatar's real viewport box,
         even when the avatar sits beside the mobile logo. */
      t.style.position = 'fixed'; t.style.zIndex = '9599';
      /* v3.7 · en la cabecera del celular va a la DERECHA de la bolita (a la izquierda tapaba el logo «SynthFlow») */
      const candidate = b.classList.contains('inhead') || r.left - w - 10 < 8 ? r.right + 10 : r.left - w - 10;
      const left = Math.max(8, Math.min(innerWidth - w - 8, candidate));
      const top = Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - h / 2));
      t.style.left = left.toFixed(0) + 'px'; t.style.top = top.toFixed(0) + 'px'; t.style.visibility = 'visible';
      return;
    }
    if (b.classList.contains('inhead')){ t.style.position = 'absolute'; t.style.zIndex = '3'; t.style.left = (b.offsetLeft + b.offsetWidth + 8) + 'px'; t.style.top = (b.offsetTop + b.offsetHeight / 2 - t.offsetHeight / 2) + 'px'; return; }
    const left = r.left - w - 10 < 8 ? r.right + 10 : r.left - w - 10;
    t.style.left = left.toFixed(0) + 'px'; t.style.top = (r.top + r.height / 2 - h / 2) + 'px';
  };
  BOT.betaPut = put; put(); requestAnimationFrame(put); setTimeout(put, 700); setTimeout(put, 1600);
  if (!t._w){
    t._w = 1;
    const onResize = () => put(); addEventListener('resize', onResize);
    BOT.betaCleanup = () => { removeEventListener('resize', onResize); t._w = 0; };
    if (document.fonts) document.fonts.ready.then(put);
  }
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(betaTags, 400)); else setTimeout(betaTags, 400);
addEventListener('synthz-ready-bot', botMount);
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(botMount, 900)); else setTimeout(botMount, 900);
const BOTAPI = { anchor:fn => { BOT.anchor = fn; }, open:botOpen, close:botClose, mount:botMount, unmount:botReactUnmount, activate:botAvatarClick, say:botSay, sync:botSync, team:botTeam, chatOpen, chatClose, match:q => { const f = botMatch(q); return f ? BOT_FAQ.indexOf(f) : -1; }, get el(){ return BOT.el; } };
/* ---------- Guía: elegir cómo aprender (Asistida con SynthonIA o Lectura) ---------- */
function guideChooser(o = {}){
  if ($('#szGch')) return;
  const w = document.createElement('div'); w.id = 'szGch'; w.className = 'szm';
  w.innerHTML = '<div class="tcard" role="dialog" aria-modal="true" aria-label="Guía"><div class="word">' + zWord('Synth') + '</div><div class="tn">GUÍA</div><div class="tb"><h3>¿Cómo quieres aprender?</h3><p>' + esc(o.lead || 'Te muestro ' + (isFlow() ? 'SynthFlow' : 'SymphorIA') + ' como prefieras. Puedes volver aquí cuando quieras con el botón «Guía».') + '</p></div>'
    + '<div class="gch"><button type="button" class="gco a" data-g="a"><span class="gf">' + face('senalando', 54) + '</span><b>Asistida</b><small>SynthonIA te lo muestra con su manita, paso a paso: temas, IA recomendadas, comparar 2 y ' + (o.trial === false ? 'cómo conectar.' : 'tu primer chat con las IAs conectadas.') + '</small><em>Unos 2 minutos</em></button>'
    + '<button type="button" class="gco l" data-g="l"><span class="gf"><svg viewBox="0 0 48 48" width="54" height="54" aria-hidden="true"><path d="M8 11c6-2 12-1 16 3 4-4 10-5 16-3v26c-6-2-12-1-16 3-4-4-10-5-16-3z" fill="rgba(184,196,255,.12)" stroke="#b8c4ff" stroke-width="2" stroke-linejoin="round"/><path d="M24 14v26" stroke="#b8c4ff" stroke-width="2"/><path d="M12 18h7M12 23h7M29 18h7M29 23h7" stroke="#b8c4ff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></svg></span><b>Lectura</b><small>Una guía corta para leer a tu ritmo, con todo lo importante.</small><em>A tu ritmo</em></button></div>'
    + '<div class="tbtn" style="margin-top:14px"><button class="lnk" type="button" data-close>Ahora no</button></div></div>';
  document.body.appendChild(w); requestAnimationFrame(() => w.classList.add('on'));
  $('.tcard', w).animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:600, easing:'cubic-bezier(.22,1,.36,1)' });
  SND.blip('feliz');
  const close = then => { w.classList.remove('on'); setTimeout(() => w.remove(), 420); if (then) setTimeout(then, 260); };
  $('[data-close]', w).addEventListener('click', () => close(o.later));
  w.addEventListener('pointerdown', e => { if (e.target === w) close(o.later); });
  $$('[data-g]', w).forEach(b => b.addEventListener('click', () => close(b.dataset.g === 'a' ? o.asistida : o.lectura)));
  setTimeout(() => { const b = $('[data-g="a"]', w); if (b) b.focus(); }, 80);
}

/* ---------- bienvenida tras 12 horas: «Ya tengo el Flow» o «Soy nuevo, quiero aprender» ---------- */
const SEEN_KEY = 'synthz:lastSeen', AWAY_MS = 12 * 3600e3;
let lastSeen0 = 0; try{ lastSeen0 = +localStorage.getItem(SEEN_KEY) || 0; }catch(e){}
const markSeen = () => { try{ localStorage.setItem(SEEN_KEY, String(Date.now())); }catch(e){} };
markSeen(); setInterval(markSeen, 5 * 60e3);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') markSeen(); });
let welcomeShown = false;
function wasAway(){ let force = false; try{ force = new URLSearchParams(location.search).get('bienvenida') === '1'; }catch(e){} return force || (lastSeen0 > 0 && Date.now() - lastSeen0 >= AWAY_MS); }
/* v4.1 · esta pantallita es la ÚNICA puerta para volver a ver la portada (index.html):
   «Soy nuevo» guarda la decisión y abre la portada; «Ya tengo el Flow» la guarda y entra directo a SynthFlow.
   La decisión queda en este dispositivo y viaja con la cuenta (SZ.portada, core 25m). opts.from = 'logo' cuando
   alguien que ya entró toca el logo para volver a la portada. */
const portadaPick = v => { try{ window.SZ.portada.set(v); }catch(e){} };
function goPortada(){ const href = 'index.html?nuevo=1'; if (window.SZ && SZ.portalBack && !reduce && !root.classList.contains('noanim')) SZ.portalBack(href); else location.href = href; }
function welcomeBack(opts){
  opts = opts || {};
  if (welcomeShown || $('#szWelcome')){ if (opts.from === 'logo' && !$('#szWelcome')) welcomeShown = false; else return null; }
  welcomeShown = true;
  const onIndex = telPage() === 'index', logo = opts.from === 'logo';
  const who = ACC.ready ? accName() : '';
  const o = document.createElement('div'); o.id = 'szWelcome'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Bienvenida');
  o.innerHTML = '<div class="wbface">' + face('flow', 64) + '</div>'
    + '<div class="wbtx"><b>' + (logo ? '¿Ya tienes el Flow?' : who ? '¡Hola de nuevo! ¿Sigues siendo tú?' : '¡Hola! ¿Ya conoces ' + (isFlow() ? 'SynthFlow' : 'SymphorIA') + '?') + '</b><p>' + (logo ? 'La portada de SymphorIA es la bienvenida para quien llega nuevo. Si ya sabes usarlo, te quedas aquí; si eres nuevo, te la muestro.' : who ? 'La sesión de <em>' + esc(who) + '</em> está abierta en este dispositivo. Si eres nuevo, te muestro cómo funciona todo.' : 'Pasaron más de 12 horas. Si es tu primera vez, te muestro cómo funciona todo en un minuto.') + '</p></div>'
    + '<div class="wbbtn"><button type="button" class="btn sm flow" data-wb="flow">' + face('flow', 22, 'wbmini') + (who ? 'Ya tengo el Flow · continuar' : 'Ya tengo el Flow') + '</button><button type="button" class="btn sm ghost" data-wb="new">Soy nuevo, quiero aprender</button></div>'
    + '<button type="button" class="wbx" data-wb="x" aria-label="Cerrar">✕</button>';
  document.body.appendChild(o);
  requestAnimationFrame(() => requestAnimationFrame(() => o.classList.add('on')));
  const close = kind => {
    if (!o.isConnected) return;
    o.classList.remove('on'); o.classList.add('bye');
    if (kind === 'flow' && !reduce && !root.classList.contains('noanim')){ const r = $('.wbface', o).getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, ['#e6b65f', '#ffe2a8', '#c9566c'], 14); }
    setTimeout(() => o.remove(), 650);
  };
  o.addEventListener('click', e => {
    const b = e.target.closest('[data-wb]'); if (!b) return;
    const k = b.dataset.wb; close(k);
    if (k === 'new'){ portadaPick('nuevo'); if (!onIndex) setTimeout(goPortada, 420); else if (opts.learn) setTimeout(opts.learn, 420); }
    if (k === 'flow'){ portadaPick('app'); if (onIndex) setTimeout(() => portalOut('chat.html'), 420); else if (opts.flow) opts.flow(); }
  });
  addEventListener('keydown', function esc1(e){ if (e.key === 'Escape' && o.isConnected){ close('x'); removeEventListener('keydown', esc1); } });
  return o;
}

