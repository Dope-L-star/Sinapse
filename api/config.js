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
export default { async fetch(){ const m = missing(); const g = m.length ? '' : await googleCid().catch(() => ''); const sbg = await sbGoogleOn().catch(() => false); return json({ ok:m.length === 0, google:!!g || sbg, googleClientId:g, sbGoogle:sbg, sb:{ on:sbOn(), url:SB_HOST, pub:SB_PUB }, ai:true, driveClientId:m.length ? '' : await driveCid(), secretFromEnv:secretFromEnv(), missing:m, maint:await maint() }); } };
