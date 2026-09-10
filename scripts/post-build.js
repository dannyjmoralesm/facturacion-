import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const docsDir = path.resolve(rootDir, 'docs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFileSafe(src, dest) {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('[Post-Build] Iniciando sincronización de artefactos para producción y GitHub Pages...');

// 1. Inyectar marcador de compilación en dist/index.html
const distIndexPath = path.join(distDir, 'index.html');
if (fs.existsSync(distIndexPath)) {
  let html = fs.readFileSync(distIndexPath, 'utf-8');
  if (!html.includes('window.__IS_DIST_BUILD__ = true')) {
    html = html.replace('<head>', '<head>\n    <script>window.__IS_DIST_BUILD__ = true;</script>');
    fs.writeFileSync(distIndexPath, html, 'utf-8');
    console.log('[Post-Build] Marcador window.__IS_DIST_BUILD__ = true inyectado con éxito en dist/index.html');
  }
}

// 2. Crear 404.html en dist si no existe
const dist404Path = path.join(distDir, '404.html');
if (!fs.existsSync(dist404Path) && fs.existsSync(distIndexPath)) {
  fs.copyFileSync(distIndexPath, dist404Path);
}

// 3. Crear archivos .nojekyll para GitHub Pages
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '', 'utf-8');

// 4. Copiar dist completo a docs/
ensureDir(docsDir);
copyDirRecursive(distDir, docsDir);
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf-8');
console.log('[Post-Build] Artefactos copiados a docs/ para GitHub Pages');

// 5. Copiar manifest y recursos PWA a la raíz del repositorio para evitar 404 si GitHub Pages se ejecuta desde / (root)
const rootSyncFiles = [
  'manifest.webmanifest',
  '404.html',
  'favicon.ico',
  'icon.svg',
  'apple-touch-icon.png',
  'pwa-192x192.png',
  'pwa-512x512.png',
  'pwa-maskable-512x512.png'
];

for (const file of rootSyncFiles) {
  const fromDist = path.join(distDir, file);
  const fromPublic = path.join(rootDir, 'public', file);
  const toRoot = path.join(rootDir, file);
  
  if (fs.existsSync(fromDist)) {
    copyFileSafe(fromDist, toRoot);
  } else if (fs.existsSync(fromPublic)) {
    copyFileSafe(fromPublic, toRoot);
  }
}
console.log('[Post-Build] Recursos PWA y manifest sincronizados en raíz para compatibilidad.');
