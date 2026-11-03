package main

import "testing"

func TestMasNueva(t *testing.T) {
	casos := []struct {
		a, b string
		si   bool
	}{{"1.0.1", "1.0.0", true}, {"1.10.0", "1.9.3", true}, {"1.0.0", "1.0.0", false}, {"0.9.9", "1.0.0", false}, {"1.0.0", "0.0.0-dev", true}}
	for _, c := range casos {
		if masNueva(c.a, c.b) != c.si {
			t.Errorf("masNueva(%q,%q) debió ser %v", c.a, c.b, c.si)
		}
	}
}
