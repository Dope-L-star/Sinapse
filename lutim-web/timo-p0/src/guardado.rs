//! Guardar y cargar una conversación como texto, para probar que se puede retomar.
//! Es un formato de ensayo (una línea por dato, campos separados por tabulador),
//! no el almacenamiento del producto.

use crate::{Autor, Conversacion, Creacion, Decision, Mensaje, Pendiente, Version};

fn campo(texto: &str) -> String {
    texto.replace(['\t', '\n', '\r'], " ")
}

pub fn guardar(conv: &Conversacion) -> String {
    let mut lineas = vec![format!(
        "C\t{}\t{}\t{}\t{}",
        campo(&conv.id),
        campo(&conv.titulo),
        campo(conv.proyecto.as_deref().unwrap_or("")),
        campo(conv.activa.as_deref().unwrap_or("")),
    )];
    for d in &conv.decisiones {
        lineas.push(format!("D\t{}\t{}", campo(&d.tema), campo(&d.valor)));
    }
    for c in &conv.creaciones {
        lineas.push(format!("K\t{}\t{}\t{}", campo(&c.id), campo(&c.titulo), campo(&c.tipo)));
        for v in &c.versiones {
            lineas.push(format!("V\t{}\t{}", v.numero, campo(&v.nota)));
        }
    }
    for m in &conv.mensajes {
        let autor = if m.autor == Autor::Persona { "P" } else { "T" };
        lineas.push(format!("M\t{autor}\t{}", campo(&m.texto)));
    }
    match &conv.pendiente {
        Some(Pendiente::CualCreacion) => lineas.push("Q\tcreacion".to_string()),
        Some(Pendiente::Valor { tema }) => lineas.push(format!("Q\tvalor\t{}", campo(tema))),
        None => {}
    }
    lineas.join("\n")
}

pub fn cargar(texto: &str) -> Result<Conversacion, String> {
    let mut conv: Option<Conversacion> = None;
    for (n, linea) in texto.lines().enumerate() {
        let error = || format!("línea {}: no se pudo leer «{linea}»", n + 1);
        let partes: Vec<&str> = linea.split('\t').collect();
        if let ["C", id, titulo, proyecto, activa] = partes[..] {
            let opcional = |s: &str| (!s.is_empty()).then(|| s.to_string());
            conv = Some(Conversacion {
                id: id.to_string(),
                titulo: titulo.to_string(),
                proyecto: opcional(proyecto),
                mensajes: Vec::new(),
                decisiones: Vec::new(),
                creaciones: Vec::new(),
                activa: opcional(activa),
                pendiente: None,
            });
            continue;
        }
        let c = conv.as_mut().ok_or_else(error)?;
        match partes[..] {
            ["D", tema, valor] => {
                c.decisiones.push(Decision { tema: tema.to_string(), valor: valor.to_string() })
            }
            ["K", id, titulo, tipo] => c.creaciones.push(Creacion {
                id: id.to_string(),
                titulo: titulo.to_string(),
                tipo: tipo.to_string(),
                versiones: Vec::new(),
            }),
            ["V", numero, nota] => c.creaciones.last_mut().ok_or_else(error)?.versiones.push(Version {
                numero: numero.parse().map_err(|_| error())?,
                nota: nota.to_string(),
            }),
            ["M", autor @ ("P" | "T"), texto] => c.mensajes.push(Mensaje {
                autor: if autor == "P" { Autor::Persona } else { Autor::Timo },
                texto: texto.to_string(),
            }),
            ["Q", "creacion"] => c.pendiente = Some(Pendiente::CualCreacion),
            ["Q", "valor", tema] => c.pendiente = Some(Pendiente::Valor { tema: tema.to_string() }),
            _ => return Err(error()),
        }
    }
    let conv = conv.ok_or("no hay ninguna conversación guardada")?;
    if conv.creaciones.iter().any(|c| c.versiones.is_empty()) {
        return Err("hay una creación sin versiones".to_string());
    }
    Ok(conv)
}
