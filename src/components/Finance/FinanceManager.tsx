import React, { useState } from 'react';
import { 
  Building2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Truck, 
  CreditCard, 
  Clock, 
  CheckCircle,
  FileSpreadsheet,
  Zap,
  Activity,
  Plus,
  Camera,
  Sparkles
} from 'lucide-react';
import { 
  DebtAccount, 
  DebtPaymentInstallment, 
  SupplierDebt, 
  SupplierDebtInstallment, 
  Supplier, 
  Expense, 
  CashShift, 
  BusinessProfile, 
  Customer 
} from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { ReceivablesTab } from './ReceivablesTab';
import { PayablesTab } from './PayablesTab';
import { ExpensesTab } from './ExpensesTab';
import { InvoiceScannerModal } from './InvoiceScannerModal';

interface FinanceManagerProps {
  debts: DebtAccount[];
  supplierDebts: SupplierDebt[];
  suppliers: Supplier[];
  expenses: Expense[];
  customers: Customer[];
  bcvRate: number;
  activeShift: CashShift | null;
  profile: BusinessProfile;
  onRegisterCustomerInstallment: (debtId: string, installment: DebtPaymentInstallment) => void;
  onAddNewCustomerDebt: (debt: DebtAccount) => void;
  onSaveSupplierDebt: (debt: SupplierDebt, newSupplier?: Supplier) => void;
  onRegisterSupplierPayment: (debtId: string, installment: SupplierDebtInstallment) => void;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenShiftModal?: () => void;
}

export type FinanceTabType = 'receivables' | 'payables' | 'expenses';

export const FinanceManager: React.FC<FinanceManagerProps> = ({
  debts,
  supplierDebts,
  suppliers,
  expenses,
  customers,
  bcvRate,
  activeShift,
  profile,
  onRegisterCustomerInstallment,
  onAddNewCustomerDebt,
  onSaveSupplierDebt,
  onRegisterSupplierPayment,
  onSaveExpense,
  onDeleteExpense,
  onOpenShiftModal
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const [activeTab, setActiveTab] = useState<FinanceTabType>('receivables');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Calculate live global financial position
  const totalReceivablesUSD = debts
    .filter(d => d.status !== 'paid')
    .reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);

  const totalPayablesUSD = supplierDebts
    .filter(d => d.status !== 'paid')
    .reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);

  const totalExpensesUSD = expenses.reduce((acc, exp) => acc + (exp.amountUSD || 0), 0);

  const netBalanceUSD = totalReceivablesUSD - totalPayablesUSD;

  // Pending counts for badges
  const pendingReceivablesCount = debts.filter(d => d.status !== 'paid').length;
  const pendingPayablesCount = supplierDebts.filter(d => d.status !== 'paid').length;

  return (
    <div className="space-y-5 pb-12 max-w-7xl mx-auto text-slate-100">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Finanzas & Tesorería</h1>
          <p className="text-xs text-slate-400 mt-0.5">Control de cuentas por cobrar, cuentas por pagar a proveedores y registro de gastos.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-medium text-xs transition"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>Escanear Factura</span>
          </button>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${activeShift ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Turno de Caja</div>
              {activeShift ? (
                <div className="text-xs font-mono tabular-nums font-semibold text-slate-200">
                  {formatUSD(activeShift.expectedCashUSD)}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Cerrado</div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            <div>
              <div className="text-[10px] text-slate-500 font-medium">Tasa BCV</div>
              <div className="text-xs font-mono tabular-nums font-semibold text-emerald-400">
                {safeRate.toFixed(2)} Bs/$
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Receivables summary */}
        <div 
          onClick={() => setActiveTab('receivables')}
          className={`cursor-pointer bg-slate-900/80 border rounded-xl p-3.5 transition ${
            activeTab === 'receivables' ? 'border-slate-600 bg-slate-850/80 shadow-xs' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" /> Cuentas por Cobrar
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {pendingReceivablesCount} pendientes
            </span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {formatUSD(totalReceivablesUSD)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
            {formatVES(totalReceivablesUSD * safeRate)}
          </div>
        </div>

        {/* Payables summary */}
        <div 
          onClick={() => setActiveTab('payables')}
          className={`cursor-pointer bg-slate-900/80 border rounded-xl p-3.5 transition ${
            activeTab === 'payables' ? 'border-slate-600 bg-slate-850/80 shadow-xs' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" /> Cuentas por Pagar
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {pendingPayablesCount} proveedores
            </span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {formatUSD(totalPayablesUSD)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
            {formatVES(totalPayablesUSD * safeRate)}
          </div>
        </div>

        {/* Expenses summary */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className={`cursor-pointer bg-slate-900/80 border rounded-xl p-3.5 transition ${
            activeTab === 'expenses' ? 'border-slate-600 bg-slate-850/80 shadow-xs' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Registro de Gastos
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              {expenses.length} registros
            </span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {formatUSD(totalExpensesUSD)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
            {formatVES(totalExpensesUSD * safeRate)}
          </div>
        </div>
      </div>

      {/* Unified Tab Switcher */}
      <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
            activeTab === 'receivables'
              ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-750'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cuentas por Cobrar</span>
          {pendingReceivablesCount > 0 && (
            <span className="text-[10px] font-mono text-slate-500">
              ({pendingReceivablesCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
            activeTab === 'payables'
              ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-750'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>Cuentas por Pagar</span>
          {pendingPayablesCount > 0 && (
            <span className="text-[10px] font-mono text-slate-500">
              ({pendingPayablesCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-750'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-rose-400" />
          <span>Gastos de Operación</span>
          {expenses.length > 0 && (
            <span className="text-[10px] font-mono text-slate-500">
              ({expenses.length})
            </span>
          )}
        </button>
      </div>

      {/* Render Active Tab Component */}
      {activeTab === 'receivables' && (
        <ReceivablesTab
          debts={debts}
          customers={customers}
          bcvRate={safeRate}
          profile={profile}
          activeShift={activeShift}
          onRegisterInstallment={onRegisterCustomerInstallment}
          onAddNewDebt={onAddNewCustomerDebt}
        />
      )}

      {activeTab === 'payables' && (
        <PayablesTab
          supplierDebts={supplierDebts}
          suppliers={suppliers}
          bcvRate={safeRate}
          profile={profile}
          activeShift={activeShift}
          onSaveSupplierDebt={onSaveSupplierDebt}
          onRegisterSupplierPayment={onRegisterSupplierPayment}
        />
      )}

      {activeTab === 'expenses' && (
        <ExpensesTab
          expenses={expenses}
          bcvRate={safeRate}
          profile={profile}
          activeShift={activeShift}
          onSaveExpense={onSaveExpense}
          onDeleteExpense={onDeleteExpense}
        />
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
          setActiveTab('payables');
        }}
      />
    </div>
  );
};
