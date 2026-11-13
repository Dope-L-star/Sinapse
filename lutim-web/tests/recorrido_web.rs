//! Pruebas nativas de la interfaz web. No usan navegador, red ni modelo de IA.

use lutim_web::{App, Pantalla, Tema, VistaPanel, esc};

fn app_en(ruta: &str) -> App {
    let mut app = App::nueva("");
    app.evento(&format!("ruta\t{ruta}"));
    app
}

fn app_en_cafeteria() -> App {
    app_en("#/c/cafeteria")
}

/// El contenido de la zona principal, sin barra lateral ni navegación.
fn principal(html: &str) -> &str {
    let inicio = html.find("<main").expect("hay zona principal");
    let fin = html.find("</main>").expect("la zona principal se cierra");
    &html[inicio..fin]
}

// ── Aviso de simulación ──

#[test]
fn todas_las_pantallas_avisan_que_la_interpretacion_es_simulada() {
    for ruta in ["#/", "#/c/cafeteria", "#/panel", "#/panel/equipo", "#/biblioteca", "#/buscar", "#/nada"] {
        let html = app_en(ruta).html();
        assert!(html.contains("interpretación simulada"), "falta el aviso en {ruta}");
        assert!(html.contains("sin modelo de IA"), "falta el aviso en {ruta}");
    }
    let mut app = app_en_cafeteria();
    app.evento("enviar\tAbre la presentación");
    assert!(app.html().contains("lectura simulada"));
}

// ── Barra lateral e iconos ──

#[test]
fn la_barra_lateral_tiene_la_estructura_acordada() {
    let html = App::nueva("").html();
    let lateral = &html[html.find("<aside class=\"lateral\"").unwrap()..html.find("</aside>").unwrap()];
    let orden = ["Nueva conversación", "Buscar", "Tu panel", "Biblioteca", "Fijados", "Recientes", "Invitado"];
    let mut desde = 0;
    for nombre in orden {
        let pos = lateral[desde..].find(nombre).unwrap_or_else(|| panic!("falta «{nombre}» o está fuera de orden"));
        desde += pos;
    }
    assert!(lateral.contains("viewBox=\"1250 690 1870 1870\""), "falta el símbolo oficial");
    assert!(lateral.contains("href=\"#/c/cafeteria\""));
    assert!(lateral.contains("href=\"#/c/historia\""));
    assert!(lateral.contains("Casa Calma"));
}

#[test]
fn lo_que_aun_no_existe_no_es_un_enlace() {
    let html = App::nueva("").html();
    for nombre in ["Espacios", "Seletim", "Memoria Lutim", "Ajustes"] {
        assert!(html.contains(&format!("<span>{nombre}</span><small>Pronto</small>")));
        assert!(!html.contains(&format!("<span>{nombre}</span></a>")));
    }
}

#[test]
fn la_pagina_actual_se_marca_en_la_navegacion() {
    let html = app_en("#/panel").html();
    assert!(html.contains("<a href=\"#/panel\" aria-current=\"page\">"));
    assert!(!html.contains("<a href=\"#/biblioteca\" aria-current=\"page\">"));
    let html = app_en_cafeteria().html();
    assert!(html.contains("<a href=\"#/c/cafeteria\" aria-current=\"page\">"));
}

