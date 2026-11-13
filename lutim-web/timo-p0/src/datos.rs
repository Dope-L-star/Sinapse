//! Datos ficticios del ensayo. No hay cuentas, personas ni conversaciones reales.

use crate::{Autor, Conversacion, Creacion, Decision, Mensaje, Version};

fn decision(tema: &str, valor: &str) -> Decision {
    Decision { tema: tema.to_string(), valor: valor.to_string() }
}

fn creacion(id: &str, titulo: &str, tipo: &str, notas: &[&str]) -> Creacion {
    Creacion {
        id: id.to_string(),
        titulo: titulo.to_string(),
        tipo: tipo.to_string(),
        versiones: notas
            .iter()
            .enumerate()
            .map(|(i, nota)| Version { numero: i as u32 + 1, nota: nota.to_string() })
            .collect(),
    }
}

fn mensaje(autor: Autor, texto: &str) -> Mensaje {
    Mensaje { autor, texto: texto.to_string() }
}

/// Conversación con dos creaciones: sirve para probar la pregunta «¿cuál abro?».
pub fn cafeteria() -> Conversacion {
    Conversacion {
        id: "cafeteria".to_string(),
        titulo: "Identidad de una cafetería".to_string(),
        proyecto: Some("Casa Calma".to_string()),
        mensajes: vec![
            mensaje(Autor::Persona, "Quiero una presentación para mi cafetería, Casa Calma."),
            mensaje(Autor::Timo, "Preparé la presentación con el título, el color y el tono que elegiste."),
        ],
        decisiones: vec![
            decision("título", "Identidad de una cafetería"),
            decision("color", "ámbar"),
            decision("tono", "cercano"),
        ],
        creaciones: vec![
            creacion(
                "presentacion",
                "Identidad de una cafetería",
                "presentación",
                &["primer borrador", "portada con el título aprobado"],
            ),
            creacion("menu", "Menú de temporada", "menú", &["primer borrador"]),
        ],
        activa: Some("presentacion".to_string()),
        pendiente: None,
    }
}

/// Conversación con una sola creación: «abre la creación» no necesita pregunta.
pub fn historia() -> Conversacion {
    Conversacion {
        id: "historia".to_string(),
        titulo: "Resumen de historia".to_string(),
        proyecto: None,
        mensajes: vec![
            mensaje(Autor::Persona, "Resume el capítulo 3 en una página."),
            mensaje(Autor::Timo, "Te dejé el resumen en un documento de una página."),
        ],
        decisiones: vec![decision("tono", "sencillo")],
        creaciones: vec![creacion("resumen", "Capítulo 3 en una página", "documento", &["resumen"])],
        activa: Some("resumen".to_string()),
        pendiente: None,
    }
}

/// Conversación recién creada, sin decisiones ni creaciones.
pub fn nueva(id: &str, titulo: &str) -> Conversacion {
    Conversacion {
        id: id.to_string(),
        titulo: titulo.to_string(),
        proyecto: None,
        mensajes: Vec::new(),
        decisiones: Vec::new(),
        creaciones: Vec::new(),
        activa: None,
        pendiente: None,
    }
}
