/* ---------- api/_triage.js · ¿esto necesita a A.L.I.A.S. o basta una respuesta rápida? ----------
   Sammuel (9 nov): «que ALIAS no te responda un simple hola ni nada muy fácil: que te mande a la Automática o a SuperiorSynth
   si es algo tan fácil. PERO CON SENTIDO: "Hola, ¿cómo estás? ¿me puedes ayudar a redactar un texto…?" no puede mandarte a
   otra IA, ahí te está pidiendo algo».
   Sin llamar a ninguna IA y sin gastar cupo: lee el pedido (español e inglés) y decide.
     { agent:true }                                         → es un trabajo de verdad: A.L.I.A.S. arma el plan
     { agent:false, kind, to:'auto' | 'superior' }          → es de verdad fácil: lo responde la IA Automática (saludos, gracias,
                                                              charla, «necesito ayuda») o SuperiorSynth (una preguntita o un pedido
                                                              chico de una sola respuesta)
   Regla de oro: si hay duda, se queda con A.L.I.A.S. (mandar a otra IA algo que sí era un pedido es peor que armar un plan).
   Un saludo al principio NO cuenta: se quita antes de mirar qué se pide. */

const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9+*/=%^\s]/g, ' ').replace(/\s+/g, ' ').trim();

/* cortesías que no piden nada: se borran antes de mirar qué se pide (primero las más largas) */
const CORTESIAS = [
  'buenos dias', 'buenas tardes', 'buenas noches', 'buen dia', 'buenas',
  'como estas', 'como esta', 'como te va', 'como andas', 'como vas', 'como has estado', 'como amaneciste', 'que tal', 'que onda', 'que hay', 'que mas', 'que cuentas', 'todo bien',
  'hola+', 'holi+s?', 'ola', 'hey+', 'ey', 'epa', 'saludos', 'un saludo',
  'hello there', 'hey there', 'hi there', 'hello', 'hiya', 'hi+', 'howdy', 'good morning', 'good afternoon', 'good evening', 'how are you doing', 'how are you', 'how is it going', 'hows it going', 'whats up', 'sup',
  'a l i a s', 'alias', 'symphoria', 'synthonia', 'synthflow', 'superiorsynth',
  'por favor', 'porfa', 'porfavor', 'please', 'plis', 'pls', 'oye', 'oiga', 'disculpa', 'perdon', 'perdona', 'sorry', 'excuse me',
  'muchas gracias', 'mil gracias', 'gracias', 'thank you so much', 'thank you very much', 'thanks a lot', 'thanks so much', 'many thanks', 'thank you', 'thanks', 'thx',
  'okay', 'okey', 'ok', 'vale', 'listo', 'dale', 'genial', 'perfecto', 'excelente',
  'ja+', 'je+', 'jaja+', 'jeje+', 'lol', 'xd'
];
const CORTES_RX = new RegExp('(?:^| )(?:' + CORTESIAS.join('|') + ')(?= |$)', 'g');
const quitaCortesias = n => { let a = n, b; do { b = a; a = a.replace(CORTES_RX, ' ').replace(/\s+/g, ' ').trim(); } while (a !== b); return a; };

