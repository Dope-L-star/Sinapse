/* ---------- en qué es experta cada IA (con lo que dice el catálogo y su nombre) ---------- */
const EXP = [
  ['code', 'código', /coder|code|codestral|devstral|starcoder|qwen.?3.*coder|deepseek.?(v3|v4|coder)|claude|gpt-?5|kimi|glm|grok.*code/i],
  ['reason', 'pensar con calma antes de responder', /r1\b|reason|think|qwq|\bo[134]\b|o[34]-|gpt-oss|apodex|magistral|sonar-reasoning|deepseek-r/i],
  ['write', 'escribir y redactar', /claude|mistral|hermes|llama|gpt-?[45]|gemini.*pro|kimi|nova|command|gemma|writer|palmyra/i],
  ['fast', 'respuestas rápidas', /mini|nano|flash|lite|small|haiku|\b[1-9]b\b|instant|fast|mercury|tiny/i],
  ['vision', 'ver imágenes y PDF', null],
  ['long', 'textos muy largos', null],
  ['lang', 'español y otros idiomas', /qwen|aya|mistral|gemma|glm|deepseek|llama-4|gemini|command-a/i],
  ['math', 'matemáticas', /math|qwq|deepseek-r|\bo4\b|minerva|mathstral/i]
];
const EXP_LABEL = Object.fromEntries(EXP.map(([k, l]) => [k, l]));
/* v3.7 · en inglés la línea sale entera en inglés (antes: «Expert in código y think carefully…») */
const EXP_EN = { code:'code', reason:'thinking carefully before answering', write:'writing', fast:'quick answers', vision:'images and PDFs', long:'very long texts', lang:'Spanish and other languages', math:'math' };
function expertOf(m){
  if (!m) return { tags:[], line:'' };
  const hay = (m.id + ' ' + m.name + ' ' + (m.desc || '')).toLowerCase(), tags = [];
  EXP.forEach(([k, , re]) => {
    if (k === 'vision' ? m.vision : k === 'long' ? m.ctx >= 200000 : k === 'reason' ? (m.reasoning || re.test(hay)) : re.test(hay)) tags.push(k);
  });
  const en = LANG === 'en';
  if (!tags.length) return { tags, line:en ? 'General use' : 'Uso general' };          /* sin datos de especialidad: no inventamos una */
  const order = ['code', 'reason', 'vision', 'math', 'write', 'long', 'fast', 'lang'];
  tags.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const top = tags.slice(0, 2).map(k => (en ? EXP_EN : EXP_LABEL)[k]);
  return { tags, line:(en ? 'Expert in ' : 'Experta en ') + (top.length > 1 ? top[0] + (en ? ' and ' : ' y ') + top[1] : top[0]) };
}
/* ---------- encuesta: elige las IA que mejor te sirven ---------- */
const SURVEY = [
  { k:'uses', get q(){ return '¿Para qué vas a usar ' + BRAND() + '?'; }, sub:'Elige todas las que quieras.', multi:true, o:[['code', '💻', 'Programar'], ['write', '✍️', 'Escribir y redactar'], ['study', '📚', 'Estudiar y tareas'], ['ideas', '💡', 'Ideas y trabajo'], ['vision', '🖼️', 'Imágenes y PDF'], ['chat', '💬', 'Charlar']] },
  { k:'pace', q:'¿Qué prefieres?', o:[['fast', '⚡', 'Respuestas al instante'], ['mid', '⚖️', 'Equilibrio'], ['deep', '🧠', 'Que piense bien antes']] },
  { k:'lang', q:'¿En qué idioma vas a hablar más?', o:[['es', '🇨🇴', 'Español'], ['en', '🇺🇸', 'Inglés'], ['both', '🌎', 'Los dos']] },
  { k:'key', q:'¿Tienes cuenta de Puter?', sub:'Conecta tu versión pro de las IAs más usadas, como ChatGPT, Claude o Gemini.', o:[['pu', '✨', 'Sí, o quiero conectarla'], ['no', '🙅', 'No, por ahora no'], ['idk', '🤔', 'No sé qué es']] }
];
function surveyScore(m, s){
  if (!s || !s.a) return 0;
  const a = s.a, ex = expertOf(m).tags, has = k => ex.includes(k);
  let sc = 0;
  (a.uses || []).forEach(u => { if (u === 'code' && has('code')) sc += 30; if (u === 'write' && has('write')) sc += 18; if (u === 'study' && (has('reason') || has('long'))) sc += 14; if (u === 'ideas' && (has('write') || has('reason'))) sc += 10; if (u === 'vision' && has('vision')) sc += 30; if (u === 'chat' && (has('fast') || has('write'))) sc += 10; });
  if (a.pace === 'fast' && has('fast')) sc += 22; if (a.pace === 'fast' && has('reason')) sc -= 6;
  if (a.pace === 'deep' && has('reason')) sc += 22; if (a.pace === 'deep' && has('fast')) sc -= 8;
  if ((a.lang === 'es' || a.lang === 'both') && has('lang')) sc += 8;
  if (a.key === 'no' && /^pu:/.test(m.id)) sc -= 20;
  if (a.key === 'pu' && /^pu:/.test(m.id)) sc += 8;
  if (/^sz:/.test(m.id)) sc += 6;
  if (/apodex|gpt-5\.6-luna/i.test(m.id)) sc += 6;
  return sc;
}
function surveyPicks(list, s, n){ if (!s || !s.a || !list.length) return []; return list.filter(m => m.free || /^pu:/.test(m.id)).map(m => [m, surveyScore(m, s)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, n || 6).map(x => x[0].id); }
function surveyModal(done, opts){
  opts = opts || {};
  if ($('#svm')) return;
  const ans = Object.assign({ uses:[] }, (state.survey && state.survey.a) || {});
  let i = 0;
  const o = document.createElement('div'); o.id = 'svm'; o.className = 'szm';
  o.innerHTML = '<div class="tcard sv" role="dialog" aria-modal="true" aria-label="Encuesta"><div class="word">' + zWord('Synth') + '</div><div class="tn"></div><div class="tb"><h3></h3><p class="svsub"></p><div class="svo"></div></div><div class="tdots">' + SURVEY.map(() => '<i></i>').join('') + '</div><div class="tbtn"><button class="lnk" type="button" data-skip>' + (opts.first ? 'Ahora no' : 'Cerrar') + '</button><span style="flex:1"></span><button class="lnk" type="button" data-back>Atrás</button><button class="btn sm" type="button" data-next>Siguiente</button></div></div>';
  document.body.appendChild(o); requestAnimationFrame(() => o.classList.add('on'));
  const card = $('.tcard', o);
  card.animate([{ transform:'scale(.92) translateY(20px)', opacity:0, filter:'blur(8px)' }, { transform:'none', opacity:1, filter:'blur(0)' }], { duration:650, easing:'cubic-bezier(.22,1,.36,1)' });
  const show = (anim, dir) => {
    const s = SURVEY[i], last = i === SURVEY.length - 1;
    const set = () => {
      $('.tn', card).textContent = 'TUS IA · ' + (i + 1) + ' / ' + SURVEY.length;
      $('h3', card).textContent = s.q; $('.svsub', card).textContent = s.sub || ''; $('.svsub', card).style.display = s.sub ? '' : 'none';
      $('.svo', card).innerHTML = s.o.map(([v, e, l]) => { const on = s.multi ? (ans[s.k] || []).includes(v) : ans[s.k] === v; return '<button type="button" class="svb" data-v="' + v + '" aria-pressed="' + on + '"><span class="e">' + e + '</span><span>' + l + '</span></button>'; }).join('');
      $$('.tdots i', card).forEach((d, k) => d.classList.toggle('on', k === i));
      $('[data-back]', card).style.visibility = i ? 'visible' : 'hidden';
      $('[data-next]', card).textContent = last ? 'Ver mis IA' : 'Siguiente';
    };
    if (!anim){ set(); return; }
    swapDir($('.tb', card), dir || 1, set);
  };
  $('.svo', card).addEventListener('click', e => {
    const b = e.target.closest('.svb'); if (!b) return; const s = SURVEY[i], v = b.dataset.v;
    if (s.multi){ const L = ans[s.k] || (ans[s.k] = []); const j = L.indexOf(v); if (j > -1) L.splice(j, 1); else L.push(v); b.setAttribute('aria-pressed', String(j < 0)); }
    else { ans[s.k] = v; $$('.svb', card).forEach(x => x.setAttribute('aria-pressed', String(x === b))); setTimeout(() => { if (i < SURVEY.length - 1){ i++; show(true); } }, 260); }
  });
  const close = saved => { o.classList.remove('on'); setTimeout(() => o.remove(), 420); if (done) done(saved); };
  $('[data-skip]', card).addEventListener('click', () => close(false));
  $('[data-back]', card).addEventListener('click', () => { if (i > 0){ i--; show(true, -1); } });
  $('[data-next]', card).addEventListener('click', () => {
    if (i < SURVEY.length - 1){ i++; show(true); return; }
    state.survey = { a:ans, t:Date.now() }; save(); toast('¡Listo! Ya sé qué IA te van a servir más.'); close(true);
  });
  show(false);
}
