//go:build windows

package main

import (
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"golang.org/x/sys/windows/registry"
)

const claveDesinstalar = `Software\Microsoft\Windows\CurrentVersion\Uninstall\SymphorIA`

// Pasos que la ventana muestra uno por uno (mismos nombres que en interfaz/app.js).
const (
	pasoCopiar   = "copiar"
	pasoAtajos   = "atajos"
	pasoRegistro = "registro"
	pasoListo    = "listo"
	pasoQuitar   = "quitar"
	pasoLimpiar  = "limpiar"
)

// instalar: primero intenta la ventana propia; si no se puede (sin navegador, o la ventana no carga),
// vuelve a las preguntas de siempre para que nadie se quede sin instalar.
func instalar(T textos, origen string, silencioso bool, sitio string) {
	if silencioso {
		if _, err := instalarArchivos(origen, true, func(string) {}); err != nil {
			anotar("instalar: " + err.Error())
			os.Exit(1)
		}
		return
	}
	acc := &accionesWin{origen: origen, sitio: sitio}
	if abrirVentana("instalar", T, acc) {
		return
	}
	instalarConCajas(T, origen, sitio)
}

func instalarConCajas(T textos, origen, sitio string) {
	if !preguntar(T, T.preguntaInstalar) {
		return
	}
	habia, err := instalarArchivos(origen, true, func(string) {})
	if err != nil {
		avisarError(T, T.errInstalar+err.Error())
		os.Exit(1)
	}
	abrirInstalada(sitio)
	if habia {
		avisar(T, T.yaInstalado)
	} else {
		avisar(T, T.instalado)
	}
}

// instalarArchivos hace la instalación de verdad y avisa cada paso.
func instalarArchivos(origen string, escritorio bool, avance func(string)) (habia bool, err error) {
	dir := carpetaApp()
	destino := filepath.Join(dir, nombreExe)
	habia = existe(destino)
	err = func() error {
		avance(pasoCopiar)
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
		if !mismaRuta(origen, destino) {
			// si la app está abierta (el lanzador), Windows deja renombrar el .exe aunque no deje borrarlo
			if habia {
				os.Remove(destino + ".old")
				os.Rename(destino, destino+".old")
			}
			if err := copiar(origen, destino); err != nil {
				return err
			}
		}
		avance(pasoAtajos)
		// el del escritorio es un extra: si falla (escritorio bloqueado por la empresa, por ejemplo) se anota y sigue
		if escritorio {
			os.MkdirAll(filepath.Dir(atajoEscritorio()), 0o755)
			if err := crearAtajo(atajoEscritorio(), destino, idioma().descAtajo); err != nil {
				anotar("acceso directo del escritorio: " + err.Error())
			}
		} else {
			os.Remove(atajoEscritorio())
		}
		os.MkdirAll(filepath.Dir(atajoInicio()), 0o755)
		if err := crearAtajo(atajoInicio(), destino, idioma().descAtajo); err != nil {
			return fmt.Errorf("acceso directo de Inicio: %w", err)
		}
		avance(pasoRegistro)
		return registrar(destino)
	}()
	if err != nil {
		anotar("instalar: " + err.Error())
		return habia, err
	}
	anotar("instalada la versión " + version + " en " + destino)
	refrescarIconos()
	avance(pasoListo)
	return habia, nil
}

// abre la app ya instalada (ella misma busca actualizaciones)
func abrirInstalada(sitio string) {
	c := exec.Command(filepath.Join(carpetaApp(), nombreExe), "--sitio="+sitio)
	c.SysProcAttr = sinVentana()
	c.Start()
}