#[test]
fn los_iconos_son_decorativos_y_los_botones_de_icono_tienen_nombre() {
    let html = app_en_cafeteria().html();
    assert!(html.matches("<svg class=\"ic\"").count() >= 12);
    assert_eq!(
        html.matches("<svg class=\"ic\"").count(),
        html.matches("<svg class=\"ic\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"").count()
    );
    for nombre in ["aria-label=\"Menú\"", "aria-label=\"Reiniciar la muestra\"", "aria-label=\"Enviar\""] {
        assert!(html.contains(nombre), "falta {nombre}");
    }
}

// ── Rutas ──

#[test]
fn cada_pantalla_tiene_su_ruta_y_su_titulo() {
    let casos = [
        ("#/", Pantalla::Inicio, "Timo · LUTIM"),
        ("", Pantalla::Inicio, "Timo · LUTIM"),
        ("#/panel", Pantalla::Panel(VistaPanel::Personal), "Tu panel · LUTIM"),
        ("#/panel/equipo", Pantalla::Panel(VistaPanel::Equipo), "Tu panel · LUTIM"),
        ("#/panel/administracion", Pantalla::Panel(VistaPanel::Administracion), "Tu panel · LUTIM"),
        ("#/biblioteca", Pantalla::Biblioteca, "Biblioteca · LUTIM"),
        ("#/buscar", Pantalla::Buscar, "Buscar · LUTIM"),
    ];
    for (ruta, pantalla, titulo) in casos {
        let app = app_en(ruta);
        assert_eq!(app.pantalla(), pantalla, "{ruta}");
        assert_eq!(app.ruta(), if ruta.is_empty() { "#/" } else { ruta });
        assert!(app.titulo().starts_with(titulo), "{ruta}: {}", app.titulo());
        assert!(app.html().contains(&format!("data-ruta=\"{}\"", app.ruta())));
    }
    assert!(matches!(app_en_cafeteria().pantalla(), Pantalla::Hilo(_)));
    assert_eq!(app_en_cafeteria().ruta(), "#/c/cafeteria");
}

#[test]
fn una_ruta_desconocida_lo_dice_y_ofrece_volver() {
    for ruta in ["#/nada", "#/c/no-existe", "#/c/cafeteria/creacion/no-existe", "#/panel/otra"] {
        let app = app_en(ruta);
        assert_eq!(app.pantalla(), Pantalla::NoEncontrada, "{ruta}");
        assert_eq!(app.ruta(), "");
        assert!(app.panel().is_none());
        let html = app.html();
        assert!(principal(&html).contains("No encontré esa página"));
        assert!(principal(&html).contains("href=\"#/\""));
    }
}

#[test]
fn llegar_por_ruta_enfoca_el_titulo() {
    let html = app_en("#/panel").html();
    assert!(principal(&html).contains("<h1 tabindex=\"-1\" data-foco>Tu panel</h1>"));
    assert_eq!(html.matches("data-foco").count(), 1);
}

// ── Chat: enviar, retomar y creaciones ──

#[test]
fn el_inicio_ofrece_retomar_las_conversaciones_de_muestra() {
    let html = App::nueva("").html();
    let zona = principal(&html);
    assert!(zona.contains("Identidad de una cafetería"));
    assert!(zona.contains("Resumen de historia"));
    assert_eq!(zona.matches(">Continuar</a>").count(), 2);
}

#[test]
fn retomar_muestra_donde_quedo_la_conversacion() {
    let html = app_en_cafeteria().html();
    let zona = principal(&html);
    assert!(zona.contains("Dónde quedaste"));
    assert!(zona.contains("Retomas «Identidad de una cafetería», del proyecto Casa Calma."));
    assert!(zona.contains("Ya decidido: título"));
}

#[test]
fn enviar_desde_el_inicio_crea_una_conversacion_con_su_ruta() {
    let mut app = App::nueva("");
    app.evento("enviar\tEscribe un saludo para mi cafetería");
    assert_eq!(app.conversaciones().len(), 3);
    assert_eq!(app.ruta(), "#/c/nueva-1");
    let html = app.html();
    assert!(principal(&html).contains("Entendido, empiezo con eso."));
    assert!(!principal(&html).contains("Dónde quedaste"));
    assert!(html.contains("<textarea id=\"texto\" name=\"texto\" rows=\"2\" placeholder=\"Escribe tu mensaje…\" data-foco>"));
}

#[test]
fn una_correccion_conserva_lo_decidido_y_se_ve_en_el_hilo() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota y conserva el título");
    let html = app.html();
    assert!(html.contains("Cambié el color a «terracota»"));
    assert!(html.contains("Lo demás sigue igual: título «Identidad de una cafetería»"));
    assert!(app.panel().is_none());
    assert_eq!(app.ruta(), "#/c/cafeteria");
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
    assert_eq!(app.ruta(), "#/c/cafeteria/creacion/presentacion");
    let html = app.html();
    assert!(html.contains("role=\"dialog\""));
    assert!(html.contains("href=\"#/c/cafeteria\" data-cerrar data-foco"));

    app.evento("ruta\t#/c/cafeteria");
    assert!(app.panel().is_none());
    assert!(matches!(app.pantalla(), Pantalla::Hilo(_)));
    assert!(principal(&app.html()).contains("Dónde quedaste"), "el resumen sigue al cerrar la creación");
}

