/* ---------- 2026-11-09 · rediseño «Partitura»: el selector de 4 modos en la caja de escribir ----------
   Sammuel: «hay muchas IAs, el modo auto, comparar y A.L.I.A.S.: ¿cómo se va a elegir?». Respuesta concreta, siempre a la vista:
     Auto      SymphorIA elige la IA para cada pedido (y dice cuál usó).            → applyMode('auto')
     Una IA    tú eliges de la lista con buscador; abajo se ve cuál tienes.          → applyMode('chat') + abre la lista
     Comparar  2 a 3 IAs lado a lado; te quedas con la mejor.                         → cmpOpen()
     Agente    A.L.I.A.S.: arma un plan, lo apruebas una vez y trabaja solo.          → abre alias.html con lo escrito
   Y el esfuerzo, al lado: Rápido (Bajo) · Normal (la IA decide) · SuperiorSynth (el agente de SynthFlow elige la IA y mejora tu pedido).
   Reemplaza a los botones «Modo», «Esfuerzo» y «Comparar con otra IA», que se esconden con CSS (siguen en el DOM para el motor). */
(function partituraSelector(){
  const row = $('#cPickRow'); if (!row || $('#ptModos')) return;
  const en = () => SZ.lang && SZ.lang() === 'en';
  const T = () => en()
    ? { modos:{ auto:'Auto', una:'One AI', cmp:'Compare', agente:'Agent' }, esf:['Quick', 'Normal', 'SuperiorSynth'], modo:'Mode', esfuerzo:'Effort',
        ayuda:{ auto:'SymphorIA picks the AI for each request and tells you which one.', una:'You pick the AI from the list.', cmp:'Several AIs answer side by side. Keep the best one.', agente:'A.L.I.A.S. makes a plan, you approve it once and it works on its own.' } }
    : { modos:{ auto:'Auto', una:'Una IA', cmp:'Comparar', agente:'Agente' }, esf:['Rápido', 'Normal', 'SuperiorSynth'], modo:'Modo', esfuerzo:'Esfuerzo',
        ayuda:{ auto:'SymphorIA elige la IA para cada pedido y te dice cuál usó.', una:'Tú eliges la IA de la lista.', cmp:'Varias IAs responden lado a lado. Te quedas con la mejor.', agente:'A.L.I.A.S. arma un plan, lo apruebas una vez y trabaja solo.' } };
  const MODOS = ['auto', 'una', 'cmp', 'agente'];
  const actual = () => mode === 'cmp' ? 'cmp' : selId() === 'sz:auto' && !agentOn() ? 'auto' : 'una';
  const esfActual = () => agentOn() ? 2 : (st().sx && st().sx.effort === 'low') ? 0 : 1;

  const bar = document.createElement('div');
  bar.className = 'pt-sel'; bar.id = 'ptModos';
  row.insertBefore(bar, row.firstChild);
  document.body.classList.add('pt-flow');

  function pinta(){
    const t = T(), m = actual(), e = esfActual();
    bar.innerHTML =
      '<div class="pt-m" role="radiogroup" aria-label="' + t.modo + '">' + MODOS.map(k => '<button type="button" role="radio" data-pm="' + k + '" aria-checked="' + (k === m) + '" title="' + esc(t.ayuda[k]) + '">' + t.modos[k] + '</button>').join('') + '</div>' +
      '<div class="pt-e" role="radiogroup" aria-label="' + t.esfuerzo + '">' + t.esf.map((n, i) => '<button type="button" role="radio" data-pe="' + i + '" aria-checked="' + (i === e) + '">' + n + '</button>').join('') + '</div>';
    document.body.dataset.ptModo = m;
  }
  function salirDeComparar(){ if (mode === 'cmp') setMode('solo'); }
  bar.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.pm){
      const k = b.dataset.pm;
      if (k === 'agente'){
        const q = (inp.value || '').trim();
        location.href = 'alias.html?' + new URLSearchParams(q ? { from:'flow', meta:q } : { from:'flow' }).toString();
        return;
      }
      if (k === 'cmp'){ cmpOpen(b); setTimeout(pinta, 50); return; }
      salirDeComparar();
      if (k === 'auto'){ if (agentOn()) setAgent(false); applyMode('auto'); }
      if (k === 'una'){ if (agentOn()) setAgent(false); if (selId() === 'sz:auto') applyMode('chat'); openSide('set', b); }
      pinta(); return;
    }
    if (b.dataset.pe){
      const i = +b.dataset.pe;
      if (i === 2){ if (!agentOn()) setAgent(true); }
      else { if (agentOn()) setAgent(false); st().sx.effort = i === 0 ? 'low' : 'auto'; save(); }
      pinta(); return;
    }
  });
  /* el motor cambia de IA o de modo por muchos caminos: se repinta cuando cambia algo que se ve */
  const obs = new MutationObserver(() => { const m = actual(), e = esfActual(); if (m !== document.body.dataset.ptModo || !bar.querySelector('[data-pe="' + e + '"][aria-checked="true"]')) pinta(); });
  obs.observe(document.body, { attributes:true, attributeFilter:['class', 'data-cmode'] });
  new MutationObserver(pinta).observe(document.documentElement, { attributes:true, attributeFilter:['lang'] });
  addEventListener('storage', e => { if (e.key === 'synthz:lang') setTimeout(pinta, 0); });

  /* lo que pidió la portada: ?esfuerzo=rapido|normal|superiorsynth y ?elegir=1 (Una IA) */
  const ef = params.get('esfuerzo');
  if (ef === 'rapido'){ if (agentOn()) setAgent(false); st().sx.effort = 'low'; save(); }
  else if (ef === 'normal' && st().sx.effort === 'low'){ st().sx.effort = 'auto'; save(); }
  else if (ef === 'superiorsynth' && !agentOn()) setTimeout(() => { try{ setAgent(true); pinta(); }catch(er){} }, 400);
  if (params.get('elegir') === '1') setTimeout(() => { try{ if (selId() === 'sz:auto') applyMode('chat'); openSide('set'); pinta(); }catch(er){} }, 1800);
  pinta();
})();
