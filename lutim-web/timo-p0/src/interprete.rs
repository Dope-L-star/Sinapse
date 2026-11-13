//! Lectura del mensaje. En el producto, este es el lugar del modelo de IA.

use crate::{Conversacion, Pendiente};

/// Lo que se entendió de un mensaje, sin decidir todavía qué hacer.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Lectura {
    /// Cambiar una decisión. `valor: None` significa que falta decir a qué.
    Cambiar { tema: String, valor: Option<String> },
    /// Abrir una creación. `creacion: None` significa que no se dijo cuál.
    AbrirCreacion { creacion: Option<String> },
    /// «Timo, decide tú».
    DecideTu,
    /// Un pedido claro que no cambia nada de lo ya decidido.
    Pedido,
}

pub trait Interprete {
    fn nombre(&self) -> &str;
    /// `true` si no hay un modelo real detrás.
    fn es_simulacion(&self) -> bool;
    fn leer(&self, mensaje: &str, conv: &Conversacion) -> Lectura;
}

/// Sustituto del modelo: reconoce unas pocas frases con reglas de palabras.
/// Sirve para ejercitar el recorrido. No mide cuánto entiende un modelo real.
pub struct InterpreteSimulado;

const TEMAS: &[(&str, &[&str])] = &[
    ("título", &["titulo"]),
    ("color", &["color", "colores", "paleta"]),
    ("tono", &["tono"]),
    ("tipografía", &["tipografia", "letra"]),
];
const DECIDE_TU: &[&str] = &["decide tu", "decidelo tu", "elige tu", "escoge tu"];
const ABRIR: &[&str] = &["abre", "abrir", "abreme", "muestra", "muestrame"];
const CONSERVAR: &[&str] = &["conserva", "manten", "sin cambiar", "deja "];
const HACIA: &[&str] = &[" a ", " por ", " sea ", ": ", " en "];

impl Interprete for InterpreteSimulado {
    fn nombre(&self) -> &str {
        "intérprete simulado por reglas"
    }

    fn es_simulacion(&self) -> bool {
        true
    }

    fn leer(&self, mensaje: &str, conv: &Conversacion) -> Lectura {
        let llano = normalizar(mensaje);

        if DECIDE_TU.iter().any(|f| llano.contains(f)) {
            return Lectura::DecideTu;
        }

        let nombrada = creacion_nombrada(&llano, conv);
        let pide_abrir = palabras(&llano).any(|p| ABRIR.contains(&p));

        // Una respuesta corta a la pregunta abierta completa el pedido original.
        match &conv.pendiente {
            Some(Pendiente::CualCreacion) if nombrada.is_some() => {
                return Lectura::AbrirCreacion { creacion: nombrada };
            }
            Some(Pendiente::Valor { tema }) if !pide_abrir && tema_mencionado(&llano).is_none() => {
                return Lectura::Cambiar { tema: tema.clone(), valor: Some(limpiar(mensaje)) };
            }
            _ => {}
        }

        if pide_abrir && (nombrada.is_some() || llano.contains("creacion")) {
            return Lectura::AbrirCreacion { creacion: nombrada };
        }

        // Lo que la persona pide conservar no cuenta como cambio.
        let corte = CONSERVAR.iter().filter_map(|f| llano.find(f)).min().unwrap_or(llano.len());
        let parte = &llano[..corte];
        if let Some((tema, fin)) = tema_mencionado(parte) {
            let valor = HACIA
                .iter()
                .filter_map(|m| parte[fin..].find(m).map(|i| fin + i + m.len()))
                .min()
                .map(|inicio| limpiar(&original(mensaje, &llano, inicio, corte)))
                .filter(|v| !v.is_empty());
            return Lectura::Cambiar { tema: tema.to_string(), valor };
        }

        Lectura::Pedido
    }
}

/// Minúsculas y sin tildes, para comparar palabras.
pub fn normalizar(texto: &str) -> String {
    texto
        .chars()
        .flat_map(char::to_lowercase)
        .map(|c| match c {
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' | 'ü' => 'u',
            c => c,
        })
        .collect()
}

fn palabras(llano: &str) -> impl Iterator<Item = &str> {
    llano.split(|c: char| !c.is_alphanumeric()).filter(|p| !p.is_empty())
}

/// Devuelve el tema y la posición donde termina su palabra.
fn tema_mencionado(llano: &str) -> Option<(&'static str, usize)> {
    TEMAS.iter().find_map(|(tema, claves)| {
        claves.iter().find_map(|clave| {
            llano.match_indices(clave).find_map(|(i, _)| {
                let fin = i + clave.len();
                let entera = !llano[..i].ends_with(char::is_alphanumeric)
                    && !llano[fin..].starts_with(char::is_alphanumeric);
                entera.then_some((*tema, fin))
            })
        })
    })
}

/// La creación que el mensaje nombra por su tipo o su título, si es una sola.
fn creacion_nombrada(llano: &str, conv: &Conversacion) -> Option<String> {
    let mut halladas = conv.creaciones.iter().filter(|c| {
        let tipo = normalizar(&c.tipo);
        palabras(llano).any(|p| p == tipo) || llano.contains(&normalizar(&c.titulo))
    });
    match (halladas.next(), halladas.next()) {
        (Some(unica), None) => Some(unica.id.clone()),
        _ => None,
    }
}

/// Recupera el tramo del mensaje original (con tildes) a partir de posiciones
/// del texto normalizado. Si no coinciden letra a letra, usa el normalizado.
fn original(mensaje: &str, llano: &str, inicio: usize, fin: usize) -> String {
    if mensaje.chars().count() != llano.chars().count() {
        return llano[inicio..fin].to_string();
    }
    let desde = llano[..inicio].chars().count();
    let cuantas = llano[inicio..fin].chars().count();
    mensaje.chars().skip(desde).take(cuantas).collect()
}

fn limpiar(texto: &str) -> String {
    texto
        .trim()
        .trim_end_matches(|c: char| matches!(c, '.' | ',' | ';' | '!' | ' ') )
        .trim_end_matches(" y")
        .trim()
        .to_string()
}
