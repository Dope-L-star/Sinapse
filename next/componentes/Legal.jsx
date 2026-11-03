import '../app/(legal)/legal.css';

/* Términos y Privacidad comparten la misma cabecera, el mismo ancho y el mismo pie.
   v3.7 · cada página trae su versión en español y en inglés: se ve la de tu idioma de SymphorIA (o el de tu navegador)
   y cambia sola, sin recargar, si lo cambias aquí o en otra pestaña (lo hace /ayuda.js, el mismo de Ayuda). */
export default function Legal({ actual, titulo, bajada, tituloEn, bajadaEn, en, children }){
  const link = (href, es, eng) => <a href={href} aria-current={actual === href ? 'page' : undefined}><span lang="es">{es}</span><span lang="en" hidden>{eng}</span></a>;
  return (
    <div className="legal" data-title-es={titulo + ' · SymphorIA'} data-title-en={(tituloEn || titulo) + ' · SymphorIA'}>
      <header className="top">
        <a className="logo" href="index.html"><img src="media/v30/symphoria.svg" alt="" />Symphor<span className="gS">IA</span></a>
        <nav>
          {link('ayuda.html', 'Ayuda', 'Help')}{link('privacidad.html', 'Privacidad', 'Privacy')}{link('terminos.html', 'Términos', 'Terms')}
          <a href="index.html"><span lang="es">Volver a SymphorIA</span><span lang="en" hidden>Back to SymphorIA</span></a>
          <button type="button" id="ayLang" className="aylang">English</button>
        </nav>
      </header>
      <main data-mv-no="">
        <div lang="es">
          <h1>{titulo}</h1>
          <p className="sub">{bajada}</p>
          {children}
        </div>
        {en ? <div lang="en" hidden>
          <h1>{tituloEn}</h1>
          <p className="sub">{bajadaEn}</p>
          {en}
        </div> : null}
      </main>
      <footer><span lang="es">SymphorIA y SynthFlow · Hecho en Colombia.</span><span lang="en" hidden>SymphorIA and SynthFlow · Made in Colombia.</span></footer>
    </div>
  );
}
