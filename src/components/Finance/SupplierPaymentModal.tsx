import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Coins, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Wallet, 
  Building, 
  Share2, 
  Printer,
  Smartphone
} from 'lucide-react';
import { SupplierDebt, SupplierDebtInstallment, PaymentMethodType, CashShift, BusinessProfile } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { generateSupplierPaymentReceiptText } from '../../utils/thermalPrinter';
import { createWhatsAppSupplierPaymentMessage, openWhatsAppLink } from '../../utils/whatsappHelper';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: SupplierDebt | null;
  bcvRate: number;
  activeShift: CashShift | null;
  profile: BusinessProfile;
  onRegisterPayment: (debtId: string, installment: SupplierDebtInstallment) => void;
}

const BANKS_VE = [
  '0102 - Banco de Venezuela',
  '0134 - Banesco',
  '0105 - Banco Mercantil',
  '0108 - Banco Provincial (BBVA)',
  '0172 - Bancamiga',
  '0114 - Banco del Caribe (Bancaribe)',
  '0169 - Mi Banco',
  '0115 - Banco Exterior',
  '0191 - Banco Nacional de Crédito (BNC)'
];

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  debt,
  bcvRate,
  activeShift,
  profile,
  onRegisterPayment
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

  const [paymentCurrency, setPaymentCurrency] = useState<'USD' | 'VES'>('USD');
  const [rawAmount, setRawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('pago_movil');
  const [reference, setReference] = useState('');
  const [selectedBank, setSelectedBank] = useState(BANKS_VE[0]);
  const [affectsCashShift, setAffectsCashShift] = useState(false);
  const [notes, setNotes] = useState('');

  // Receipt modal state after successful payment
  const [receiptText, setReceiptText] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      setRawAmount(debt.remainingDebtUSD.toFixed(2));
      setPaymentCurrency('USD');
      setPaymentMethod('pago_movil');
      setReference('');
      setNotes('');
      setReceiptText(null);
    }
  }, [debt]);

  useEffect(() => {
    if (paymentMethod === 'cash_usd' || paymentMethod === 'cash_ves') {
      setAffectsCashShift(true);
    } else {
      setAffectsCashShift(false);
    }
  }, [paymentMethod]);

  if (!isOpen || !debt) return null;

  const numAmount = parseFloat(rawAmount) || 0;
  let amountUSD = 0;
  let amountVES = 0;

  if (paymentCurrency === 'USD') {
    amountUSD = Number(numAmount.toFixed(2));
    amountVES = Number((numAmount * safeRate).toFixed(2));
  } else {
    amountVES = Number(numAmount.toFixed(2));
    amountUSD = Number((numAmount / safeRate).toFixed(2));
  }

  const isCash = paymentMethod === 'cash_usd' || paymentMethod === 'cash_ves';

  const handleCurrencyToggle = (curr: 'USD' | 'VES') => {
    setPaymentCurrency(curr);
    if (curr === 'USD') {
      setRawAmount(debt.remainingDebtUSD.toFixed(2));
    } else {
      setRawAmount((debt.remainingDebtUSD * safeRate).toFixed(2));
    }
  };

  const handleSetPercent = (pct: number) => {
    const targetUSD = debt.remainingDebtUSD * (pct / 100);
    if (paymentCurrency === 'USD') {
      setRawAmount(targetUSD.toFixed(2));
    } else {
      setRawAmount((targetUSD * safeRate).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || amountUSD <= 0) return;

    const installment: SupplierDebtInstallment = {
      id: `sup-inst-${Date.now()}`,
      debtId: debt.id,
      date: new Date().toISOString(),
      amountUSD,
      amountVES,
      rateApplied: safeRate,
      method: paymentMethod,
      reference: reference.trim() || undefined,
      bank: (paymentMethod === 'pago_movil' || paymentMethod === 'punto_venta') ? selectedBank : undefined,
      affectsCashShift: affectsCashShift && isCash && !!activeShift,
      shiftId: (affectsCashShift && isCash && activeShift) ? activeShift.id : undefined,
      notes: notes.trim() || undefined
    };

    onRegisterPayment(debt.id, installment);

    // Generate receipt text for thermal or sharing
    const updatedDebt = {
      ...debt,
      paidDebtUSD: debt.paidDebtUSD + amountUSD,
      remainingDebtUSD: Math.max(0, debt.remainingDebtUSD - amountUSD)
    };

    const text = generateSupplierPaymentReceiptText(
      updatedDebt,
      installment,
      profile,
      profile.defaultThermalSize
    );
    setReceiptText(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Receipt View after payment */}
        {receiptText ? (
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-5 h-5" />
                <h3 className="font-bold text-white">¡Abono Registrado Exitosamente!</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thermal Print Preview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-72 overflow-y-auto">
              {receiptText}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  const printWin = window.open('', '', 'width=350,height=600');
                  if (printWin) {
                    printWin.document.write(`
                      <html>
                        <head><title>Comprobante de Pago Proveedor</title></head>
                        <body style="font-family: monospace; white-space: pre-wrap; font-size: 11px; padding: 10px;">
                          ${receiptText}
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                    printWin.focus();
                    printWin.print();
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Vale Térmico</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const msg = createWhatsAppSupplierPaymentMessage(
                    debt,
                    { amountUSD, amountVES, rateApplied: safeRate, method: paymentMethod, reference },
                    profile
                  );
                  openWhatsAppLink(debt.supplierPhone, msg);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Enviar Comprobante WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Cerrar y Volver a Finanzas
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Registrar Abono a Proveedor</h2>
                  <p className="text-xs text-slate-400">{debt.supplierName} • Factura #{debt.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Debt summary Banner */}
            <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Saldo Pendiente Actual</div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {formatUSD(debt.remainingDebtUSD)}
                </div>
              </div>
              <div className="text-right font-mono text-xs">
                <div className="text-slate-400">En Bolívares (Tasa {safeRate.toFixed(2)}):</div>
                <div className="font-bold text-slate-200 text-sm">
                  {formatVES(debt.remainingDebtUSD * safeRate)}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Currency & Quick Buttons */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Monto a Pagar / Abonar <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleCurrencyToggle('USD')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        paymentCurrency === 'USD' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      $ Dólares
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCurrencyToggle('VES')}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition ${
                        paymentCurrency === 'VES' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xl font-bold font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                    {paymentCurrency}
                  </div>
                </div>

                {/* Quick % buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Atajos:</span>
                  {[
                    { label: '100% Saldo Total', val: 100 },
                    { label: '50% Mitad', val: 50 },
                    { label: '25% Cuarto', val: 25 }
                  ].map((btn) => (
                    <button
                      key={btn.val}
                      type="button"
                      onClick={() => handleSetPercent(btn.val)}
                      className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-[11px] font-semibold text-slate-300 border border-slate-700/80 transition"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                  <span>Tasa BCV Aplicada: <strong className="text-slate-200">{safeRate.toFixed(2)} Bs/$</strong></span>
                  <span className="font-mono font-semibold text-slate-200">
                    {paymentCurrency === 'USD' ? `Equivale a: ${formatVES(amountVES)}` : `Equivale a: ${formatUSD(amountUSD)}`}
                  </span>
                </div>
              </div>

              {/* Payment Method, Bank & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="pago_movil">📲 Pago Móvil</option>
                    <option value="punto_venta">💳 Transferencia / Punto de Venta</option>
                    <option value="cash_usd">💵 Efectivo Divisas ($)</option>
                    <option value="cash_ves">🇻🇪 Efectivo Bolívares (Bs)</option>
                    <option value="zelle">⚡ Zelle</option>
                    <option value="binance_pay">🪙 Binance Pay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Nro. de Referencia / Transacción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 984210"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {(paymentMethod === 'pago_movil' || paymentMethod === 'punto_venta') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Banco de Origen / Destino
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    {BANKS_VE.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cash Shift deduction toggle */}
              {isCash && (
                <div className="bg-amber-950/30 border border-amber-800/40 p-3.5 rounded-xl flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="affects-shift-sup"
                    checked={affectsCashShift}
                    onChange={(e) => setAffectsCashShift(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="affects-shift-sup" className="text-xs cursor-pointer select-none">
                    <span className="font-bold text-amber-300 block">
                      Descontar de la Caja Chica / Turno Activo
                    </span>
                    <span className="text-slate-400 block mt-0.5">
                      Generará un movimiento de salida (Egreso a Proveedor) y deducirá los saldos de caja en tiempo real.
                    </span>
                  </label>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas / Observación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Abono realizado por transferencia Banesco..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
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
                  disabled={numAmount <= 0 || amountUSD <= 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Pago ({formatUSD(amountUSD)})</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
