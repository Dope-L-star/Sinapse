package main

import "testing"

func TestExeDeComando(t *testing.T) {
	casos := map[string]string{
		`"C:\Program Files\Google\Chrome\Application\chrome.exe" --single-argument %1`: `C:\Program Files\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files\Mozilla Firefox\firefox.exe -osint -url "%1"`:                `C:\Program Files\Mozilla Firefox\firefox.exe`,
		`"C:\Users\a\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe"`: `C:\Users\a\AppData\Local\BraveSoftware\Brave-Browser\Application\brave.exe`,
		`  "C:\x\opera.exe" -- "%1"`: `C:\x\opera.exe`,
		``:                           ``,
		`"sin cierre`:                ``,
		`rundll32 algo`:              ``,
	}
	for entrada, quiero := range casos {
		if got := exeDeComando(entrada); got != quiero {
			t.Errorf("exeDeComando(%q) = %q, quería %q", entrada, got, quiero)
		}
	}
}

func instaladoCon(rutas map[string]string) func(string) string {
	return func(n string) string { return rutas[n] }
}

func TestEdgeNuncaVaPrimero(t *testing.T) {
	const (
		chrome  = `C:\Program Files\Google\Chrome\Application\chrome.exe`
		brave   = `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
		edge    = `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`
		firefox = `C:\Program Files\Mozilla Firefox\firefox.exe`
	)
	todos := map[string]string{"chrome.exe": chrome, "brave.exe": brave, "msedge.exe": edge}
	casos := []struct {
		nombre, pred string
		hay          map[string]string
		quiero       navegador
	}{
		{"predeterminado Chrome", chrome, todos, navegador{chrome, true}},
		{"predeterminado Brave aunque haya Chrome", brave, todos, navegador{brave, true}},
		{"predeterminado Edge pero hay Chrome: Chrome", edge, todos, navegador{chrome, true}},
		{"sin predeterminado conocido, hay Brave y Edge: Brave", "", map[string]string{"brave.exe": brave, "msedge.exe": edge}, navegador{brave, true}},
		{"predeterminado Firefox y hay Chrome: Chrome en modo app", firefox, todos, navegador{chrome, true}},
		{"predeterminado Firefox y solo Edge: Firefox, sin modo app (no Edge)", firefox, map[string]string{"msedge.exe": edge}, navegador{firefox, false}},
		{"solo Edge (predeterminado Edge): Edge, es lo único", edge, map[string]string{"msedge.exe": edge}, navegador{edge, true}},
		{"nada se sabe y solo Edge: Edge", "", map[string]string{"msedge.exe": edge}, navegador{edge, true}},
		{"el registro apunta a un lanzador de Windows y solo hay Edge: Edge", `C:\Windows\System32\LaunchWinApp.exe`, map[string]string{"msedge.exe": edge}, navegador{edge, true}},
		{"el registro apunta a un lanzador y hay Brave: Brave", `C:\Windows\explorer.exe`, map[string]string{"brave.exe": brave, "msedge.exe": edge}, navegador{brave, true}},
		{"nada de nada", "", map[string]string{}, navegador{}},
	}
	for _, c := range casos {
		if got := decidir(c.pred, instaladoCon(c.hay)); got != c.quiero {
			t.Errorf("%s: salió %+v, quería %+v", c.nombre, got, c.quiero)
		}
	}
}
