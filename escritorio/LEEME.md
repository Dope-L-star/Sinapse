# SymphorIA · Obertura (instalador de Windows)

**Obertura** es la pieza con la que empieza una sinfonía. Este es el instalador propio de SymphorIA para
Windows 10 y 11: gratis, hecho por nosotros, sin servicios de pago.

Un solo archivo, `SymphorIA-Obertura.exe` (unos 6 MB), hace todo:

| Qué | Cómo |
|---|---|
| **Instala** | Se copia a `%LOCALAPPDATA%\Programs\SymphorIA\SymphorIA.exe`. Solo para ese usuario: **no pide administrador**. |
| **Acceso directo** | En el escritorio (también si el escritorio está en OneDrive) y en el menú Inicio, con el ícono de SymphorIA. |
| **Abre la app** | En su propia ventana, sin barra del navegador (modo app), con **tu navegador, no con Edge** (ver «Qué navegador usa» abajo). Usa el perfil normal del navegador, así Puter y las cuentas siguen conectadas. Abre `https://symphoria.pages.dev/chat.html` (SynthFlow directo). |
| **Se actualiza solo** | Al abrirse (como mucho cada 6 horas) mira los *releases* de GitHub con etiqueta `obertura-vX.Y.Z`. Si hay uno más nuevo, lo baja, **revisa su huella SHA-256** y cambia el .exe. La próxima vez que se abra ya es la nueva. La página en sí siempre está al día (es la web). |
| **Se desinstala limpio** | Aparece en *Configuración › Aplicaciones › Aplicaciones instaladas* como «SymphorIA». Al quitarla se borran los accesos directos, la entrada del registro, la carpeta del programa y la de datos. Los chats siguen en la cuenta. |
| **ES / EN** | Todos los textos en español o inglés según el idioma de Windows. |

## Qué navegador usa (v1.2)

**Microsoft Edge nunca va primero** (pedido de Sammuel, 9-nov: casi nadie lo usa). El orden, en `navegadores.go`:

1. El navegador **predeterminado** de Windows, si sabe abrir una app en su propia ventana: Chrome, Brave, Vivaldi u Opera.
2. Si no, el primero que haya instalado de esos, en ese orden.
3. Si el predeterminado es otro (Firefox…): la app se abre en una pestaña de ese navegador (Firefox no tiene modo app) y la
   ventana de instalación usa las cajitas de siempre. Nunca se le fuerza Edge.
4. Edge solo si no hay ninguno de los anteriores (viene con Windows 10 y 11: así nadie se queda sin ventana). Si Edge es el
   predeterminado **pero hay Chrome, Brave, Vivaldi u Opera instalado, gana ese**.

Cada vez deja en `obertura.log` qué navegador eligió (por ejemplo `navegador: chrome.exe (modo app)`).
Probado en Wine con navegadores de mentira (Chrome+Edge, solo Edge, Brave predeterminado, Edge predeterminado con Chrome, Firefox) y con `go test` (`navegadores_test.go`).

## Logo y «Powered by Claude»

- El ícono del .exe, de los accesos directos y de la ventana es el logo nuevo de SynthFlow (la **F** de corriente,
  `media/v44/synthflow.svg`). Los PNG de `icono/` salen de `media/app/sf-512.png`. La **S** de SymphorIA sigue junto al nombre.
- Abajo de la ventana dice **«Impulsado por Claude»** / **«Powered by Claude»** (con la chispa de Claude). En la página, la chispa
  naranja de la esquina de SynthFlow y Pulsem muestra el mismo letrero al pasar el mouse, enfocarla o tocarla
  (`src/core/25n-v45-powered-claude.js`; prueba: `node cloudflare/preparar.mjs && node t/web/powered-claude.mjs`).

## La ventana propia (v1.1)

Al abrir `SymphorIA-Obertura.exe` ya no salen las cajitas grises de Windows: se abre **una ventana con el diseño de
SymphorIA** (aurora, logo animado, pasos con avance, confeti al terminar), en español o inglés según Windows y con botón
ES/EN. Muestra qué hace la instalación, deja elegir si se crea el acceso directo del escritorio, ve si ya estaba instalada
(«Actualizar» / «Reinstalar» / «Solo abrirla») y al final abre la app. Quitarla desde *Aplicaciones instaladas* usa la
misma ventana.

