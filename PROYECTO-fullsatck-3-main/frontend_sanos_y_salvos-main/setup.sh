#!/bin/bash

# ============================================
# Setup Script para Mac/Linux (Bash)
# ============================================
# Este script instala todas las dependencias
# del proyecto Sanos y Salvos (Frontend + BFF)
# ============================================

echo "🚀 Sanos y Salvos - Setup Completo"
echo "==================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 1. Verificar Node.js y npm
echo -e "${YELLOW}📋 Verificando requisitos...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo -e "${YELLOW}   Descárgalo en: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm no está instalado${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

echo ""

# 2. Crear archivos .env
echo -e "${YELLOW}📝 Configurando archivos .env...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Creado: .env (frontend)${NC}"
    fi
else
    echo -e "${CYAN}⏭️  Saltando: .env ya existe${NC}"
fi

if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Creado: backend/.env${NC}"
    fi
else
    echo -e "${CYAN}⏭️  Saltando: backend/.env ya existe${NC}"
fi

echo ""

# 3. Instalar dependencias del Backend
echo -e "${YELLOW}📦 Instalando dependencias del Backend...${NC}"

cd backend

if [ -d "node_modules" ]; then
    echo -e "${CYAN}⏭️  Backend node_modules ya existe, actualizando...${NC}"
else
    echo -e "${YELLOW}   Descargando paquetes...${NC}"
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias del backend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del backend instaladas${NC}"

cd ..

echo ""

# 4. Instalar dependencias del Frontend
echo -e "${YELLOW}📦 Instalando dependencias del Frontend...${NC}"

if [ -d "node_modules" ]; then
    echo -e "${CYAN}⏭️  Frontend node_modules ya existe, actualizando...${NC}"
else
    echo -e "${YELLOW}   Descargando paquetes...${NC}"
fi

npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al instalar dependencias del frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependencias del frontend instaladas${NC}"

echo ""

# 5. Información final
echo -e "${GREEN}✨ Setup completado exitosamente!${NC}"
echo ""
echo -e "${CYAN}🎯 Próximos pasos:${NC}"
echo ""
echo -e "${CYAN}   Para ejecutar ambos servidores (Recomendado - 2 terminales):${NC}"
echo -e "${CYAN}   Terminal 1:${NC}"
echo -e "${GREEN}      cd backend && npm run dev${NC}"
echo ""
echo -e "${CYAN}   Terminal 2:${NC}"
echo -e "${GREEN}      npm run dev${NC}"
echo ""
echo -e "${CYAN}   O ejecutar con script:${NC}"
echo -e "${GREEN}      npm run dev:all${NC}"
echo ""
echo -e "${CYAN}📱 URLs:${NC}"
echo -e "${CYAN}   Frontend:  http://localhost:5173${NC}"
echo -e "${CYAN}   Backend:   http://localhost:5000${NC}"
echo -e "${CYAN}   Health:    http://localhost:5000/api/health${NC}"
echo ""
