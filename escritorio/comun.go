// SymphorIA · Obertura: instalador y lanzador de escritorio para Windows, hecho por nosotros y gratis.
//
// Un solo .exe hace todo:
//   - Desde Descargas (o cualquier otro lugar): instala en %LOCALAPPDATA%\Programs\SymphorIA (sin administrador),
//     crea los accesos directos (escritorio e Inicio), se registra en «Aplicaciones instaladas» y abre la app.
//   - Desde su carpeta (el acceso directo): abre SymphorIA en su propia ventana (en el navegador de la persona, en modo app; Edge solo si no hay otro)
//     y busca actualizaciones en segundo plano.
//   - Con --desinstalar (lo llama Windows desde «Aplicaciones instaladas»): lo quita todo, limpio.
//
// Banderas: --silencioso (instala o desinstala sin preguntar), --sitio=URL (abrir otra dirección, para pruebas).
// Cómo se arma: ver LEEME.md.
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// version la pone el armado (-ldflags "-X main.version=1.2.3").
var version = "0.0.0-dev"

const (
	nombreApp  = "SymphorIA"
	editor     = "SymphorIA (proyecto gratis)"
	sitioApp   = "https://symphoria.pages.dev/chat.html?app=1&escritorio=1"
	repoGitHub = "Dope-L-star/Sinapse"
	prefijoTag = "obertura-v"
	nombreExe  = "SymphorIA.exe"
)

func tiene(args []string, ops ...string) bool {
	for _, a := range args {
		for _, o := range ops {
			if strings.EqualFold(a, o) {
				return true
			}
		}
	}
	return false
}

func mismaRuta(a, b string) bool {
	return strings.EqualFold(filepath.Clean(a), filepath.Clean(b))
}

func carpetaApp() string {
	return filepath.Join(os.Getenv("LOCALAPPDATA"), "Programs", nombreApp)
}

func carpetaDatos() string {
	return filepath.Join(os.Getenv("LOCALAPPDATA"), nombreApp)
}

// anotar deja una línea en %LOCALAPPDATA%\SymphorIA\obertura.log (para saber qué pasó si algo falla; nunca guarda datos personales)
func anotar(msg string) {
	dir := carpetaDatos()
	os.MkdirAll(dir, 0o755)
	f := filepath.Join(dir, "obertura.log")
	if st, err := os.Stat(f); err == nil && st.Size() > 256<<10 {
		os.Remove(f)
	}
	if h, err := os.OpenFile(f, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644); err == nil {
		fmt.Fprintf(h, "%s v%s %s\n", time.Now().Format(time.RFC3339), version, msg)
		h.Close()
	}
}
