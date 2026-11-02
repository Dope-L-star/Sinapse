/* Colores de cada tema de SynthFlow para la vista previa de Ajustes.
   Son los mismos de src/core-css/10-v24-espacio.css, 10b-v30-temas-orquesta.css y 00a-v23-colores.css;
   next/tests/vista-temas.test.mjs falla si alguien cambia el CSS y se olvida de esto. */
export const PALETAS = {
  synthz:  { bg:'#0b0820', deep:'#2a1458', primary:'#7b3ff2', secondary:'#ff3d9a', warm:'#ff7a45', light:'#3de0ff', text:'#f6f3ff', gold:'#ff9a52', wine:'#ff3d9a' },
  oceano:  { bg:'#060b1f', deep:'#0f2a66', primary:'#2f6bff', secondary:'#3de0ff', warm:'#ffd166', light:'#a5b4ff', text:'#eef4ff', gold:'#7cc9e3', wine:'#5a7bd6' },
  bosque:  { bg:'#051a1c', deep:'#0b3d42', primary:'#14c8a8', secondary:'#3da9ff', warm:'#b8f25c', light:'#7df9ff', text:'#efffFB', gold:'#9bd68f', wine:'#3fa58a' },
  lavanda: { bg:'#120a24', deep:'#34205e', primary:'#a98bff', secondary:'#d46fb0', warm:'#ffb3c7', light:'#bfa9f2', text:'#f7f2ff', gold:'#bfa9f2', wine:'#d46fb0' },
  aurora:  { bg:'#04131a', deep:'#0b3a3f', primary:'#3dffc2', secondary:'#a46bff', warm:'#9fffd6', light:'#8ef5ff', text:'#effffa', gold:'#9fffd6', wine:'#a46bff' },
  oro:     { bg:'#0b0a08', deep:'#2a2316', primary:'#ffc24a', secondary:'#ffe7a8', warm:'#ffd27a', light:'#f5d58a', text:'#fff8e8', gold:'#ffd27a', wine:'#b8862e' },
};
/* el estilo Simple usa sus propios colores (src/chat-css/22-v23-simple.css), sin importar el tema */
export const SIMPLE = { bg:'#252422', side:'#1d1c1a', card:'#2f2e2b', text:'#f2efe8', soft:'#c8c4b8', mute:'#9a968b', acc:'#d9a066' };

export const NOMBRES = {
  es: { synthz:'SymphorIA', oceano:'Océano', bosque:'Bosque', lavanda:'Lavanda', aurora:'Aurora', oro:'Oro negro' },
  en: { synthz:'SymphorIA', oceano:'Ocean', bosque:'Forest', lavanda:'Lavender', aurora:'Aurora', oro:'Black gold' },
};
