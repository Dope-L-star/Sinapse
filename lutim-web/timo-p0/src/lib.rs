//! Ensayo aislado `timo-p0`: enviar un mensaje a Timo, retomar una conversación
//! y abrir su creación, con datos ficticios y sin red.
//!
//! Hay dos partes separadas a propósito:
//!
//! - **Leer el mensaje** ([`Interprete`]). Aquí va un modelo de IA en el producto.
//!   En este ensayo lo sustituye [`InterpreteSimulado`], que usa reglas de palabras.
//! - **Decidir el siguiente paso** ([`enviar`]). Son reglas fijas y sí se prueban aquí:
//!   conservar lo ya decidido, actuar si el pedido está claro y hacer una sola
//!   pregunta cuando falta un dato que cambia el resultado.

pub mod datos;
pub mod guardado;
pub mod interprete;

pub use interprete::{Interprete, InterpreteSimulado, Lectura};

/// Algo que la persona ya aprobó, por ejemplo `color: ámbar`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Decision {
    pub tema: String,
    pub valor: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Version {
    pub numero: u32,
    pub nota: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Creacion {
    pub id: String,
    pub titulo: String,
    /// En palabras comunes: «presentación», «menú», «documento».
    pub tipo: String,
    pub versiones: Vec<Version>,
}

impl Creacion {
    pub fn ultima(&self) -> &Version {
        self.versiones.last().expect("una creación tiene al menos una versión")
    }

    fn nombre(&self) -> String {
        format!("{} «{}»", con_articulo(&self.tipo), self.titulo)
    }
}

/// «la presentación», «el menú», «la tipografía», «el color».
fn con_articulo(palabra: &str) -> String {
    let femenina = palabra.ends_with('a') || palabra.ends_with("ión");
    format!("{} {palabra}", if femenina { "la" } else { "el" })
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Autor {
    Persona,
    Timo,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Mensaje {
    pub autor: Autor,
    pub texto: String,
}

/// La única pregunta que Timo dejó abierta, si hay una.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Pendiente {
    CualCreacion,
    Valor { tema: String },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Conversacion {
    pub id: String,
    pub titulo: String,
    pub proyecto: Option<String>,
    pub mensajes: Vec<Mensaje>,
    pub decisiones: Vec<Decision>,
    pub creaciones: Vec<Creacion>,
    /// La creación en la que se trabajó por última vez.
    pub activa: Option<String>,
    pub pendiente: Option<Pendiente>,
}

impl Conversacion {
    pub fn decision(&self, tema: &str) -> Option<&str> {
        self.decisiones
            .iter()
            .find(|d| d.tema == tema)
            .map(|d| d.valor.as_str())
    }

    pub fn creacion(&self, id: &str) -> Option<&Creacion> {
        self.creaciones.iter().find(|c| c.id == id)
    }

    fn creacion_activa(&self) -> Option<&Creacion> {
        self.activa.as_deref().and_then(|id| self.creacion(id))
    }

    fn lista_decisiones(&self, excepto: Option<&str>) -> String {
        let lista: Vec<String> = self
            .decisiones
            .iter()
            .filter(|d| Some(d.tema.as_str()) != excepto)
            .map(|d| format!("{} «{}»", d.tema, d.valor))
            .collect();
        unir(&lista)
    }
}

/// Lo que se ve al abrir una creación.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Vista {
    pub creacion: String,
    pub titulo: String,
    pub tipo: String,
    pub version: u32,
    pub nota: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Paso {
    /// Timo actuó sin preguntar.
    Hecho,
    /// Timo necesita un dato y hace una sola pregunta.
    Pregunta,
    /// Timo abrió una creación.
    Abierta(Vista),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Respuesta {
    pub texto: String,
    pub paso: Paso,
    /// `true` si el mensaje lo leyó un intérprete simulado y no un modelo real.
    pub simulada: bool,
}

/// Envía un mensaje a Timo dentro de una conversación y devuelve su respuesta.
pub fn enviar(conv: &mut Conversacion, interprete: &dyn Interprete, texto: &str) -> Respuesta {
    let lectura = interprete.leer(texto, conv);
    aplicar_lectura(conv, texto, lectura, interprete.es_simulacion())
}

/// Aplica una lectura ya obtenida, incluso si el transporte del modelo es asíncrono.
pub fn aplicar_lectura(
    conv: &mut Conversacion,
    texto: &str,
    lectura: Lectura,
    simulada: bool,
) -> Respuesta {
    conv.mensajes.push(Mensaje { autor: Autor::Persona, texto: texto.to_string() });

    let (texto_timo, paso) = match lectura {
        Lectura::Cambiar { tema, valor: Some(valor) } => cambiar(conv, &tema, &valor),
        Lectura::Cambiar { tema, valor: None } => {
            let pregunta = match conv.decision(&tema) {
                Some(actual) => format!(
                    "¿Qué {tema} quieres usar? Ahora es «{actual}». Si prefieres, di «decide tú»."
                ),
                None => format!("¿Qué {tema} quieres usar? Si prefieres, di «decide tú»."),
            };
            conv.pendiente = Some(Pendiente::Valor { tema });
            (pregunta, Paso::Pregunta)
        }
        Lectura::AbrirCreacion { creacion: Some(id) } => abrir(conv, &id, None),
        Lectura::AbrirCreacion { creacion: None } => match conv.creaciones.len() {
            0 => (
                "Esta conversación todavía no tiene creaciones para abrir.".to_string(),
                Paso::Hecho,
            ),
            1 => {
                let id = conv.creaciones[0].id.clone();
                abrir(conv, &id, None)
            }
            _ => {
                let nombres: Vec<String> = conv.creaciones.iter().map(Creacion::nombre).collect();
                conv.pendiente = Some(Pendiente::CualCreacion);
                (
                    format!(
                        "¿Cuál abro: {}? Si prefieres, di «decide tú».",
                        nombres.join(" o ")
                    ),
                    Paso::Pregunta,
                )
            }
        },
        Lectura::DecideTu => decidir_por_la_persona(conv),
        Lectura::Pedido => {
            conv.pendiente = None;
            let conservado = conv.lista_decisiones(None);
            let texto = if conservado.is_empty() {
                "Entendido, empiezo con eso.".to_string()
            } else {
                format!("Entendido, lo hago. Mantengo lo ya decidido: {conservado}.")
            };
            (texto, Paso::Hecho)
        }
    };

    conv.mensajes.push(Mensaje { autor: Autor::Timo, texto: texto_timo.clone() });
    Respuesta { texto: texto_timo, paso, simulada }
}

/// Cambia una sola decisión y deja las demás como estaban.
fn cambiar(conv: &mut Conversacion, tema: &str, valor: &str) -> (String, Paso) {
    conv.pendiente = None;
    if conv.decision(tema) == Some(valor) {
        let el_tema = con_articulo(tema);
        let el_tema = el_tema[..1].to_uppercase() + &el_tema[1..];
        return (format!("{el_tema} ya es «{valor}». No cambié nada."), Paso::Hecho);
    }
    match conv.decisiones.iter_mut().find(|d| d.tema == tema) {
        Some(d) => d.valor = valor.to_string(),
        None => conv.decisiones.push(Decision { tema: tema.to_string(), valor: valor.to_string() }),
    }

    let conservado = conv.lista_decisiones(Some(tema));
    let mut texto = format!("Listo. Cambié {} a «{valor}».", con_articulo(tema));
    if !conservado.is_empty() {
        texto.push_str(&format!(" Lo demás sigue igual: {conservado}."));
    }

    // La corrección se guarda como una versión nueva; las anteriores no se pierden.
    if let Some(id) = conv.activa.clone() {
        if let Some(creacion) = conv.creaciones.iter_mut().find(|c| c.id == id) {
            let numero = creacion.ultima().numero + 1;
            creacion.versiones.push(Version { numero, nota: format!("{tema}: {valor}") });
            texto.push_str(&format!(
                " Guardé la versión {numero} de {}; la versión {} sigue disponible.",
                creacion.nombre(),
                numero - 1
            ));
        }
    }
    (texto, Paso::Hecho)
}

fn abrir(conv: &mut Conversacion, id: &str, supuesto: Option<&str>) -> (String, Paso) {
    conv.pendiente = None;
    let Some(creacion) = conv.creacion(id) else {
        return ("No encontré esa creación en esta conversación.".to_string(), Paso::Hecho);
    };
    let ultima = creacion.ultima();
    let vista = Vista {
        creacion: creacion.id.clone(),
        titulo: creacion.titulo.clone(),
        tipo: creacion.tipo.clone(),
        version: ultima.numero,
        nota: ultima.nota.clone(),
    };
    let mut texto = format!("Abrí {}, versión {}.", creacion.nombre(), ultima.numero);
    if let Some(supuesto) = supuesto {
        texto.push_str(&format!(" {supuesto}"));
    }
    conv.activa = Some(id.to_string());
    (texto, Paso::Abierta(vista))
}

/// «Decide tú»: Timo elige con lo que sabe y dice qué supuso.
fn decidir_por_la_persona(conv: &mut Conversacion) -> (String, Paso) {
    match conv.pendiente.take() {
        Some(Pendiente::CualCreacion) => {
            let (id, supuesto) = match conv.creacion_activa() {
                Some(c) => (c.id.clone(), "La elegí porque es la última en la que trabajaste."),
                None => (
                    conv.creaciones.last().map(|c| c.id.clone()).unwrap_or_default(),
                    "La elegí porque es la más reciente.",
                ),
            };
            abrir(conv, &id, Some(supuesto))
        }
        Some(Pendiente::Valor { tema }) => {
            let texto = match conv.decision(&tema) {
                Some(actual) => {
                    format!("Dejo {} como está: «{actual}». No cambié nada.", con_articulo(&tema))
                }
                None => format!(
                    "Por ahora no fijo {}. Puedes decírmelo cuando quieras.",
                    con_articulo(&tema)
                ),
            };
            (texto, Paso::Hecho)
        }
        None => (
            "De acuerdo, decido yo con lo que ya acordamos.".to_string(),
            Paso::Hecho,
        ),
    }
}

/// Resumen para retomar una conversación guardada.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Resumen {
    pub titulo: String,
    pub proyecto: Option<String>,
    pub quedaste_en: Option<String>,
    pub decisiones: Vec<Decision>,
    pub creaciones: Vec<(String, u32)>,
    pub pregunta_abierta: bool,
}

pub fn retomar(conv: &Conversacion) -> Resumen {
    Resumen {
        titulo: conv.titulo.clone(),
        proyecto: conv.proyecto.clone(),
        quedaste_en: conv
            .mensajes
            .iter()
            .rev()
            .find(|m| m.autor == Autor::Timo)
            .map(|m| m.texto.clone()),
        decisiones: conv.decisiones.clone(),
        creaciones: conv
            .creaciones
            .iter()
            .map(|c| (c.nombre(), c.ultima().numero))
            .collect(),
        pregunta_abierta: conv.pendiente.is_some(),
    }
}

impl Resumen {
    pub fn en_palabras(&self) -> String {
        let mut lineas = vec![match &self.proyecto {
            Some(p) => format!("Retomas «{}», del proyecto {p}.", self.titulo),
            None => format!("Retomas «{}».", self.titulo),
        }];
        if let Some(texto) = &self.quedaste_en {
            lineas.push(format!("Quedaste en: {texto}"));
        }
        if !self.decisiones.is_empty() {
            let lista: Vec<String> =
                self.decisiones.iter().map(|d| format!("{} «{}»", d.tema, d.valor)).collect();
            lineas.push(format!("Ya decidido: {}.", unir(&lista)));
        }
        if !self.creaciones.is_empty() {
            let lista: Vec<String> =
                self.creaciones.iter().map(|(n, v)| format!("{n} (versión {v})")).collect();
            lineas.push(format!("Creaciones: {}.", unir(&lista)));
        }
        if self.pregunta_abierta {
            lineas.push("Timo espera tu respuesta a su última pregunta.".to_string());
        }
        lineas.join("\n")
    }
}

/// «a», «a y b», «a, b y c».
fn unir(partes: &[String]) -> String {
    match partes {
        [] => String::new(),
        [una] => una.clone(),
        [resto @ .., ultima] => format!("{} y {}", resto.join(", "), ultima),
    }
}
