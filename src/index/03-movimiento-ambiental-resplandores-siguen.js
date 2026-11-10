/* ---------- movimiento ambiental: resplandores que siguen al mouse y cinta continua ---------- */
const blobs = $$('#aurora i'), bf = [[40, 40], [-50, -30], [30, 20], [-30, 25]];
let mxT = 0, myT = 0, mx = 0, my = 0, tx = 0, setW = 0, lastT = performance.now();
const track = $('#track');
/* v2.9: la cinta de nombres solo se mueve mientras se ve; fuera de la pantalla el ciclo se detiene del todo */
let trackOn = true, loopOn = false;
const measure = () => { setW = track.scrollWidth / 4; };
addEventListener('pointermove', e => { mxT = e.clientX / innerWidth - .5; myT = e.clientY / innerHeight - .5; }, { passive:true });
const wakeLoop = () => { if (!loopOn && trackOn && !document.hidden){ loopOn = true; lastT = performance.now(); requestAnimationFrame(loop); } };
if ('IntersectionObserver' in window) new IntersectionObserver(es => { trackOn = es[0].isIntersecting; wakeLoop(); }).observe(track);
document.addEventListener('visibilitychange', wakeLoop);
function loop(now){
  if (!trackOn || document.hidden){ loopOn = false; return; }
  loopOn = true; requestAnimationFrame(loop);
  const dt = Math.min(3, (now - lastT) / 16.67 || 1); lastT = now;
  const k = 1 - Math.pow(1 - .05, dt); mx += (mxT - mx) * k; my += (myT - my) * k;
  if (!reduce && setW > 0){ tx -= .55 * dt; if (tx <= -setW) tx += setW; track.style.transform = 'translate3d(' + tx.toFixed(2) + 'px,0,0)'; }
}

/* ---------- hero: se escribe y luego aparece lo demás ---------- */
let heroDone = false;
async function heroSeq(){
  if (heroDone) return; heroDone = true;
  /* v2.6: Sona saluda mientras se escribe el título (antes aparecía 5 segundos después) */
  $$('.hstage.hero-fade').forEach(el => setTimeout(() => el.classList.add('show'), 350));
  /* v4.0 · quien saltó la intro quiere usar la página ya: el título se escribe rápido */
  const q = introSkipped ? .35 : 1;
  /* v4.0 · la caja de escribir y «Empezar gratis» salen al terminar el título (antes, después de las 3 frases:
     una persona nueva esperaba ~12 s en su primera visita antes de tener algo que tocar) */
  const showCta = () => $$('.hero-fade').forEach((el, i) => setTimeout(() => el.classList.add('show'), i * 160));
  await typeIn($('#h1'), { cps:22 / q, max:2.8 * q });
  showCta();
  /* v2.9: «En sintonía con la IA.» se escribe después del título (antes ya estaba ahí desde el principio) */
  const hs2 = $('.hsub2'); if (hs2) await typeIn(hs2, { cps:40 / q, max:1 * q });
  await typeIn($('#heroSub'), { cps:120 / q, max:2.4 * q });
}

/* ---------- intro: la Z se dibuja y se pinta de arriba-derecha a abajo-izquierda ---------- */
let pulsed = false, introSkipped = false;
const afterHero = () => { if (FIRST && !$('#authm') && !$('#ptour')) setTimeout(welcomed ? pageTour : firstRun, 700); else if (!FIRST && SZ.wasAway()) setTimeout(() => SZ.welcomeBack({ learn:openGuide }), 600); };
function pulseThenHero(){
  if (pulsed) return; pulsed = true;
  try{
    if (reduce || introSkipped){ root.classList.add('pulsed'); heroSeq().then(afterHero); return; }
    const nb = $('#navWord').getBoundingClientRect();
    if (!FIRST) SZ.thud(nb.left + nb.width / 2, nb.top + nb.height / 2);
    setTimeout(() => root.classList.add('pulsed'), 380);
    setTimeout(() => heroSeq().then(afterHero), 1400);
  }catch(e){ root.classList.add('pulsed'); heroSeq().then(afterHero); }
}
function finishIntro(){
  const o = $('#intro'); if (o) o.remove(); SZ.S.busy(false);
  root.classList.add('ready', 'landed'); root.classList.remove('lock');
  update(); pulseThenHero();
}
/* ---------- v3.0 · intro: la S de vidrio de SymphorIA (la de la barra) se dibuja con un cometa de luz, aparece su órbita, se escribe «SymphorIA»
   con la letra de la barra y todo vuela a su lugar arriba. Sin video. Quien ya vino la ve más rápida ---------- */
