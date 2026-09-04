import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  DollarSign, 
  Coins, 
  User, 
  Calendar, 
  Share2, 
  CheckCircle, 
  Plus, 
  History, 
  Printer,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { DebtAccount, DebtPaymentInstallment, PaymentMethodType, BusinessProfile } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { createWhatsAppDebtReminder, openWhatsAppLink } from '../../utils/whatsappHelper';
import { generateDebtPaymentReceiptText } from '../../utils/thermalPrinter';

interface DebtsManagerProps {
  debts: DebtAccount[];
  bcvRate: number;
  profile: BusinessProfile;
  onRegisterInstallment: (debtId: string, installment: DebtPaymentInstallment) => void;
}

export const DebtsManager: React.FC<DebtsManagerProps> = ({
  debts,
  bcvRate,
  profile,
  onRegisterInstallment
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  
  // Selected debt for installment modal
  const [selectedDebt, setSelectedDebt] = useState<DebtAccount | null>(null);
  const [installmentAmountUSD, setInstallmentAmountUSD] = useState('');
  const [installmentCurrency, setInstallmentCurrency] = useState<'USD' | 'VES'>('USD');
  const [installmentMethod, setInstallmentMethod] = useState<PaymentMethodType>('pago_movil');
  const [installmentRef, setInstallmentRef] = useState('');
  const [installmentBank, setInstallmentBank] = useState('0102 - Banco de Venezuela');

  // Receipt modal for installment
  const [installmentReceiptText, setInstallmentReceiptText] = useState<string | null>(null);

  const filteredDebts = debts.filter(d => {
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && d.status !== 'paid') ||
      (filterStatus === 'paid' && d.status === 'paid');

    const s = search.toLowerCase();
    const matchesSearch = 
      !s || 
      d.customerName.toLowerCase().includes(s) || 
      d.customerDoc.toLowerCase().includes(s) || 
      d.invoiceNumber.toLowerCase().includes(s);

    return matchesStatus && matchesSearch;
  });

  const totalPendingUSD = debts
    .filter(d => d.status !== 'paid')
    .reduce((sum, d) => sum + d.remainingDebtUSD, 0);

  const totalPendingVES = totalPendingUSD * bcvRate;

  const handleOpenInstallmentModal = (debt: DebtAccount) => {
    setSelectedDebt(debt);
    setInstallmentAmountUSD(debt.remainingDebtUSD.toString());
    setInstallmentCurrency('USD');
    setInstallmentMethod('pago_movil');
    setInstallmentRef('');
  };

  const handleSubmitInstallment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const rawVal = parseFloat(installmentAmountUSD);
    if (isNaN(rawVal) || rawVal <= 0) return;

    let amountUSD = 0;
    let amountVES = 0;

    const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

    if (installmentCurrency === 'USD') {
      amountUSD = Number(rawVal.toFixed(2));
      amountVES = Number((amountUSD * safeRate).toFixed(2));
    } else {
      amountVES = Number(rawVal.toFixed(2));
      amountUSD = Number((amountVES / safeRate).toFixed(2));
    }

    const installment: DebtPaymentInstallment = {
      id: `inst-${Date.now()}`,
      debtId: selectedDebt.id,
      date: new Date().toISOString(),
      amountUSD,
      amountVES,
      rateApplied: safeRate,
      method: installmentMethod,
      reference: installmentRef.trim() || undefined,
      bank: installmentBank
    };

    onRegisterInstallment(selectedDebt.id, installment);

    // Show receipt
    const receipt = generateDebtPaymentReceiptText(selectedDebt, installment, profile);
    setInstallmentReceiptText(receipt);
    setSelectedDebt(null);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header & KPI Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Libreta de Fiados (Cuentas por Cobrar)</h1>
            <p className="text-xs text-slate-400">
              Deudas protegidas en USD contra la devaluación. Cobro exacto en Bs. según la tasa BCV del día del abono.
            </p>
          </div>
        </div>

        {/* Grand Total Pending Badge */}
        <div className="bg-slate-900 border border-amber-500/30 p-3.5 rounded-2xl flex items-center gap-3">
          <div>
            <div className="text-[10px] text-amber-400 uppercase font-bold">Total por Cobrar en la Calle</div>
            <div className="text-lg sm:text-xl font-black text-white font-mono leading-none mt-0.5">
              {formatUSD(totalPendingUSD)}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              Equiv. Hoy: {formatVES(totalPendingVES)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, cédula o factura..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes / Por Cobrar
          </button>
          <button
            onClick={() => setFilterStatus('paid')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Saldadas
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({debts.length})
          </button>
        </div>
      </div>

      {/* Debts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDebts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No hay deudas en esta vista</p>
          </div>
        ) : (
          filteredDebts.map(debt => {
            const isPaid = debt.status === 'paid';
            const remainingVES = debt.remainingDebtUSD * bcvRate;

            return (
              <div
                key={debt.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-slate-400">
                      Doc: <strong className="text-slate-200">{debt.invoiceNumber}</strong>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isPaid 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : debt.status === 'partially_paid' 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {isPaid ? '✓ Pagado' : debt.status === 'partially_paid' ? 'Abonado' : '⏳ Pendiente'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="font-bold text-sm text-white truncate">{debt.customerName}</div>
                    <div className="text-xs text-slate-400">{debt.customerDoc} | Tel: {debt.customerPhone || 'N/A'}</div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Fecha: {formatShortDate(debt.dateCreated)}
                    </div>
                  </div>

                  {/* Amounts Breakdown */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 mb-3">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Deuda Original:</span>
                      <span className="font-mono text-slate-300">{formatUSD(debt.originalDebtUSD)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Total Abonado:</span>
                      <span className="font-mono text-emerald-400">{formatUSD(debt.paidDebtUSD)}</span>
                    </div>

                    <div className="h-px bg-slate-800" />

                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-bold">Saldo Restante</div>
                        <div className="text-lg font-black text-rose-400 font-mono">
                          {formatUSD(debt.remainingDebtUSD)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400">En Bs. a Tasa BCV ({(bcvRate || 86.45).toFixed(2)})</div>
                        <div className="text-sm font-bold text-slate-200 font-mono">
                          {formatVES(remainingVES)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Installments History */}
                  {debt.installments.length > 0 && (
                    <div className="mb-3 text-[11px] space-y-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold block">Historial de Abonos ({debt.installments.length}):</span>
                      {debt.installments.map((inst, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{formatShortDate(inst.date).split(',')[0]} ({inst.method})</span>
                          <span className="font-mono text-emerald-400">{formatUSD(inst.amountUSD)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => openWhatsAppLink(debt.customerPhone, createWhatsAppDebtReminder(debt, bcvRate, profile))}
                    className="p-2 bg-slate-800 hover:bg-emerald-950 text-emerald-400 rounded-lg text-xs flex items-center gap-1 transition"
                    title="Enviar recordatorio de cobro por WhatsApp con tasa del día"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Recordatorio</span>
                  </button>

                  {!isPaid && (
                    <button
                      onClick={() => handleOpenInstallmentModal(debt)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Abono</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register Installment Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 my-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-base">Registrar Abono a Cuenta</h3>
              <button onClick={() => setSelectedDebt(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmitInstallment} className="p-4 sm:p-5 space-y-3.5">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400">Cliente: <strong className="text-white">{selectedDebt.customerName}</strong></div>
                <div className="text-slate-400">Factura origen: <span className="font-mono text-slate-200">{selectedDebt.invoiceNumber}</span></div>
                <div className="flex justify-between pt-1 border-t border-slate-850">
                  <span className="text-slate-400">Saldo Pendiente:</span>
                  <span className="font-mono font-bold text-rose-400">
                    {formatUSD(selectedDebt.remainingDebtUSD)} ({formatVES(selectedDebt.remainingDebtUSD * bcvRate)})
                  </span>
                </div>
              </div>

              {/* Amount input with Currency toggle */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">Monto del Abono:</label>
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setInstallmentCurrency('USD');
                        setInstallmentAmountUSD((selectedDebt?.remainingDebtUSD ?? 0).toFixed(2));
                      }}
                      className={`px-2 py-0.5 rounded font-bold ${installmentCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      USD ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInstallmentCurrency('VES');
                        const rate = bcvRate || 86.45;
                        setInstallmentAmountUSD(((selectedDebt?.remainingDebtUSD ?? 0) * rate).toFixed(2));
                      }}
                      className={`px-2 py-0.5 rounded font-bold ${installmentCurrency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      VES (Bs)
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                    {installmentCurrency === 'USD' ? '$' : 'Bs.'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={installmentAmountUSD}
                    onChange={(e) => setInstallmentAmountUSD(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Method */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Método de Cobro:</label>
                <select
                  value={installmentMethod}
                  onChange={(e: any) => setInstallmentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="pago_movil">Pago Móvil (Bolívares)</option>
                  <option value="cash_usd">Efectivo Divisas ($)</option>
                  <option value="cash_ves">Efectivo Bolívares (Bs)</option>
                  <option value="punto_venta">Punto de Venta (Tarjeta)</option>
                  <option value="zelle">Zelle</option>
                  <option value="binance_pay">Binance Pay USDT</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nro. de Referencia / Banco:</label>
                <input
                  type="text"
                  value={installmentRef}
                  onChange={(e) => setInstallmentRef(e.target.value)}
                  placeholder="Ej. Ref 849102 - Banesco"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDebt(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Procesar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal for Installment */}
      {installmentReceiptText && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-4 text-slate-100 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm">Comprobante de Abono Emitido</h3>
              <button onClick={() => setInstallmentReceiptText(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="bg-amber-50 text-slate-900 p-4 rounded-lg font-mono text-xs border border-amber-200">
              <pre className="whitespace-pre-wrap leading-tight">{installmentReceiptText}</pre>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setInstallmentReceiptText(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
