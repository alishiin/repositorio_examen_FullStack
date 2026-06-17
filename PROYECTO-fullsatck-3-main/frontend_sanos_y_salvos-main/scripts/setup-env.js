#!/usr/bin/env node

/**
 * Setup Script - Configurar proyecto completo
 * Este script configura automáticamente:
 * 1. Verifica Node.js y npm
 * 2. Crea archivos .env si no existen
 * 3. Instala dependencias
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🚀 Iniciando setup de Sanos y Salvos...\n');

// 1. Verificar Node.js
try {
  const nodeVersion = execSync('node --version').toString().trim();
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
  console.log(`✅ npm: ${npmVersion}\n`);
} catch (error) {
  console.error('❌ Node.js o npm no está instalado');
  process.exit(1);
}

// 2. Crear archivos .env
function createEnvFile(filePath, examplePath) {
  if (!fs.existsSync(filePath)) {
    if (fs.existsSync(examplePath)) {
      fs.copyFileSync(examplePath, filePath);
      console.log(`✅ Creado: ${path.relative(projectRoot, filePath)}`);
    }
  } else {
    console.log(`⏭️  Ya existe: ${path.relative(projectRoot, filePath)}`);
  }
}

const frontendEnv = path.join(projectRoot, '.env');
const frontendEnvExample = path.join(projectRoot, '.env.example');
const backendEnv = path.join(projectRoot, 'backend', '.env');
const backendEnvExample = path.join(projectRoot, 'backend', '.env.example');

console.log('📝 Configurando archivos .env:');
createEnvFile(frontendEnv, frontendEnvExample);
createEnvFile(backendEnv, backendEnvExample);
console.log();

// 3. Información de instalación
console.log('📦 Para instalar todas las dependencias, ejecuta:');
console.log();
console.log('   Windows:');
console.log('   .\\setup.ps1');
console.log();
console.log('   Mac/Linux:');
console.log('   bash setup.sh');
console.log();
console.log('   O manualmente:');
console.log('   npm run setup:all');
console.log();
console.log('✨ Setup completado!\n');
