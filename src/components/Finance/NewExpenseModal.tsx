import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Coins, 
  FileText, 
  Tag, 
  Calendar, 
  Building, 
  CreditCard, 
  AlertTriangle, 
  Check, 
  Wallet,
  Zap,
  Home,
  Users,
  ShoppingBag,
  Wrench,
  Scale,
  Truck,
  MoreHorizontal
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethodType, CashShift, Currency } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  bcvRate: number;
  activeShift: CashShift | null;
  onSaveExpense: (expense: Expense) => void;
}

const CATEGORIES: { id: ExpenseCategory; label: string; icon: any; color: string }[] = [
  { id: 'servicios', label: 'Servicios Básicos (Luz/Agua/Net)', icon: Zap, color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { id: 'alquiler', label: 'Alquiler de Local / Galpón', icon: Home, color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { id: 'nomina', label: 'Nómina / Salarios / Anticipos', icon: Users, color: 'text-purple-400 border-purple-500/30 bg-purple-500/10' },
  { id: 'mercancia', label: 'Insumos / Mercancía Menor', icon: ShoppingBag, color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { id: 'mantenimiento', label: 'Mantenimiento & Reparación', icon: Wrench, color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10' },
  { id: 'impuestos', label: 'Impuestos / SENIAT / Alcaldía', icon: Scale, color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
  { id: 'transporte', label: 'Fletes, Gasolina & Delivery', icon: Truck, color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { id: 'varios', label: 'Gastos Varios Operativos', icon: MoreHorizontal, color: 'text-slate-400 border-slate-700 bg-slate-800' }
];

const PRESETS = [
  { desc: 'Pago mensual de Electricidad (Corpoelec)', cat: 'servicios' as ExpenseCategory, method: 'pago_movil' as PaymentMethodType },
  { desc: 'Internet Fibra Óptica Comercial', cat: 'servicios' as ExpenseCategory, method: 'pago_movil' as PaymentMethodType },
  { desc: 'Compra de bolsas plásticas y rollos térmicos 80mm', cat: 'mantenimiento' as ExpenseCategory, method: 'cash_usd' as PaymentMethodType },
  { desc: 'Flete y descarga de mercancía', cat: 'transporte' as ExpenseCategory, method: 'cash_ves' as PaymentMethodType },
  { desc: 'Anticipo semanal de nómina a personal', cat: 'nomina' as ExpenseCategory, method: 'cash_usd' as PaymentMethodType },
  { desc: 'Pago de Aseo Urbano / Patente Municipal', cat: 'impuestos' as ExpenseCategory, method: 'pago_movil' as PaymentMethodType }
];

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({
  isOpen,
  onClose,
  bcvRate,
  activeShift,
  onSaveExpense
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

  const [description, setDescription] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('servicios');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rawAmount, setRawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash_usd');
  const [reference, setReference] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [affectsCashShift, setAffectsCashShift] = useState(true);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Auto configure cash shift impact when changing payment method
  useEffect(() => {
    if (paymentMethod === 'cash_usd' || paymentMethod === 'cash_ves') {
      setAffectsCashShift(true);
    } else {
      setAffectsCashShift(false);
    }
  }, [paymentMethod]);

  if (!isOpen) return null;

  const numAmount = parseFloat(rawAmount) || 0;
  let amountUSD = 0;
  let amountVES = 0;

  if (currency === 'USD') {
    amountUSD = numAmount;
    amountVES = Number((numAmount * safeRate).toFixed(2));
  } else {
    amountVES = numAmount;
    amountUSD = Number((numAmount / safeRate).toFixed(2));
  }

  const isCashMethod = paymentMethod === 'cash_usd' || paymentMethod === 'cash_ves';
  const hasCashWarning = affectsCashShift && !activeShift && isCashMethod;

  const handleSelectPreset = (p: typeof PRESETS[0]) => {
    setDescription(p.desc);
    setCategory(p.cat);
    setPaymentMethod(p.method);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || numAmount <= 0) return;

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date(date + 'T' + new Date().toTimeString().slice(0, 8)).toISOString(),
      category,
      description: description.trim(),
      beneficiary: beneficiary.trim() || undefined,
      amountUSD,
      amountVES,
      currency,
      amountPaid: numAmount,
      bcvRate: safeRate,
      paymentMethod,
      reference: reference.trim() || undefined,
      receiptNumber: receiptNumber.trim() || undefined,
      affectsCashShift: affectsCashShift && isCashMethod && !!activeShift,
      shiftId: (affectsCashShift && isCashMethod && activeShift) ? activeShift.id : undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    onSaveExpense(newExpense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registrar Gasto / Egreso</h2>
              <p className="text-xs text-slate-400">Control de costos operativos con conversión BCV y enlace a caja</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto scrollbar-none flex items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap mr-1">
            Plantillas rápidas:
          </span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="px-2.5 py-1 rounded-md bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 whitespace-nowrap text-[11px] transition"
            >
              {p.desc.split(' ')[0]} {p.desc.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Categoría del Gasto
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-semibold transition ${
                      isSelected
                        ? cat.color + ' ring-1 ring-white/20'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{cat.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description & Beneficiary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Concepto / Descripción <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Recarga de saldo punto de venta, Bolsas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Beneficiario / Proveedor de Servicio
              </label>
              <input
                type="text"
                placeholder="Ej. Corpoelec, Cantv, Chofer..."
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Monto del Egreso <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    currency === 'USD' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  $ Dólares
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('VES')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                    currency === 'VES' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Bs. Bolívares
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xl font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                {currency}
              </div>
            </div>

            {/* Real-time Rate Conversion pill */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Tasa BCV del Día: <strong className="text-slate-200">{safeRate.toFixed(2)} Bs/$</strong></span>
              <span className="font-mono font-semibold text-slate-200">
                {currency === 'USD' ? `Equivale a: ${formatVES(amountVES)}` : `Equivale a: ${formatUSD(amountUSD)}`}
              </span>
            </div>
          </div>

          {/* Payment Method, Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Método de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              >
                <option value="cash_usd">💵 Efectivo Divisas ($)</option>
                <option value="cash_ves">🇻🇪 Efectivo Bolívares (Bs)</option>
                <option value="pago_movil">📲 Pago Móvil</option>
                <option value="punto_venta">💳 Tarjeta / Punto de Venta</option>
                <option value="zelle">⚡ Zelle</option>
                <option value="binance_pay">🪙 Binance Pay</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nro. Ref / Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. REF-4821 / Recibo #12"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Cash Shift impact toggle */}
          {isCashMethod && (
            <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="affects-shift"
                checked={affectsCashShift}
                onChange={(e) => setAffectsCashShift(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
              />
              <label htmlFor="affects-shift" className="text-xs cursor-pointer select-none">
                <span className="font-bold text-amber-300 block">
                  Descontar directamente de la Caja Chica / Turno Activo
                </span>
                <span className="text-slate-400 block mt-0.5">
                  Generará un movimiento de salida (Egreso de Caja) y actualizará el saldo esperado en tiempo real.
                  {activeShift ? (
                    <strong className="text-emerald-400 block mt-0.5">
                      ✓ Turno abierto actual: {activeShift.cashierName} (Caja en $ {formatUSD(activeShift.expectedCashUSD)} | Bs {formatVES(activeShift.expectedCashVES)})
                    </strong>
                  ) : (
                    <strong className="text-rose-400 block mt-0.5">
                      ⚠️ No hay un turno de caja abierto actualmente.
                    </strong>
                  )}
                </span>
              </label>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!description.trim() || numAmount <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-rose-900/40 transition"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Egreso ({formatUSD(amountUSD)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
