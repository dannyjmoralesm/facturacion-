import React, { useState } from 'react';
import { 
  Search, 
  DollarSign, 
  Coins, 
  Truck, 
  Calendar, 
  Share2, 
  CheckCircle, 
  Plus, 
  History, 
  Printer,
  Smartphone,
  AlertCircle,
  Clock,
  Check,
  X,
  FileText,
  Building,
  CreditCard,
  Camera,
  Sparkles
} from 'lucide-react';
import { Supplier, SupplierDebt, SupplierDebtInstallment, PaymentMethodType, BusinessProfile, CashShift } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { NewSupplierDebtModal } from './NewSupplierDebtModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { InvoiceScannerModal } from './InvoiceScannerModal';
import { createWhatsAppSupplierPaymentMessage, openWhatsAppLink } from '../../utils/whatsappHelper';

interface PayablesTabProps {
  supplierDebts: SupplierDebt[];
  suppliers: Supplier[];
  bcvRate: number;
  profile: BusinessProfile;
  activeShift: CashShift | null;
  onSaveSupplierDebt: (debt: SupplierDebt, newSupplier?: Supplier) => void;
  onRegisterSupplierPayment: (debtId: string, installment: SupplierDebtInstallment) => void;
}

export const PayablesTab: React.FC<PayablesTabProps> = ({
  supplierDebts,
  suppliers,
  bcvRate,
  profile,
  activeShift,
  onSaveSupplierDebt,
  onRegisterSupplierPayment
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // Modals
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [paymentDebt, setPaymentDebt] = useState<SupplierDebt | null>(null);
  const [historyDebt, setHistoryDebt] = useState<SupplierDebt | null>(null);

  const nowTime = new Date().getTime();

  // Filter debts
  const filteredDebts = supplierDebts.filter(d => {
    const isOverdue = d.dueDate && new Date(d.dueDate).getTime() < nowTime && d.status !== 'paid';
    const matchesStatus = 
      filterStatus === 'all' || 
      (filterStatus === 'pending' && d.status !== 'paid') ||
      (filterStatus === 'paid' && d.status === 'paid') ||
      (filterStatus === 'overdue' && isOverdue);

    const s = search.toLowerCase();
    const matchesSearch = 
      !s || 
      d.supplierName.toLowerCase().includes(s) || 
      d.supplierRif.toLowerCase().includes(s) || 
      d.invoiceNumber.toLowerCase().includes(s) ||
      (d.description && d.description.toLowerCase().includes(s));

    return matchesStatus && matchesSearch;
  });

  // Financial Metrics
  const totalPayableUSD = supplierDebts
    .filter(d => d.status !== 'paid')
    .reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);
  const totalPayableVES = totalPayableUSD * safeRate;

  const totalPaidToSuppliersUSD = supplierDebts.reduce((acc, d) => acc + (d.paidDebtUSD || 0), 0);

  const pendingCount = supplierDebts.filter(d => d.status !== 'paid').length;
  const overdueCount = supplierDebts.filter(d => d.dueDate && new Date(d.dueDate).getTime() < nowTime && d.status !== 'paid').length;
  const paidCount = supplierDebts.filter(d => d.status === 'paid').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Total por Pagar (Proveedores)</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-amber-400">
            {formatUSD(totalPayableUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            ≈ {formatVES(totalPayableVES)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Facturas Pendientes</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {pendingCount} <span className="text-xs font-normal text-slate-400">facturas</span>
          </div>
          <div className="text-xs text-rose-400 font-semibold mt-1">
            {overdueCount > 0 ? `⚠️ ${overdueCount} con plazo vencido` : 'Créditos vigentes'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Total Pagado a Proveedores</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {formatUSD(totalPaidToSuppliersUSD)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {paidCount} facturas canceladas en total
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">Tasa de Cambio BCV</div>
            <div className="text-lg font-black font-mono text-white">
              {safeRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs/$</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 text-xs font-bold transition shadow-sm"
              title="Escanear factura física o foto con IA"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear Factura IA</span>
            </button>
            <button
              onClick={() => setIsNewDebtOpen(true)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-900/30 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por proveedor, RIF o Nro Factura..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'pending', label: 'Por Pagar', count: pendingCount },
            { id: 'overdue', label: 'Vencidas', count: overdueCount },
            { id: 'paid', label: 'Pagadas', count: paidCount },
            { id: 'all', label: 'Todas', count: supplierDebts.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                filterStatus === tab.id ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-900 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Debts Grid */}
      {filteredDebts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Truck className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No hay cuentas por pagar en esta sección</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search ? 'Intenta modificar el término de búsqueda.' : 'No tienes facturas pendientes de pago con proveedores registradas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDebts.map((debt) => {
            const pctPaid = debt.originalDebtUSD > 0 
              ? Math.min(100, (debt.paidDebtUSD / debt.originalDebtUSD) * 100) 
              : 0;
            const isOverdue = debt.dueDate && new Date(debt.dueDate).getTime() < nowTime && debt.status !== 'paid';
            const isPaid = debt.status === 'paid';

            return (
              <div 
                key={debt.id} 
                className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                  isPaid 
                    ? 'border-slate-800 opacity-80' 
                    : isOverdue 
                      ? 'border-rose-500/40 bg-rose-950/10' 
                      : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top bar */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${
                      isPaid 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : isOverdue 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{debt.supplierName}</span>
                        {isPaid ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            CANCELADA
                          </span>
                        ) : isOverdue ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                            VENCIDA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            POR PAGAR
                          </span>
                        )}
                      </h4>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-slate-300">{debt.supplierRif}</span>
                        <span>•</span>
                        <span>Factura #{debt.invoiceNumber}</span>
                        {debt.controlNumber && (
                          <>
                            <span>•</span>
                            <span>Ctrl: {debt.controlNumber}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Saldo Pendiente</div>
                    <div className={`text-lg font-black font-mono ${isPaid ? 'text-slate-400' : 'text-amber-400'}`}>
                      {formatUSD(debt.remainingDebtUSD)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ≈ {formatVES(debt.remainingDebtUSD * safeRate)}
                    </div>
                  </div>
                </div>

                {/* Category & Description */}
                {(debt.category || debt.description) && (
                  <div className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="font-bold text-amber-400">{debt.category}: </span>
                    <span>{debt.description || 'Sin descripción adicional'}</span>
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Pagado: <strong className="text-slate-200">{formatUSD(debt.paidDebtUSD)}</strong> de {formatUSD(debt.originalDebtUSD)}</span>
                    <span className="font-mono">{pctPaid.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        isPaid ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${pctPaid}%` }}
                    />
                  </div>
                </div>

                {/* Dates & Terms */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Emisión: {formatShortDate(debt.dateCreated)}</span>
                  </div>
                  {debt.dueDate && (
                    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Vencimiento: {formatShortDate(debt.dueDate)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHistoryDebt(debt)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2.5 rounded-lg hover:bg-slate-800 transition"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Historial de Pagos ({debt.installments?.length || 0})</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {debt.supplierPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          const lastInst = debt.installments[debt.installments.length - 1] || {
                            amountUSD: debt.paidDebtUSD,
                            amountVES: debt.paidDebtUSD * safeRate,
                            rateApplied: safeRate,
                            method: 'pago_movil'
                          };
                          const msg = createWhatsAppSupplierPaymentMessage(debt, lastInst, profile);
                          openWhatsAppLink(debt.supplierPhone, msg);
                        }}
                        title="Enviar comprobante por WhatsApp"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                      >
                        <Smartphone className="w-4 h-4" />
                      </button>
                    )}

                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => setPaymentDebt(debt)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-900/30 transition"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>+ Registrar Pago</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Supplier Debt Modal */}
      <NewSupplierDebtModal
        isOpen={isNewDebtOpen}
        onClose={() => setIsNewDebtOpen(false)}
        bcvRate={safeRate}
        suppliers={suppliers}
        onSaveSupplierDebt={onSaveSupplierDebt}
      />

      {/* Supplier Payment Modal */}
      <SupplierPaymentModal
        isOpen={!!paymentDebt}
        onClose={() => setPaymentDebt(null)}
        debt={paymentDebt}
        bcvRate={safeRate}
        activeShift={activeShift}
        profile={profile}
        onRegisterPayment={(debtId, installment) => {
          onRegisterSupplierPayment(debtId, installment);
        }}
      />

      {/* History Modal */}
      {historyDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Historial de Pagos a Proveedor</h3>
                <p className="text-xs text-slate-400">{historyDebt.supplierName} • Factura #{historyDebt.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setHistoryDebt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-80 overflow-y-auto">
              {!historyDebt.installments || historyDebt.installments.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No hay pagos registrados para esta factura aún.
                </div>
              ) : (
                historyDebt.installments.map((inst, i) => (
                  <div key={inst.id || i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">
                        {formatUSD(inst.amountUSD)} <span className="text-slate-400 font-mono text-[11px]">(~{formatVES(inst.amountVES)})</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {formatShortDate(inst.date)} • Método: {inst.method.toUpperCase()}
                        {inst.reference ? ` • Ref: ${inst.reference}` : ''}
                        {inst.bank ? ` • ${inst.bank}` : ''}
                      </div>
                      {inst.affectsCashShift && (
                        <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                          ✓ Deducido de la Caja Chica
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                        PAGADO
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
              <button
                onClick={() => setHistoryDebt(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Scanner Modal with Gemini OCR */}
      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        suppliers={suppliers}
        bcvRate={safeRate}
        onSaveDebt={(debtData, newSupplierData) => {
          let newlyCreatedSup: Supplier | undefined = undefined;
          let supId = debtData.supplierId;

          if (newSupplierData || debtData.supplierId === 'new') {
            const genId = `sup-${Date.now()}`;
            supId = genId;
            newlyCreatedSup = {
              id: genId,
              name: newSupplierData?.name || debtData.supplierName,
              rif: newSupplierData?.rif || debtData.supplierRif,
              phone: newSupplierData?.phone || '',
              contactPerson: newSupplierData?.contactPerson || undefined,
              totalDebtUSD: debtData.originalDebtUSD,
              createdAt: new Date().toISOString()
            };
          }

          const newDebt: SupplierDebt = {
            id: `sup-debt-${Date.now()}`,
            supplierId: supId,
            supplierName: debtData.supplierName,
            supplierRif: debtData.supplierRif,
            invoiceNumber: debtData.invoiceNumber,
            controlNumber: debtData.controlNumber || undefined,
            category: debtData.category,
            description: debtData.description,
            originalDebtUSD: debtData.originalDebtUSD,
            paidDebtUSD: 0,
            remainingDebtUSD: debtData.originalDebtUSD,
            dateCreated: new Date(debtData.dateCreated).toISOString(),
            dueDate: new Date(debtData.dueDate).toISOString(),
            status: 'pending',
            installments: [],
            notes: debtData.notes || undefined
          };

          onSaveSupplierDebt(newDebt, newlyCreatedSup);
        }}
      />
    </div>
  );
};
