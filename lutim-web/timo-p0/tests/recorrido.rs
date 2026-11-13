//! Pruebas del recorrido con datos ficticios. Ninguna usa red ni un modelo de IA.

use timo_p0::{
    Conversacion, Interprete, InterpreteSimulado, Lectura, Paso, Pendiente, datos, enviar,
    guardado, retomar,
};

const SIM: InterpreteSimulado = InterpreteSimulado;

fn preguntas(conv: &Conversacion) -> usize {
    conv.mensajes
        .iter()
        .filter(|m| m.autor == timo_p0::Autor::Timo && m.texto.starts_with('¿'))
        .count()
}

// ── Enviar un mensaje ──

#[test]
fn un_pedido_claro_se_atiende_sin_preguntas() {
    let mut conv = datos::cafeteria();
    let antes = conv.decisiones.clone();
    let r = enviar(&mut conv, &SIM, "Haz la portada más cálida y conserva el título");
    assert_eq!(r.paso, Paso::Hecho);
    assert_eq!(conv.decisiones, antes);
    assert_eq!(preguntas(&conv), 0);
    assert!(r.texto.contains("título «Identidad de una cafetería»"));
}

#[test]
fn el_mensaje_y_la_respuesta_quedan_en_la_conversacion() {
    let mut conv = datos::nueva("n1", "Conversación nueva");
    let r = enviar(&mut conv, &SIM, "Escribe un saludo para mi cafetería");
    assert_eq!(conv.mensajes.len(), 2);
    assert_eq!(conv.mensajes[0].texto, "Escribe un saludo para mi cafetería");
    assert_eq!(conv.mensajes[1].texto, r.texto);
}

#[test]
fn una_correccion_cambia_un_solo_dato_y_conserva_los_demas() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Cambia el color a terracota y conserva el título.");
    assert_eq!(r.paso, Paso::Hecho);
    assert_eq!(conv.decision("color"), Some("terracota"));
    assert_eq!(conv.decision("título"), Some("Identidad de una cafetería"));
    assert_eq!(conv.decision("tono"), Some("cercano"));
    assert_eq!(conv.decisiones.len(), 3);
    assert!(r.texto.contains("Lo demás sigue igual"));
}

#[test]
fn una_correccion_guarda_una_version_nueva_sin_borrar_la_anterior() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Cambia el color a terracota");
    let presentacion = conv.creacion("presentacion").unwrap();
    assert_eq!(presentacion.versiones.len(), 3);
    assert_eq!(presentacion.versiones[1].nota, "portada con el título aprobado");
    assert_eq!(presentacion.ultima().nota, "color: terracota");
    assert_eq!(conv.creacion("menu").unwrap().versiones.len(), 1);
}

#[test]
fn dos_correcciones_seguidas_no_deshacen_la_primera() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Cambia el color a terracota");
    enviar(&mut conv, &SIM, "Que el tono sea formal");
    assert_eq!(conv.decision("color"), Some("terracota"));
    assert_eq!(conv.decision("tono"), Some("formal"));
    assert_eq!(conv.decision("título"), Some("Identidad de una cafetería"));
}

#[test]
fn repetir_una_decision_no_crea_otra_version() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Cambia el color a ámbar");
    assert!(r.texto.contains("No cambié nada"));
    assert_eq!(conv.creacion("presentacion").unwrap().versiones.len(), 2);
}

// ── Preguntar solo por un dato decisivo ──

#[test]
fn si_falta_el_valor_hace_una_sola_pregunta_y_luego_lo_aplica() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Cambia el tono");
    assert_eq!(r.paso, Paso::Pregunta);
    assert_eq!(r.texto.matches('¿').count(), 1);
    assert_eq!(conv.decision("tono"), Some("cercano"));

    let r = enviar(&mut conv, &SIM, "Formal");
    assert_eq!(r.paso, Paso::Hecho);
    assert_eq!(conv.decision("tono"), Some("Formal"));
    assert_eq!(conv.decision("color"), Some("ámbar"));
    assert_eq!(conv.pendiente, None);
    assert_eq!(preguntas(&conv), 1);
}

#[test]
fn decide_tu_cierra_la_pregunta_y_dice_lo_que_supuso() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Abre la creación");
    let r = enviar(&mut conv, &SIM, "Timo, decide tú");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir una creación") };
    assert_eq!(vista.creacion, "presentacion");
    assert!(r.texto.contains("La elegí porque"));
    assert_eq!(conv.pendiente, None);
}

// ── Retomar una conversación ──

#[test]
fn guardar_y_cargar_devuelve_la_misma_conversacion() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Cambia el color a terracota");
    enviar(&mut conv, &SIM, "Abre la creación");
    let cargada = guardado::cargar(&guardado::guardar(&conv)).unwrap();
    assert_eq!(cargada, conv);
    assert_eq!(cargada.pendiente, Some(Pendiente::CualCreacion));
}

#[test]
fn retomar_muestra_donde_quedo_y_lo_ya_decidido() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Cambia el color a terracota");
    let cargada = guardado::cargar(&guardado::guardar(&conv)).unwrap();
    let resumen = retomar(&cargada);
    assert_eq!(resumen.quedaste_en.as_deref(), Some(r.texto.as_str()));
    assert_eq!(resumen.decisiones, conv.decisiones);
    assert!(!resumen.pregunta_abierta);
    let texto = resumen.en_palabras();
    assert!(texto.contains("Retomas «Identidad de una cafetería», del proyecto Casa Calma."));
    assert!(texto.contains("color «terracota»"));
    assert!(texto.contains("(versión 3)"));
}

