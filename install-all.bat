@echo off
echo ==============================================
echo Instalando dependencias del proyecto...
echo ==============================================

REM Instalar dependencias de la raíz
echo.
echo 📦 Instalando dependencias raíz...
call npm install

REM Instalar dependencias del backend
echo.
echo 📦 Instalando dependencias backend...
cd backend
call npm install
cd ..

REM Instalar dependencias del frontend
echo.
echo 📦 Instalando dependencias frontend...
cd frontend
call npm install
cd ..

echo.
echo ✅ ¡Instalación completada!
echo.
echo Próximo paso:
echo   npm run dev          (para desarrollo)
echo   npm run dist:win     (para empaquetar a .exe)
echo.
pause
