@echo off
chcp 65001 >nul 2>nul
REM Script de compilacion automatica para Taller Mecanico
setlocal enabledelayedexpansion

cls
echo ================================================================
echo    COMPILADOR - Taller Mecanico Electron - Version 1.0.0
echo ================================================================
echo.

REM Verificar que npm esta instalado
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm no esta instalado o no esta en el PATH
    echo Descargalo desde: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] npm encontrado:
call npm --version
echo.

REM Paso 1: Instalar dependencias generales
echo [1/5] Instalando dependencias de la raiz...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error al instalar dependencias raiz
    pause
    exit /b 1
)
echo [OK] Dependencias raiz instaladas
echo.

REM Paso 2: Instalar dependencias del backend
echo [2/5] Instalando dependencias del backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error al instalar dependencias backend
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencias backend instaladas
echo.

REM Paso 3: Instalar dependencias del frontend
echo [3/5] Instalando dependencias del frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Error al instalar dependencias frontend
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencias frontend instaladas
echo.

REM Paso 4: Compilar el frontend
echo [4/5] Compilando frontend (Vite)...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Error al compilar frontend
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Frontend compilado correctamente
echo.

REM Paso 5: Compilar todo para Electron/Windows
echo [5/5] Empaquetando aplicacion Electron...
echo.
call npm run dist:win
if %errorlevel% neq 0 (
    echo [ERROR] Error al compilar la aplicacion Electron
    pause
    exit /b 1
)
echo.

echo ================================================================
echo    COMPILACION COMPLETADA
echo ================================================================
echo.
echo Archivo generado en: dist\TallerApp.exe
echo.
echo Para ejecutar: doble clic en dist\TallerApp.exe
echo.
pause
