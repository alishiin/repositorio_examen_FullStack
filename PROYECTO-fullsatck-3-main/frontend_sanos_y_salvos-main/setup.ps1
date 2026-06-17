# ============================================
# Setup Script para Windows (PowerShell)
# ============================================
# Este script instala todas las dependencias
# del proyecto Sanos y Salvos (Frontend + BFF)
# ============================================

Write-Host "🚀 Sanos y Salvos - Setup Completo" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js y npm
Write-Host "📋 Verificando requisitos..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado" -ForegroundColor Red
    Write-Host "   Descárgalo en: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm no está instalado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Crear archivos .env
Write-Host "📝 Configurando archivos .env..." -ForegroundColor Yellow

if (-Not (Test-Path ".\.env")) {
    if (Test-Path ".\.env.example") {
        Copy-Item ".\.env.example" ".\.env"
        Write-Host "✅ Creado: .env (frontend)" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Saltando: .env ya existe" -ForegroundColor Cyan
}

if (-Not (Test-Path ".\backend\.env")) {
    if (Test-Path ".\backend\.env.example") {
        Copy-Item ".\backend\.env.example" ".\backend\.env"
        Write-Host "✅ Creado: backend/.env" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️  Saltando: backend/.env ya existe" -ForegroundColor Cyan
}

Write-Host ""

# 3. Instalar dependencias del Backend
Write-Host "📦 Instalando dependencias del Backend..." -ForegroundColor Yellow
Push-Location "backend"

if (Test-Path ".\node_modules") {
    Write-Host "⏭️  Backend node_modules ya existe, actualizando..." -ForegroundColor Cyan
} else {
    Write-Host "   Descargando paquetes..." -ForegroundColor Yellow
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias del backend" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✅ Dependencias del backend instaladas" -ForegroundColor Green
Pop-Location

Write-Host ""

# 4. Instalar dependencias del Frontend
Write-Host "📦 Instalando dependencias del Frontend..." -ForegroundColor Yellow

if (Test-Path ".\node_modules") {
    Write-Host "⏭️  Frontend node_modules ya existe, actualizando..." -ForegroundColor Cyan
} else {
    Write-Host "   Descargando paquetes..." -ForegroundColor Yellow
}

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al instalar dependencias del frontend" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencias del frontend instaladas" -ForegroundColor Green

Write-Host ""

# 5. Información final
Write-Host "✨ Setup completado exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Próximos pasos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Para ejecutar ambos servidores (Recomendado - 2 terminales):" -ForegroundColor White
Write-Host "   Terminal 1:" -ForegroundColor Gray
Write-Host "      cd backend && npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "   Terminal 2:" -ForegroundColor Gray
Write-Host "      npm run dev" -ForegroundColor Green
Write-Host ""
Write-Host "   O ejecutar con script:" -ForegroundColor White
Write-Host "      npm run dev:all" -ForegroundColor Green
Write-Host ""
Write-Host "📱 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Health:    http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host ""
