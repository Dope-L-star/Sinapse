'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CLARITY_PROJECT_ID_DEFAULT,
  clarityModeFromEnv,
  clearFirstPartyClarityCookies,
  loadClarity,
  maskWholePage,
  readClarityChoice,
  revokeClarity,
  writeClarityChoice,
} from '../lib/clarity-client.mjs';

/*
 * Clarity remains inactive unless its release gates are true and a visitor opts in. Two ways to release it:
 *  · 'adult': an adult-only edition (all five flags below). These flags are deployment assertions, not an
 *    age verification mechanism; the adult-only product, access policy and legal copy are reviewed apart.
 *  · 'heatmaps' (v3.8): the public site with a short cookie notice («Aceptar cookies» / «Rechazar»), as Sammuel
 *    asked. The whole page is masked: only click/scroll heatmaps, no readable text.
 * Nothing from Microsoft is requested before an explicit «Permitir». Text in Spanish and English.
 * Next.js only inlines NEXT_PUBLIC_* written literally, so each flag is spelled out here.
 */
const PROJECT_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || CLARITY_PROJECT_ID_DEFAULT;
const MODE = clarityModeFromEnv({
  NEXT_PUBLIC_CLARITY_ENABLED: process.env.NEXT_PUBLIC_CLARITY_ENABLED,
  NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS: process.env.NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS,
  NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE: process.env.NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE,
  NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED: process.env.NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED,
  NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: process.env.NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED,
  NEXT_PUBLIC_CLARITY_HEATMAPS: process.env.NEXT_PUBLIC_CLARITY_HEATMAPS,
  NEXT_PUBLIC_CLARITY_PROJECT_ID: PROJECT_ID,
});
const ALLOWED = MODE !== null;
const HEATMAPS = MODE === 'heatmaps';

const TX = {
  es: {
    eyebrow: 'PRIVACIDAD Y MEJORA', title: '¿Nos ayudas a mejorar SymphorIA?',
    cookieTitle: 'Cookies', cookieBody: 'Usamos cookies de Microsoft Clarity para ver dónde haces clic y hasta dónde bajas, y así mejorar la página. Todo el texto de la pantalla queda tapado.', cookieOk: 'Aceptar cookies', cookieNo: 'Rechazar',
    body: 'Si aceptas, Microsoft Clarity medirá interacciones como clics y desplazamientos y podrá generar reproducciones visuales de la interfaz para detectar problemas de usabilidad. La analítica no es necesaria para usar SymphorIA. La publicidad permanece desactivada. Los mensajes, títulos de chats, datos de cuenta, resultados de A.L.I.A.S. y paneles con información personal están marcados para ocultarse; aun así, el enmascaramiento no es una garantía absoluta: no escribas datos sensibles en una interfaz que pueda grabarse. Puedes retirar tu consentimiento desde el botón «Privacidad».',
    accept: 'Permitir analítica', reject: 'No permitir',
    privacy: 'Leer la política de privacidad', prefs: 'Privacidad', prefsLabel: 'Cambiar preferencias de analítica',
  },
  en: {
    eyebrow: 'PRIVACY AND IMPROVEMENT', title: 'Will you help us improve SymphorIA?',
    cookieTitle: 'Cookies', cookieBody: 'We use Microsoft Clarity cookies to see where you click and how far you scroll, so we can improve the page. All text on the screen stays hidden.', cookieOk: 'Accept cookies', cookieNo: 'Decline',
    body: 'If you accept, Microsoft Clarity will measure interactions such as clicks and scrolling and may create visual replays of the interface to find usability problems. Analytics is not needed to use SymphorIA. Advertising stays off. Messages, chat titles, account data, A.L.I.A.S. results and panels with personal information are marked to be hidden; even so, masking is not an absolute guarantee: do not type sensitive data in an interface that may be recorded. You can withdraw your consent from the «Privacy» button.',
    accept: 'Allow analytics', reject: "Don't allow",
    privacy: 'Read the privacy policy', prefs: 'Privacy', prefsLabel: 'Change analytics preferences',
  },
};

function getStorageSafely() {
  try { return window.localStorage; } catch { return null; }
}

function startClarity() {
  if (!ALLOWED || typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (HEATMAPS) maskWholePage(document);   /* solo mapas de calor: nada de texto legible */
  return loadClarity({ windowObject: window, documentObject: document, projectId: PROJECT_ID });
}

/* el idioma sigue al de la página (<html lang>), que cambia sin recargar */
function usePageLang() {
  const [l, setL] = useState('es');
  useEffect(() => {
    const r = document.documentElement, f = () => setL(r.lang === 'en' ? 'en' : 'es');
    f(); const mo = new MutationObserver(f); mo.observe(r, { attributes: true, attributeFilter: ['lang'] });
    return () => mo.disconnect();
  }, []);
  return l;
}

export default function ClarityConsent() {
  const t = TX[usePageLang()];
  const [open, setOpen] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);

  useEffect(() => {
    if (!ALLOWED) return undefined;
    const choice = readClarityChoice(getStorageSafely());
    if (choice === 'granted') {
      setHasChoice(true);
      startClarity();
    } else if (choice === 'denied' || choice === 'minor') {
      clearFirstPartyClarityCookies(document);
      setHasChoice(true);
    } else {
      // Also remove first-party Clarity cookies if a previous grant expired.
      clearFirstPartyClarityCookies(document);
      setOpen(true);
    }
    const showSettings = () => setOpen(true);
    window.addEventListener('symphoria:analytics-settings', showSettings);
    return () => window.removeEventListener('symphoria:analytics-settings', showSettings);
  }, []);

  const accept = useCallback(() => {
    writeClarityChoice(getStorageSafely(), 'granted');
    setHasChoice(true);
    setOpen(false);
    startClarity();
  }, []);

  const reject = useCallback(() => {
    revokeClarity({ windowObject: window, documentObject: document, storage: getStorageSafely() });
    setHasChoice(true);
    setOpen(false);
  }, []);

  if (!ALLOWED) return null;

  return (
    <>
      {hasChoice && !open ? (
        <button className="clarity-preferences" type="button" onClick={() => setOpen(true)} aria-label={t.prefsLabel}>
          {t.prefs}
        </button>
      ) : null}
      {open ? (
        <section className="clarity-consent" role="dialog" aria-modal="false" aria-labelledby="clarity-consent-title" aria-describedby="clarity-consent-description" data-clarity-mask="true">
          <div className="clarity-consent__eyebrow">
            <span aria-hidden="true" className="clarity-consent__dot" /> {t.eyebrow}
          </div>
          <h2 id="clarity-consent-title">{HEATMAPS ? t.cookieTitle : t.title}</h2>
          <p id="clarity-consent-description">{HEATMAPS ? t.cookieBody : t.body}</p>
          <div className="clarity-consent__actions">
            <button type="button" className="clarity-consent__accept" onClick={accept}>{HEATMAPS ? t.cookieOk : t.accept}</button>
            <button type="button" className="clarity-consent__reject" onClick={reject}>{HEATMAPS ? t.cookieNo : t.reject}</button>
          </div>
          <a className="clarity-consent__privacy" href="/privacidad.html">{t.privacy}</a>
        </section>
      ) : null}
    </>
  );
}

export function ClaritySettingsLink() {
  const t = TX[usePageLang()];
  if (!ALLOWED) return null;
  return (
    <button
      type="button"
      className="clarity-settings-link"
      onClick={() => window.dispatchEvent(new Event('symphoria:analytics-settings'))}
    >
      {t.prefsLabel}
    </button>
  );
}
