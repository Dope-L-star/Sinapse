// recursos: arma rsrc_windows_amd64.syso (ícono, manifiesto y datos de versión del .exe) sin herramientas de afuera.
// Go enlaza solo cualquier .syso que esté junto al código. Uso (desde escritorio/):
//
//	go run ./recursos -version 1.0.0
//
// El formato es COFF con una sección .rsrc: un árbol tipo → id → idioma → datos, y una reubicación por cada
// dato (las direcciones finales las pone el enlazador de Go).
package main

import (
	"bytes"
	"encoding/binary"
	"flag"
	"fmt"
	"image/png"
	"os"
	"sort"
	"strconv"
	"strings"
	"unicode/utf16"
)

const (
	rtIcon      = 3
	rtGroupIcon = 14
	rtVersion   = 16
	rtManifest  = 24
	idioma      = 0x0409
)

type recurso struct {
	tipo, id int
	datos    []byte
}

func main() {
	ver := flag.String("version", "0.0.0", "versión X.Y.Z")
	salida := flag.String("o", "rsrc_windows_amd64.syso", "archivo de salida")
	flag.Parse()

	var rs []recurso
	// íconos: cada tamaño es un RT_ICON (PNG adentro, Windows Vista o más nuevo) y el grupo los junta
	grupo := new(bytes.Buffer)
	tams := []int{16, 24, 32, 48, 64, 256}
	binary.Write(grupo, binary.LittleEndian, []uint16{0, 1, uint16(len(tams))})
	for i, t := range tams {
		b, err := os.ReadFile(fmt.Sprintf("icono/%d.png", t))
		falla(err)
		cfg, err := png.DecodeConfig(bytes.NewReader(b))
		falla(err)
		if cfg.Width != t || cfg.Height != t {
			falla(fmt.Errorf("icono/%d.png mide %dx%d", t, cfg.Width, cfg.Height))
		}
		rs = append(rs, recurso{rtIcon, i + 1, b})
		w := byte(t)
		if t >= 256 {
			w = 0
		}
		grupo.Write([]byte{w, w, 0, 0})
		binary.Write(grupo, binary.LittleEndian, uint16(1))
		binary.Write(grupo, binary.LittleEndian, uint16(32))
		binary.Write(grupo, binary.LittleEndian, uint32(len(b)))
		binary.Write(grupo, binary.LittleEndian, uint16(i+1))
	}
	rs = append(rs, recurso{rtGroupIcon, 1, grupo.Bytes()})
	rs = append(rs, recurso{rtVersion, 1, versionInfo(*ver)})
	m, err := os.ReadFile("app.manifest")
	falla(err)
	rs = append(rs, recurso{rtManifest, 1, m})

	falla(os.WriteFile(*salida, coff(rs), 0o644))
	fmt.Println("listo:", *salida)
}

func falla(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, "recursos:", err)
		os.Exit(1)
	}
}

/* ---------- COFF ---------- */

