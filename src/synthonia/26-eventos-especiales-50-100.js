/* ===== v1.4 · eventos especiales: a las 50, 100 y 500 visitas la página «se hackea» y das un logro ===== */
const EV = (() => {
  const K = 'synthz:visits', A = 'synthz:ach';
  let visits = 0; try{ visits = +localStorage.getItem(K) || 0; if (!sessionStorage.getItem('synthz:vcount')){ visits++; localStorage.setItem(K, String(visits)); sessionStorage.setItem('synthz:vcount', '1'); } }catch(e){}
  const ach = () => { try{ return JSON.parse(localStorage.getItem(A)) || {}; }catch(e){ return {}; } };
  const force = (() => { try{ return new URLSearchParams(location.search).get('evento'); }catch(e){ return null; } })();
  const pending = () => { if (force && /^(50|100|500)$/.test(force)) return +force; const a = ach(); return [500, 100, 50].find(n => visits >= n && !a[n]) || 0; };
  const mark = n => { const a = ach(); a[n] = Date.now(); try{ localStorage.setItem(A, JSON.stringify(a)); }catch(e){} push(); };
  /* si tienes cuenta, el logro queda guardado en ella (así cuenta para los descuentos de 100 y 500) */
  const push = () => { const a = ach(); if (!B.SESS || !Object.keys(a).length) return; api('me', { method:'PUT', body:{ ach:a }, keep:true }).catch(() => {}); };
  addEventListener('synthz-acc', push);
  const CODE = ['import { flow } from "synthz/core"', 'const z = await vidrio.fundir("Z")', 'synthonia.despertar({ modo:"hack" })', 'for (const ia of IAs_conectadas) ia.sincronizar()', '[OK] compilando SynthFlow…', 'reconstruyendo vidrio líquido ████████░░', 'flow.calibrar(0.9998)', 'if (usuario.visitas > LIMITE) desbloquear(logro)', '[OK] núcleo de Flow estable', 'cargando la página otra vez…', 'z.render({ brillo:true })', 'SymphorIA.reiniciar() // no te asustes 😉'];
  function overlay(kind){
    const o = document.createElement('div'); o.className = 'hackev k' + kind; o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<canvas></canvas><div class="hk-code"></div><div class="hk-bar"><i></i></div><div class="hk-t"></div>';
    document.body.appendChild(o); return o;
  }
  /* lluvia de código (verde o roja) o viaje por las estrellas (500) */
  function sky(o, kind){
    const c = $('canvas', o), x = c.getContext('2d'); let W, H, run = true;
    const fit = () => { W = c.width = innerWidth * (devicePixelRatio > 1 ? 1.5 : 1); H = c.height = innerHeight * (devicePixelRatio > 1 ? 1.5 : 1); c.style.width = innerWidth + 'px'; c.style.height = innerHeight + 'px'; };
    fit();
    if (kind === 500){
      const S = Array.from({ length:420 }, () => ({ a:Math.random() * Math.PI * 2, r:Math.random() * 40, v:.6 + Math.random() * 3.4, h:Math.random() < .5 ? 42 : Math.random() < .5 ? 300 : 340 }));
      (function f(){ if (!run) return; x.fillStyle = 'rgba(6,4,14,.24)'; x.fillRect(0, 0, W, H); const cx = W / 2, cy = H / 2;
        S.forEach(s => { const r0 = s.r; s.r += s.v * (1 + s.r / 80); if (s.r > Math.hypot(W, H) / 1.6){ s.r = Math.random() * 20; s.a = Math.random() * Math.PI * 2; }
          x.strokeStyle = 'hsla(' + s.h + ',90%,72%,' + Math.min(1, s.r / 200) + ')'; x.lineWidth = 1 + s.r / 300; x.beginPath(); x.moveTo(cx + Math.cos(s.a) * r0, cy + Math.sin(s.a) * r0); x.lineTo(cx + Math.cos(s.a) * s.r, cy + Math.sin(s.a) * s.r); x.stroke(); });
        requestAnimationFrame(f); })();
    } else {
      const fs = 16, cols = Math.ceil(W / fs), drops = Array.from({ length:cols }, () => Math.random() * -40), col = kind === 100 ? '255,70,70' : '80,255,140';
      (function f(){ if (!run) return; x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H); x.font = fs + 'px monospace';
        drops.forEach((d, i) => { x.fillStyle = 'rgba(' + col + ',' + (.35 + Math.random() * .65) + ')'; x.fillText(String.fromCharCode(0x30A0 + Math.random() * 96 | 0), i * fs, d * fs); drops[i] = d * fs > H && Math.random() > .975 ? 0 : d + 1; });
        requestAnimationFrame(f); })();
    }
    return () => { run = false; };
  }
  async function typeCode(o, kind){
    const box = $('.hk-code', o), bar = $('.hk-bar i', o), lines = kind === 100 ? ['⚠ ALERTA: el núcleo de Flow se sobrecalentó', 'desviando energía a Sona…', ...CODE.slice(2, 9), '[OK] temperatura normal'] : CODE;
    for (let i = 0; i < lines.length; i++){
      const ln = document.createElement('div'); box.appendChild(ln);
      for (const ch of lines[i]){ ln.textContent += ch; if (Math.random() < .5) await sleepRaw(6); }
      bar.style.transform = 'scaleX(' + ((i + 1) / lines.length).toFixed(3) + ')';
      await sleepRaw(90);
      if (box.children.length > 14) box.firstChild.remove();
    }
  }
  /* el «error»: la página se distorsiona un momento */
  async function glitch(ms, kind){
    root.classList.add('glitching'); if (kind === 100) root.classList.add('glitch-red');
    await sleepRaw(ms); root.classList.remove('glitching', 'glitch-red');
  }
  function botBig(on, mood){ const b = BOT.el; if (!b) return; b.classList.toggle('g2', on); b.classList.toggle('evfront', on); if (on){ BOT.sticky = null; botFace(mood || 'sorprendida', true); } else botFace('feliz', true); }
  async function play(n){
    mark(n);
    try{ sessionStorage.setItem('synthz:achShow', String(n)); }catch(e){}
    portalLock(true); botBig(true, 'sorprendida');
    await glitch(n === 500 ? 500 : 1100, n);
    const o = overlay(n); requestAnimationFrame(() => o.classList.add('on'));
    const stop = sky(o, n);
    if (n === 500){
      $('.hk-t', o).innerHTML = '<img src="media/v30/symphoria.svg" alt=""><b>MODO GALAXIA</b><small>Viajaste 500 veces por SymphorIA</small>';
      botFace('encantada', true); await sleepRaw(4200);
    } else {
      $('.hk-t', o).textContent = n === 100 ? 'SISTEMA SOBRECARGADO' : 'SYNTHZ SE ESTÁ REPROGRAMANDO';
      botFace(n === 100 ? 'preocupada' : 'pensando', true); await typeCode(o, n); await sleepRaw(400);
    }
    o.classList.add('out'); botFace('celebrando', true);
    await sleepRaw(700); stop(); o.remove(); portalLock(false); setTimeout(() => botBig(false), 2500);
  }
  /* el logro: entra deslizándose por arriba a la derecha */
  function badge(n){
    const t = { 50:['50', 'Has entrado más de 50 veces a la página.', ''], 100:['100', 'Has entrado más de 100 veces a la página.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'], 500:['500', 'Has entrado más de 500 veces. Eres leyenda de SymphorIA.', 'Se te tendrá en cuenta para descuentos exclusivos cuando lleguen los pagos.'] }[n];
    const b = document.createElement('div'); b.className = 'achv a' + n; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="ac-i">' + (n === 500 ? '<img src="media/v30/symphoria.svg" alt="">' : '<b>' + t[0] + '</b>') + '</span><div><small>EVENTO ESPECIAL DESBLOQUEADO</small><h4>' + esc(t[1]) + '</h4><p>Este logro es 1 en un millón.</p>' + (t[2] ? '<p class="ac-d">' + esc(t[2]) + '</p>' : '') + '</div><button type="button" aria-label="Cerrar">×</button>';
    document.body.appendChild(b); requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('on')));
    try{ SND.done(); }catch(e){}
    const close = () => { b.classList.remove('on'); setTimeout(() => b.remove(), 700); };
    $('button', b).addEventListener('click', close); setTimeout(close, n === 50 ? 9000 : 14000);
  }
  /* de vez en cuando (muy raro) solo un «error» corto, sin logro */
  function maybeGlitch(){ if (Math.random() < 1 / 120 || force === 'glitch') setTimeout(() => { if (!document.querySelector('#vintro,#intro,#portal,.szm')) glitch(900); }, 6000 + Math.random() * 20000); }
  /* al llegar con un logro pendiente de mostrar */
  function onLoad(){
    let show = 0; try{ show = +sessionStorage.getItem('synthz:achShow') || 0; sessionStorage.removeItem('synthz:achShow'); }catch(e){}
    if (show) setTimeout(() => badge(show), 1600);
    else if (isFlow() && pending()) setTimeout(async () => { if (document.querySelector('.szm,#portal') || root.classList.contains('guiding')) return; const n = pending(); await play(n); badge(n); try{ sessionStorage.removeItem('synthz:achShow'); }catch(e){} }, 3500);
    maybeGlitch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onLoad); else setTimeout(onLoad, 50);
  return { pending, play, badge, get visits(){ return visits; } };
})();
