'use client';

import { useEffect, useState } from 'react';

/* Saldo de SynXCoin que se oculta y se revela con un ojo (idea del Uiverse #40, la billetera; no copiada).
   Oculto se ve «•••••»; al tocar el ojo los números suben uno por uno. La elección se recuerda en este navegador.
   Estilos: src/core-css/25-v38-efectos.css (prefijo .so-). Sigue al tema con --gold/--wine. */
const T = {
  es: { show: 'Mostrar saldo', hide: 'Ocultar saldo', label: 'SynXCoin' },
  en: { show: 'Show balance', hide: 'Hide balance', label: 'SynXCoin' },
};
const KEY = 'synthz:saldoVisible';

export default function SaldoOjo({ valor = 0, etiqueta, lang = 'es', compacto = false, recordar = true }) {
  const t = T[lang] || T.es;
  const [ver, setVer] = useState(false);
  useEffect(() => { if (!recordar) return; try { setVer(localStorage.getItem(KEY) === '1'); } catch (e) {} }, [recordar]);
  const cambiar = () => setVer(v => { const n = !v; if (recordar) { try { localStorage.setItem(KEY, n ? '1' : '0'); } catch (e) {} } return n; });
  const txt = typeof valor === 'number' ? valor.toLocaleString(lang === 'en' ? 'en-US' : 'es-CO') : String(valor);
  return (
    <span className={'so notr' + (ver ? ' ver' : '') + (compacto ? ' sm' : '')}>
      <span className="so-coin" aria-hidden="true"><b>S</b></span>
      <span className="so-tx">
        <small>{etiqueta || t.label}</small>
        <b aria-live="polite" aria-label={ver ? txt : t.hide}>
          {ver ? [...txt].map((c, i) => <i key={i + c} style={{ '--d': i * 45 + 'ms' }}>{c}</i>) : <span className="so-dots">•••••</span>}
        </b>
      </span>
      <button type="button" className="so-eye" onClick={cambiar} aria-pressed={ver} aria-label={ver ? t.hide : t.show} title={ver ? t.hide : t.show}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" className="so-pupil" /><path d="M4 4l16 16" className="so-slash" />
        </svg>
      </button>
    </span>
  );
}
