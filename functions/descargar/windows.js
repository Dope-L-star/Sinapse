/* /descargar/windows: baja Obertura (el instalador de Windows) desde dentro de la página, sin ir a GitHub a mano.
   Busca el release más nuevo con etiqueta obertura-vX.Y.Z (lo publica .github/workflows/obertura.yml) y manda
   directo al .exe. Con ?info=1 devuelve {ok, version, tam} para que la página muestre la versión y el peso.
   La respuesta de GitHub se guarda 15 minutos (su API gratis permite pocas consultas por hora). */
const REPO = 'Dope-L-star/SynthZ-Style', PREFIJO = 'obertura-v', EXE = 'SymphorIA-Obertura.exe';

const partes = v => String(v).split('-')[0].split('.').map(n => +n || 0);
const mayor = (a, b) => { const x = partes(a), y = partes(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

export function elegir(releases){
  let mejor = null;
  for (const r of Array.isArray(releases) ? releases : []){
    if (!r || r.draft || r.prerelease || !String(r.tag_name || '').startsWith(PREFIJO)) continue;
    const a = (r.assets || []).find(x => x && x.name === EXE);
    if (!a || !/^https:\/\/github\.com\//.test(a.browser_download_url || '')) continue;
    const v = r.tag_name.slice(PREFIJO.length);
    if (!mejor || mayor(v, mejor.version)) mejor = { version: v, url: a.browser_download_url, tam: a.size || 0 };
  }
  return mejor;
}

async function ultima(ctx){
  const cache = caches.default, clave = new Request('https://cache.symphoria/obertura-ultima');
  const guardada = await cache.match(clave);
  if (guardada) return guardada.json();
  let dato = null;
  try{
    const r = await fetch('https://api.github.com/repos/' + REPO + '/releases?per_page=30', {
      headers: { 'User-Agent': 'SymphorIA-descargas', Accept: 'application/vnd.github+json' } });
    if (r.ok) dato = elegir(await r.json());
    else if (r.status !== 404) return null;   /* GitHub ocupado o límite: no se guarda, se reintenta luego */
  }catch(e){ return null; }
  const resp = new Response(JSON.stringify(dato), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=900' } });
  ctx.waitUntil(cache.put(clave, resp.clone()));
  return dato;
}

const PRONTO = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SymphorIA para Windows · muy pronto</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#07060f;color:#f3f1ff;font:16px/1.5 system-ui,sans-serif;text-align:center;padding:24px">
<div><h1 style="font-size:24px;margin:0 0 8px">SymphorIA para Windows llega muy pronto</h1>
<p style="color:#b6b1d6;margin:0 0 4px">Mientras tanto puedes usarla desde el navegador o instalarla como app desde el menú.</p>
<p style="color:#7d78a3;margin:0 0 18px">SymphorIA for Windows is coming very soon. Meanwhile, use it in your browser or install it as an app from the menu.</p>
<a href="/chat.html" style="color:#3de0ff">Abrir SymphorIA · Open SymphorIA</a></div></body></html>`;

export async function onRequestGet(ctx){
  const url = new URL(ctx.request.url);
  const d = await ultima(ctx);
  if (url.searchParams.has('info')){
    return new Response(JSON.stringify(d ? { ok: true, version: d.version, tam: d.tam } : { ok: false }),
      { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
  }
  if (!d) return new Response(PRONTO, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Retry-After': '3600' } });
  return Response.redirect(d.url, 302);
}
