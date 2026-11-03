//go:build windows

package main

import (
	"os"
	"path/filepath"

	ole "github.com/go-ole/go-ole"
	"github.com/go-ole/go-ole/oleutil"
	"golang.org/x/sys/windows"
)

// Las carpetas se piden a Windows (no se adivinan): con OneDrive el escritorio vive en OneDrive\Escritorio.
func carpetaConocida(id *windows.KNOWNFOLDERID, respaldo string) string {
	if p, err := windows.KnownFolderPath(id, 0); err == nil && p != "" {
		return p
	}
	return respaldo
}

func atajoEscritorio() string {
	return filepath.Join(carpetaConocida(windows.FOLDERID_Desktop, filepath.Join(os.Getenv("USERPROFILE"), "Desktop")), nombreApp+".lnk")
}

func atajoInicio() string {
	return filepath.Join(carpetaConocida(windows.FOLDERID_Programs, filepath.Join(os.Getenv("APPDATA"), `Microsoft\Windows\Start Menu\Programs`)), nombreApp+".lnk")
}

// crea un acceso directo .lnk con el ícono de SymphorIA (el que va dentro del .exe)
func crearAtajo(lnk, destino, desc string) error {
	ole.CoInitializeEx(0, ole.COINIT_APARTMENTTHREADED)
	defer ole.CoUninitialize()
	o, err := oleutil.CreateObject("WScript.Shell")
	if err != nil {
		return err
	}
	defer o.Release()
	sh, err := o.QueryInterface(ole.IID_IDispatch)
	if err != nil {
		return err
	}
	defer sh.Release()
	r, err := oleutil.CallMethod(sh, "CreateShortcut", lnk)
	if err != nil {
		return err
	}
	s := r.ToIDispatch()
	defer s.Release()
	oleutil.PutProperty(s, "TargetPath", destino)
	oleutil.PutProperty(s, "WorkingDirectory", filepath.Dir(destino))
	oleutil.PutProperty(s, "IconLocation", destino+",0")
	oleutil.PutProperty(s, "Description", desc)
	_, err = oleutil.CallMethod(s, "Save")
	return err
}
