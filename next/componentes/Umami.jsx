/* v4.3 · Umami en el <head> de cada marco (ver next/lib/umami.mjs). Va en línea: la CSP ya permite 'unsafe-inline' y https://cloud.umami.is */
import { umamiJs, umamiOn } from '../lib/umami.mjs';

const ON = umamiOn({ NEXT_PUBLIC_UMAMI: process.env.NEXT_PUBLIC_UMAMI });

export default function Umami() {
  if (!ON) return null;
  return <script id="umami-carga" dangerouslySetInnerHTML={{ __html: umamiJs }} />;
}
