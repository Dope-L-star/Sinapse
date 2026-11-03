import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const nextDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(nextDir, '..');
const routes = [
  { html: 'index.html', route: 'app/(site)/page.jsx', module: 'contenido/legado/index.js', tree: 'contenido/arboles-react/index.json' },
  { html: 'ayuda.html', route: 'app/(site)/ayuda/page.jsx', module: 'contenido/legado/ayuda.js', tree: 'contenido/arboles-react/ayuda.json' },
  { html: 'offline.html', route: 'app/(site)/offline/page.jsx', module: 'contenido/legado/offline.js', tree: 'contenido/arboles-react/offline.json' },
];
/* v3.8 · páginas ya reescritas en componentes React (sin árbol copiado del HTML ni el .js viejo de la página) */
const reactNative = [
  { html: 'pulsem.html', route: 'app/(panel)/pulsem/page.jsx', app: 'componentes/pulsem/PulsemApp.jsx', old: 'pulsem.js', needs: 'core.js' },
  { html: 'alias.html', route: 'app/(site)/alias/page.jsx', app: 'componentes/alias/AliasApp.jsx', old: 'alias.js', needs: 'alias-tools.js', masks: ['vPlan', 'vResult'] },
];
function extractJsonModule(file, name) {
  const text = fs.readFileSync(file, 'utf8');
  const marker = `export const ${name} = `;
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, `${file}: falta export ${name}`);
  const at = start + marker.length;
  let i = at;
  assert.equal(text[i], '"', `${file}: ${name} no es una cadena JSON`);
  i++;
  while (i < text.length) {
    if (text[i] === '\\') { i += 2; continue; }
    if (text[i] === '"') { i++; break; }
    i++;
  }
  return JSON.parse(text.slice(at, i));
}
function extractOriginalBody(html) {
  const text = fs.readFileSync(path.join(root, html), 'utf8');
  const match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  assert.ok(match, `${html}: no se encuentra body`);
  return match[1].replace(/\r\n/g, '\n').trim();
}
function elements(nodes, out = []) {
  for (const n of nodes || []) {
    if (n.type !== 'element') continue;
    out.push(n);
    elements(n.children, out);
  }
  return out;
}
for (const r of routes) {
  const routePath = path.join(nextDir, r.route);
  const modulePath = path.join(nextDir, r.module);
  const treePath = path.join(nextDir, r.tree);
  assert.ok(fs.existsSync(routePath), `falta ruta React ${r.route}`);
  assert.ok(fs.existsSync(modulePath), `falta contenido original ${r.module}`);
  assert.ok(fs.existsSync(treePath), `falta árbol de elementos React ${r.tree}`);
  const route = fs.readFileSync(routePath, 'utf8');
  assert.ok(route.includes('LegacyPage') && route.includes('reactTree'), `${r.route}: no consume el árbol React`);
  const actual = extractJsonModule(modulePath, 'body');
  const original = extractOriginalBody(r.html);
  assert.equal(actual, original, `${r.html}: la fuente del contenido debe mantenerse sincronizada`);
  const tree = JSON.parse(fs.readFileSync(treePath, 'utf8'));
  const hash = createHash('sha256').update(original, 'utf8').digest('hex');
  assert.equal(tree.sourceHash, hash, `${r.html}: regenerar el árbol React tras modificar el marcado`);
  assert.equal(tree.sourceCharacters, original.length, `${r.html}: longitud fuente no coincide`);
  const all = elements(tree.nodes);
  const ids = all.map(n => n.attrs?.id).filter(Boolean);
  assert.equal(ids.length, new Set(ids).size, `${r.html}: IDs repetidos en el árbol React`);
  const sourceIds = [...original.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  assert.deepEqual([...ids].sort(), [...sourceIds].sort(), `${r.html}: IDs cambiaron al convertir el DOM a React`);
  const masks = {
    'chat.html': ['msgs', 'thList', 'sideFoot', 'accBtn'],
    'index.html': ['launch', 'usagePanel', 'accBtn'],
    'alias.html': ['vPlan', 'vResult'],
  }[r.html] || [];
  for (const id of masks) {
    const masked = all.find(n => n.attrs?.id === id);
    assert.ok(masked, `${r.html}: falta el contenedor sensible #${id}`);
    assert.equal(String(masked.attrs?.['data-clarity-mask']).toLowerCase(), 'true', `${r.html}: #${id} debe enmascararse para analítica`);
  }
  assert.ok(all.every(n => n.tag !== 'script'), `${r.html}: los scripts deben cargarse solo con LegacyRuntime`);
  assert.ok(!/\son[a-z]+\s*=/i.test(JSON.stringify(tree.nodes)), `${r.html}: no deben quedar atributos de evento inline ejecutables`);
  /* <html data-brand> no viaja en el árbol (solo el body): el layout del sitio lo pone por ruta. Sin él, core.js no sabe que es SynthFlow. */
  if (r.route.startsWith('app/(site)/')) {
    const brand = (fs.readFileSync(path.join(root, r.html), 'utf8').match(/<html[^>]*\sdata-brand=["']([^"']+)["']/i) || [])[1] || null;
    const lay = fs.readFileSync(path.join(nextDir, 'app/(site)/layout.jsx'), 'utf8').match(/export const BRAND = (\{[^}]*\})/);
    assert.ok(lay, 'app/(site)/layout.jsx: falta BRAND');
    const map = JSON.parse(lay[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
    assert.equal(map[r.html.replace(/\.html$/, '')] || null, brand, `${r.html}: data-brand="${brand}" del <html> no coincide con BRAND del layout`);
  }
  console.log(`OK React ${r.html}: ${all.length} elementos, ${ids.length} IDs conservados, árbol actualizado`);
}
/* v3.7 · SynthFlow ya no es un árbol JSON: son componentes JSX propios (next/componentes/synthflow/*.jsx) que usa el motor chat.js.
   chat.html se queda para build.mjs y las pruebas viejas. Si alguien lo cambia, hay que pasar el cambio a los componentes y anotar el hash nuevo. */
{
  const dir = path.join(nextDir, 'componentes/synthflow');
  const jsx = fs.readdirSync(dir).filter(f => f.endsWith('.jsx')).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  const route = fs.readFileSync(path.join(nextDir, 'app/(site)/chat/page.jsx'), 'utf8');
  assert.ok(route.includes('LegacyPage') && route.includes('<SynthFlow />'), 'app/(site)/chat/page.jsx: debe montar <SynthFlow /> dentro de LegacyPage');
  const original = extractOriginalBody('chat.html');
  const fuente = JSON.parse(fs.readFileSync(path.join(dir, 'fuente.json'), 'utf8'));
  assert.equal(createHash('sha256').update(original, 'utf8').digest('hex'), fuente.chatHtmlHash, 'chat.html cambió: pasa el cambio a next/componentes/synthflow/*.jsx y anota el hash nuevo en fuente.json');
  const ids = [...jsx.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, 'SynthFlow JSX: IDs repetidos');
  const sourceIds = [...original.matchAll(/\bid=["']([^"']+)["']/gi)].map(m => m[1]);
  /* IDs que el motor quitaba al arrancar y que la versión React ya no trae (#pMore: «Más filtros», hoy «Personalizar búsqueda») */
  const RETIRADOS = ['pMore'];
  const lost = sourceIds.filter(i => !ids.includes(i) && !RETIRADOS.includes(i));
  assert.deepEqual(lost, [], 'SynthFlow JSX: faltan IDs que usa chat.js: ' + lost.join(', '));
  for (const id of ['msgs', 'thList', 'sideFoot', 'accBtn']) assert.ok(new RegExp('id="' + id + '"[^>]*data-clarity-mask="true"|data-clarity-mask="true"[^>]*id="' + id + '"').test(jsx), 'SynthFlow JSX: #' + id + ' debe enmascararse para analítica');
  assert.ok(!/<script\b/i.test(jsx), 'SynthFlow JSX: los scripts se cargan solo con LegacyRuntime');
  assert.ok(!/="[^"]*\\u[0-9a-fA-F]{4}/.test(jsx), 'SynthFlow JSX: hay un «\\uXXXX» dentro de un atributo con comillas (JSX no lo convierte: escribe el carácter tal cual)');
  assert.ok(!/\son[A-Z][a-zA-Z]+=\{?["']/.test(jsx) && !/dangerouslySetInnerHTML/.test(jsx), 'SynthFlow JSX: sin handlers en texto ni HTML crudo');
  const brand = (fs.readFileSync(path.join(root, 'chat.html'), 'utf8').match(/<html[^>]*\sdata-brand=["']([^"']+)["']/i) || [])[1] || null;
  const lay = fs.readFileSync(path.join(nextDir, 'app/(site)/layout.jsx'), 'utf8').match(/export const BRAND = (\{[^}]*\})/);
  const map = JSON.parse(lay[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
  assert.equal(map.chat || null, brand, 'chat.html: data-brand no coincide con BRAND del layout');
  console.log(`OK React chat.html → componentes JSX de SynthFlow: ${ids.length} IDs conservados`);
}
for (const r of reactNative) {
  const route = fs.readFileSync(path.join(nextDir, r.route), 'utf8');
  assert.ok(fs.existsSync(path.join(nextDir, r.app)), `falta ${r.app}`);
  assert.ok(!route.includes('reactTree') && !route.includes(`'${r.old}'`), `${r.route}: ya es React; no debe volver a cargar el árbol ni ${r.old}`);
  assert.ok(route.includes(`'${r.needs}'`), `${r.route}: necesita ${r.needs}`);
  const src = fs.readdirSync(path.join(nextDir, path.dirname(r.app))).filter(f => /\.jsx?$/.test(f)).map(f => fs.readFileSync(path.join(nextDir, path.dirname(r.app), f), 'utf8')).join('\n');
  assert.ok(!/\.innerHTML\s*=(?!\s*'')/.test(src), `${r.app}: los componentes no arman HTML a mano con innerHTML`);
  for (const id of r.masks || []) assert.ok(new RegExp('id="' + id + '" data-clarity-mask="true"').test(src), `${r.app}: #${id} debe enmascararse para analítica`);
  console.log(`OK React ${r.html}: componentes propios (${r.app})`);
}
const armar = fs.readFileSync(path.join(nextDir, 'armar.mjs'), 'utf8');
assert.ok(armar.includes("'chat.html'"), 'armar.mjs debe retirar chat.html de public/');
for (const {html} of [...routes, ...reactNative]) assert.ok(armar.includes(`'${html}'`), `armar.mjs debe retirar ${html} de public/`);
for (const file of ['componentes/LegacyPage.jsx','componentes/LegacyRuntime.jsx','componentes/ReactTree.jsx','app/(site)/layout.jsx']) {
  assert.ok(fs.existsSync(path.join(nextDir, file)), `falta ${file}`);
}
assert.ok(fs.existsSync(path.join(root, 'sintetico.html')));
assert.ok(fs.existsSync(path.join(root, 'functions/sintetico.js')));
// Regresión: React no renderiza el atributo <html data-brand="flow"> del chat legado.
// El runtime tiene que restaurarlo antes de cargar core.js/synthonia.js, de lo contrario
// SynthonIA se posiciona como en portada y el botón BETA desaparece.
const legacyRuntime = fs.readFileSync(path.join(nextDir, 'componentes/LegacyRuntime.jsx'), 'utf8');
const brandSetupAt = legacyRuntime.indexOf("if (page === 'chat') root.dataset.brand = 'flow'");
const scriptLoopAt = legacyRuntime.indexOf('for (const src of scripts)');
assert.ok(brandSetupAt >= 0 && scriptLoopAt > brandSetupAt, 'SynthFlow debe asignar data-brand="flow" antes de cargar los scripts heredados');
assert.ok(legacyRuntime.includes("else if (root.dataset.brand === 'flow') root.removeAttribute('data-brand')"), 'al salir del chat debe retirarse la marca de SynthFlow para no contaminar otras páginas');
const coreBrand = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
assert.ok(coreBrand.includes("document.documentElement.dataset.brand === 'flow'"), 'core.js debe conservar la identificación por marca de SynthFlow');
const betaSource = fs.readFileSync(path.join(root, 'src/synthonia/24-beta-cuentanos-mejorar-llega.js'), 'utf8');
assert.ok(betaSource.includes('if (isFlow()) return betaBot()') && betaSource.includes('function betaBot()'), 'el botón BETA debe seguir la ubicación de SynthonIA en SynthFlow');
console.log('OK regresión SynthonIA/BETA: data-brand=flow se establece antes de cargar core.js; Clarity sigue desactivado');
// Regresiones reportadas: botón de guía y montaje de SynthonIA al migrar la página a React.
const guideComponentPath = path.join(nextDir, 'componentes/GuideButton.jsx');
const synthonIAComponentPath = path.join(nextDir, 'componentes/SynthonIAHost.jsx');
assert.ok(fs.existsSync(guideComponentPath), 'el botón Guía debe ser un componente cliente de React');
assert.ok(fs.existsSync(synthonIAComponentPath), 'SynthFlow debe tener un host React para SynthonIA');
const guideComponent = fs.readFileSync(guideComponentPath, 'utf8');
const synthonIAComponent = fs.readFileSync(synthonIAComponentPath, 'utf8');
const reactTree = fs.readFileSync(path.join(nextDir, 'componentes/ReactTree.jsx'), 'utf8');
const legacyPage = fs.readFileSync(path.join(nextDir, 'componentes/LegacyPage.jsx'), 'utf8');
const chatRoute = fs.readFileSync(path.join(nextDir, 'app/(site)/chat/page.jsx'), 'utf8');
const guideSource = fs.readFileSync(path.join(root, 'src/chat/09-barrita-lateral-chats.js'), 'utf8');
const guideFlowSource = fs.readFileSync(path.join(root, 'src/chat/11-primera-vez-synthflow-camino.js'), 'utf8');
const botSource = fs.readFileSync(path.join(root, 'src/synthonia/22-synthonia-ayudante-bolita-flotante.js'), 'utf8');
assert.ok(reactTree.includes("node.attrs?.id === 'guideTop'") && reactTree.includes('createElement(GuideButton'), 'ReactTree debe transformar #guideTop en un componente React interactivo');
assert.ok(guideComponent.includes('window.SymphoriaOpenGuide') && guideComponent.includes("symphoria:guide-request") && guideComponent.includes('window.__symphoriaGuideQueued = true') && guideComponent.includes('data-react-component="guide"'), 'GuideButton debe llamar al selector original, marcar el ownership React o encolar el clic durante la hidratación');
assert.ok(guideFlowSource.includes('window.SymphoriaOpenGuide = openGuide') && guideFlowSource.includes('SZ.guideAsk({ full:runGuide') && guideSource.includes("guideButton.dataset.reactComponent !== 'guide'") && guideSource.includes("guideButton.addEventListener('click', () => openGuide())"), 'el flujo original debe conservar su listener en HTML estático y evitar duplicarlo cuando React posee el botón');
assert.ok(legacyRuntime.includes('window.SZ?.synReady') && legacyRuntime.includes('ready.catch(() => false)'), 'el runtime debe esperar a SynthonIA antes de arrancar el chat, con límite de espera');
assert.ok(legacyRuntime.includes("window.addEventListener('synthz-synthonia', onSynthonIAReady)"), 'una guía en espera debe reintentarse cuando SynthonIA llegue');
assert.ok(legacyPage.includes("page === 'chat' ? <SynthonIAHost />") && synthonIAComponent.includes('id="synthonIA-react-host"'), 'el punto de montaje de SynthonIA debe estar controlado por el árbol React');
assert.ok(synthonIAComponent.includes('id="szBot"') && synthonIAComponent.includes('id="betaBot"') && synthonIAComponent.includes('onClick={activateAssistant}') && synthonIAComponent.includes('onClick={openFeedback}'), 'la bolita y el BETA deben ser nodos y controles React, no elementos paralelos creados por el motor legado');
assert.ok(botSource.includes("document.getElementById('synthonIA-react-host')") && botSource.includes('(reactHost || document.body).appendChild(b)'), 'el avatar debe montarse dentro del host React en SynthFlow, manteniendo el fallback legado');
assert.ok(botSource.includes("const existing = document.getElementById('szBot')") && botSource.includes("existing.dataset.reactComponent === 'synthonia-avatar'"), 'el motor debe reutilizar la bolita React, sin duplicarla');
const betaBotSource = fs.readFileSync(path.join(root, 'src/synthonia/24-beta-cuentanos-mejorar-llega.js'), 'utf8');
assert.ok(betaBotSource.includes("b.dataset.reactComponent === 'synthonia-avatar'") && betaBotSource.includes("t.style.visibility = 'visible'") && betaBotSource.includes('activate:botAvatarClick'), 'BETA debe posicionarse respecto al nodo React y el API debe exponer el clic de SynthonIA');
const hideSource = fs.readFileSync(path.join(root, 'src/synthonia/23-ayuda-personas-chat.js'), 'utf8');
assert.ok(hideSource.includes("el && el.dataset.reactComponent === 'synthonia-avatar'") && hideSource.includes("dispatchEvent(new Event('symphoria:hide-synthonIA'))") && synthonIAComponent.includes('window.SZ?.BOT?.unmount?.()'), 'ocultar SynthonIA debe pedir a React que retire sus nodos y limpiar listeners antes de hacerlo');
assert.ok(chatRoute.includes("scripts={['core.js', 'chat.js', 'movimiento.js']}") , 'no debe inyectarse synthonia.js duplicado; core.js conserva su cargador con reintentos');
console.log('OK React Guide/SynthonIA: clic React, selector de guía original, espera de synReady y host React presente');
const clarityPath = path.join(nextDir, 'componentes/ClarityConsent.jsx');
const clarityCode = fs.readFileSync(clarityPath, 'utf8');
const clarityLib = fs.readFileSync(path.join(nextDir, 'lib/clarity-client.mjs'), 'utf8');
const clarityBuild = fs.readFileSync(path.join(nextDir, 'armar.mjs'), 'utf8');
assert.ok(clarityCode.includes('NEXT_PUBLIC_CLARITY_ENABLED') && clarityCode.includes('NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS') && clarityCode.includes('NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE') && clarityCode.includes('NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED') && clarityCode.includes('NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED'), 'Clarity debe requerir cinco condiciones de release explícitas');
assert.ok(clarityLib.includes('consentv2') && clarityLib.includes('https://www.clarity.ms/tag/'), 'Clarity debe usar loader y Consent V2');
assert.ok(clarityLib.includes("'z5es3kuqoz'") && clarityBuild.includes('No se ha publicado nada'), 'Clarity project ID y build gate deben estar presentes');
assert.ok(clarityLib.includes('CLARITY_GRANT_MAX_AGE_MS') && clarityLib.includes("record.choice === 'denied'"), 'Clarity debe caducar consentimiento afirmativo y conservar el rechazo');
assert.ok(clarityCode.includes("startClarity()") && clarityCode.includes("writeClarityChoice(getStorageSafely(), 'granted')"), 'Clarity solo debe cargar tras aceptar');
const panelLayout = fs.readFileSync(path.join(nextDir, 'app/(panel)/layout.jsx'), 'utf8');
assert.ok(!panelLayout.includes('ClarityConsent'), 'Pulsem es un panel privado y no debe instrumentarse');
const publicLayout = fs.readFileSync(path.join(nextDir, 'app/(site)/layout.jsx'), 'utf8');
const legalLayout = fs.readFileSync(path.join(nextDir, 'app/(legal)/layout.jsx'), 'utf8');
assert.ok(publicLayout.includes('ClarityConsent') && legalLayout.includes('ClarityConsent'), 'Clarity opcional debe montarse solo en la web pública/legal');
const csp = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const cspValue = (csp.headers || []).flatMap(h => h.headers || []).find(h => h.key.toLowerCase() === 'content-security-policy')?.value || '';
assert.ok(cspValue.includes('https://www.clarity.ms') && cspValue.includes('https://*.clarity.ms') && cspValue.includes('https://c.bing.com'), 'CSP debe permitir los hosts oficiales de Clarity solo cuando se habilite en el build');
const clarityEnv = fs.readFileSync(path.join(nextDir, '.env.example'), 'utf8');
assert.ok(clarityEnv.includes('NEXT_PUBLIC_CLARITY_ENABLED=false') && clarityEnv.includes('NEXT_PUBLIC_CLARITY_AUDIENCE_18_PLUS=false') && clarityEnv.includes('NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE=false') && clarityEnv.includes('NEXT_PUBLIC_SYMPHORIA_AGE_CONTROL_VERIFIED=false') && clarityEnv.includes('NEXT_PUBLIC_CLARITY_PRIVACY_REVIEWED=false'), 'Clarity debe llegar desactivado por defecto');
const termsCode = fs.readFileSync(path.join(nextDir, 'contenido/terminos.jsx'), 'utf8');
const privacyCode = fs.readFileSync(path.join(nextDir, 'contenido/privacidad.jsx'), 'utf8');
assert.ok(termsCode.includes('NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE') && termsCode.includes('disponible exclusivamente para personas de 18 años o más'), 'Términos deben contemplar contenido de la edición 18+');
assert.ok(privacyCode.includes('NEXT_PUBLIC_SYMPHORIA_ADULT_ONLY_RELEASE') && privacyCode.includes('Microsoft Clarity'), 'Privacidad debe contemplar el modo adulto y Clarity');
console.log('OK Clarity opt-in, Consent V2, cinco condiciones de release, enmascaramiento y exclusión del panel privado');
console.log('OK configuración estática de Next, handlers seguros y aislamiento de Sintéticos');
