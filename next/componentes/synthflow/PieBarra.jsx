'use client';
/* SynthFlow en React · pie de la barra: tu cuenta (foto, nombre y plan) y la lupa para buscar en tus chats.
   v3.7 · nombre y plan llegan del motor con el evento «synthflow-acc» (src/chat/16g-v32-barra-simple.js);
   la foto la pone el motor en .sf-av porque sale de su HTML. Mismas clases e IDs de antes (#sFoot, #sAcc, #sFind). */
import { useEffect, useState } from 'react';

const P = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round' };

export default function PieBarra(){
  const [acc, setAcc] = useState({ ready: false, name: 'Entrar', plan: 'Gratis' });
  const [find, setFind] = useState(false);

  useEffect(() => {
    const on = e => setAcc(e.detail);
    addEventListener('synthflow-acc', on);
    const now = window.SZFlow?.accInfo?.(); if (now) setAcc(now);
    return () => removeEventListener('synthflow-acc', on);
  }, []);

  /* la lupa abre la búsqueda arriba de los chats; Esc la cierra si está vacía (en Simple) */
  useEffect(() => {
    const cin = document.querySelector('#chats .cin'), q = document.getElementById('thQ');
    if (!cin || !q) return;
    cin.classList.toggle('sfind', find);
    let t; if (find) t = setTimeout(() => q.focus(), 60);
    const key = e => { if (e.key === 'Escape' && document.documentElement.classList.contains('simple') && !q.value) setFind(false); };
    q.addEventListener('keydown', key);
    return () => { clearTimeout(t); q.removeEventListener('keydown', key); };
  }, [find]);

  const toggleFind = () => {
    const q = document.getElementById('thQ');
    if (find && q && q.value){ q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); }
    setFind(f => !f);
  };

  return (
    <div className="sfoot" id="sFoot">
      <button type="button" className="sf-acc" id="sAcc" data-clarity-mask="true" aria-label={acc.ready ? 'Tu cuenta: ' + acc.name : 'Entrar a tu cuenta'} onClick={() => window.SZFlow?.account()}>
        <span className="sf-av" />
        <span className="sf-n"><b>{acc.name}</b><small>{acc.plan}</small></span>
        <span className="sf-chev" aria-hidden="true"><svg viewBox="0 0 24 24" {...P} strokeWidth="2"><path d="M7 10l5 5 5-5" /></svg></span>
      </button>
      <button type="button" className="sf-find" id="sFind" aria-label="Buscar en tus chats" data-tip="Buscar en tus chats" aria-pressed={find} onClick={toggleFind}>
        <svg viewBox="0 0 24 24" {...P} strokeWidth="1.9"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4-4" /></svg>
      </button>
    </div>
  );
}
