/* ---------- v2.7 · íconos de vidrio, dibujados en código (SVG) ----------
   Parecidos a los del boceto: un dibujo de neón (relleno de vidrio, trazo en degradado y su brillo)
   sobre una ficha de vidrio casi transparente con el filo iridiscente. No son imágenes: pesan casi nada,
   se ven nítidos en cualquier tamaño y se mueven un poco cuando pasas el mouse por su tarjeta.
   En el HTML: <i class="gi" data-gi="rayo"></i>; con data-gt="0" va sin ficha. giFill(raíz) los dibuja.
   Todos usan el mismo lienzo de 64 × 64, por eso los degradados se comparten (userSpaceOnUse). */
const GI_COL = { C:['#f0feff', '#3de0ff', '#3a7bff'], V:['#ece4ff', '#9b7bff', '#ff3d9a'], O:['#ffe6b8', '#ff9a3d', '#ff3d9a'], P:['#ffd6ec', '#ff3d9a', '#8b5cff'],
  G:['#dcffee', '#3ddc97', '#139e8c'], B:['#dde9ff', '#5b8cff', '#7b3ff2'], R:['#ffd6dc', '#ff4d6d', '#c2185b'], Y:['#fff4cc', '#ffc857', '#ff7a45'], W:['#ffffff', '#cfe9ff', '#8fa3d9'] };
