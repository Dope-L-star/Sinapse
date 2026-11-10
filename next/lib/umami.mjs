/* v4.3 (8 nov) · Umami: cuenta visitas sin cookies (pedido de Sammuel). Va en TODAS las páginas (sitio, legales, Pulsem y Gestión).
   · No usa cookies ni guarda nada en el equipo: solo cuenta páginas vistas, de dónde llegan y el tipo de equipo.
   · Respeta el aviso de cookies que ya existe: si la persona tocó «Rechazar», Umami no se carga (y su propio interruptor
     localStorage «umami.disabled» queda puesto, así tampoco cuenta nada si ya estaba cargado).
   · Respeta «No rastrear» del navegador (data-do-not-track) y solo cuenta en el sitio publicado (data-domains): en local no cuenta.
   · Para apagarlo sin tocar código: NEXT_PUBLIC_UMAMI=off al armar. */
export const UMAMI_SRC = 'https://cloud.umami.is/script.js';
export const UMAMI_ID = 'f07649c8-d8ba-4bcc-a1b7-915fd65b9b8c';
export const UMAMI_DOMAINS = 'sinapse.pages.dev';
export const UMAMI_OPT_OUT_KEY = 'umami.disabled';

export function umamiOn(env = {}) { return String(env.NEXT_PUBLIC_UMAMI || '').toLowerCase() !== 'off'; }

/* el código en línea que va en el <head>: decide y agrega la etiqueta de Umami (defer) */
export const umamiJs = `(function(){try{var r=localStorage.getItem('symphoria:clarity-consent:v2'),c=r&&JSON.parse(r).choice;if(c==='denied'||c==='minor'||localStorage.getItem('${UMAMI_OPT_OUT_KEY}'))return;}catch(e){}if(document.querySelector('script[data-website-id="${UMAMI_ID}"]'))return;var s=document.createElement('script');s.defer=true;s.src='${UMAMI_SRC}';s.setAttribute('data-website-id','${UMAMI_ID}');s.setAttribute('data-domains','${UMAMI_DOMAINS}');s.setAttribute('data-do-not-track','true');(document.head||document.documentElement).appendChild(s);})();`;

/* lo llama el aviso de cookies: «Rechazar» apaga Umami, «Aceptar» lo deja contar otra vez */
export function setUmamiOptOut(storage, out) {
  if (!storage) return false;
  try { if (out) storage.setItem(UMAMI_OPT_OUT_KEY, '1'); else storage.removeItem(UMAMI_OPT_OUT_KEY); return true; } catch { return false; }
}
