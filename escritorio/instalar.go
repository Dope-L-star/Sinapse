//go:build windows

package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"golang.org/x/sys/windows/registry"
)

const claveDesinstalar = `Software\Microsoft\Windows\CurrentVersion\Uninstall\SymphorIA`

func instalar(T textos, origen string, silencioso bool, sitio string) {
	if !silencioso && !preguntar(T, T.preguntaInstalar) {
		return
	}
	dir := carpetaApp()
	destino := filepath.Join(dir, nombreExe)
	habia := existe(destino)
	err := func() error {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return err
		}
		// si la app está abierta (el lanzador), Windows deja renombrar el .exe aunque no deje borrarlo
		if habia {
			os.Remove(destino + ".old")
			os.Rename(destino, destino+".old")
		}
		if err := copiar(origen, destino); err != nil {
			return err
		}
		// el del escritorio es un extra: si falla (escritorio bloqueado por la empresa, por ejemplo) se anota y sigue
		os.MkdirAll(filepath.Dir(atajoEscritorio()), 0o755)
		if err := crearAtajo(atajoEscritorio(), destino, T.descAtajo); err != nil {
			anotar("acceso directo del escritorio: " + err.Error())
		}
		os.MkdirAll(filepath.Dir(atajoInicio()), 0o755)
		if err := crearAtajo(atajoInicio(), destino, T.descAtajo); err != nil {
			return fmt.Errorf("acceso directo de Inicio: %w", err)
		}
		return registrar(destino)
	}()
	if err != nil {
		anotar("instalar: " + err.Error())
		if !silencioso {
			avisarError(T, T.errInstalar+err.Error())
		}
		os.Exit(1)
	}
	anotar("instalada la versión " + version + " en " + destino)
	refrescarIconos()
	if silencioso {
		return
	}
	// abre la app ya instalada (ella misma busca actualizaciones)
	c := exec.Command(destino, "--sitio="+sitio)
	c.SysProcAttr = sinVentana()
	c.Start()
	if habia {
		avisar(T, T.yaInstalado)
	} else {
		avisar(T, T.instalado)
	}
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

func desinstalar(T textos, silencioso bool) {
	if !silencioso && !preguntar(T, T.preguntaDesinstalar) {
		return
	}
	var fallas []string
	for _, f := range []string{atajoEscritorio(), atajoInicio()} {
		if err := os.Remove(f); err != nil && !os.IsNotExist(err) {
			fallas = append(fallas, err.Error())
		}
	}
	if err := registry.DeleteKey(registry.CURRENT_USER, claveDesinstalar); err != nil && err != registry.ErrNotExist {
		fallas = append(fallas, err.Error())
	}
	os.RemoveAll(carpetaDatos())
	refrescarIconos()
	// este .exe no se puede borrar a sí mismo mientras corre: una consola oculta lo borra unos segundos después
	dir := carpetaApp()
	c := exec.Command(filepath.Join(os.Getenv("SystemRoot"), "System32", "cmd.exe"))
	c.SysProcAttr = sinVentana()
	// la línea va tal cual (cmd.exe no entiende las comillas escapadas que pondría Go)
	c.SysProcAttr.CmdLine = `cmd.exe /C ping -n 3 127.0.0.1 >nul & rmdir /s /q "` + dir + `"`
	c.Dir = os.TempDir() // que la consola no tenga «tomada» la carpeta que va a borrar
	if err := c.Start(); err != nil {
		fallas = append(fallas, err.Error())
	}
	if silencioso {
		return
	}
	if len(fallas) > 0 {
		avisarError(T, T.errDesinstalar+fmt.Sprint(fallas))
		return
	}
	avisar(T, T.desinstalado)
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
