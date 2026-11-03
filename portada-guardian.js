/* v4.1 · guardián de la portada (index.html). Corre en el <head>, antes de pintar nada.
   La portada es solo para gente nueva: quien ya tiene cuenta o ya entró antes va directo a SynthFlow (chat.html).
   La única forma de volver a verla es la pantallita «Ya tengo el Flow / Soy nuevo» (synthonia.js):
   «Soy nuevo» guarda synthz:portada = { v:'nuevo' } y abre index.html?nuevo=1; «Ya tengo el Flow» guarda { v:'app' }.
   Para no dejar fuera a nadie por error: si no hay ningún dato (o el navegador no deja leerlo) es la primera visita
   de verdad y la portada se queda. Una recarga en la misma visita tampoco saca a nadie (synthz:portadaVista).
   Vercel lo carga con <script src> en index.html; la versión React (next/app/(site)/layout.jsx) lo pone en línea. */
(function () {
  try {
    var p = location.pathname.replace(/^\/+|\/+$/g, '');
    if (p !== '' && p !== 'index' && p !== 'index.html') return;
    var L = localStorage, S = sessionStorage, q = location.search, d = null, go = false;
    try { d = JSON.parse(L.getItem('synthz:portada') || 'null'); } catch (e) {}
    if (/[?&]nuevo=1(&|$)/.test(q)) go = false;                 /* viene de «Soy nuevo» */
    else if (d && d.v === 'nuevo') go = false;                   /* eligió verla */
    else if (d && d.v === 'app') go = true;                      /* eligió entrar directo */
    else if (S.getItem('synthz:portadaVista')) go = false;       /* primera visita: recargó la portada */
    else {
      var chats = false;
      try {
        var st = JSON.parse(L.getItem('synthz:v1') || L.getItem('coro:v1') || 'null');
        if (st && st.chats) for (var k in st.chats) if (st.chats[k] && st.chats[k].length) { chats = true; break; }
      } catch (e) {}
      go = !!(L.getItem('synthz:sess') || L.getItem('synthz:entro') || L.getItem('synthz:visited') || L.getItem('synthz:lastSeen') || chats);
    }
    if (go) {
      document.documentElement.style.visibility = 'hidden';
      location.replace('chat.html' + q + location.hash);
      return;
    }
    S.setItem('synthz:portadaVista', '1');
  } catch (e) {}
})();
