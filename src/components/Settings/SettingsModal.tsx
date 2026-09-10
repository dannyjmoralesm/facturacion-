import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  Printer, 
  Percent, 
  Download, 
  Upload, 
  Save, 
  Check, 
  ShieldCheck, 
  X, 
  Database,
  Coins,
  Users,
  Lock,
  Crown,
  User,
  ShieldAlert,
  Monitor,
  Sparkles,
  Zap,
  HardDrive,
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Trash2,
  FileText,
  Hash
} from 'lucide-react';
import { BusinessProfile, AppUser } from '../../types';
import { exportAllDataAsJSON, importDataFromJSON } from '../../utils/storage';
import { UserManagementSection } from './UserManagementSection';
import { FactoryResetModal } from './FactoryResetModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSaveProfile: (profile: BusinessProfile) => void;
  onReloadData: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSaveUser: (user: AppUser) => void;
  onDeleteUser: (userId: string) => void;
  onSwitchUser?: (user: AppUser) => void;
  onOpenPWAInstall?: () => void;
}

type SettingsTab = 'fiscal' | 'digital_accounts' | 'users' | 'backup' | 'app_install';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onReloadData,
  users,
  currentUser,
  onSaveUser,
  onDeleteUser,
  onSwitchUser,
  onOpenPWAInstall
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [form, setForm] = useState<BusinessProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);
  const [isFactoryResetOpen, setIsFactoryResetOpen] = useState(false);

  if (!isOpen) return null;

  const isAdmin = (currentUser?.role === 'admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(form);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `negofact_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupMsg('Copia de seguridad descargada con éxito');
    setTimeout(() => setBackupMsg(null), 3000);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDataFromJSON(content);
      if (ok) {
        setBackupMsg('Datos restaurados correctamente. Recargando...');
        setTimeout(() => {
          onReloadData();
          onClose();
        }, 1200);
      } else {
        setBackupMsg('Error al importar el archivo JSON');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col text-slate-100 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Panel de Configuración del Sistema</h2>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                  isAdmin 
                    ? 'bg-purple-950/70 text-purple-300 border-purple-700/60' 
                    : 'bg-blue-950/70 text-blue-300 border-blue-700/60'
                }`}>
                  {isAdmin ? <Crown className="w-3 h-3 text-purple-400" /> : <User className="w-3 h-3 text-blue-400" />}
                  <span>{isAdmin ? 'Modo Administrador' : 'Modo Vendedor'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Administración de cuentas, perfiles fiscales venezolanos, cuentas receptoras y respaldos.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-t border-x ${
              activeTab === 'users'
                ? 'bg-slate-900 border-slate-700 text-indigo-400 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios & Roles</span>
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-1.5 py-0.2 rounded-full">
              {(users?.length || 0)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-t border-x ${
              activeTab === 'fiscal'
                ? 'bg-slate-900 border-slate-700 text-emerald-400 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Fiscal & Empresa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('digital_accounts')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-t border-x ${
              activeTab === 'digital_accounts'
                ? 'bg-slate-900 border-slate-700 text-blue-400 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Pago Móvil & Digital</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-t border-x ${
              activeTab === 'backup'
                ? 'bg-slate-900 border-slate-700 text-amber-400 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Respaldo Offline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('app_install')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-t border-x ${
              activeTab === 'app_install'
                ? 'bg-slate-900 border-slate-700 text-teal-400 border-b-transparent'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-900/40'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Instalar App (PWA)</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 rounded-full border border-emerald-500/30">
              Win / Android
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-xs">
          {/* TAB 1: USERS & ROLES */}
          {activeTab === 'users' && (
            <UserManagementSection
              users={users}
              currentUser={currentUser}
              onSaveUser={onSaveUser}
              onDeleteUser={onDeleteUser}
              onSwitchUser={onSwitchUser}
            />
          )}

          {/* TAB 2: FISCAL & EMPRESA */}
          {activeTab === 'fiscal' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-emerald-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Identificación Fiscal del Negocio</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Razón Social / Empresa:</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Nro. de RIF:</label>
                    <input
                      type="text"
                      required
                      value={form.rif}
                      onChange={(e) => setForm({ ...form, rif: e.target.value })}
                      placeholder="J-40891234-1"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-slate-300 block mb-1 font-semibold">Dirección Fiscal / Local:</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Teléfono / WhatsApp:</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Numbering & Sequence */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <h3 className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Numeración & Correlativo de Facturación</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, nextInvoiceSeq: 0, nextControlSeq: 0 })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Reiniciar correlativo para empezar a contar desde 0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Empezar desde 0</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, nextInvoiceSeq: 1, nextControlSeq: 1 })}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Reiniciar correlativo para empezar a contar desde 1"
                    >
                      <span>Empezar desde 1</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Prefijo de Factura:</label>
                    <input
                      type="text"
                      value={form.invoicePrefix || 'FACT-'}
                      onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                      placeholder="FACT-"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Próximo Correlativo de Factura (Nro.):</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.nextInvoiceSeq !== undefined ? form.nextInvoiceSeq : 0}
                      onChange={(e) => setForm({ ...form, nextInvoiceSeq: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Próxima factura generada:{' '}
                      <span className="font-mono font-bold text-sky-400">
                        {form.invoicePrefix || 'FACT-'}{String(form.nextInvoiceSeq !== undefined ? form.nextInvoiceSeq : 0).padStart(6, '0')}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Prefijo Nro. de Control:</label>
                    <input
                      type="text"
                      value={form.controlPrefix || '00-'}
                      onChange={(e) => setForm({ ...form, controlPrefix: e.target.value })}
                      placeholder="00-"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Próximo Nro. de Control:</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.nextControlSeq !== undefined ? form.nextControlSeq : 0}
                      onChange={(e) => setForm({ ...form, nextControlSeq: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Próximo control:{' '}
                      <span className="font-mono font-bold text-emerald-400">
                        {form.controlPrefix || '00-'}{String(form.nextControlSeq !== undefined ? form.nextControlSeq : 0).padStart(6, '0')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Printing & VAT */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Printer className="w-4 h-4" />
                  <span>Impresión Térmica & Facturación</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Ancho Predeterminado Ticket Térmico:</label>
                    <select
                      value={form.defaultThermalSize}
                      onChange={(e: any) => setForm({ ...form, defaultThermalSize: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                    >
                      <option value="80mm">80 mm (Estándar Punto de Venta / Impresora de Escritorio)</option>
                      <option value="58mm">58 mm (Mini Impresora Portátil Bluetooth)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Impuesto IVA Aplicable (%):</label>
                    <input
                      type="number"
                      step="1"
                      value={form.taxRatePercent || 16}
                      onChange={(e) => setForm({ ...form, taxRatePercent: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Mensaje de Pie de Factura / Ticket:</label>
                  <input
                    type="text"
                    value={form.footerMessage}
                    onChange={(e) => setForm({ ...form, footerMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{savedSuccess ? '¡Guardado!' : 'Guardar Datos Fiscales'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DIGITAL ACCOUNTS */}
          {activeTab === 'digital_accounts' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-blue-400 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Datos de Pago Móvil & Cuentas Digitales (Para Tickets y WhatsApp)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1">Banco Pago Móvil:</label>
                    <input
                      type="text"
                      value={form.pagoMovilBank || ''}
                      onChange={(e) => setForm({ ...form, pagoMovilBank: e.target.value })}
                      placeholder="0102 - Banco de Venezuela"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cédula / RIF Pago Móvil:</label>
                    <input
                      type="text"
                      value={form.pagoMovilId || ''}
                      onChange={(e) => setForm({ ...form, pagoMovilId: e.target.value })}
                      placeholder="V-19876543"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Teléfono Pago Móvil:</label>
                    <input
                      type="text"
                      value={form.pagoMovilPhone || ''}
                      onChange={(e) => setForm({ ...form, pagoMovilPhone: e.target.value })}
                      placeholder="04121234567"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Correo Zelle:</label>
                    <input
                      type="text"
                      value={form.zelleEmail || ''}
                      onChange={(e) => setForm({ ...form, zelleEmail: e.target.value })}
                      placeholder="pagos@tuempresa.com"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1 font-semibold">Binance Pay ID / USDT:</label>
                    <input
                      type="text"
                      value={form.binancePayId || ''}
                      onChange={(e) => setForm({ ...form, binancePayId: e.target.value })}
                      placeholder="Binance Pay ID: 12345678"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{savedSuccess ? '¡Guardado!' : 'Guardar Cuentas de Cobro'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Respaldo & Recuperación de Datos Fuera de Línea</span>
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Todos los datos (cuentas de usuarios, inventario, clientes, ventas, facturas de proveedores, gastos y libreta de fiados) se almacenan localmente de forma segura. Puedes descargar una copia de seguridad en formato JSON o restaurarla en cualquier dispositivo.
                </p>

                {backupMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs font-semibold">
                    {backupMsg}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Exportar Copia de Seguridad JSON</span>
                  </button>

                  <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl flex items-center gap-2 border border-slate-700 transition cursor-pointer">
                    <Upload className="w-4 h-4 text-blue-400" />
                    <span>Restaurar desde JSON</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* DANGER ZONE: FACTORY RESET (ADMIN ONLY) */}
              <div className="space-y-3 bg-gradient-to-br from-slate-950 via-slate-950 to-rose-950/30 p-4 rounded-xl border border-rose-900/60 shadow-lg">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <h3 className="font-bold text-sm text-rose-200">
                        Restablecimiento de Fábrica (Borrado Total)
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-rose-400" />
                        <span>Solo Administrador</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 max-w-xl leading-relaxed">
                      Restaura la aplicación a su estado inicial como si estuviese recién instalada. Elimina todas las ventas, cierres de caja, fiados, cuentas por pagar y gastos registrados, manteniendo la estructura limpia y segura.
                    </p>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setIsFactoryResetOpen(true)}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-950 transition shrink-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restablecer Todo a Fábrica...</span>
                    </button>
                  ) : (
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold flex items-center gap-2 shrink-0">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Requiere Administrador</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PWA APP INSTALLATION */}
          {activeTab === 'app_install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/80 border border-emerald-500/30 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Instalador Progresivo (PWA) de NegoFact</h3>
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                      Transforma NegoFact en una aplicación instalada en tu sistema operativo, lista para operar en mostrador con soporte offline, sin barras de navegación y con acceso directo desde el Escritorio o Pantalla Principal.
                    </p>
                  </div>
                  {onOpenPWAInstall && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPWAInstall();
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 shrink-0 transition"
                    >
                      <Download className="w-4 h-4" />
                      <span>Abrir Instalador</span>
                    </button>
                  )}
                </div>
              </div>

              {/* OS Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Monitor className="w-4 h-4" />
                    <span>Instalación en Windows PC / Laptop</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Se ejecuta en ventana independiente con ícono en la barra de tareas.</li>
                    <li>Acceso rápido desde el Menú Inicio y Escritorio.</li>
                    <li>Soporta atajos de teclado rápidos de Punto de Venta.</li>
                    <li>Haz clic en el ícono de instalación (⊕ o monitor) en la barra de direcciones de Chrome / Edge.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Instalación en Android Móvil / Tablet</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Experiencia a pantalla completa (full screen) idéntica a una app APK.</li>
                    <li>Abre en Chrome &rarr; Menú (⋮) &rarr; "Instalar aplicación".</li>
                    <li>Permite facturación portátil en ferias, mesas o almacén.</li>
                    <li>Caché automático de inventario para consultar productos sin cobertura.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Factory Reset High Security Modal */}
      {isFactoryResetOpen && (
        <FactoryResetModal
          isOpen={isFactoryResetOpen}
          onClose={() => setIsFactoryResetOpen(false)}
          currentUser={currentUser}
          users={users}
          onResetSuccess={() => {
            setIsFactoryResetOpen(false);
            onReloadData();
            onClose();
          }}
        />
      )}
    </div>
  );
};
