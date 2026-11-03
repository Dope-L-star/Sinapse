/* v4.2 · Regla fija de «¿se busca en internet?» para el servidor (A.L.I.A.S.).
   Es COPIA EXACTA de webRule/WEB_RULES de src/chat/05d-internet.js: t/web/regla.test.mjs revisa que las dos digan lo mismo.
   Si cambias una, cambia la otra. */
export function webRule(text){
  let s = String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (/```/.test(s) || (s.split('\n').filter(l => /[;{}]\s*$|^\s*(def|function|const|let|var|import|class|return|if|for|while|<\w+)/.test(l)).length >= 3)) return { go:false, why:'codigo' };
  /* frases que nombran la conversación o saludan no cuentan («tu última respuesta», «¿cómo estás hoy?») */
  s = s.replace(/\b(tu|la|el|lo|mi|su) (ultim[oa]|anterior) (respuesta|mensaje|parrafo|linea|punto|pregunta|version que (me )?diste)\b|\blo ultimo que (dijiste|escribiste)\b|\b(your|the|my) (last|latest|previous) (answer|message|reply|paragraph|line|point)\b/g, ' ')
       .replace(/\b(como|que tal) (estas|te va|andas|amaneciste|te sientes)\b[^?.!]*|\bhow (are|r) (you|u)\b[^?.!]*|\bhow('s| is) (your|it going)\b[^?.!]*/g, ' ');
  for (const [why, rx] of WEB_RULES) if (rx.test(s)) return { go:true, why };
  return { go:false, why:'general' };
}
const WEB_RULES = [
  ['pedido', /\b(busca(r|me|lo)?|buscame|investiga(r|me)?|averigua(r|me)?)\b[^.?!]{0,40}\b(en )?(internet|google|la web|linea|online)\b|\b(investiga|averigua)\b|\bcon (sus )?fuentes\b|\b(dame|pasame|necesito|quiero) (las )?(fuentes|links?|enlaces?)\b|\b(pagina|sitio|web) oficial\b|\bsegun internet\b|\b(search|look up|google)\b[^.?!]{0,30}\b(web|online|internet|it)\b|\bwith sources\b|\b(find|give) me (the )?(sources|links)\b|\bofficial (site|website|page)\b/],
  ['hoy', /\b(noticias?|titulares|ultima hora|que (paso|esta pasando|ha pasado)|hoy en dia no|hoy|ayer|esta semana|este mes|este ano|ahora mismo|en este momento|actualmente|en vivo|news|headlines|breaking|what('s| is) happening|today|yesterday|this (week|month|year)|right now|currently|live)\b/],
  ['reciente', /\b(lo mas (nuevo|reciente)|mas recientes?|recientes?|ultim[oa]s? (version|versiones|modelo|modelos|actualizacion|novedades?|lanzamientos?|estrenos?|episodios?|temporadas?)|novedades|estrenos?|latest|newest|most recent|recent(ly)?|new release)\b/],
  ['precio', /\b(precios?|cuanto (cuesta|vale|sale|cobra)|cotizacion|tipo de cambio|a como (esta|va)|dolar|dolares|euros?|bitcoin|criptos?|acciones de|bolsa de valores|tarifa|prices?|how much (is|does|do|are)|cost of|exchange rate|stock price|crypto)\b/],
  ['evento', /\b(clima|pronostico|temperatura (en|de hoy)|va a llover|quien gano|ganador(es)? de|resultados? (del|de la|de los|de las) (partido|juego|elecciones?|sorteo|loteria|carrera|final|mundial)|marcador|tabla de posiciones|elecciones|weather|forecast|who won|winner of|score of|standings|election results?)\b/],
  ['lugar', /\b(horarios? de|a que hora (abre|cierra)|esta abierto|direccion de|telefono de|donde queda|como llego a|opening hours|is it open|address of|phone number of|how do i get to)\b/]
];