Cómo está hecha (sin nada de pago ni librerías nuevas):
- `interfaz/` (HTML, CSS y JS) va **dentro del .exe** (`go:embed`).
- `ventana.go` levanta un servidor diminuto **solo en 127.0.0.1**, puerto al azar y una clave al azar en la dirección;
  revisa el nombre del host y pide una cabecera propia para todo lo que cambia algo.
- `ventana_windows.go` la abre en el navegador elegido (ver arriba) en modo app con un **perfil temporal** (ventana limpia de
  520 × 680, centrada) y lo borra al cerrar. Si no hay navegador o la página no carga en 25 s, vuelven las
  preguntas de siempre: nadie se queda sin instalar.
- Verla sin Windows: `cd escritorio && go run . --demo` (con `--en`, `--ya`, `--falla` o `--desinstalar`) y abrir la
  dirección que imprime.

## Descargarla desde la página

En la ventana «Descarga nuestra app» (botones *Instalar la app* de la portada y *Descargar la app SynthFlow* de los
ajustes), en un computador con Windows aparece **Descargar para Windows** con la versión y el peso. Lo atiende
`functions/descargar/windows.js` (Cloudflare Pages, gratis): busca el release más nuevo `obertura-vX.Y.Z` y manda directo
al .exe. Mientras no haya ningún release publicado, el botón dice **«Muy pronto para Windows»** y no hace nada.

Banderas (para soporte o empresas): `--silencioso` instala o desinstala sin preguntar,
`--desinstalar` quita la app, `--sitio=URL` abre otra dirección (pruebas).
Si algo falla queda una línea en `%LOCALAPPDATA%\SymphorIA\obertura.log` (nunca datos personales).

## Cómo se genera

Necesita **Go 1.22 o más nuevo** (gratis, https://go.dev/dl) y Node. Se arma desde Linux, Mac o Windows:

```bash
node escritorio/armar.mjs 1.0.0
```

Sale `escritorio/salida/SymphorIA-Obertura.exe` y `SymphorIA-Obertura.exe.sha256`. El script:
1. corre las pruebas (`go test`),
2. arma el ícono, el manifiesto (sin administrador, nítido en pantallas HD) y los datos de versión con
   `escritorio/recursos` (código nuestro, sin herramientas de afuera),
3. compila para Windows 64 bits sin ventana de consola.

## Publicar una versión (y que todas las instaladas se actualicen)

Gratis con GitHub Actions (`.github/workflows/obertura.yml`):

- subir una etiqueta: `git tag obertura-v1.0.1 && git push origin obertura-v1.0.1`, **o**
- en GitHub: *Actions › Obertura › Run workflow* y escribir la versión.

El workflow arma el .exe y crea el *release* con el .exe y su `.sha256`. El enlace fijo para descargar la
última versión es:

```
https://github.com/Dope-L-star/SynthZ-Style/releases/latest/download/SymphorIA-Obertura.exe
```

(funciona mientras el último release del repo sea uno de Obertura).

## Firma digital: lo que falta y por qué

El .exe **no va firmado**. Por eso, la primera vez Windows SmartScreen muestra
«Windows protegió tu PC». Se instala igual: **Más información › Ejecutar de todas formas**.

- **Por qué:** firmar exige un certificado de firma de código emitido por una autoridad (DigiCert, Sectigo…),
  que cuesta dinero cada año, o Azure Trusted Signing (de pago mensual). Un certificado hecho por nosotros
  no sirve: Windows no lo reconoce y el aviso sigue igual.
- **Cómo se soluciona gratis:** [SignPath Foundation](https://signpath.org) firma gratis proyectos de código
  abierto. Requisitos: repositorio público (ya lo es), una licencia de código abierto en el repo, y que las
  versiones se armen en CI (ya lo hace el workflow). Se pide en su web; si aceptan, se agrega un paso de
  firma al workflow y el aviso desaparece.
- **Mientras tanto:** el aviso de SmartScreen también se va solo cuando el archivo junta «reputación»
  (suficientes descargas sin reportes). La huella SHA-256 de cada release permite comprobar que el archivo
  es el original.

## Probarlo

- `go test ./...` dentro de `escritorio/` (comparación de versiones).
- En Linux se probó entero con Wine: instalar, accesos directos, entrada en Aplicaciones, abrir en modo app,
  actualizar desde un release falso (con `OBERTURA_PRUEBA_API=<url de un releases.json>`) y desinstalar sin
  dejar rastros. En Windows real: abrir el .exe, aceptar, y revisar lo de la tabla de arriba.
