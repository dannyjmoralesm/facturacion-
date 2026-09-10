import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  User, 
  CheckCircle, 
  Download, 
  Share2, 
  Trash2, 
  ArrowRight,
  Clock,
  Sparkles,
  Printer
} from 'lucide-react';
import { Quote, Product, Customer, CartItem, BusinessProfile } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { downloadQuotePDF } from '../../utils/pdfGenerator';
import { createWhatsAppQuoteMessage, openWhatsAppLink } from '../../utils/whatsappHelper';

interface QuotesManagerProps {
  quotes: Quote[];
  products: Product[];
  customers: Customer[];
  bcvRate: number;
  profile: BusinessProfile;
  onSaveQuote: (quote: Quote) => void;
  onConvertToSale: (quote: Quote) => void;
  onDeleteQuote: (quoteId: string) => void;
}

export const QuotesManager: React.FC<QuotesManagerProps> = ({
  quotes,
  products,
  customers,
  bcvRate,
  profile,
  onSaveQuote,
  onConvertToSale,
  onDeleteQuote
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);

  // New quote builder state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [validDays, setValidDays] = useState<number>(7);
  const [quoteItems, setQuoteItems] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [quoteNotes, setQuoteNotes] = useState<string>('');

  const filteredQuotes = quotes.filter(q => {
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    const s = search.toLowerCase();
    const matchesSearch = 
      !s || 
      q.quoteNumber.toLowerCase().includes(s) || 
      q.customerName.toLowerCase().includes(s) || 
      q.customerDoc.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const handleAddItemToQuote = () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product || itemQuantity <= 0) return;

    const subUSD = Number((itemQuantity * product.priceUSD).toFixed(2));
    const subVES = Number((subUSD * bcvRate).toFixed(2));

    const item: CartItem = {
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unit: product.unit,
      quantity: itemQuantity,
      priceUSD: product.priceUSD,
      priceVES: Number((product.priceUSD * bcvRate).toFixed(2)),
      discountUSD: 0,
      subtotalUSD: subUSD,
      subtotalVES: subVES,
      isService: product.type === 'service'
    };

    setQuoteItems([...quoteItems, item]);
    setSelectedProductId('');
    setItemQuantity(1);
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems(quoteItems.filter((_, i) => i !== index));
  };

  const handleCreateQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteItems.length === 0) return;

    const customer = customers.find(c => c.id === selectedCustomerId) || customers[0] || {
      id: 'cust-final',
      name: 'Consumidor Final',
      docType: 'V',
      docNumber: '00000000',
      phone: '',
      email: '',
      address: 'Mostrador',
      totalDebtUSD: 0,
      createdAt: new Date().toISOString()
    };
    const totalUSD = Number(quoteItems.reduce((sum, item) => sum + item.subtotalUSD, 0).toFixed(2));
    const totalVES = Number((totalUSD * bcvRate).toFixed(2));

    const now = new Date();
    const validUntil = new Date(now.getTime() + validDays * 86400000);

    const quoteSeq = (profile.nextQuoteSeq !== undefined && !isNaN(Number(profile.nextQuoteSeq))) ? Number(profile.nextQuoteSeq) : 0;
    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: `${profile.quotePrefix || 'COT-'}${quoteSeq.toString().padStart(6, '0')}`,
      date: now.toISOString(),
      validUntil: validUntil.toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      customerDoc: `${customer.docType}-${customer.docNumber}`,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      items: quoteItems,
      subtotalUSD: totalUSD,
      discountUSD: 0,
      totalUSD,
      totalVES,
      bcvRate,
      status: 'pending',
      notes: quoteNotes
    };

    onSaveQuote(newQuote);
    setIsNewQuoteOpen(false);
    setQuoteItems([]);
    setQuoteNotes('');
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">Cotizaciones & Presupuestos</h1>
              <p className="text-xs text-slate-400">
                Emisión de cotizaciones formales bimoneda estilo Factiva con conversión a venta en 1-clic.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsNewQuoteOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Cotización</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nro. Cotización, Cliente o RIF..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todas ({quotes.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'pending' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterStatus('converted')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterStatus === 'converted' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Facturadas
          </button>
        </div>
      </div>

      {/* Quote Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotes.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No hay cotizaciones registradas</p>
            <p className="text-xs text-slate-500 mt-1">Crea presupuestos formales para tus clientes con logo y precios bimoneda.</p>
          </div>
        ) : (
          filteredQuotes.map(q => {
            const isPending = q.status === 'pending';
            return (
              <div
                key={q.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-sm text-blue-400">
                      {q.quoteNumber}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      q.status === 'converted' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {q.status === 'converted' ? '✓ Facturada' : '⏳ Pendiente'}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="mb-3">
                    <div className="font-bold text-sm text-white truncate">{q.customerName}</div>
                    <div className="text-xs text-slate-400">{q.customerDoc}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                      <span>Emitido: {formatShortDate(q.date)}</span>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 space-y-1 mb-3 text-xs">
                    <div className="text-[11px] text-slate-400 font-semibold mb-1">
                      {(q.items?.length || 0)} productos / servicios:
                    </div>
                    {(q.items || []).slice(0, 3).map((it, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span className="truncate mr-2">{it.quantity}x {it.productName}</span>
                        <span className="font-mono text-slate-400">{formatUSD(it.subtotalUSD)}</span>
                      </div>
                    ))}
                    {(q.items?.length || 0) > 3 && (
                      <div className="text-[10px] text-slate-500 italic">
                        +{(q.items?.length || 0) - 3} ítems más...
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Monto Total</div>
                      <div className="text-lg font-black text-blue-400 font-mono">
                        {formatUSD(q.totalUSD)}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {formatVES(q.totalVES)}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Tasa: {(q.bcvRate || bcvRate || 86.45).toFixed(2)} Bs/$
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => downloadQuotePDF(q, profile)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                      title="Descargar PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openWhatsAppLink(q.customerPhone, createWhatsAppQuoteMessage(q, profile))}
                      className="p-2 bg-slate-800 hover:bg-emerald-950 text-emerald-400 rounded-lg text-xs"
                      title="Compartir por WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isPending && (
                    <button
                      onClick={() => onConvertToSale(q)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition"
                      title="Facturar cotización y descontar stock automáticamente"
                    >
                      <span>Facturar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Quote Modal */}
      {isNewQuoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col text-slate-100 my-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">Crear Presupuesto / Cotización Formal</h3>
              </div>
              <button onClick={() => setIsNewQuoteOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateQuoteSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Customer & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cliente:</label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.docType}-{c.docNumber}) {c.phone ? `- Tel: ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Validez (Días):</label>
                  <select
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500"
                  >
                    <option value={3}>3 Días</option>
                    <option value={7}>7 Días (Estándar)</option>
                    <option value={15}>15 Días</option>
                    <option value={30}>30 Días</option>
                  </select>
                </div>
              </div>

              {/* Item Adder */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Agregar Productos o Servicios:
                </label>
                <div className="flex flex-wrap sm:flex-nowrap gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="">-- Seleccione un ítem del catálogo --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatUSD(p.priceUSD)} / {formatVES(p.priceUSD * bcvRate)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-center font-bold text-white"
                    placeholder="Cant"
                  />

                  <button
                    type="button"
                    onClick={handleAddItemToQuote}
                    disabled={!selectedProductId}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Items in quote table */}
                {quoteItems.length > 0 && (
                  <div className="border border-slate-800 rounded-xl overflow-hidden mt-2">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="p-2">Ítem</th>
                          <th className="p-2 text-center">Cant</th>
                          <th className="p-2 text-right">P. Unit ($)</th>
                          <th className="p-2 text-right">Total ($)</th>
                          <th className="p-2 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {quoteItems.map((item, idx) => (
                          <tr key={idx} className="bg-slate-950">
                            <td className="p-2 font-medium text-slate-200">{item.productName}</td>
                            <td className="p-2 text-center font-mono">{item.quantity}</td>
                            <td className="p-2 text-right font-mono">{formatUSD(item.priceUSD)}</td>
                            <td className="p-2 text-right font-mono font-bold text-blue-400">{formatUSD(item.subtotalUSD)}</td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveQuoteItem(idx)}
                                className="text-slate-500 hover:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Total Banner */}
              {quoteItems.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold">Total Cotización:</span>
                  <div className="text-right">
                    <div className="text-xl font-black text-blue-400 font-mono">
                      {formatUSD(quoteItems.reduce((acc, i) => acc + i.subtotalUSD, 0))}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">
                      Equivalente: {formatVES(quoteItems.reduce((acc, i) => acc + i.subtotalUSD, 0) * bcvRate)}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notas / Condiciones Comerciales:</label>
                <textarea
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Ej. Precios sujetos a cambio según tasa oficial BCV. Entrega en 24h."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewQuoteOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quoteItems.length === 0}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-950"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar y Emitir Cotización</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
