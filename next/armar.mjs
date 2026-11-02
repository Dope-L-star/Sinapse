/* Arma SymphorIA con Next.js. Uso (desde la raíz del repo):  node next/armar.mjs
   1. node build.mjs --dist  → dist/ (las páginas de siempre, minificadas)
   2. dist/ → next/public/   (menos las páginas que ya están hechas en Next: ver HECHAS)
   3. instala Next si falta (npm ci dentro de next/) y corre «next build»
   Resultado: next/out/ = la página completa, estática, lista para Cloudflare Pages (o cualquier hosting).
   /api no está aquí: lo sirve Vercel o la función de Cloudflare, con las mismas rutas /api/… */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLARITY_PROJECT_ID_DEFAULT, isClarityAllowed, clarityModeFromEnv } from './lib/clarity-client.mjs';
import { isCloudflareAnalyticsAllowed } from './lib/cloudflare-analytics.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url)), raiz = path.resolve(aqui, '..');
const clarityRequested = process.env.NEXT_PUBLIC_CLARITY_ENABLED === 'true';
const clarityBuildAllowed = isClarityAllowed({
  enabled: clarityRequested,
  audience18Plus: process.env.NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS === 'true',
  adultOnlyRelease: process.env.NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE === 'true',
  ageControlVerified: process.env.NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED === 'true',
  privacyReviewed: process.env.NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED === 'true',
  projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || CLARITY_PROJECT_ID_DEFAULT,
});
/* v3.8 · también vale el modo con pregunta de edad (NEXT_PUBLIC_CLARITY_AGE_GATE): solo 18+ pueden aceptar */
if (clarityRequested && !clarityBuildAllowed && clarityModeFromEnv(process.env) !== 'age-gate') {
  throw new Error('Clarity está solicitado, pero faltan condiciones de release: audiencia 18+, versión adulta real, control de edad validado, privacidad revisada e ID de proyecto válido. No se ha publicado nada.');
}
const cfAnalyticsRequested = process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_ENABLED === 'true';
const cfAnalyticsAllowed = isCloudflareAnalyticsAllowed({
  enabled: cfAnalyticsRequested,
  privacyReviewed: process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_PRIVACY_REVIEWED === 'true',
  token: process.env.NEXT_PUBLIC_CF_WEB_ANALYTICS_TOKEN || '',
});
if (cfAnalyticsRequested && !cfAnalyticsAllowed) {
  throw new Error('Build bloqueado: Cloudflare Web Analytics está solicitado, pero falta la revisión de privacidad o un token de sitio válido.');
}

/* páginas que ya pasaron a Next.js (app/<nombre>/page.jsx → out/<nombre>.html). Al pasar otra, se agrega aquí. */
const HECHAS = ['index.html', 'chat.html', 'alias.html', 'ayuda.html', 'offline.html', 'terminos.html', 'privacidad.html', 'pulsem.html', 'gestion.html'];
const corre = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

// Evita publicar un árbol React desactualizado respecto de las páginas fuente.
corre(process.execPath, [path.join(aqui, 'verificar-migracion.mjs')], raiz);

corre(process.execPath, ['build.mjs', '--dist'], raiz);
const pub = path.join(aqui, 'public');
fs.rmSync(pub, { recursive: true, force: true });
fs.cpSync(path.join(raiz, 'dist'), pub, { recursive: true });
for (const f of HECHAS) fs.rmSync(path.join(pub, f), { force: true });

if (!fs.existsSync(path.join(aqui, 'node_modules', 'next', 'dist', 'bin', 'next'))) corre('npm', ['ci', '--no-audit', '--no-fund'], aqui);
fs.rmSync(path.join(aqui, 'out'), { recursive: true, force: true });
corre(process.execPath, [path.join(aqui, 'node_modules', 'next', 'dist', 'bin', 'next'), 'build'], aqui);
for (const f of HECHAS) if (!fs.existsSync(path.join(aqui, 'out', f))) throw new Error('Next no generó ' + f);
for (const f of ['chat.html', 'alias.html', 'ayuda.html', 'offline.html', 'pulsem.html', 'privacidad.html', 'terminos.html', 'index.html']) {
  const p = path.join(aqui, 'out', f);
  if (!fs.existsSync(p)) throw new Error('Falta ruta React exportada: ' + f);
}
console.log('Listo: next/out (' + fs.readdirSync(path.join(aqui, 'out')).length + ' entradas)');
