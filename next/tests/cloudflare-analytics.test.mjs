import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CF_ANALYTICS_CONSENT_KEY,
  CF_ANALYTICS_CHOICE_MAX_AGE_MS,
  isCloudflareAnalyticsAllowed,
  isTrackableAnalyticsLocation,
  isSafeAnalyticsReferrer,
  isValidCloudflareAnalyticsToken,
  loadCloudflareWebAnalytics,
  readCloudflareAnalyticsChoice,
  removeCloudflareWebAnalyticsScript,
  revokeCloudflareWebAnalytics,
  writeCloudflareAnalyticsChoice,
} from '../lib/cloudflare-analytics.mjs';

const TOKEN = '12345678-abcd-4321-abcd-1234567890ab';
function memoryStorage() {
  const map = new Map();
  return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: k => map.delete(k), _map: map };
}
function fakeBrowser(location = { pathname: '/chat.html', search: '', hash: '' }) {
  const scripts = [];
  const documentObject = {
    location: { hostname: 'sinapse.pages.dev' },
    head: { appendChild: s => scripts.push(s) },
    querySelector: selector => selector === 'script[data-symphoria-cloudflare-analytics="true"]' ? scripts.find(s => !s.removed) || null : null,
    createElement: tag => ({ tagName: String(tag).toUpperCase(), dataset: {}, remove() { this.removed = true; } }),
  };
  return { windowObject: { location }, documentObject, scripts };
}

test('analytics solo se permite con bandera, revisión de privacidad y token válidos', () => {
  assert.equal(isCloudflareAnalyticsAllowed({ enabled: false, privacyReviewed: true, token: TOKEN }), false);
  assert.equal(isCloudflareAnalyticsAllowed({ enabled: true, privacyReviewed: false, token: TOKEN }), false);
  assert.equal(isCloudflareAnalyticsAllowed({ enabled: true, privacyReviewed: true, token: '' }), false);
  assert.equal(isCloudflareAnalyticsAllowed({ enabled: true, privacyReviewed: true, token: TOKEN }), true);
  assert.equal(isValidCloudflareAnalyticsToken('token con espacios'), false);
});

test('no mide rutas privadas, APIs ni URLs con query/hash', () => {
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/chat.html', search: '', hash: '' }), true);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/chat.html', search: '?code=secret', hash: '' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/chat.html', search: '', hash: '#token=secret' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/pulsem.html', search: '', hash: '' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/api/chat', search: '', hash: '' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/sintetico.html', search: '', hash: '' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/account/sammuel', search: '', hash: '' }), false);
  assert.equal(isTrackableAnalyticsLocation({ pathname: '/unknown-content-slug', search: '', hash: '' }), false);
});

test('el beacon no se carga hasta que se invoca explícitamente y usa el formato manual oficial', () => {
  const browser = fakeBrowser();
  assert.equal(browser.scripts.length, 0);
  assert.equal(loadCloudflareWebAnalytics({ ...browser, token: TOKEN }), true);
  assert.equal(browser.scripts.length, 1);
  const script = browser.scripts[0];
  assert.equal(script.src, 'https://static.cloudflareinsights.com/beacon.min.js');
  assert.equal(script.type, 'module');
  assert.equal(script.dataset.symphoriaCloudflareAnalytics, 'true');
  assert.deepEqual(JSON.parse(script.dataset.cfBeacon), { token: TOKEN, spa: false });
});

test('carga idempotente: no duplica el beacon', () => {
  const browser = fakeBrowser();
  assert.equal(loadCloudflareWebAnalytics({ ...browser, token: TOKEN }), true);
  assert.equal(loadCloudflareWebAnalytics({ ...browser, token: TOKEN }), true);
  assert.equal(browser.scripts.length, 1);
});

test('omite referrers que contienen query/hash o rutas privadas', () => {
  assert.equal(isSafeAnalyticsReferrer('https://example.com/chat.html'), true);
  assert.equal(isSafeAnalyticsReferrer(''), true);
  assert.equal(isSafeAnalyticsReferrer('https://example.com/callback?code=secret'), false);
  assert.equal(isSafeAnalyticsReferrer('https://example.com/chat.html#token=secret'), false);
  assert.equal(isSafeAnalyticsReferrer('https://example.com/pulsem.html'), false);
  assert.equal(isSafeAnalyticsReferrer('https://example.com/profile/private-name'), false);
  assert.equal(isSafeAnalyticsReferrer('https://person:secret@example.com/chat.html'), false);
  assert.equal(isSafeAnalyticsReferrer('not a url'), false);
});

