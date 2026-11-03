/* ---------- v3.8 · ¿la IA que elegiste funciona de verdad? ----------
   Al elegir una IA (o sumarla a Comparar) se le hace una pregunta mínima. Si no responde:
   · se esconde de la lista (si ya no existe, 12 h y para todos; si está llena, 10 min y vuelve sola),
   · vuelves a la IA que tenías, y una ventana te pregunta para qué la querías:
     «Solo quería probar» → sigues navegando, sin las IAs caídas;  «La quiero para…» → te recomienda la que sí funciona y mejor sirve para eso.
   Para no gastar: el resultado se guarda (bien 10 min, llena 2 min, caída 30 min) y en el servidor se comparte entre todos.
   Las de SymphorIA se prueban en /api/ai (no gasta tu batería); Puter y tus llaves, con una respuesta de 4 palabras como mucho. */
const HEALTH = new Map(), H_TTL = { ok:10 * 60e3, busy:2 * 60e3, down:30 * 60e3 };
function iaCached(id){ const h = HEALTH.get(id); return h && h.v && Date.now() - h.t < H_TTL[h.v] ? h.v : null; }
const iaSkip = id => !id || id === 'sz:auto' || /^tr:/.test(id) || !connected(id);
function iaNote(id, v, shared){
  HEALTH.set(id, { v, t:Date.now() });
  if (v === 'ok'){ SZ.markGood(id); return; }
  if (v === 'down') SZ.markBad(id, !shared); else SZ.markSick(id, 10 * 60e3);
  iaDrop(id);
}
/* sacarla de todo: lista, Comparar, la fijada y los filtros (los filtros leen de cat.list) */
function iaDrop(id){
  if (!cat.list.some(m => m.id === id)) return;
  setCatalog(cat.list.filter(m => m.id !== id), cat.t, cat.status);
  if (st().pinned === id) delete st().pinned;
  if (st().cmp.includes(id) && mode !== 'cmp') st().cmp = st().cmp.filter(x => x !== id);
  save();
  try{ renderList({ keep:true }); }catch(e){}
}
async function szPing(ids){
  const r = await fetch('/api/ai', { method:'POST', headers:SZ.szHeaders(), body:JSON.stringify({ action:'ping', ids }) });
  if (!r.ok) throw new Error('ping ' + r.status);
  return (await r.json()).status || {};
}
function iaProbe(id){
  if (iaSkip(id)) return Promise.resolve('ok');
  const c = iaCached(id); if (c) return Promise.resolve(c);
  const h = HEALTH.get(id); if (h && h.p) return h.p;
  const p = (async () => {
    if (/^sz:/.test(id)){
      try{ const v = (await szPing([id]))[id]; return v === 'down' || v === 'busy' ? v : 'ok'; }
      catch(e){ return 'ok'; }   /* sin conexión con SymphorIA: no es culpa de la IA, no se esconde */
    }
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 15000);
    try{ const r = await SZ.askStream(OR, [{ role:'user', content:'Responde solo: ok' }], { model:id, maxTokens:4, signal:ctl.signal }, () => {}); return r && r.aborted ? 'busy' : 'ok'; }
    catch(e){ return e && e.gone ? 'down' : e && (e.aborted || e.name === 'AbortError') ? 'busy' : 'ok'; }   /* un error de tu cuenta o tu saldo no es «IA caída» */
    finally{ clearTimeout(tm); }
  })();
  HEALTH.set(id, { p });
  return p.then(v => { iaNote(id, v, /^sz:/.test(id)); return v; });
}
/* al abrir la lista: las de SymphorIA se revisan de a 4 (una vez cada 10 min; el servidor guarda la respuesta para todos) */
let iaSweepT = 0;
async function iaSweep(){
  if (Date.now() - iaSweepT < 10 * 60e3 || !szOn()) return; iaSweepT = Date.now();
  const ids = cat.list.filter(m => /^sz:/.test(m.id) && !iaSkip(m.id) && !iaCached(m.id)).map(m => m.id);
  for (let i = 0; i < ids.length; i += 4){
    try{ const st0 = await szPing(ids.slice(i, i + 4)); Object.keys(st0).forEach(id => { if (['ok', 'busy', 'down'].includes(st0[id])) iaNote(id, st0[id], true); }); }
    catch(e){ break; }
  }
}
/* la IA que mejor sirve para lo que escribiste, entre las que SÍ responden ahora */
async function iaFor(text, not){
  const tk = guessTopic(text || ''), seen = new Set([not]);
  const list = [...(tk ? recommendTop(tk, 12) : []), bestUsable(true), bestUsable(false), ...cat.list.filter(m => m.free)].filter(m => m && !seen.has(m.id) && (seen.add(m.id), true) && connected(m.id) && !SZ.isBad(m.id));
  const tr = x => SZ.lang() === 'en' && SZ.__syn && SZ.__syn.trStr ? SZ.__syn.trStr(x) : x, topic = tk ? tr(TOPIC[tk].l) : '';
  for (const m of list.filter(m => m.id !== 'sz:auto').slice(0, 4)){ if ((await iaProbe(m.id)) === 'ok') return { id:m.id, name:tr(m.name), topic }; }
  return szOn() ? { id:'sz:auto', name:tr(info('sz:auto').name), topic } : null;
}
function iaAsk(id, why, from, name){
  name = name || (info(id) || {}).name || id;
  if (SZ.lang() === 'en' && SZ.__syn && SZ.__syn.trStr) name = SZ.__syn.trStr(name);
  try{ dispatchEvent(new CustomEvent('sz-ia-caida', { detail:{ id, name, why, from } })); }
  catch(e){ toast(name + ' no está respondiendo ahora. La quité de la lista: elige otra.'); }
}
/* elegiste una IA: se queda elegida mientras se comprueba (sin esperar); si no responde, vuelves a la de antes */
function iaAfterPick(id, prev){
  if (iaSkip(id)) return;
  const name = info(id).name;
  iaProbe(id).then(v => {
    if (v === 'ok' || selId() !== id) return;
    const back = prev && prev !== id && !SZ.isBad(prev) && connected(prev) ? prev : (bestUsable(true) || bestUsable(false) || {}).id;
    if (back) pickModel(back, null);
    iaAsk(id, v, 'solo', name);
  });
}
/* Comparar: primero se comprueba y solo se suma si responde */
async function iaThenAdd(id, node){
  if (iaSkip(id) || iaCached(id) === 'ok') return addToCompare(id, node);
  const name = info(id).name, slow = setTimeout(() => toast('Comprobando que ' + name + ' responde…'), 450);
  const v = await iaProbe(id); clearTimeout(slow);
  if (v === 'ok') return addToCompare(id, node);
  closeSide(); iaAsk(id, v, 'cmp', name);
}