#[test]
fn una_creacion_se_abre_por_su_ruta_sin_escribir_en_el_chat() {
    let mut app = app_en("#/c/cafeteria/creacion/menu");
    let mensajes = app.conversaciones().iter().find(|c| c.id == "cafeteria").unwrap().mensajes.len();
    assert_eq!(app.panel().unwrap().titulo, "Menú de temporada");
    assert_eq!(app.ruta(), "#/c/cafeteria/creacion/menu");
    assert!(app.html().contains("Creación · menú · versión 1"));
    app.evento("cerrar-panel");
    assert!(app.panel().is_none());
    let despues = app.conversaciones().iter().find(|c| c.id == "cafeteria").unwrap().mensajes.len();
    assert_eq!(mensajes, despues);
}

#[test]
fn la_conversacion_enlaza_sus_creaciones() {
    let html = app_en_cafeteria().html();
    let zona = principal(&html);
    assert!(zona.contains("href=\"#/c/cafeteria/creacion/presentacion\""));
    assert!(zona.contains("<span>Abrir la presentación</span>"));
    assert!(zona.contains("<span>Abrir el menú</span>"));
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

// ── Tu panel, Biblioteca y Buscar ──

#[test]
fn tu_panel_es_una_pagina_propia_con_datos_de_las_conversaciones() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tAbre la creación");
    app.evento("ruta\t#/panel");
    let html = app.html();
    let zona = principal(&html);
    assert!(!zona.contains("id=\"mensajes\""), "el panel no es el chat");
    assert!(!zona.contains("<textarea"));
    assert!(zona.contains("Continuar donde quedaste"));
    assert!(zona.contains("<li><b>2</b><span>conversaciones</span></li>"));
    assert!(zona.contains("<li><b>3</b><span>creaciones</span></li>"));
    assert!(zona.contains("<li><b>4</b><span>decisiones guardadas</span></li>"));
    assert!(zona.contains("<li><b>1</b><span>preguntas de Timo sin responder</span></li>"));
    assert!(zona.contains("Timo espera tu respuesta"));
    assert!(zona.contains("Casa Calma"));
    assert!(zona.contains("href=\"#/c/historia/creacion/resumen\""));
    assert!(zona.contains("<a href=\"#/panel\" aria-current=\"page\">"));
}

#[test]
fn equipo_y_administracion_dicen_que_aun_no_estan_disponibles() {
    let html = app_en("#/panel/equipo").html();
    let zona = principal(&html);
    assert!(zona.contains("Todavía no hay equipo"));
    assert!(zona.contains("<a href=\"#/panel/equipo\" aria-current=\"page\">"));
    assert!(!zona.contains("class=\"filas\""), "sin filas inventadas");
    let html = app_en("#/panel/administracion").html();
    assert!(principal(&html).contains("Administración no disponible"));
}

#[test]
fn la_biblioteca_lista_todas_las_creaciones() {
    let html = app_en("#/biblioteca").html();
    let zona = principal(&html);
    assert_eq!(zona.matches(">Abrir creación</a>").count(), 3);
    assert!(zona.contains("Presentación · versión 2 · en «Identidad de una cafetería»"));
    assert!(zona.contains("href=\"#/c/cafeteria/creacion/menu\""));
}

#[test]
fn buscar_encuentra_conversaciones_y_creaciones_sin_importar_tildes() {
    let mut app = App::nueva("");
    app.evento("buscar\tMENU");
    assert_eq!(app.pantalla(), Pantalla::Buscar);
    let html = app.html();
    let zona = principal(&html);
    assert!(zona.contains("1 resultado para «MENU»."));
    assert!(zona.contains("Menú de temporada"));
    assert!(zona.contains("value=\"MENU\""));

    app.evento("buscar\tcapítulo");
    assert!(principal(&app.html()).contains("2 resultados"));
    app.evento("buscar\tzzz");
    assert!(principal(&app.html()).contains("No encontré nada con «zzz»"));
    app.evento("buscar\ta");
    assert!(principal(&app.html()).contains("Escribe al menos dos letras."));
    app.evento("buscar\t");
    assert!(principal(&app.html()).contains("Escribe una palabra y pulsa Buscar"));
}

// ── Menú del celular y apariencia ──

