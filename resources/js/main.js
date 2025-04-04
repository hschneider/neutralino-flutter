
function onWindowClose() {
    Neutralino.app.exit();
}

// Init Neutralino
//
Neutralino.init();
Neutralino.events.on("windowClose", onWindowClose);

// Set title
//
(async () => {
    await Neutralino.window.setTitle(`Neutralino FlutterWASM ${NL_APPVERSION}`);
    await Neutralino.window.show();
})();

