import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  DollarSign, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { Customer, DocumentType, BusinessProfile } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { createWhatsAppCustomerStatementMessage, openWhatsAppLink } from '../../utils/whatsappHelper';

interface CustomerManagerProps {
  customers: Customer[];
  bcvRate: number;
  profile: BusinessProfile;
  onSaveCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerForPOS?: (customer: Customer) => void;
  onOpenCustomerDebts?: (customer: Customer) => void;
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  bcvRate,
  profile,
  onSaveCustomer,
  onDeleteCustomer,
  onSelectCustomerForPOS,
  onOpenCustomerDebts
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_debt' | 'solvent'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [docType, setDocType] = useState<DocumentType>('V');
  const [docNumber, setDocNumber] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [creditLimitUSD, setCreditLimitUSD] = useState('');
  const [notes, setNotes] = useState('');

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = customers.length;
    const withDebt = customers.filter(c => (c.totalDebtUSD || 0) > 0);
    const withFiscal = customers.filter(c => c.direccionFiscal && c.direccionFiscal.trim().length > 5);
    const totalDebtUSD = withDebt.reduce((sum, c) => sum + (c.totalDebtUSD || 0), 0);
    const totalDebtVES = totalDebtUSD * bcvRate;

    return {
      total,
      withDebtCount: withDebt.length,
      withFiscalCount: withFiscal.length,
      totalDebtUSD,
      totalDebtVES
    };
  }, [customers, bcvRate]);

  // Filtered List
  const filteredCustomers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return customers.filter(c => {
      // Filter status
      const debt = c.totalDebtUSD || 0;
      if (filterType === 'with_debt' && debt <= 0.01) return false;
      if (filterType === 'solvent' && debt > 0.01) return false;

      // Filter search
      if (!q) return true;
      const fullDoc = `${c.docType || 'V'}-${c.docNumber || ''}`.toLowerCase();
      const matchDoc = fullDoc.includes(q) || (c.docNumber && c.docNumber.toLowerCase().includes(q));
      const matchName = c.name && c.name.toLowerCase().includes(q);
      const matchPhone = c.phone && c.phone.toLowerCase().includes(q);
      const matchFiscal = c.direccionFiscal && c.direccionFiscal.toLowerCase().includes(q);
      const matchAddr = c.address && c.address.toLowerCase().includes(q);

      return matchDoc || matchName || matchPhone || matchFiscal || matchAddr;
    });
  }, [customers, search, filterType]);

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setDocType('V');
    setDocNumber('');
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDireccionFiscal('');
    setCreditLimitUSD('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setDocType(c.docType || 'V');
    setDocNumber(c.docNumber || '');
    setName(c.name || '');
    setPhone(c.phone || '');
    setEmail(c.email || '');
    setAddress(c.address || '');
    setDireccionFiscal(c.direccionFiscal || c.address || '');
    setCreditLimitUSD(c.creditLimitUSD ? c.creditLimitUSD.toString() : '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !docNumber.trim()) return;

    const cleanFiscal = direccionFiscal.trim() || address.trim() || 'Av. Principal, Local Comercial';

    const customerToSave: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      docType,
      docNumber: docNumber.trim().toUpperCase(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || cleanFiscal,
      direccionFiscal: cleanFiscal,
      creditLimitUSD: creditLimitUSD ? parseFloat(creditLimitUSD) || undefined : undefined,
      totalDebtUSD: editingCustomer ? editingCustomer.totalDebtUSD : 0,
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
      notes: notes.trim() || undefined
    };

    onSaveCustomer(customerToSave);
    setIsModalOpen(false);
  };

  const handleSendWhatsAppStatement = (c: Customer) => {
    if (!c.phone) {
      alert('El cliente no tiene registrado un número telefónico.');
      return;
    }
    const docStr = `${c.docType || 'V'}-${c.docNumber || ''}`;
    const msg = createWhatsAppCustomerStatementMessage(c.name, docStr, [], bcvRate, profile);
    openWhatsAppLink(c.phone, msg);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Directorio de Clientes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestión formal de clientes, direcciones fiscales obligatorias para facturación y créditos.
          </p>
        </div>

        <button
          id="btn-new-customer"
          type="button"
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Total Clientes</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums">{metrics.total}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Registrados en el sistema</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Con Dirección Fiscal</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums">{metrics.withFiscalCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Listos para factura legal</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Con Deuda / Fiado</div>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums">{metrics.withDebtCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cuentas por cobrar activas</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="text-xs text-slate-400 font-medium mb-1">Total por Cobrar</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">{formatUSD(metrics.totalDebtUSD)}</div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">{formatVES(metrics.totalDebtVES)}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-customer-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nombre, RIF, Cédula, Teléfono o Dirección Fiscal..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('with_debt')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                filterType === 'with_debt' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Con Deuda</span>
              {metrics.withDebtCount > 0 && (
                <span className="bg-white/20 px-1 rounded-full text-[10px]">{metrics.withDebtCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('solvent')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterType === 'solvent' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Solventes
            </button>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-lg transition font-medium ${
                viewMode === 'cards' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tarjetas
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg transition font-medium ${
                viewMode === 'table' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Customer List Display */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No se encontraron clientes</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? `No hay coincidencias para "${search}". Intente con otro término o cédula.`
              : 'Aún no tiene clientes registrados con este filtro.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Cliente</span>
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(customer => {
            const hasDebt = (customer.totalDebtUSD || 0) > 0.01;
            const fullDoc = `${customer.docType || 'V'}-${customer.docNumber || '00000000'}`;
            const fiscalAddr = customer.direccionFiscal || customer.address || 'No registrada';

            return (
              <div 
                key={customer.id} 
                className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-md group relative"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-950/80 text-blue-400 border border-blue-800/60">
                        {fullDoc}
                      </span>
                      {customer.docType === 'J' && (
                        <span className="text-[10px] bg-purple-950/70 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                          Jurídico
                        </span>
                      )}
                    </div>

                    {hasDebt ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Deuda: {formatUSD(customer.totalDebtUSD)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Solvente
                      </span>
                    )}
                  </div>

                  {/* Customer Name */}
                  <h3 className="font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                    {customer.name}
                  </h3>

                  {/* Contact Info */}
                  <div className="mt-2 space-y-1 text-xs text-slate-400">
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>

                  {/* DIRECCIÓN FISCAL DESTACADA (REQUISITO EXPLÍCITO) */}
                  <div className="mt-3 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/90 text-xs">
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Dirección Fiscal (SENIAT / Facturas):</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">
                      {fiscalAddr}
                    </p>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    {customer.phone && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppStatement(customer)}
                        className="p-1.5 rounded-lg bg-emerald-950/60 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-800/50 transition"
                        title="Enviar Estado de Cuenta / Mensaje por WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onSelectCustomerForPOS && (
                      <button
                        type="button"
                        onClick={() => onSelectCustomerForPOS(customer)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-950/60 text-blue-300 hover:bg-blue-900/80 border border-blue-800/50 text-xs font-semibold transition"
                        title="Iniciar Venta POS con este cliente"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Vender</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(customer)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      title="Editar Cliente y Dirección Fiscal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {customer.id !== 'cust-final' && !hasDebt && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar al cliente ${customer.name}?`)) {
                            onDeleteCustomer(customer.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Doc / RIF</th>
                  <th className="py-3 px-4">Nombre / Razón Social</th>
                  <th className="py-3 px-4">Dirección Fiscal (SENIAT)</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4 text-right">Saldo Deuda</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map(customer => {
                  const hasDebt = (customer.totalDebtUSD || 0) > 0.01;
                  const fullDoc = `${customer.docType || 'V'}-${customer.docNumber || '00000000'}`;
                  const fiscalAddr = customer.direccionFiscal || customer.address || 'No registrada';

                  return (
                    <tr key={customer.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-950 text-blue-400 rounded border border-blue-900/60">
                          {fullDoc}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {customer.name}
                        {customer.id === 'cust-final' && (
                          <span className="ml-2 text-[10px] text-slate-400 font-normal">
                            (Mostrador)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 max-w-xs truncate">
                          <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate" title={fiscalAddr}>{fiscalAddr}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs font-mono text-slate-300">
                        {customer.phone || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasDebt ? (
                          <div>
                            <div className="font-mono font-bold text-rose-400 text-xs">
                              {formatUSD(customer.totalDebtUSD)}
                            </div>
                            <div className="font-mono text-[10px] text-slate-400">
                              {formatVES(customer.totalDebtUSD * bcvRate)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-emerald-400 text-xs font-semibold">
                            ✓ Solvente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          {customer.phone && (
                            <button
                              type="button"
                              onClick={() => handleSendWhatsAppStatement(customer)}
                              className="p-1 rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800/50"
                              title="WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onSelectCustomerForPOS && (
                            <button
                              type="button"
                              onClick={() => onSelectCustomerForPOS(customer)}
                              className="px-2 py-1 rounded bg-blue-950 text-blue-300 hover:bg-blue-900 border border-blue-800/50 text-xs font-medium"
                              title="Vender en POS"
                            >
                              POS
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(customer)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
                            title="Editar"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {customer.id !== 'cust-final' && !hasDebt && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar al cliente ${customer.name}?`)) {
                                  onDeleteCustomer(customer.id);
                                }
                              }}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Building2 className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-bold text-base text-white">
                    {editingCustomer ? 'Editar Ficha de Cliente' : 'Registrar Nuevo Cliente'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Datos fiscales válidos para emisión de facturas oficiales y comprobantes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Document Type and Number */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Tipo Doc:
                  </label>
                  <select
                    value={docType}
                    onChange={(e: any) => setDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="V">V - Venezolano</option>
                    <option value="J">J - Jurídico / RIF</option>
                    <option value="E">E - Extranjero</option>
                    <option value="G">G - Gobierno</option>
                    <option value="P">P - Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Número de Cédula o RIF: *
                  </label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="Ej. 19876543 o 40912345-0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Legal Name / Company Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nombre Completo o Razón Social: *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Distribuidora Central, C.A. o Juan Pérez"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* DIRECCIÓN FISCAL (CAMPO CRUCIAL REQUERIDO POR EL USUARIO) */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-900/50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Dirección Fiscal del Cliente: *</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                  Esta dirección aparecerá en las facturas legales en Bolívares y comprobantes según las exigencias del SENIAT.
                </p>
                <textarea
                  required
                  rows={2}
                  value={direccionFiscal}
                  onChange={(e) => setDireccionFiscal(e.target.value)}
                  placeholder="Ej. Av. Bolívar Norte con Calle 137, Edif. Torre Banaven, Piso 4, Ofic. 402, Valencia, Edo. Carabobo"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Teléfono / WhatsApp:
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="04141234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Correo Electrónico:
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@empresa.com"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Credit Limit & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Límite de Crédito / Fiado ($):
                  </label>
                  <input
                    type="number"
                    step="5"
                    value={creditLimitUSD}
                    onChange={(e) => setCreditLimitUSD(e.target.value)}
                    placeholder="0.00 (Ilimitado si vacío)"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Notas u Observaciones:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Condiciones de pago, contacto, etc."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950 transition"
                >
                  {editingCustomer ? 'Guardar Cambios' : 'Registrar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