#[test]
fn el_menu_del_celular_se_abre_y_se_cierra_al_navegar() {
    let mut app = App::nueva("");
    assert!(app.html().contains("aria-controls=\"lateral\" aria-expanded=\"false\""));
    app.evento("menu");
    let html = app.html();
    assert!(html.contains("class=\"lx menu-abierto\""));
    assert!(html.contains("class=\"velo\""));
    assert!(html.contains("aria-expanded=\"true\""));
    app.evento("ruta\t#/biblioteca");
    assert!(!app.html().contains("menu-abierto"));
}

#[test]
fn la_apariencia_cambia_entre_sistema_claro_y_oscuro_y_se_guarda() {
    let mut app = App::nueva("");
    assert_eq!(app.tema(), Tema::Sistema);
    assert!(app.html().contains("data-tema=\"sistema\""));
    app.evento("tema");
    assert_eq!(app.tema(), Tema::Claro);
    assert!(app.html().contains("data-tema=\"claro\""));
    assert!(app.html().contains("Apariencia: Claro. Cambiar"));
    let otra = App::nueva(&app.guardado());
    assert_eq!(otra.tema(), Tema::Claro);
    app.evento("tema");
    app.evento("tema");
    assert_eq!(app.tema(), Tema::Sistema);
}

// ── Guardado ──

#[test]
fn lo_guardado_permite_retomar_tras_recargar() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota");
    app.evento("enviar\tAbre la creación");
    let guardado = app.guardado();

    let mut otra = App::nueva(&guardado);
    assert_eq!(otra.pantalla(), Pantalla::Inicio);
    assert_eq!(otra.conversaciones(), app.conversaciones());
    otra.evento("ruta\t#/c/cafeteria");
    let html = otra.html();
    assert!(html.contains("color «terracota»"));
    assert!(html.contains("Timo espera tu respuesta a su última pregunta."));
    otra.evento("enviar\tEl menú");
    assert_eq!(otra.panel().unwrap().titulo, "Menú de temporada");
}

#[test]
fn un_guardado_de_la_version_anterior_sin_tema_se_sigue_leyendo() {
    let mut app = app_en_cafeteria();
    app.evento("enviar\tCambia el color a terracota");
    let guardado = app.guardado();
    let sin_tema = guardado.split_once("\n===\n").unwrap().1;
    let otra = App::nueva(sin_tema);
    assert_eq!(otra.conversaciones(), app.conversaciones());
    assert_eq!(otra.tema(), Tema::Sistema);
}

#[test]
fn un_guardado_danado_vuelve_a_la_muestra_y_reiniciar_conserva_la_apariencia() {
    assert_eq!(App::nueva("basura\tsin formato").conversaciones().len(), 2);
    assert_eq!(App::nueva("#tema\toscuro").tema(), Tema::Oscuro);
    let mut app = App::nueva("");
    app.evento("tema");
    app.evento("enviar\tHola");
    assert_eq!(app.conversaciones().len(), 3);
    app.evento("reiniciar");
    assert_eq!(app.conversaciones().len(), 2);
    assert_eq!(app.pantalla(), Pantalla::Inicio);
    assert_eq!(app.tema(), Tema::Claro);
}

// ── Seguridad del texto y eventos raros ──

#[test]
fn el_texto_de_la_persona_no_se_interpreta_como_html() {
    let mut app = App::nueva("");
    app.evento("enviar\t<img src=x onerror=alert(1)> \"hola\"");
    let html = app.html();
    assert!(!html.contains("<img"));
    assert!(html.contains("&lt;img src=x onerror=alert(1)&gt; &quot;hola&quot;"));
    app.evento("buscar\t\"><script>alert(1)</script>");
    assert!(!app.html().contains("<script>"));
    assert_eq!(esc("a&b'c"), "a&amp;b&#39;c");
}

#[test]
fn eventos_vacios_o_desconocidos_no_cambian_nada() {
    let mut app = app_en_cafeteria();
    let mensajes = app.conversaciones()[1].mensajes.len();
    app.evento("enviar\t   ");
    app.evento("otro");
    app.evento("cerrar-panel");
    assert_eq!(app.conversaciones().len(), 2);
    assert_eq!(app.conversaciones()[1].mensajes.len(), mensajes);
    assert!(matches!(app.pantalla(), Pantalla::Hilo(_)));
}
