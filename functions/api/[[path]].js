/* Ejecuta los handlers de la API en Cloudflare Pages Functions. */
const RUTAS = {
  ai: () => import('../../api/ai.js'),
  alias: () => import('../../api/alias.js'),
  auth: () => import('../../api/auth.js'),
  chat: () => import('../../api/chat.js'),
  chats: () => import('../../api/chats.js'),
  config: () => import('../../api/config.js'),
  csp: () => import('../../api/csp.js'),
  health: () => import('../../api/health.js'),
  help: () => import('../../api/help.js'),
  me: () => import('../../api/me.js'),
  teams: () => import('../../api/teams.js'),
  trial: () => import('../../api/trial.js')
};
let pasado = false;
function prestarEntorno(env) {
  if (pasado) return;
  for (const [k, v] of Object.entries(env)) if (typeof v === 'string' && !(k in process.env)) process.env[k] = v;
  pasado = true;
}

export async function onRequest({ request, env, params }) {
  const nombre = String((params.path || [])[0] || '');
  const cargar = Object.hasOwn(RUTAS, nombre) && RUTAS[nombre];
  if (!cargar) return new Response(JSON.stringify({ ok: false, error: 'No existe.' }), { status: 404, headers: { 'content-type': 'application/json; charset=utf-8' } });
  prestarEntorno(env);
  const h = new Headers(request.headers);
  for (const k of ['x-sz-proxy', 'x-sz-ip', 'x-forwarded-for']) h.delete(k);
  h.set('x-real-ip', request.headers.get('cf-connecting-ip') || 'x');   /* api/_lib.js ipOf lee x-real-ip (en Vercel lo pone la plataforma; aquí no se acepta el del cliente) */
  const mod = (await cargar()).default;
  return mod.fetch(new Request(request, { headers: h }));
}