/* el color del brillo de cada uno */
const GI_GLOW = { C:'rgba(61,224,255,.8)', V:'rgba(155,123,255,.8)', O:'rgba(255,140,70,.8)', P:'rgba(255,61,154,.75)', G:'rgba(61,220,151,.75)', B:'rgba(91,140,255,.8)', R:'rgba(255,77,109,.8)', Y:'rgba(255,200,87,.75)', W:'rgba(207,233,255,.7)', M:'rgba(155,123,255,.8)' };
(function giDefs(){
  if (document.getElementById('giDefs')) return;
  const lin = (id, s) => '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="54" y2="58">' + s.map((c, i) => '<stop offset="' + (i / (s.length - 1)).toFixed(2) + '" stop-color="' + c + '"/>').join('') + '</linearGradient>';
  const d = document.createElement('div'); d.id = 'giDefs'; d.setAttribute('aria-hidden', 'true');
  d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML = '<svg width="0" height="0"><defs>' + Object.keys(GI_COL).map(k => lin('gi' + k, GI_COL[k])).join('')
    + lin('giM', ['#3de0ff', '#7b3ff2', '#ff3d9a', '#ff7a45'])
    /* la ficha: vidrio que deja ver el fondo, más claro arriba; el filo con los colores de la marca */
    + '<linearGradient id="giTile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>'
    + '<linearGradient id="giEdge" gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="60" y2="60"><stop offset="0" stop-color="#e6fdff" stop-opacity=".9"/><stop offset=".35" stop-color="#9b7bff" stop-opacity=".45"/><stop offset=".7" stop-color="#ff3d9a" stop-opacity=".35"/><stop offset="1" stop-color="#ffc857" stop-opacity=".7"/></linearGradient>'
    + '<radialGradient id="giLow" cx=".5" cy="1" r=".7"><stop offset="0" stop-color="#bff6ff" stop-opacity=".35"/><stop offset="1" stop-color="#bff6ff" stop-opacity="0"/></radialGradient>'
    + '</defs></svg>';
  (document.body || document.documentElement).appendChild(d);
})();
/* piezas: vidrio con trazo (P), solo trazo (L), brillo blanco (H), círculo de vidrio (C) y nodo que brilla (N) */
const giP = (d, k, o, w) => '<path d="' + d + '" fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .22 : o) + '" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giL = (d, k, w, cls) => '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="' + d + '" fill="none" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giH = d => '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.5"/>';
const giC = (x, y, r, k, o, w) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .22 : o) + '" stroke="url(#gi' + k + ')" stroke-width="' + (w || 2.6) + '"/>';
const giN = (x, y, r, k, i) => '<g class="gi-n gi-tw" style="--i:' + i + '"><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#gi' + k + ')"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * .38).toFixed(2) + '" fill="#fff"/></g>';
const GI_DOC = 'M19 7h19l13 13v32a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5V12a5 5 0 0 1 5-5z', GI_FOLD = 'M38 7v9a4 4 0 0 0 4 4h9';
const GI_INF = 'M32 32C28 25 24 21 19 21a11 11 0 0 0 0 22c5 0 9-4 13-11s8-11 13-11a11 11 0 0 1 0 22c-5 0-9-4-13-11z';
const GI_BRAIN = 'M31 13c-4-3-10-2-12 2-5 0-8 4-7 8-4 2-5 8-1 11-2 4 1 9 6 9 1 4 6 6 10 4 2 1 4 0 4-1z', GI_FOLDS = 'M24 19c3 1 4 4 3 7M16 28c4-1 7 1 8 4M20 39c2-2 6-2 7 1';
/* cada ícono: [color principal, dibujo] */
const GI = {
  rayo:   ['C', () => giP('M37 6L15 36h14l-4 22 24-32H35l2-20z', 'C', .26) + giH('M32 13L20 31')],
  charla: ['C', () => giP('M20 12h24a9 9 0 0 1 9 9v13a9 9 0 0 1-9 9H31l-10 9v-9a9 9 0 0 1-10-9V21a9 9 0 0 1 9-9z', 'C', .18)
            + [23, 32, 41].map((x, i) => '<circle class="gi-dot" style="--i:' + i + '" cx="' + x + '" cy="27.5" r="3" fill="#eafcff"/>').join('') + giH('M16 21q1-4 6-5')],
  /* SuperiorSynth: la Z fina de 7 puntos */
  superior: ['O', () => giL('M14 15H50L14 49H50', 'O', 9).replace('<path', '<path stroke-opacity=".16"') + giL('M14 15H50L14 49H50', 'O', 2.2)
            + [[14, 15], [32, 15], [50, 15], [32, 32], [14, 49], [32, 49], [50, 49]].map(([x, y], i) => giN(x, y, 3.6, i % 2 ? 'Y' : 'O', i)).join('')],
  /* A.L.I.A.S.: el bucle infinito de nodos */
  alias:  ['M', () => giL(GI_INF, 'M', 8).replace('<path', '<path stroke-opacity=".16"') + '<path d="M8 32h48M19 21v22M45 21v22" stroke="#bff6ff" stroke-opacity=".3" stroke-width="1"/>'
            + giL(GI_INF, 'M', 2.3) + giL(GI_INF, 'W', 2.3, 'gi-run').replace('<path', '<path pathLength="100"')
            + [[8, 32, 'C'], [19, 21, 'C'], [19, 43, 'V'], [32, 32, 'P'], [45, 21, 'P'], [45, 43, 'O'], [56, 32, 'O']].map(([x, y, k], i) => giN(x, y, 3.3, k, i)).join('')],
  globo:  ['B', () => giC(27, 27, 16, 'B', .2) + '<path d="M11 27h32M13.5 19h27M13.5 35h27M27 11c-7 5-7 27 0 32M27 11c7 5 7 27 0 32" fill="none" stroke="url(#giB)" stroke-width="1.6" stroke-opacity=".9"/>'
            + '<g class="gi-lens">' + giL('M49 49l8 8', 'O', 5.5) + giC(43, 43, 9, 'O', .14, 2.8) + giH('M38 40q2-4 6-4') + '</g>' + giH('M16 18q4-6 11-7')],
  docimg: ['V', () => giP(GI_DOC, 'V', .15) + giL(GI_FOLD, 'V', 2) + giP('M21 25h22v15H21z', 'O', .25, 1.8) + giL('M21 40l7-8 5 5 4-4 6 7', 'O', 1.8)
            + '<circle cx="38" cy="29.5" r="2.4" fill="#ffc857"/>' + giL('M21 46h22M21 51h14', 'V', 2)],
  ppt:    ['O', () => giP(GI_DOC, 'O', .15) + giL(GI_FOLD, 'O', 2) + giC(31, 32, 10, 'O', .22, 2.2) + '<path class="gi-pie" d="M31 32V22a10 10 0 0 1 10 10z" fill="url(#giY)" stroke="#fff" stroke-opacity=".6" stroke-width="1"/>'
            + giL('M21 47h21M21 52h13', 'O', 2)],
  paleta: ['Y', () => giP('M32 11C19 11 10 19 10 30c0 10 7 17 16 17 3 0 5-2 5-4.5 0-2.2-2-3.2-2-5.2 0-2.6 2.2-4.3 5-4.3h6c8 0 13-4.5 13-11C53 17 44 11 32 11z', 'Y', .14)
            + [[20, 27, 'P'], [26, 19, 'O'], [36, 17, 'G'], [45, 22, 'C'], [18, 37, 'V']].map(([x, y, k], i) => '<circle class="gi-tw" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="3.6" fill="url(#gi' + k + ')"/>').join('')
            + '<g class="gi-brush">' + giL('M56 8L41 25', 'B', 4.2) + giP('M41 25l-5 5c-2 2-5 2-6 6 3 0 6-1 8-3l5-5z', 'P', .8, 1.6) + '</g>'],
  voz:    ['C', () => giP('M12 25h9l13-10v34L21 39h-9z', 'C', .22) + giH('M15 28v8')
            + giL('M40 25q5 7 0 14', 'V', 2.8, 'gi-w') + giL('M45 19q9 13 0 26', 'V', 2.8, 'gi-w w2') + giL('M50 13q13 19 0 38', 'P', 2.8, 'gi-w w3')],
  cerebro: ['P', () => giP(GI_BRAIN, 'P', .2) + giL(GI_FOLDS, 'P', 1.7) + '<g transform="matrix(-1 0 0 1 64 0)">' + giP(GI_BRAIN, 'C', .2) + giL(GI_FOLDS, 'C', 1.7) + '</g>'
            + [[22, 24], [42, 22], [26, 36], [40, 38]].map(([x, y], i) => '<circle class="gi-tw" style="--i:' + i + '" cx="' + x + '" cy="' + y + '" r="1.8" fill="#fff"/>').join('')],
  nube:   ['C', () => giP('M19 47a10 10 0 0 1-1.5-19.9A14 14 0 0 1 44 23a11 11 0 0 1 2 24z', 'C', .18) + giH('M20 30q2-8 10-9')
            + '<g class="gi-sync">' + giL('M25 35a7 7 0 0 1 12-4.5M39 38a7 7 0 0 1-12 4.5', 'V', 2.2) + giL('M37.5 26.5v4.5H33M26.5 47v-4.5H31', 'V', 2.2) + '</g>'],
  celular: ['V', () => giP('M23 6h18a6 6 0 0 1 6 6v40a6 6 0 0 1-6 6H23a6 6 0 0 1-6-6V12a6 6 0 0 1 6-6z', 'V', .14) + giL('M29 11h6M29 53h6', 'V', 2)
            /* adentro, la carita de SynthonIA */
            + giC(32, 28, 9.5, 'C', .18, 1.8) + '<ellipse cx="32" cy="29" rx="6.6" ry="5.2" fill="#0b0719" stroke="#ff7ad0" stroke-opacity=".8" stroke-width=".9"/>'
            + '<g class="gi-eyes"><rect x="28.6" y="26.5" width="2.2" height="5" rx="1.1" fill="#3de0ff"/><rect x="33.2" y="26.5" width="2.2" height="5" rx="1.1" fill="#3de0ff"/></g>'
            + giP('M27 40h10a4 4 0 0 1 4 4v2H23v-2a4 4 0 0 1 4-4z', 'C', .2, 1.6)],
  lapiz:  ['O', () => giP('M44 9l11 11-29 29-14 3 3-14z', 'O', .2) + giL('M39 14l11 11', 'O', 2) + giH('M41 15L19 37') + giL('M30 56h24', 'C', 2.6, 'gi-ink').replace('<path', '<path pathLength="1"')],
  birrete: ['Y', () => giP('M17 30v10c0 4 7 8 15 8s15-4 15-8V30L32 37z', 'V', .18) + giP('M5 25L32 13l27 12-27 12z', 'Y', .24) + giH('M14 24l18-8')
            + '<g class="gi-tassel">' + giL('M52 28v12', 'O', 2) + '<circle cx="52" cy="42" r="2.6" fill="url(#giO)"/></g>'],
  codigo: ['P', () => giL('M23 19L11 32l12 13', 'P', 3.4) + giL('M41 19l12 13-12 13', 'C', 3.4) + giL('M36 13l-8 38', 'V', 2.6, 'gi-slash')],
  imagen: ['V', () => giP('M10 14h44a5 5 0 0 1 5 5v26a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V19a5 5 0 0 1 5-5z', 'V', .14) + giP('M7 47l15-17 10 10 7-7 18 14z', 'P', .32, 2)
            + '<circle class="gi-sun" cx="44" cy="25" r="4.2" fill="url(#giY)"/>' + giH('M10 19q0-2 3-2')],
  estrella: ['M', () => '<g class="gi-star">' + giP('M28 6c2 13 6 17 19 19-13 2-17 6-19 19-2-13-6-17-19-19 13-2 17-6 19-19z', 'M', .3, 2.2) + '</g>'
            + giP('M48 36c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z', 'C', .4, 1.8) + '<circle class="gi-tw" cx="13" cy="50" r="2.4" fill="url(#giO)"/>'],
  balanza: ['Y', () => giL('M32 13v37', 'Y', 2.8) + giP('M23 51h18l-2 5H25z', 'Y', .4, 2) + '<g class="gi-beam">' + giL('M12 19h40', 'Y', 2.8)
            + '<path d="M12 19L6 34M12 19l6 15M52 19l-6 15M52 19l6 15" stroke="url(#giY)" stroke-width="1.3" fill="none"/>' + giP('M4 34h16a8 5 0 0 1-16 0z', 'C', .35, 2) + giP('M44 34h16a8 5 0 0 1-16 0z', 'P', .35, 2) + '</g>'
            + '<circle cx="32" cy="12" r="3.4" fill="url(#giY)"/>']
};
/* un ícono: ficha (si tile) + dibujo con su brillo */
function gIcon(name, tile){
  const g = GI[name]; if (!g) return '';
  const k = g[0], body = '<g class="gi-g" style="--gg:' + GI_GLOW[k] + '" stroke-linecap="round" stroke-linejoin="round">' + g[1]() + '</g>';
  return '<svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">'
    + (tile === false ? body
      : '<rect x="3" y="3" width="58" height="58" rx="17" fill="url(#giTile)"/><rect x="3" y="3" width="58" height="58" rx="17" fill="url(#gi' + k + ')" fill-opacity=".1"/>'
      + '<rect x="3" y="3" width="58" height="58" rx="17" fill="url(#giLow)"/><rect x="3.6" y="3.6" width="56.8" height="56.8" rx="16.4" stroke="url(#giEdge)" stroke-width="1.2"/>'
      + '<path d="M14 6.6h36" stroke="#fff" stroke-opacity=".5" stroke-width="1.1" stroke-linecap="round"/>'
      + '<g transform="matrix(.78 0 0 .78 7 7)">' + body + '</g>')
    + '</svg>';
}
/* ---------- íconos de archivo («SymphorIA · Archivos» del boceto): hoja de vidrio con la esquina doblada, color por tipo ---------- */
const FK_IMG = 'png jpg jpeg webp gif svg bmp heic', FK_SHEET = 'csv tsv xls xlsx ods', FK_DOC = 'doc docx odt rtf pages', FK_TEXT = 'txt log md';
const FK_CODE = { py:'C', js:'Y', mjs:'Y', cjs:'Y', ts:'B', tsx:'B', jsx:'Y', html:'O', htm:'O', css:'V', scss:'P', sass:'P', less:'V', java:'O', cpp:'B', cc:'B', c:'B', h:'B', hpp:'B', cs:'V',
  php:'V', go:'C', rb:'R', rs:'O', swift:'O', kt:'V', json:'Y', yml:'G', yaml:'G', ini:'W', toml:'W', cfg:'W', env:'G', sql:'C', sh:'G', xml:'O' };
