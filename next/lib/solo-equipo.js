'use client';
/* v4.5 (Sammuel, 9 nov: «quita a todos el ALIAS excepto los admins»).
   A.L.I.A.S. solo se ve para quien el servidor dice que lo tiene (perks.f.alias de /api/ai: el equipo, o alguien a quien se lo
   prendieron en Pulsem › Usuarios). SynthFlow lo recuerda en localStorage «synthz:alias» (src/core/25j-v30-planes.js).
   La página estática siempre sale SIN A.L.I.A.S. (así nadie lo ve parpadear) y aparece después solo si la llave dice que sí.
   Esto es solo lo que se ve: el servidor (api/alias.js) bloquea igual a quien no lo tiene. */
import { useEffect, useState } from 'react';

export const K_ALIAS = 'synthz:alias';
export function aliasGuardado() {
  try { return localStorage.getItem(K_ALIAS) === '1'; } catch (e) { return false; }
}
export function guardarAlias(on) {
  try { on ? localStorage.setItem(K_ALIAS, '1') : localStorage.removeItem(K_ALIAS); } catch (e) { /* sin guardado */ }
}
/* pregunta al servidor (con la sesión de SynthFlow, si hay) si esta cuenta tiene A.L.I.A.S. → true / false / null (no se pudo saber) */
export async function aliasDelServidor() {
  let tk = ''; try { tk = localStorage.getItem('synthz:sess') || ''; } catch (e) { /* sin sesión */ }
  if (!tk) return false;
  try {
    const r = await fetch('/api/ai', { headers: { Authorization: 'Bearer ' + tk }, cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return !!(d && d.perks && d.perks.f && d.perks.f.alias);
  } catch (e) { return null; }
}
/* para la portada y la barra de arriba: false al pintar; true después solo si esta cuenta lo tiene */
export function useAliasVisible() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(aliasGuardado());
    const f = (e) => { if (e.key === K_ALIAS) setOk(aliasGuardado()); };
    addEventListener('storage', f);
    return () => removeEventListener('storage', f);
  }, []);
  return ok;
}
