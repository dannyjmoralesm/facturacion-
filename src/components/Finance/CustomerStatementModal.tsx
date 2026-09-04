import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Smartphone, 
  Copy, 
  Check, 
  DollarSign, 
  Coins, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Plus, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  CheckCircle2
} from 'lucide-react';
import { DebtAccount, BusinessProfile, Customer } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { createWhatsAppCustomerStatementMessage, openWhatsAppLink } from '../../utils/whatsappHelper';

interface CustomerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerDoc: string;
  customerPhone?: string;
  debts: DebtAccount[];
  bcvRate: number;
  profile: BusinessProfile;
  onOpenInstallment: (debt: DebtAccount) => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerDoc,
  customerPhone = '',
  debts,
  bcvRate,
  profile,
  onOpenInstallment
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const [customPhone, setCustomPhone] = useState(customerPhone);
  const [copied, setCopied] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);

  if (!isOpen) return null;

  const nowTime = new Date().getTime();
  const pendingDebts = debts.filter(d => d.status !== 'paid');
  const paidDebts = debts.filter(d => d.status === 'paid');

  const totalOriginalUSD = debts.reduce((acc, d) => acc + (d.originalDebtUSD || 0), 0);
  const totalPaidUSD = debts.reduce((acc, d) => acc + (d.paidDebtUSD || 0), 0);
  const totalPendingUSD = pendingDebts.reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);
  const totalPendingVES = totalPendingUSD * safeRate;

  const overdueCount = pendingDebts.filter(d => d.dueDate && new Date(d.dueDate).getTime() < nowTime).length;

  // Generated WhatsApp text
  const messageText = createWhatsAppCustomerStatementMessage(
    customerName,
    customerDoc,
    debts,
    safeRate,
    profile
  );

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const targetPhone = customPhone.trim() || customerPhone;
    openWhatsAppLink(targetPhone, messageText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">{customerName}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
                  {customerDoc}
                </span>
              </div>
              <p className="text-xs text-slate-400">Detalle de Cuentas por Cobrar & Estado de Cuenta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto">
          
          {/* Metrics summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Saldo Pendiente</span>
                <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-400">
                {formatUSD(totalPendingUSD)}
              </div>
              <div className="text-xs font-mono text-slate-400 mt-0.5">
                ≈ {formatVES(totalPendingVES)}
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tasa BCV Oficial</span>
                <span className="p-1 rounded bg-blue-500/10 text-blue-400">
                  <Coins className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-white">
                {safeRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs/$</span>
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Calculado en tiempo real
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Estado de Cuentas</span>
                <span className="p-1 rounded bg-amber-500/10 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                {pendingDebts.length} {pendingDebts.length === 1 ? 'cuenta activa' : 'cuentas activas'}
              </div>
              <div className="text-xs mt-0.5">
                {overdueCount > 0 ? (
                  <span className="text-rose-400 font-semibold">⚠️ {overdueCount} vencidas</span>
                ) : (
                  <span className="text-emerald-400 font-semibold">✓ Al día</span>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Action Box */}
          <div className="bg-emerald-950/30 border-2 border-emerald-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Notificar Cobro por WhatsApp</h4>
                  <p className="text-xs text-slate-300">
                    Envía el enlace directo con el detalle de saldo, tasa BCV e instrucciones de pago.
                  </p>
                </div>
              </div>

              {/* Phone input field if needed */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="04121234567"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 w-36 sm:w-40"
                  />
                </div>
              </div>
            </div>

            {/* Configured payment summary chips */}
            <div className="bg-slate-950/70 p-3 rounded-xl border border-emerald-900/40 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Instrucciones de Pago Incluidas en el Mensaje:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                {profile?.pagoMovilPhone && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Pago Móvil:</strong> {profile.pagoMovilBank || 'Banco'} • Tel: {profile.pagoMovilPhone} • RIF: {profile.pagoMovilId}</span>
                  </div>
                )}
                {profile?.zelleEmail && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Zelle:</strong> {profile.zelleEmail}</span>
                  </div>
                )}
                {profile?.binancePayId && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span><strong>Binance Pay:</strong> {profile.binancePayId}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-emerald-400">✓</span>
                  <span><strong>Efectivo / POS:</strong> En tienda / caja</span>
                </div>
              </div>
            </div>

            {/* Actions: Send WhatsApp & Copy */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/40 transition"
              >
                <Smartphone className="w-4 h-4" />
                <span>Abrir WhatsApp con Enlace Directo</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowFullPreview(!showFullPreview)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                title="Ver vista previa del mensaje"
              >
                {showFullPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Message Preview */}
            {showFullPreview && (
              <div className="mt-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Vista Previa del Mensaje de WhatsApp:
                </div>
                <div className="font-mono text-xs text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto select-all leading-relaxed">
                  {messageText}
                </div>
              </div>
            )}
          </div>

          {/* List of customer's debts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Historial de Facturas & Fiados ({debts.length})</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Total acumulado: {formatUSD(totalOriginalUSD)}
              </span>
            </div>

            {debts.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400">
                Este cliente no tiene cuentas de fiado registradas.
              </div>
            ) : (
              <div className="space-y-2.5">
                {debts.map((debt) => {
                  const isPaid = debt.status === 'paid';
                  const isOverdue = debt.dueDate && new Date(debt.dueDate).getTime() < nowTime && !isPaid;

                  return (
                    <div 
                      key={debt.id}
                      className={`p-3.5 rounded-xl border transition ${
                        isPaid 
                          ? 'bg-slate-950 border-slate-800/80 opacity-75' 
                          : isOverdue 
                            ? 'bg-rose-950/20 border-rose-500/30' 
                            : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">Doc #{debt.invoiceNumber}</span>
                            {isPaid ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                PAGADO
                              </span>
                            ) : isOverdue ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                VENCIDO
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                PENDIENTE
                              </span>
                            )}
                            {debt.notes && (
                              <span className="text-slate-400 text-xs truncate max-w-xs">({debt.notes})</span>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                            <span>Emisión: {formatShortDate(debt.dateCreated)}</span>
                            {debt.dueDate && (
                              <span className={isOverdue ? 'text-rose-400 font-semibold' : ''}>
                                Vence: {formatShortDate(debt.dueDate)}
                              </span>
                            )}
                            <span>Abonado: {formatUSD(debt.paidDebtUSD)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-black font-mono text-emerald-400">
                              {formatUSD(debt.remainingDebtUSD)}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400">
                              ≈ {formatVES(debt.remainingDebtUSD * safeRate)}
                            </div>
                          </div>

                          {!isPaid && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenInstallment(debt);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Abonar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
