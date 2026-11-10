/* ---------- v3.0 · enlaces de la página de Ayuda (ayuda.html) ----------
   ?ayuda=equipo abre «Hablar con el equipo», ?ayuda=mejorar abre «Cuéntanos qué mejorar» y ?ayuda=synthonia abre a Sona.
   Espera un poco a que la cuenta y Sona estén listas; después borra el parámetro para que no se repita al recargar (window.history: en core, history() es otra función). */
try{
  const AY = new URLSearchParams(location.search).get('ayuda');
  if (AY && ['equipo', 'mejorar', 'synthonia'].includes(AY)) setTimeout(() => {
    try{ if (AY === 'equipo') botTeam(); else if (AY === 'mejorar') feedbackModal(); else botOpen(); }catch(e){}
    try{ const u = new URL(location.href); u.searchParams.delete('ayuda'); window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash); }catch(e){}
  }, 2200);
}catch(e){}
