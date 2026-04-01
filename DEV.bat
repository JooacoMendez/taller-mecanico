@echo off
REM Script de desarrollo - Levanta todo en mode desarrollo
setlocal enabledelayedexpansion

cls
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         MODO DESARROLLO - Taller Mecánico                     ║
echo ║     Levantando Backend + Frontend + Electron                  ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo ℹ️  Asegúrate de tener inversas ejecutándose:
echo    - Backend (Puerto 3001)
echo    - Vite Dev Server (Puerto 5173)
echo    - Electron App
echo.
echo Para detener, presiona Ctrl+C en cada ventana
echo.

REM Ejecutar el comando npm run dev
npm run dev

pause
