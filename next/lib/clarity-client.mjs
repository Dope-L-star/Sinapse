/**
 * Microsoft Clarity client integration. This module is intentionally inert until
 * all release gates are true AND the visitor explicitly accepts analytics.
 */
export const CLARITY_PROJECT_ID_DEFAULT = 'z5es3kuqoz';
export const CLARITY_CONSENT_KEY = 'symphoria:clarity-consent:v2';
export const CLARITY_CONSENT_VERSION = 2;
export const CLARITY_GRANT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const PROJECT_ID_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/;

export function validProjectId(projectId) {
  return typeof projectId === 'string' && PROJECT_ID_PATTERN.test(projectId);
}

/** These are release assertions, not an age-verification system. */
export function isClarityAllowed({ enabled, audience18Plus, adultOnlyRelease, ageControlVerified, privacyReviewed, projectId }) {
  return enabled === true
    && audience18Plus === true
    && adultOnlyRelease === true
    && ageControlVerified === true
    && privacyReviewed === true
    && validProjectId(projectId);
}

/*
 * v3.8 · Second, separate mode for the public site: a short cookie notice («Aceptar cookies» / «Rechazar»).
 * The team only wants click/scroll heatmaps, so the whole page is masked (data-clarity-mask on <body>):
 * no readable text is captured. Off by default; needs its own flag plus privacy review.
 * Older 'minor' answers (from the earlier age question) are still read and treated as a refusal.
 */
export function isClarityHeatmapsAllowed({ enabled, heatmaps, privacyReviewed, projectId }) {
  return enabled === true && heatmaps === true && privacyReviewed === true && validProjectId(projectId);
}

/** 'adult' (adult-only edition), 'heatmaps' (public site, simple cookie notice, page fully masked) or null (Clarity off). */
export function clarityModeFromEnv(env = {}) {
  const on = k => env[k] === 'true';
  const projectId = env.NEXT_PUBLIC_CLARITY_PROJECT_ID || CLARITY_PROJECT_ID_DEFAULT;
  const enabled = on('NEXT_PUBLIC_CLARITY_ENABLED'), privacyReviewed = on('NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED');
  if (isClarityAllowed({ enabled, audience18Plus: on('NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS'), adultOnlyRelease: on('NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE'),
    ageControlVerified: on('NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED'), privacyReviewed, projectId })) return 'adult';
  if (isClarityHeatmapsAllowed({ enabled, heatmaps: on('NEXT_PUBLIC_CLARITY_HEATMAPS'), privacyReviewed, projectId })) return 'heatmaps';
  return null;
}

/** Heatmaps only: masks every text on the page before Clarity starts (Clarity honours data-clarity-mask). */
export function maskWholePage(documentObject) {
  const body = documentObject && documentObject.body;
  if (!body || typeof body.setAttribute !== 'function') return false;
  try { body.setAttribute('data-clarity-mask', 'true'); return true; } catch { return false; }
}

export function readClarityChoice(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CLARITY_CONSENT_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record?.version !== CLARITY_CONSENT_VERSION) return null;
    if (record.choice === 'denied') return 'denied';
    if (record.choice === 'minor') return 'minor';
    if (record.choice !== 'granted' || !Number.isFinite(record.updatedAt)) return null;
    // A future-dated record is invalid; a stale grant must be requested again.
    if (record.updatedAt > now + 5 * 60 * 1000 || now - record.updatedAt > CLARITY_GRANT_MAX_AGE_MS) {
      try { storage.removeItem(CLARITY_CONSENT_KEY); } catch {}
      return null;
    }
    return 'granted';
  } catch {
    return null;
  }
}

export function writeClarityChoice(storage, choice, now = Date.now()) {
  if (!storage || !['granted', 'denied', 'minor'].includes(choice)) return false;
  try {
    storage.setItem(CLARITY_CONSENT_KEY, JSON.stringify({
      version: CLARITY_CONSENT_VERSION,
      choice,
      updatedAt: now,
    }));
    return true;
  } catch {
    // Consent still applies to this page view; if storage is unavailable it will
    // be requested again on the next visit, which is the safe failure mode.
    return false;
  }
}


export function clearFirstPartyClarityCookies(documentObject) {
  if (!documentObject) return;
  const expired = 'Thu, 01 Jan 1970 00:00:00 GMT';
  let hostname = '';
  try { hostname = documentObject.location?.hostname || ''; } catch {}
  for (const name of ['_clck', '_clsk']) {
    const variants = [
      `${name}=; Max-Age=0; Expires=${expired}; Path=/; SameSite=Lax; Secure`,
    ];
    if (hostname && hostname !== 'localhost' && !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
      variants.push(`${name}=; Max-Age=0; Expires=${expired}; Path=/; Domain=${hostname}; SameSite=Lax; Secure`);
      variants.push(`${name}=; Max-Age=0; Expires=${expired}; Path=/; Domain=.${hostname}; SameSite=Lax; Secure`);
    }
    for (const cookie of variants) {
      try { documentObject.cookie = cookie; } catch {}
    }
  }
}

export function queueClarity(windowObject) {
  if (!windowObject) return null;
  if (typeof windowObject.clarity === 'function') return windowObject.clarity;
  const clarity = function (...args) {
    clarity.q = clarity.q || [];
    clarity.q.push(args);
  };
  clarity.q = [];
  windowObject.clarity = clarity;
  return clarity;
}

export function sendClarityConsent(clarity, analyticsGranted) {
  if (typeof clarity !== 'function') return false;
  clarity('consentv2', {
    ad_Storage: 'denied',
    analytics_Storage: analyticsGranted ? 'granted' : 'denied',
  });
  // Microsoft's documented cookie-erasure call remains `consent, false`.
  // It is used only during revocation, in addition to Consent V2.
  if (!analyticsGranted) clarity('consent', false);
  return true;
}

export function loadClarity({ windowObject, documentObject, projectId = CLARITY_PROJECT_ID_DEFAULT }) {
  if (!windowObject || !documentObject || !validProjectId(projectId)) return false;
  const clarity = queueClarity(windowObject);
  // Queue Consent V2 before appending Microsoft's script. Ads stay denied.
  sendClarityConsent(clarity, true);

  const scriptSelector = `script[data-symphoria-clarity="true"],script[src="https://www.clarity.ms/tag/${projectId}"]`;
  if (documentObject.querySelector(scriptSelector)) return true;

  const script = documentObject.createElement('script');
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  script.async = true;
  script.referrerPolicy = 'strict-origin-when-cross-origin';
  script.dataset.symphoriaClarity = 'true';
  script.onerror = () => {
    script.remove();
    if (windowObject.clarity === clarity) {
      try { delete windowObject.clarity; } catch { windowObject.clarity = undefined; }
    }
  };
  documentObject.head.appendChild(script);
  return true;
}

export function revokeClarity({ windowObject, documentObject, storage, now = Date.now() }) {
  if (windowObject && typeof windowObject.clarity === 'function') {
    sendClarityConsent(windowObject.clarity, false);
  }
  clearFirstPartyClarityCookies(documentObject);
  return writeClarityChoice(storage, 'denied', now);
}
