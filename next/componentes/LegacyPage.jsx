import { preload } from 'react-dom';
import ReactTree from './ReactTree';
import LegacyRuntime from './LegacyRuntime';
import SynthonIAHost from './SynthonIAHost';
import { versionado } from '../lib/versiones.mjs';

/**
 * Estructura visual renderizada mediante elementos React reales.
 * El runtime de compatibilidad se mantiene temporalmente para no romper los
 * manejadores heredados mientras los subsistemas se trasladan a hooks.
 *
 * Fase 4 · velocidad: los motores heredados (core.js, chat.js…) se anuncian en el <head> con
 * «preload», así el navegador los baja en paralelo con React en vez de esperar a la hidratación
 * y bajarlos de uno en uno. LegacyRuntime los sigue ejecutando en el mismo orden de siempre.
 * Las URLs llevan la huella del archivo (/v/<huella>/core.js, ver lib/versiones.mjs) para que
 * Cloudflare y el navegador los guarden un año sin volver a preguntar.
 */
export default function LegacyPage({
  page,
  tree,
  stylesheets = [],
  inlineStyle = '',
  scripts = [],
  puter = false,
  children = null,
}) {
  const scriptUrls = scripts.map(versionado);
  for (const src of scriptUrls) preload(src, { as: 'script' });
  /* SynthFlow espera a SynthonIA (core.js la trae con su propio cargador): que ya esté bajada cuando la pida */
  if (page === 'chat') preload('/synthonia.js', { as: 'script', fetchPriority: 'low' });
  return (
    <>
      {stylesheets.map((href) => <link rel="stylesheet" href={versionado(href)} precedence="default" key={href} />)}
      {inlineStyle ? <style data-page-style={page} dangerouslySetInnerHTML={{ __html: inlineStyle }} /> : null}
      {tree ? <ReactTree nodes={tree} /> : children}
      {page === 'chat' ? <SynthonIAHost /> : null}
      <LegacyRuntime page={page} scripts={scriptUrls} puter={puter} />
    </>
  );
}
