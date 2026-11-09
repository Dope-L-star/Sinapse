package main

// Todo texto visible va en español e inglés: se elige por el idioma de Windows.
type textos struct {
	codigo, titulo, preguntaInstalar, instalado, yaInstalado, errInstalar,
	preguntaDesinstalar, desinstalado, errDesinstalar, sinNavegador,
	descAtajo, actualizado string
}

var es = textos{
	codigo:              "es",
	titulo:              "SymphorIA · Obertura",
	preguntaInstalar:    "¿Instalo SymphorIA en este equipo?\n\n• Crea un acceso directo en el escritorio y en Inicio.\n• Se abre como app, en su propia ventana.\n• Se actualiza sola y no pide permisos de administrador.\n• Gratis. La quitas cuando quieras desde Configuración › Aplicaciones.",
	instalado:           "¡Listo! SymphorIA quedó instalada. Ya se está abriendo.",
	yaInstalado:         "SymphorIA ya estaba instalada: la dejé al día. Ya se está abriendo.",
	errInstalar:         "No pude instalar SymphorIA:\n\n",
	preguntaDesinstalar: "¿Quito SymphorIA de este equipo?\n\nSe borran la app y sus accesos directos. Tus chats siguen en tu cuenta.",
	desinstalado:        "SymphorIA se quitó de este equipo. ¡Gracias por probarla!",
	errDesinstalar:      "No pude quitar todo:\n\n",
	sinNavegador:        "No encontré Microsoft Edge ni Google Chrome, así que abro SymphorIA en tu navegador.",
	descAtajo:           "SymphorIA: un chat gratis con varias IAs a la vez",
	actualizado:         "SymphorIA se actualizó a la versión ",
}

var en = textos{
	codigo:              "en",
	titulo:              "SymphorIA · Overture",
	preguntaInstalar:    "Install SymphorIA on this computer?\n\n• Adds a shortcut to your desktop and Start menu.\n• Opens as an app, in its own window.\n• Updates itself and needs no administrator rights.\n• Free. Remove it anytime from Settings › Apps.",
	instalado:           "Done! SymphorIA is installed. It's opening now.",
	yaInstalado:         "SymphorIA was already installed: I brought it up to date. It's opening now.",
	errInstalar:         "I couldn't install SymphorIA:\n\n",
	preguntaDesinstalar: "Remove SymphorIA from this computer?\n\nThe app and its shortcuts are deleted. Your chats stay in your account.",
	desinstalado:        "SymphorIA was removed from this computer. Thanks for trying it!",
	errDesinstalar:      "I couldn't remove everything:\n\n",
	sinNavegador:        "I couldn't find Microsoft Edge or Google Chrome, so I'm opening SymphorIA in your browser.",
	descAtajo:           "SymphorIA: one free chat with several AIs at once",
	actualizado:         "SymphorIA was updated to version ",
}
