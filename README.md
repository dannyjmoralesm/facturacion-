# NegoFact POS - Sistema Bimoneda Venezuela (USD / VES)

Sistema Integral de Punto de Venta (POS), Facturación, Control de Inventario bimoneda, Libreta de Fiados (Cuentas por Cobrar), Módulo de Finanzas (Cuentas por Pagar & Gastos), Auditoría con IA Gemini e Impresión de Tickets Térmicos.

---

## 🚀 ¿Por qué se veía la pantalla en blanco en GitHub Pages y cómo se solucionó?

### Causa raíz
Por defecto, Vite compila los archivos JavaScript y CSS utilizando rutas absolutas en la raíz (`/assets/...`). Al desplegar en **GitHub Pages**, el sitio se ubica en un subdirectorio con el nombre de tu repositorio:
`https://tu-usuario.github.io/tu-repositorio/`

El navegador intentaba buscar los scripts en `https://tu-usuario.github.io/assets/...` en lugar de `https://tu-usuario.github.io/tu-repositorio/assets/...`, recibiendo un error **404 Not Found**, lo que dejaba la pantalla totalmente en blanco.

### Solución aplicada
1. **Rutas Relativas en Vite (`base: './'`)**: Se configuró `vite.config.ts` con `base: './'` para que todos los archivos generados se enlacen de forma relativa. Ahora funciona en GitHub Pages, subdirectorios, dominios propios o servidores locales sin inconvenientes.
2. **Error Boundary de Respaldo**: Se añadió un componente `ErrorBoundary` para que si ocurre algún error imprevisto de almacenamiento en el navegador, muestre un mensaje explicativo y un botón de reinicio en lugar de una pantalla blanca.
3. **Redirección SPA (`404.html`)**: Se incorporó el archivo de redirección para evitar errores 404 al recargar rutas en GitHub Pages.
4. **Flujo Automatizado de Despliegue (`.github/workflows/deploy.yml`)**: Un flujo de GitHub Actions que compila y publica automáticamente la aplicación en GitHub Pages cada vez que subes cambios a tu rama principal.

---

## ⚙️ Pasos para ver la aplicación funcionando en GitHub Pages

Tienes **2 opciones** para visualizar la aplicación sin pantalla en blanco:

### Opción 1: Publicar desde la carpeta `/docs` (¡La más rápida y directa!)
Esta opción no requiere esperar flujos de Actions ni configurar permisos especiales:
1. En tu repositorio de GitHub, haz clic en la pestaña **Settings** (Configuración).
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En **Build and deployment** > **Source**, selecciona: **"Deploy from a branch"**.
4. En **Branch**:
   - Selecciona tu rama: **`main`** (o `master`).
   - En el selector de carpeta al lado de la rama, cambia de `/ (root)` a: **`/docs`** 👈 *(¡Muy importante! No dejes la raíz `/` porque la raíz contiene código sin compilar).*
5. Haz clic en **Save** (Guardar).
6. En 1 minuto tu página estará en línea en `https://tu-usuario.github.io/tu-repositorio/` funcionando perfectamente.

### Opción 2: Usar GitHub Actions Automatizado
1. En **Settings** > **Pages** > **Source**, selecciona: **GitHub Actions**.
2. GitHub ejecutará automáticamente el archivo `.github/workflows/deploy.yml` que compilará y desplegará la versión de producción en cada push.

> ⚠️ **Importante**: Si acabas de recibir estos cambios en AI Studio, asegúrate de **Exportar/Sincronizar el repositorio a GitHub** desde el menú de la esquina superior para que la nueva carpeta `/docs/` y las correcciones se suban a tu cuenta de GitHub.

---

## 💻 Ejecución en Entorno Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build

# 4. Iniciar en modo producción
npm start
```

---

## 📱 Instalación como App Móvil o de Escritorio (PWA)
NegoFact cuenta con soporte **PWA (Progressive Web App)**:
- En **Google Chrome / Edge (PC)**: Haz clic en el ícono de instalación en la barra de direcciones o en el botón "Instalar App" del sistema.
- En **Android**: Abre el enlace en Google Chrome, pulsa los tres puntos del menú y selecciona "Instalar aplicación" o "Agregar a la pantalla de inicio".
