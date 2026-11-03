//go:build windows

package main

import (
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	user32       = windows.NewLazySystemDLL("user32.dll")
	kernel32     = windows.NewLazySystemDLL("kernel32.dll")
	shell32      = windows.NewLazySystemDLL("shell32.dll")
	pMessageBox  = user32.NewProc("MessageBoxW")
	pUILang      = kernel32.NewProc("GetUserDefaultUILanguage")
	pShellExec   = shell32.NewProc("ShellExecuteW")
	pSHChangeNot = shell32.NewProc("SHChangeNotify")
)

const (
	mbOK         = 0x0
	mbYesNo      = 0x4
	mbIconInfo   = 0x40
	mbIconQ      = 0x20
	mbIconWarn   = 0x30
	mbSetFg      = 0x10000
	idYes        = 6
	createNoWin  = 0x08000000
	detachedProc = 0x00000008
)

func idioma() textos {
	r, _, _ := pUILang.Call()
	if r&0x3ff == 0x0a { // LANG_SPANISH
		return es
	}
	return en
}

func caja(T textos, msg string, flags uintptr) int {
	t, _ := syscall.UTF16PtrFromString(T.titulo)
	m, _ := syscall.UTF16PtrFromString(msg)
	r, _, _ := pMessageBox.Call(0, uintptr(unsafe.Pointer(m)), uintptr(unsafe.Pointer(t)), flags|mbSetFg)
	return int(r)
}

func avisar(T textos, msg string)      { caja(T, msg, mbOK|mbIconInfo) }
func avisarError(T textos, msg string) { caja(T, msg, mbOK|mbIconWarn) }
func preguntar(T textos, msg string) bool {
	return caja(T, msg, mbYesNo|mbIconQ) == idYes
}

// abre una dirección o un archivo con lo que Windows tenga por defecto
func shellAbrir(que string) {
	op, _ := syscall.UTF16PtrFromString("open")
	f, _ := syscall.UTF16PtrFromString(que)
	pShellExec.Call(0, uintptr(unsafe.Pointer(op)), uintptr(unsafe.Pointer(f)), 0, 0, 1)
}

// avisa al Explorador que cambiaron los accesos directos (para que el ícono aparezca enseguida)
func refrescarIconos() { pSHChangeNot.Call(0x08000000, 0, 0, 0) }

func sinVentana() *syscall.SysProcAttr {
	return &syscall.SysProcAttr{HideWindow: true, CreationFlags: createNoWin | detachedProc}
}
