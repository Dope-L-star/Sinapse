# SymphorIA · Obertura (instalador de Windows)

**Obertura** es la pieza con la que empieza una sinfonía. Este es el instalador propio de SymphorIA para
Windows 10 y 11: gratis, hecho por nosotros, sin servicios de pago.

Un solo archivo, `SymphorIA-Obertura.exe` (unos 6 MB), hace todo:

| Qué | Cómo |
|---|---|
| **Instala** | Se copia a `%LOCALAPPDATA%\Programs\SymphorIA\SymphorIA.exe`. Solo para ese usuario: **no pide administrador**. |
| **Acceso directo** | En el escritorio (también si el escritorio está en OneDrive) y en el menú Inicio, con el ícono de SymphorIA. |
| **Abre la app** | En su propia ventana, sin barra del navegador: Microsoft Edge en modo app (viene con Windows); si no está, Chrome o Brave; si no hay ninguno, el navegador normal. Usa el perfil normal del navegador, así Puter y las cuentas siguen conectadas. Abre `https://symphoria.pages.dev/chat.html` (SynthFlow directo). |
| **Se actualiza solo** | Al abrirse (como mucho cada 6 horas) mira los *releases* de GitHub con etiqueta `obertura-vX.Y.Z`. Si hay uno más nuevo, lo baja, **revisa su huella SHA-256** y cambia el .exe. La próxima vez que se abra ya es la nueva. La página en sí siempre está al día (es la web). |
| **Se desinstala limpio** | Aparece en *Configuración › Aplicaciones › Aplicaciones instaladas* como «SymphorIA». Al quitarla se borran los accesos directos, la entrada del registro, la carpeta del programa y la de datos. Los chats siguen en la cuenta. |
| **ES / EN** | Todos los textos en español o inglés según el idioma de Windows. |

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
