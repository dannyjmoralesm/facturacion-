import React, { useState, useEffect } from 'react';
import { 
  Home,
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
  Wallet, 
  TrendingUp, 
  Check, 
  Building2, 
  Crown, 
  User, 
  Download, 
  MoreHorizontal, 
  X, 
  Wifi, 
  WifiOff, 
  Radio, 
  Users, 
  Briefcase 
} from 'lucide-react';
import { CashShift, UserRole, AppUser } from '../types';
import { formatUSD } from '../utils/bcvService';
import { usePWAInstall } from '../hooks/usePWAInstall';

export type AppView = 'home' | 'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance' | 'customers' | 'payroll';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
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
  onOpenManual?: () => void;
  syncStatus?: 'connected' | 'connecting' | 'reconnecting' | 'offline' | 'error';
  syncConnectedCount?: number;
  activeShift: CashShift | null;
  lowStockCount?: number;
  pendingDebtsCount?: number;
  pendingPayablesCount?: number;
  totalCustomersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  bcvRate = 813.74,
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
  onOpenManual,
  syncStatus = 'connected',
  syncConnectedCount = 1,
  activeShift,
  lowStockCount = 0,
  pendingDebtsCount = 0,
  pendingPayablesCount = 0,
  totalCustomersCount = 0
}) => {
  const { isInstalled, isInstallable, platform } = usePWAInstall();
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [tempRate, setTempRate] = useState<string>((bcvRate || 813.74).toString());
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

  const isAdmin = (currentUser?.role === 'admin') || userRole === 'admin';

  // Navigation Items with distinctive, attractive color identities ("llamativo")
  const navTabs = [
    { 
      id: 'nav-tab-home', 
      view: 'home' as const, 
      label: 'Inicio', 
      icon: Home,
      activeColor: 'bg-emerald-700/80 text-white shadow-md shadow-emerald-950/60 border border-emerald-500/40',
      iconColor: 'text-emerald-300'
    },
    { 
      id: 'nav-tab-pos', 
      view: 'pos' as const, 
      label: 'POS Mostrador', 
      icon: ShoppingBag,
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50',
      iconColor: 'text-emerald-200'
    },
    { 
      id: 'nav-tab-quotes', 
      view: 'quotes' as const, 
      label: 'Cotizaciones', 
      icon: FileText,
      activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-900/50',
      iconColor: 'text-blue-200'
    },
    { 
      id: 'nav-tab-inventory', 
      view: 'inventory' as const, 
      label: 'Inventario', 
      icon: Package,
      activeColor: 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50',
      iconColor: 'text-indigo-200',
      badge: lowStockCount > 0 ? (
        <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono">
          {lowStockCount}
        </span>
      ) : null
    },
    { 
      id: 'nav-tab-customers', 
      view: 'customers' as const, 
      label: 'Clientes', 
      icon: Users,
      activeColor: 'bg-teal-600 text-white shadow-md shadow-teal-900/50',
      iconColor: 'text-teal-200',
      badge: totalCustomersCount > 0 ? (
        <span className="bg-teal-950 text-teal-300 border border-teal-700/60 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
          {totalCustomersCount}
        </span>
      ) : null
    },
    { 
      id: 'nav-tab-debts', 
      view: 'debts' as const, 
      label: 'Fiados', 
      icon: BookOpen,
      activeColor: 'bg-amber-600 text-white shadow-md shadow-amber-900/50',
      iconColor: 'text-amber-200',
      badge: pendingDebtsCount > 0 ? (
        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono animate-pulse">
          {pendingDebtsCount}
        </span>
      ) : null
    },
    { 
      id: 'nav-tab-finance', 
      view: 'finance' as const, 
      label: 'Finanzas', 
      icon: Building2, 
      adminOnly: true,
      activeColor: 'bg-purple-600 text-white shadow-md shadow-purple-900/50',
      iconColor: 'text-purple-200',
      badge: pendingPayablesCount > 0 ? (
        <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full font-mono">
          {pendingPayablesCount}
        </span>
      ) : null
    },
    { 
      id: 'nav-tab-payroll', 
      view: 'payroll' as const, 
      label: 'Nómina', 
      icon: Briefcase, 
      adminOnly: true,
      activeColor: 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-900/50',
      iconColor: 'text-fuchsia-200',
      badge: (
        <span className="bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/60 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono hidden xl:inline">
          LOTTT
        </span>
      )
    },
    { 
      id: 'nav-tab-sales', 
      view: 'sales' as const, 
      label: 'Ventas', 
      icon: Receipt,
      activeColor: 'bg-cyan-700 text-white shadow-md shadow-cyan-900/50',
      iconColor: 'text-cyan-200'
    },
  ];

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-md select-none">
        {/* Tier 1: Brand & Key Financial Operations Header */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-3 text-xs">
          {/* Brand & BCV Rate Ticker */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
              title="Ir al Inicio / Centro de Control"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-black text-sm tracking-tight text-white group-hover:text-emerald-300 transition">
                  NEGOFACT
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono font-bold hidden sm:inline">
                  POS VE
                </span>
              </div>
            </button>

            <div className="h-4 w-px bg-slate-800 hidden xs:block" />

            {/* BCV Rate Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-750 text-[11px] shadow-xs">
              <span className="text-slate-400 font-medium">BCV:</span>
              {isEditingRate ? (
                <form onSubmit={handleSaveRate} className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    className="w-16 px-1 py-0.5 bg-slate-800 border border-emerald-500 text-emerald-300 rounded text-[11px] font-mono focus:outline-none"
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
                    setTempRate((bcvRate || 813.74).toString());
                    setIsEditingRate(true);
                  }}
                  className="group flex items-center gap-1 font-bold text-emerald-400 hover:text-emerald-300 font-mono"
                  title="Clic para editar tasa manualmente"
                >
                  <span className="tabular-nums">{(bcvRate || 813.74).toFixed(2)} Bs/$</span>
                  <Edit3 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition" />
                </button>
              )}

              <button
                onClick={handleRefreshClick}
                disabled={isRateLoading}
                className={`p-0.5 text-slate-400 hover:text-white transition ${
                  isRateLoading ? 'animate-spin text-emerald-400' : ''
                }`}
                title="Sincronizar tasa BCV oficial en vivo"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Right Utilities: Shift, Sync, User, Actions */}
          <div className="flex items-center gap-2">
            {/* Cash Shift Button */}
            <button
              onClick={onOpenShiftModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                activeShift 
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60' 
                  : 'bg-rose-950/60 text-rose-300 border-rose-700/60 hover:bg-rose-900/60'
              }`}
              title="Gestión de caja y arqueo Z"
            >
              <Wallet className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline font-mono tabular-nums">
                {activeShift ? `Caja: ${formatUSD(activeShift.openingUSD)}` : 'Caja Cerrada'}
              </span>
              <span className="sm:hidden font-mono text-[10px]">
                {activeShift ? 'Caja ON' : 'Caja OFF'}
              </span>
            </button>

            {/* Sync Status Button */}
            {onOpenSyncModal && (
              <button
                type="button"
                onClick={onOpenSyncModal}
                className="flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] bg-slate-900 border border-slate-750 hover:border-slate-700 text-slate-200 transition"
                title={`Sincronización multi-dispositivo (${syncConnectedCount} conectados)`}
              >
                {syncStatus === 'connected' ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-mono text-[11px] text-slate-300 hidden xs:inline">
                      {syncConnectedCount}
                    </span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] text-amber-400 hidden sm:inline">Offline</span>
                  </>
                )}
              </button>
            )}

            {/* User Account Button */}
            <button
              type="button"
              onClick={onOpenUserSwitch}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] border font-semibold transition ${
                isAdmin
                  ? 'bg-purple-950/70 text-purple-300 border-purple-700/70 hover:bg-purple-900/60'
                  : 'bg-blue-950/70 text-blue-300 border-blue-700/70 hover:bg-blue-900/60'
              }`}
              title={`Usuario: ${currentUser?.name || 'Usuario'} (${isAdmin ? 'Admin' : 'Vendedor'})`}
            >
              {isAdmin ? (
                <Crown className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              )}
              <span className="max-w-[70px] sm:max-w-[100px] truncate text-xs">
                {currentUser?.name || (isAdmin ? 'Admin' : 'Vendedor')}
              </span>
            </button>

            {/* Quick Utility Icon Group (Desktop) */}
            <div className="hidden md:flex items-center gap-1 pl-1 border-l border-slate-800">
              {/* PWA Button */}
              <button
                id="nav-tab-install-pwa"
                type="button"
                onClick={onOpenPWAInstall}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                title={isInstalled ? 'App instalada' : `Instalar aplicación (${platform === 'android' ? 'Android' : 'PC'})`}
              >
                <Download className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Manual Button */}
              {onOpenManual && (
                <button
                  id="nav-tab-manual"
                  type="button"
                  onClick={onOpenManual}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                  title="Manual de operaciones y marco fiscal"
                >
                  <BookOpen className="w-4 h-4 text-purple-400" />
                </button>
              )}

              {/* Developer Schema Button */}
              <button
                id="nav-tab-docs"
                onClick={onOpenArchitecture}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                title="Arquitectura y base de datos"
              >
                <Code className="w-4 h-4 text-cyan-400" />
              </button>

              {/* Settings Button */}
              <button
                id="nav-tab-settings"
                onClick={onOpenSettings}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                title="Configuración general"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile More Button */}
            <button
              type="button"
              onClick={() => setIsMobileMoreMenuOpen(true)}
              className="md:hidden p-1.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 border border-slate-750"
              title="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier 2: Distinctive Navigation Tabs Bar (Desktop) */}
        <div className="hidden md:flex px-4 py-2 items-center justify-between overflow-x-auto scrollbar-none bg-slate-900/90 gap-2">
          <nav className="flex items-center gap-1.5 min-w-max">
            {navTabs.map((tab) => {
              if (tab.adminOnly && !isAdmin) {
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={onOpenUserSwitch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition border border-dashed border-slate-800"
                    title={`${tab.label} requiere permisos de Administrador`}
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-500/70" />
                    <span>{tab.label} (Admin)</span>
                  </button>
                );
              }

              const isActive = currentView === tab.view;
              const Icon = tab.icon;

              return (
                <button
                  key={tab.id}
                  id={tab.id}
                  onClick={() => onNavigate(tab.view)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? tab.activeColor
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.iconColor}`} />
                  <span>{tab.label}</span>
                  {tab.badge}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION BAR: Includes tranquil "Inicio" + fast POS */}
      <nav aria-label="Navegación móvil" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-2 py-1 flex items-center justify-around">
        {/* 1. Inicio */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[50px] transition-all touch-manipulation ${
            currentView === 'home' 
              ? 'text-emerald-400 font-bold bg-emerald-950/50 scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Inicio</span>
        </button>

        {/* 2. POS Mostrador */}
        <button
          onClick={() => onNavigate('pos')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[50px] transition-all touch-manipulation ${
            currentView === 'pos' 
              ? 'text-emerald-400 font-bold bg-emerald-950/50 scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">POS</span>
        </button>

        {/* 3. Inventario */}
        <button
          onClick={() => onNavigate('inventory')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[50px] transition-all relative touch-manipulation ${
            currentView === 'inventory' 
              ? 'text-indigo-400 font-bold bg-indigo-950/50 scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Inventario</span>
          {lowStockCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        {/* 4. Fiados */}
        <button
          onClick={() => onNavigate('debts')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[50px] transition-all relative touch-manipulation ${
            currentView === 'debts' 
              ? 'text-amber-400 font-bold bg-amber-950/50 scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Fiados</span>
          {pendingDebtsCount > 0 && (
            <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* 5. Más opciones */}
        <button
          onClick={() => setIsMobileMoreMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[50px] text-slate-400 hover:text-slate-200 transition-all touch-manipulation"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Más</span>
        </button>
      </nav>

      {/* Mobile More Options Slide-up Drawer Modal */}
      {isMobileMoreMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Todos los Módulos</h3>
                <p className="text-xs text-slate-400">Navegación completa y administración</p>
              </div>
              <button
                onClick={() => setIsMobileMoreMenuOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onNavigate('home');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'home'
                    ? 'bg-emerald-950/80 border-emerald-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Inicio / Dashboard</div>
                  <div className="text-[10px] text-slate-500">Alertas y resumen</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onNavigate('quotes');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'quotes'
                    ? 'bg-blue-950/80 border-blue-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Cotizaciones</div>
                  <div className="text-[10px] text-slate-500">Presupuestos formal</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onNavigate('customers');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'customers'
                    ? 'bg-teal-950/80 border-teal-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Directorio Clientes</div>
                  <div className="text-[10px] text-slate-500">Dirección Fiscal & Deuda</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  if (isAdmin) {
                    onNavigate('payroll');
                  } else {
                    onOpenUserSwitch();
                  }
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'payroll'
                    ? 'bg-fuchsia-950/80 border-fuchsia-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Briefcase className="w-4 h-4 text-fuchsia-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Nómina LOTTT</div>
                  <div className="text-[10px] text-slate-500">Quincenas & Recibos</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  if (isAdmin) {
                    onNavigate('finance');
                  } else {
                    onOpenUserSwitch();
                  }
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'finance'
                    ? 'bg-purple-950/80 border-purple-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Finanzas & Gastos</div>
                  <div className="text-[10px] text-slate-500">Cuentas por pagar</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onNavigate('sales');
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition ${
                  currentView === 'sales'
                    ? 'bg-cyan-950/80 border-cyan-600 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Receipt className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Historial Ventas</div>
                  <div className="text-[10px] text-slate-500">Comprobantes & Reportes</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenShiftModal();
                }}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300"
              >
                <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
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
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300"
              >
                <User className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Cambiar Usuario</div>
                  <div className="text-[10px] text-slate-500 truncate">{currentUser?.name || 'Usuario'}</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenSettings();
                }}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300 col-span-2"
              >
                <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs">Configuración del Negocio</div>
                  <div className="text-[10px] text-slate-500">Parámetros fiscales, perfiles y respaldo</div>
                </div>
              </button>

              {onOpenSyncModal && (
                <button
                  onClick={() => {
                    setIsMobileMoreMenuOpen(false);
                    onOpenSyncModal();
                  }}
                  className="p-3 rounded-xl bg-slate-950/70 border border-emerald-500/30 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300 col-span-2"
                >
                  <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>Sincronización Multi-Dispositivo</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        · {syncConnectedCount} activo(s)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500">Conectar teléfonos, tablets y PCs</div>
                  </div>
                </button>
              )}

              {onOpenManual && (
                <button
                  onClick={() => {
                    setIsMobileMoreMenuOpen(false);
                    onOpenManual();
                  }}
                  className="p-3 rounded-xl bg-purple-950/60 border border-purple-800/60 hover:bg-purple-900/60 text-left flex items-center gap-2.5 transition text-purple-200 col-span-2"
                >
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <span>Manual de Operaciones & Marco Legal</span>
                      <span className="px-1.5 py-0.2 bg-purple-900 text-purple-200 text-[9px] rounded font-bold">PDF</span>
                    </div>
                    <div className="text-[10px] text-purple-300/80">SENIAT, IVA 16%, IGTF 3% y Nómina LOTTT</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  setIsMobileMoreMenuOpen(false);
                  onOpenPWAInstall();
                }}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 text-left flex items-center gap-2.5 transition text-slate-300 col-span-2"
              >
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>Instalar Aplicación (PWA)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-300 text-[9px] rounded font-bold">PWA</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Uso en pantalla completa</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
