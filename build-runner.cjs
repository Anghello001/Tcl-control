const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Comprobando dependencias de compilación...');

const tailwindPath = path.join(__dirname, 'node_modules', '@tailwindcss', 'vite');
const reactPluginPath = path.join(__dirname, 'node_modules', '@vitejs', 'plugin-react');
const viteBin = path.join(__dirname, 'node_modules', '.bin', 'vite');

if (!fs.existsSync(tailwindPath) || !fs.existsSync(reactPluginPath) || !fs.existsSync(viteBin)) {
  console.log('📦 node_modules no encontrado o incompleto. Instalando dependencias necesarias...');
  try {
    execSync('npm install --no-audit --prefer-offline || npm install --legacy-peer-deps', {
      stdio: 'inherit',
      cwd: __dirname
    });
  } catch (err) {
    console.warn('Aviso durante npm install:', err.message);
  }
}

console.log('🚀 Ejecutando Vite build...');
try {
  execSync('npx vite build || vite build', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✓ Compilación web completada con éxito.');
} catch (err) {
  console.error('Error durante vite build:', err.message);
  // Si dist ya existe, permitimos continuar
  if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    console.log('✓ Usando distribución pre-compilada existente en dist/.');
    process.exit(0);
  } else {
    process.exit(1);
  }
}
