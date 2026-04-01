const { app, BrowserWindow, Menu, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ─────────────────────────────────────────────────────────────────
// SISTEMA DE LOGS
// ─────────────────────────────────────────────────────────────────

const LOG_FILE = path.join(os.tmpdir(), "taller-mecanico-debug.log");

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    try {
        fs.appendFileSync(LOG_FILE, logLine + "\n", "utf8");
    } catch (e) {
        console.error("Error escribiendo log:", e.message);
    }
}

writeLog("═══════════════════════════════════════════════════════════");
writeLog("🎯 TALLER MECÁNICO - INICIANDO APP");
writeLog("═══════════════════════════════════════════════════════════");

// ─────────────────────────────────────────────────────────────────
// DETECCIÓN DE MODO Y RUTAS
// ─────────────────────────────────────────────────────────────────

writeLog(`📊 Información inicial:`);
writeLog(`  __dirname: ${__dirname}`);
writeLog(`  process.argv[0]: ${process.argv[0]}`);
writeLog(`  process.cwd(): ${process.cwd()}`);

function getApplicationPaths() {
    let rootPath;
    let isDev;

    if (__dirname.includes("resources")) {
        rootPath = path.dirname(__dirname);
        isDev = false;
        writeLog(`📊 MODO: PRODUCCIÓN (detectado por 'resources' en __dirname)`);
    } else {
        rootPath = path.dirname(__dirname);
        isDev = true;
        writeLog(`📊 MODO: DESARROLLO (no encontrado 'resources')`);
    }

    const backendPath = path.join(rootPath, "backend");
    const backendIndexJs = path.join(backendPath, "index.js");
    const backendEnv = path.join(backendPath, ".env");
    const frontendDist = path.join(rootPath, "frontend", "dist", "index.html");

    writeLog(`📁 Rutas calculadas:`);
    writeLog(`  rootPath: ${rootPath}`);
    writeLog(`  backendPath: ${backendPath}`);
    writeLog(`  backendIndexJs: ${backendIndexJs}`);
    writeLog(`  frontendDist: ${frontendDist}`);

    writeLog(`✅ Verificación de archivos:`);
    writeLog(`  Backend exists: ${fs.existsSync(backendIndexJs)}`);
    writeLog(`  Frontend exists: ${fs.existsSync(frontendDist)}`);
    writeLog(`  .env exists: ${fs.existsSync(backendEnv)}`);

    if (!fs.existsSync(backendIndexJs)) {
        const error = `❌ CRITICAL: Backend not found at ${backendIndexJs}`;
        writeLog(error);
        throw new Error(error);
    }

    if (!fs.existsSync(frontendDist)) {
        const error = `❌ CRITICAL: Frontend not found at ${frontendDist}`;
        writeLog(error);
        throw new Error(error);
    }

    return {
        rootPath,
        backendPath,
        backendIndexJs,
        backendEnv,
        frontendDist,
        isDev,
    };
}

let PATHS;
try {
    PATHS = getApplicationPaths();
} catch (err) {
    writeLog(`💥 Error al detectar rutas: ${err.message}`);
    writeLog(err.stack);
    process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// CARGAR VARIABLES DE ENTORNO
// ─────────────────────────────────────────────────────────────────

require("dotenv").config({
    path: PATHS.backendEnv,
});

writeLog(`✅ Variables de entorno cargadas desde ${PATHS.backendEnv}`);

// ─────────────────────────────────────────────────────────────────
// CONFIGURAR ENTORNO PARA EL BACKEND
// ─────────────────────────────────────────────────────────────────

// Usar userData de Electron para la base de datos (funciona en portable)
const userDataPath = app.getPath("userData");
const dbDir = path.join(userDataPath, "data");
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const sqlitePath = path.join(dbDir, "database.sqlite");

// En desarrollo, usar la ruta local del backend
if (PATHS.isDev) {
    process.env.SQLITE_PATH = path.join(PATHS.backendPath, "src", "db", "database.sqlite");
} else {
    process.env.SQLITE_PATH = sqlitePath;
}

process.env.NODE_ENV = PATHS.isDev ? "development" : "production";
process.env.PORT = process.env.PORT || "3001";

writeLog(`📊 SQLITE_PATH: ${process.env.SQLITE_PATH}`);
writeLog(`📊 NODE_ENV: ${process.env.NODE_ENV}`);
writeLog(`📊 PORT: ${process.env.PORT}`);

// ─────────────────────────────────────────────────────────────────
// VARIABLES GLOBALES
// ─────────────────────────────────────────────────────────────────

let mainWindow;

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN: INICIAR BACKEND (dentro del mismo proceso)
// ─────────────────────────────────────────────────────────────────

function startBackendServer() {
    return new Promise((resolve, reject) => {
        try {
            writeLog(`🔧 === INICIANDO BACKEND (in-process) ===`);
            writeLog(`📍 Requiriendo: ${PATHS.backendIndexJs}`);

            // Require el backend directamente — se ejecuta en el mismo proceso
            // No necesitamos chdir porque el backend usa __dirname para sus rutas
            require(PATHS.backendIndexJs);

            writeLog(`✅ Backend requerido exitosamente`);

            // Esperar a que el server esté escuchando
            const PORT = process.env.PORT || 3001;
            const maxRetries = 30;
            let retries = 0;
            let resolved = false;

            function checkServer() {
                if (resolved) return;
                const http = require("http");
                const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
                    if (resolved) return;
                    if (res.statusCode === 200) {
                        resolved = true;
                        writeLog(`✅ Backend respondiendo en puerto ${PORT}`);
                        resolve();
                    } else {
                        retry();
                    }
                });
                req.on("error", () => {
                    if (!resolved) retry();
                });
                req.setTimeout(500, () => {
                    req.destroy();
                    if (!resolved) retry();
                });
            }

            function retry() {
                if (resolved) return;
                retries++;
                if (retries >= maxRetries) {
                    resolved = true;
                    writeLog(`⚠️ Backend no respondió tras ${maxRetries} intentos, continuando de todos modos...`);
                    resolve();
                } else {
                    setTimeout(checkServer, 500);
                }
            }

            // Lanzar el check inmediatamente sin esperar 1 segundo
            checkServer();

        } catch (err) {
            writeLog(`💥 Error en startBackendServer: ${err.message}`);
            writeLog(err.stack);
            reject(err);
        }
    });
}

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN: CREAR VENTANA PRINCIPAL
// ─────────────────────────────────────────────────────────────────

