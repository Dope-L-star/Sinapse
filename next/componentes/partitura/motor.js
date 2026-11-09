/* Motor «Partitura»: carga el módulo de Rust (media/wasm/pentagrama.wasm) y, si el navegador no puede
   (sin WebAssembly, CSP vieja o red caída), usa la misma matemática en JavaScript. Los dos dan el mismo dibujo.
   Fuente en Rust: rust/pentagrama/src/lib.rs. */

export const COLORES = ['#3DE0FF', '#7B3FF2', '#FF3D9A', '#FF7A45', '#FFC857'];
const LINEAS = 5, MAX = 256, TAU = Math.PI * 2;

function motorJS() {
  const lineas = new Float32Array(LINEAS * MAX * 2);
  const vivas = new Float32Array(MAX * 6), sale = new Float32Array(MAX * 4);
  let n = 0, semilla = 0x9e3779b9 >>> 0;
  const azar = () => { semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0; return (semilla >>> 8) / 16777216; };
  const fract = x => x - Math.floor(x);
  return {
    rust: false,
    cuadro(pts, ancho, alto, t, amp, afinar) {
      pts = Math.max(2, Math.min(MAX, pts | 0)); afinar = Math.max(0, Math.min(1, afinar));
      const margen = alto * 0.16, paso = (alto - margen * 2) / 4, centro = alto / 2;
      const pulso = fract(t * 0.32) * ancho, ap = Math.max(ancho * 0.022, 6);
      for (let i = 0; i < LINEAS; i++) {
        const base = margen + i * paso + (centro - margen - i * paso) * afinar, fase = i * 0.7 * (1 - afinar * 0.85);
        for (let k = 0; k < pts; k++) {
          const x = ancho * k / (pts - 1), u = x / ancho, env = 0.35 + 0.65 * Math.sin(Math.PI * u);
          const onda = Math.sin(u * TAU * 1.4 + fase + t * 0.9) * amp * env * (1 - afinar * 0.7);
          const d = (x - pulso) / ap, lat = Math.exp(-d * d) * -Math.sin(d * 3) * amp * 3.2 * afinar;
          const o = (i * MAX + k) * 2; lineas[o] = x; lineas[o + 1] = base + onda + lat;
        }
      }
      return lineas;
    },
    lanzar(x, y, cuantas, s) {
      semilla = (semilla ^ Math.imul(s >>> 0, 2654435761)) >>> 0;
      for (let c = 0; c < cuantas && n < MAX; c++, n++) {
        const a = azar() * TAU, v = 60 + azar() * 140, o = n * 6;
        vivas[o] = x; vivas[o + 1] = y; vivas[o + 2] = Math.cos(a) * v; vivas[o + 3] = Math.sin(a) * v - 40; vivas[o + 4] = 1; vivas[o + 5] = Math.floor(azar() * 5);
      }
    },
    avanzar(dt) {
      dt = Math.max(0, Math.min(0.05, dt)); let v = 0;
      for (let i = 0; i < n; i++) {
        const o = i * 6, vida = vivas[o + 4] - dt * 1.6; if (vida <= 0) continue;
        const vx = vivas[o + 2] * (1 - dt * 2.5), vy = vivas[o + 3] * (1 - dt * 2.5) + 220 * dt, d = v * 6;
        vivas[d] = vivas[o] + vx * dt; vivas[d + 1] = vivas[o + 1] + vy * dt; vivas[d + 2] = vx; vivas[d + 3] = vy; vivas[d + 4] = vida; vivas[d + 5] = vivas[o + 5];
        const s = v * 4; sale[s] = vivas[d]; sale[s + 1] = vivas[d + 1]; sale[s + 2] = vida; sale[s + 3] = vivas[d + 5]; v++;
      }
      n = v; return { buf: sale, n: v };
    },
  };
}

function motorRust(ex) {
  const mem = () => ex.memory.buffer;
  return {
    rust: true,
    cuadro(pts, ancho, alto, t, amp, afinar) {
      ex.pg_cuadro(pts, ancho, alto, t, amp, afinar);
      return new Float32Array(mem(), ex.pg_buffer(), LINEAS * MAX * 2);
    },
    lanzar(x, y, cuantas, s) { ex.sp_lanzar(x, y, cuantas, s >>> 0); },
    avanzar(dt) { const v = ex.sp_avanzar(dt); return { buf: new Float32Array(mem(), ex.sp_buffer(), MAX * 4), n: v }; },
  };
}

let promesa = null;
/* Un solo motor para toda la página. Devuelve una promesa que nunca falla. */
export function cargarMotor() {
  if (promesa) return promesa;
  promesa = (async () => {
    try {
      if (typeof WebAssembly !== 'object') throw 0;
      const r = await fetch('/media/wasm/pentagrama.wasm');
      if (!r.ok) throw 0;
      const { instance } = WebAssembly.instantiateStreaming && (r.headers.get('content-type') || '').includes('wasm')
        ? await WebAssembly.instantiateStreaming(r, {})
        : await WebAssembly.instantiate(await r.arrayBuffer(), {});
      return motorRust(instance.exports);
    } catch { return motorJS(); }
  })();
  return promesa;
}

export const PUNTOS_MAX = MAX;
