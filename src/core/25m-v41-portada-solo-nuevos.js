/* ---------- v4.1 · la portada (index.html) es solo para gente nueva ----------
   Quien ya tiene cuenta o ya entró antes va directo a SynthFlow (eso lo hace el guardián que está
   en el <head> de index.html, antes de pintar nada). La única forma de volver a ver la portada es la
   pantallita «Ya tengo el Flow / Soy nuevo»: «Soy nuevo» la abre, «Ya tengo el Flow» entra directo.
   La decisión vive en este dispositivo (synthz:portada = { v:'app'|'nuevo', t }) y viaja con la cuenta
   (prefs.portada): gana la más reciente. Si no hay ningún dato, es la primera visita de verdad. */
const PORTADA_KEY = 'synthz:portada';
function portadaGet(){
  try{ const d = JSON.parse(localStorage.getItem(PORTADA_KEY) || 'null'); if (d && (d.v === 'app' || d.v === 'nuevo')) return { v:d.v, t:+d.t || 0 }; }catch(e){}
  return null;
}
function portadaSet(v, t){
  if (v !== 'app' && v !== 'nuevo') return;
  try{ localStorage.setItem(PORTADA_KEY, JSON.stringify({ v, t:t || Date.now() })); }catch(e){}
  if (!t) try{ accSchedule(); }catch(e){}   /* decisión nueva de esta persona: que viaje a su cuenta */
}
/* lo que trae la cuenta: solo se acepta si es más nuevo que lo de este dispositivo */
function portadaMerge(p){
  if (!p || (p.v !== 'app' && p.v !== 'nuevo')) return;
  const mine = portadaGet();
  if (!mine || (+p.t || 0) > mine.t) portadaSet(p.v, +p.t || 1);
}
/* ya entró a la app de verdad: SynthFlow lo marca al abrir (sirve aunque nunca haya contestado la pantallita) */
const PAGE_NOW = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
if (PAGE_NOW === 'chat') try{ localStorage.setItem('synthz:entro', String(Date.now())); }catch(e){}
/* ¿esta persona ya es conocida? (lo mismo que mira el guardián de index.html, para el resto del sitio) */
function portadaKnown(){
  const d = portadaGet(); if (d) return d.v === 'app';
  try{ return !!(localStorage.getItem('synthz:sess') || localStorage.getItem('synthz:entro')); }catch(e){ return false; }
}
