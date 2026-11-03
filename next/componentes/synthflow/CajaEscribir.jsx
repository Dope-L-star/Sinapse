/* SynthFlow en React · caja de escribir
   v3.7 · pasó de árbol JSON generado a componente JSX propio. Conserva IDs, clases y data-* porque el motor (chat.js) los usa.
   v3.7 · ya trae el «+», crear imagen, internet, «Respuestas cortas» y las bolitas (antes el motor los agregaba al arrancar).
   v3.8 · botón de enviar con avión de papel: sale volando cuando la IA empieza a responder y vuelve cuando termina (idea Uiverse #39).
   v3.9 · micrófono del modo dictado (Dictado.jsx) justo antes de #sendBtn; solo se ve con «Modo dictado» encendido en Ajustes.
   Para cambiar el marcado de SynthFlow se edita AQUÍ; chat.html queda solo para las pruebas viejas y build.mjs (verificar-migracion.mjs revisa que no se pierda ningún ID). */
'use client';
import { useEffect } from 'react';
import Dictado from './Dictado';

/* el avión sale volando cuando el motor pone «.stop» (la IA empezó a responder, sea con el botón o con Enter)
   y vuelve a entrar cuando la respuesta termina; con «Animaciones» apagadas en Ajustes no se mueve (html.noanim) */
function usePlane(){
  useEffect(() => {
    const b = document.getElementById('sendBtn');
    if (!b) return;
    let was = b.classList.contains('stop'), tm = 0;
    const play = c => { clearTimeout(tm); b.classList.remove('fly', 'back'); void b.offsetWidth; b.classList.add(c); tm = setTimeout(() => b.classList.remove(c), c === 'fly' ? 640 : 480); };
    const mo = new MutationObserver(() => {
      const now = b.classList.contains('stop');
      if (now === was) return;
      was = now; play(now ? 'fly' : 'back');
    });
    mo.observe(b, { attributes: true, attributeFilter: ['class'] });
    return () => { mo.disconnect(); clearTimeout(tm); };
  }, []);
}

