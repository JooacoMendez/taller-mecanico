const { contextBridge } = require("electron");

// Exponer APIs seguras al contexto de la ventana
contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,
    version: require("electron").app.getVersion(),
});
