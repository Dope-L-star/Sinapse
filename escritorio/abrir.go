//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

// Abre SymphorIA en su propia ventana, como app, con el navegador que elija elegirNavegador (el predeterminado de Windows
// si sirve; Edge solo si no hay otro: ver navegadores.go).
// Usa el perfil normal del navegador: así Puter y las cuentas que ya tengas siguen conectadas.
func abrir(T textos, sitio string) {
	nb := elegirNavegador()
	if nb.exe != "" {
		var c *exec.Cmd
		if nb.app {
			c = exec.Command(nb.exe, "--app="+sitio, "--no-first-run", "--no-default-browser-check")
		} else {
			// navegador sin modo app (Firefox…): se abre la página en una pestaña, sin tocar nada más
			c = exec.Command(nb.exe, sitio)
		}
		c.SysProcAttr = sinVentana()
		if c.Start() == nil {
			return
		}
	}
	avisar(T, T.sinNavegador)
	shellAbrir(sitio)
}

// ruta del navegador predeterminado de Windows ("" si no se pudo saber)
func navegadorPredeterminado() string {
	prog := ""
	if k, err := registry.OpenKey(registry.CURRENT_USER, `Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice`, registry.QUERY_VALUE); err == nil {
		prog, _, _ = k.GetStringValue("ProgId")
		k.Close()
	}
	claves := []string{`https\shell\open\command`} // Windows viejo o sin elección guardada
	if prog != "" {
		claves = append([]string{prog + `\shell\open\command`}, claves...)
	}
	for _, c := range claves {
		k, err := registry.OpenKey(registry.CLASSES_ROOT, c, registry.QUERY_VALUE)
		if err != nil {
			continue
		}
		cmd, _, err := k.GetStringValue("")
		k.Close()
		if err != nil {
			continue
		}
		if ex, err := registry.ExpandString(cmd); err == nil {
			cmd = ex
		}
		if exe := exeDeComando(cmd); exe != "" && existe(exe) {
			return exe
		}
	}
	return ""
}

// elegirNavegador aplica la regla de navegadores.go con lo que hay en este equipo.
func elegirNavegador() navegador {
	nb := decidir(navegadorPredeterminado(), buscarNavegador)
	anotar("navegador: " + baseExe(nb.exe) + map[bool]string{true: " (modo app)", false: " (pestaña)"}[nb.app])
	return nb
}

func buscarNavegador(n string) string {
	for _, raiz := range []registry.Key{registry.CURRENT_USER, registry.LOCAL_MACHINE} {
		k, err := registry.OpenKey(raiz, `SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\`+n, registry.QUERY_VALUE)
		if err == nil {
			p, _, err := k.GetStringValue("")
			k.Close()
			if err == nil && existe(p) {
				return p
			}
		}
	}
	rel := map[string]string{
		"msedge.exe":  `Microsoft\Edge\Application\msedge.exe`,
		"chrome.exe":  `Google\Chrome\Application\chrome.exe`,
		"brave.exe":   `BraveSoftware\Brave-Browser\Application\brave.exe`,
		"vivaldi.exe": `Vivaldi\Application\vivaldi.exe`,
		"opera.exe":   `Programs\Opera\opera.exe`,
	}[n]
	for _, base := range []string{os.Getenv("ProgramFiles(x86)"), os.Getenv("ProgramFiles"), os.Getenv("LOCALAPPDATA")} {
		if base != "" && existe(filepath.Join(base, rel)) {
			return filepath.Join(base, rel)
		}
	}
	return ""
}

func existe(p string) bool { _, err := os.Stat(p); return err == nil }
