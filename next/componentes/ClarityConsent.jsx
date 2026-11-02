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
 *  · 'age-gate' (v3.8): the public 13+ site. The banner first asks the visitor's age; 13-17 never load Clarity
 *    and are not asked again; 18+ may accept or decline. The whole page is masked: only click/scroll heatmaps.
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
  NEXT_PUBLIC_CLARITY_AGE_GATE: process.env.NEXT_PUBLIC_CLARITY_AGE_GATE,
  NEXT_PUBLIC_CLARITY_PROJECT_ID: PROJECT_ID,
});
const ALLOWED = MODE !== null;
const AGE_GATE = MODE === 'age-gate';

const TX = {
  es: {
    eyebrow: 'PRIVACIDAD Y MEJORA', title: '¿Nos ayudas a mejorar SymphorIA?',
    ageQ: 'Antes de pedirte permiso, ¿cuántos años tienes?', adult: 'Tengo 18 o más', minor: 'Tengo entre 13 y 17',
    body: 'Si aceptas, Microsoft Clarity medirá interacciones como clics y desplazamientos y podrá generar reproducciones visuales de la interfaz para detectar problemas de usabilidad. La analítica no es necesaria para usar SymphorIA. La publicidad permanece desactivada. Los mensajes, títulos de chats, datos de cuenta, resultados de A.L.I.A.S. y paneles con información personal están marcados para ocultarse; aun así, el enmascaramiento no es una garantía absoluta: no escribas datos sensibles en una interfaz que pueda grabarse. Puedes retirar tu consentimiento desde el botón «Privacidad».',
    bodyGate: 'Si aceptas, Microsoft Clarity guardará dónde haces clic y hasta dónde bajas en cada página, para ver qué partes se usan más. Todo el texto de la pantalla va tapado: no se ven tus mensajes, tus chats ni tu nombre. No es necesario para usar SymphorIA y no hay publicidad. Puedes cambiar de idea cuando quieras desde el botón «Privacidad».',
    minorDone: 'Gracias. Como eres menor de 18, no medimos nada de tu visita y no te lo volveremos a preguntar.',
    accept: 'Permitir analítica', reject: 'No permitir', ok: 'Entendido', back: 'Cambiar mi edad',
    privacy: 'Leer la política de privacidad', prefs: 'Privacidad', prefsLabel: 'Cambiar preferencias de analítica',
  },
  en: {
    eyebrow: 'PRIVACY AND IMPROVEMENT', title: 'Will you help us improve SymphorIA?',
    ageQ: 'Before we ask, how old are you?', adult: "I'm 18 or older", minor: "I'm 13 to 17",
    body: 'If you accept, Microsoft Clarity will measure interactions such as clicks and scrolling and may create visual replays of the interface to find usability problems. Analytics is not needed to use SymphorIA. Advertising stays off. Messages, chat titles, account data, A.L.I.A.S. results and panels with personal information are marked to be hidden; even so, masking is not an absolute guarantee: do not type sensitive data in an interface that may be recorded. You can withdraw your consent from the «Privacy» button.',
    bodyGate: 'If you accept, Microsoft Clarity will save where you click and how far you scroll on each page, so we can see which parts are used most. All text on the screen is covered: your messages, chats and name are not visible. It is not needed to use SymphorIA and there are no ads. You can change your mind anytime from the «Privacy» button.',
    minorDone: "Thanks. Since you are under 18, we don't measure anything from your visit and we won't ask again.",
    accept: 'Allow analytics', reject: "Don't allow", ok: 'Got it', back: 'Change my age',
    privacy: 'Read the privacy policy', prefs: 'Privacy', prefsLabel: 'Change analytics preferences',
  },
};

function getStorageSafely() {
  try { return window.localStorage; } catch { return null; }
}

function startClarity() {
  if (!ALLOWED || typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (AGE_GATE) maskWholePage(document);   /* solo mapas de calor: nada de texto legible */
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
  const [step, setStep] = useState(AGE_GATE ? 'age' : 'ask');   /* age → ask (18+) | minor */

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
    const showSettings = () => { setStep(AGE_GATE ? 'age' : 'ask'); setOpen(true); };
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

  /* 13-17: Clarity no se carga nunca; si ya estaba (alguien cambió su edad), se retira igual que con «No permitir» */
  const minor = useCallback(() => {
    revokeClarity({ windowObject: window, documentObject: document, storage: getStorageSafely() });
    writeClarityChoice(getStorageSafely(), 'minor');
    setHasChoice(true);
    setStep('minor');
  }, []);

  if (!ALLOWED) return null;

  return (
    <>
      {hasChoice && !open ? (
        <button className="clarity-preferences" type="button" onClick={() => { setStep(AGE_GATE ? 'age' : 'ask'); setOpen(true); }} aria-label={t.prefsLabel}>
          {t.prefs}
        </button>
      ) : null}
      {open ? (
        <section className="clarity-consent" role="dialog" aria-modal="false" aria-labelledby="clarity-consent-title" aria-describedby="clarity-consent-description" data-clarity-mask="true">
          <div className="clarity-consent__eyebrow">
            <span aria-hidden="true" className="clarity-consent__dot" /> {t.eyebrow}
          </div>
          <h2 id="clarity-consent-title">{t.title}</h2>
          {step === 'age' ? (
            <>
              <p id="clarity-consent-description">{t.ageQ}</p>
              <div className="clarity-consent__actions">
                <button type="button" className="clarity-consent__reject" onClick={() => setStep('ask')}>{t.adult}</button>
                <button type="button" className="clarity-consent__reject" onClick={minor}>{t.minor}</button>
              </div>
            </>
          ) : step === 'minor' ? (
            <>
              <p id="clarity-consent-description">{t.minorDone}</p>
              <div className="clarity-consent__actions">
                <button type="button" className="clarity-consent__accept" onClick={() => setOpen(false)}>{t.ok}</button>
              </div>
            </>
          ) : (
            <>
              <p id="clarity-consent-description">{AGE_GATE ? t.bodyGate : t.body}</p>
              <div className="clarity-consent__actions">
                <button type="button" className="clarity-consent__accept" onClick={accept}>{t.accept}</button>
                <button type="button" className="clarity-consent__reject" onClick={reject}>{t.reject}</button>
              </div>
              {AGE_GATE ? <button type="button" className="clarity-consent__back" onClick={() => setStep('age')}>{t.back}</button> : null}
            </>
          )}
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
