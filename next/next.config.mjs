/* Next.js en modo export estático. Este segundo guard también cubre variables cargadas desde .env.* por Next. */
import { CLARITY_PROJECT_ID_DEFAULT, isClarityAllowed, clarityModeFromEnv } from './lib/clarity-client.mjs';
import { isCloudflareAnalyticsAllowed } from './lib/cloudflare-analytics.mjs';

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
  throw new Error('Build bloqueado: Microsoft Clarity requiere release solo 18+, edición adulta, control de edad validado, privacidad revisada e ID válido.');
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


export default {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: false,
  poweredByHeader: false,
  reactStrictMode: true,
};
