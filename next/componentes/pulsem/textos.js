/* Pulsem en React · textos de la puerta y la cabecera en español e inglés (los del panel están en ../admin/textos.mjs).
   Cambian al instante (sin recargar) cuando cambia <html lang>. */

const es = {
  back: 'Volver a SymphorIA',
  refresh: 'Actualizar ahora',
  toFlow: 'Ir a SynthFlow',
  langBtn: 'English',
  langAria: 'Cambiar idioma a inglés',
  connecting: 'conectando…',
  liveNow: 'en vivo · ahora',
  liveAgo: (a) => 'en vivo · ' + a,
  offline: 'sin conexión',
  upToDate: 'Pulsem al día.',
  opening: 'Abriendo Pulsem…',
  oneMoment: 'Un momento.',
  gateTeam: 'PULSEM · SOLO EL EQUIPO',
  gateLoginH: 'Entra con tu cuenta del equipo',
  gateLoginP: 'El Pulsem muestra cómo está SymphorIA por dentro. Solo pueden verlo las cuentas Prime, ZFlow y Symmetrix.',
  gateTeamH: 'Esta página es del equipo',
  gateTeamP: 'Solo las cuentas con rango Prime, ZFlow o Symmetrix pueden ver Pulsem. Si necesitas ayuda, escríbele al equipo desde SynthonIA.',
  gateErrH: 'No pude abrir Pulsem',
  gateErrP: 'Revisa tu conexión e inténtalo de nuevo.',
  retry: 'Reintentar',
  popupBlocked: 'Tu navegador bloqueó la ventana. Permite las ventanas emergentes de este sitio.',
  ago: (s) => s < 60 ? 'hace ' + s + ' s' : s < 3600 ? 'hace ' + Math.round(s / 60) + ' min' : s < 86400 ? 'hace ' + Math.round(s / 3600) + ' h' : 'hace ' + Math.round(s / 86400) + ' d',
};

const en = {
  back: 'Back to SymphorIA',
  refresh: 'Refresh now',
  toFlow: 'Go to SynthFlow',
  langBtn: 'Español',
  langAria: 'Switch language to Spanish',
  connecting: 'connecting…',
  liveNow: 'live · now',
  liveAgo: (a) => 'live · ' + a,
  offline: 'offline',
  upToDate: 'Pulsem is up to date.',
  opening: 'Opening Pulsem…',
  oneMoment: 'One moment.',
  gateTeam: 'PULSEM · TEAM ONLY',
  gateLoginH: 'Sign in with your team account',
  gateLoginP: 'Pulsem shows how SymphorIA is doing inside. Only Prime, ZFlow and Symmetrix accounts can see it.',
  gateTeamH: 'This page is for the team',
  gateTeamP: 'Only Prime, ZFlow or Symmetrix accounts can see Pulsem. If you need help, write to the team from SynthonIA.',
  gateErrH: 'I couldn’t open Pulsem',
  gateErrP: 'Check your connection and try again.',
  retry: 'Try again',
  popupBlocked: 'Your browser blocked the window. Allow pop-ups for this site.',
  ago: (s) => s < 60 ? s + ' s ago' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago',
};

export const TEXTOS = { es, en };

/* tx(lang) → el diccionario del idioma, con números y fechas en su formato */
export function tx(lang) {
  const L = TEXTOS[lang] || es;
  return Object.assign({}, L, {
    lang,
    agoT: (t) => L.ago(Math.max(0, Math.round((Date.now() - t) / 1000))),
  });
}
