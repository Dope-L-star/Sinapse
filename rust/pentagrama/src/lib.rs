//! Motor de animación de SymphorIA «Partitura», escrito en Rust y compilado a WebAssembly.
//!
//! Calcula, cuadro a cuadro, los puntos de las 5 líneas del pentagrama (cian, violeta, rosa,
//! naranja, oro), el cargador «Afinando» (las líneas se juntan en un solo latido) y las chispas
//! de los botones. JavaScript solo dibuja lo que este módulo deja en memoria compartida.
//!
//! Sin dependencias y sin asignar memoria: todo vive en buffers fijos, así cada cuadro cuesta
//! lo mismo y el recolector de basura del navegador nunca interrumpe la animación.
//!
//! Compilar: `cargo build --release --target wasm32-unknown-unknown` (ver `rust/LEEME.md`).

#![allow(static_mut_refs)]

const LINEAS: usize = 5;
const MAX_PTS: usize = 256;
const MAX_CHISPAS: usize = 256;
const TAU: f32 = core::f32::consts::TAU;
const PI: f32 = core::f32::consts::PI;

/// Puntos de las líneas: [línea][punto][x, y].
static mut LINEAS_BUF: [f32; LINEAS * MAX_PTS * 2] = [0.0; LINEAS * MAX_PTS * 2];
/// Chispas vivas: [x, y, vx, vy, vida, color].
static mut CHISPAS: [f32; MAX_CHISPAS * 6] = [0.0; MAX_CHISPAS * 6];
/// Chispas listas para dibujar: [x, y, vida, color].
static mut CHISPAS_OUT: [f32; MAX_CHISPAS * 4] = [0.0; MAX_CHISPAS * 4];
static mut N_CHISPAS: usize = 0;
static mut SEMILLA: u32 = 0x9E37_79B9;

#[inline]
fn azar() -> f32 {
    // LCG de 32 bits: rápido y suficiente para partículas.
    unsafe {
        SEMILLA = SEMILLA.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        (SEMILLA >> 8) as f32 / 16_777_216.0
    }
}

