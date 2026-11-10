import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const nextDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(nextDir, '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const guideButton = read('next/componentes/GuideButton.jsx');
const host = read('next/componentes/SynthonIAHost.jsx');
const runtime = read('next/componentes/LegacyRuntime.jsx');
const tree = read('next/componentes/ReactTree.jsx');
const page = read('next/componentes/LegacyPage.jsx');
const bot = read('src/synthonia/22-synthonia-ayudante-bolita-flotante.js');
const beta = read('src/synthonia/24-beta-cuentanos-mejorar-llega.js');
const assistantPanel = read('src/synthonia/23-ayuda-personas-chat.js');
const guideSource = read('src/chat/09-barrita-lateral-chats.js');
const guideFlow = read('src/chat/11-primera-vez-synthflow-camino.js');
const chatRoute = read('next/app/(site)/chat/page.jsx');

test('React enlaza el botón Guía rápida con un componente cliente', () => {
  assert.match(tree, /node\.attrs\?\.id === 'guideTop'/);
  assert.match(tree, /createElement\(GuideButton/);
  assert.match(guideButton, /window\.SymphoriaOpenGuide/);
  assert.match(guideButton, /data-react-component="guide"/);
  assert.match(guideButton, /window\.__symphoriaGuideQueued = false/);
});

test('un clic temprano se guarda incluso antes de que Runtime escuche el evento', () => {
  assert.match(guideButton, /window\.__symphoriaGuideQueued = true/);
  assert.match(guideButton, /symphoria:guide-request/);
  assert.match(runtime, /if \(window\.__symphoriaGuideQueued\) attemptGuide\(\)/);
});

test('la guía sigue abriendo el selector original, no salta directo al tutorial', () => {
  assert.match(guideFlow, /function openGuide\(\)\{\s*SZ\.guideAsk\(\{\s*full:runGuide/);
  assert.match(guideFlow, /window\.SymphoriaOpenGuide = openGuide/);
  assert.doesNotMatch(runtime, /fallback\(\);/);
});

test('el runtime espera SZ.synReady con tiempo límite antes de chat.js', () => {
  assert.match(runtime, /await Promise\.race\(\[\s*ready\.catch\(\(\) => false\)/);
  assert.match(runtime, /window\.setTimeout\(\(\) => resolve\(false\), 5000\)/);
  assert.match(chatRoute, /scripts=\{\['core\.js', 'chat\.js', 'movimiento\.js'\]\}/);
  assert.doesNotMatch(chatRoute, /'synthonia\.js'/);
});

test('Sona y BETA salen como elementos reales del árbol React', () => {
  assert.match(page, /page === 'chat' \? <SynthonIAHost \/>/);
  assert.match(host, /id="synthonIA-react-host"/);
  assert.match(host, /id="szBot"/);
  assert.match(host, /id="betaBot"/);
  assert.match(host, /onClick=\{activateAssistant\}/);
  assert.match(host, /onClick=\{openFeedback\}/);
});

test('el motor de Sona reutiliza el botón React y no crea otro con el mismo ID', () => {
  assert.match(bot, /const existing = document\.getElementById\('szBot'\)/);
  assert.match(bot, /existing\.dataset\.reactComponent === 'synthonia-avatar'/);
  assert.match(bot, /if \(!reactOwned\)\{[\s\S]*?appendChild\(b\)/);
  assert.match(beta, /activate:botAvatarClick/);
});

test('expresiones y botón arrastrable se mantienen en el motor existente', () => {
  assert.match(bot, /face\('feliz', 40\)/);
  assert.match(bot, /b\.addEventListener\('pointerdown'/);
  assert.match(bot, /function botAvatarClick\(e\)/);
  assert.match(bot, /botToggle\(\)/);
});

test('la navegación cliente puede desmontar y volver a montar Sona', () => {
  assert.match(host, /window\.SZ\?\.BOT\?\.unmount\?\.\(\)/);
  assert.match(bot, /function botReactUnmount\(\)/);
  assert.match(bot, /BOT\.el = null/);
  assert.match(bot, /synthoniaPointerBound/);
  assert.match(beta, /BOT\.betaCleanup = \(\) =>/);
});

test('BETA se posiciona junto a la bolita React sin perderse en móvil', () => {
  assert.match(beta, /b\.dataset\.reactComponent === 'synthonia-avatar'/);
  assert.match(beta, /t\.style\.position = 'fixed'/);
  assert.match(beta, /t\.style\.visibility = 'visible'/);
});

test('ocultar Sona limpia el motor antes de que React retire sus nodos', () => {
  assert.match(assistantPanel, /symphoria:hide-synthonIA/);
  assert.match(host, /window\.addEventListener\('symphoria:hide-synthonIA', hide\)/);
  assert.match(host, /const hide = \(\) => \{[\s\S]*?window\.SZ\?\.BOT\?\.unmount\?\.\(\)[\s\S]*?setHidden\(true\)/);
  assert.match(assistantPanel, /React procese la retirada y el motor limpie listeners/);
  assert.match(host, /\{hidden \? null :/);
});

test('Clarity permanece sin activarse en este arreglo', () => {
  const env = read('next/.env.example');
  assert.match(env, /NEXT_PUBLIC_CLARITY_ENABLED=false/);
  assert.match(env, /NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS=false/);
});
