//! Primera vista previa web de LUTIM: enviar un mensaje a Timo, retomar una
//! conversación y abrir su creación. Datos ficticios, sin red ni servicios.
//!
//! Toda la lógica y el HTML salen de Rust. Las reglas de Timo son las del ensayo
//! `timo-p0`, y la lectura de cada mensaje la hace su intérprete **simulado**.
//! `web/arranque.js` solo carga el Wasm, reenvía los eventos y pinta el HTML.

use timo_p0::interprete::normalizar;
use timo_p0::{
    Autor, Conversacion, InterpreteSimulado, Paso, Pendiente, Vista, datos, enviar, guardado,
    retomar,
};

const SEPARADOR: &str = "\n===\n";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Pantalla {
    Inicio,
    Hilo(usize),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Foco {
    Ninguno,
    Escribir,
    Panel,
}

pub struct App {
    convs: Vec<Conversacion>,
    pantalla: Pantalla,
    resumen: Option<String>,
    panel: Option<Vista>,
    foco: Foco,
}

impl App {
    /// Arranca con lo guardado en el navegador o, si no sirve, con los datos de muestra.
    pub fn nueva(guardado: &str) -> App {
        let convs = cargar_todo(guardado).unwrap_or_else(muestra);
        App { convs, pantalla: Pantalla::Inicio, resumen: None, panel: None, foco: Foco::Ninguno }
    }

    pub fn pantalla(&self) -> Pantalla {
        self.pantalla
    }

    pub fn panel(&self) -> Option<&Vista> {
        self.panel.as_ref()
    }

    pub fn conversaciones(&self) -> &[Conversacion] {
        &self.convs
    }

    /// Texto que el navegador guarda para poder retomar después de recargar.
    pub fn guardado(&self) -> String {
        let partes: Vec<String> = self.convs.iter().map(guardado::guardar).collect();
        partes.join(SEPARADOR)
    }

    /// Recibe `nombre\tvalor` desde la página.
    pub fn evento(&mut self, evento: &str) {
        let (nombre, valor) = evento.split_once('\t').unwrap_or((evento, ""));
        self.foco = Foco::Ninguno;
        match nombre {
            "inicio" => {
                self.pantalla = Pantalla::Inicio;
                self.panel = None;
                self.resumen = None;
            }
            "retomar" => {
                if let Some(i) = self.convs.iter().position(|c| c.id == valor) {
                    self.resumen = Some(retomar(&self.convs[i]).en_palabras());
                    self.pantalla = Pantalla::Hilo(i);
                    self.panel = None;
                    self.foco = Foco::Escribir;
                }
            }
            "enviar" => self.enviar(valor.trim()),
            "cerrar-panel" => {
                if self.panel.take().is_some() {
                    self.foco = Foco::Escribir;
                }
            }
            "reiniciar" => *self = App::nueva(""),
            _ => {}
        }
    }

    fn enviar(&mut self, texto: &str) {
        if texto.is_empty() {
            return;
        }
        let i = match self.pantalla {
            Pantalla::Hilo(i) => i,
            Pantalla::Inicio => {
                let n = self.convs.iter().filter(|c| c.id.starts_with("nueva-")).count() + 1;
                let titulo: String = texto.chars().take(48).collect();
                self.convs.push(datos::nueva(&format!("nueva-{n}"), &titulo));
                self.resumen = None;
                self.convs.len() - 1
            }
        };
        let respuesta = enviar(&mut self.convs[i], &InterpreteSimulado, texto);
        self.pantalla = Pantalla::Hilo(i);
        self.panel = None;
        self.foco = Foco::Escribir;
        if let Paso::Abierta(vista) = respuesta.paso {
            self.panel = Some(vista);
            self.foco = Foco::Panel;
        }
    }

    pub fn html(&self) -> String {
        let cuerpo = match self.pantalla {
            Pantalla::Inicio => self.inicio(),
            Pantalla::Hilo(i) => self.hilo(&self.convs[i]),
        };
        format!(
            "<p class=\"aviso\" role=\"note\"><b>Vista previa.</b> Timo responde con una \
             <b>interpretación simulada</b>: reglas de palabras, sin modelo de IA. \
             Los datos son ficticios.</p>\
             <header class=\"barra\">\
             <button class=\"marca\" data-ev=\"inicio\" aria-label=\"LUTIM, ir al inicio\">\
             <span class=\"sol\" aria-hidden=\"true\"></span>LUTIM</button>\
             <span class=\"modo\">Timo</span>\
             <button class=\"suave\" data-ev=\"reiniciar\">Reiniciar la muestra</button>\
             </header>{cuerpo}"
        )
    }

    fn inicio(&self) -> String {
        let mut tarjetas = String::new();
        // Lo más reciente primero.
        for c in self.convs.iter().rev() {
            let detalle = match (&c.proyecto, c.creaciones.len()) {
                (Some(p), n) => format!("Proyecto {} · {}", esc(p), contar(n)),
                (None, n) => contar(n),
            };
            tarjetas.push_str(&format!(
                "<li class=\"tarjeta\"><h3>{}</h3><p>{detalle}</p>\
                 <button data-ev=\"retomar\" data-val=\"{}\" aria-label=\"Continuar: {}\">Continuar</button></li>",
                esc(&c.titulo),
                esc(&c.id),
                esc(&c.titulo),
            ));
        }
        format!(
            "<main class=\"inicio\"><div class=\"horizonte\" aria-hidden=\"true\"></div>\
             <h1>Hola. ¿Qué <em>hacemos</em> hoy?</h1>{}\
             <section aria-labelledby=\"t-retomar\"><h2 id=\"t-retomar\">Retomar</h2>\
             <ul class=\"tarjetas\">{tarjetas}</ul></section></main>",
            self.escribir("Escribe a Timo", "Escribe lo que necesitas…", false),
        )
    }

    fn hilo(&self, conv: &Conversacion) -> String {
        let mut mensajes = String::new();
        for m in &conv.mensajes {
            let (clase, quien) = match m.autor {
                Autor::Persona => ("tu", "Tú".to_string()),
                Autor::Timo if m.texto.starts_with('¿') => {
                    ("timo pregunta", "Timo pregunta <i>lectura simulada</i>".to_string())
                }
                Autor::Timo => ("timo", "Timo <i>lectura simulada</i>".to_string()),
            };
            mensajes.push_str(&format!(
                "<li class=\"{clase}\"><span class=\"quien\">{quien}</span><p>{}</p></li>",
                esc(&m.texto)
            ));
        }

        let resumen = match &self.resumen {
            Some(texto) => format!(
                "<section class=\"resumen\" aria-label=\"Dónde quedaste\"><h2>Dónde quedaste</h2><p>{}</p></section>",
                esc(texto).replace('\n', "<br>")
            ),
            None => String::new(),
        };

        let mut atajos = String::new();
        for texto in sugerencias(conv) {
            atajos.push_str(&format!(
                "<li><button class=\"atajo\" data-ev=\"enviar\" data-val=\"{0}\">{0}</button></li>",
                esc(&texto)
            ));
        }

        let panel = self.panel.as_ref().map(|v| panel(conv, v)).unwrap_or_default();
        let con_panel = if self.panel.is_some() { " con-panel" } else { "" };
        let proyecto = match &conv.proyecto {
            Some(p) => format!("<p class=\"proyecto\">Proyecto {}</p>", esc(p)),
            None => String::new(),
        };

        format!(
            "<div class=\"escena{con_panel}\"><main class=\"hilo\">\
             <button class=\"suave volver\" data-ev=\"inicio\">← Inicio</button>\
             <h1>{}</h1>{proyecto}{resumen}\
             <ol class=\"mensajes\" id=\"mensajes\" aria-live=\"polite\" aria-label=\"Conversación\">{mensajes}</ol>\
             <ul class=\"atajos\" aria-label=\"Frases de ejemplo\">{atajos}</ul>{}\
             </main>{panel}</div>",
            esc(&conv.titulo),
            self.escribir("Responde a Timo", "Escribe tu mensaje…", self.foco == Foco::Escribir),
        )
    }

    fn escribir(&self, etiqueta: &str, ayuda: &str, foco: bool) -> String {
        let foco = if foco { " data-foco" } else { "" };
        format!(
            "<form class=\"hoja\" data-form=\"enviar\">\
             <label for=\"texto\">{etiqueta}</label>\
             <textarea id=\"texto\" name=\"texto\" rows=\"2\" placeholder=\"{ayuda}\"{foco}></textarea>\
             <div class=\"pie\"><span>Intro envía · Mayús + Intro hace un salto de línea</span>\
             <button type=\"submit\">Enviar</button></div></form>"
        )
    }
}

fn panel(conv: &Conversacion, v: &Vista) -> String {
    let mut decisiones = String::new();
    for d in &conv.decisiones {
        decisiones.push_str(&format!("<li><b>{}</b> {}</li>", esc(&d.tema), esc(&d.valor)));
    }
    let mut versiones = String::new();
    if let Some(c) = conv.creacion(&v.creacion) {
        for ver in c.versiones.iter().rev() {
            let actual = if ver.numero == v.version { " class=\"actual\"" } else { "" };
            versiones.push_str(&format!(
                "<li{actual}>Versión {} · {}</li>",
                ver.numero,
                esc(&ver.nota)
            ));
        }
    }
    format!(
        "<aside class=\"creacion\" role=\"dialog\" aria-labelledby=\"t-creacion\">\
         <div class=\"creacion-barra\"><span>Creación · {tipo} · versión {n}</span>\
         <button data-ev=\"cerrar-panel\" data-foco>Volver al chat</button></div>\
         <article class=\"lamina {tinta}\"><p class=\"tipo\">{tipo}</p>\
         <h2 id=\"t-creacion\">{titulo}</h2><p class=\"nota\">{nota}</p>\
         <span class=\"franja\" aria-hidden=\"true\"></span></article>\
         <h3>Lo que ya decidiste</h3><ul class=\"lista\">{decisiones}</ul>\
         <h3>Versiones</h3><ul class=\"lista\">{versiones}</ul>\
         <p class=\"pequeno\">Lámina de muestra: esta vista previa no genera el contenido de la creación.</p>\
         </aside>",
        tipo = esc(&v.tipo),
        n = v.version,
        titulo = esc(&v.titulo),
        nota = esc(&v.nota),
        tinta = tinta(conv),
    )
}

/// Frases que el intérprete simulado sabe leer, según el momento de la conversación.
fn sugerencias(conv: &Conversacion) -> Vec<String> {
    match &conv.pendiente {
        Some(Pendiente::CualCreacion) => conv
            .creaciones
            .iter()
            .map(|c| {
                let articulo = if c.tipo.ends_with('a') || c.tipo.ends_with("ión") { "La" } else { "El" };
                format!("{articulo} {}", c.tipo)
            })
            .chain(["Decide tú".to_string()])
            .collect(),
        Some(Pendiente::Valor { .. }) => vec!["Formal".to_string(), "Decide tú".to_string()],
        None if conv.creaciones.is_empty() => vec!["Abre la creación".to_string()],
        None => vec![
            "Abre la creación".to_string(),
            "Cambia el color a terracota y conserva el título".to_string(),
            "Cambia el tono".to_string(),
        ],
    }
}

fn tinta(conv: &Conversacion) -> &'static str {
    let color = normalizar(conv.decision("color").unwrap_or(""));
    if color.contains("terracota") {
        "tinta-terracota"
    } else if color.contains("oliva") || color.contains("verde") {
        "tinta-oliva"
    } else if color.contains("azul") {
        "tinta-azul"
    } else {
        "tinta-ambar"
    }
}

