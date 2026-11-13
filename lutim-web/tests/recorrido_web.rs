//! Pruebas nativas del recorrido web. No usan navegador, red ni modelo de IA.

use lutim_web::{App, Pantalla, esc};

fn app_en_cafeteria() -> App {
    let mut app = App::nueva("");
    app.evento("retomar\tcafeteria");
    app
}

#[test]
fn todas_las_pantallas_avisan_que_la_interpretacion_es_simulada() {
    let mut app = App::nueva("");
    assert!(app.html().contains("interpretación simulada"));
    app.evento("retomar\tcafeteria");
    assert!(app.html().contains("interpretación simulada"));
    app.evento("enviar\tAbre la presentación");
    assert!(app.html().contains("interpretación simulada"));
    assert!(app.html().contains("lectura simulada"));
}

#[test]
fn el_inicio_ofrece_retomar_las_conversaciones_de_muestra() {
    let html = App::nueva("").html();
    assert!(html.contains("Identidad de una cafetería"));
    assert!(html.contains("Resumen de historia"));
    assert_eq!(html.matches(">Continuar</button>").count(), 2);
}

#[test]
fn retomar_muestra_donde_quedo_la_conversacion() {
    let app = app_en_cafeteria();
    assert!(matches!(app.pantalla(), Pantalla::Hilo(_)));
    let html = app.html();
    assert!(html.contains("Dónde quedaste"));
    assert!(html.contains("Retomas «Identidad de una cafetería», del proyecto Casa Calma."));
    assert!(html.contains("Ya decidido: título"));
}

#[test]
fn enviar_desde_el_inicio_crea_una_conversacion_y_muestra_la_respuesta() {
    let mut app = App::nueva("");
    app.evento("enviar\tEscribe un saludo para mi cafetería");
    assert_eq!(app.conversaciones().len(), 3);
    let html = app.html();
    assert!(html.contains("Escribe un saludo para mi cafetería"));
    assert!(html.contains("Entendido, empiezo con eso."));
}

#[test]
fn una_correccion_conserva_lo_decidido_y_se_ve_en_el_hilo() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota y conserva el título");
    let html = app.html();
    assert!(html.contains("Cambié el color a «terracota»"));
    assert!(html.contains("Lo demás sigue igual: título «Identidad de una cafetería»"));
    assert!(app.panel().is_none());
}

#[test]
fn abrir_la_creacion_pregunta_una_vez_y_luego_abre_el_panel() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tAbre la creación");
    assert!(app.panel().is_none());
    let html = app.html();
    assert!(html.contains("Timo pregunta"));
    assert!(html.contains("data-val=\"La presentación\""));
    assert!(html.contains("data-val=\"El menú\""));

    app.evento("enviar\tLa presentación");
    let vista = app.panel().expect("el panel de la creación debía abrirse");
    assert_eq!((vista.tipo.as_str(), vista.version), ("presentación", 2));
    let html = app.html();
    assert!(html.contains("role=\"dialog\""));
    assert!(html.contains("Volver al chat"));

    app.evento("cerrar-panel");
    assert!(app.panel().is_none());
    assert!(matches!(app.pantalla(), Pantalla::Hilo(_)));
}

#[test]
fn la_creacion_abierta_refleja_la_correccion_anterior() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota");
    app.evento("enviar\tAbre la presentación");
    assert_eq!(app.panel().unwrap().version, 3);
    let html = app.html();
    assert!(html.contains("tinta-terracota"));
    assert!(html.contains("Versión 2 · portada con el título aprobado"));
}

#[test]
fn lo_guardado_permite_retomar_tras_recargar() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota");
    app.evento("enviar\tAbre la creación");
    let guardado = app.guardado();

    let mut otra = App::nueva(&guardado);
    assert_eq!(otra.pantalla(), Pantalla::Inicio);
    assert_eq!(otra.conversaciones(), app.conversaciones());
    otra.evento("retomar\tcafeteria");
    let html = otra.html();
    assert!(html.contains("color «terracota»"));
    assert!(html.contains("Timo espera tu respuesta a su última pregunta."));
    otra.evento("enviar\tEl menú");
    assert_eq!(otra.panel().unwrap().titulo, "Menú de temporada");
}

#[test]
fn un_guardado_danado_vuelve_a_la_muestra_y_reiniciar_tambien() {
    assert_eq!(App::nueva("basura\tsin formato").conversaciones().len(), 2);
    let mut app = App::nueva("");
    app.evento("enviar\tHola");
    assert_eq!(app.conversaciones().len(), 3);
    app.evento("reiniciar");
    assert_eq!(app.conversaciones().len(), 2);
    assert_eq!(app.pantalla(), Pantalla::Inicio);
}

#[test]
fn el_texto_de_la_persona_no_se_interpreta_como_html() {
    let mut app = App::nueva("");
    app.evento("enviar\t<img src=x onerror=alert(1)> \"hola\"");
    let html = app.html();
    assert!(!html.contains("<img"));
    assert!(html.contains("&lt;img src=x onerror=alert(1)&gt; &quot;hola&quot;"));
    assert_eq!(esc("a&b'c"), "a&amp;b&#39;c");
}

#[test]
fn eventos_vacios_o_desconocidos_no_cambian_nada() {
    let mut app = app_en_cafeteria();
    let antes = app.html();
    app.evento("enviar\t   ");
    app.evento("retomar\tno-existe");
    app.evento("otro");
    assert_eq!(app.conversaciones().len(), 2);
    assert_eq!(app.html().len(), antes.len() - " data-foco".len());
}
