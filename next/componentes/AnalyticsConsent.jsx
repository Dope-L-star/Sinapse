'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  isCloudflareAnalyticsAllowed,
  isTrackableAnalyticsLocation,
  loadCloudflareWebAnalytics,
  readCloudflareAnalyticsChoice,
  removeCloudflareWebAnalyticsScript,
  revokeCloudflareWebAnalytics,
  writeCloudflareAnalyticsChoice,
} from '../lib/cloudflare-analytics.mjs';

const TOKEN = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN || '';
const ALLOWED = isCloudflareAnalyticsAllowed({
  enabled: process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED === 'true',
  privacyReviewed: process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED === 'true',
  token: TOKEN,
});

function getStorageSafely() {
  try { return window.localStorage; } catch { return null; }
}

function canOfferHere() {
  if (typeof window === 'undefined') return false;
  return isTrackableAnalyticsLocation(window.location);
}

function loadIfAllowed() {
  if (!ALLOWED || typeof window === 'undefined' || typeof document === 'undefined') return false;
  return loadCloudflareWebAnalytics({ windowObject: window, documentObject: document, token: TOKEN });
}

export default function AnalyticsConsent() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);
  const [choice, setChoice] = useState(null);
  const volatileChoice = useRef(null);

  useEffect(() => {
    if (!ALLOWED || !canOfferHere()) return undefined;
    const storage = getStorageSafely();
    const storedChoice = readCloudflareAnalyticsChoice(storage) || volatileChoice.current;
    setChoice(storedChoice);
    if (storedChoice === 'granted') {
      setHasChoice(true);
      loadIfAllowed();
      setOpen(false);
    } else if (storedChoice === 'denied') {
      setHasChoice(true);
      setOpen(false);
    } else {
      setHasChoice(false);
      setOpen(true);
    }

    const showSettings = () => setOpen(true);
    window.addEventListener('symphoria:analytics-settings', showSettings);
    return () => window.removeEventListener('symphoria:analytics-settings', showSettings);
  }, [pathname]);

  const accept = useCallback(() => {
    writeCloudflareAnalyticsChoice(getStorageSafely(), 'granted');
    volatileChoice.current = 'granted';
    setChoice('granted');
    setHasChoice(true);
    setOpen(false);
    loadIfAllowed();
  }, []);

  const reject = useCallback(() => {
    const wasLoaded = removeCloudflareWebAnalyticsScript(document);
    writeCloudflareAnalyticsChoice(getStorageSafely(), 'denied');
    volatileChoice.current = 'denied';
    setChoice('denied');
    setHasChoice(true);
    setOpen(false);
    // A live beacon can hold SPA observers in memory; reload only when revoking
    // an already active grant so no further route measurement continues.
    if (wasLoaded) window.location.reload();
  }, []);

  const revoke = useCallback(() => {
    const result = revokeCloudflareWebAnalytics({
      windowObject: window,
      documentObject: document,
      storage: getStorageSafely(),
    });
    volatileChoice.current = 'denied';
    setChoice('denied');
    setHasChoice(true);
    setOpen(false);
    // Reload tears down any in-memory observers installed by the beacon.
    if (result.shouldReload) window.location.reload();
  }, []);

  if (!ALLOWED) return null;
  if (typeof window !== 'undefined' && !canOfferHere()) return null;

  return (
    <>
      {hasChoice && !open ? (
        <button
          className="analytics-preferences"
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Cambiar preferencias de analítica"
        >
          Analítica
        </button>
      ) : null}
      {open ? (
        <section className="analytics-consent" role="dialog" aria-modal="false" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
          <div className="analytics-consent__eyebrow">
            <span aria-hidden="true" className="analytics-consent__dot" /> PRIVACIDAD · MÉTRICAS TÉCNICAS
          </div>
          <h2 id="analytics-consent-title">Ayúdanos a mejorar el rendimiento</h2>
          <p id="analytics-consent-description">
            Si aceptas, Cloudflare Web Analytics medirá visitas a páginas y métricas técnicas de carga para ayudarnos a mejorar la velocidad. No usamos grabaciones de sesiones, mapas de calor ni eventos personalizados; este código no envía tus prompts, mensajes, títulos de chats, datos de cuenta ni resultados de Sona. No es necesario para usar Sinapse. Puedes rechazarlo o cambiar tu decisión cuando quieras desde «Analítica».
          </p>
          <div className="analytics-consent__actions">
            <button type="button" className="analytics-consent__accept" onClick={accept}>Permitir métricas</button>
            <button type="button" className="analytics-consent__reject" onClick={reject}>No, gracias</button>
          </div>
          {choice === 'granted' ? <button type="button" className="analytics-consent__revoke" onClick={revoke}>Retirar consentimiento y recargar</button> : null}
          <a className="analytics-consent__privacy" href="/privacidad.html">Leer la política de privacidad</a>
        </section>
      ) : null}
    </>
  );
}

export function AnalyticsSettingsLink() {
  if (!ALLOWED) return null;
  return (
    <button
      type="button"
      className="analytics-settings-link"
      onClick={() => window.dispatchEvent(new Event('symphoria:analytics-settings'))}
    >
      Cambiar preferencias de analítica
    </button>
  );
}