func coff(rs []recurso) []byte {
	sort.Slice(rs, func(i, j int) bool {
		if rs[i].tipo != rs[j].tipo {
			return rs[i].tipo < rs[j].tipo
		}
		return rs[i].id < rs[j].id
	})
	// tipos y, por tipo, sus ids
	var tipos []int
	porTipo := map[int][]int{}
	for i, r := range rs {
		if len(porTipo[r.tipo]) == 0 {
			tipos = append(tipos, r.tipo)
		}
		porTipo[r.tipo] = append(porTipo[r.tipo], i)
	}
	// tamaños: raíz, un directorio por tipo, un directorio de idioma por recurso, entradas de datos, y los datos
	dirTam := func(n int) int { return 16 + 8*n }
	off := dirTam(len(tipos))
	offTipo := map[int]int{}
	for _, t := range tipos {
		offTipo[t] = off
		off += dirTam(len(porTipo[t]))
	}
	offIdioma := make([]int, len(rs))
	for i := range rs {
		offIdioma[i] = off
		off += dirTam(1)
	}
	offEntrada := make([]int, len(rs))
	for i := range rs {
		offEntrada[i] = off
		off += 16
	}
	offDatos := make([]int, len(rs))
	for i, r := range rs {
		off = (off + 7) &^ 7
		offDatos[i] = off
		off += len(r.datos)
	}
	sec := make([]byte, (off+7)&^7)
	le := binary.LittleEndian
	dir := func(at, n int) { le.PutUint16(sec[at+14:], uint16(n)) }
	ent := func(at, id, destino int, sub bool) {
		le.PutUint32(sec[at:], uint32(id))
		v := uint32(destino)
		if sub {
			v |= 0x80000000
		}
		le.PutUint32(sec[at+4:], v)
	}
	dir(0, len(tipos))
	for k, t := range tipos {
		ent(16+8*k, t, offTipo[t], true)
		dir(offTipo[t], len(porTipo[t]))
		for j, i := range porTipo[t] {
			ent(offTipo[t]+16+8*j, rs[i].id, offIdioma[i], true)
		}
	}
	var relocs []int
	for i, r := range rs {
		dir(offIdioma[i], 1)
		ent(offIdioma[i]+16, idioma, offEntrada[i], false)
		le.PutUint32(sec[offEntrada[i]:], uint32(offDatos[i])) // dirección relativa: la corrige el enlazador
		le.PutUint32(sec[offEntrada[i]+4:], uint32(len(r.datos)))
		relocs = append(relocs, offEntrada[i])
		copy(sec[offDatos[i]:], r.datos)
	}

	out := new(bytes.Buffer)
	const cabeza, seccion = 20, 40
	pDatos := cabeza + seccion
	pReloc := pDatos + len(sec)
	pSimb := pReloc + 10*len(relocs)
	// cabecera del archivo: AMD64, 1 sección, 1 símbolo
	binary.Write(out, le, uint16(0x8664))
	binary.Write(out, le, uint16(1))
	binary.Write(out, le, uint32(0))
	binary.Write(out, le, uint32(pSimb))
	binary.Write(out, le, uint32(1))
	binary.Write(out, le, uint16(0))
	binary.Write(out, le, uint16(0))
	// sección .rsrc
	out.Write([]byte(".rsrc\x00\x00\x00"))
	binary.Write(out, le, []uint32{0, 0, uint32(len(sec)), uint32(pDatos), uint32(pReloc), 0})
	binary.Write(out, le, uint16(len(relocs)))
	binary.Write(out, le, uint16(0))
	binary.Write(out, le, uint32(0x40000040)) // datos inicializados, solo lectura
	out.Write(sec)
	for _, r := range relocs {
		binary.Write(out, le, uint32(r))
		binary.Write(out, le, uint32(0))
		binary.Write(out, le, uint16(3)) // IMAGE_REL_AMD64_ADDR32NB
	}
	// símbolo de la sección y tabla de textos vacía
	out.Write([]byte(".rsrc\x00\x00\x00"))
	binary.Write(out, le, uint32(0))
	binary.Write(out, le, int16(1))
	binary.Write(out, le, uint16(0))
	out.Write([]byte{3, 0}) // IMAGE_SYM_CLASS_STATIC, sin auxiliares
	binary.Write(out, le, uint32(4))
	return out.Bytes()
}

/* ---------- datos de versión (lo que muestra Propiedades › Detalles) ---------- */

func u16z(s string) []byte {
	b := new(bytes.Buffer)
	binary.Write(b, binary.LittleEndian, append(utf16.Encode([]rune(s)), 0))
	return b.Bytes()
}

func pad4(b *bytes.Buffer) {
	for b.Len()%4 != 0 {
		b.WriteByte(0)
	}
}

// un nodo VS_VERSIONINFO / StringFileInfo / String…: largo, largo del valor, tipo, clave, valor e hijos
func nodo(clave string, valor []byte, texto bool, hijos ...[]byte) []byte {
	b := new(bytes.Buffer)
	b.Write([]byte{0, 0})
	vl := len(valor)
	if texto {
		vl = len(valor) / 2
	}
	binary.Write(b, binary.LittleEndian, uint16(vl))
	t := uint16(0)
	if texto {
		t = 1
	}
	binary.Write(b, binary.LittleEndian, t)
	b.Write(u16z(clave))
	pad4(b)
	b.Write(valor)
	for _, h := range hijos {
		pad4(b)
		b.Write(h)
	}
	out := b.Bytes()
	binary.LittleEndian.PutUint16(out, uint16(len(out)))
	return out
}

func versionInfo(v string) []byte {
	var n [4]uint16
	for i, p := range strings.SplitN(strings.SplitN(v, "-", 2)[0], ".", 3) {
		x, _ := strconv.Atoi(p)
		n[i] = uint16(x)
	}
	ms, ls := uint32(n[0])<<16|uint32(n[1]), uint32(n[2])<<16|uint32(n[3])
	fijo := new(bytes.Buffer)
	binary.Write(fijo, binary.LittleEndian, []uint32{0xFEEF04BD, 0x00010000, ms, ls, ms, ls, 0x3F, 0, 0x40004, 1, 0, 0, 0})
	var textos [][]byte
	for _, kv := range [][2]string{
		{"CompanyName", "SymphorIA"},
		{"FileDescription", "SymphorIA · Obertura (instalador y app de escritorio)"},
		{"FileVersion", v},
		{"InternalName", "obertura"},
		{"LegalCopyright", "SymphorIA · gratis"},
		{"OriginalFilename", "SymphorIA-Obertura.exe"},
		{"ProductName", "SymphorIA"},
		{"ProductVersion", v},
	} {
		textos = append(textos, nodo(kv[0], u16z(kv[1]), true))
	}
	tabla := nodo("040904B0", nil, true, textos...)
	trad := new(bytes.Buffer)
	binary.Write(trad, binary.LittleEndian, []uint16{0x0409, 0x04B0})
	return nodo("VS_VERSION_INFO", fijo.Bytes(), false,
		nodo("StringFileInfo", nil, true, tabla),
		nodo("VarFileInfo", nil, true, nodo("Translation", trad.Bytes(), false)))
}
