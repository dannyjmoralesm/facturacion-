import React, { useMemo } from 'react';
import { 
  ShoppingBag, 
  Package, 
  BookOpen, 
  FileText, 
  Users, 
  Building2, 
  Briefcase, 
  Receipt, 
  Wallet, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowRight, 
  Sparkles,
  DollarSign,
  ChevronRight,
  ShieldAlert,
  Coins
} from 'lucide-react';
import { 
  AppUser, 
  UserRole, 
  BusinessProfile, 
  CashShift, 
  Product, 
  DebtAccount, 
  Sale, 
  Customer, 
  SupplierDebt 
} from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';

interface HomeDashboardProps {
  onNavigate: (view: 'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance' | 'customers' | 'payroll') => void;
  currentUser: AppUser;
  userRole: UserRole;
  bcvRate: number;
  activeShift: CashShift | null;
  onOpenShiftModal: () => void;
  profile: BusinessProfile;
  products: Product[];
  debts: DebtAccount[];
  sales: Sale[];
  customers: Customer[];
  supplierDebts?: SupplierDebt[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  onNavigate,
  currentUser,
  userRole,
  bcvRate,
  activeShift,
  onOpenShiftModal,
  profile,
  products,
  debts,
  sales,
  customers,
  supplierDebts = []
}) => {
  const isAdmin = (currentUser?.role === 'admin') || userRole === 'admin';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's Sales Calculation
  const todaySales = useMemo(() => {
    return (sales || []).filter(s => s.date && s.date.startsWith(todayStr));
  }, [sales, todayStr]);

  const todaySalesUSD = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + (s.totalUSD || 0), 0);
  }, [todaySales]);

  const todaySalesVES = useMemo(() => {
    return todaySalesUSD * bcvRate;
  }, [todaySalesUSD, bcvRate]);

  // Alerts Calculation
  const pendingDebts = useMemo(() => {
    return (debts || []).filter(d => d.status !== 'paid');
  }, [debts]);

  const totalPendingDebtUSD = useMemo(() => {
    return pendingDebts.reduce((sum, d) => sum + (d.remainingDebtUSD || 0), 0);
  }, [pendingDebts]);

  const lowStockProducts = useMemo(() => {
    return (products || []).filter(p => p.type === 'physical' && p.stock <= p.minStock && p.stock > 0);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return (products || []).filter(p => p.type === 'physical' && p.stock <= 0);
  }, [products]);

  const pendingSupplierDebts = useMemo(() => {
    return (supplierDebts || []).filter(sd => sd.status !== 'paid');
  }, [supplierDebts]);

  const totalSupplierDebtUSD = useMemo(() => {
    return pendingSupplierDebts.reduce((sum, sd) => sum + (sd.remainingDebtUSD || 0), 0);
  }, [pendingSupplierDebts]);

  // Priority alert counter
  const totalAlertsCount = 
    (pendingDebts.length > 0 ? 1 : 0) +
    (outOfStockProducts.length > 0 || lowStockProducts.length > 0 ? 1 : 0) +
    (!activeShift ? 1 : 0) +
    (pendingSupplierDebts.length > 0 ? 1 : 0);

  const formattedDate = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('es-VE', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Welcome & Calm Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              Centro de Operaciones
            </span>
            <span className="text-xs text-slate-400 capitalize">{formattedDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5 tracking-tight">
            Hola, {currentUser?.name || (isAdmin ? 'Administrador' : 'Vendedor')} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {profile?.name || profile?.commercialName || 'NegoFact POS'} · Sistema de Facturación e Inventario Bimoneda
          </p>
        </div>

        {/* BCV Ticker & Shift Widget */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Rate card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Tasa Oficial BCV</div>
              <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                {(bcvRate || 813.74).toFixed(2)} Bs/$
              </div>
            </div>
          </div>

          {/* Shift status */}
          <button
            onClick={onOpenShiftModal}
            className={`border rounded-xl px-3.5 py-2 flex items-center gap-2.5 transition text-left cursor-pointer ${
              activeShift 
                ? 'bg-slate-900 border-emerald-700/60 hover:bg-slate-850' 
                : 'bg-amber-950/30 border-amber-600/50 hover:bg-amber-950/50'
            }`}
            title="Clic para gestionar turno de caja"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              activeShift 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}>
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Turno de Caja</div>
              <div className={`text-xs font-bold font-mono tabular-nums ${activeShift ? 'text-white' : 'text-amber-400'}`}>
                {activeShift ? `Abierta: ${formatUSD(activeShift.openingUSD)}` : 'Caja Cerrada (Abrir)'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 1: ALERTAS PRIORITARIAS (Tranquilo & Claro) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-slate-200">
              Alertas y Pendientes del Día
            </h2>
            {totalAlertsCount > 0 ? (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {totalAlertsCount} {totalAlertsCount === 1 ? 'notificación' : 'notificaciones'}
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Todo al día
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Supervisión en tiempo real
          </span>
        </div>

        {totalAlertsCount === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-center gap-3.5 text-slate-300">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-white">Todo se encuentra al día y en orden</div>
              <div className="text-xs text-slate-400 mt-0.5">
                No hay deudas vencidas urgentes, el inventario cuenta con stock disponible y el turno está operativo.
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Alert: Debts Pending (Alguien debe dinero) */}
            {pendingDebts.length > 0 && (
              <div 
                onClick={() => onNavigate('debts')}
                className="bg-amber-950/20 border border-amber-600/40 hover:border-amber-500 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Cuentas por Cobrar Pendientes</span>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                        {pendingDebts.length}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 truncate">
                      Saldo en la calle: <span className="text-amber-400 font-mono tabular-nums">{formatUSD(totalPendingDebtUSD)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Hay clientes con abonos pendientes. Clic para ver libreta de fiados.
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Alert: Low or Out of Stock */}
            {(outOfStockProducts.length > 0 || lowStockProducts.length > 0) && (
              <div 
                onClick={() => onNavigate('inventory')}
                className="bg-rose-950/20 border border-rose-600/40 hover:border-rose-500 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-rose-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Alerta de Existencias</span>
                      <span className="bg-rose-500/20 text-rose-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                        {outOfStockProducts.length + lowStockProducts.length}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 truncate">
                      {outOfStockProducts.length > 0 && `${outOfStockProducts.length} agotado(s) · `}
                      {lowStockProducts.length} con stock bajo
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Productos alcanzaron el mínimo. Clic para revisar inventario.
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 group-hover:bg-rose-500 group-hover:text-slate-950 flex items-center justify-center transition shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Alert: Shift Not Opened */}
            {!activeShift && (
              <div 
                onClick={onOpenShiftModal}
                className="bg-blue-950/20 border border-blue-600/40 hover:border-blue-500 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-blue-300 uppercase tracking-wide">
                      Caja Chica Sin Abrir
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      Turno actualmente cerrado
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Abre el turno con tu fondo de caja para registrar pagos en efectivo.
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 group-hover:bg-blue-500 group-hover:text-slate-950 flex items-center justify-center transition shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Alert: Supplier Debts (Admin only) */}
            {isAdmin && pendingSupplierDebts.length > 0 && (
              <div 
                onClick={() => onNavigate('finance')}
                className="bg-purple-950/20 border border-purple-600/40 hover:border-purple-500 rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-purple-300 uppercase tracking-wide flex items-center gap-1.5">
                      <span>Cuentas por Pagar Proveedores</span>
                      <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded font-mono">
                        {pendingSupplierDebts.length}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5 truncate">
                      Compromisos: <span className="text-purple-400 font-mono tabular-nums">{formatUSD(totalSupplierDebtUSD)}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Facturas de proveedores por saldar. Clic para ir a Finanzas.
                    </div>
                  </div>
                </div>

                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 group-hover:bg-purple-500 group-hover:text-slate-950 flex items-center justify-center transition shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: ACCESOS DIRECTOS VIBRANTES & LLAMATIVOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-bold text-slate-200">
            Módulos del Sistema
          </h2>
          <span className="text-xs text-slate-400">
            Selecciona la opción a la que deseas acceder
          </span>
        </div>

        {/* Hero Card: POS Mostrador (The primary, vibrant selling area) */}
        <div 
          onClick={() => onNavigate('pos')}
          className="mb-4 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/50 hover:border-emerald-400 p-5 sm:p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer transition shadow-lg group relative overflow-hidden active:scale-[0.99]"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950 group-hover:scale-105 transition shrink-0">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Facturación & Cobro
                </span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  Acceso Rápido
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5 group-hover:text-emerald-300 transition">
                Abrir POS Mostrador
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Cobro bimoneda rápido con lector de código de barras, calculadora de vuelto multi-divisa y pagos divididos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition shadow-md shrink-0 self-start sm:self-center">
            <span>Ir al Mostrador</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Secondary Modules Grid with vibrant distinctive color personalities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {/* 1. Inventario & Catálogo (Índigo) */}
          <div
            onClick={() => onNavigate('inventory')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <Package className="w-5 h-5" />
                </div>
                <span className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {products?.length || 0} ítems
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-indigo-300 transition">
                Inventario & Catálogo
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Control de existencias, precios de venta, costos y catálogo WhatsApp.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-indigo-400">
              <span>Administrar Stock</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 2. Libreta de Fiados (Ámbar) */}
          <div
            onClick={() => onNavigate('debts')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <BookOpen className="w-5 h-5" />
                </div>
                {pendingDebts.length > 0 && (
                  <span className="bg-amber-950 text-amber-300 border border-amber-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                    {pendingDebts.length} activos
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                Libreta de Fiados
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Cuentas por cobrar en USD indexadas a la tasa oficial del día de pago.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Registrar Abonos</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 3. Cotizaciones (Azul) */}
          <div
            onClick={() => onNavigate('quotes')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="bg-blue-950 text-blue-300 border border-blue-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Presupuestos
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition">
                Cotizaciones Formales
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Genera proformas bimoneda con logo para clientes y conviértelas a venta en 1-clic.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-400">
              <span>Crear Presupuesto</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 4. Clientes (Teal) */}
          <div
            onClick={() => onNavigate('customers')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-teal-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <Users className="w-5 h-5" />
                </div>
                <span className="bg-teal-950 text-teal-300 border border-teal-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {customers?.length || 0} clientes
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-teal-300 transition">
                Directorio de Clientes
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Direcciones fiscales SENIAT, teléfonos y registro de deudas por cliente.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-400">
              <span>Ver Directorio</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 5. Historial de Ventas (Cyan / Slate) */}
          <div
            onClick={() => onNavigate('sales')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <Receipt className="w-5 h-5" />
                </div>
                <span className="bg-cyan-950 text-cyan-300 border border-cyan-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  {todaySales.length} hoy
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-cyan-300 transition">
                Historial de Ventas
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Comprobantes emitidos, reimpresión térmica, reportes diarios y mensuales.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>Consultar Facturación</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>

          {/* 6. Finanzas & Tesorería (Púrpura / Admin) */}
          {isAdmin && (
            <div
              onClick={() => onNavigate('finance')}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-purple-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center group-hover:scale-105 transition">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="bg-purple-950 text-purple-300 border border-purple-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                  Finanzas & Tesorería
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Cuentas por pagar, escáner de facturas con IA y control de gastos operativos.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-purple-400">
                <span>Ver Flujo Financiero</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          )}

          {/* 7. Nómina LOTTT (Rosa / Fucsia / Admin) */}
          {isAdmin && (
            <div
              onClick={() => onNavigate('payroll')}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-fuchsia-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 flex items-center justify-center group-hover:scale-105 transition">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    LOTTT
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white group-hover:text-fuchsia-300 transition">
                  Nómina LOTTT Bimoneda
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Cálculo quincenal, deducciones de ley (IVSS, FAOV), Cestaticket y recibos PDF.
                </p>
              </div>
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-fuchsia-400">
                <span>Calcular Quincenas</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          )}

          {/* 8. Arqueo y Cierre Z de Caja */}
          <div
            onClick={onOpenShiftModal}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 p-4 rounded-2xl cursor-pointer transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-[11px] font-bold px-2 py-0.5 rounded-full font-mono">
                  Cuadre Z
                </span>
              </div>
              <h4 className="font-bold text-sm text-white group-hover:text-emerald-300 transition">
                Arqueo de Caja & Cierre Z
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Conteo físico en $ y Bs, registro de movimientos y comprobante de cierre de turno.
              </p>
            </div>
            <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Abrir Arqueo</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: RESUMEN OPERATIVO DEL DÍA */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Resumen de Ventas de Hoy</h3>
          </div>
          <button
            onClick={() => onNavigate('sales')}
            className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl">
            <div className="text-xs text-slate-400">Ventas Facturadas Hoy</div>
            <div className="text-2xl font-black text-emerald-400 font-mono tabular-nums mt-1">
              {formatUSD(todaySalesUSD)}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
              {formatVES(todaySalesVES)}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl">
            <div className="text-xs text-slate-400">Tickets / Comprobantes Emitidos</div>
            <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
              {todaySales.length}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Operaciones registradas hoy
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-850 p-4 rounded-xl">
            <div className="text-xs text-slate-400">Efectivo Esperado en Caja</div>
            <div className="text-2xl font-black text-white font-mono tabular-nums mt-1">
              {activeShift ? formatUSD(activeShift.expectedCashUSD) : '$0.00'}
            </div>
            <div className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
              {activeShift ? formatVES(activeShift.expectedCashVES) : '0.00 Bs'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
