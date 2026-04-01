# Taller Mecánico - Electron Desktop App

Sistema de gestión de taller mecánico empaquetado como aplicación de escritorio con Electron.

## Requisitos

- Node.js v16+
- npm o yarn

## Instalación y Desarrollo

### 1. Instalar dependencias del proyecto

```bash
npm install
```

También instala dependencias de backend y frontend:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto levanta:

- **Backend** (Express): http://localhost:3001
- **Frontend** (Vite): http://localhost:5173
- **Electron**: Ventana de escritorio

## Empaquetar para Producción

### Windows (.exe)

```bash
npm run dist:win
```

Genera:

- **Instalador NSIS** (`dist/Taller Mecánico Setup 1.0.0.exe`)
- **Portable** (`dist/Taller Mecánico 1.0.0.exe`)

### macOS

```bash
npm run dist:mac
```

### Linux

```bash
npm run dist:linux
```

## Estructura del Proyecto

```
taller-mecanico/
├── electron/
│   ├── main.js                 # Proceso principal de Electron
│   ├── preload.js              # Scripts de seguridad
│   └── assets/                 # Iconos y recursos
├── backend/
│   ├── src/
│   │   ├── db/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   ├── .env                    # Variables de entorno
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── App.jsx
│   ├── dist/                   # Build compilado
│   └── package.json
└── package.json                # Raíz del proyecto
```

## Cómo Funciona

1. **Electron levanta el backend** automáticamente al abrir la app
2. **Backend corre en puerto 3001** y sirve la API REST
3. **Frontend (React) en dist/** se carga en la ventana
4. **El usuario abre el .exe** y ve el dashboard funcional

## Notas importantes

- `database.sqlite` se crea en `backend/src/db/` la primera vez
- El .env del backend se carga automáticamente desde `backend/.env`
- En producción, el servidor Express se levanta con Node (no nodemon)
- No olvides compilar el frontend (`npm run build:frontend`) antes de empaquetar

## Solución de Problemas

### "Cannot find module electron-is-dev"

```bash
npm install electron-is-dev
```

### El backend no se levanta

- Verifica que el puerto 3001 esté disponible
- Revisa que `backend/.env` tenga `SQLITE_PATH=./src/db/database.sqlite`

### El frontend no carga

- En desarrollo: espera a que Vite esté listo en http://localhost:5173
- En producción: asegúrate de haber ejecutado `npm run build:frontend`

## Licencia

MIT
