package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// Actualizarse solo, gratis: cada versión nueva es un «release» de GitHub con la etiqueta obertura-vX.Y.Z,
// el .exe y su huella .sha256 (lo arma .github/workflows/obertura.yml). La app mira como mucho cada 6 horas,
// baja la versión nueva, revisa la huella y cambia el .exe. La próxima vez que se abra ya es la nueva.
const (
	nombreDescarga = "SymphorIA-Obertura.exe"
	cadaCuanto     = 6 * time.Hour
	maxTam         = 60 << 20
)

type release struct {
	Tag        string `json:"tag_name"`
	Draft      bool   `json:"draft"`
	Prerelease bool   `json:"prerelease"`
	Assets     []struct {
		Name string `json:"name"`
		URL  string `json:"browser_download_url"`
		Size int64  `json:"size"`
	} `json:"assets"`
}

var cliente = &http.Client{Timeout: 90 * time.Second}

func limpiarViejo() {
	exe := filepath.Join(carpetaApp(), nombreExe)
	os.Remove(exe + ".old")
	os.Remove(exe + ".new")
}

func buscarActualizacion(T textos) {
	marca := filepath.Join(carpetaDatos(), "ultima-busqueda")
	if st, err := os.Stat(marca); err == nil && time.Since(st.ModTime()) < cadaCuanto {
		return
	}
	os.MkdirAll(carpetaDatos(), 0o755)
	os.WriteFile(marca, []byte(time.Now().Format(time.RFC3339)), 0o644)
	v, err := actualizar()
	if err != nil {
		anotar("actualizar: " + err.Error())
	} else if v != "" {
		guardarVersion(v)
		anotar("actualizada a la versión " + v)
	}
}

// devuelve la versión instalada, o "" si no había nada nuevo
func actualizar() (string, error) {
	r, err := ultimaVersion()
	if err != nil || r == nil {
		return "", err
	}
	nueva := strings.TrimPrefix(r.Tag, prefijoTag)
	var urlExe, urlSha string
	for _, a := range r.Assets {
		switch a.Name {
		case nombreDescarga:
			if a.Size > maxTam {
				return "", errors.New("descarga demasiado grande")
			}
			urlExe = a.URL
		case nombreDescarga + ".sha256":
			urlSha = a.URL
		}
	}
	if urlExe == "" || urlSha == "" {
		return "", errors.New("al release le falta el .exe o su huella")
	}
	shaTxt, err := bajar(urlSha, 4096)
	if err != nil {
		return "", err
	}
	quiero := strings.ToLower(strings.Fields(string(shaTxt) + " x")[0])
	datos, err := bajar(urlExe, maxTam)
	if err != nil {
		return "", err
	}
	h := sha256.Sum256(datos)
	if hex.EncodeToString(h[:]) != quiero {
		return "", errors.New("la huella no coincide: no se instala")
	}
	exe := filepath.Join(carpetaApp(), nombreExe)
	if err := os.WriteFile(exe+".new", datos, 0o755); err != nil {
		return "", err
	}
	os.Remove(exe + ".old")
	if err := os.Rename(exe, exe+".old"); err != nil { // Windows deja renombrar el .exe que está corriendo
		os.Remove(exe + ".new")
		return "", err
	}
	if err := os.Rename(exe+".new", exe); err != nil {
		os.Rename(exe+".old", exe)
		return "", err
	}
	return nueva, nil
}

func ultimaVersion() (*release, error) {
	api := "https://api.github.com/repos/" + repoGitHub + "/releases?per_page=30"
	if p := os.Getenv("OBERTURA_PRUEBA_API"); p != "" { // solo para las pruebas (escritorio/LEEME.md)
		api = p
	}
	b, err := bajar(api, 4<<20)
	if err != nil {
		return nil, err
	}
	var rs []release
	if err := json.Unmarshal(b, &rs); err != nil {
		return nil, err
	}
	var mejor *release
	for i := range rs {
		r := &rs[i]
		if r.Draft || r.Prerelease || !strings.HasPrefix(r.Tag, prefijoTag) {
			continue
		}
		v := strings.TrimPrefix(r.Tag, prefijoTag)
		if masNueva(v, version) && (mejor == nil || masNueva(v, strings.TrimPrefix(mejor.Tag, prefijoTag))) {
			mejor = r
		}
	}
	return mejor, nil
}

func bajar(url string, max int64) ([]byte, error) {
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("User-Agent", "SymphorIA-Obertura/"+version)
	req.Header.Set("Accept", "application/vnd.github+json")
	res, err := cliente.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("HTTP %d en %s", res.StatusCode, url)
	}
	b, err := io.ReadAll(io.LimitReader(res.Body, max+1))
	if int64(len(b)) > max {
		return nil, errors.New("respuesta demasiado grande")
	}
	return b, err
}

// "1.10.0" > "1.9.3"; lo que no sea número cuenta como 0 (así "0.0.0-dev" siempre se actualiza)
func masNueva(a, b string) bool {
	pa, pb := partes(a), partes(b)
	for i := 0; i < 3; i++ {
		if pa[i] != pb[i] {
			return pa[i] > pb[i]
		}
	}
	return false
}

func partes(v string) [3]int {
	var out [3]int
	v = strings.SplitN(v, "-", 2)[0]
	for i, p := range strings.SplitN(v, ".", 3) {
		n, _ := strconv.Atoi(p)
		out[i] = n
	}
	return out
}