const FK_LABEL = { mjs:'JS', cjs:'JS', htm:'HTML', yaml:'YML', hpp:'H++', cpp:'C++', cc:'C++', scss:'SCSS', sass:'SASS' };
function giFile(ext){
  const e = String(ext || '').toLowerCase().replace(/^\./, ''); if (!e || e.length > 5) return null;
  const has = s => (' ' + s + ' ').includes(' ' + e + ' ');
  let k, inner;
  const label = (t, kk) => { const s = t.length; return '<text x="32.5" y="' + (s > 3 ? 43 : 44) + '" text-anchor="middle" font-size="' + (s > 4 ? 9 : s > 3 ? 10.5 : s > 2 ? 12.5 : 15) + '" font-weight="800" font-family="inherit" letter-spacing="-.2" fill="url(#gi' + kk + ')" stroke="none">' + t + '</text>'; };
  if (e === 'pdf'){ k = 'R'; inner = label('PDF', 'R'); }
  else if (has(FK_IMG)){ k = 'O'; inner = giP('M20 28h25v17H20z', 'O', .22, 1.8) + giL('M20 45l8-9 6 6 4-4 7 7', 'O', 1.8) + '<circle cx="40" cy="32.5" r="2.4" fill="url(#giY)"/>'; }
  else if (has(FK_SHEET)){ k = 'G'; inner = giP('M20 27h25v20H20z', 'G', .16, 1.8) + '<path d="M20 33.6h25M20 40.3h25M28.3 27v20M36.6 27v20" stroke="url(#giG)" stroke-width="1.3"/>'; }
  else if (has(FK_DOC)){ k = 'B'; inner = label(e === 'rtf' || e === 'odt' ? e.toUpperCase() : 'DOC', 'B'); }
  else if (has(FK_TEXT)){ k = e === 'md' ? 'C' : 'W'; inner = e === 'md' ? label('MD', 'C') : giL('M21 29h22M21 35h22M21 41h15', 'W', 2); }
  else if (e === 'pptx' || e === 'ppt' || e === 'key'){ k = 'O'; inner = giC(32, 37, 8.5, 'O', .22, 2) + '<path d="M32 37v-8.5a8.5 8.5 0 0 1 8.5 8.5z" fill="url(#giY)"/>'; }
  else if (e === 'epub'){ k = 'G'; inner = giP('M32 31c-4-3-9-3-12-2v15c3-1 8-1 12 2 4-3 9-3 12-2V29c-3-1-8-1-12 2zM32 31v15', 'G', .18, 1.8); }
  else if (FK_CODE[e]){ k = FK_CODE[e]; inner = label(FK_LABEL[e] || e.toUpperCase(), k); }
  else return null;
  return '<svg class="fico" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false"><g stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="' + GI_DOC + '" fill="url(#giTile)"/>' + giP(GI_DOC, k, .14, 2) + '<path d="' + GI_FOLD + '" fill="url(#gi' + k + ')" fill-opacity=".35" stroke="url(#gi' + k + ')" stroke-width="2"/>'
    + '<path d="M18 14v6" stroke="#fff" stroke-opacity=".4" stroke-width="1.3"/>' + inner + '</g></svg>';
}
/* dibuja los <i data-gi> que haya en la página (o dentro de root) */
function giFill(root){
  (root || document).querySelectorAll('[data-gi]:not(.gi-on)').forEach(i => { const s = gIcon(i.dataset.gi, i.dataset.gt !== '0'); if (s){ i.innerHTML = s; i.classList.add('gi-on'); } });
}
giFill();
