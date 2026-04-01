const { app, BrowserWindow, Menu, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

// ─────────────────────────────────────────────────────────────────
// LOG DE EMERGENCIA - Escribir antes de que pase cualquier cosa
// ─────────────────────────────────────────────────────────────────

// Try to create log file in dist directory (para debugging cuando está compilado)
const LOG_DIR = __dirname;
const LOG_FILE = path.join(LOG_DIR, "app-debug.log");

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}`;
    console.log(logLine);
    try {
        fs.appendFileSync(LOG_FILE, logLine + "\n");
    } catch (e) {
        // Si falla, try escribir en temp
        try {
            const tempLog = path.join(require("os").tmpdir(), "taller-mecanico-debug.log");
            fs.appendFileSync(tempLog, logLine + "\n");
        } catch (e2) {
            console.error("CRITICAL: Cannot write logs anywhere");
        }
    }
}

// Immediate log
writeLog("═══════════════════════════════════════════════════════════");
writeLog("🎯 TALLER MECÁNICO - INICIANDO APP");
writeLog("═══════════════════════════════════════════════════════════");
writeLog(`📊 __dirname: ${__dirname}`);
writeLog(`📍 app.isPackaged (al inicio): ${app.isPackaged}`);

// ─────────────────────────────────────────────────────────────────
// CONFIGURACIÓN INICIAL
// ─────────────────────────────────────────────────────────────────

// Detectar si está en desarrollo o producción
const isDev = !app.isPackaged || process.env.NODE_ENV === "development";

// ─────────────────────────────────────────────────────────────────
// RUTAS Y ESTRUCTURA
// ─────────────────────────────────────────────────────────────────

// En producción, usar app.getAppPath() que da la ruta raíz de la aplicación
// En desarrollo, usar __dirname/../.. para llegar a la raíz
const getAppRoot = () => {
    if (app.isPackaged) {
        // En producción: la app está empaquetada en resources/app
        // app.getAppPath() = /resources/app
        return app.getAppPath();
    } else {
        // En desarrollo: __dirname = proyecto/electron
        return path.join(__dirname, "..");
    }
};

const rootPath = getAppRoot();
const backendPath = path.join(rootPath, "backend");
const backendIndexPath = path.join(backendPath, "index.js");
const frontendDistPath = path.join(rootPath, "frontend", "dist", "index.html");
const backendEnvPath = path.join(backendPath, ".env");

writeLog(`📁 === PATHS ===`);
writeLog(`🏠 rootPath: ${rootPath}`);
writeLog(`💼 backendPath: ${backendPath}`);
writeLog(`📝 backendIndexPath: ${backendIndexPath}`);
writeLog(`📄 frontendDistPath: ${frontendDistPath}`);
writeLog(`⚙️  backendEnvPath: ${backendEnvPath}`);
writeLog(`✅ Backend exists: ${fs.existsSync(backendIndexPath)}`);
writeLog(`✅ Frontend exists: ${fs.existsSync(frontendDistPath)}`);
writeLog(`✅ .env exists: ${fs.existsSync(backendEnvPath)}`);

// Importar y configurar dotenv ANTES de usar las rutas
require("dotenv").config({
    path: backendEnvPath,
});

let mainWindow;
let backendProcess;

// ─────────────────────────────────────────────────────────────────
// BACKEND SERVER
// ─────────────────────────────────────────────────────────────────

function startBackendServer() {
    return new Promise((resolve, reject) => {
        try {
            writeLog(`🔧 === INICIANDO BACKEND ===`);
            writeLog(`📍 Verificando: ${backendIndexPath}`);
            
            if (!fs.existsSync(backendIndexPath)) {
                const err = `❌ Backend NO encontrado en: ${backendIndexPath}`;
                writeLog(err);
                throw new Error(err);
            }

            writeLog(`✅ Backend encontrado`);

            // Usar node directo (debe estar en PATH del sistema)
            const command = "node";
            const args = [backendIndexPath];

            writeLog(`🚀 Ejecutando: ${command} ${args.join(" ")}`);
            writeLog(`📂 Working directory: ${backendPath}`);

            backendProcess = spawn(command, args, {
                cwd: backendPath,
                stdio: ["ignore", "pipe", "pipe"], // Capturar outputs para logging
                env: {
                    ...process.env,
                    NODE_ENV: isDev ? "development" : "production",
                    SQLITE_PATH: path.join(backendPath, "src", "db", "database.sqlite"),
                },
            });

            if (!backendProcess) {
                throw new Error("No se pudo crear el proceso backend");
            }

            writeLog(`✅ Backend process creado (PID: ${backendProcess.pid})`);

            // Capturar output del backend
            if (backendProcess.stdout) {
                backendProcess.stdout.on("data", (data) => {
                    writeLog(`[BACKEND] ${data.toString().trim()}`);
                });
            }
            if (backendProcess.stderr) {
                backendProcess.stderr.on("data", (data) => {
                    writeLog(`[BACKEND ERROR] ${data.toString().trim()}`);
                });
            }

            backendProcess.on("error", (err) => {
                writeLog(`💥 Error spawning backend: ${err.message}`);
                reject(err);
            });

            backendProcess.on("exit", (code, signal) => {
                writeLog(`⚠️ Backend exited: code=${code}, signal=${signal}`);
            });

            // Esperar a que el servidor esté listo
            setTimeout(() => {
                writeLog(`✅ Backend debería estar listo ahora`);
                resolve();
            }, 3000);
        } catch (err) {
            writeLog(`💥 Error en startBackendServer: ${err.message}`);
            reject(err);
        }
    });
}

// Función para terminar el proceso del backend
function killBackendServer() {
    if (backendProcess) {
        writeLog("🛑 Terminando proceso backend...");
        try {
            backendProcess.kill("SIGTERM");
            // Esperar un poco y luego SIGKILL si es necesario
            setTimeout(() => {
                if (backendProcess) {
                    backendProcess.kill("SIGKILL");
                }
            }, 2000);
        } catch (err) {
            writeLog(`Error al terminar backend: ${err.message}`);
        }
        backendProcess = null;
    }
}

// ─────────────────────────────────────────────────────────────────
// VENTANA PRINCIPAL
// ─────────────────────────────────────────────────────────────────

function createWindow() {
    writeLog("📺 Creando ventana principal...");
    
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
        // icon: path.join(__dirname, "assets", "icon.svg"),
        show: false, // No mostrar hasta que esté listo
    });

    // En desarrollo, cargar desde Vite dev server
    // En producción, cargar desde archivos estáticos
    const startUrl = isDev
        ? "http://localhost:5173"
        : `file://${frontendDistPath}`;

    writeLog(`📡 Cargando URL: ${startUrl}`);

    mainWindow.loadURL(startUrl).then(() => {
        writeLog("✅ URL cargada correctamente");
        mainWindow.show();
    }).catch((err) => {
        writeLog(`❌ Error cargando URL: ${err.message}`);
        // Mostrar error dialog
        dialog.showErrorBox(
            "Error al cargar la aplicación",
            `No se pudo cargar desde:\n${startUrl}\n\nError: ${err.message}`
        );
        killBackendServer();
        app.quit();
    });

    if (isDev) {
        writeLog("🔧 DevTools abierto en modo desarrollo");
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("closed", () => {
        writeLog("🔔 Ventana cerrada");
        mainWindow = null;
        killBackendServer();
    });

    mainWindow.webContents.on("crashed", () => {
        writeLog("❌ El renderer process ha crasheado");
        dialog.showErrorBox(
            "Error",
            "La aplicación encontró un error. Se cerrará."
        );
        app.quit();
    });
}