// la entrada de «Aplicaciones instaladas» de Windows (solo para este usuario: no pide administrador)
func registrar(exe string) error {
	k, _, err := registry.CreateKey(registry.CURRENT_USER, claveDesinstalar, registry.ALL_ACCESS)
	if err != nil {
		return err
	}
	defer k.Close()
	tam := uint32(1)
	if st, err := os.Stat(exe); err == nil {
		tam = uint32(st.Size()/1024) + 1
	}
	for n, v := range map[string]string{
		"DisplayName":          nombreApp,
		"DisplayVersion":       version,
		"DisplayIcon":          exe + ",0",
		"Publisher":            editor,
		"InstallLocation":      filepath.Dir(exe),
		"UninstallString":      `"` + exe + `" --desinstalar`,
		"QuietUninstallString": `"` + exe + `" --desinstalar --silencioso`,
		"URLInfoAbout":         "https://symphoria.pages.dev/",
		"InstallDate":          time.Now().Format("20060102"),
	} {
		if err := k.SetStringValue(n, v); err != nil {
			return err
		}
	}
	k.SetDWordValue("NoModify", 1)
	k.SetDWordValue("NoRepair", 1)
	k.SetDWordValue("EstimatedSize", tam)
	return nil
}

func versionInstalada() string {
	k, err := registry.OpenKey(registry.CURRENT_USER, claveDesinstalar, registry.QUERY_VALUE)
	if err != nil {
		return ""
	}
	defer k.Close()
	v, _, _ := k.GetStringValue("DisplayVersion")
	return v
}

func desinstalar(T textos, silencioso bool) {
	if silencioso {
		if err := quitarTodo(func(string) {}); err != nil {
			anotar("desinstalar: " + err.Error())
		}
		borrarCarpetaLuego(carpetaApp(), 3)
		return
	}
	acc := &accionesWin{}
	if abrirVentana("desinstalar", T, acc) {
		if acc.quitada {
			borrarCarpetaLuego(carpetaApp(), 2)
		}
		return
	}
	if !preguntar(T, T.preguntaDesinstalar) {
		return
	}
	err := quitarTodo(func(string) {})
	borrarCarpetaLuego(carpetaApp(), 3)
	if err != nil {
		avisarError(T, T.errDesinstalar+err.Error())
		return
	}
	avisar(T, T.desinstalado)
}

// quitarTodo borra accesos directos, registro y datos. La carpeta del programa se borra al final con
// borrarCarpetaLuego (este .exe no se puede borrar a sí mismo mientras corre).
func quitarTodo(avance func(string)) error {
	var fallas []string
	avance(pasoQuitar)
	for _, f := range []string{atajoEscritorio(), atajoInicio()} {
		if err := os.Remove(f); err != nil && !os.IsNotExist(err) {
			fallas = append(fallas, err.Error())
		}
	}
	if err := registry.DeleteKey(registry.CURRENT_USER, claveDesinstalar); err != nil && err != registry.ErrNotExist {
		fallas = append(fallas, err.Error())
	}
	avance(pasoLimpiar)
	os.RemoveAll(carpetaDatos())
	refrescarIconos()
	if len(fallas) > 0 {
		return errors.New(fmt.Sprint(fallas))
	}
	avance(pasoListo)
	return nil
}

// una consola oculta espera unos segundos (a que este .exe se cierre) y borra la carpeta
func borrarCarpetaLuego(dir string, segundos int) error {
	c := exec.Command(filepath.Join(os.Getenv("SystemRoot"), "System32", "cmd.exe"))
	c.SysProcAttr = sinVentana()
	// la línea va tal cual (cmd.exe no entiende las comillas escapadas que pondría Go)
	c.SysProcAttr.CmdLine = fmt.Sprintf(`cmd.exe /C ping -n %d 127.0.0.1 >nul & rmdir /s /q "%s"`, segundos+1, dir)
	c.Dir = os.TempDir() // que la consola no tenga «tomada» la carpeta que va a borrar
	return c.Start()
}

func copiar(de, a string) error {
	in, err := os.Open(de)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp := a + ".tmp"
	out, err := os.Create(tmp)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		os.Remove(tmp)
		return err
	}
	if err := out.Close(); err != nil {
		return err
	}
	return os.Rename(tmp, a)
}
