/* ===== v2.7 · «Sona es para ti»: las tres escenas, dibujadas en código (antes eran imágenes pegadas).
   Cada escena es un escenario de 400 × 214 con sus cosas atrás, Sona (la misma de toda la página) y lo que va adelante.
   Todo se mueve en vivo: hojas que flotan, la página del libro que pasa, código que se escribe, errores que se arreglan,
   un documento que se arma solo. Cuando la escena no se ve, se queda quieta (cero trabajo de más). ===== */
(() => {
if (!SZ.synBody) return;
const G = (k, o) => 'fill="url(#gi' + k + ')" fill-opacity="' + (o == null ? .2 : o) + '" stroke="url(#gi' + k + ')"';
/* una hoja suelta, un libro acostado y una ventana de vidrio */
const sheet = (x, y, r, s, k, d) => '<g class="usc-fl" style="--d:' + d + 's"><g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')">'
  + '<path d="M0 0h28l9 9v33H0z" ' + G(k, .16) + ' stroke-width="1.6"/><path d="M28 0v9h9" fill="none" stroke="url(#gi' + k + ')" stroke-width="1.4"/>'
  + '<path d="M6 15h22M6 21h25M6 27h17M6 33h21" stroke="#e8fbff" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round"/></g></g>';
const book = (x, y, w, h, k) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" ' + G(k, .3) + ' stroke-width="1.5"/>'
  + '<path d="M' + (x + w - 7) + ' ' + (y + 3) + 'v' + (h - 6) + 'M' + (x + 6) + ' ' + (y + h / 2) + 'h' + (w * .45) + '" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" stroke-linecap="round"/>';
const win = (x, y, w, h, k, body, d) => '<g class="usc-fl" style="--d:' + d + 's"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="7" ' + G(k, .12) + ' stroke-width="1.5"/>'
  + '<path d="M' + x + ' ' + (y + 12) + 'h' + w + '" stroke="url(#gi' + k + ')" stroke-opacity=".5"/>'
  + [0, 1, 2].map(i => '<circle cx="' + (x + 8 + i * 6) + '" cy="' + (y + 6) + '" r="1.8" fill="url(#gi' + ['R', 'Y', 'G'][i] + ')"/>').join('') + body + '</g>';
/* líneas de código que se escriben solas (cada una con su color y su turno) */
const code = (x, y, rows) => rows.map(([dx, len, k], i) => '<path class="usc-type" pathLength="1" style="--i:' + i + ';--len:' + len + '" d="M' + (x + dx) + ' ' + (y + i * 7) + 'h' + len + '" stroke="url(#gi' + k + ')" stroke-width="2.6" stroke-linecap="round"/>').join('');
/* un error que se arregla: el triángulo de aviso se vuelve un visto verde, y vuelta a empezar */
const bug = (x, y, d) => '<g class="usc-bug" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ')"><g class="bw"><path d="M0-9L9 7H-9z" ' + G('Y', .35) + ' stroke-width="1.6" stroke-linejoin="round"/><path d="M0-3v4M0 4v.5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>'
  + '<g class="bo"><circle r="8.5" ' + G('G', .35) + ' stroke-width="1.6"/><path d="M-3.8 0l2.6 2.8 5-5.4" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g></g>';
