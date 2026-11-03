//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

// Abre SymphorIA en su propia ventana, como app: Edge viene con todo Windows 10/11; si no está, Chrome o Brave.
// Usa el perfil normal del navegador: así Puter y las cuentas que ya tengas siguen conectadas.
func abrir(T textos, sitio string) {
	for _, n := range []string{"msedge.exe", "chrome.exe", "brave.exe"} {
		if exe := buscarNavegador(n); exe != "" {
			c := exec.Command(exe, "--app="+sitio, "--no-first-run", "--no-default-browser-check")
			c.SysProcAttr = sinVentana()
			if c.Start() == nil {
				return
			}
		}
	}
	avisar(T, T.sinNavegador)
	shellAbrir(sitio)
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
		"msedge.exe": `Microsoft\Edge\Application\msedge.exe`,
		"chrome.exe": `Google\Chrome\Application\chrome.exe`,
		"brave.exe":  `BraveSoftware\Brave-Browser\Application\brave.exe`,
	}[n]
	for _, base := range []string{os.Getenv("ProgramFiles(x86)"), os.Getenv("ProgramFiles"), os.Getenv("LOCALAPPDATA")} {
		if base != "" && existe(filepath.Join(base, rel)) {
			return filepath.Join(base, rel)
		}
	}
	return ""
}

func existe(p string) bool { _, err := os.Stat(p); return err == nil }
