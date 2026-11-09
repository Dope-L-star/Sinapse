//go:build !windows

// Fuera de Windows solo se compila para las pruebas (go test) y para ver la ventana del instalador
// en un navegador cualquiera:  go run . --demo  (abre una dirección 127.0.0.1 con acciones de mentira).
package main

import (
	"fmt"
	"os"
	"time"
)

func main() {
	modo := "instalar"
	idioma := "es"
	for _, a := range os.Args[1:] {
		switch a {
		case "--desinstalar":
			modo = "desinstalar"
		case "--en":
			idioma = "en"
		}
	}
	if !tiene(os.Args[1:], "--demo") {
		fmt.Println("Obertura es para Windows. Para ver su ventana aquí: go run . --demo [--desinstalar] [--en] [--ya] [--falla]")
		return
	}
	acc := &accionesDemo{ya: tiene(os.Args[1:], "--ya"), falla: tiene(os.Args[1:], "--falla")}
	v := nuevaVentana(modo, idioma, acc)
	url, err := v.servir()
	if err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	fmt.Println(url)
	<-v.fin
}

func guardarVersion(string) {}

// accionesDemo hacen como que instalan (para ver la ventana y probarla sin Windows)
type accionesDemo struct{ ya, falla bool }

func (a *accionesDemo) estado() estadoEquipo {
	e := estadoEquipo{Carpeta: `C:\Users\Sammuel\AppData\Local\Programs\SymphorIA`}
	if a.ya {
		e.Instalada, e.VersionInstalada = true, "0.9.0"
	}
	return e
}

func (a *accionesDemo) instalar(escritorio bool, avance func(string)) (bool, error) {
	for _, p := range []string{"copiar", "atajos", "registro"} {
		avance(p)
		time.Sleep(900 * time.Millisecond)
		if a.falla && p == "atajos" {
			return a.ya, fmt.Errorf("acceso directo de Inicio: Acceso denegado.")
		}
	}
	avance("listo")
	return a.ya, nil
}

func (a *accionesDemo) desinstalar(avance func(string)) error {
	for _, p := range []string{"quitar", "limpiar"} {
		avance(p)
		time.Sleep(900 * time.Millisecond)
	}
	avance("listo")
	return nil
}

func (a *accionesDemo) abrirApp() {}