const star = (x, y, s, k, d) => '<path class="usc-star" style="--d:' + d + 's" transform="translate(' + x + ' ' + y + ') scale(' + s + ')" d="M0-10c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z" fill="url(#gi' + k + ')"/>';
const dust = (cx, cy, n, k) => Array.from({ length:n }, (_, i) => '<circle class="usc-rise" style="--d:' + (-i * .7).toFixed(1) + 's" cx="' + (cx + ((i * 37) % 60) - 30) + '" cy="' + cy + '" r="' + (1 + (i % 3) * .5) + '" fill="url(#gi' + k + ')"/>').join('');
const SCENES = {
  /* estudia: Sona lee un libro que brilla, con hojas flotando y pilas de libros a los lados */
  study: { mood:'feliz', pose:'lee', bot:'--bx:50%;--bw:45%;--bb:-19%',
    back: sheet(56, 26, -14, 1, 'C', 0) + sheet(318, 20, 12, .95, 'V', -2.2) + sheet(300, 96, -8, .75, 'C', -3.6) + sheet(98, 104, 10, .7, 'P', -1.3)
      + book(28, 184, 72, 15, 'V') + book(36, 170, 62, 14, 'C') + book(30, 157, 58, 13, 'P') + book(302, 184, 70, 15, 'O') + book(310, 170, 56, 14, 'V')
      + star(150, 40, .7, 'C', 0) + star(262, 58, .5, 'Y', -1.1),
    front: '<g transform="translate(0 -9)"><ellipse class="usc-glow" cx="200" cy="190" rx="54" ry="16" fill="url(#uscGlowC)"/>'
      + '<path d="M200 196c-15-6-33-7-49-3v21c16-4 34-3 49 3z" ' + G('C', .26) + ' stroke-width="1.6"/><path d="M200 196c15-6 33-7 49-3v21c-16-4-34-3-49 3z" ' + G('C', .26) + ' stroke-width="1.6"/>'
      + '<path d="M160 200c11-3 23-3 33 0M160 206c11-3 23-3 33 0M207 200c11-3 23-3 33 0M207 206c9-2 17-2 24 0" stroke="#e8fbff" stroke-opacity=".7" stroke-width="1.3" stroke-linecap="round" fill="none"/>'
      + '<path class="usc-page" d="M200 196c15-6 33-7 49-3v21c-16-4-34-3-49 3z" fill="#dffaff" fill-opacity=".5" stroke="#fff" stroke-opacity=".8"/>'
      + dust(200, 188, 6, 'C') + '</g>' },
  /* programa: Sona escribe en su escritorio de vidrio; el código aparece en ventanas flotantes y los errores se vuelven vistos verdes */
  code: { mood:'analizando', pose:'escribe', bot:'--bx:50%;--bw:45%;--bb:-19%',
    back: win(24, 26, 108, 74, 'P', '<path d="M50 56l-10 10 10 10M80 56l10 10-10 10M70 52l-10 28" fill="none" stroke="url(#giP)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' + code(98, 50, [[0, 22, 'C'], [4, 18, 'V'], [4, 24, 'Y'], [0, 14, 'C']]), 0)
      + win(272, 18, 110, 60, 'C', code(282, 40, [[0, 46, 'P'], [8, 62, 'C'], [8, 38, 'Y'], [0, 54, 'V'], [8, 30, 'G']]), -2)
      + win(290, 92, 94, 50, 'V', '<path d="M300 116l6 4-6 4" fill="none" stroke="url(#giG)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' + code(312, 113, [[0, 40, 'G'], [0, 26, 'W'], [0, 34, 'W']]), -3.4)
      + bug(130, 28, 0) + bug(380, 90, -2.5) + bug(270, 20, -4.2),
    front: '<path d="M44 188h312l30 17H14z" fill="url(#giP)" fill-opacity=".14" stroke="url(#uscIri)" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 205h372v12H14z" fill="url(#giV)" fill-opacity=".18" stroke="url(#uscIri)" stroke-width="1.4"/>'
      + '<path d="M60 191h280" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>'
      + '<ellipse class="usc-glow" cx="200" cy="196" rx="70" ry="10" fill="url(#uscGlowP)"/>'
      + '<path d="M152 192h96l8 10H144z" fill="#c9f6ff" fill-opacity=".14" stroke="url(#giC)" stroke-width="1.3" stroke-linejoin="round"/><path d="M154 195.5h92M151 199h98" stroke="#bff6ff" stroke-opacity=".75" stroke-width="1.6" stroke-dasharray="4 2.4"/>'
      /* la taza de café, con su vapor */
      + '<path d="M318 172h20v14a5 5 0 0 1-5 5h-10a5 5 0 0 1-5-5z" ' + G('O', .3) + ' stroke-width="1.5"/><path d="M338 176h3a4 4 0 0 1 0 8h-3" fill="none" stroke="url(#giO)" stroke-width="1.5"/>'
      + '<path class="usc-steam" d="M324 166q-3-5 0-9t0-9M332 166q-3-5 0-9t0-9" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/>' },
  /* crea: un documento de luz se arma solo encima de su proyector; Sona lo señala */
  create: { mood:'creando', pose:'senalaL', bot:'--bx:74%;--bw:42%;--bb:-16%',
    back: '<ellipse cx="112" cy="200" rx="44" ry="9" ' + G('O', .25) + ' stroke-width="1.6"/><ellipse cx="112" cy="198" rx="26" ry="4.5" fill="#ffe1b0" fill-opacity=".7"/>'
      + '<path class="usc-beam" d="M74 198L58 160L172 146L150 198Z" fill="url(#uscBeam)"/>'
      + '<g transform="matrix(1.12 -.12 .077 .969 48 34)">'
      +   '<rect width="100" height="130" rx="7" fill="url(#giO)" fill-opacity=".12" stroke="url(#uscIri)" stroke-width="1.6"/><path d="M8 4h70" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>'
      +   '<rect class="usc-title" x="11" y="12" width="52" height="8" rx="4" fill="url(#giM)"/>'
      +   [30, 40, 50, 60, 70].map((y, i) => '<path class="usc-write" pathLength="1" style="--i:' + i + '" d="M11 ' + y + 'h' + [76, 68, 78, 56, 70][i] + '" stroke="#ffe8cc" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>').join('')
      +   '<path d="M11 116h78" stroke="#fff" stroke-opacity=".25"/>' + [[16, 22, 'C'], [32, 30, 'V'], [48, 18, 'P'], [64, 36, 'O']].map(([x, h, k], i) => '<rect class="usc-bar" style="--i:' + i + '" x="' + x + '" y="' + (116 - h) + '" width="11" height="' + h + '" rx="2.5" fill="url(#gi' + k + ')"/>').join('')
      + '</g>'
      + star(34, 54, .9, 'Y', 0) + star(190, 30, .7, 'C', -.8) + star(186, 126, .55, 'P', -1.6) + star(34, 150, .6, 'O', -2.3) + dust(112, 194, 7, 'O'),
    front: '' }
};
/* los degradados propios de las escenas (una sola vez) */
document.getElementById('giDefs').querySelector('defs').insertAdjacentHTML('beforeend',
  '<radialGradient id="uscGlowC"><stop offset="0" stop-color="#bff6ff" stop-opacity=".7"/><stop offset="1" stop-color="#3de0ff" stop-opacity="0"/></radialGradient>'
  + '<radialGradient id="uscGlowP"><stop offset="0" stop-color="#ffb3dd" stop-opacity=".6"/><stop offset="1" stop-color="#ff3d9a" stop-opacity="0"/></radialGradient>'
  + '<linearGradient id="uscBeam" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd29a" stop-opacity=".6"/><stop offset="1" stop-color="#ff7a45" stop-opacity=".04"/></linearGradient>'
  + '<linearGradient id="uscIri" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#bff6ff"/><stop offset=".4" stop-color="#9b7bff"/><stop offset=".75" stop-color="#ff3d9a"/><stop offset="1" stop-color="#ffc857"/></linearGradient>');
const svg = (cls, s) => '<svg class="usc-svg ' + cls + '" viewBox="0 0 400 214" fill="none" aria-hidden="true">' + s + '</svg>';
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('usc-off', !e.isIntersecting)), { rootMargin:'60px' }) : null;
document.querySelectorAll('.uscene[data-scene]').forEach(el => {
  const S = SCENES[el.dataset.scene]; if (!S) return;
  el.innerHTML = svg('usc-back', S.back) + '<span class="usc-bot" style="' + S.bot + '">' + SZ.synBody(S.mood, S.pose) + '</span>' + (S.front ? svg('usc-front', S.front) : '');
  if (io){ el.classList.add('usc-off'); io.observe(el); }
});
})();
