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
    <div className="space-y-6 pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Finanzas & Tesorería</h1>
              <p className="text-xs text-slate-400">Control unificado de Cuentas por Cobrar, Cuentas por Pagar y Registro de Gastos</p>
            </div>
          </div>
        </div>

        {/* Live Cash Shift Status Pill & Scanner Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>Escanear Factura IA</span>
          </button>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="relative">
              <div className={`w-2.5 h-2.5 rounded-full ${activeShift ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <span>Caja Chica Turno Activo</span>
                {activeShift && <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">En Vivo</span>}
              </div>
              {activeShift ? (
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span className="text-emerald-400">{formatUSD(activeShift.expectedCashUSD)}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-blue-400">{formatVES(activeShift.expectedCashVES)}</span>
                </div>
              ) : (
                <div className="text-xs text-amber-400 font-semibold">
                  Sin turno abierto
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tasa BCV Oficial</div>
              <div className="text-xs font-mono font-bold text-slate-200">
                {safeRate.toFixed(2)} Bs/$
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Net Balance Quick Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receivables summary */}
        <div 
          onClick={() => setActiveTab('receivables')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-4 transition ${
            activeTab === 'receivables' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ArrowDownRight className="w-4 h-4" /> Cuentas por Cobrar
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
              {pendingReceivablesCount} pendientes
            </span>
          </div>
          <div className="text-xl font-black font-mono text-white">
            {formatUSD(totalReceivablesUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            ≈ {formatVES(totalReceivablesUSD * safeRate)}
          </div>
        </div>

        {/* Payables summary */}
        <div 
          onClick={() => setActiveTab('payables')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-4 transition ${
            activeTab === 'payables' ? 'border-amber-500/50 ring-1 ring-amber-500/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-amber-400">
              <ArrowUpRight className="w-4 h-4" /> Cuentas por Pagar
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
              {pendingPayablesCount} proveedores
            </span>
          </div>
          <div className="text-xl font-black font-mono text-white">
            {formatUSD(totalPayablesUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            ≈ {formatVES(totalPayablesUSD * safeRate)}
          </div>
        </div>

        {/* Expenses summary */}
        <div 
          onClick={() => setActiveTab('expenses')}
          className={`cursor-pointer bg-slate-900 border rounded-2xl p-4 transition ${
            activeTab === 'expenses' ? 'border-rose-500/50 ring-1 ring-rose-500/20 shadow-md' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 text-rose-400">
              <TrendingDown className="w-4 h-4" /> Registro de Gastos
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">
              {expenses.length} egresos
            </span>
          </div>
          <div className="text-xl font-black font-mono text-white">
            {formatUSD(totalExpensesUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-0.5">
            ≈ {formatVES(totalExpensesUSD * safeRate)}
          </div>
        </div>
      </div>

      {/* 3 Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('receivables')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'receivables'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Cuentas por Cobrar (Fiados)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'receivables' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {pendingReceivablesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('payables')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'payables'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Cuentas por Pagar (Proveedores)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'payables' ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {pendingPayablesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Registro de Gastos & Egresos</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
            activeTab === 'expenses' ? 'bg-rose-800 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {expenses.length}
          </span>
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
