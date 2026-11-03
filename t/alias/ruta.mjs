/* Pruebas del enrutador de A.L.I.A.S. (api/_ruta.js): clasificar el trabajo y elegir la IA. Sin red ni llaves.
   node t/alias/ruta.mjs */
import { classify, perfil, score, why } from '../../api/_ruta.js';

const rows = []; let bad = 0;
const ok = (name, cond, extra) => { rows.push([name, cond]); if (!cond){ bad++; console.log('FALLO', name, extra || ''); } else console.log('OK   ', name); };

/* 1) clasificar en español e inglés */
const C = [
  ['Escribe una función en Python que ordene una lista', 'think', 'code'],
  ['Write a JavaScript function to debounce clicks', 'think', 'code'],
  ['Traduce el resumen al inglés', 'think', 'translate'],
  ['Translate the email into Spanish', 'think', 'translate'],
  ['Resume los puntos clave del artículo', 'think', 'summary'],
  ['Compara las ventajas y riesgos de cada opción', 'think', 'reason'],
  ['Why does the plan fail? Evaluate the options', 'think', 'reason'],
  ['Redacta un correo para el profesor', 'think', 'write'],
  ['Calcula el promedio y arma una tabla de presupuesto', 'think', 'data'],
  ['Buscar fuentes sobre el clima de Bogotá', 'search', 'summary'],
  ['Crear la presentación final', 'file', 'write'],
  ['Crear el archivo con el código del script', 'file', 'code'],
];
for (const [txt, tool, want] of C) ok('clasifica «' + txt + '» → ' + want, classify(txt, tool) === want, '(dio ' + classify(txt, tool) + ')');
ok('el plan siempre es «plan»', classify('lo que sea', 'think', true) === 'plan');

/* 2) lo que se sabe de cada modelo */
ok('Gemini Flash es mejor que Llama 8B para razonar', perfil('gemini-flash-latest').q[2] > perfil('llama-3.1-8b-instant').q[2]);
ok('Hunyuan-MT sirve para traducir y no para código', perfil('tencent/Hunyuan-MT-7B').q[4] > perfil('tencent/Hunyuan-MT-7B').q[0]);
ok('un modelo desconocido parte de 5', perfil('algo/nuevo-9b').q.every(x => x === 5));

/* 3) elegir: para código gana el mejor en código; lo medido aquí corrige lo sabido */
const M = id => ({ id:'sz:x:' + id, prov:id.split('/')[0], mid:id.split('/')[1], name:id });
const flash = M('google/gemini-flash-latest'), oss = M('groq/openai/gpt-oss-20b'), l8 = M('groq2/llama-3.1-8b-instant'), nemo = M('mistral/open-mistral-nemo');
const best = (cat, S = {}, load = {}) => [flash, oss, l8, nemo].map(m => ({ m, ...score(m, cat, S, load) })).sort((a, b) => b.total - a.total);
ok('para código elige un modelo fuerte en código (no el de 8B)', best('code')[0].m !== l8);
ok('para traducir elige Gemini Flash', best('translate')[0].m === flash);
const S = { [flash.id]:{ ok:1, fail:9, ms:20000, up:0, down:4 } };
ok('si Gemini Flash falla seguido y recibe 👎, deja de ser la primera para traducir', best('translate', S)[0].m !== flash);
const L = { google:1 };
ok('si el proveedor gastó su cuota gratis de hoy, baja en la lista', best('summary', {}, L)[0].m !== flash);
const fast = { [l8.id]:{ ok:30, fail:0, ms:30 * 900, up:8, down:0 } };
ok('lo que sale bien y gusta aquí sube (aprende)', best('summary', fast).findIndex(x => x.m === l8) < best('summary').findIndex(x => x.m === l8));
const r = best('summary', fast); ok('explica «aprendido» cuando le fue bien muchas veces', why(r.find(x => x.m === l8), r) === 'learned');

console.log('\n' + (rows.length - bad) + ' OK, ' + bad + ' FALLO');
process.exit(bad ? 1 : 0);
