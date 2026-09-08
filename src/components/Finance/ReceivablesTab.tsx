import React, { useState, useMemo } from 'react';
import { 
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
  AlertCircle,
  TrendingDown,
  Clock,
  Check,
  X,
  FileText,
  Users,
  Layers,
  ExternalLink,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { DebtAccount, DebtPaymentInstallment, PaymentMethodType, BusinessProfile, Customer, Currency, CashShift } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { createWhatsAppDebtReminder, createWhatsAppCustomerStatementMessage, openWhatsAppLink } from '../../utils/whatsappHelper';
import { generateDebtPaymentReceiptText } from '../../utils/thermalPrinter';
import { CustomerStatementModal } from './CustomerStatementModal';

interface ReceivablesTabProps {
  debts: DebtAccount[];
  customers: Customer[];
  bcvRate: number;
  profile: BusinessProfile;
  activeShift: CashShift | null;
  onRegisterInstallment: (debtId: string, installment: DebtPaymentInstallment) => void;
  onAddNewDebt: (debt: DebtAccount) => void;
}

const BANKS_VE = [
  '0102 - Banco de Venezuela',
  '0134 - Banesco',
  '0105 - Banco Mercantil',
  '0108 - Banco Provincial (BBVA)',
  '0172 - Bancamiga',
  '0114 - Banco del Caribe (Bancaribe)',
  '0169 - Mi Banco',
  '0191 - Banco Nacional de Crédito (BNC)'
];

export const ReceivablesTab: React.FC<ReceivablesTabProps> = ({
  debts,
  customers,
  bcvRate,
  profile,
  activeShift,
  onRegisterInstallment,
  onAddNewDebt
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [viewMode, setViewMode] = useState<'by_customer' | 'by_invoice'>('by_customer');

  // Customer Statement Modal State
  const [statementCustomerModal, setStatementCustomerModal] = useState<{
    customerName: string;
    customerDoc: string;
    customerPhone?: string;
    debts: DebtAccount[];
  } | null>(null);

  // Selected debt for installment modal
  const [selectedDebt, setSelectedDebt] = useState<DebtAccount | null>(null);
  const [installmentAmountUSD, setInstallmentAmountUSD] = useState('');
  const [installmentCurrency, setInstallmentCurrency] = useState<'USD' | 'VES'>('USD');
  const [installmentMethod, setInstallmentMethod] = useState<PaymentMethodType>('pago_movil');
  const [installmentRef, setInstallmentRef] = useState('');
  const [installmentBank, setInstallmentBank] = useState(BANKS_VE[0]);
  const [installmentReceiptText, setInstallmentReceiptText] = useState<string | null>(null);

  // History detail modal
  const [historyDebt, setHistoryDebt] = useState<DebtAccount | null>(null);

  // New Manual Debt Modal
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [newDebtConcept, setNewDebtConcept] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtCurrency, setNewDebtCurrency] = useState<Currency>('USD');
  const [newDebtDueDays, setNewDebtDueDays] = useState(15);

  const nowTime = new Date().getTime();

  // Group debts by customer for consolidated views
  const customerGroups = useMemo(() => {
    const map = new Map<string, {
      customerId: string;
      customerName: string;
      customerDoc: string;
      customerPhone?: string;
      debts: DebtAccount[];
    }>();

    debts.forEach(d => {
      const key = (d.customerDoc || d.customerId || d.customerName).trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          customerId: d.customerId,
          customerName: d.customerName,
          customerDoc: d.customerDoc,
          customerPhone: d.customerPhone,
          debts: []
        });
      }
      map.get(key)!.debts.push(d);
    });

    return Array.from(map.values()).map(grp => {
      const pending = grp.debts.filter(d => d.status !== 'paid');
      const totalPendingUSD = pending.reduce((sum, d) => sum + (d.remainingDebtUSD || 0), 0);
      const totalOriginalUSD = grp.debts.reduce((sum, d) => sum + (d.originalDebtUSD || 0), 0);
      const totalPaidUSD = grp.debts.reduce((sum, d) => sum + (d.paidDebtUSD || 0), 0);
      const overdue = pending.filter(d => d.dueDate && new Date(d.dueDate).getTime() < nowTime).length;

      return {
        ...grp,
        pendingDebtsCount: pending.length,
        overdueDebtsCount: overdue,
        totalPendingUSD,
        totalOriginalUSD,
        totalPaidUSD,
        isFullyPaid: pending.length === 0
      };
    });
  }, [debts, nowTime]);

  // Filtered customer groups
  const filteredCustomerGroups = useMemo(() => {
    return customerGroups.filter(grp => {
      const isOverdue = grp.overdueDebtsCount > 0;
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'pending' && !grp.isFullyPaid) ||
        (filterStatus === 'paid' && grp.isFullyPaid) ||
        (filterStatus === 'overdue' && isOverdue);

      const s = search.toLowerCase();
      const matchesSearch = 
        !s || 
        grp.customerName.toLowerCase().includes(s) || 
        grp.customerDoc.toLowerCase().includes(s) ||
        (grp.customerPhone && grp.customerPhone.toLowerCase().includes(s)) ||
        grp.debts.some(d => d.invoiceNumber.toLowerCase().includes(s));

      return matchesStatus && matchesSearch;
    });
  }, [customerGroups, filterStatus, search]);

  // Filtered debts (by invoice)
  const filteredDebts = useMemo(() => {
    return debts.filter(d => {
      const isOverdue = d.dueDate && new Date(d.dueDate).getTime() < nowTime && d.status !== 'paid';
      const matchesStatus = 
        filterStatus === 'all' || 
        (filterStatus === 'pending' && d.status !== 'paid') ||
        (filterStatus === 'paid' && d.status === 'paid') ||
        (filterStatus === 'overdue' && isOverdue);

      const s = search.toLowerCase();
      const matchesSearch = 
        !s || 
        d.customerName.toLowerCase().includes(s) || 
        d.customerDoc.toLowerCase().includes(s) || 
        d.invoiceNumber.toLowerCase().includes(s);

      return matchesStatus && matchesSearch;
    });
  }, [debts, filterStatus, search, nowTime]);

  // Calculate high-level summary metrics
  const totalReceivableUSD = debts
    .filter(d => d.status !== 'paid')
    .reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);
  const totalReceivableVES = totalReceivableUSD * safeRate;

  const totalCollectedUSD = debts.reduce((acc, d) => acc + (d.paidDebtUSD || 0), 0);

  const pendingCount = debts.filter(d => d.status !== 'paid').length;
  const overdueCount = debts.filter(d => d.dueDate && new Date(d.dueDate).getTime() < nowTime && d.status !== 'paid').length;
  const paidCount = debts.filter(d => d.status === 'paid').length;

  const pendingCustomersCount = customerGroups.filter(g => !g.isFullyPaid).length;

  // Open Installment Modal
  const handleOpenInstallmentModal = (debt: DebtAccount) => {
    setSelectedDebt(debt);
    setInstallmentCurrency('USD');
    setInstallmentAmountUSD(debt.remainingDebtUSD.toFixed(2));
    setInstallmentMethod('pago_movil');
    setInstallmentRef('');
    setInstallmentReceiptText(null);
  };

  // Open Customer Detail Modal
  const handleOpenCustomerDetail = (customerName: string, customerDoc: string, customerPhone?: string) => {
    const customerDebts = debts.filter(d => 
      (d.customerDoc && d.customerDoc.toLowerCase() === customerDoc.toLowerCase()) || 
      (d.customerName && d.customerName.toLowerCase() === customerName.toLowerCase())
    );
    setStatementCustomerModal({
      customerName,
      customerDoc,
      customerPhone,
      debts: customerDebts
    });
  };

  // Handle Installment Submit
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const rawVal = parseFloat(installmentAmountUSD) || 0;
    if (rawVal <= 0) return;

    let finalUSD = 0;
    let finalVES = 0;

    if (installmentCurrency === 'USD') {
      finalUSD = Number(rawVal.toFixed(2));
      finalVES = Number((rawVal * safeRate).toFixed(2));
    } else {
      finalVES = Number(rawVal.toFixed(2));
      finalUSD = Number((rawVal / safeRate).toFixed(2));
    }

    const installment: DebtPaymentInstallment = {
      id: `inst-${Date.now()}`,
      debtId: selectedDebt.id,
      date: new Date().toISOString(),
      amountUSD: finalUSD,
      amountVES: finalVES,
      rateApplied: safeRate,
      method: installmentMethod,
      reference: installmentRef.trim() || undefined,
      bank: installmentMethod === 'pago_movil' || installmentMethod === 'punto_venta' ? installmentBank : undefined
    };

    onRegisterInstallment(selectedDebt.id, installment);

    const updatedDebt = {
      ...selectedDebt,
      paidDebtUSD: selectedDebt.paidDebtUSD + finalUSD,
      remainingDebtUSD: Math.max(0, selectedDebt.remainingDebtUSD - finalUSD)
    };

    const receiptText = generateDebtPaymentReceiptText(
      updatedDebt,
      installment,
      profile,
      profile.defaultThermalSize
    );
    setInstallmentReceiptText(receiptText);
  };

  // Create manual new debt
  const handleCreateManualDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const client = customers.find(c => c.id === selectedCustomerId);
    if (!client) return;

    const numAmt = parseFloat(newDebtAmount) || 0;
    if (numAmt <= 0) return;

    const amountUSD = newDebtCurrency === 'USD' ? numAmt : Number((numAmt / safeRate).toFixed(2));
    const invNum = `FIO-${Date.now().toString().slice(-4)}`;

    const newDebt: DebtAccount = {
      id: `debt-manual-${Date.now()}`,
      saleId: `manual-credit-${Date.now()}`,
      customerId: client.id,
      customerName: client.name,
      customerDoc: `${client.docType}-${client.docNumber}`,
      customerPhone: client.phone || '',
      invoiceNumber: invNum,
      originalDebtUSD: amountUSD,
      paidDebtUSD: 0,
      remainingDebtUSD: amountUSD,
      dateCreated: new Date().toISOString(),
      dueDate: new Date(Date.now() + newDebtDueDays * 86400000).toISOString(),
      status: 'pending',
      installments: [],
      notes: newDebtConcept.trim() || 'Crédito manual otorgado'
    };

    onAddNewDebt(newDebt);
    setIsNewDebtOpen(false);
    setNewDebtAmount('');
    setNewDebtConcept('');
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Total por Cobrar</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400">
            {formatUSD(totalReceivableUSD)}
          </div>
          <div className="text-xs font-mono text-slate-400 mt-1">
            ≈ {formatVES(totalReceivableVES)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Cuentas Pendientes</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {pendingCount} <span className="text-xs font-normal text-slate-400">clientes</span>
          </div>
          <div className="text-xs text-amber-400 font-semibold mt-1">
            {overdueCount > 0 ? `⚠️ ${overdueCount} vencidas por cobrar` : 'Todas al día'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-1">
            <span>Total Recaudado / Cobrado</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-blue-400">
            {formatUSD(totalCollectedUSD)}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {paidCount} facturas liquidadas
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-1">Tasa de Conversión BCV</div>
            <div className="text-lg font-black font-mono text-white">
              {safeRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs/$</span>
            </div>
          </div>
          <button
            onClick={() => setIsNewDebtOpen(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Fiado Manual</span>
          </button>
        </div>
      </div>

      {/* Filter, View Switcher and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('by_customer')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'by_customer'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Por Clientes</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300">
                {customerGroups.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('by_invoice')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'by_invoice'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Por Facturas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300">
                {(debts?.length || 0)}
              </span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por cliente, cédula o factura..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full lg:w-auto overflow-x-auto">
          {[
            { id: 'pending', label: 'Pendientes', count: pendingCount },
            { id: 'overdue', label: 'Vencidas', count: overdueCount },
            { id: 'paid', label: 'Pagadas', count: paidCount },
            { id: 'all', label: 'Todas', count: (debts?.length || 0) }
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
                filterStatus === tab.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* VIEW: BY CUSTOMER (CONSOLIDATED) */}
      {viewMode === 'by_customer' && (
        <>
          {filteredCustomerGroups.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No se encontraron clientes</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search ? 'Intenta buscar con otros términos o cambia el filtro de estado.' : 'No hay clientes registrados en esta sección.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCustomerGroups.map((group) => {
                const pctPaid = group.totalOriginalUSD > 0 
                  ? Math.min(100, (group.totalPaidUSD / group.totalOriginalUSD) * 100) 
                  : 0;
                const isOverdue = group.overdueDebtsCount > 0;
                const isPaid = group.isFullyPaid;

                return (
                  <div
                    key={group.customerDoc || group.customerName}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-sm transition space-y-4 ${
                      isPaid 
                        ? 'border-slate-800 opacity-80' 
                        : isOverdue 
                          ? 'border-rose-500/40 bg-rose-950/10' 
                          : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isOverdue 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDetail(group.customerName, group.customerDoc, group.customerPhone)}
                            className="font-bold text-white text-sm hover:text-emerald-400 transition text-left flex items-center gap-2"
                          >
                            <span>{group.customerName}</span>
                            {isPaid ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                AL DÍA
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                {group.overdueDebtsCount} VENCIDAS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                PENDIENTE
                              </span>
                            )}
                          </button>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{group.customerDoc}</span>
                            {group.customerPhone && (
                              <>
                                <span>•</span>
                                <span>{group.customerPhone}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{group.debts.length} {group.debts.length === 1 ? 'cuenta' : 'cuentas'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Saldo pendiente</div>
                        <div className={`text-lg font-black font-mono ${isPaid ? 'text-slate-400' : 'text-emerald-400'}`}>
                          {formatUSD(group.totalPendingUSD)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          ≈ {formatVES(group.totalPendingUSD * safeRate)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Abonado: <strong className="text-slate-200">{formatUSD(group.totalPaidUSD)}</strong> de {formatUSD(group.totalOriginalUSD)}</span>
                        <span className="font-mono">{pctPaid.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent Debt Preview Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {group.debts.slice(0, 3).map((d) => (
                        <span 
                          key={d.id} 
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            d.status === 'paid'
                              ? 'bg-slate-950 border-slate-800 text-slate-500'
                              : d.dueDate && new Date(d.dueDate).getTime() < nowTime
                                ? 'bg-rose-950/40 border-rose-800/40 text-rose-300'
                                : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          #{d.invoiceNumber}: {formatUSD(d.remainingDebtUSD)}
                        </span>
                      ))}
                      {group.debts.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          +{group.debts.length - 3} más
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between pt-2 gap-2 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleOpenCustomerDetail(group.customerName, group.customerDoc, group.customerPhone)}
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold py-1.5 px-2.5 rounded-lg hover:bg-emerald-950/30 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Ver Detalle & Estado de Cuenta</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Button with preconfigured message */}
                        <button
                          type="button"
                          onClick={() => {
                            const msg = createWhatsAppCustomerStatementMessage(
                              group.customerName,
                              group.customerDoc,
                              group.debts,
                              safeRate,
                              profile
                            );
                            openWhatsAppLink(group.customerPhone, msg);
                          }}
                          title="Enviar estado de cuenta e instrucciones de pago por WhatsApp"
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700 hover:border-emerald-500"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WhatsApp</span>
                        </button>

                        {!isPaid && group.debts.find(d => d.status !== 'paid') && (
                          <button
                            type="button"
                            onClick={() => {
                              const pendingDebt = group.debts.find(d => d.status !== 'paid');
                              if (pendingDebt) handleOpenInstallmentModal(pendingDebt);
                            }}
                            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
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
        </>
      )}

      {/* VIEW: BY INVOICE / DOCUMENT */}
      {viewMode === 'by_invoice' && (
        <>
          {filteredDebts.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No se encontraron cuentas por cobrar</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {search ? 'Intenta buscar con otros términos o cambia el filtro activo.' : '¡Excelente! No hay registros de fiados en este estado.'}
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
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                          isPaid 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : isOverdue 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenCustomerDetail(debt.customerName, debt.customerDoc, debt.customerPhone)}
                            className="font-bold text-white text-sm hover:text-emerald-400 transition text-left flex items-center gap-2"
                          >
                            <span>{debt.customerName}</span>
                            {isPaid ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                PAGADO
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                VENCIDO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                                PENDIENTE
                              </span>
                            )}
                          </button>
                          <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{debt.customerDoc}</span>
                            <span>•</span>
                            <span>Doc #{debt.invoiceNumber}</span>
                            {debt.customerPhone && (
                              <>
                                <span>•</span>
                                <span>{debt.customerPhone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Resta por cobrar</div>
                        <div className={`text-lg font-black font-mono ${isPaid ? 'text-slate-400' : 'text-emerald-400'}`}>
                          {formatUSD(debt.remainingDebtUSD)}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          ≈ {formatVES(debt.remainingDebtUSD * safeRate)}
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Abonado: <strong className="text-slate-200">{formatUSD(debt.paidDebtUSD)}</strong> de {formatUSD(debt.originalDebtUSD)}</span>
                        <span className="font-mono">{pctPaid.toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            isPaid ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                    </div>

                    {/* Dates & Notes */}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Emisión: {formatShortDate(debt.dateCreated)}</span>
                      </div>
                      {debt.dueDate && (
                        <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-rose-400 font-bold' : ''}`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Vence: {formatShortDate(debt.dueDate)}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHistoryDebt(debt)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2.5 rounded-lg hover:bg-slate-800 transition"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Historial ({debt.installments?.length || 0})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenCustomerDetail(debt.customerName, debt.customerDoc, debt.customerPhone)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 py-1.5 px-2.5 rounded-lg hover:bg-slate-800 transition"
                          title="Ver detalle del cliente y estado de cuenta consolidado"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Estado</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* WhatsApp Direct reminder */}
                        <button
                          type="button"
                          onClick={() => {
                            const msg = createWhatsAppDebtReminder(debt, safeRate, profile);
                            openWhatsAppLink(debt.customerPhone, msg);
                          }}
                          title="Enviar enlace a WhatsApp con saldo, tasa BCV e instrucciones de pago"
                          className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition"
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => handleOpenInstallmentModal(debt)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Registrar Abono</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Manual New Debt Modal */}
      {isNewDebtOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <User className="w-5 h-5" />
                <h3 className="font-bold text-white">Registrar Fiado / Crédito Manual</h3>
              </div>
              <button
                onClick={() => setIsNewDebtOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualDebt} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Seleccionar Cliente <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.docType}-{c.docNumber}) {c.phone ? `• ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Concepto / Detalle
                </label>
                <input
                  type="text"
                  placeholder="Ej. Víveres varios para pagar fin de mes..."
                  value={newDebtConcept}
                  onChange={(e) => setNewDebtConcept(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Monto a Fiar <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setNewDebtCurrency('USD')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${newDebtCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                    >
                      $ Dólares
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewDebtCurrency('VES')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${newDebtCurrency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      Bs Bolívares
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={newDebtAmount}
                  onChange={(e) => setNewDebtAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-lg font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Plazo de Pago
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[7, 15, 30, 45].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewDebtDueDays(d)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        newDebtDueDays === d ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {d} días
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewDebtOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newDebtAmount || parseFloat(newDebtAmount) <= 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition"
                >
                  Guardar Fiado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Installment Payment Modal */}
      {selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-8">
            {installmentReceiptText ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-5 h-5" />
                    <h3 className="font-bold text-white text-sm">¡Abono Registrado con Éxito!</h3>
                  </div>
                  <button
                    onClick={() => setSelectedDebt(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {installmentReceiptText}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const printWin = window.open('', '', 'width=350,height=600');
                      if (printWin) {
                        printWin.document.write(`
                          <html>
                            <head><title>Recibo de Abono</title></head>
                            <body style="font-family: monospace; white-space: pre-wrap; font-size: 11px; padding: 10px;">
                              ${installmentReceiptText}
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
                    <Printer className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Imprimir Vale</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedDebt(null)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition text-center"
                  >
                    Listo
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">Registrar Cobro / Abono</h3>
                    <p className="text-[11px] text-slate-400">{selectedDebt.customerName} • Doc #{selectedDebt.invoiceNumber}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDebt(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-5 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Deudor</div>
                    <div className="text-lg font-black font-mono text-emerald-400">{formatUSD(selectedDebt.remainingDebtUSD)}</div>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-300">
                    <div>≈ {formatVES(selectedDebt.remainingDebtUSD * safeRate)}</div>
                    <div className="text-[10px] text-slate-500">Tasa: {safeRate.toFixed(2)} Bs/$</div>
                  </div>
                </div>

                <form onSubmit={handleInstallmentSubmit} className="p-5 space-y-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 uppercase">Monto a Cobrar</label>
                      <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setInstallmentCurrency('USD');
                            setInstallmentAmountUSD(selectedDebt.remainingDebtUSD.toFixed(2));
                          }}
                          className={`px-2 py-0.5 rounded font-bold ${installmentCurrency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                        >
                          $
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInstallmentCurrency('VES');
                            setInstallmentAmountUSD((selectedDebt.remainingDebtUSD * safeRate).toFixed(2));
                          }}
                          className={`px-2 py-0.5 rounded font-bold ${installmentCurrency === 'VES' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                        >
                          Bs
                        </button>
                      </div>
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={installmentAmountUSD}
                      onChange={(e) => setInstallmentAmountUSD(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-base font-bold font-mono text-white focus:outline-none focus:border-emerald-500"
                    />

                    {/* Quick presets */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (installmentCurrency === 'USD') setInstallmentAmountUSD(selectedDebt.remainingDebtUSD.toFixed(2));
                          else setInstallmentAmountUSD((selectedDebt.remainingDebtUSD * safeRate).toFixed(2));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-300 border border-slate-700"
                      >
                        100% Saldo Total
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (installmentCurrency === 'USD') setInstallmentAmountUSD((selectedDebt.remainingDebtUSD / 2).toFixed(2));
                          else setInstallmentAmountUSD(((selectedDebt.remainingDebtUSD * safeRate) / 2).toFixed(2));
                        }}
                        className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-semibold text-slate-300 border border-slate-700"
                      >
                        50% Mitad
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Método</label>
                      <select
                        value={installmentMethod}
                        onChange={(e) => setInstallmentMethod(e.target.value as PaymentMethodType)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="pago_movil">📲 Pago Móvil</option>
                        <option value="punto_venta">💳 Punto de Venta</option>
                        <option value="cash_usd">💵 Efectivo $</option>
                        <option value="cash_ves">🇻🇪 Efectivo Bs</option>
                        <option value="zelle">⚡ Zelle</option>
                        <option value="binance_pay">🪙 Binance Pay</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Referencia</label>
                      <input
                        type="text"
                        placeholder="Ej. 192844"
                        value={installmentRef}
                        onChange={(e) => setInstallmentRef(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {(installmentMethod === 'cash_usd' || installmentMethod === 'cash_ves') && (
                    <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
                      ✓ Se sumará automáticamente a la <strong>Caja Chica del Turno Activo</strong> en tiempo real.
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDebt(null)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!installmentAmountUSD || parseFloat(installmentAmountUSD) <= 0}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-emerald-900/30"
                    >
                      Confirmar Abono
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Historial de Abonos</h3>
                <p className="text-xs text-slate-400">{historyDebt.customerName} • Doc #{historyDebt.invoiceNumber}</p>
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
                  No hay abonos registrados para esta cuenta aún.
                </div>
              ) : (
                historyDebt.installments.map((inst, i) => (
                  <div key={inst.id || i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">
                        {formatUSD(inst.amountUSD)} <span className="text-slate-400 font-mono text-[11px]">(~{formatVES(inst.amountVES)})</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {formatShortDate(inst.date)} • Método: {inst.method.toUpperCase()} {inst.reference ? `• Ref: ${inst.reference}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                        ABONADO
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

      {/* Customer Statement & WhatsApp Direct Modal */}
      {statementCustomerModal && (
        <CustomerStatementModal
          isOpen={true}
          onClose={() => setStatementCustomerModal(null)}
          customerName={statementCustomerModal.customerName}
          customerDoc={statementCustomerModal.customerDoc}
          customerPhone={statementCustomerModal.customerPhone}
          debts={statementCustomerModal.debts}
          bcvRate={safeRate}
          profile={profile}
          onOpenInstallment={(debt) => {
            setStatementCustomerModal(null);
            handleOpenInstallmentModal(debt);
          }}
        />
      )}
    </div>
  );
};
