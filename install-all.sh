#!/bin/bash
echo "=============================================="
echo "Instalando dependencias del proyecto..."
echo "=============================================="

# Instalar dependencias de la raíz
echo ""
echo "📦 Instalando dependencias raíz..."
npm install

# Instalar dependencias del backend
echo ""
echo "📦 Instalando dependencias backend..."
cd backend
npm install
cd ..

# Instalar dependencias del frontend
echo ""
echo "📦 Instalando dependencias frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ ¡Instalación completada!"
echo ""
echo "Próximo paso:"
echo "  npm run dev          (para desarrollo)"
echo "  npm run dist:mac     (para empaquetar a .app)"
echo ""
