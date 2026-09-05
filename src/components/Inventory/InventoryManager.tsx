import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Wrench, 
  Share2, 
  Edit, 
  Trash2, 
  Layers, 
  DollarSign, 
  Barcode, 
  Check, 
  Copy,
  ExternalLink,
  Sparkles,
  Calculator,
  TrendingUp,
  Boxes,
  ArrowUpRight
} from 'lucide-react';
import { Product, ProductVariant, BusinessProfile, UserRole } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { createWhatsAppCatalogMessage, openWhatsAppLink } from '../../utils/whatsappHelper';
import { InventoryValuationModal } from './InventoryValuationModal';

interface InventoryManagerProps {
  products: Product[];
  bcvRate: number;
  profile: BusinessProfile;
  userRole: UserRole;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  bcvRate,
  profile,
  userRole,
  onSaveProduct,
  onDeleteProduct
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'physical' | 'service' | 'low_stock'>('all');
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCatalogPreviewOpen, setIsCatalogPreviewOpen] = useState(false);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Víveres');
  const [formType, setFormType] = useState<'physical' | 'service'>('physical');
  const [formPriceUSD, setFormPriceUSD] = useState('');
  const [formCostUSD, setFormCostUSD] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formUnit, setFormUnit] = useState('UND');

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Calculate live valuation stats at sale price
  const valuationStats = useMemo(() => {
    let totalSaleUSD = 0;
    let totalUnits = 0;
    let physicalCount = 0;

    products.forEach(p => {
      if (p.type === 'physical') {
        physicalCount += 1;
        const stock = Math.max(0, p.stock || 0);
        totalUnits += stock;
        totalSaleUSD += stock * (p.priceUSD || 0);
      }
    });

    const totalSaleVES = totalSaleUSD * bcvRate;
    return {
      totalSaleUSD,
      totalSaleVES,
      totalUnits,
      physicalCount
    };
  }, [products, bcvRate]);

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesType = 
      filterType === 'all' || 
      (filterType === 'physical' && p.type === 'physical') ||
      (filterType === 'service' && p.type === 'service') ||
      (filterType === 'low_stock' && p.type === 'physical' && p.stock <= p.minStock);

    const s = search.toLowerCase();
    const matchesSearch = 
      !s || 
      p.name.toLowerCase().includes(s) || 
      p.code.toLowerCase().includes(s) || 
      (p.barcode && p.barcode.toLowerCase().includes(s));

    return matchesCat && matchesType && matchesSearch;
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCode(`PROD-${Math.floor(100 + Math.random() * 900)}`);
    setFormBarcode(`759${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setFormCategory('Víveres');
    setFormType('physical');
    setFormPriceUSD('');
    setFormCostUSD('');
    setFormStock('20');
    setFormMinStock('5');
    setFormUnit('UND');
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCode(p.code);
    setFormBarcode(p.barcode || '');
    setFormCategory(p.category);
    setFormType(p.type);
    setFormPriceUSD(p.priceUSD.toString());
    setFormCostUSD(p.costUSD ? p.costUSD.toString() : '');
    setFormStock(p.stock.toString());
    setFormMinStock(p.minStock.toString());
    setFormUnit(p.unit);
    setIsEditModalOpen(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceUSD = parseFloat(formPriceUSD) || 0;
    const costUSD = formCostUSD ? parseFloat(formCostUSD) : undefined;
    const stock = parseFloat(formStock) || 0;
    const minStock = parseFloat(formMinStock) || 0;

    const prodToSave: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}`,
      name: formName.trim(),
      code: formCode.trim(),
      barcode: formBarcode.trim() || undefined,
      category: formCategory.trim() || 'General',
      type: formType,
      priceUSD,
      costUSD,
      stock: formType === 'service' ? 9999 : stock,
      minStock: formType === 'service' ? 0 : minStock,
      unit: formUnit,
      variants: editingProduct?.variants || [],
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString()
    };

    onSaveProduct(prodToSave);
    setIsEditModalOpen(false);
  };

  const handleShareCatalogWhatsApp = () => {
    const msg = createWhatsAppCatalogMessage(products, bcvRate, profile);
    openWhatsAppLink(undefined, msg);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Package className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Inventario & Catálogo Digital</h1>
            <p className="text-xs text-slate-400">
              Control de stock físico, servicios sin inventario y catálogo bimoneda para WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsValuationModalOpen(true)}
            className="px-3.5 py-2.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-emerald-600/50 shadow-md shadow-emerald-950/40 transition cursor-pointer"
            title="Ver ventana de Valoración Total del Inventario a precio de venta"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Valor Total: {formatUSD(valuationStats.totalSaleUSD)}</span>
          </button>

          <button
            onClick={() => setIsCatalogPreviewOpen(true)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>Catálogo WhatsApp</span>
          </button>

          {userRole === 'admin' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-950 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto / Servicio</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Valuation Banner Card */}
      <div 
        onClick={() => setIsValuationModalOpen(true)}
        className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-600/40 hover:border-emerald-500 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-105 transition shrink-0">
            <Calculator className="w-6 h-6" />
          </span>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span>Valor Total del Inventario (A Precio de Venta)</span>
              <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 text-[10px] rounded border border-emerald-700 font-mono">
                Tasa BCV {(bcvRate || 86.45).toFixed(2)} Bs/$
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {formatUSD(valuationStats.totalSaleUSD)}
              </span>
              <span className="text-sm font-semibold font-mono text-emerald-300">
                / {formatVES(valuationStats.totalSaleVES)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                ({valuationStats.totalUnits.toLocaleString()} unidades en {valuationStats.physicalCount} artículos físicos)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 self-end sm:self-center shrink-0">
          <span>Abrir Ventana de Valoración</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código de barras o referencia..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Type filters */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setFilterType('physical')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'physical' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setFilterType('service')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'service' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterType === 'low_stock' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Stock Bajo
          </button>
        </div>
      </div>

      {/* Products Table (Desktop & Tablets >= md) */}
      <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Código / Barra</th>
                <th className="p-3.5">Descripción & Categoría</th>
                <th className="p-3.5">Tipo</th>
                {userRole === 'admin' && <th className="p-3.5 text-right">Costo ($)</th>}
                <th className="p-3.5 text-right">Precio ($ / Bs)</th>
                <th className="p-3.5 text-center">Stock</th>
                {userRole === 'admin' && <th className="p-3.5 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map(p => {
                const isLowStock = p.type === 'physical' && p.stock <= p.minStock;
                const isOutOfStock = p.type === 'physical' && p.stock <= 0;
                const margin = p.costUSD && p.priceUSD ? ((p.priceUSD - p.costUSD) / p.priceUSD * 100).toFixed(0) : null;

                return (
                  <tr key={p.id} className="hover:bg-slate-850 transition">
                    <td className="p-3.5 font-mono text-slate-300">
                      <div>{p.code}</div>
                      {p.barcode && <div className="text-[10px] text-slate-500">{p.barcode}</div>}
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-100 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.category}</div>
                      {p.variants && p.variants.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-indigo-400 font-semibold">
                          <Layers className="w-3 h-3" />
                          <span>{p.variants.length} variantes disponibles</span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      {p.type === 'service' ? (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 inline-flex items-center gap-1">
                          <Wrench className="w-3 h-3" /> Servicio
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold inline-flex items-center gap-1">
                          <Package className="w-3 h-3" /> Físico
                        </span>
                      )}
                    </td>

                    {userRole === 'admin' && (
                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {p.costUSD ? formatUSD(p.costUSD) : '-'}
                        {margin && <div className="text-[10px] text-emerald-400 font-bold">+{margin}%</div>}
                      </td>
                    )}

                    <td className="p-3.5 text-right font-mono">
                      <div className="font-bold text-emerald-400 text-sm">{formatUSD(p.priceUSD)}</div>
                      <div className="text-[11px] text-slate-400">{formatVES(p.priceUSD * bcvRate)}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      {p.type === 'service' ? (
                        <span className="text-slate-500 font-mono">Ilimitado</span>
                      ) : isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                          0 {p.unit}
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {p.stock} {p.unit}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-200 font-semibold">
                          {p.stock} {p.unit}
                        </span>
                      )}
                    </td>

                    {userRole === 'admin' && (
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Editar producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Phones & Small Screens < md) */}
      <div className="md:hidden space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
            No se encontraron productos con los filtros actuales.
          </div>
        ) : (
          filteredProducts.map(p => {
            const isLowStock = p.type === 'physical' && p.stock <= p.minStock;
            const isOutOfStock = p.type === 'physical' && p.stock <= 0;
            const margin = p.costUSD && p.priceUSD ? ((p.priceUSD - p.costUSD) / p.priceUSD * 100).toFixed(0) : null;

            return (
              <div 
                key={p.id} 
                className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-3"
              >
                {/* Top Row: Name and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      {p.type === 'service' ? (
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5" /> Servicio
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Package className="w-2.5 h-2.5" /> Físico
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-white">{p.name}</h4>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      <span>Cód: {p.code}</span>
                      {p.barcode && <span className="ml-2">| Barra: {p.barcode}</span>}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  {userRole === 'admin' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-2 text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 rounded-xl transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 active:bg-rose-950/40 rounded-xl transition touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Row: Prices, Cost & Stock */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 flex-wrap bg-slate-950/50 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <div>
                    <div className="text-sm font-black font-mono text-emerald-400">
                      {formatUSD(p.priceUSD)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {formatVES(p.priceUSD * bcvRate)}
                    </div>
                    {userRole === 'admin' && p.costUSD && (
                      <div className="text-[10px] text-slate-500 font-mono">
                        Costo: {formatUSD(p.costUSD)} {margin && <span className="text-emerald-400">({margin}%)</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    {p.type === 'service' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono">
                        Stock Ilimitado
                      </span>
                    ) : isOutOfStock ? (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold font-mono">
                        Agotado (0 {p.unit})
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> {p.stock} {p.unit}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold font-mono">
                        Stock: {p.stock} {p.unit}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Product Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col text-slate-100 my-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Editar Producto / Servicio' : 'Nuevo Producto / Servicio'}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Producto / Servicio:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Harina PAN 1kg o Mano de obra técnica"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Código Interno:</label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="HAR-01"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Código de Barras:</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="7591031000101"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Categoría:</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Víveres, Bebidas, etc."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Ítem:</label>
                  <select
                    value={formType}
                    onChange={(e: any) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="physical">Producto Físico (Con Stock)</option>
                    <option value="service">Servicio / Mano de obra (Sin Stock)</option>
                  </select>
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">Precio Venta USD ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPriceUSD}
                    onChange={(e) => setFormPriceUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white"
                  />
                  {formPriceUSD && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Equivalente: {formatVES(parseFloat(formPriceUSD) * bcvRate)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Costo Estimado USD ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formCostUSD}
                    onChange={(e) => setFormCostUSD(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                  />
                </div>
              </div>

              {/* Stock controls (if physical) */}
              {formType === 'physical' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Stock Actual:</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Stock Mínimo (Alerta):</label>
                    <input
                      type="number"
                      step="1"
                      value={formMinStock}
                      onChange={(e) => setFormMinStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Unidad:</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                    >
                      <option value="UND">UND (Unidad)</option>
                      <option value="KG">KG (Kilogramos)</option>
                      <option value="LT">LT (Litros)</option>
                      <option value="PZA">PZA (Pieza)</option>
                      <option value="SRV">SRV (Servicio)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Digital WhatsApp Catalog Modal */}
      {isCatalogPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-slate-100 my-auto">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Catálogo Digital Bimoneda para WhatsApp</h3>
              </div>
              <button onClick={() => setIsCatalogPreviewOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              <div className="bg-emerald-950/40 border border-emerald-700/50 p-3 rounded-xl text-xs text-emerald-300">
                🚀 Este catálogo calcula automáticamente los precios en Bolívares usando la <strong>Tasa BCV del Día ({(bcvRate || 86.45).toFixed(2)} Bs/$)</strong> para compartir con tus clientes por WhatsApp o redes sociales.
              </div>

              {/* Items Preview */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {products.filter(p => p.type === 'service' || p.stock > 0).map(p => (
                  <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.category} | {p.type === 'service' ? 'Servicio' : `${p.stock} ${p.unit}`}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-400">{formatUSD(p.priceUSD)}</div>
                      <div className="text-[10px] text-slate-400">{formatVES(p.priceUSD * bcvRate)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsCatalogPreviewOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleShareCatalogWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md shadow-emerald-950"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Catálogo por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total Inventory Valuation Modal Window */}
      {isValuationModalOpen && (
        <InventoryValuationModal
          isOpen={isValuationModalOpen}
          onClose={() => setIsValuationModalOpen(false)}
          products={products}
          bcvRate={bcvRate}
          profile={profile}
        />
      )}
    </div>
  );
};
