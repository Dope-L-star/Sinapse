//go:build windows

package main

import "golang.org/x/sys/windows/registry"

func guardarVersion(v string) {
	if k, err := registry.OpenKey(registry.CURRENT_USER, claveDesinstalar, registry.SET_VALUE); err == nil {
		k.SetStringValue("DisplayVersion", v)
		k.Close()
	}
}
