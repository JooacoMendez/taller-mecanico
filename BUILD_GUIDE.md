# 🚀 Guía de Compilación y Distribución - Taller Mecánico Electron

## ✅ Cambios realizados para que funcione correctamente

1. **electron/main.js** - Arreglado para terminar correctamente el backend al cerrar la app
2. **frontend/src/api/client.js** - Configurado para usar URLs absolutas con `http://localhost:3001`
3. **backend/index.js** - Inicializa automáticamente la base de datos al arrancar
4. **electron/assets/** - Carpeta creada con icono

## 🔧 Pasos para compilar el .exe

### 1. Instalar todas las dependencias (IMPORTANTE)

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Compilar el Frontend (OBLIGATORIO)

```bash
npm run build:frontend
```

Este paso genera los archivos compilados en `frontend/dist/` que necesita el .exe.

### 3. Compilar el .exe para Windows

```bash
npm run dist:win
```

Esto generará:
- `dist/Taller Mecánico Setup 1.0.0.exe` (instalador)
- `dist/Taller Mecánico 1.0.0.exe` (ejecutable portable)

### 4. Ejecutar la aplicación compilada

Simplemente haz doble clic en `dist/Taller Mecánico 1.0.0.exe`

## ⚡ Scripts rápidos de compilación

### Script automático (Windows)

Crea un archivo `build.bat` en la raíz del proyecto:

```batch
@echo off
echo Building Taller Mecánico...
echo.
echo 1. Building frontend...
cd frontend
npm run build
cd ..
echo.
echo 2. Building Electron app...
npm run dist:win
echo.
echo ✅ Construcción completada! 
echo Los archivos están en dist/
pause
```

Luego ejecuta: `build.bat`

## 🐛 Si algo falla

### Verificar que está todo instalado correctamente

```bash
# Verifica que npm está en el PATH
npm --version

# Verifica que node_modules está en todos lados
node backend/index.js      # Debe decir "Servidor corriendo en http://localhost:3001"
```

### Error: "No se puede abrir el .exe"

1. Asegúrate de haberexecutado: `npm run build:frontend`
2. Verifica que `frontend/dist/index.html` existe
3. Compila nuevamente: `npm run dist:win`

### Error: "No se puede conectar a la base de datos"

La base de datos se crea automáticamente al ejecutarse. Si sigue fallando:

```bash
cd backend
npm run migrate
```

## 🎯 Cómo funciona ahora

1. **Electron abre** → Levanta el backend automáticamente en puerto 3001
2. **Backend inicia** → Crea la base de datos SQLite si no existe
3. **Frontend carga** → Se conecta a la API en http://localhost:3001
4. **Dashboard aparece** → Todo funcional

## 📝 Notas importantes

- El proceso del backend se termina automáticamente al cerrar la app
- La base de datos se guarda en `backend/src/db/database.sqlite`
- El frontend en producción se carga desde `frontend/dist/`
- Las variables de entorno se cargan desde `backend/.env`

## 🚀 Próximas mejoras (opcional)

- [ ] Agregar icono real en `electron/assets/icon.png`
- [ ] Cambiar certificado de firma en `package.json` build.win.certificateFile
- [ ] Configurar actualizaciones automáticas
- [ ] Agregar splash screen