fn contar(n: usize) -> String {
    match n {
        0 => "Sin creaciones".to_string(),
        1 => "1 creación".to_string(),
        n => format!("{n} creaciones"),
    }
}

fn muestra() -> Vec<Conversacion> {
    vec![datos::historia(), datos::cafeteria()]
}

fn cargar_todo(texto: &str) -> Option<Vec<Conversacion>> {
    if texto.trim().is_empty() {
        return None;
    }
    let convs: Result<Vec<_>, _> = texto.split(SEPARADOR).map(guardado::cargar).collect();
    convs.ok().filter(|c| !c.is_empty())
}

/// Escapa texto para ponerlo dentro de HTML o de un atributo.
pub fn esc(texto: &str) -> String {
    let mut salida = String::with_capacity(texto.len());
    for c in texto.chars() {
        match c {
            '&' => salida.push_str("&amp;"),
            '<' => salida.push_str("&lt;"),
            '>' => salida.push_str("&gt;"),
            '"' => salida.push_str("&quot;"),
            '\'' => salida.push_str("&#39;"),
            c => salida.push(c),
        }
    }
    salida
}

/// Puente con la página. El texto viaja por un único búfer compartido:
/// la página lo reserva con `lw_reservar`, escribe, llama y lee `lw_largo` bytes.
#[cfg(target_arch = "wasm32")]
mod puente {
    use super::App;
    use std::cell::RefCell;

