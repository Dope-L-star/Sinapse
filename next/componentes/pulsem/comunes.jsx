'use client';
/* Piezas pequeñas de la puerta de Pulsem. */
export const rc = (r) => String(r || '').toLowerCase();

/* HTML que arma core.js (logo, íconos): es nuestro, no de usuarios. */
export function Html({ as: Tag = 'span', html, ...rest }) {
  return <Tag {...rest} dangerouslySetInnerHTML={{ __html: html || '' }} />;
}
