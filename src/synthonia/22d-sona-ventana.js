/* =====================================================================
   v4.6 · La ventanita de Sona, como una compañera (estilo «compañero» de Grok, con la ropa de la portada)
   Arriba un escenario con SU mismo dibujo de la portada (la bola de vidrio con ojos cian y las manitas flotantes), grande, con el pentagrama
   de la marca detrás; ella reacciona: piensa con el dedo en la barbilla, se inclina a escucharte cuando escribes, señala, celebra y mueve
   la boca (ondas naranjas) cuando habla. Abajo la charla en burbujas de vidrio, sugerencias que se deslizan y una píldora flotante
   para escribir con micrófono (el dictado del navegador: toca y habla, y el navegador pide el permiso, igual que en el chat).
   ===================================================================== */
const T = (es, en) => B.LANG === 'en' ? en : es;
/* la cara → qué pose del cuerpo (las de SPOSE en 20-synthonia-carita-svg-expresion.js) */
const SONA_POSE = { senalando:'senala', pensando:'piensa', celebrando:'celebra', sorprendida:'sorpresa', escuchando:'escucha', confundida:'piensa', presenta:'presenta' };

/* el pentagrama de la marca, ondulado, detrás de ella (como la cinta de la portada) */
function sonaRibbon(){
  const C = ['#7B3FF2', '#FF3D9A', '#FF7A45', '#FFC857', '#3DE0FF'];
  return '<svg class="bs-rb" viewBox="0 0 400 270" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="bsFade" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".18" stop-color="#fff"/><stop offset=".82" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="bsMask"><rect width="400" height="270" fill="url(#bsFade)"/></mask></defs><g mask="url(#bsMask)" fill="none" stroke-linecap="round">'
    + C.map((c, i) => '<path class="bs-l" style="--i:' + i + '" d="M-20 ' + (214 + i * 5.2) + ' C 70 ' + (250 + i * 5) + ', 190 ' + (150 + i * 4.6) + ', 420 ' + (128 + i * 5) + '" stroke="' + c + '" stroke-width="4.2"/>').join('')
    + '</g></svg>';
}
const SONA_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SONA_SEND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';

/* el marcador del escenario de ella (se llama al abrir) */
function sonaPanelHtml(){
  return '<div class="bstage" aria-hidden="true"><i class="bs-bg"></i>' + sonaRibbon() + '<i class="bs-sp a"></i><i class="bs-sp b"></i><i class="bs-sp c"></i><i class="bs-base"></i><div class="bsc"></div></div>'
    + '<div class="bh"><div class="bnm"><b>' + SONA.bot + '</b><small><i></i><span class="bst">' + T('Siempre disponible', 'Always here') + '</span></small></div><span class="bal" title="' + T('Versión ALFA', 'ALPHA version') + '">' + T('ALFA', 'ALPHA') + '</span>'
    + '<button type="button" class="bx" data-b="min" aria-label="' + T('Cerrar', 'Close') + '">×</button></div>'
    + '<div class="btabs" hidden><button type="button" data-bt="chat" aria-selected="true">' + T('Pregúntame', 'Ask me') + '</button><button type="button" data-bt="inbox" aria-selected="false">' + T('Bandeja', 'Inbox') + ' <em class="bn"></em></button></div>'
    + '<div class="bl" aria-live="polite"></div><div class="bq"></div>'
    + '<form class="bin"><button type="button" class="bmic" data-b="mic" aria-label="' + T('Hablarle a Sona', 'Talk to Sona') + '" hidden>' + SONA_MIC + '</button>'
    + '<input type="text" maxlength="600" placeholder="' + T('Pregúntame lo que quieras…', 'Ask me anything…') + '" aria-label="' + T('Pregúntale a Sona', 'Ask Sona') + '" autocomplete="off">'
    + '<button type="submit" class="bs" aria-label="' + T('Enviar', 'Send') + '">' + SONA_SEND + '</button></form>'
    + '<div class="bfoot"><button type="button" class="lnk" data-b="team">' + T('Hablar con el equipo', 'Talk to the team') + '</button><button type="button" class="lnk" data-b="fb">' + T('Cuéntanos qué mejorar', 'Tell us what to improve') + '</button><button type="button" class="lnk" data-b="hide">' + T('Esconder', 'Hide') + '</button></div>';
}