// Crear menú
function createMenu() {
    const template = [
        {
            label: "Archivo",
            submenu: [
                {
                    label: "Salir",
                    accelerator: "CmdOrCtrl+Q",
                    click: () => {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: "Ver",
            submenu: [
                {
                    label: "Recargar",
                    accelerator: "CmdOrCtrl+R",
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.reloadIgnoringCache();
                        }
                    },
                },
                {
                    label: "DevTools",
                    accelerator: "CmdOrCtrl+Shift+I",
                    click: () => {
                        if (mainWindow) mainWindow.webContents.toggleDevTools();
                    },
                },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ─────────────────────────────────────────────────────────────────
// CICLO DE VIDA DE ELECTRON
// ─────────────────────────────────────────────────────────────────

// Listener para cuando la aplicación está lista
app.on("ready", async () => {
    try {
        writeLog("✅ ======= APP READY ======= ");
        await startBackendServer();
        createWindow();
        createMenu();
        writeLog("✅ 🎉 Aplicación completamente lista");
    } catch (err) {
        writeLog(`❌ Error fatal al iniciar: ${err.message}`);
        writeLog(err.stack);
        killBackendServer();
        // Mostrar dialogo de error
        dialog.showErrorBox(
            "Error al iniciar",
            `No se pudo iniciar la aplicación:\n\n${err.message}\n\nVer logs en: ${LOG_FILE}`
        );
        app.quit();
    }
});

// Listener para cuando se intenta cerrar la aplicación
app.on("will-quit", () => {
    writeLog("👋 ======= APP QUITTING ======= ");
    killBackendServer();
});

// Cuando se cierran todas las ventanas
app.on("window-all-closed", () => {
    writeLog("📭 Todas las ventanas cerradas");
    // En macOS, las apps generalmente permanecen activas hasta que el usuario salga explícitamente
    if (process.platform !== "darwin") {
        writeLog("💻 No es macOS, quitting app");
        app.quit();
    }
});

// Cuando la app se activa (ej: hacer clic en el dock)
app.on("activate", () => {
    writeLog("🔄 App activada");
    if (mainWindow === null) {
        createWindow();
    }
});

// Limpiar procesos al salir definitivamente
app.on("before-quit", () => {
    writeLog("🧹 Limpiando procesos...");
    killBackendServer();
});

// Error handlers
process.on("uncaughtException", (err) => {
    writeLog(`💥 UNCAUGHT EXCEPTION: ${err.message}`);
    writeLog(err.stack);
});

writeLog("✅ Electron app inicializado correctamente (listeners registrados)");
