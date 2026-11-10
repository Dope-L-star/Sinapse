/* ===== v3.4 · SynthonIA vive en su propio archivo: synthonia.js (piezas en src/synthonia/) =====
   Antes estaba dentro de core.js (≈190 KB: su cara, su manita, sus sonidos, su ventanita, la guía, el mantenimiento…).
   Ahora core.js la carga aparte: en la portada enseguida (ella es la portada) y en Sonyx y Pulsem cuando la página ya cargó.
   Mientras llega, estos nombres son «de espera»: lo que se le pida a Sona se guarda y se hace apenas llegue
   (los sonidos de antes de que llegue simplemente no suenan, y su cara sale vacía). SZ.synReady avisa cuando ya está.
   synthonia.js recibe lo que necesita de core por SZ.__syn y devuelve lo suyo con SZ.__syn.ready({ … }). */
let synOk = false, synDone;
const synReady = new Promise(r => { synDone = r; });
const synQ = [];
/* una función de espera: si SynthonIA ya llegó llama a la de verdad; si no, la guarda y devuelve una promesa */
const synLater = name => (...a) => synOk ? SYNX[name](...a) : new Promise(ok => synQ.push(() => { try{ ok(SYNX[name](...a)); }catch(e){ ok(undefined); } }));
/* un objeto de espera (SZ.BOT, SZ.HAND): sus métodos se guardan; los valores conocidos devuelven algo neutro */
const synObj = (name, vals = {}) => new Proxy({}, { get:(t, k) => {
  if (synOk) return SYNX[name][k];
  if (k in vals) return vals[k];
  if (typeof k !== 'string' || k === 'then') return undefined;
  return (...a) => new Promise(ok => synQ.push(() => { try{ const f = SYNX[name][k]; ok(typeof f === 'function' ? f(...a) : f); }catch(e){ ok(undefined); } }));
} });
const SYNX = {};
let face = () => '', synBody = () => '', synSet = () => {}, lipSync = () => () => {}, ballFace = () => null, randomGoodFace = () => 'feliz', wasAway = () => false;
let EV;   /* los eventos de 50, 100 y 500 visitas (el portal pregunta «typeof EV») */
let FACE_GOOD = ['feliz', 'riendo', 'guino', 'encantada', 'celebrando', 'flow'], SPOSE = {}, GTOPICS = [];
let botOpen = synLater('botOpen'), botTeam = synLater('botTeam'), feedbackModal = synLater('feedbackModal'), guideChooser = synLater('guideChooser'),
  welcomeBack = synLater('welcomeBack'), guideAsk = synLater('guideAsk'), whatsNew = synLater('whatsNew');
/* los sonidos antes de que llegue: silencio (no se repiten después) */
let SND = new Proxy({}, { get:(t, k) => synOk ? SYNX.SND[k] : k === 'then' ? undefined : () => {} });
let HAND = synObj('HAND', { alive:false, pos:{ x:0, y:0 } }), BOTAPI = synObj('BOTAPI', { el:null });
function synArrive(x){
  if (synOk) return;
  Object.assign(SYNX, x);
  ({ face, synBody, synSet, lipSync, ballFace, randomGoodFace, wasAway, FACE_GOOD, SPOSE, GTOPICS, botOpen, botTeam, feedbackModal, guideChooser, welcomeBack, guideAsk, whatsNew, SND, HAND, BOTAPI, EV } = x);
  synOk = true;
  synQ.splice(0).forEach(f => f());
  synDone(true);
  try{ dispatchEvent(new Event('synthz-synthonia')); }catch(e){}
}
/* trae synthonia.js (si la página no la trajo ya con su propia etiqueta) */
function synLoad(){
  if (synOk || document.querySelector('script[data-syn]')) return;
  const s = document.createElement('script'); s.src = '/synthonia.js'; s.dataset.syn = '1'; s.async = true;
  s.onerror = () => { s.remove(); setTimeout(synLoad, 4000); };   /* sin internet un momento: vuelve a intentar */
  document.head.appendChild(s);
}