/* ella en el escenario: cara + pose. Las poses con gesto vuelven solas a descansar */
function botStage(mood, pose, hold){
  const P = BOT.panel, host = P && $('.bsc', P); if (!host || typeof synSet !== 'function') return;
  const m = FACE[mood] ? mood : 'feliz', p = pose && SPOSE[pose] ? pose : (SONA_POSE[m] || 'idle');
  try{ synSet(host, m, p); }catch(e){ return; }
  BOT.stageMood = m;
  clearTimeout(BOT._pt);
  if (p !== 'idle' && !hold) BOT._pt = setTimeout(() => { if (BOT.panel && !BOT.think && BOT.stageKeep !== 'listen') try{ synSet(host, m === 'senalando' ? 'feliz' : m, 'idle'); }catch(e){} }, p === 'senala' ? 4200 : 2800);
}
/* el letrerito de estado (como en Grok): disponible, pensando, hablando, escuchándote */
function botStatus(k){
  const P = BOT.panel, el = P && $('.bst', P); if (!el) return;
  const S = { idle:T('Siempre disponible', 'Always here'), think:T('Pensando…', 'Thinking…'), talk:T('Hablando…', 'Talking…'), listen:T('Escuchándote…', 'Listening…') };
  el.textContent = S[k] || S.idle; P.dataset.state = k || 'idle';
}
/* la cabeza del escenario, para que mueva las ondas de la boca mientras escribe su respuesta */
const botStageHead = () => { const P = BOT.panel; return P ? $('.bsc .syb-hsvg', P) : null; };

/* ---------- el micrófono: el dictado del navegador (gratis). Como en el chat: toca y habla, el navegador pide el permiso; siempre disponible ---------- */
const sonaSR = () => { try{ return window.SpeechRecognition || window.webkitSpeechRecognition || null; }catch(e){ return null; } };
const sonaMicOk = () => !!sonaSR();
function botMicStop(){ const r = BOT.rec; BOT.rec = null; if (r) try{ r.stop(); }catch(e){} const P = BOT.panel; if (P){ const b = $('.bmic', P); if (b){ b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); } } BOT.stageKeep = ''; if (BOT.panel && !BOT.think) { botStatus('idle'); botStage(BOT.stageMood || 'feliz', 'idle'); } }
function botMic(){
  const P = BOT.panel; if (!P || !sonaMicOk()) return;
  if (BOT.rec) return botMicStop();
  const r = new (sonaSR())(), inp = $('.bin input', P), mic = $('.bmic', P); let got = '';
  r.lang = B.LANG === 'en' ? 'en-US' : ((navigator.languages || []).find(x => x && /^es/i.test(x)) || 'es-ES'); r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  r.onresult = e => { got = ''; for (let i = 0; i < e.results.length; i++) got += e.results[i][0].transcript; inp.value = got; };
  r.onerror = e => { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')){ botSay(T('No me dejaron usar el micrófono. Puedes permitirlo en el candadito de la barra de direcciones, o escribirme aquí.', 'I wasn\'t allowed to use the microphone. You can allow it from the lock icon in the address bar, or just type to me here.'), 'disculpa'); } };
  r.onend = () => { const wasMine = BOT.rec === r; botMicStop(); const v = inp.value.trim(); if (wasMine && v){ inp.value = ''; BOT.mode === 'team' || BOT.mode === 'reply' ? botTeamSay(v) : botAsk(v); } };
  try{ r.start(); }catch(e){ return botSay(T('No pude encender el micrófono ahora. Inténtalo otra vez o escríbeme aquí.', 'I couldn\'t turn the microphone on just now. Try again or just type to me here.'), 'disculpa'); }
  BOT.rec = r; mic.classList.add('on'); mic.setAttribute('aria-pressed', 'true'); BOT.stageKeep = 'listen'; botStatus('listen'); botStage('escuchando', 'escucha', true);
  clearTimeout(BOT._mt); BOT._mt = setTimeout(() => { if (BOT.rec === r) botMicStop(); }, 20000);
}
