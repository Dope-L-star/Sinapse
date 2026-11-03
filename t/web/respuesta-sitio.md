**Plan**
- Dos páginas: inicio (`index.html`) y nosotros (`nosotros.html`), con el mismo menú.
- Estilos en `css/estilos.css` y la interacción en `js/app.js`.
- Paleta cálida, responsive y accesible.

### 📄 `index.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panadería Aurora</title>
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body>
  <header class="top">
    <a class="logo" href="index.html">🥐 Aurora</a>
    <nav>
      <a href="index.html" aria-current="page">Inicio</a>
      <a href="nosotros.html">Nosotros</a>
      <a href="#menu">Menú</a>
    </nav>
  </header>
  <main>
    <section class="hero">
      <h1>Pan recién horneado, todos los días</h1>
      <p>Masa madre, mantequilla de verdad y cero prisa.</p>
      <button id="pedir" class="btn">Pedir ahora</button>
      <p id="aviso" class="aviso" hidden>¡Listo! Te esperamos en la tienda.</p>
    </section>
    <section id="menu" class="menu">
      <h2>Menú del día</h2>
      <div class="cards">
        <article class="card"><h3>Croissant</h3><p>Hojaldre de 27 capas.</p><b>$2.50</b></article>
        <article class="card"><h3>Pan de masa madre</h3><p>Fermentado 36 horas.</p><b>$6.00</b></article>
        <article class="card"><h3>Rollo de canela</h3><p>Con glaseado de vainilla.</p><b>$3.20</b></article>
      </div>
    </section>
  </main>
  <footer>Hecho con harina y cariño · <a href="nosotros.html">Conócenos</a></footer>
  <script src="js/app.js"></script>
</body>
</html>
```

### 📄 `nosotros.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nosotros · Panadería Aurora</title>
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body>
  <header class="top">
    <a class="logo" href="index.html">🥐 Aurora</a>
    <nav>
      <a href="index.html">Inicio</a>
      <a href="nosotros.html" aria-current="page">Nosotros</a>
    </nav>
  </header>
  <main>
    <section class="hero small">
      <h1>Nuestra historia</h1>
      <p>Empezamos en 2009 con un horno de leña y una receta de la abuela.</p>
      <a class="btn" href="index.html#menu">Ver el menú</a>
    </section>
  </main>
  <footer>Hecho con harina y cariño</footer>
  <script src="js/app.js"></script>
</body>
</html>
```

### 🎨 `css/estilos.css`
```css
:root { --acento: #c2410c; --fondo: #fff7ed; --texto: #1c1917; }
* { box-sizing: border-box; margin: 0; }
body { font-family: system-ui, sans-serif; background: var(--fondo); color: var(--texto); line-height: 1.6; }
.top { display: flex; justify-content: space-between; align-items: center; padding: 16px 24px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.06); position: sticky; top: 0; }
.logo { font-weight: 800; font-size: 1.25rem; color: var(--acento); text-decoration: none; }
nav a { margin-left: 16px; color: var(--texto); text-decoration: none; font-weight: 600; }
nav a[aria-current="page"] { color: var(--acento); border-bottom: 2px solid var(--acento); }
.hero { padding: 72px 24px; text-align: center; background: linear-gradient(160deg, #fed7aa, #fff7ed); }
.hero.small { padding: 56px 24px; }
.hero h1 { font-size: clamp(1.8rem, 5vw, 3rem); margin-bottom: 12px; }
.btn { display: inline-block; margin-top: 20px; padding: 14px 28px; border: 0; border-radius: 999px; background: var(--acento); color: #fff; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
.btn:hover { filter: brightness(1.1); }
.aviso { margin-top: 14px; font-weight: 700; color: #166534; }
.menu { padding: 48px 24px; max-width: 960px; margin: 0 auto; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 20px; }
.card { background: #fff; padding: 20px; border-radius: 16px; box-shadow: 0 4px 18px rgba(0,0,0,.06); }
.card b { color: var(--acento); }
footer { text-align: center; padding: 32px; color: #57534e; }
footer a { color: var(--acento); }
```

### ⚙️ `js/app.js`
```javascript
const pedir = document.getElementById('pedir');
const aviso = document.getElementById('aviso');
if (pedir && aviso) {
  pedir.addEventListener('click', () => {
    aviso.hidden = false;
    pedir.textContent = '¡Pedido hecho!';
  });
}
```

Abre `index.html` en tu navegador; el menú lleva a `nosotros.html` y de vuelta.
