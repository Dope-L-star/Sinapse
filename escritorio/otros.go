//go:build !windows

// Fuera de Windows solo se compila para correr las pruebas (go test).
package main

func main() {}

func guardarVersion(string) {}
