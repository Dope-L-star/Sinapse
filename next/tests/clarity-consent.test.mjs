import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CLARITY_CONSENT_KEY,
  CLARITY_GRANT_MAX_AGE_MS,
  CLARITY_PROJECT_ID_DEFAULT,
  clearFirstPartyClarityCookies,
  isClarityAllowed,
  loadClarity,
  readClarityChoice,
  revokeClarity,
  writeClarityChoice,
} from '../lib/clarity-client.mjs';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: key => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
    _map: map,
  };
}

function fakeBrowser() {
  const appended = [];
  const selectors = new Set();
  const cookieWrites = [];
  const documentObject = {
    location: { hostname: 'symphoria.example' },
    head: { appendChild: script => { appended.push(script); selectors.add(`script[data-symphoria-clarity="true"],script[src="${script.src}"]`); } },
    querySelector: selector => selectors.has(selector) ? appended[0] || {} : null,
    createElement: tag => ({ tagName: tag.toUpperCase(), dataset: {}, remove() { this.removed = true; } }),
  };
  Object.defineProperty(documentObject, 'cookie', {
    get() { return ''; },
    set(value) { cookieWrites.push(String(value)); },
    configurable: true,
  });
  return { windowObject: {}, documentObject, appended, cookieWrites };
}

const validRelease = {
  enabled: true,
  audience18Plus: true,
  adultOnlyRelease: true,
  ageControlVerified: true,
  privacyReviewed: true,
  projectId: CLARITY_PROJECT_ID_DEFAULT,
};

test('Clarity queda bloqueado si una de las condiciones de release no está marcada', () => {
  assert.equal(isClarityAllowed({ ...validRelease, enabled: false }), false);
  assert.equal(isClarityAllowed({ ...validRelease, audience18Plus: false }), false);
  assert.equal(isClarityAllowed({ ...validRelease, adultOnlyRelease: false }), false);
  assert.equal(isClarityAllowed({ ...validRelease, ageControlVerified: false }), false);
  assert.equal(isClarityAllowed({ ...validRelease, privacyReviewed: false }), false);
  assert.equal(isClarityAllowed({ ...validRelease, projectId: 'https://evil.example/a' }), false);
  assert.equal(isClarityAllowed(validRelease), true);
});

test('ningún script se inserta hasta que la función de carga se llama después del consentimiento', () => {
  const browser = fakeBrowser();
  assert.equal(browser.appended.length, 0);
  assert.equal(loadClarity({ ...browser, projectId: CLARITY_PROJECT_ID_DEFAULT }), true);
  assert.equal(browser.appended.length, 1);
  assert.equal(browser.appended[0].src, 'https://www.clarity.ms/tag/z5es3kuqoz');
  assert.equal(browser.appended[0].async, true);
  assert.equal(browser.appended[0].dataset.symphoriaClarity, 'true');
  assert.deepEqual(browser.windowObject.clarity.q[0], ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' }]);
});

test('no acepta un ID inválido ni inserta el script', () => {
  const browser = fakeBrowser();
  assert.equal(loadClarity({ ...browser, projectId: 'not a project id' }), false);
  assert.equal(browser.appended.length, 0);
});

test('consentimiento aceptado vence a los 180 días y rechazo persiste hasta cambiarlo', () => {
  const storage = memoryStorage();
  const now = 1_800_000_000_000;
  assert.equal(readClarityChoice(storage, now), null);
  assert.equal(writeClarityChoice(storage, 'granted', now), true);
  assert.equal(readClarityChoice(storage, now + CLARITY_GRANT_MAX_AGE_MS - 1), 'granted');
  assert.equal(readClarityChoice(storage, now + CLARITY_GRANT_MAX_AGE_MS + 1), null);
  assert.equal(storage.getItem(CLARITY_CONSENT_KEY), null);
  writeClarityChoice(storage, 'denied', now);
  assert.equal(readClarityChoice(storage, now + CLARITY_GRANT_MAX_AGE_MS * 2), 'denied');
});

test('rechazo/revocación envía Consent V2 denegado, borra cookies y guarda la decisión', () => {
  const storage = memoryStorage();
  const calls = [];
  const browser = fakeBrowser();
  const windowObject = { clarity(...args) { calls.push(args); } };
  assert.equal(revokeClarity({ windowObject, documentObject: browser.documentObject, storage, now: 42 }), true);
  assert.deepEqual(calls, [
    ['consentv2', { ad_Storage: 'denied', analytics_Storage: 'denied' }],
    ['consent', false],
  ]);
  assert.equal(readClarityChoice(storage, 42), 'denied');
  assert.ok(browser.cookieWrites.some(value => value.startsWith('_clck=')));
  assert.ok(browser.cookieWrites.some(value => value.startsWith('_clsk=')));
});

test('error de carga permite retirar el script y limpiar el stub', () => {
  const browser = fakeBrowser();
  loadClarity({ ...browser, projectId: CLARITY_PROJECT_ID_DEFAULT });
  const script = browser.appended[0];
  script.onerror();
  assert.equal(script.removed, true);
  assert.equal('clarity' in browser.windowObject, false);
});


test('la limpieza de cookies de primera parte no necesita descargar el script de Clarity', () => {
  const browser = fakeBrowser();
  clearFirstPartyClarityCookies(browser.documentObject);
  assert.equal(browser.appended.length, 0);
  assert.ok(browser.cookieWrites.some(value => value.startsWith('_clck=') && value.includes('Max-Age=0')));
  assert.ok(browser.cookieWrites.some(value => value.startsWith('_clsk=') && value.includes('Max-Age=0')));
});

test('el build de Pages falla cerrado si se enciende Clarity sin los demás flags', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const armar = path.join(root, 'next', 'armar.mjs');
  const result = spawnSync(process.execPath, [armar], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXT_PUBLIC_CLARITY_ENABLED: 'true',
      NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS: 'false',
      NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE: 'false',
      NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED: 'false',
      NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'false',
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /faltan condiciones de release/i);
});

