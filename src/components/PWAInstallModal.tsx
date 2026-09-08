import React, { useState } from 'react';
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  CheckCircle2,
  Share,
  Sparkles,
  Zap,
  HardDrive,
  WifiOff,
  ExternalLink,
  X,
  HelpCircle,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, platform, promptInstall } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'windows' | 'android' | 'ios'>(
    platform === 'android' ? 'android' : platform === 'ios' ? 'ios' : 'windows'
  );
  const [installStatus, setInstallStatus] = useState<'idle' | 'success' | 'dismissed'>('idle');
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setInstallStatus('success');
    } else if (outcome === 'dismissed') {
      setInstallStatus('dismissed');
    }
  };

  const handleOpenFullWindow = () => {
    window.open(window.location.href, '_blank');
  };

  const handleDownloadLauncher = () => {
    const targetUrl = window.location.href;
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>NegoFact POS</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0f172a; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
    .loader { border: 4px solid #1e293b; border-top: 4px solid #10b981; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    a { color: #34d399; text-decoration: none; font-weight: bold; margin-top: 15px; display: inline-block; }
  </style>
  <script>
    window.location.replace("${targetUrl}");
  </script>
</head>
<body>
  <div class="loader"></div>
  <h2>Iniciando NegoFact POS...</h2>
  <p style="color: #94a3b8; font-size: 14px;">Redirigiendo a tu sistema de facturación y punto de venta.</p>
  <a href="${targetUrl}">Haz clic aquí si no abre automáticamente</a>
</body>
</html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NegoFact-POS.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Brand Gradient */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner">
              <img src="/icon.svg" alt="NegoFact Logo" className="w-8 h-8 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white">Instalar NegoFact App</h2>
                {isInstalled ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Instalada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    <Sparkles className="w-3.5 h-3.5" /> Web App (PWA)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Instalador oficial para <strong>Windows PC</strong> y <strong>Android Móvil/Tablet</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick 1-Click Action Bar if Browser Supports it */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          {isInstalled ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">¡NegoFact ya está instalada en este dispositivo!</p>
                <p className="text-xs text-emerald-700">Puedes abrirla desde el menú de inicio de Windows o tu pantalla de inicio en Android.</p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/15">
                  <Download className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div>
                  <p className="text-sm font-bold">Instalación Rápida en 1-Clic Disponible</p>
                  <p className="text-xs text-emerald-100">Compatible directamente con tu navegador actual.</p>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm hover:bg-emerald-50 active:scale-95 transition shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-700" />
                Instalar Ahora
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-100">Descarga e Instalación Directa</p>
                  <p className="text-xs text-slate-400">Descarga el acceso de escritorio o abre en el navegador nativo para instalar en 1 clic.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={handleDownloadLauncher}
                  className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Descarga un archivo directo para abrir la app desde tu PC"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Aplicativo (.html)</span>
                </button>
                {isInIframe && (
                  <button
                    type="button"
                    onClick={handleOpenFullWindow}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-600 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Abre en ventana completa para permitir al navegador mostrar el botón de instalación"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Abrir en Nueva Ventana</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-white border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span><strong>Cero Lag:</strong> Apertura instantánea sin recarga.</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <WifiOff className="w-4 h-4 text-emerald-500 shrink-0" />
            <span><strong>Modo Offline:</strong> Funciona sin Internet continuo.</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
            <HardDrive className="w-4 h-4 text-indigo-500 shrink-0" />
            <span><strong>Ligera:</strong> Pesa menos de 5MB sin consumir RAM.</span>
          </div>
        </div>

        {/* Tabs for OS Instructions */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-6">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'windows'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm -mb-[2px] rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4" />
            Windows / PC
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'android'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm -mb-[2px] rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Android Móvil / Tablet
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === 'ios'
                ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm -mb-[2px] rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-4 h-4" />
            iOS / Mac (Safari)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  Instalar como Aplicación de Escritorio en Windows (Chrome / Edge / Brave)
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">Windows 10 / 11</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">1</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Barra de Direcciones</h4>
                  <p className="text-[11px] text-slate-600">
                    En Google Chrome o Microsoft Edge, busca el ícono de <strong>Instalar</strong> (ícono de monitor con flecha o símbolo ⊕) a la derecha de la barra de URL.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">2</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Confirmar Instalación</h4>
                  <p className="text-[11px] text-slate-600">
                    Haz clic en <strong>"Instalar"</strong>. Se creará automáticamente un acceso directo en tu Escritorio y Menú Inicio.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">3</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Fijar a Barra de Tareas</h4>
                  <p className="text-[11px] text-slate-600">
                    Se abrirá como una ventana de escritorio nativa sin barras del navegador. Haz clic derecho en el ícono de la barra de tareas y elige <em>"Anclar a la barra de tareas"</em>.
                  </p>
                </div>
              </div>

              {/* Alternative Edge / Chrome Menu */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                <strong>¿No ves el botón de instalación?</strong> Haz clic en los tres puntos (⋮ o ⋯) de tu navegador en la esquina superior derecha &rarr; Selecciona <strong>"Guardar y compartir"</strong> o <strong>"Aplicaciones"</strong> &rarr; <strong>"Instalar NegoFact"</strong>.
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Instalar en Teléfonos y Tablets Android (Google Chrome / Brave)
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">Android 8.0+</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">1</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Menú del Navegador</h4>
                  <p className="text-[11px] text-slate-600">
                    Abre la app en Chrome en tu celular y pulsa el botón de <strong>tres puntos (⋮)</strong> en la esquina superior derecha.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">2</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Instalar Aplicación</h4>
                  <p className="text-[11px] text-slate-600">
                    Toca en <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">3</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Experiencia APK Nativa</h4>
                  <p className="text-[11px] text-slate-600">
                    NegoFact aparecerá en tu cajón de aplicaciones con su ícono y se ejecutará a pantalla completa como una app nativa.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <strong>Ideal para Mostrador & POS Móvil:</strong> En Android la aplicación funciona a pantalla completa, permitiendo usar lectores de código de barra, teclado numérico táctil y cálculo bimoneda sin interrupciones del navegador.
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-600" />
                  Instalar en iPhone / iPad (Safari)
                </h3>
                <span className="text-[11px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">iOS 14+</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">1</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Botón Compartir</h4>
                  <p className="text-[11px] text-slate-600">
                    Abre la aplicación en <strong>Safari</strong> y toca el ícono de <strong>Compartir</strong> (cuadrado con flecha hacia arriba) en la barra inferior.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">2</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Agregar a Inicio</h4>
                  <p className="text-[11px] text-slate-600">
                    Desplaza el menú hacia abajo y pulsa en <strong>"Agregar al inicio"</strong> (ícono de cuadro con signo +).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-2">3</div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Confirmar</h4>
                  <p className="text-[11px] text-slate-600">
                    Toca en <strong>"Agregar"</strong> en la esquina superior derecha. El ícono de NegoFact quedará listo en tu pantalla de inicio.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Actualizaciones automáticas y almacenamiento local seguro.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-semibold text-slate-800 transition"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
