import React, { useState } from 'react';
import { 
  X, 
  DollarSign, 
  Coins, 
  Truck, 
  Calendar, 
  FileText, 
  Building, 
  Phone, 
  Plus, 
  Check, 
  AlertCircle,
  Camera,
  Sparkles
} from 'lucide-react';
import { Supplier, SupplierDebt, Currency } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { InvoiceScannerModal } from './InvoiceScannerModal';

interface NewSupplierDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  bcvRate: number;
  suppliers: Supplier[];
  onSaveSupplierDebt: (debt: SupplierDebt, newSupplier?: Supplier) => void;
}

const PRESET_CATEGORIES = [
  'Mercancía (Víveres & Alimentos)',
  'Bebidas & Licores',
  'Charcutería & Lácteos',
  'Enlatados & Salsas',
  'Limpieza & Cuidado Personal',
  'Insumos Comerciales (Bolsas/Rollos)',
  'Servicios & Mantenimiento',
  'Equipos & Maquinaria'
];

export const NewSupplierDebtModal: React.FC<NewSupplierDebtModalProps> = ({
  isOpen,
  onClose,
  bcvRate,
  suppliers,
  onSaveSupplierDebt
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || 'new');
  
  // New Supplier fields if 'new' is selected
  const [newSupName, setNewSupName] = useState('');
  const [newSupRif, setNewSupRif] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupContact, setNewSupContact] = useState('');

  // Debt fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [rawAmount, setRawAmount] = useState('');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().slice(0, 10));
  const [dueDays, setDueDays] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

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

  // Calculate Due Date based on dateCreated + dueDays
  const createdDateObj = new Date(dateCreated);
  const dueDateObj = new Date(createdDateObj.getTime() + dueDays * 86400000);
  const dueDateString = dueDateObj.toISOString().slice(0, 10);

  const isCreatingNewSup = selectedSupplierId === 'new';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0 || !invoiceNumber.trim()) return;

    let finalSupplierId = selectedSupplierId;
    let finalSupName = '';
    let finalSupRif = '';
    let finalSupPhone = '';
    let newlyCreatedSupplier: Supplier | undefined = undefined;

    if (isCreatingNewSup) {
      if (!newSupName.trim() || !newSupRif.trim()) return;
      const genId = `sup-${Date.now()}`;
      newlyCreatedSupplier = {
        id: genId,
        name: newSupName.trim(),
        rif: newSupRif.trim(),
        phone: newSupPhone.trim(),
        contactPerson: newSupContact.trim() || undefined,
        totalDebtUSD: amountUSD,
        createdAt: new Date().toISOString()
      };
      finalSupplierId = genId;
      finalSupName = newSupName.trim();
      finalSupRif = newSupRif.trim();
      finalSupPhone = newSupPhone.trim();
    } else {
      const sup = suppliers.find(s => s.id === selectedSupplierId);
      if (!sup) return;
      finalSupName = sup.name;
      finalSupRif = sup.rif;
      finalSupPhone = sup.phone || '';
    }

    const newDebt: SupplierDebt = {
      id: `sup-debt-${Date.now()}`,
      supplierId: finalSupplierId,
      supplierName: finalSupName,
      supplierRif: finalSupRif,
      supplierPhone: finalSupPhone,
      invoiceNumber: invoiceNumber.trim(),
      controlNumber: controlNumber.trim() || undefined,
      category,
      description: description.trim() || undefined,
      originalDebtUSD: amountUSD,
      paidDebtUSD: 0,
      remainingDebtUSD: amountUSD,
      dateCreated: new Date(dateCreated).toISOString(),
      dueDate: new Date(dueDateString).toISOString(),
      status: 'pending',
      installments: [],
      notes: notes.trim() || undefined
    };

    onSaveSupplierDebt(newDebt, newlyCreatedSupplier);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Registrar Factura por Pagar (Proveedor)</h2>
              <p className="text-xs text-slate-400">Control de créditos comerciales y cuentas por pagar a proveedores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Quick AI Scanner Action Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>¿Tienes la factura física o foto?</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> IA
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Escanea con la cámara o sube la imagen para autocompletar RIF, montos y fecha.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Escanear</span>
            </button>
          </div>

          {/* Supplier Selection */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Proveedor <span className="text-rose-400">*</span>
              </label>
              <button
                type="button"
                onClick={() => setSelectedSupplierId('new')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Crear Nuevo Proveedor</span>
              </button>
            </div>

            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.rif}) - Deuda act: {formatUSD(s.totalDebtUSD)}
                </option>
              ))}
              <option value="new">+ Registrar Proveedor Nuevo...</option>
            </select>

            {/* If creating new supplier */}
            {isCreatingNewSup && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Razón Social / Nombre <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Polar, C.A."
                    value={newSupName}
                    onChange={(e) => setNewSupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    RIF / Cédula <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. J-00041372-1"
                    value={newSupRif}
                    onChange={(e) => setNewSupRif(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 0414-1234567"
                    value={newSupPhone}
                    onChange={(e) => setNewSupPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Persona de Contacto / Vendedor
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Lcdo. Roberto Fuentes"
                    value={newSupContact}
                    onChange={(e) => setNewSupContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Invoice details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nro. Factura / Nota Entrega <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej. FAC-99420 / NE-120"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Nro. de Control SENIAT
              </label>
              <input
                type="text"
                placeholder="Ej. 00-019842"
                value={controlNumber}
                onChange={(e) => setControlNumber(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {PRESET_CATEGORIES.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Currency */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Monto Total de la Deuda <span className="text-rose-400">*</span>
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
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-xl font-bold font-mono text-white focus:outline-none focus:border-amber-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                {currency}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Tasa BCV del Día: <strong className="text-slate-200">{safeRate.toFixed(2)} Bs/$</strong></span>
              <span className="font-mono font-semibold text-slate-200">
                {currency === 'USD' ? `Equivale a: ${formatVES(amountVES)}` : `Equivale a: ${formatUSD(amountUSD)}`}
              </span>
            </div>
          </div>

          {/* Dates & Credit Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Fecha de Emisión / Compra
              </label>
              <input
                type="date"
                value={dateCreated}
                onChange={(e) => setDateCreated(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Plazo de Crédito
                </label>
                <span className="text-xs text-amber-400 font-semibold">
                  Vence: {dueDateString}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[7, 15, 30, 45].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDueDays(days)}
                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                      dueDays === days
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {days} días
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Descripción del Pedido / Observaciones
            </label>
            <input
              type="text"
              placeholder="Ej. 10 bultos Harina PAN, 5 bultos Arroz Primor..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
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
              disabled={numAmount <= 0 || !invoiceNumber.trim() || (isCreatingNewSup && !newSupName.trim())}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-sm font-bold text-white shadow-lg shadow-amber-900/40 transition"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Factura ({formatUSD(amountUSD)})</span>
            </button>
          </div>
        </form>
      </div>

      {/* Embedded Scanner Modal */}
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
          setIsScannerOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