test('la configuración de Next también bloquea una activación incompleta', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import('./next/next.config.mjs')"], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXT_PUBLIC_CLARITY_ENABLED: 'true',
      NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS: 'false',
      NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE: 'false',
      NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED: 'false',
      NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'false',
    },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /Build bloqueado/i);
});


test('la configuración admite las cinco condiciones completas para una futura build adulta aprobada', () => {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(thisDir, '../..');
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import('./next/next.config.mjs')"], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      NEXT_PUBLIC_CLARITY_ENABLED: 'true',
      NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS: 'true',
      NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE: 'true',
      NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED: 'true',
      NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'true',
      NEXT_PUBLIC_CLARITY_PROJECT_ID: 'z5es3kuqoz',
    },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});

/* v3.8 · modo de mapas de calor (web abierta): aviso de cookies simple, toda la página enmascarada */
import { clarityModeFromEnv, isClarityHeatmapsAllowed, maskWholePage } from '../lib/clarity-client.mjs';

test('el modo de mapas de calor necesita su propia bandera, privacidad revisada e ID válido', () => {
  const base = { NEXT_PUBLIC_CLARITY_ENABLED: 'true', NEXT_PUBLIC_CLARITY_HEATMAPS: 'true', NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'true' };
  assert.equal(clarityModeFromEnv({}), null);
  assert.equal(clarityModeFromEnv(base), 'heatmaps');
  assert.equal(clarityModeFromEnv({ ...base, NEXT_PUBLIC_CLARITY_ENABLED: 'false' }), null);
  assert.equal(clarityModeFromEnv({ ...base, NEXT_PUBLIC_CLARITY_HEATMAPS: 'false' }), null);
  assert.equal(clarityModeFromEnv({ ...base, NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'false' }), null);
  assert.equal(clarityModeFromEnv({ ...base, NEXT_PUBLIC_CLARITY_PROJECT_ID: 'https://evil.example/a' }), null);
  assert.equal(isClarityHeatmapsAllowed({ enabled: true, heatmaps: true, privacyReviewed: true, projectId: CLARITY_PROJECT_ID_DEFAULT }), true);
  const adult = { NEXT_PUBLIC_CLARITY_ENABLED: 'true', NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS: 'true', NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE: 'true', NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED: 'true', NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED: 'true' };
  assert.equal(clarityModeFromEnv(adult), 'adult');
});

test('una respuesta vieja de «menor» se sigue leyendo y nunca cuenta como permiso', () => {
  const storage = memoryStorage();
  assert.equal(writeClarityChoice(storage, 'minor'), true);
  assert.equal(readClarityChoice(storage), 'minor');
  assert.equal(writeClarityChoice(storage, 'otra-cosa'), false);
});

test('enmascarar toda la página marca el body para Clarity', () => {
  const attrs = {};
  assert.equal(maskWholePage({ body: { setAttribute: (k, v) => { attrs[k] = v; } } }), true);
  assert.equal(attrs['data-clarity-mask'], 'true');
  assert.equal(maskWholePage(null), false);
});

test('en modo mapas de calor el «aceptar» no vence: el aviso sale una sola vez', () => {
  const storage = memoryStorage();
  writeClarityChoice(storage, 'granted', 1000);
  const later = 1000 + CLARITY_GRANT_MAX_AGE_MS * 5;
  assert.equal(readClarityChoice(storage, later, { maxAgeMs: null }), 'granted');
  assert.equal(readClarityChoice(storage, later), null);   /* el modo adulto sigue renovando a los 180 días */
});
