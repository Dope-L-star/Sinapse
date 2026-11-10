package main

// Qué navegador usa Obertura para abrir SymphorIA (y su ventana de instalación).
//
// Regla (pedida por Sammuel, 9-nov): Microsoft Edge NUNCA va primero. Casi nadie lo usa y venía en la lista de adelante.
// Ahora el orden es:
//   1. el navegador predeterminado de Windows, si sabe abrir una app en su propia ventana (Chrome, Brave, Vivaldi, Opera);
//   2. si no, el primero que haya instalado de esos (Chrome, Brave, Vivaldi, Opera);
//   3. si el predeterminado es otro (Firefox…): la app se abre en una pestaña de ese navegador; la ventana de instalación
//      usa las cajitas de siempre (Firefox no tiene modo app);
//   4. Edge solo si no hay ninguno de los anteriores (viene con Windows 10 y 11, así nadie se queda sin ventana).
// Esta parte no depende de Windows: así se prueba en cualquier equipo (go test).

import (
	"path/filepath"
	"strings"
)

// navegador es el elegido: su .exe y si sabe abrir una dirección como app (--app=URL), o sea, si es de la familia Chromium.
type navegador struct {
	exe string
	app bool
}

// Los que Obertura prefiere, en este orden. Edge no está aquí a propósito: ver arriba.
var navegadoresPreferidos = []string{"chrome.exe", "brave.exe", "vivaldi.exe", "opera.exe"}

const edgeExe = "msedge.exe"

// nombreExe de una ruta de Windows, en minúsculas (filepath de Linux no entiende «\»)
func baseExe(ruta string) string {
	ruta = strings.ReplaceAll(ruta, `\`, "/")
	return strings.ToLower(filepath.Base(ruta))
}

func esPreferido(exe string) bool {
	b := baseExe(exe)
	for _, n := range navegadoresPreferidos {
		if b == n {
			return true
		}
	}
	return false
}

// exeDeComando saca la ruta del programa de un comando del registro, p. ej.
//
//	"C:\Program Files\Google\Chrome\Application\chrome.exe" --single-argument %1
//	C:\Program Files\Mozilla Firefox\firefox.exe -osint -url "%1"
func exeDeComando(cmd string) string {
	cmd = strings.TrimSpace(cmd)
	if cmd == "" {
		return ""
	}
	if cmd[0] == '"' {
		if i := strings.Index(cmd[1:], `"`); i >= 0 {
			return cmd[1 : 1+i]
		}
		return ""
	}
	if i := strings.Index(strings.ToLower(cmd), ".exe"); i >= 0 {
		return cmd[:i+4]
	}
	return ""
}

// programas de Windows que reparten direcciones pero no son un navegador (si el registro apunta a uno, es como no saber cuál es)
func esLanzadorGenerico(exe string) bool {
	switch baseExe(exe) {
	case "rundll32.exe", "explorer.exe", "launchwinapp.exe", "openwith.exe", "winebrowser.exe", "cmd.exe":
		return true
	}
	return false
}

// decidir aplica la regla de arriba. predeterminado es el .exe del navegador por defecto de Windows ("" si no se supo);
// instalado dice si un navegador de la lista está instalado y devuelve su ruta.
func decidir(predeterminado string, instalado func(nombre string) string) navegador {
	if esLanzadorGenerico(predeterminado) {
		predeterminado = ""
	}
	if predeterminado != "" && esPreferido(predeterminado) {
		return navegador{exe: predeterminado, app: true}
	}
	for _, n := range navegadoresPreferidos {
		if exe := instalado(n); exe != "" {
			return navegador{exe: exe, app: true}
		}
	}
	if predeterminado != "" && baseExe(predeterminado) != edgeExe {
		return navegador{exe: predeterminado, app: false}
	}
	if exe := instalado(edgeExe); exe != "" {
		return navegador{exe: exe, app: true}
	}
	return navegador{}
}