test('bloquea carga ante URL no apta o token inválido', () => {
  const queryBrowser = fakeBrowser({ pathname: '/chat.html', search: '?prompt=private', hash: '' });
  assert.equal(loadCloudflareWebAnalytics({ ...queryBrowser, token: TOKEN }), false);
  assert.equal(queryBrowser.scripts.length, 0);
  const referrerBrowser = fakeBrowser();
  referrerBrowser.documentObject.referrer = 'https://example.com/auth/callback?code=private';
  assert.equal(loadCloudflareWebAnalytics({ ...referrerBrowser, token: TOKEN }), false);
  assert.equal(referrerBrowser.scripts.length, 0);
  const badTokenBrowser = fakeBrowser();
  assert.equal(loadCloudflareWebAnalytics({ ...badTokenBrowser, token: 'bad' }), false);
  assert.equal(badTokenBrowser.scripts.length, 0);
});

test('consentimiento se guarda solo como decisión y expira a los 180 días', () => {
  const storage = memoryStorage();
  const now = 1_800_000_000_000;
  assert.equal(readCloudflareAnalyticsChoice(storage, now), null);
  assert.equal(writeCloudflareAnalyticsChoice(storage, 'granted', now), true);
  assert.equal(readCloudflareAnalyticsChoice(storage, now + CF_ANALYTICS_CHOICE_MAX_AGE_MS - 1), 'granted');
  assert.equal(readCloudflareAnalyticsChoice(storage, now + CF_ANALYTICS_CHOICE_MAX_AGE_MS + 1), null);
  assert.equal(storage.getItem(CF_ANALYTICS_CONSENT_KEY), null);
  writeCloudflareAnalyticsChoice(storage, 'denied', now);
  assert.equal(readCloudflareAnalyticsChoice(storage, now), 'denied');
  const record = JSON.parse(storage.getItem(CF_ANALYTICS_CONSENT_KEY));
  assert.deepEqual(Object.keys(record).sort(), ['choice', 'updatedAt', 'version']);
});

test('rechazo/revocación retira el script y guarda la preferencia de rechazo', () => {
  const browser = fakeBrowser();
  const storage = memoryStorage();
  loadCloudflareWebAnalytics({ ...browser, token: TOKEN });
  const result = revokeCloudflareWebAnalytics({ ...browser, storage, now: 42 });
  assert.equal(result.stored, true);
  assert.equal(result.wasLoaded, true);
  assert.equal(result.shouldReload, true);
  assert.equal(browser.scripts[0].removed, true);
  assert.equal(readCloudflareAnalyticsChoice(storage, 42), 'denied');
  assert.equal(removeCloudflareWebAnalyticsScript(browser.documentObject), false);
});

test('error de carga elimina el script fallido sin afectar la aplicación', () => {
  const browser = fakeBrowser();
  loadCloudflareWebAnalytics({ ...browser, token: TOKEN });
  browser.scripts[0].onerror();
  assert.equal(browser.scripts[0].removed, true);
});

test('la implementación no incorpora sesiones, mapas de calor, eventos personalizados ni IDs de usuarios', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const moduleSource = fs.readFileSync(path.join(root, 'next/lib/cloudflare-analytics.mjs'), 'utf8');
  const componentSource = fs.readFileSync(path.join(root, 'next/componentes/AnalyticsConsent.jsx'), 'utf8');
  const combined = `${moduleSource}\n${componentSource}`;
  assert.doesNotMatch(combined, /\b(?:identify|trackEvent|trackPageView)\s*\(|(?:userId|emailAddress)\s*:/i);
  assert.match(combined, /static\.cloudflareinsights\.com\/beacon\.min\.js/);
});

test('Clarity permanece desactivado por defecto en ejemplo de producción', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const env = fs.readFileSync(path.join(root, 'next/.env.example'), 'utf8');
  assert.match(env, /NEXT_PUBLIC_CLARITY_ENABLED=false/);
  assert.match(env, /NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED=false/);
});

test('la build falla si se marca habilitada sin revisión y token válidos', async () => {
  const { spawnSync } = await import('node:child_process');
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const script = "import('./next/next.config.mjs')";
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: root, encoding: 'utf8', env: { ...process.env,
      NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED: 'false',
      NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN: TOKEN,
      NEXT_PUBLIC_CLARITY_ENABLED: 'false',
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Cloudflare Web Analytics.*revisión de privacidad/i);
});

test('la build admite Cloudflare Web Analytics solo con revisión marcada y token válido', async () => {
  const { spawnSync } = await import('node:child_process');
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import('./next/next.config.mjs')"], {
    cwd: root, encoding: 'utf8', env: { ...process.env,
      NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED: 'true',
      NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED: 'true',
      NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN: TOKEN,
      NEXT_PUBLIC_CLARITY_ENABLED: 'false',
    },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