export default function CajaEscribir(){
  usePlane();
  return (
    <>
      <footer className="composer" id="composer">
        <div className="tray" id="tray" />
        <div className="trialbar" id="trialBar" hidden />
        <div className="lockc" id="lockCard" hidden role="region" aria-label="Conecta una IA">
          <span className="lk-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="3" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /><path d="M12 15v2" /></svg>
          </span>
          <div className="lk-t">
            <b id="lockT">Ahora no hay IA disponible</b>
            <small id="lockS">Vuelve en un momento, o conecta Puter y sigue chateando ya. Conecta tu versión pro de las IAs más usadas.</small>
          </div>
          <div className="lk-b">
            <button type="button" className="btn sm flow" data-lk="acc" hidden>Crear mi cuenta · gratis</button>
            <button type="button" className="lnk" data-lk="in" hidden>Ya tengo cuenta</button>
            <button type="button" className="btn sm flow" data-lk="pu">Conectar Puter · gratis</button>
            <button type="button" className="lnk" data-lk="guide">Ver la Guía</button>
          </div>
        </div>
        <div className="comp-in">
          <div className="attw">
            <button className="attach" id="attachBtn" type="button" aria-label="Agregar: archivos, imagen, internet…" data-tip="Archivos, crear imagen, buscar en internet…" aria-haspopup="menu" aria-expanded="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
            <button type="button" className="attach imgb" id="imgBtn" aria-pressed="false" aria-label="Crear una imagen" data-tip="Crear una imagen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="M21 16l-5-5-8 9" /></svg>
            </button>
            <button type="button" className="attach webb" id="webBtn" aria-pressed="false" aria-label="Buscar en internet" data-tip="Buscar en internet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z" /></svg>
            </button>
            <div className="amenu" id="attMenu" role="menu" hidden>
              <button type="button" role="menuitem" data-att="file"><i aria-hidden="true">📄</i><span><b>Cualquier archivo</b><small>PDF, Word, Excel, zip, audio, video, código…</small></span></button>
              <button type="button" role="menuitem" data-att="img">
                <i aria-hidden="true">🖼️</i>
                <span><b>Imagen</b><small>Si tu IA no ve fotos, otra te la describe</small></span>
              </button>
              <button type="button" role="menuitem" data-att="cam" className="only-touch"><i aria-hidden="true">📷</i><span><b>Tomar una foto</b><small>Con la cámara del celular</small></span></button>
              <button type="button" role="menuitem" data-att="mkimg"><i aria-hidden="true">🎨</i><span><b>Crear una imagen</b><small>La IA la dibuja (con tu cuenta)</small></span></button>
              <button type="button" role="menuitem" data-att="web">
                <i aria-hidden="true">🌐</i>
                <span><b>Buscar en internet</b><small>Responde con datos de hoy y sus fuentes</small></span>
              </button>
              <button type="button" role="menuitemcheckbox" data-att="noweb" aria-checked="false">
                <i aria-hidden="true">🚫</i>
                <span><b>No buscar en internet</b><small>Solo con lo que sabe la IA (para tu próximo mensaje)</small></span>
              </button>
              <button type="button" role="menuitemcheckbox" data-att="saver" aria-checked="false"><i aria-hidden="true">🍃</i><span><b>Respuestas cortas</b><small>Gastas menos de tu límite de hoy</small></span><em className="mck" aria-hidden="true" /></button>
              <p className="ahint">También puedes arrastrar archivos aquí o pegarlos con Ctrl+V.</p>
            </div>
            <div className="onchips" id="onChips" />
          </div>
          <input type="file" id="fileIn" multiple hidden />
          <input type="file" id="imgIn" multiple hidden accept="image/*" />
          <input type="file" id="camIn" hidden accept="image/*" capture="environment" />
          <label className="field"><textarea id="inp" rows="1" placeholder="Escribe tu mensaje…" /></label>
          <div className="cpick" id="cPickRow">
            <button type="button" className="cpk4" id="cMode" aria-haspopup="menu" aria-expanded="false" aria-controls="modeMenu" title="Modo de uso">
              <span className="cm-ico" id="cModeI" aria-hidden="true" />
              <b id="cModeL">Automática</b>
              <svg className="cm-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <button type="button" className="agpill" id="agPill" title="Apagar SuperiorSynth">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4z" /></svg>
              <span>El agente elige la IA</span>
              <em>Apagar</em>
            </button>
            <button type="button" className="cpk" id="cPick" aria-haspopup="dialog" title="Cambiar de IA" />
            <button type="button" className="cpk3" id="cEffort" aria-haspopup="menu" aria-expanded="false" aria-controls="effMenu" title="Esfuerzo: cuánto piensa la IA antes de responder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 16a8 8 0 1 1 15 0" /><path d="M12 14l3.5-4" /></svg>
              <span id="cEffortL" />
            </button>
            <button type="button" className="cpk2" id="cCmp">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="7.5" height="14" rx="2" /><rect x="13.5" y="5" width="7.5" height="14" rx="2" /></svg>
              <span>Comparar con otra IA</span>
            </button>
          </div>
          <Dictado />
          <button className="send" id="sendBtn" aria-label="Enviar">
            <svg className="pl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 21.2a.6.6 0 0 0 1.1-.05L21.9 3a.6.6 0 0 0-.8-.8L2.85 8.4a.6.6 0 0 0-.05 1.1l7.6 3.05a2 2 0 0 1 1.1 1.1z" /><path d="M21.6 2.4 10.9 13.1" /></svg>
          </button>
        </div>
        <div className="hintline">
          <span>
            <span className="payl" id="payL" />
            <button className="saver" id="saverBtn" type="button" aria-pressed="false" title="La IA responde más corto y gastas menos de tu límite de hoy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" /><path d="M5 19l7-7" /></svg>
              Respuestas cortas
            </button>
            <em className="kbdh">Enter envía · Shift+Enter salta de línea</em>
          </span>
          <span id="hintRight" />
        </div>
      </footer>
    </>
  );
}
