//go:build windows

package main

import (
	"os"
	"path/filepath"
	"strings"
)

func main() {
	args := os.Args[1:]
	silencioso := tiene(args, "--silencioso", "/S", "/s")
	sitio := sitioApp
	for _, a := range args {
		if strings.HasPrefix(a, "--sitio=") {
			sitio = strings.TrimPrefix(a, "--sitio=")
		}
	}
	T := idioma()

	if tiene(args, "--desinstalar", "/uninstall") {
		desinstalar(T, silencioso)
		return
	}
	yo, _ := os.Executable()
	yo, _ = filepath.EvalSymlinks(yo)
	if !mismaRuta(filepath.Dir(yo), carpetaApp()) {
		instalar(T, yo, silencioso, sitio)
		return
	}
	// lanzador: abre ya la app y, mientras, mira si hay versión nueva
	limpiarViejo()
	abrir(T, sitio)
	buscarActualizacion(T)
}