#[test]
fn una_pregunta_abierta_sobrevive_al_guardado_y_se_puede_responder() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Abre la creación");
    let mut cargada = guardado::cargar(&guardado::guardar(&conv)).unwrap();
    assert!(retomar(&cargada).pregunta_abierta);
    let r = enviar(&mut cargada, &SIM, "El menú");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir el menú") };
    assert_eq!(vista.titulo, "Menú de temporada");
}

#[test]
fn un_guardado_danado_da_un_error_claro() {
    assert!(guardado::cargar("").is_err());
    assert!(guardado::cargar("D\tcolor\tazul").is_err());
    let error = guardado::cargar("C\ta\tb\t\t\nX\tdato").unwrap_err();
    assert!(error.contains("línea 2"));
}

// ── Abrir la creación ──

#[test]
fn con_una_sola_creacion_abre_sin_preguntar() {
    let mut conv = datos::historia();
    let r = enviar(&mut conv, &SIM, "Abre la creación");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir el documento") };
    assert_eq!(vista.titulo, "Capítulo 3 en una página");
    assert_eq!(preguntas(&conv), 0);
}

#[test]
fn con_dos_creaciones_pregunta_cual_y_la_respuesta_completa_el_pedido() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Abre la creación");
    assert_eq!(r.paso, Paso::Pregunta);
    assert!(r.texto.contains("presentación «Identidad de una cafetería»"));
    assert!(r.texto.contains("o el menú «Menú de temporada»"));

    let r = enviar(&mut conv, &SIM, "La presentación");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir la presentación") };
    assert_eq!((vista.tipo.as_str(), vista.version), ("presentación", 2));
    assert_eq!(preguntas(&conv), 1);
}

#[test]
fn si_el_mensaje_nombra_la_creacion_la_abre_directamente() {
    let mut conv = datos::cafeteria();
    let r = enviar(&mut conv, &SIM, "Abre el menú");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir el menú") };
    assert_eq!(vista.creacion, "menu");
    assert_eq!(conv.activa.as_deref(), Some("menu"));
}

#[test]
fn abrir_muestra_la_version_mas_reciente_tras_una_correccion() {
    let mut conv = datos::cafeteria();
    enviar(&mut conv, &SIM, "Cambia el color a terracota");
    let r = enviar(&mut conv, &SIM, "Abre la presentación");
    let Paso::Abierta(vista) = r.paso else { panic!("debía abrir la presentación") };
    assert_eq!((vista.version, vista.nota.as_str()), (3, "color: terracota"));
}

#[test]
fn sin_creaciones_lo_dice_en_vez_de_preguntar() {
    let mut conv = datos::nueva("n2", "Conversación nueva");
    let r = enviar(&mut conv, &SIM, "Abre la creación");
    assert_eq!(r.paso, Paso::Hecho);
    assert!(r.texto.contains("todavía no tiene creaciones"));
}

// ── Simulación frente a modelo real ──

/// Intérprete de prueba que devuelve una lectura fija, como haría la capa que
/// traduzca la salida de un modelo. Muestra que las reglas no dependen del simulado.
struct LecturaFija(Lectura);

impl Interprete for LecturaFija {
    fn nombre(&self) -> &str {
        "lectura fija de prueba"
    }
    fn es_simulacion(&self) -> bool {
        false
    }
    fn leer(&self, _: &str, _: &Conversacion) -> Lectura {
        self.0.clone()
    }
}

#[test]
fn la_respuesta_avisa_cuando_la_lectura_es_simulada() {
    let mut conv = datos::cafeteria();
    assert!(enviar(&mut conv, &SIM, "Abre el menú").simulada);
    let otro = LecturaFija(Lectura::Pedido);
    assert!(!enviar(&mut conv, &otro, "cualquier texto").simulada);
}

#[test]
fn las_reglas_valen_con_cualquier_interprete() {
    let mut conv = datos::cafeteria();
    let lectura = Lectura::Cambiar { tema: "color".into(), valor: Some("verde oliva".into()) };
    let r = enviar(&mut conv, &LecturaFija(lectura), "ponlo más natural, tipo oliva");
    assert_eq!(r.paso, Paso::Hecho);
    assert_eq!(conv.decision("color"), Some("verde oliva"));
    assert_eq!(conv.decision("tono"), Some("cercano"));

    let r = enviar(&mut conv, &LecturaFija(Lectura::AbrirCreacion { creacion: None }), "ábrela");
    assert_eq!(r.paso, Paso::Pregunta);
}

#[test]
fn el_simulado_no_confunde_conservar_con_cambiar() {
    let conv = datos::cafeteria();
    assert_eq!(SIM.leer("Conserva el título y el color", &conv), Lectura::Pedido);
    assert_eq!(
        SIM.leer("Cambia el título a «Casa Calma»", &conv),
        Lectura::Cambiar { tema: "título".into(), valor: Some("«Casa Calma»".into()) }
    );
    assert_eq!(SIM.leer("Explícame la paletada de cemento", &conv), Lectura::Pedido);
}
