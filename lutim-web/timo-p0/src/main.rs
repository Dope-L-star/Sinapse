//! Recorrido de muestra: enviar un mensaje, retomar la conversación y abrir su creación.
//! Ejecutar con `cargo run`.

use timo_p0::{InterpreteSimulado, Interprete, Paso, datos, enviar, guardado, retomar};

fn decir(conv: &mut timo_p0::Conversacion, interprete: &dyn Interprete, texto: &str) {
    println!("\nTú:   {texto}");
    let r = enviar(conv, interprete, texto);
    let marca = match r.paso {
        Paso::Hecho => "actúa",
        Paso::Pregunta => "pregunta",
        Paso::Abierta(_) => "abre",
    };
    println!("Timo: {}   [{marca}]", r.texto);
    if let Paso::Abierta(v) = r.paso {
        println!("      ┌ {} · {} · versión {}", v.titulo, v.tipo, v.version);
        println!("      └ {}", v.nota);
    }
}

fn main() {
    let interprete = InterpreteSimulado;
    println!("ENSAYO timo-p0 · SIMULACIÓN con datos ficticios");
    println!("Los mensajes los lee un {}, no un modelo de IA.", interprete.nombre());
    println!("Este recorrido prueba las reglas de Timo; no mide la comprensión de un modelo real.");

    println!("\n── 1. Enviar un mensaje ──");
    let mut conv = datos::cafeteria();
    decir(&mut conv, &interprete, "Cambia el color a terracota y conserva el título.");

    // Se guarda como texto y se vuelve a cargar, como si se cerrara y abriera la app.
    let guardada = guardado::guardar(&conv);
    drop(conv);

    println!("\n── 2. Retomar la conversación ──");
    let mut conv = guardado::cargar(&guardada).expect("la conversación guardada se puede leer");
    println!("{}", retomar(&conv).en_palabras());

    println!("\n── 3. Abrir su creación ──");
    decir(&mut conv, &interprete, "Abre la creación");
    decir(&mut conv, &interprete, "La presentación");

    println!("\n── Otros casos ──");
    decir(&mut conv, &interprete, "Abre el menú");
    decir(&mut conv, &interprete, "Cambia el tono");
    decir(&mut conv, &interprete, "decide tú");
    decir(&mut conv, &interprete, "Haz la portada más cálida y conserva el título");
}
