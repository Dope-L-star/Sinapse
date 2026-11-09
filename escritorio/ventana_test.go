package main

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"
)

type accPrueba struct{ pasos []string }

func (a *accPrueba) estado() estadoEquipo { return estadoEquipo{Carpeta: "C:/x"} }
func (a *accPrueba) instalar(esc bool, av func(string)) (bool, error) {
	for _, p := range []string{"copiar", "atajos", "registro", "listo"} {
		av(p)
		a.pasos = append(a.pasos, p)
	}
	return false, nil
}
func (a *accPrueba) desinstalar(av func(string)) error { return nil }
func (a *accPrueba) abrirApp()                         {}

func TestVentana(t *testing.T) {
	acc := &accPrueba{}
	v := nuevaVentana("instalar", "es", acc)
	url, err := v.servir()
	if err != nil {
		t.Fatal(err)
	}
	defer v.terminar()
	base := strings.TrimSuffix(url, "/"+v.clave+"/")

	// sin la clave no hay nada
	if r, _ := http.Get(base + "/"); r.StatusCode != 404 {
		t.Errorf("sin clave debió ser 404, fue %d", r.StatusCode)
	}
	// la página sale
	r, err := http.Get(url)
	if err != nil || r.StatusCode != 200 {
		t.Fatalf("la página no cargó: %v %v", err, r)
	}
	b, _ := io.ReadAll(r.Body)
	if !strings.Contains(string(b), "Obertura") {
		t.Error("la página no es la del instalador")
	}
	// otro nombre de dominio (DNS rebinding) no sirve
	req, _ := http.NewRequest("GET", url+"api/estado", nil)
	req.Host = "malo.example:80"
	if r, _ := http.DefaultClient.Do(req); r.StatusCode != 404 {
		t.Errorf("otro Host debió ser 404, fue %d", r.StatusCode)
	}
	// POST sin la cabecera propia: prohibido
	if r, _ := http.Post(url+"api/instalar", "text/plain", nil); r.StatusCode != 403 {
		t.Errorf("POST sin cabecera debió ser 403, fue %d", r.StatusCode)
	}
	// desinstalar en modo instalar: no existe
	post := func(q string) int {
		req, _ := http.NewRequest("POST", url+"api/"+q, nil)
		req.Header.Set("X-Obertura", "1")
		r, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		return r.StatusCode
	}
	if c := post("desinstalar"); c != 404 {
		t.Errorf("desinstalar en modo instalar debió ser 404, fue %d", c)
	}
	if c := post("instalar"); c != 202 {
		t.Fatalf("instalar debió ser 202, fue %d", c)
	}
	var e map[string]any
	for i := 0; i < 50; i++ {
		r, _ := http.Get(url + "api/estado")
		json.NewDecoder(r.Body).Decode(&e)
		if e["trabajo"] == "listo" {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if e["trabajo"] != "listo" || len(acc.pasos) != 4 {
		t.Fatalf("no terminó: %v %v", e, acc.pasos)
	}
	// una vez lista no se vuelve a instalar encima
	if c := post("instalar"); c != 409 {
		t.Errorf("instalar dos veces debió ser 409, fue %d", c)
	}
	post("cerrar")
	select {
	case <-v.fin:
	case <-time.After(2 * time.Second):
		t.Error("cerrar no terminó la ventana")
	}
}
