package main

// La ventana propia de Obertura: en vez de las cajitas grises de Windows, el instalador abre una ventana
// con el diseño de SymphorIA (escritorio/interfaz/, va dentro del .exe). Cómo funciona:
//   - El .exe levanta un servidor diminuto solo en 127.0.0.1, en un puerto al azar y con una clave al azar
//     en la dirección (nadie más del equipo ni de internet puede usarlo).
//   - Abre esa dirección en el navegador de la persona (Chrome, Brave…; Edge solo si no hay otro) en modo app, con un perfil temporal: una ventana limpia,
//     sin pestañas ni barra, del tamaño justo.
//   - La página pide los pasos (instalar, abrir, quitar) y muestra el avance. Al cerrar la ventana, el .exe termina
//     y borra el perfil temporal.
// Esta parte no depende de Windows: así se prueba en cualquier equipo (go test y `--demo`).

import (
	"crypto/rand"
	"embed"
	"encoding/hex"
	"encoding/json"
	"io/fs"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

//go:embed interfaz
var interfazFS embed.FS

// acciones es lo que la ventana le pide al sistema. En Windows son las de verdad; en las pruebas, unas de mentira.
type acciones interface {
	estado() estadoEquipo
	instalar(escritorio bool, avance func(paso string)) (habia bool, err error)
	desinstalar(avance func(paso string)) error
	abrirApp()
}

type estadoEquipo struct {
	Instalada        bool   `json:"instalada"`
	VersionInstalada string `json:"versionInstalada"`
	Carpeta          string `json:"carpeta"`
}

type ventana struct {
	modo   string // "instalar" | "desinstalar"
	idioma string // "es" | "en"
	acc    acciones
	clave  string

	mu       sync.Mutex
	paso     string // último paso que avisó la instalación
	trabajo  string // "" | "trabajando" | "listo" | "error"
	habia    bool
	errTxt   string
	latido   time.Time
	cargo    chan struct{} // se cierra cuando la página pide su estado por primera vez
	cargoUna sync.Once
	fin      chan struct{} // se cierra cuando la persona cierra la ventana o termina
	finUna   sync.Once
}

func nuevaVentana(modo, idioma string, acc acciones) *ventana {
	b := make([]byte, 16)
	rand.Read(b)
	return &ventana{modo: modo, idioma: idioma, acc: acc, clave: hex.EncodeToString(b),
		cargo: make(chan struct{}), fin: make(chan struct{})}
}

func (v *ventana) terminar() { v.finUna.Do(func() { close(v.fin) }) }

// servir arranca el servidor en 127.0.0.1 y devuelve la dirección que hay que abrir.
func (v *ventana) servir() (string, error) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", err
	}
	srv := &http.Server{Handler: v.rutas(ln.Addr().String()), ReadHeaderTimeout: 10 * time.Second}
	go srv.Serve(ln)
	go func() { <-v.fin; time.Sleep(300 * time.Millisecond); srv.Close() }()
	go v.vigilar()
	return "http://" + ln.Addr().String() + "/" + v.clave + "/", nil
}

// si la página deja de dar señales (la ventana se cerró sin avisar) y no hay nada a medias, se termina
func (v *ventana) vigilar() {
	t := time.NewTicker(2 * time.Second)
	defer t.Stop()
	for {
		select {
		case <-v.fin:
			return
		case <-t.C:
			v.mu.Lock()
			quieto := !v.latido.IsZero() && time.Since(v.latido) > 75*time.Second && v.trabajo != "trabajando"
			v.mu.Unlock()
			if quieto {
				v.terminar()
				return
			}
		}
	}
}

func (v *ventana) rutas(host string) http.Handler {
	sub, _ := fs.Sub(interfazFS, "interfaz")
	archivos := http.FileServer(http.FS(sub))
	pre := "/" + v.clave + "/"
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// solo responde a sí mismo (evita que otra página engañe al navegador con otro nombre de dominio)
		if r.Host != host || !strings.HasPrefix(r.URL.Path, pre) {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
		ruta := strings.TrimPrefix(r.URL.Path, pre)
		if strings.HasPrefix(ruta, "api/") {
			// los pedidos que cambian algo llegan por POST desde la misma página
			if r.Method != http.MethodGet && r.Header.Get("X-Obertura") != "1" {
				http.Error(w, "no", http.StatusForbidden)
				return
			}
			v.api(w, r, strings.TrimPrefix(ruta, "api/"))
			return
		}
		r2 := r.Clone(r.Context())
		r2.URL.Path = "/" + ruta
		archivos.ServeHTTP(w, r2)
	})
}

func (v *ventana) api(w http.ResponseWriter, r *http.Request, que string) {
	post := r.Method == http.MethodPost
	switch {
	case que == "estado":
		v.cargoUna.Do(func() { close(v.cargo) })
		v.mu.Lock()
		v.latido = time.Now()
		res := map[string]any{"modo": v.modo, "idioma": v.idioma, "version": version, "equipo": v.acc.estado(),
			"trabajo": v.trabajo, "paso": v.paso, "habia": v.habia, "error": v.errTxt}
		v.mu.Unlock()
		json.NewEncoder(w).Encode(res)
	case que == "latido" && post:
		v.mu.Lock()
		v.latido = time.Now()
		v.mu.Unlock()
		w.WriteHeader(http.StatusNoContent)
	case que == "instalar" && post && v.modo == "instalar":
		escritorio := r.URL.Query().Get("escritorio") != "0"
		if !v.empezar() {
			http.Error(w, "ocupado", http.StatusConflict)
			return
		}
		go func() {
			habia, err := v.acc.instalar(escritorio, v.avanzar)
			v.acabar(err, habia)
		}()
		w.WriteHeader(http.StatusAccepted)
	case que == "desinstalar" && post && v.modo == "desinstalar":
		if !v.empezar() {
			http.Error(w, "ocupado", http.StatusConflict)
			return
		}
		go func() { v.acabar(v.acc.desinstalar(v.avanzar), false) }()
		w.WriteHeader(http.StatusAccepted)
	case que == "abrir" && post:
		v.acc.abrirApp()
		w.WriteHeader(http.StatusNoContent)
	case que == "cerrar" && post:
		w.WriteHeader(http.StatusNoContent)
		v.mu.Lock()
		ocupado := v.trabajo == "trabajando"
		v.mu.Unlock()
		if !ocupado {
			go v.terminar()
		}
	default:
		http.NotFound(w, r)
	}
}

func (v *ventana) empezar() bool {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.trabajo == "trabajando" || v.trabajo == "listo" {
		return false
	}
	v.trabajo, v.paso, v.errTxt = "trabajando", "", ""
	return true
}

func (v *ventana) avanzar(paso string) {
	v.mu.Lock()
	v.paso = paso
	v.mu.Unlock()
}

func (v *ventana) acabar(err error, habia bool) {
	v.mu.Lock()
	defer v.mu.Unlock()
	v.habia = habia
	if err != nil {
		v.trabajo, v.errTxt = "error", err.Error()
		return
	}
	v.trabajo = "listo"
}
