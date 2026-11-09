/* Arma los archivos de la página a partir de sus piezas (carpeta src/).
   Uso:  node build.mjs          → vuelve a escribir core.js, chat.js, chat.css…
         node build.mjs --check  → solo revisa que estén al día (falla si alguien editó el archivo armado a mano)
         node build.mjs --dist   → (lo corre Cloudflare) copia lo público a dist/ y lo minifica; el repo se queda legible
   Las piezas de cada archivo se unen en orden (00, 01, 02…). No cambian nada del código: solo lo ordenan. */
import { readFileSync, writeFileSync, readdirSync, existsSync, rmSync, mkdirSync, cpSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const MAP = join(here, 'src/build.json');
const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, 'utf8')) : {};
const check = process.argv.includes('--check'), dist = process.argv.includes('--dist');
let bad = 0;
for (const [target, dir] of Object.entries(map)){
  let names = []; try{ names = readdirSync(join(here, dir)); }catch(e){ if (e.code !== 'ENOENT') throw e; }
  const parts = names.filter(f => /^\d\d[a-z]?-/.test(f)).sort();
  const path = join(here, target);
  /* objetivo nuevo sin piezas todavía (p. ej. A.L.I.A.S. antes de recibir su código): no se crea un archivo vacío.
     Si el archivo armado ya existía, sigue la comprobación normal (así --check avisa si se perdieron sus piezas). */
  if (!parts.length && !existsSync(path)){ console.log('  sin piezas  ' + target + '  (' + dir + ' aún sin piezas NN-: no se arma)'); continue; }
  const out = parts.map(f => readFileSync(join(here, dir, f), 'utf8')).join('');
  let cur = ''; try{ cur = readFileSync(path, 'utf8'); }catch(e){}
  if (cur === out){ console.log('  igual   ' + target + '  (' + parts.length + ' piezas)'); continue; }
  if (check){ console.log('  CAMBIÓ  ' + target + '  → corre «node build.mjs»'); bad++; continue; }
  writeFileSync(path, out); console.log('  armado  ' + target + '  (' + parts.length + ' piezas)');
}
/* api/_alias-textos.js es el mismo alias-textos.json como módulo JS: el esbuild de Cloudflare Pages (wrangler 3) no entiende «import … with { type:'json' }» */
{
  const J = join(here, 'alias-textos.json'), M = join(here, 'api/_alias-textos.js');
  if (existsSync(J)){
    const out = '/* Generado por «node build.mjs» desde alias-textos.json; no se edita a mano. */\nexport default ' + JSON.stringify(JSON.parse(readFileSync(J, 'utf8'))) + ';\n';
    let cur = ''; try{ cur = readFileSync(M, 'utf8'); }catch(e){}
    if (cur === out) console.log('  igual   api/_alias-textos.js');
    else if (check){ console.log('  CAMBIÓ  api/_alias-textos.js  → corre «node build.mjs»'); bad++; }
    else { writeFileSync(M, out); console.log('  armado  api/_alias-textos.js'); }
  }
}
if (bad) process.exit(1);

/* v2.9.1 · dist/: solo lo que se publica (sin src/, pruebas, notas .md ni la configuración), con JS y CSS minificados.
   Las funciones de api/ se ejecutan en Pages Functions, por eso tampoco van aquí. */
if (dist){
  const { transform } = await import('esbuild');
  const out = join(here, 'dist'), SKIP = new Set(['dist', 'cloudflare', 'functions', 'next', 'escritorio', 'rust', 'node_modules', 'src', 't', 'api', 'build.mjs', 'package.json', 'package-lock.json', '.git', '.github', '.gitignore']);
  rmSync(out, { recursive:true, force:true }); mkdirSync(out);
  for (const f of readdirSync(here)) if (!SKIP.has(f) && !f.endsWith('.md')) cpSync(join(here, f), join(out, f), { recursive:true });
  let before = 0, after = 0;
  for (const f of readdirSync(out)){
    const kind = f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : '';
    if (!kind || !statSync(join(out, f)).isFile()) continue;
    const src = readFileSync(join(out, f), 'utf8');
    const { code } = await transform(src, { loader:kind, minify:true, legalComments:'none', charset:'utf8' });
    writeFileSync(join(out, f), code); before += src.length; after += code.length;
    console.log('  minificado  ' + f + '  ' + Math.round(src.length / 1024) + ' KB → ' + Math.round(code.length / 1024) + ' KB');
  }
  console.log('  dist/ listo: JS y CSS de ' + Math.round(before / 1024) + ' KB a ' + Math.round(after / 1024) + ' KB');
}