function createWindow() {
    writeLog(`📺 === CREANDO VENTANA PRINCIPAL ===`);

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
        },
        show: false,
    });

    // Abrir links externos (como el PDF) en el navegador por defecto del sistema
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            shell.openExternal(url);
        }
        return { action: "deny" };
    });

    const startUrl = PATHS.isDev
        ? "http://localhost:5173"
        : `file://${PATHS.frontendDist}`;

    writeLog(`📡 Cargando URL: ${startUrl}`);

    mainWindow.loadURL(startUrl)
        .then(() => {
            writeLog(`✅ URL cargada correctamente`);
            mainWindow.show();
            if (PATHS.isDev) {
                writeLog(`🔧 Abriendo DevTools`);
                mainWindow.webContents.openDevTools();
            }
        })
        .catch((err) => {
            writeLog(`❌ Error cargando URL: ${err.message}`);
            dialog.showErrorBox(
                "Error al cargar",
                `No se pudo cargar desde:\n${startUrl}\n\nError: ${err.message}\n\nLogs: ${LOG_FILE}`
            );
            app.quit();
        });

    mainWindow.on("closed", () => {
        writeLog(`🔔 Ventana cerrada`);
        mainWindow = null;
    });

    mainWindow.webContents.on("crashed", () => {
        writeLog(`💥 Renderer process crashed`);
        dialog.showErrorBox("Error", "La aplicación se cerró inesperadamente");
        app.quit();
    });
}

// ─────────────────────────────────────────────────────────────────
// FUNCIÓN: CREAR MENÚ
// ─────────────────────────────────────────────────────────────────

function createMenu() {
    // Si estamos en producción, quitar el menú por completo
    if (!PATHS.isDev) {
        Menu.setApplicationMenu(null);
        return;
    }

    const template = [
        {
            label: "Archivo",
            submenu: [
                {
                    label: "Salir",
                    accelerator: "CmdOrCtrl+Q",
                    click: () => app.quit(),
                },
            ],
        },
        {
            label: "Ver",
            submenu: [
                {
                    label: "Recargar",
                    accelerator: "CmdOrCtrl+R",
                    click: () => mainWindow?.webContents.reloadIgnoringCache(),
                },
                PATHS.isDev && {
                    label: "DevTools",
                    accelerator: "CmdOrCtrl+Shift+I",
                    click: () => mainWindow?.webContents.toggleDevTools(),
                },
            ].filter(Boolean),
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─────────────────────────────────────────────────────────────────
// CICLO DE VIDA DE ELECTRON
// ─────────────────────────────────────────────────────────────────

app.on("ready", async () => {
    try {
        writeLog(`✅ ======= APP READY =======`);
        await startBackendServer();
        createWindow();
        createMenu();
        writeLog(`✅ 🎉 Aplicación lista`);
    } catch (err) {
        writeLog(`💥 Error fatal: ${err.message}`);
        writeLog(err.stack);
        dialog.showErrorBox(
            "Error al iniciar",
            `Error: ${err.message}\n\nLogs en:\n${LOG_FILE}`
        );
        app.quit();
    }
});

app.on("will-quit", () => {
    writeLog(`👋 ======= APP WILL QUIT =======`);
});

app.on("window-all-closed", () => {
    writeLog(`📭 Todas las ventanas cerradas`);
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    writeLog(`🔄 App activada`);
    if (mainWindow === null) {
        createWindow();
    }
});

app.on("before-quit", () => {
    writeLog(`🧹 Limpiando...`);
});

process.on("uncaughtException", (err) => {
    writeLog(`💥 UNCAUGHT EXCEPTION: ${err.message}`);
    writeLog(err.stack);
});

writeLog(`✅ App listeners registrados`);
