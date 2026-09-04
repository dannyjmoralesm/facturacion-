import React, { useState } from 'react';
import { 
  Search, 
  DollarSign, 
  Coins, 
  Wallet, 
  Calendar, 
  Filter, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle, 
  TrendingDown, 
  Zap, 
  Home, 
  Users, 
  ShoppingBag, 
  Wrench, 
  Scale, 
  Truck, 
  MoreHorizontal,
  X,
  CreditCard,
  Building,
  AlertCircle
} from 'lucide-react';
import { Expense, ExpenseCategory, BusinessProfile, CashShift } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { generateExpenseReceiptText } from '../../utils/thermalPrinter';
import { NewExpenseModal } from './NewExpenseModal';

interface ExpensesTabProps {
  expenses: Expense[];
  bcvRate: number;
  profile: BusinessProfile;
  activeShift: CashShift | null;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; icon: any; color: string }> = {
  servicios: { label: 'Servicios Básicos', icon: Zap, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  alquiler: { label: 'Alquiler', icon: Home, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  nomina: { label: 'Nómina & Sueldos', icon: Users, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  mercancia: { label: 'Insumos & Mercancía', icon: ShoppingBag, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  mantenimiento: { label: 'Mantenimiento', icon: Wrench, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  impuestos: { label: 'Impuestos & SENIAT', icon: Scale, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  transporte: { label: 'Transporte & Fletes', icon: Truck, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  varios: { label: 'Gastos Varios', icon: MoreHorizontal, color: 'text-slate-400 border-slate-700 bg-slate-800' }
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  bcvRate,
  profile,
  activeShift,
  onSaveExpense,
  onDeleteExpense
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [voucherText, setVoucherText] = useState<string | null>(null);

  // Time filter logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 86400000 * 7;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredExpenses = expenses.filter(exp => {
    const expTime = new Date(exp.date).getTime();

    // Time filter
    if (timeFilter === 'today' && expTime < todayStart) return false;
    if (timeFilter === 'week' && expTime < weekStart) return false;
    if (timeFilter === 'month' && expTime < monthStart) return false;

    // Category filter
    if (selectedCategory !== 'all' && exp.category !== selectedCategory) return false;

    // Search query
    const s = search.toLowerCase();
    if (s) {
      const matchDesc = exp.description.toLowerCase().includes(s);
      const matchBeneficiary = exp.beneficiary && exp.beneficiary.toLowerCase().includes(s);
      const matchRef = exp.reference && exp.reference.toLowerCase().includes(s);
      if (!matchDesc && !matchBeneficiary && !matchRef) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalExpensesUSD = filteredExpenses.reduce((acc, exp) => acc + (exp.amountUSD || 0), 0);
  const totalExpensesVES = filteredExpenses.reduce((acc, exp) => acc + (exp.amountVES || (exp.amountUSD * safeRate)), 0);

  const cashExpensesUSD = filteredExpenses
    .filter(exp => exp.paymentMethod === 'cash_usd' || exp.paymentMethod === 'cash_ves')
    .reduce((acc, exp) => acc + (exp.amountUSD || 0), 0);

  const bankExpensesUSD = totalExpensesUSD - cashExpensesUSD;

  // Category breakdown
  const categoryTotals: Record<string, number> = {};
  filteredExpenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amountUSD;
  });

  const handlePrintVoucher = (exp: Expense) => {
    const text = generateExpenseReceiptText(exp, profile, profile.defaultThermalSize);
    setVoucherText(text);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Total Gastos Operativos</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-rose-400">
            {formatUSD(totalExpensesUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            ≈ {formatVES(totalExpensesVES)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Gastos desde Caja Chica</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {formatUSD(cashExpensesUSD)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pagados en efectivo / caja registradora
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Gastos Bancarios / Electrónicos</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {formatUSD(bankExpensesUSD)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pago Móvil, Zelle y Transferencias
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">Egresos Registrados</div>
            <div className="text-lg font-black text-white">
              {filteredExpenses.length} <span className="text-xs font-normal text-slate-400">registros</span>
            </div>
          </div>
          <button
            onClick={() => setIsNewExpenseOpen(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-900/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Registrar Gasto / Egreso</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-white text-slate-950 border-white shadow'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Todas las Categorías ({expenses.length})
        </button>

        {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
          const totalInCat = categoryTotals[key] || 0;
          const isSelected = selectedCategory === key;
          const Icon = cat.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap transition ${
                isSelected
                  ? cat.color + ' ring-1 ring-white/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              {totalInCat > 0 && (
                <span className="font-mono text-[10px] opacity-80">
                  ({formatUSD(totalInCat)})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar concepto, beneficiario o ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'all', label: 'Todo el Historial' },
            { id: 'month', label: 'Este Mes' },
            { id: 'week', label: 'Últimos 7 Días' },
            { id: 'today', label: 'Hoy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                timeFilter === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No hay egresos registrados</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? 'No se encontraron gastos con los filtros aplicados.' : 'Registra tus gastos y compras operativas para mantener la rentabilidad al día.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExpenses.map((exp) => {
            const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.varios;
            const Icon = catInfo.icon;
            const expRate = (exp.bcvRate && exp.bcvRate > 0) ? exp.bcvRate : safeRate;

            return (
              <div 
                key={exp.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${catInfo.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{exp.description}</h4>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-300">{catInfo.label}</span>
                        {exp.beneficiary && (
                          <>
                            <span>•</span>
                            <span>{exp.beneficiary}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black font-mono text-rose-400">
                      -{formatUSD(exp.amountUSD)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ≈ -{formatVES(exp.amountVES || (exp.amountUSD * expRate))}
                    </div>
                  </div>
                </div>

                {/* Badges & Meta */}
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-medium">
                    💳 {exp.paymentMethod.toUpperCase()}
                  </span>

                  {exp.reference && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                      Ref: {exp.reference}
                    </span>
                  )}

                  {exp.receiptNumber && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                      Doc: {exp.receiptNumber}
                    </span>
                  )}

                  {exp.affectsCashShift && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-[10px]">
                      ✓ Salida de Caja Chica
                    </span>
                  )}
                </div>

                {exp.notes && (
                  <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 italic">
                    "{exp.notes}"
                  </p>
                )}

                {/* Footer and Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatShortDate(exp.date)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrintVoucher(exp)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Imprimir Vale de Gasto"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Estás seguro de eliminar el gasto "${exp.description}"?`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Expense Modal */}
      <NewExpenseModal
        isOpen={isNewExpenseOpen}
        onClose={() => setIsNewExpenseOpen(false)}
        bcvRate={safeRate}
        activeShift={activeShift}
        onSaveExpense={onSaveExpense}
      />

      {/* Voucher Print Modal */}
      {voucherText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Printer className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">Vale de Egreso / Gasto</h3>
              </div>
              <button
                onClick={() => setVoucherText(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
                {voucherText}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const printWin = window.open('', '', 'width=350,height=600');
                    if (printWin) {
                      printWin.document.write(`
                        <html>
                          <head><title>Vale de Egreso</title></head>
                          <body style="font-family: monospace; white-space: pre-wrap; font-size: 11px; padding: 10px;">
                            ${voucherText}
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                      printWin.focus();
                      printWin.print();
                    }
                  }}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-400" />
                  <span>Imprimir en Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoucherText(null)}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition text-center"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
