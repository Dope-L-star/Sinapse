/**
 * Minimal, opt-in Cloudflare Web Analytics loader for SymphorIA.
 * No custom events, user IDs, session replay, heatmaps, or app-content payloads.
 */
export const CF_ANALYTICS_CONSENT_KEY = 'symphoria:cloudflare-web-analytics-consent:v1';
export const CF_ANALYTICS_CONSENT_VERSION = 1;
export const CF_ANALYTICS_CHOICE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
// Exact public routes only: unknown, account, auth and internal pages are never measured.
const SAFE_PUBLIC_PATHS = new Set([
  '/', '/index.html',
  '/chat', '/chat.html',
  '/ayuda', '/ayuda.html',
  '/offline', '/offline.html',
  '/privacidad', '/privacidad.html',
  '/terminos', '/terminos.html',
]);
const SCRIPT_SELECTOR = 'script[data-symphoria-cloudflare-analytics="true"]';

export function isValidCloudflareAnalyticsToken(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token.trim());
}

export function isCloudflareAnalyticsAllowed({ enabled, privacyReviewed, token }) {
  return enabled === true && privacyReviewed === true && isValidCloudflareAnalyticsToken(token);
}

export function isTrackableAnalyticsLocation(location) {
  if (!location || typeof location !== 'object') return false;
  // Never send URLs with query strings or fragments, which can contain auth data
  // or content supplied by users.
  if (String(location.search || '') !== '' || String(location.hash || '') !== '') return false;
  const pathname = String(location.pathname || '/');
  // Exact allowlist avoids leaking future route names, account IDs or content slugs.
  return SAFE_PUBLIC_PATHS.has(pathname.toLowerCase());
}

export function readCloudflareAnalyticsChoice(storage, now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CF_ANALYTICS_CONSENT_KEY);
    if (!raw) return null;
    const record = JSON.parse(raw);
    if (record?.version !== CF_ANALYTICS_CONSENT_VERSION) return null;
    if (!['granted', 'denied'].includes(record.choice) || !Number.isFinite(record.updatedAt)) return null;
    if (record.updatedAt > now + 5 * 60 * 1000 || now - record.updatedAt > CF_ANALYTICS_CHOICE_MAX_AGE_MS) {
      try { storage.removeItem(CF_ANALYTICS_CONSENT_KEY); } catch {}
      return null;
    }
    return record.choice;
  } catch {
    return null;
  }
}

export function writeCloudflareAnalyticsChoice(storage, choice, now = Date.now()) {
  if (!storage || !['granted', 'denied'].includes(choice)) return false;
  try {
    storage.setItem(CF_ANALYTICS_CONSENT_KEY, JSON.stringify({
      version: CF_ANALYTICS_CONSENT_VERSION,
      choice,
      updatedAt: now,
    }));
    return true;
  } catch {
    // Fail safely: no persistent preference means the next visit asks again.
    return false;
  }
}

export function isSafeAnalyticsReferrer(referrer) {
  if (!referrer) return true;
  try {
    const parsed = new URL(String(referrer));
    if (parsed.search || parsed.hash || parsed.username || parsed.password) return false;
    // Whitelist known public routes; arbitrary external paths may contain user data.
    return SAFE_PUBLIC_PATHS.has(parsed.pathname.toLowerCase());
  } catch {
    // Unknown or malformed referrers are omitted rather than forwarded.
    return false;
  }
}

export function loadCloudflareWebAnalytics({ windowObject, documentObject, token }) {
  if (!windowObject || !documentObject || !isValidCloudflareAnalyticsToken(token)) return false;
  if (!isTrackableAnalyticsLocation(windowObject.location)) return false;
  if (!isSafeAnalyticsReferrer(documentObject.referrer)) return false;
  if (documentObject.querySelector?.(SCRIPT_SELECTOR)) return true;

  const script = documentObject.createElement('script');
  script.type = 'module';
  script.src = BEACON_SRC;
  script.defer = true;
  script.referrerPolicy = 'strict-origin-when-cross-origin';
  script.dataset.symphoriaCloudflareAnalytics = 'true';
  // Disable automatic SPA route measurement to avoid sending query-bearing
  // client transitions. Current app navigation uses full-document anchors.
  script.dataset.cfBeacon = JSON.stringify({ token: token.trim(), spa: false });
  script.onerror = () => { try { script.remove(); } catch {} };
  documentObject.head.appendChild(script);
  return true;
}

/**
 * Revoke permission. If the beacon had already loaded, a full reload is needed
 * to dispose of its in-memory SPA listeners; the caller can reload after this.
 */
export function revokeCloudflareWebAnalytics({ windowObject, documentObject, storage, now = Date.now() }) {
  const activeScript = documentObject?.querySelector?.(SCRIPT_SELECTOR) || null;
  try { activeScript?.remove?.(); } catch {}
  const stored = writeCloudflareAnalyticsChoice(storage, 'denied', now);
  return { stored, wasLoaded: Boolean(activeScript), shouldReload: Boolean(activeScript), windowObject };
}

export function removeCloudflareWebAnalyticsScript(documentObject) {
  const script = documentObject?.querySelector?.(SCRIPT_SELECTOR) || null;
  try { script?.remove?.(); } catch {}
  return Boolean(script);
}