/* trabajos que casi siempre piden varios pasos: investigar, planear, comparar, presentaciones, informes, programas… */
const FUERTE = new RegExp('\\b(?:investig\\w*|research\\w*|planific\\w*|plan|presentacion(?:es)?|diapositivas?|slides?|powerpoint|pptx|informe\\w*|reporte\\w*|report|analisis|analiz\\w*|analy[sz]e|estrategia\\w*|strategy|propuesta\\w*|proposal|ensayo\\w*|essay|articulo\\w*|article|monografia|tesis|curriculum|cv|portafolio|portfolio|business plan|plan de negocio\\w*|estudio de mercado|competencia|competitors?|app|aplicacion(?:es)?|pagina web|sitio web|website|landing|script|programa(?:r|me)?|codigo|code|coding|funcion|function|base de datos|database|sql|bot|paso a paso|step by step|ventajas y desventajas|pros y contras|pros and cons|itinerario|rutina de|cronograma|calendario|presupuesto|budget|checklist|ebook|guion|discurso|speech|newsletter|marketing|seo|compar(?:a|ar|ame|acion|e|ison)\\b.*\\b(?:y|con|vs|versus|and|with)|compar(?:a|ar|ame|acion|e|ison)\\b)\\b');
/* cosas que se escriben o se arman (con un «me puedes…» o un «redacta…» delante ya es un pedido de verdad) */
const ENTREGABLE = /\b(?:texto|textos|correo|correos|email|emails|mail|carta|cartas|mensaje|mensajes|poema|poemas|cancion|canciones|historia|cuento|descripcion|post|posts|publicacion|caption|slogan|resumen|tabla|lista|documento|nota|notas|bio|biografia|anuncio|comentario|guia|tutorial|manual|quiz|examen|tarea|tareas|trabajo|proyecto|text|letter|message|poem|song|story|description|summary|table|document|note|ad|guide|exam|homework|assignment|project|paragraph|parrafo|ensayo|essay)\b/;
/* pide algo (verbo o frase de petición) */
const PIDE = /\b(?:me puedes|puedes|podrias|podria|me ayudas|ayudame|ayudarme|ayudar|necesito|necesitaria|quiero|quisiera|me gustaria|hazme|haz|hacer|crea|crear|creame|arma|armar|armame|genera|generar|preparame|prepara|escribe|escribeme|escribir|redacta|redactar|redactame|elabora|elaborar|disena|disenar|organiza|busca|buscar|compara|resume|resumir|resumeme|explica|explicame|traduce|traducir|corrige|revisa|mejora|optimiza|sugiere|recomienda|dame|dime|cuentame|enumera|define|can you|could you|would you|will you|help me|help with|i need|i want|i would like|make me|make|create|build|write|draft|generate|prepare|design|organize|find|search|compare|summarize|explain|translate|fix|improve|optimize|suggest|recommend|give me|tell me|show me|list)\b/;
/* solo pide ayuda, sin decir con qué: es una puerta abierta, no un trabajo */
const SOLO_AYUDA = /^(?:(?:me|te)? ?(?:puedes|podrias|podria|ayudas|ayudar|ayudame|ayudarme|necesito|necesitaria|quiero|quisiera) ?(?:me |una |un |tu |su )?(?:ayuda|ayudar|ayudarme|ayudas|ayudame|help|algo|preguntarte(?: algo)?|preguntar(?: algo)?)?|(?:can|could|would) you help(?: me)?|i need (?:some )?help|help(?: me)?|help me out|necesito ayuda|ayuda)$/;
/* charla sobre ella misma o charla suelta */
const CHARLA = /^(?:quien eres|que eres|como te llamas|cual es tu nombre|que haces|que puedes hacer|en que me puedes ayudar|en que puedes ayudarme|para que sirves|who are you|what are you|what is your name|whats your name|what can you do|what do you do|how can you help|como funcionas|how do you work|eres una ia|are you an ai|eres real|estas ahi|are you there|me escuchas|me oyes|todo bien|how are things)$/;
const PREGUNTA = /^(?:que|quien|quienes|cual|cuales|cuando|donde|cuanto|cuantos|cuanta|cuantas|como|por que|porque|para que|what|who|whom|which|when|where|how|why|is|are|do|does|did|can|will)\b/;

export function triage(goal){
  const raw = String(goal || '').trim();
  const n = norm(raw), s = quitaCortesias(n), toks = s ? s.split(' ') : [];
  /* una pregunta de verdad termina en «?» (en el texto original) o empieza con palabra de pregunta */
  const esPregunta = /[?¿]/.test(raw) || PREGUNTA.test(s);

  /* 1) solo cortesías: «hola», «gracias», «¿cómo estás?»… → la Automática */
  if (!toks.length) return { agent:false, kind:/graci|thank|thx/.test(n) ? 'gracias' : 'saludo', to:'auto' };

  /* 2) marcas de trabajo de verdad: varias líneas, enlaces, código, o un tema que casi siempre pide varios pasos */
  if ((/\n/.test(raw) && raw.length > 80) || /https?:\/\/|```/.test(raw)) return { agent:true, why:'estructura' };
  if (FUERTE.test(s)) return { agent:true, why:'trabajo' };
  const pide = PIDE.test(s), entrega = ENTREGABLE.test(s);
  if (pide && entrega) return { agent:true, why:'pedido' };           /* «me puedes ayudar a redactar un texto…» */
  if (entrega && toks.length >= 4) return { agent:true, why:'pedido' };
  if (toks.length >= 10) return { agent:true, why:'largo' };
  if (pide && /^(?:quiero|necesito|i want|i need|me gustaria|quisiera)/.test(s) && toks.length >= 5) return { agent:true, why:'meta' };   /* «quiero aprender guitarra en un mes» */

  /* 3) de verdad fácil */
  if (SOLO_AYUDA.test(s)) return { agent:false, kind:'ayuda', to:'auto' };
  if (CHARLA.test(s)) return { agent:false, kind:'charla', to:'auto' };
  if (toks.length <= 4 && !entrega) return { agent:false, kind:'rapida', to:'superior' };
  if (toks.length <= 8 && esPregunta && !entrega) return { agent:false, kind:'pregunta', to:'superior' };
  if (toks.length <= 5 && pide && !entrega) return { agent:false, kind:'rapida', to:'superior' };   /* «traduce hello world al español» */

  /* 4) duda: se queda con A.L.I.A.S. */
  return { agent:true, why:'duda' };
}
