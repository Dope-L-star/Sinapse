// Compila el Wasm y arma `public/`, listo para subir a Cloudflare Pages.
// Uso, desde lutim-web:  node construir.mjs
// No instala nada ni usa la red (cargo va con --offline).

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const salida = join(aqui, 'public');
const wasm = join(aqui, 'target', 'wasm32-unknown-unknown', 'release', 'lutim_web.wasm');

execFileSync('cargo', ['build', '--release', '--offline', '--lib', '--target', 'wasm32-unknown-unknown'], {
  cwd: aqui,
  stdio: 'inherit',
});

rmSync(salida, { recursive: true, force: true });
mkdirSync(salida);
cpSync(join(aqui, 'web'), salida, { recursive: true });
cpSync(wasm, join(salida, 'lutim_web.wasm'));

console.log(`public/ listo: ${salida}`);
console.log(`lutim_web.wasm: ${(statSync(wasm).size / 1024).toFixed(0)} KiB`);