async function intro(){
  SZ.S.busy(true);
  const ov = $('#intro'), row = $('#intRow'), mk = $('#izMk'), wd = $('#izW'), skipEl = $('#intSkip'), holdBar = $('#intHold');
  let skip = false;
  const k = FIRST ? 1 : .7;
  const sleep = ms => sleepRaw(skip ? 0 : ms * k);
  ov.style.setProperty('--izd', (1.15 * k).toFixed(2) + 's');
    /* se salta manteniendo la barra espaciadora 1,5 s (en pantallas táctiles, manteniendo el dedo) */
  const HOLD = 1500; let holdT0 = 0, holding = false;
  function holdTick(now){
    if (!holding || skip) return;
    const q = clamp((now - holdT0) / HOLD, 0, 1);
    holdBar.style.transform = 'scaleX(' + q + ')';
    if (q >= 1){ skip = introSkipped = true; return; }
    requestAnimationFrame(holdTick);
  }
  const startHold = () => { if (holding) return; holding = true; holdT0 = performance.now(); skipEl.style.opacity = '1'; requestAnimationFrame(holdTick); };
  const stopHold = () => { holding = false; holdBar.style.transform = 'scaleX(0)'; };
  addEventListener('keydown', e => { if (e.code === 'Space' && $('#intro')){ e.preventDefault(); if (!e.repeat) startHold(); } });
  addEventListener('keyup', e => { if (e.code === 'Space') stopHold(); });
  if (matchMedia('(pointer: coarse)').matches){ ov.addEventListener('pointerdown', startHold); ov.addEventListener('pointerup', stopHold); ov.addEventListener('pointercancel', stopHold); }
  /* v4.0 · revisión de accesibilidad (3 nov): mantener 1,5 s era difícil para quien tiene poca motricidad o no entiende la instrucción,
     y en la PRIMERA visita no se podía saltar nada (hasta ~9 s mirando sin poder hacer nada). Ahora, primera visita o no,
     un toque, un clic, Esc o Enter la saltan, y el aviso aparece desde el principio. */
  const skipNow = () => { if (!skip && $('#intro')){ skip = introSkipped = true; holdBar.style.transform = 'scaleX(1)'; } };
  ov.addEventListener('click', skipNow);
  addEventListener('keydown', e => { if ((e.key === 'Escape' || e.key === 'Enter') && $('#intro')) skipNow(); });
  { const sk = $('span', skipEl), key = matchMedia('(pointer: coarse)').matches ? 'ix.skipTap' : 'ix.skipClick'; sk.dataset.i18nHtml = key; sk.innerHTML = SZ.t(key); }

  /* la marca y el nombre guardan las mismas proporciones que en la barra: así el vuelo final calza exacto */
  const navImg = $('#nav .logo .lgz'), navW = $('#navWord .zw') || $('#navWord');
  /* (la marca de la barra está achicada hasta que la intro aterriza: se mide su tamaño real, no el de la pantalla) */
  const nf = parseFloat(getComputedStyle(navW).fontSize) || 23, nw = navW.getBoundingClientRect();
  const ni = navImg && navImg.offsetHeight ? (b => { const w = navImg.offsetWidth, h = navImg.offsetHeight, cx = b.left + b.width / 2, cy = b.top + b.height / 2; return { left:cx - w / 2, right:cx + w / 2, top:cy - h / 2, width:w, height:h }; })(navImg.getBoundingClientRect()) : null;
  if (ni){ mk.style.height = (ni.height / nf).toFixed(3) + 'em'; wd.style.setProperty('--izg', ((nw.left - ni.right) / nf).toFixed(3) + 'em'); }
  wd.innerHTML = 'Symphor'.split('').map(c => '<span class="izc">' + c + '</span>').join('') + '<span class="izc zt">IA</span>';
  const letters = $$('.izc', wd);
  /* chispas del destello: salen en círculo, cada una con su color del tema */
  const cols = ['var(--sb-light)', 'var(--sb-secondary)', 'var(--sb-warm)', '#fff', 'var(--sb-primary)', 'var(--sb-spark)'];
  $('#izBurst').innerHTML = Array.from({ length:16 }, (_, i) => '<i style="--a:' + (i * 22.5 + (i % 3) * 7) + 'deg;--d:' + (1.1 + (i % 4) * .32).toFixed(2) + 'em;--dl:' + ((i % 5) * .03).toFixed(2) + 's;--c:' + cols[i % cols.length] + '"></i>').join('');

  await Promise.race([document.fonts ? document.fonts.ready : sleepRaw(0), sleepRaw(1200)]);
  await sleep(200);
  setTimeout(() => { if (!skip) skipEl.style.opacity = '1'; }, 400);
  /* 1. un cometa de luz dibuja la S de un solo trazo y el vidrio aparece detrás de él */
  void ov.offsetWidth; ov.classList.add('draw');
  await sleep(1150);
  /* 2. la S brilla y aparece su órbita: un reflejo la cruza, salen dos anillos de luz y chispas, y el cielo se enciende */
  ov.classList.add('shine', 'lit');
  await sleep(380);
  /* 3. se escribe «Symphor» letra por letra y el «IA» de color cae al final */
  for (const l of letters){ l.classList.add('on'); await sleep(l.classList.contains('zt') ? 0 : 70); }
  await sleep(900);
  /* 4. vuela hasta la barra de arriba: la marca dibujada se vuelve la imagen del logo mientras se achica */
  skipEl.style.opacity = '0';
  const r = row.getBoundingClientRect(), m = mk.getBoundingClientRect(), wr = wd.getBoundingClientRect();
  const s = nf / (parseFloat(getComputedStyle(wd).fontSize) || nf);
  const c = [r.left + r.width / 2, r.top + r.height / 2], from = ni && ni.width ? [m.left + m.width / 2, m.top + m.height / 2] : [wr.left + wr.width / 2, wr.top + wr.height / 2];
  const to = ni && ni.width ? [ni.left + ni.width / 2, ni.top + ni.height / 2] : [nw.left + nw.width / 2, nw.top + nw.height / 2];
  const dx = to[0] - c[0] - s * (from[0] - c[0]), dy = to[1] - c[1] - s * (from[1] - c[1]);
  const dur = skip ? .4 : FIRST ? 1 : .8;
  row.style.transition = 'transform ' + dur + 's cubic-bezier(.77,0,.18,1)';
  row.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
  ov.classList.add('fly', 'out');
  await sleepRaw(dur * 1000 + 40);
  try{ sessionStorage.setItem('synthz:intro', '1'); }catch(e){}
  finishIntro();
}

