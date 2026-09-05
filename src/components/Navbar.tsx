import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  FileText, 
  Package, 
  BookOpen, 
  Receipt, 
  Settings, 
  Code, 
  RefreshCw, 
  Edit3, 
  Lock, 
  Unlock, 
  Wallet, 
  TrendingUp,
  Check,
  Building2,
  Crown,
  User,
  ShieldCheck,
  Download,
  Smartphone,
  Monitor,
  Sparkles,
  MoreHorizontal,
  X,
  Wifi,
  WifiOff,
  Radio
} from 'lucide-react';
import { CashShift, UserRole, AppUser } from '../types';
import { formatUSD, formatVES } from '../utils/bcvService';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface NavbarProps {
  currentView: 'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance';
  onNavigate: (view: 'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance') => void;
  bcvRate: number;
  rateDate?: string;
  isRateLoading?: boolean;
  onSyncRate: () => void;
  onUpdateRate: (newRate: number) => void;
  userRole: UserRole;
  currentUser: AppUser;
  onOpenUserSwitch: () => void;
  onToggleRole?: () => void;
  onOpenShiftModal: () => void;
  onOpenSettings: () => void;
  onOpenArchitecture: () => void;
  onOpenPWAInstall: () => void;
  onOpenSyncModal?: () => void;
  syncStatus?: 'connected' | 'connecting' | 'reconnecting' | 'offline' | 'error';
  syncConnectedCount?: number;
  activeShift: CashShift | null;
  lowStockCount?: number;
  pendingDebtsCount?: number;
  pendingPayablesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  bcvRate = 86.45,
  rateDate,
  isRateLoading = false,
  onSyncRate,
  onUpdateRate,
  userRole,
  currentUser,
  onOpenUserSwitch,
  onOpenShiftModal,
  onOpenSettings,
  onOpenArchitecture,
  onOpenPWAInstall,
  onOpenSyncModal,
  syncStatus = 'connected',
  syncConnectedCount = 1,
  activeShift,
  lowStockCount = 0,
  pendingDebtsCount = 0,
  pendingPayablesCount = 0
}) => {
  const { isInstalled, isInstallable, platform } = usePWAInstall();
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState<string>((bcvRate || 86.45).toString());
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (bcvRate) {
      setTempRate(bcvRate.toString());
    }
  }, [bcvRate]);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempRate);
    if (!isNaN(val) && val > 0) {
      onUpdateRate(val);
      setIsEditingRate(false);
    }
  };

  const handleRefreshClick = () => {
    if (!isRateLoading) {
      onSyncRate();
    }
  };

  const isAdmin = currentUser.role === 'admin' || userRole === 'admin';

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md">
        {/* Top Banner: Financial Bar with BCV Rate, Cash Shift & Roles */}
        <div className="px-3 sm:px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
          {/* Left: Brand + Official BCV Ticker */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 font-black tracking-wider text-emerald-400 shrink-0">
              <span className="bg-emerald-500/20 text-emerald-400 p-1 rounded-lg border border-emerald-500/30">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs sm:text-sm font-black tracking-tight">NEGOFACT</span>
              <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-normal hidden sm:inline">
                VE
              </span>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* BCV Rate Pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-700 shrink-0">
              <span className="text-slate-400 font-medium text-[11px] hidden xs:inline">BCV:</span>
              {isEditingRate ? (
                <form onSubmit={handleSaveRate} className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-16 sm:w-20 px-1 py-0.5 bg-slate-800 border border-emerald-500 text-emerald-400 rounded text-xs focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="p-0.5 text-emerald-400 hover:text-emerald-300"
                    title="Guardar tasa manual"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => {
                    setTempRate((bcvRate || 86.45).toString());
                    setIsEditingRate(true);
                  }}
                  className="group flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 font-mono text-xs sm:text-sm"
                  title="Haga clic para editar tasa manualmente"
                >
                  <span>{(bcvRate || 86.45).toFixed(2)} Bs/$</span>
                  <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                </button>
              )}

              <button
                onClick={handleRefreshClick}
                disabled={isRateLoading}
                className={`p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition ${
                  isRateLoading ? 'animate-spin text-emerald-400' : ''
                }`}
                title="Sincronizar tasa BCV en vivo"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right: Cash Shift, Role & Current User Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Shift Button */}
            <button
              onClick={onOpenShiftModal}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition border ${
                activeShift 
                  ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60' 
                  : 'bg-rose-950/50 text-rose-300 border-rose-700/60 hover:bg-rose-900/60'
              }`}
              title="Gestión de caja y Cuadre Z"
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {activeShift ? `Caja: ${formatUSD(activeShift.openingUSD)}` : 'Caja Cerrada'}
              </span>
              <span className="sm:hidden text-[11px] font-bold">
                {activeShift ? 'Caja ON' : 'Caja OFF'}
              </span>
            </button>

            {/* Real-time Multi-Device Sync Indicator */}
            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60 shadow-xs'
                    : 'bg-amber-950/70 text-amber-300 border-amber-700/60 hover:bg-amber-900/60 shadow-xs'
                }`}
                title={`Sincronización en tiempo real: ${syncConnectedCount} dispositivo(s) conectado(s). Clic para conectar otros teléfonos o sincronizar.`}
              >
                {syncStatus === 'connected' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px]">
                      {syncConnectedCount} <span className="hidden sm:inline">{syncConnectedCount === 1 ? 'Disp' : 'Disps'}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="font-mono text-[11px] hidden sm:inline">Reconectando</span>
                  </>
                )}
              </button>
            )}

            {/* User Account & Role Switcher */}
            <button
              type="button"
              onClick={onOpenUserSwitch}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                isAdmin
                  ? 'bg-purple-950/70 text-purple-300 border-purple-700/70 hover:bg-purple-900/60 shadow-xs shadow-purple-950'
                  : 'bg-blue-950/70 text-blue-300 border-blue-700/70 hover:bg-blue-900/60 shadow-xs shadow-blue-950'
              }`}
              title={`Usuario: ${currentUser.name} (${isAdmin ? 'Administrador' : 'Vendedor'}). Clic para cambiar de usuario.`}
            >
              {isAdmin ? (
                <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
              <span className="max-w-[80px] sm:max-w-[120px] truncate text-xs">{currentUser.name || (isAdmin ? 'Admin' : 'Vendedor')}</span>
            </button>

            {/* Mobile More Actions Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMoreMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              title="Más opciones de administración"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Navigation Bar */}
        <div className="hidden md:flex px-4 py-2 items-center justify-between overflow-x-auto scrollbar-none gap-2">
          <nav className="flex items-center gap-1.5 min-w-max">
            <button
              id="nav-tab-pos"
              onClick={() => onNavigate('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'pos'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>POS Mostrador</span>
            </button>

            <button
              id="nav-tab-quotes"
              onClick={() => onNavigate('quotes')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'quotes'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Cotizaciones</span>
            </button>

            <button
              id="nav-tab-inventory"
              onClick={() => onNavigate('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                currentView === 'inventory'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventario & Catálogo</span>
              {lowStockCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {lowStockCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-debts"
              onClick={() => onNavigate('debts')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                currentView === 'debts'
                  ? 'bg-amber-600 text-white shadow-sm shadow-amber-900/50'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Libreta de Fiados</span>
              {pendingDebtsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingDebtsCount}
                </span>
              )}
            </button>

            {/* Finanzas Tab: Accessible ONLY to Administrador */}
            {isAdmin ? (
              <button
                id="nav-tab-finance"
                onClick={() => onNavigate('finance')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                  currentView === 'finance'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/50'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Finanzas</span>
                {pendingPayablesCount > 0 && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingPayablesCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenUserSwitch}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition border border-dashed border-slate-800"
                title="Pestaña de Finanzas bloqueada para rol Vendedor. Requiere inicio de sesión como Administrador."
              >
                <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                <span>Finanzas (Admin)</span>
              </button>
            )}

            <button
              id="nav-tab-sales"
              onClick={() => onNavigate('sales')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                currentView === 'sales'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Ventas</span>
            </button>
          </nav>

          {/* Right Tab utilities */}
          <div className="flex items-center gap-1.5 min-w-max ml-2">
            {/* PWA App Installer Button */}
            <button
              id="nav-tab-install-pwa"
              type="button"
              onClick={onOpenPWAInstall}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isInstalled
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 hover:bg-emerald-900/60'
                  : isInstallable
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 animate-pulse shadow-emerald-950'
                    : 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 hover:bg-slate-750 hover:text-cyan-200'
              }`}
              title="Instalar NegoFact en Windows o Android como Aplicación Web (PWA)"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">
                {isInstalled ? 'App Instalada' : 'Instalar App'}
              </span>
              <span className="sm:hidden">Instalar</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-normal hidden md:inline">
                {platform === 'android' ? 'Android' : 'Windows/PC'}
              </span>
            </button>

            <button
              id="nav-tab-docs"
              onClick={onOpenArchitecture}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-emerald-400/80 hover:bg-slate-800 hover:text-emerald-300 border border-emerald-500/20"
              title="Diagrama de Base de Datos SQL, Lógica TS y Endpoints API"
            >
              <Code className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Schema & Docs</span>
            </button>

            <button
              id="nav-tab-settings"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Configuración de Empresa, Usuarios y Cuentas"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR (Phones & Small Tablets) */}
      <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl shadow-2xl px-1.5 py-1 flex items-center justify-around">
        <button
          onClick={() => onNavigate('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all touch-manipulation ${
            currentView === 'pos'
              ? 'text-emerald-400 font-bold bg-emerald-950/50 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">POS</span>
        </button>

        <button
          onClick={() => onNavigate('quotes')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all touch-manipulation ${
            currentView === 'quotes'
              ? 'text-blue-400 font-bold bg-blue-950/50 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Cotizar</span>
        </button>

        <button
          onClick={() => onNavigate('inventory')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all relative touch-manipulation ${
            currentView === 'inventory'
              ? 'text-indigo-400 font-bold bg-indigo-950/50 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Inventario</span>
          {lowStockCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-slate-950" />
          )}
        </button>

        <button
          onClick={() => onNavigate('debts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all relative touch-manipulation ${
            currentView === 'debts'
              ? 'text-amber-400 font-bold bg-amber-950/50 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Fiados</span>
          {pendingDebtsCount > 0 && (
            <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-950" />
          )}
        </button>

        {isAdmin ? (
          <button
            onClick={() => onNavigate('finance')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all touch-manipulation ${
              currentView === 'finance'
                ? 'text-indigo-400 font-bold bg-indigo-950/50 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Finanzas</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate('sales')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] transition-all touch-manipulation ${
              currentView === 'sales'
                ? 'text-emerald-400 font-bold bg-emerald-950/50 scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Ventas</span>
          </button>
        )}

        {/* More Options Drawer Button */}
        <button
          onClick={() => setIsMobileMoreMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[56px] text-slate-400 hover:text-white transition-all touch-manipulation"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Más</span>
        </button>
      </nav>

      {/* Mobile More Options Slide-up Drawer Modal */}
      {isMobileMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-800 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">Opciones del Sistema</h3>
                  <p className="text-xs text-slate-400">Acceso rápido para teléfono y tablet</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMoreMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onNavigate('sales');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'sales'
                    ? 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Historial Ventas</div>
                  <div className="text-[10px] text-slate-500">Comprobantes</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenShiftModal();
                }}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300"
              >
                <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Arqueo de Caja</div>
                  <div className="text-[10px] text-slate-500">Cierre Turno Z</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenUserSwitch();
                }}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300"
              >
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Cambiar Usuario</div>
                  <div className="text-[10px] text-slate-500">{currentUser.name}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300"
              >
                <Settings className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Configuración</div>
                  <div className="text-[10px] text-slate-500">Datos & Respaldo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenSyncModal?.();
                }}
                className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300 col-span-2"
              >
                <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Sincronización Multi-Dispositivo</span>
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[9px] rounded font-bold font-mono">
                      {syncConnectedCount} {syncConnectedCount === 1 ? 'Activo' : 'Activos'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">Conectar teléfonos, tablets y PCs en tiempo real</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenPWAInstall();
                }}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300 col-span-2"
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Instalar App en Teléfono / PC</span>
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[9px] rounded font-bold">PWA</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Uso Offline en pantalla completa</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
