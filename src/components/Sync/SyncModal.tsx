import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  UploadCloud, 
  DownloadCloud, 
  QrCode, 
  Copy, 
  Check, 
  X, 
  Database, 
  Activity, 
  Users,
  Info,
  Edit2
} from 'lucide-react';
import QRCode from 'qrcode';
import { realtimeSync, ConnectionStatus } from '../../services/realtimeSync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceSyncDownload: () => Promise<void>;
  onForceSyncUpload: () => Promise<void>;
  recentSyncEvents: Array<{ id: string; time: string; text: string; type: 'sale' | 'product' | 'debt' | 'shift' | 'info' }>;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  onForceSyncDownload,
  onForceSyncUpload,
  recentSyncEvents
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(realtimeSync.getStatus());
  const [clientCount, setClientCount] = useState<number>(realtimeSync.getConnectedDevicesCount());
  const [deviceName, setDeviceName] = useState<string>(realtimeSync.getDeviceName());
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string>('');

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';

  useEffect(() => {
    if (!isOpen) return;

    // Generate QR Code for other devices
    if (currentAppUrl) {
      QRCode.toDataURL(currentAppUrl, {
        width: 200,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
    }

    const unsubscribe = realtimeSync.subscribe({
      onStatusChange: (newStatus, count) => {
        setStatus(newStatus);
        setClientCount(count);
      }
    });

    return () => unsubscribe();
  }, [isOpen, currentAppUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentAppUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSaveDeviceName = () => {
    if (tempName.trim()) {
      realtimeSync.setDeviceName(tempName.trim());
      setDeviceName(tempName.trim());
    }
    setIsEditingName(false);
  };

  const handleManualDownload = async () => {
    setIsSyncing(true);
    try {
      await onForceSyncDownload();
      setActionSuccessMsg('¡Datos descargados y actualizados con el servidor central!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualUpload = async () => {
    setIsSyncing(true);
    try {
      await onForceSyncUpload();
      setActionSuccessMsg('¡Datos locales enviados y sincronizados en todos los dispositivos!');
      setTimeout(() => setActionSuccessMsg(''), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-auto text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sincronización en Tiempo Real
                {status === 'connected' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    En línea
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Reconectando...
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Conecta múltiples teléfonos, tablets y PCs para registrar ventas y actualizar inventario simultáneamente.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {actionSuccessMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Device Counter Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Dispositivos Activos</div>
                <div className="text-xl font-black text-white font-mono flex items-center gap-1.5">
                  {clientCount} {clientCount === 1 ? 'dispositivo' : 'dispositivos'}
                </div>
                <div className="text-[10px] text-slate-500">
                  Sincronizados en tiempo real con Google Cloud Firestore
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Este Dispositivo</div>
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input 
                        type="text" 
                        value={tempName} 
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Ej: Caja Mostrador"
                        className="bg-slate-800 border border-slate-700 text-xs text-white px-2 py-1 rounded-lg w-32 focus:outline-emerald-500"
                        autoFocus
                      />
                      <button 
                        onClick={handleSaveDeviceName}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                      {deviceName}
                      <button 
                        onClick={() => { setTempName(deviceName); setIsEditingName(true); }}
                        className="text-slate-400 hover:text-slate-200 p-0.5"
                        title="Cambiar nombre de este dispositivo"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                    ID: {realtimeSync.getDeviceId()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connect Another Device Section (QR Code & Link) */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/20 rounded-2xl p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* QR Code */}
              <div className="shrink-0 bg-white p-2.5 rounded-2xl shadow-md flex flex-col items-center">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Escanear con teléfono para abrir POS" 
                    className="w-32 h-32 sm:w-36 sm:h-36 block rounded-lg"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">
                    Cargando QR...
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-900 mt-1 uppercase tracking-wide">
                  Escanear con Celular
                </span>
              </div>

              {/* Instructions & Link */}
              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    ¿Cómo conectar otro celular, tablet o PC?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Abre la cámara de tu teléfono móvil o tablet y escanea el código QR, o comparte el siguiente enlace para abrir el sistema en cualquier otro equipo:
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={currentAppUrl} 
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-slate-300 px-3 py-2 rounded-xl font-mono truncate select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-sm"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Cualquier cambio realizado en un dispositivo se transmitirá automáticamente a todos en tiempo real.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions (Manual Sync) */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Acciones de Sincronización Manual
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleManualDownload}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition disabled:opacity-50"
              >
                <DownloadCloud className={`w-4 h-4 text-emerald-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>Actualizar desde el Servidor</span>
              </button>

              <button
                onClick={handleManualUpload}
                disabled={isSyncing}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 text-blue-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                <span>Publicar Mis Cambios Locales</span>
              </button>
            </div>
          </div>

          {/* Recent Live Activity Log */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Actividad en Vivo Reciente</span>
              <span className="text-[10px] text-slate-500 lowercase">eventos de red</span>
            </h4>
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-2 text-xs font-mono">
              {recentSyncEvents.length === 0 ? (
                <div className="text-slate-500 text-center py-4">
                  Esperando transacciones o modificaciones...
                </div>
              ) : (
                recentSyncEvents.map(evt => (
                  <div key={evt.id} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 text-[10px] shrink-0">{evt.time}</span>
                    <span className="text-emerald-400">⚡</span>
                    <span className="flex-1">{evt.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Motor: Google Cloud Firestore en Tiempo Real + WebSockets</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
