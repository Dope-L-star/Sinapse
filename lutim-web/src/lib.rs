//! Vista previa web de LUTIM: Timo, retomar conversaciones, creaciones, biblioteca,
//! búsqueda y «Tu panel», cada pantalla con su ruta. Datos ficticios, sin red.
//!
//! Toda la lógica y el HTML salen de Rust. Las reglas de Timo son las del ensayo
//! `timo-p0`, y la lectura de cada mensaje la hace su intérprete **simulado**.
//! `web/arranque.js` solo carga el Wasm, reenvía los eventos y pinta el HTML.

use timo_p0::interprete::normalizar;
use timo_p0::{
    Autor, Conversacion, Creacion, InterpreteSimulado, Paso, Pendiente, Vista, datos, enviar,
    guardado, retomar,
};

const SEPARADOR: &str = "\n===\n";
const MARCA: &str = include_str!("../web/marca.svg");

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VistaPanel {
    Personal,
    Equipo,
    Administracion,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Pantalla {
    Inicio,
    Hilo(usize),
    Panel(VistaPanel),
    Biblioteca,
    Buscar,
    NoEncontrada,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tema {
    Sistema,
    Claro,
    Oscuro,
}

impl Tema {
    fn clave(self) -> &'static str {
        match self {
            Tema::Sistema => "sistema",
            Tema::Claro => "claro",
            Tema::Oscuro => "oscuro",
        }
    }

    fn nombre(self) -> &'static str {
        match self {
            Tema::Sistema => "Sistema",
            Tema::Claro => "Claro",
            Tema::Oscuro => "Oscuro",
        }
    }

    fn siguiente(self) -> Tema {
        match self {
            Tema::Sistema => Tema::Claro,
            Tema::Claro => Tema::Oscuro,
            Tema::Oscuro => Tema::Sistema,
        }
    }

    fn desde(clave: &str) -> Tema {
        match clave {
            "claro" => Tema::Claro,
            "oscuro" => Tema::Oscuro,
            _ => Tema::Sistema,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Foco {
    Ninguno,
    Titulo,
    Escribir,
    Creacion,
    Menu,
}

pub struct App {
    convs: Vec<Conversacion>,
    pantalla: Pantalla,
    resumen: Option<String>,
    panel: Option<Vista>,
    busqueda: String,
    tema: Tema,
    menu: bool,
    foco: Foco,
}

impl App {
    /// Arranca con lo guardado en el navegador o, si no sirve, con los datos de muestra.
    pub fn nueva(guardado: &str) -> App {
        let (tema, resto) = match guardado.strip_prefix("#tema\t") {
            Some(resto) => match resto.split_once(SEPARADOR) {
                Some((clave, convs)) => (Tema::desde(clave), convs),
                None => (Tema::desde(resto.trim()), ""),
            },
            None => (Tema::Sistema, guardado),
        };
        App {
            convs: cargar_todo(resto).unwrap_or_else(muestra),
            pantalla: Pantalla::Inicio,
            resumen: None,
            panel: None,
            busqueda: String::new(),
            tema,
            menu: false,
            foco: Foco::Ninguno,
        }
    }

    pub fn pantalla(&self) -> Pantalla {
        self.pantalla
    }

    pub fn panel(&self) -> Option<&Vista> {
        self.panel.as_ref()
    }

    pub fn tema(&self) -> Tema {
        self.tema
    }

    pub fn conversaciones(&self) -> &[Conversacion] {
        &self.convs
    }

    /// Texto que el navegador guarda para poder retomar después de recargar.
    pub fn guardado(&self) -> String {
        let mut partes = vec![format!("#tema\t{}", self.tema.clave())];
        partes.extend(self.convs.iter().map(guardado::guardar));
        partes.join(SEPARADOR)
    }

    /// La dirección de la pantalla actual, para la barra del navegador.
    /// Vacía si la dirección pedida no existe: la página no la corrige.
    pub fn ruta(&self) -> String {
        match self.pantalla {
            Pantalla::NoEncontrada => String::new(),
            Pantalla::Inicio => "#/".to_string(),
            Pantalla::Hilo(i) => match &self.panel {
                Some(v) => ruta_creacion(&self.convs[i], &v.creacion),
                None => ruta_hilo(&self.convs[i]),
            },
            Pantalla::Panel(VistaPanel::Personal) => "#/panel".to_string(),
            Pantalla::Panel(VistaPanel::Equipo) => "#/panel/equipo".to_string(),
            Pantalla::Panel(VistaPanel::Administracion) => "#/panel/administracion".to_string(),
            Pantalla::Biblioteca => "#/biblioteca".to_string(),
            Pantalla::Buscar => "#/buscar".to_string(),
        }
    }

    pub fn titulo(&self) -> String {
        let pagina = match self.pantalla {
            Pantalla::Inicio => "Timo".to_string(),
            Pantalla::Hilo(i) => self.convs[i].titulo.clone(),
            Pantalla::Panel(_) => "Tu panel".to_string(),
            Pantalla::Biblioteca => "Biblioteca".to_string(),
            Pantalla::Buscar => "Buscar".to_string(),
            Pantalla::NoEncontrada => "Página no encontrada".to_string(),
        };
        format!("{pagina} · LUTIM (vista previa)")
    }

    /// Recibe `nombre\tvalor` desde la página.
    pub fn evento(&mut self, evento: &str) {
        let (nombre, valor) = evento.split_once('\t').unwrap_or((evento, ""));
        self.foco = Foco::Ninguno;
        match nombre {
            "ruta" => self.ir(valor),
            "enviar" => self.enviar(valor.trim()),
            "buscar" => {
                self.busqueda = valor.trim().chars().take(80).collect();
                self.pantalla = Pantalla::Buscar;
                self.panel = None;
                self.foco = Foco::Titulo;
            }
            "cerrar-panel" => {
                if self.panel.take().is_some() {
                    self.foco = Foco::Escribir;
                }
            }
            "menu" => {
                self.menu = !self.menu;
                self.foco = if self.menu { Foco::Menu } else { Foco::Ninguno };
            }
            "tema" => self.tema = self.tema.siguiente(),
            "saltar" => self.foco = Foco::Titulo,
            "reiniciar" => {
                let tema = self.tema;
                *self = App::nueva("");
                self.tema = tema;
                self.foco = Foco::Titulo;
            }
            _ => {}
        }
    }

    /// Cambia de pantalla según la dirección (`#/panel`, `#/c/cafeteria`…).
    fn ir(&mut self, ruta: &str) {
        let partes: Vec<&str> =
            ruta.trim_start_matches('#').split('/').filter(|p| !p.is_empty()).collect();
        let antes = self.pantalla;
        self.menu = false;
        self.panel = None;
        self.foco = Foco::Titulo;
        self.pantalla = match partes[..] {
            [] => Pantalla::Inicio,
            ["panel"] => Pantalla::Panel(VistaPanel::Personal),
            ["panel", "equipo"] => Pantalla::Panel(VistaPanel::Equipo),
            ["panel", "administracion"] => Pantalla::Panel(VistaPanel::Administracion),
            ["biblioteca"] => Pantalla::Biblioteca,
            ["buscar"] => Pantalla::Buscar,
            ["c", id] | ["c", id, "creacion", _] => {
                match self.convs.iter().position(|c| c.id == id) {
                    Some(i) => Pantalla::Hilo(i),
                    None => Pantalla::NoEncontrada,
                }
            }
            _ => Pantalla::NoEncontrada,
        };
        match self.pantalla {
            Pantalla::Hilo(i) => {
                let conv = &self.convs[i];
                // El resumen aparece al llegar a la conversación, no al moverse dentro de ella.
                if antes != self.pantalla {
                    self.resumen =
                        (!conv.mensajes.is_empty()).then(|| retomar(conv).en_palabras());
                }
                if let ["c", _, "creacion", id] = partes[..] {
                    match conv.creacion(id) {
                        Some(creacion) => {
                            self.panel = Some(vista_de(creacion));
                            self.foco = Foco::Creacion;
                        }
                        None => self.pantalla = Pantalla::NoEncontrada,
                    }
                }
            }
            _ => self.resumen = None,
        }
    }

    fn enviar(&mut self, texto: &str) {
        if texto.is_empty() {
            return;
        }
        let i = match self.pantalla {
            Pantalla::Hilo(i) => i,
            _ => {
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
        self.menu = false;
        self.foco = Foco::Escribir;
        if let Paso::Abierta(vista) = respuesta.paso {
            self.panel = Some(vista);
            self.foco = Foco::Creacion;
        }
    }

    // ── Render ──

    pub fn html(&self) -> String {
        let (principal, clase) = match self.pantalla {
            Pantalla::Inicio => (self.inicio(), "inicio"),
            Pantalla::Hilo(i) => (self.hilo(&self.convs[i]), "hilo"),
            Pantalla::Panel(vista) => (self.tu_panel(vista), "pagina"),
            Pantalla::Biblioteca => (self.biblioteca(), "pagina"),
            Pantalla::Buscar => (self.buscar(), "pagina"),
            Pantalla::NoEncontrada => (self.no_encontrada(), "pagina"),
        };
        let creacion = match (self.pantalla, &self.panel) {
            (Pantalla::Hilo(i), Some(v)) => panel_creacion(&self.convs[i], v),
            _ => String::new(),
        };
        let con_panel = if creacion.is_empty() { "" } else { " con-panel" };
        let abierto = if self.menu { " menu-abierto" } else { "" };
        let velo = if self.menu {
            "<button class=\"velo\" data-ev=\"menu\" aria-label=\"Cerrar el menú\"></button>"
        } else {
            ""
        };
        format!(
            "<div class=\"lx{abierto}\" data-ruta=\"{ruta}\" data-titulo=\"{titulo}\" data-tema=\"{tema}\">\
             <button class=\"saltar\" data-ev=\"saltar\">Saltar al contenido</button>\
             <p class=\"aviso\" role=\"note\"><b>Vista previa.</b> Timo responde con una \
             <b>interpretación simulada</b>, sin modelo de IA. Datos ficticios.</p>\
             {velo}{lateral}\
             <div class=\"area\">{barra}\
             <div class=\"escena{con_panel}\"><main id=\"principal\" class=\"{clase}\">{principal}</main>{creacion}</div>\
             </div>{inferior}</div>",
            ruta = self.ruta(),
            titulo = esc(&self.titulo()),
            tema = self.tema.clave(),
            lateral = self.lateral(),
            barra = self.barra(),
            inferior = self.inferior(),
        )
    }

    fn h1(&self, contenido: &str) -> String {
        let foco = if self.foco == Foco::Titulo { " data-foco" } else { "" };
        format!("<h1 tabindex=\"-1\"{foco}>{contenido}</h1>")
    }

    /// Barra lateral con la estructura de la maqueta Horizonte de Nexo.
    fn lateral(&self) -> String {
        let en_chat = matches!(self.pantalla, Pantalla::Inicio | Pantalla::Hilo(_));
        let mut recientes = String::new();
        for (i, c) in self.convs.iter().enumerate().rev() {
            let actual = self.pantalla == Pantalla::Hilo(i);
            recientes.push_str(&enlace(&ruta_hilo(c), "timo", &esc(&c.titulo), actual));
        }
        let mut fijados = String::new();
        for proyecto in self.proyectos() {
            fijados.push_str(&enlace("#/panel", "carpeta", &esc(proyecto), false));
        }
        let mut pronto = String::new();
        for (icono, nombre) in [
            ("carpeta", "Espacios"),
            ("mando", "Seletim"),
            ("memoria", "Memoria Lutim"),
            ("ayuda", "Ayuda de Tim"),
            ("ajustes", "Ajustes"),
        ] {
            pronto.push_str(&format!(
                "<li class=\"pronto\">{}<span>{nombre}</span><small>Pronto</small></li>",
                ic(icono)
            ));
        }
        let foco = if self.foco == Foco::Menu { " data-foco" } else { "" };
        format!(
            "<aside class=\"lateral\" id=\"lateral\" aria-label=\"Navegación principal\">\
             <div class=\"lateral-cabeza\">\
             <a class=\"marca\" href=\"#/\" aria-label=\"LUTIM, ir a Timo\">\
             <span class=\"simbolo\" aria-hidden=\"true\">{MARCA}</span>LUTIM</a>\
             <button class=\"icono solo-movil\" data-ev=\"menu\" aria-label=\"Cerrar el menú\"{foco}>{cerrar}</button></div>\
             <div class=\"lateral-rollo\"><nav aria-label=\"Accesos de LUTIM\">\
             <a class=\"nueva\" href=\"#/\">{mas}<span>Nueva conversación</span></a>\
             <ul>{buscar}{timo}{panel}{biblioteca}</ul>\
             <details data-plegable=\"pronto\"><summary>Más adelante</summary><ul>{pronto}</ul></details>\
             </nav>\
             <details data-plegable=\"fijados\" open><summary>Fijados</summary><ul>{fijados}</ul></details>\
             <details data-plegable=\"recientes\" open><summary>Recientes</summary><ul>{recientes}</ul></details>\
             </div>\
             <div class=\"lateral-pie\"><div class=\"cuenta\"><span class=\"inicial\" aria-hidden=\"true\">I</span>\
             <span>Invitado<small>Sin cuenta · datos de muestra</small></span></div>\
             <button class=\"icono\" data-ev=\"reiniciar\" aria-label=\"Reiniciar la muestra\" title=\"Reiniciar la muestra\">{reiniciar}</button>\
             </div></aside>",
            cerrar = ic("cerrar"),
            mas = ic("mas"),
            buscar = enlace("#/buscar", "buscar", "Buscar", self.pantalla == Pantalla::Buscar),
            timo = enlace("#/", "timo", "Timo", en_chat && self.pantalla == Pantalla::Inicio),
            panel = enlace("#/panel", "panel", "Tu panel", matches!(self.pantalla, Pantalla::Panel(_))),
            biblioteca = enlace("#/biblioteca", "biblioteca", "Biblioteca", self.pantalla == Pantalla::Biblioteca),
            reiniciar = ic("reiniciar"),
        )
    }

    fn barra(&self) -> String {
        format!(
            "<header class=\"barra\">\
             <button class=\"icono solo-movil\" data-ev=\"menu\" aria-controls=\"lateral\" aria-expanded=\"{}\" aria-label=\"Menú\">{}</button>\
             <span class=\"modo\">{}Timo</span>\
             <button class=\"suave tema\" data-ev=\"tema\" aria-label=\"Apariencia: {nombre}. Cambiar\">{}<span>{nombre}</span></button>\
             </header>",
            self.menu,
            ic("menu"),
            ic("timo"),
            ic("tema"),
            nombre = self.tema.nombre(),
        )
    }

    /// Navegación inferior del celular.
    fn inferior(&self) -> String {
        let en_chat = matches!(self.pantalla, Pantalla::Inicio | Pantalla::Hilo(_));
        format!(
            "<nav class=\"inferior\" aria-label=\"Navegación del celular\"><ul>{}{}{}\
             <li><button data-ev=\"menu\" aria-controls=\"lateral\" aria-expanded=\"{}\">{}<span>Menú</span></button></li>\
             </ul></nav>",
            enlace("#/", "timo", "Timo", en_chat),
            enlace("#/panel", "panel", "Tu panel", matches!(self.pantalla, Pantalla::Panel(_))),
            enlace("#/biblioteca", "biblioteca", "Biblioteca", self.pantalla == Pantalla::Biblioteca),
            self.menu,
            ic("menu"),
        )
    }

    fn inicio(&self) -> String {
        let mut tarjetas = String::new();
        for c in self.convs.iter().rev() {
            tarjetas.push_str(&format!(
                "<li class=\"tarjeta\"><h3>{titulo}</h3><p>{}</p>\
                 <a class=\"boton\" href=\"{}\" aria-label=\"Continuar: {titulo}\">Continuar</a></li>",
                detalle(c),
                ruta_hilo(c),
                titulo = esc(&c.titulo),
            ));
        }
        format!(
            "<div class=\"horizonte\" aria-hidden=\"true\"></div>{}{}\
             <section aria-labelledby=\"t-retomar\"><h2 id=\"t-retomar\">Retomar</h2>\
             <ul class=\"tarjetas\">{tarjetas}</ul></section>",
            self.h1("Hola. ¿Qué <em>hacemos</em> hoy?"),
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

        let mut creaciones = String::new();
        for c in &conv.creaciones {
            creaciones.push_str(&format!(
                "<li><a class=\"ficha\" href=\"{}\">{}<span>Abrir {}</span></a></li>",
                ruta_creacion(conv, &c.id),
                ic("creacion"),
                esc(&con_articulo(&c.tipo, false)),
            ));
        }
        if !creaciones.is_empty() {
            creaciones = format!(
                "<ul class=\"fichas\" aria-label=\"Creaciones de esta conversación\">{creaciones}</ul>"
            );
        }

        let mut atajos = String::new();
        for texto in sugerencias(conv) {
            atajos.push_str(&format!(
                "<li><button class=\"atajo\" data-ev=\"enviar\" data-val=\"{0}\">{0}</button></li>",
                esc(&texto)
            ));
        }

        let proyecto = match &conv.proyecto {
            Some(p) => format!("<p class=\"proyecto\">{}Proyecto {}</p>", ic("carpeta"), esc(p)),
            None => String::new(),
        };

        format!(
            "<div class=\"rollo\" data-rollo>{}{proyecto}{resumen}{creaciones}\
             <ol class=\"mensajes\" id=\"mensajes\" aria-live=\"polite\" aria-label=\"Conversación\">{mensajes}</ol></div>\
             <div class=\"hilo-pie\"><ul class=\"atajos\" aria-label=\"Frases de ejemplo que la simulación entiende\">{atajos}</ul>{}</div>",
            self.h1(&esc(&conv.titulo)),
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
             <button type=\"submit\" aria-label=\"Enviar\">{}<span>Enviar</span></button></div></form>",
            ic("enviar"),
        )
    }

    /// «Tu panel»: página propia, fuera del chat, con datos de las conversaciones de muestra.
    fn tu_panel(&self, vista: VistaPanel) -> String {
        let pestana = |ruta: &str, icono: &str, nombre: &str, actual: bool| {
            let actual = if actual { " aria-current=\"page\"" } else { "" };
            format!("<li><a href=\"{ruta}\"{actual}>{}<span>{nombre}</span></a></li>", ic(icono))
        };
        let pestanas = format!(
            "<nav aria-label=\"Vistas del panel\"><ul class=\"pestanas\">{}{}{}</ul></nav>",
            pestana("#/panel", "persona", "Personal", vista == VistaPanel::Personal),
            pestana("#/panel/equipo", "equipo", "Equipo", vista == VistaPanel::Equipo),
            pestana("#/panel/administracion", "escudo", "Administración", vista == VistaPanel::Administracion),
        );
        let cuerpo = match vista {
            VistaPanel::Personal => self.panel_personal(),
            VistaPanel::Equipo => vacio(
                "equipo",
                "Todavía no hay equipo",
                "Esta vista mostrará proyectos compartidos, tareas del equipo e invitaciones. \
                 Necesita cuentas e inicio de sesión, que esta vista previa no tiene.",
            ),
            VistaPanel::Administracion => vacio(
                "escudo",
                "Administración no disponible",
                "Aquí irán el estado de los servicios y los permisos de cada integrante. \
                 Solo tendrá sentido con cuentas reales y permisos comprobados en el servidor.",
            ),
        };
        format!(
            "{}<p class=\"bajada\">Tu trabajo en un solo lugar, fuera del chat.</p>{pestanas}{cuerpo}",
            self.h1("Tu panel")
        )
    }

    fn panel_personal(&self) -> String {
        let creaciones: usize = self.convs.iter().map(|c| c.creaciones.len()).sum();
        let decisiones: usize = self.convs.iter().map(|c| c.decisiones.len()).sum();
        let abiertas: Vec<&Conversacion> =
            self.convs.iter().filter(|c| c.pendiente.is_some()).collect();

        let continuar = match self.convs.last() {
            Some(c) => {
                let resumen = retomar(c);
                let quedaste = resumen
                    .quedaste_en
                    .map(|t| format!("<p>Quedaste en: {}</p>", esc(&t)))
                    .unwrap_or_default();
                format!(
                    "<section class=\"bloque destacado\" aria-labelledby=\"t-continuar\">\
                     <h2 id=\"t-continuar\">Continuar donde quedaste</h2>\
                     <h3>{titulo}</h3>{quedaste}\
                     <a class=\"boton\" href=\"{}\" aria-label=\"Continuar: {titulo}\">Continuar</a></section>",
                    ruta_hilo(c),
                    titulo = esc(&c.titulo),
                )
            }
            None => String::new(),
        };

        let cifra = |n: usize, nombre: &str| format!("<li><b>{n}</b><span>{nombre}</span></li>");
        let cifras = format!(
            "<ul class=\"cifras\" aria-label=\"Resumen\">{}{}{}{}</ul>",
            cifra(self.convs.len(), "conversaciones"),
            cifra(creaciones, "creaciones"),
            cifra(decisiones, "decisiones guardadas"),
            cifra(abiertas.len(), "preguntas de Timo sin responder"),
        );

        let mut preguntas = String::new();
        for c in &abiertas {
            let pregunta = c.mensajes.last().map(|m| m.texto.as_str()).unwrap_or("");
            preguntas.push_str(&format!(
                "<li><div><b>{}</b><span>{}</span></div><a class=\"boton suave\" href=\"{}\">Responder</a></li>",
                esc(&c.titulo),
                esc(pregunta),
                ruta_hilo(c),
            ));
        }
        let preguntas = if preguntas.is_empty() {
            String::new()
        } else {
            format!(
                "<section class=\"bloque\" aria-labelledby=\"t-preguntas\"><h2 id=\"t-preguntas\">Timo espera tu respuesta</h2>\
                 <ul class=\"filas\">{preguntas}</ul></section>"
            )
        };

        let mut proyectos = String::new();
        for proyecto in self.proyectos() {
            let mut filas = String::new();
            for c in self.convs.iter().filter(|c| c.proyecto.as_deref() == Some(proyecto)) {
                filas.push_str(&format!(
                    "<li><div><b>{}</b><span>{}</span></div><a class=\"boton suave\" href=\"{}\">Abrir conversación</a></li>",
                    esc(&c.titulo),
                    contar(c.creaciones.len()),
                    ruta_hilo(c),
                ));
            }
            proyectos.push_str(&format!(
                "<h3>{}{}</h3><ul class=\"filas\">{filas}</ul>",
                ic("carpeta"),
                esc(proyecto)
            ));
        }
        let proyectos = if proyectos.is_empty() {
            String::new()
        } else {
            format!(
                "<section class=\"bloque\" aria-labelledby=\"t-proyectos\"><h2 id=\"t-proyectos\">Proyectos</h2>{proyectos}</section>"
            )
        };

        format!(
            "{continuar}{cifras}{preguntas}{proyectos}\
             <section class=\"bloque\" aria-labelledby=\"t-creaciones\"><h2 id=\"t-creaciones\">Creaciones</h2>{}</section>\
             <p class=\"pequeno\">Energía, tareas y avisos aún no aparecen: dependen de cuentas y servicios que esta vista previa no usa.</p>",
            self.lista_creaciones(),
        )
    }

    fn biblioteca(&self) -> String {
        format!(
            "{}<p class=\"bajada\">Todo lo que Timo ha creado contigo, con su última versión.</p>{}",
            self.h1("Biblioteca"),
            self.lista_creaciones(),
        )
    }

    fn lista_creaciones(&self) -> String {
        let mut filas = String::new();
        for conv in self.convs.iter().rev() {
            for c in &conv.creaciones {
                filas.push_str(&fila_creacion(conv, c));
            }
        }
        if filas.is_empty() {
            return vacio(
                "creacion",
                "Aún no hay creaciones",
                "Cuando Timo prepare una presentación, un documento u otro resultado, aparecerá aquí.",
            );
        }
        format!("<ul class=\"filas\">{filas}</ul>")
    }

    fn buscar(&self) -> String {
        let consulta = normalizar(&self.busqueda);
        let mut filas = String::new();
        let mut total = 0;
        if consulta.chars().count() >= 2 {
            for conv in self.convs.iter().rev() {
                let en_titulo = normalizar(&conv.titulo).contains(&consulta);
                let mensaje =
                    conv.mensajes.iter().find(|m| normalizar(&m.texto).contains(&consulta));
                if en_titulo || mensaje.is_some() {
                    total += 1;
                    let pista = match mensaje {
                        Some(m) => m.texto.chars().take(120).collect::<String>(),
                        None => detalle_llano(conv),
                    };
                    filas.push_str(&format!(
                        "<li><div><b>{}</b><span>{}</span></div><a class=\"boton suave\" href=\"{}\">Abrir conversación</a></li>",
                        esc(&conv.titulo),
                        esc(&pista),
                        ruta_hilo(conv),
                    ));
                }
                for c in &conv.creaciones {
                    let texto = normalizar(&format!("{} {}", c.titulo, c.tipo));
                    if texto.contains(&consulta) {
                        total += 1;
                        filas.push_str(&fila_creacion(conv, c));
                    }
                }
            }
        }
        let resultado = if consulta.is_empty() {
            "<p class=\"bajada\" role=\"status\">Escribe una palabra y pulsa Buscar. Por ejemplo: «menú».</p>".to_string()
        } else if consulta.chars().count() < 2 {
            "<p class=\"bajada\" role=\"status\">Escribe al menos dos letras.</p>".to_string()
        } else if total == 0 {
            format!(
                "<p class=\"bajada\" role=\"status\">No encontré nada con «{}». Prueba con otra palabra.</p>",
                esc(&self.busqueda)
            )
        } else {
            let cuantos = if total == 1 { "1 resultado".to_string() } else { format!("{total} resultados") };
            format!(
                "<p class=\"bajada\" role=\"status\">{cuantos} para «{}».</p><ul class=\"filas\">{filas}</ul>",
                esc(&self.busqueda)
            )
        };
        format!(
            "{}<form class=\"busqueda\" data-form=\"buscar\" role=\"search\">\
             <label for=\"texto\">Buscar en tus conversaciones y creaciones</label>\
             <div><input id=\"texto\" name=\"texto\" type=\"search\" value=\"{}\" autocomplete=\"off\" maxlength=\"80\">\
             <button type=\"submit\">{}<span>Buscar</span></button></div></form>{resultado}",
            self.h1("Buscar"),
            esc(&self.busqueda),
            ic("buscar"),
        )
    }

    fn no_encontrada(&self) -> String {
        format!(
            "{}<p class=\"bajada\">Esa dirección no existe en esta vista previa, o la conversación ya no está guardada en este navegador.</p>\
             <p><a class=\"boton\" href=\"#/\">Ir a Timo</a></p>",
            self.h1("No encontré esa página")
        )
    }

    /// Nombres de proyecto presentes en los datos, sin repetir y en orden de aparición.
    fn proyectos(&self) -> Vec<&str> {
        let mut nombres: Vec<&str> = Vec::new();
        for p in self.convs.iter().filter_map(|c| c.proyecto.as_deref()) {
            if !nombres.contains(&p) {
                nombres.push(p);
            }
        }
        nombres
    }
}

fn panel_creacion(conv: &Conversacion, v: &Vista) -> String {
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
         <div class=\"creacion-barra\"><span>{icono}Creación · {tipo} · versión {n}</span>\
         <a class=\"boton suave\" href=\"{volver}\" data-cerrar data-foco>{flecha}<span>Volver al chat</span></a></div>\
         <article class=\"lamina {tinta}\"><p class=\"tipo\">{tipo}</p>\
         <h2 id=\"t-creacion\">{titulo}</h2><p class=\"nota\">{nota}</p>\
         <span class=\"franja\" aria-hidden=\"true\"></span></article>\
         <h3>Lo que ya decidiste</h3><ul class=\"lista\">{decisiones}</ul>\
         <h3>Versiones</h3><ul class=\"lista\">{versiones}</ul>\
         <p class=\"pequeno\">Lámina de muestra: esta vista previa no genera el contenido de la creación.</p>\
         </aside>",
        icono = ic("creacion"),
        flecha = ic("volver"),
        volver = ruta_hilo(conv),
        tipo = esc(&v.tipo),
        n = v.version,
        titulo = esc(&v.titulo),
        nota = esc(&v.nota),
        tinta = tinta(conv),
    )
}

fn fila_creacion(conv: &Conversacion, c: &Creacion) -> String {
    format!(
        "<li><div><b>{titulo}</b><span>{tipo} · versión {} · en «{}»</span></div>\
         <a class=\"boton suave\" href=\"{}\" aria-label=\"Abrir creación: {titulo}\">Abrir creación</a></li>",
        c.ultima().numero,
        esc(&conv.titulo),
        ruta_creacion(conv, &c.id),
        titulo = esc(&c.titulo),
        tipo = esc(&mayuscula(&c.tipo)),
    )
}

fn vista_de(c: &Creacion) -> Vista {
    let ultima = c.ultima();
    Vista {
        creacion: c.id.clone(),
        titulo: c.titulo.clone(),
        tipo: c.tipo.clone(),
        version: ultima.numero,
        nota: ultima.nota.clone(),
    }
}

fn vacio(icono: &str, titulo: &str, texto: &str) -> String {
    format!(
        "<section class=\"vacio\">{}<h2>{titulo}</h2><p>{texto}</p></section>",
        ic(icono)
    )
}

fn enlace(ruta: &str, icono: &str, texto: &str, actual: bool) -> String {
    let actual = if actual { " aria-current=\"page\"" } else { "" };
    format!("<li><a href=\"{ruta}\"{actual}>{}<span>{texto}</span></a></li>", ic(icono))
}

fn ruta_hilo(conv: &Conversacion) -> String {
    format!("#/c/{}", esc(&conv.id))
}

fn ruta_creacion(conv: &Conversacion, creacion: &str) -> String {
    format!("#/c/{}/creacion/{}", esc(&conv.id), esc(creacion))
}

/// Iconos propios de LUTIM: trazo redondo de una tinta y, en algunos, un punto
/// de luz ámbar (la «luz sobre el horizonte» de la identidad).
fn ic(nombre: &str) -> String {
    let (trazo, luz) = match nombre {
        "timo" => ("M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4V16A2.5 2.5 0 0 1 4 13.5z", Some((12.0, 10.0))),
        "panel" => ("M4.5 14a7.5 7.5 0 0 1 15 0M3 18h18", Some((12.0, 14.0))),
        "biblioteca" => ("M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 9h6M9 12.5h3", Some((15.0, 16.0))),
        "creacion" => ("M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5zM14 3.5v4h4", Some((11.5, 14.0))),
        "buscar" => ("M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM16 16l4 4", None),
        "mas" => ("M12 5v14M5 12h14", None),
        "carpeta" => ("M3.5 7A1.5 1.5 0 0 1 5 5.5h4l2 2h8A1.5 1.5 0 0 1 20.5 9v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 17z", None),
        "menu" => ("M4 7h16M4 12h16M4 17h10", None),
        "cerrar" => ("M6 6l12 12M18 6L6 18", None),
        "enviar" => ("M12 19V6M6.5 11.5L12 6l5.5 5.5", None),
        "volver" => ("M19 12H5M11 6l-6 6 6 6", None),
        "tema" => ("M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 4v16M12 8.5l3.6-1.6M12 13l6-2.6M12 17.5l4.4-1.9", None),
        "reiniciar" => ("M5 12a7 7 0 1 0 2.2-5.1M5 5v4h4", None),
        "persona" => ("M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 19.5a7 7 0 0 1 14 0", None),
        "equipo" => ("M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3.5 19a5.5 5.5 0 0 1 11 0M16 5.2a3 3 0 0 1 0 5.6M17.5 14a5.5 5.5 0 0 1 3 5", None),
        "escudo" => ("M12 3.5l7 2.5v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z", Some((12.0, 11.5))),
        "mando" => ("M4 8h10M18 8h2M4 16h2M10 16h10M16 6v4M8 14v4", None),
        "memoria" => ("M6 5h12v14l-6-3.5L6 19z", None),
        "ayuda" => ("M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.8 9.5a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.7M12 16.5h.01", None),
        "ajustes" => ("M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4", None),
        _ => ("M12 12h.01", None),
    };
    let luz = match luz {
        Some((x, y)) => format!("<circle class=\"luz\" cx=\"{x}\" cy=\"{y}\" r=\"1.6\"/>"),
        None => String::new(),
    };
    format!(
        "<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"{trazo}\"/>{luz}</svg>"
    )
}

/// Frases que el intérprete simulado sabe leer, según el momento de la conversación.
fn sugerencias(conv: &Conversacion) -> Vec<String> {
    match &conv.pendiente {
        Some(Pendiente::CualCreacion) => conv
            .creaciones
            .iter()
            .map(|c| con_articulo(&c.tipo, true))
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

/// «la presentación», «el menú»; con mayúscula inicial si se pide.
fn con_articulo(palabra: &str, mayuscula: bool) -> String {
    let femenina = palabra.ends_with('a') || palabra.ends_with("ión");
    let articulo = match (femenina, mayuscula) {
        (true, true) => "La",
        (true, false) => "la",
        (false, true) => "El",
        (false, false) => "el",
    };
    format!("{articulo} {palabra}")
}

fn mayuscula(texto: &str) -> String {
    let mut letras = texto.chars();
    match letras.next() {
        Some(primera) => primera.to_uppercase().chain(letras).collect(),
        None => String::new(),
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

fn detalle_llano(c: &Conversacion) -> String {
    match &c.proyecto {
        Some(p) => format!("Proyecto {p} · {}", contar(c.creaciones.len())),
        None => contar(c.creaciones.len()),
    }
}

fn detalle(c: &Conversacion) -> String {
    esc(&detalle_llano(c))
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
