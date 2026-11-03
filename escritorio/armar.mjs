/* Arma el instalador de Windows SymphorIA-Obertura.exe (y su huella .sha256). Gratis: solo necesita Go 1.22+.
   Uso, desde la raíz del repo:  node escritorio/armar.mjs 1.0.0
   Sale en escritorio/salida/. Se arma igual desde Linux, Mac o Windows (Go compila para Windows desde cualquiera). */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const version = (process.argv[2] || process.env.OBERTURA_VERSION || '').replace(/^obertura-v|^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) { console.error('Uso: node escritorio/armar.mjs X.Y.Z'); process.exit(1); }
const salida = path.join(aqui, 'salida'), exe = path.join(salida, 'SymphorIA-Obertura.exe');
fs.mkdirSync(salida, { recursive: true });
const go = (args, env = {}) => execFileSync('go', args, { cwd: aqui, stdio: 'inherit', env: Object.assign({}, process.env, env) });

go(['test', './...']);
go(['run', './recursos', '-version', version]);                        /* ícono, manifiesto y versión → .syso */
go(['build', '-trimpath', '-ldflags', `-s -w -H=windowsgui -X main.version=${version}`, '-o', exe, '.'],
  { GOOS: 'windows', GOARCH: 'amd64', CGO_ENABLED: '0' });
fs.rmSync(path.join(aqui, 'rsrc_windows_amd64.syso'), { force: true });

const sha = createHash('sha256').update(fs.readFileSync(exe)).digest('hex');
fs.writeFileSync(exe + '.sha256', `${sha}  SymphorIA-Obertura.exe\n`);
console.log(`Listo: ${path.relative(process.cwd(), exe)} (${(fs.statSync(exe).size / 1048576).toFixed(1)} MB) · v${version}\nsha256 ${sha}`);
