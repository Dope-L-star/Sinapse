'use client';

import { PALETAS, SIMPLE, NOMBRES } from './paletas.mjs';

/* Vista previa de temas en Ajustes: una ventanita de SynthFlow pintada con el tema que estás mirando,
   antes de tocar «Guardar». Sigue al estilo (SynthFlow o Simple), al tamaño (Compacto o Normal) y al idioma.
   Los estilos viven en src/core-css/23-v38-vista-temas.css (prefijo .vt-), así funcionan en todas las páginas. */

const T = {
  es: {
    label: 'Así se verá', create: 'Crear', chats: ['Plan de estudio', 'Ideas para mi tienda', 'Receta rápida'],
    user: '¿Me ayudas a organizar mi semana?', ai: '¡Claro! Empecemos por lo más importante:',
    input: 'Escribe a tu IA…', compact: 'Compacto', normal: 'Normal', simple: 'Simple',
    live: 'También lo ves detrás de esta ventana. Si cierras sin guardar, todo vuelve a como estaba.',
    hover: n => 'Mirando ' + n + '. Tócalo para elegirlo.',
    locked: n => n + ' llega pronto: así se verá cuando lo tengas.',
    simpleNote: 'El estilo Simple usa sus propios colores tranquilos; el color elegido se ve en el estilo SynthFlow.',
  },
  en: {
    label: 'Preview', create: 'New', chats: ['Study plan', 'Ideas for my shop', 'Quick recipe'],
    user: 'Can you help me plan my week?', ai: 'Sure! Let’s start with what matters most:',
    input: 'Message your AI…', compact: 'Compact', normal: 'Normal', simple: 'Simple',
    live: 'You can also see it behind this window. If you close without saving, everything goes back to how it was.',
    hover: n => 'Looking at ' + n + '. Tap it to choose it.',
    locked: n => n + ' is coming soon: this is how it will look when you get it.',
    simpleNote: 'The Simple style uses its own calm colors; the chosen color shows in the SynthFlow style.',
  },
};

function vars(theme, ui) {
  if (ui === 'simple') {
    const s = SIMPLE;
    return { '--vt-bg': s.bg, '--vt-side': s.side, '--vt-card': s.card, '--vt-text': s.text, '--vt-soft': s.soft, '--vt-mute': s.mute,
      '--vt-a': s.acc, '--vt-b': s.acc, '--vt-c': s.acc, '--vt-d': s.acc, '--vt-light': s.acc };
  }
  const p = PALETAS[theme] || PALETAS.synthz;
  return { '--vt-bg': p.bg, '--vt-side': 'color-mix(in srgb,' + p.deep + ' 38%,' + p.bg + ')', '--vt-card': 'rgba(255,255,255,.07)',
    '--vt-text': p.text, '--vt-soft': 'color-mix(in srgb,' + p.text + ' 78%,transparent)', '--vt-mute': 'color-mix(in srgb,' + p.text + ' 52%,transparent)',
    '--vt-a': p.primary, '--vt-b': p.secondary, '--vt-c': p.warm, '--vt-d': p.deep, '--vt-light': p.light };
}

export default function VistaTemas({ theme = 'synthz', ui = 'full', size = 'compact', lang = 'es', locked = false, hovering = false }) {
  const t = T[lang] || T.es, simple = ui === 'simple';
  const name = (NOMBRES[lang] || NOMBRES.es)[theme] || theme;
  const note = locked ? t.locked(name) : simple ? t.simpleNote : hovering ? t.hover(name) : t.live;
  return (
    <figure className={'vt notr' + (simple ? ' vt-simple' : '') + (size === 'normal' ? ' vt-normal' : '')} style={vars(theme, ui)} data-theme-preview={theme} aria-label={t.label + ': ' + (simple ? t.simple : name)}>
      <div className="vt-win" aria-hidden="true">
        <i className="vt-blob" /><i className="vt-blob" /><i className="vt-blob" />
        <div className="vt-bar"><i /><i /><i /><b>SynthFlow</b></div>
        <div className="vt-body">
          <aside className="vt-side">
            <span className="vt-new">+ {t.create}</span>
            {t.chats.map((c, i) => <span key={c} className={'vt-chat' + (i === 0 ? ' on' : '')}>{c}</span>)}
          </aside>
          <div className="vt-main">
            <p className="vt-user">{t.user}</p>
            <div className="vt-ai"><b className="vt-dot" /><div><p>{t.ai}</p><i className="vt-line" /><i className="vt-line s" /></div></div>
            <div className="vt-comp"><span>{t.input}</span><b className="vt-send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 6l6 6-6 6" /></svg></b></div>
          </div>
        </div>
      </div>
      <figcaption className="vt-cap">
        <span className="vt-tag">{t.label} · <b>{simple ? t.simple : name}</b> · {size === 'normal' ? t.normal : t.compact}{locked ? <em>{lang === 'en' ? 'Soon' : 'Pronto'}</em> : null}</span>
        <small aria-live="polite">{note}</small>
      </figcaption>
    </figure>
  );
}
