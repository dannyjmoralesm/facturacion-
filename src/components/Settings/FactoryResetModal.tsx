import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Trash2, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Download, 
  AlertOctagon,
  ShieldCheck
} from 'lucide-react';
import { AppUser } from '../../types';
import { resetToFactoryDefaults, exportAllDataAsJSON } from '../../utils/storage';
import { firestoreResetAllData } from '../../services/firestoreSync';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  users: AppUser[];
  onResetSuccess: () => void;
}

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onResetSuccess
}) => {
  const [password, setPassword] = useState('');
  const [confirmKeyword, setConfirmKeyword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

  if (!isOpen) return null;

  const isAdmin = currentUser.role === 'admin';

  // Find all valid admin accounts for password matching
  const adminUsers = users.filter(u => u.role === 'admin' && u.active);

  const handleDownloadSafetyBackup = () => {
    try {
      const jsonStr = exportAllDataAsJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `negofact_seguridad_antes_de_restablecer_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupDownloaded(true);
    } catch (e) {
      console.error('Error downloading backup:', e);
    }
  };

  const handleExecuteReset = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Role validation
    if (!isAdmin) {
      setErrorMsg('Acceso Denegado: Solo un usuario con rol de Administrador puede realizar este procedimiento.');
      return;
    }

    // 2. Password validation
    if (!password.trim()) {
      setErrorMsg('Debes ingresar tu contraseña de Administrador para confirmar.');
      return;
    }

    // Check against currentUser password or any active admin password
    const isCurrentAdminPasswordValid = currentUser.password === password;
    const isAnyAdminPasswordValid = adminUsers.some(u => u.password === password);

    if (!isCurrentAdminPasswordValid && !isAnyAdminPasswordValid) {
      setErrorMsg('Contraseña de Administrador incorrecta. Por motivos de seguridad no se puede proceder.');
      return;
    }

    // 3. Keyword validation
    if (confirmKeyword.trim().toUpperCase() !== 'RESTABLECER') {
      setErrorMsg('Debes escribir la palabra "RESTABLECER" en mayúsculas exactamente.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Reset local storage values to 0
      resetToFactoryDefaults();

      // 2. Reset cloud Firestore collections to 0 if connected
      firestoreResetAllData().catch((err) => {
        console.warn('Notice: Firestore reset completed or not active:', err);
      });

      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        onResetSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error resetting system:', err);
      setIsProcessing(false);
      setErrorMsg('Ocurrió un error al restablecer el almacenamiento local.');
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-rose-700/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden text-slate-100 my-auto">
        {/* Header with Danger Styling */}
        <div className="p-4 bg-gradient-to-r from-rose-950 via-slate-950 to-slate-950 border-b border-rose-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Restablecer Todo a Estado de Fábrica
              </h3>
              <p className="text-xs text-rose-300/80">
                Acceso Exclusivo de Administrador con Contraseña
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {!isAdmin ? (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 space-y-3 text-center">
              <AlertOctagon className="w-10 h-10 text-rose-400 mx-auto" />
              <h4 className="font-bold text-sm text-rose-200">Permisos Insuficientes</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Esta operación está restringida únicamente a cuentas con rol de <strong>Administrador</strong>. Tu usuario actual ({currentUser.name}) tiene rol de vendedor.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                Entendido, cerrar
              </button>
            </div>
          ) : isSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-base text-white">¡Sistema Restablecido con Éxito!</h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Todos los datos han sido limpiados y la aplicación ha vuelto a su estado inicial de instalación.
              </p>
            </div>
          ) : (
            <form onSubmit={handleExecuteReset} className="space-y-4">
              {/* Critical Warning Box */}
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-700/50 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>¿Qué sucederá al restablecer la aplicación?</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside leading-relaxed pl-1">
                  <li>El <strong>inventario y stock</strong> volverá a 0 (catálogo de productos vacío).</li>
                  <li>Los <strong>clientes y proveedores</strong> se restablecerán a 0.</li>
                  <li>Los <strong>números de facturación, control y cotización</strong> volverán a 0 (FAC-000000).</li>
                  <li>Se borrarán <strong>todas las ventas</strong>, cotizaciones y facturas emitidas.</li>
                  <li>Se limpiarán los <strong>turnos de caja</strong>, reportes Z, <strong>libreta de fiados</strong> y gastos.</li>
                  <li>El encabezado del comercio se restablecerá sin textos genéricos ni de demostración.</li>
                </ul>
              </div>

              {/* Safety Backup Shortcut */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-300">
                  <span className="font-semibold block text-white">Recomendación de Seguridad:</span>
                  Descarga una copia de seguridad antes de borrar todo.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSafetyBackup}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
                    backupDownloaded 
                      ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  {backupDownloaded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-indigo-400" />}
                  <span>{backupDownloaded ? 'Respaldo Listo' : 'Descargar Copia'}</span>
                </button>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span>Contraseña del Administrador ({currentUser.username}):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Requerida</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña de Administrador..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono pr-10 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmation Keyword Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 block">
                  Escribe la palabra <span className="text-rose-400 font-mono font-bold bg-rose-950/60 px-1 py-0.5 rounded border border-rose-800">RESTABLECER</span> para desbloquear:
                </label>
                <input
                  type="text"
                  required
                  value={confirmKeyword}
                  onChange={(e) => setConfirmKeyword(e.target.value)}
                  placeholder="Escribe RESTABLECER en mayúsculas..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono tracking-wider uppercase focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !password.trim() || confirmKeyword.trim().toUpperCase() !== 'RESTABLECER'}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg ${
                    confirmKeyword.trim().toUpperCase() === 'RESTABLECER' && password.trim()
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 cursor-pointer'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isProcessing ? (
                    <span>Restableciendo...</span>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Restablecer y Borrar Todo</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