    thread_local! {
        static APP: RefCell<App> = RefCell::new(App::nueva(""));
        static BUFER: RefCell<Vec<u8>> = const { RefCell::new(Vec::new()) };
    }

    fn entrada(largo: usize) -> String {
        BUFER.with(|b| String::from_utf8_lossy(&b.borrow()[..largo]).into_owned())
    }

    fn salida(texto: String) -> *const u8 {
        BUFER.with(|b| {
            *b.borrow_mut() = texto.into_bytes();
            b.borrow().as_ptr()
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn lw_reservar(largo: usize) -> *mut u8 {
        BUFER.with(|b| {
            let mut b = b.borrow_mut();
            b.clear();
            b.resize(largo, 0);
            b.as_mut_ptr()
        })
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn lw_largo() -> usize {
        BUFER.with(|b| b.borrow().len())
    }

    /// Recibe lo guardado en el navegador y devuelve el HTML inicial.
    #[unsafe(no_mangle)]
    pub extern "C" fn lw_iniciar(largo: usize) -> *const u8 {
        let guardado = entrada(largo);
        salida(APP.with(|a| {
            *a.borrow_mut() = App::nueva(&guardado);
            a.borrow().html()
        }))
    }

    /// Recibe un evento y devuelve el HTML resultante.
    #[unsafe(no_mangle)]
    pub extern "C" fn lw_evento(largo: usize) -> *const u8 {
        let evento = entrada(largo);
        salida(APP.with(|a| {
            a.borrow_mut().evento(&evento);
            a.borrow().html()
        }))
    }

    /// Devuelve el texto que la página debe guardar para retomar.
    #[unsafe(no_mangle)]
    pub extern "C" fn lw_guardado(_largo: usize) -> *const u8 {
        salida(APP.with(|a| a.borrow().guardado()))
    }
}
