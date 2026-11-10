//go:build windows

package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"time"
)

// accionesWin son las acciones de verdad que la ventana pide en Windows.
type accionesWin struct {
	origen, sitio string
	quitada       bool
}

func (a *accionesWin) estado() estadoEquipo {
	exe := filepath.Join(carpetaApp(), nombreExe)
	return estadoEquipo{Instalada: existe(exe), VersionInstalada: versionInstalada(), Carpeta: carpetaApp()}
}

func (a *accionesWin) instalar(escritorio bool, avance func(string)) (bool, error) {
	// que el paso se alcance a ver (si no, todo pasa en un parpadeo y parece que no hizo nada)
	lento := func(p string) { avance(p); time.Sleep(450 * time.Millisecond) }
	return instalarArchivos(a.origen, escritorio, lento)
}

func (a *accionesWin) desinstalar(avance func(string)) error {
	lento := func(p string) { avance(p); time.Sleep(450 * time.Millisecond) }
	err := quitarTodo(lento)
	if err == nil {
		a.quitada = true
	}
	return err
}

func (a *accionesWin) abrirApp() {
	sitio := a.sitio
	if sitio == "" {
		sitio = sitioApp
	}
	abrirInstalada(sitio)
}

// abrirVentana muestra la ventana propia y espera a que la persona la cierre.
// Devuelve false si no se pudo mostrar (entonces se usan las cajitas de siempre).
func abrirVentana(modo string, T textos, acc acciones) bool {
	// la ventana necesita un navegador con modo app (Chrome, Brave, Vivaldi, Opera; Edge solo si no hay otro).
	// Si el navegador de la persona es otro (Firefox…), se usan las cajitas de siempre: nunca se le fuerza Edge.
	nb := elegirNavegador()
	if nb.exe == "" || !nb.app {
		return false
	}
	v := nuevaVentana(modo, T.codigo, acc)
	url, err := v.servir()
	if err != nil {
		anotar("ventana: " + err.Error())
		return false
	}
	perfil, err := os.MkdirTemp("", "symphoria-obertura-")
	if err != nil {
		v.terminar()
		return false
	}
	defer func() {
		// el navegador suelta sus archivos un momento después de cerrarse
		for i := 0; i < 10; i++ {
			if os.RemoveAll(perfil) == nil {
				return
			}
			time.Sleep(300 * time.Millisecond)
		}
	}()
	const ancho, alto = 520, 680
	x, y := centro(ancho, alto)
	nav := exec.Command(nb.exe, "--app="+url, "--user-data-dir="+perfil,
		"--window-size="+strconv.Itoa(ancho)+","+strconv.Itoa(alto),
		"--window-position="+strconv.Itoa(x)+","+strconv.Itoa(y),
		"--lang="+T.codigo, "--no-first-run", "--no-default-browser-check", "--disable-extensions",
		"--disable-sync", "--disable-default-apps", "--disable-component-update",
		"--disable-features=Translate,msEdgeSidebarV2,msUndersideButton,msHubApps,msImplicitSignin,msEdgeShoppingUI")
	nav.Dir = os.TempDir()
	if nav.Start() != nil {
		v.terminar()
		return false
	}
	cerroNav := make(chan struct{})
	go func() { nav.Wait(); close(cerroNav) }()
	// si la página no carga en 25 s, algo raro pasa: se cierra y se usan las cajitas
	select {
	case <-v.cargo:
	case <-cerroNav:
		v.terminar()
		return false
	case <-time.After(25 * time.Second):
		anotar("ventana: la página no cargó a tiempo")
		nav.Process.Kill()
		v.terminar()
		return false
	}
	select {
	case <-v.fin:
	case <-cerroNav:
		// cerró la ventana: si había algo a medias, se espera a que termine (nunca se deja una instalación partida)
		for i := 0; i < 120; i++ {
			v.mu.Lock()
			ocupado := v.trabajo == "trabajando"
			v.mu.Unlock()
			if !ocupado {
				break
			}
			time.Sleep(500 * time.Millisecond)
		}
		v.terminar()
	}
	select {
	case <-cerroNav:
	case <-time.After(1500 * time.Millisecond):
		nav.Process.Kill()
		<-cerroNav
	}
	return true
}

// centro de la pantalla principal, en las mismas unidades que usa el navegador (píxeles «lógicos»)
func centro(ancho, alto int) (int, int) {
	cx, _, _ := pMetricas.Call(0)
	cy, _, _ := pMetricas.Call(1)
	dpi := uintptr(96)
	if pDpi.Find() == nil {
		if d, _, _ := pDpi.Call(); d > 0 {
			dpi = d
		}
	}
	w, h := int(cx)*96/int(dpi), int(cy)*96/int(dpi)
	x, y := (w-ancho)/2, (h-alto)/2
	if x < 0 {
		x = 0
	}
	if y < 0 {
		y = 0
	}
	return x, y
}