#[inline]
fn mezclar(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

#[inline]
fn fract(x: f32) -> f32 {
    x - x.floor()
}

/// Dirección del buffer de líneas (para leerlo desde JS como Float32Array).
#[no_mangle]
pub extern "C" fn pg_buffer() -> *const f32 {
    unsafe { LINEAS_BUF.as_ptr() }
}

/// Largo de cada línea en el buffer (puntos por línea reservados).
#[no_mangle]
pub extern "C" fn pg_max_puntos() -> u32 {
    MAX_PTS as u32
}

/// Calcula un cuadro del pentagrama.
/// - `n`: puntos por línea (se recorta a 2..=256).
/// - `ancho`, `alto`: tamaño del lienzo en px CSS.
/// - `t`: tiempo en segundos.
/// - `amp`: amplitud de la onda en px.
/// - `afinar`: 0 = cinco líneas separadas, 1 = juntas en el centro con un latido.
/// Devuelve los puntos escritos por línea.
#[no_mangle]
pub extern "C" fn pg_cuadro(n: u32, ancho: f32, alto: f32, t: f32, amp: f32, afinar: f32) -> u32 {
    let n = (n as usize).clamp(2, MAX_PTS);
    let afinar = afinar.clamp(0.0, 1.0);
    let margen = alto * 0.16;
    let paso = (alto - margen * 2.0) / (LINEAS as f32 - 1.0);
    let centro = alto * 0.5;
    // el latido recorre la línea de izquierda a derecha
    let pulso = fract(t * 0.32) * ancho;
    let ancho_pulso = (ancho * 0.022).max(6.0);
    let buf = unsafe { &mut LINEAS_BUF };
    for i in 0..LINEAS {
        let fi = i as f32;
        let base = mezclar(margen + fi * paso, centro, afinar);
        // cuando se afinan, todas vibran casi igual (un solo latido)
        let fase = fi * 0.7 * (1.0 - afinar * 0.85);
        for k in 0..n {
            let x = ancho * k as f32 / (n - 1) as f32;
            let u = x / ancho;
            let envolvente = 0.35 + 0.65 * (PI * u).sin();
            let onda = (u * TAU * 1.4 + fase + t * 0.9).sin() * amp * envolvente * (1.0 - afinar * 0.7);
            let d = (x - pulso) / ancho_pulso;
            let latido = (-d * d).exp() * -(d * 3.0).sin() * amp * 3.2 * afinar;
            let o = (i * MAX_PTS + k) * 2;
            buf[o] = x;
            buf[o + 1] = base + onda + latido;
        }
    }
    n as u32
}

/// Lanza `cuantas` chispas desde (x, y). `semilla` hace que cada clic sea distinto.
#[no_mangle]
pub extern "C" fn sp_lanzar(x: f32, y: f32, cuantas: u32, semilla: u32) {
    unsafe {
        SEMILLA ^= semilla.wrapping_mul(2_654_435_761);
        for _ in 0..cuantas {
            if N_CHISPAS >= MAX_CHISPAS {
                break;
            }
            let a = azar() * TAU;
            let v = 60.0 + azar() * 140.0;
            let o = N_CHISPAS * 6;
            CHISPAS[o] = x;
            CHISPAS[o + 1] = y;
            CHISPAS[o + 2] = a.cos() * v;
            CHISPAS[o + 3] = a.sin() * v - 40.0;
            CHISPAS[o + 4] = 1.0;
            CHISPAS[o + 5] = (azar() * 5.0).floor(); // 0..4 = uno de los 5 colores
            N_CHISPAS += 1;
        }
    }
}

/// Avanza las chispas `dt` segundos. Devuelve cuántas siguen vivas.
#[no_mangle]
pub extern "C" fn sp_avanzar(dt: f32) -> u32 {
    let dt = dt.clamp(0.0, 0.05);
    unsafe {
        let mut vivas = 0usize;
        for i in 0..N_CHISPAS {
            let o = i * 6;
            let vida = CHISPAS[o + 4] - dt * 1.6;
            if vida <= 0.0 {
                continue;
            }
            let vx = CHISPAS[o + 2] * (1.0 - dt * 2.5);
            let vy = CHISPAS[o + 3] * (1.0 - dt * 2.5) + 220.0 * dt;
            let d = vivas * 6;
            CHISPAS[d] = CHISPAS[o] + vx * dt;
            CHISPAS[d + 1] = CHISPAS[o + 1] + vy * dt;
            CHISPAS[d + 2] = vx;
            CHISPAS[d + 3] = vy;
            CHISPAS[d + 4] = vida;
            CHISPAS[d + 5] = CHISPAS[o + 5];
            let s = vivas * 4;
            CHISPAS_OUT[s] = CHISPAS[d];
            CHISPAS_OUT[s + 1] = CHISPAS[d + 1];
            CHISPAS_OUT[s + 2] = vida;
            CHISPAS_OUT[s + 3] = CHISPAS[d + 5];
            vivas += 1;
        }
        N_CHISPAS = vivas;
        vivas as u32
    }
}

/// Dirección de las chispas listas para dibujar: [x, y, vida, color] × vivas.
#[no_mangle]
pub extern "C" fn sp_buffer() -> *const f32 {
    unsafe { CHISPAS_OUT.as_ptr() }
}

#[cfg(test)]
mod pruebas {
    use super::*;

    #[test]
    fn las_lineas_separadas_quedan_en_orden() {
        pg_cuadro(32, 1000.0, 100.0, 0.0, 0.0, 0.0);
        let b = unsafe { &LINEAS_BUF };
        for i in 1..LINEAS {
            assert!(b[(i * MAX_PTS) * 2 + 1] > b[((i - 1) * MAX_PTS) * 2 + 1]);
        }
    }

    #[test]
    fn afinadas_se_juntan_en_el_centro() {
        pg_cuadro(32, 1000.0, 100.0, 0.0, 0.0, 1.0);
        let b = unsafe { &LINEAS_BUF };
        for i in 0..LINEAS {
            assert!((b[(i * MAX_PTS) * 2 + 1] - 50.0).abs() < 0.01);
        }
    }

    #[test]
    fn las_chispas_se_apagan() {
        sp_lanzar(10.0, 10.0, 20, 7);
        let mut vivas = 20;
        for _ in 0..200 {
            vivas = sp_avanzar(0.016);
        }
        assert_eq!(vivas, 0);
    }

    #[test]
    fn nunca_pasa_del_maximo() {
        assert_eq!(pg_cuadro(9999, 100.0, 50.0, 1.0, 4.0, 0.5), MAX_PTS as u32);
        sp_lanzar(0.0, 0.0, 9999, 1);
        assert!(sp_avanzar(0.001) as usize <= MAX_CHISPAS);
    }
}
