/* GET /api/config — dice a la página si las cuentas están listas, si «Entrar con Google» está activado
   y qué «ID de cliente» de Google usar para guardar chats en Drive (es público: no es un secreto). */
import { missing, secretFromEnv, json, getJ, googleCid, sbOn, sbGoogleOn, SB_HOST, SB_PUB } from './_lib.js';
export const CID_RX = /^[0-9]{6,20}-[a-z0-9]{10,64}\.apps\.googleusercontent\.com$/;
async function driveCid(){
  const env = (process.env.GOOGLE_DRIVE_CLIENT_ID || '').trim();
  if (env) return env;
  try{ const c = await getJ('cfg:drive'); if (c && CID_RX.test(c.clientId || '')) return c.clientId; }catch(e){}
  return googleCid().catch(() => '');
}
async function maint(){ try{ const c = await getJ('cfg:maint'); return c && c.on ? { on:true, text:String(c.text || '').slice(0, 300), t:c.t || 0 } : { on:false }; }catch(e){ return { on:false }; } }
/* Fase 4 · costo cero: la respuesta es igual para todos, así que cada servidor la guarda 15 s (antes: 3-4 lecturas de Redis por visita).
   El aviso de mantenimiento tarda como mucho 15 s más en aparecer o quitarse. */
let CACHE = { t:0, body:'' };
const responder = body => new Response(body, { headers:{ 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' } });
export default { async fetch(req){
  if (CACHE.body && Date.now() - CACHE.t < 15e3) return responder(CACHE.body);
  const r = await calcular(); if (r.status === 200){ const body = await r.clone().text(); CACHE = { t:Date.now(), body }; }
  return r;
} };
async function calcular(){ const m = missing(); const g = m.length ? '' : await googleCid().catch(() => ''); const sbg = await sbGoogleOn().catch(() => false); return json({ ok:m.length === 0, google:!!g || sbg, googleClientId:g, sbGoogle:sbg, sb:{ on:sbOn(), url:SB_HOST, pub:SB_PUB }, ai:true, driveClientId:m.length ? '' : await driveCid(), secretFromEnv:secretFromEnv(), missing:m, maint:await maint() }); }
