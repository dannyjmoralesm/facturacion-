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
  onClearAllProducts?: () => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  bcvRate,
  profile,
  userRole,
  onSaveProduct,
  onDeleteProduct,
  onClearAllProducts
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
  const [formMarginPercent, setFormMarginPercent] = useState('30');
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
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Inventario & Catálogo</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Control de existencias físicas, servicios y catálogo digital bimoneda.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCatalogPreviewOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Catálogo WhatsApp</span>
          </button>

          {userRole === 'admin' && (products?.length || 0) > 0 && onClearAllProducts && (
            <button
              onClick={onClearAllProducts}
              className="px-3 py-2 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/60 text-slate-400 hover:text-rose-300 font-medium rounded-xl text-xs flex items-center gap-1.5 transition"
              title="Eliminar todos los productos y reiniciar catálogo"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vaciar</span>
            </button>
          )}

          {userRole === 'admin' && (
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div 
          onClick={() => setIsValuationModalOpen(true)}
          className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Valoración de Inventario (PVP)</span>
            <span className="text-[11px] text-emerald-400 font-medium">Ver detalle →</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {formatUSD(valuationStats.totalSaleUSD)}
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-400 mt-0.5">
            {formatVES(valuationStats.totalSaleVES)}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 mb-1">Unidades Físicas en Stock</div>
          <div className="text-xl font-bold font-mono tabular-nums text-white">
            {valuationStats.totalUnits.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            En {valuationStats.physicalCount} artículos físicos registrados
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 mb-1">Tasa BCV Oficial</div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">
            {(bcvRate || 813.74).toFixed(2)} Bs/$
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Conversión oficial para precios en Bolívares
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código de barras o referencia..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* Type filters */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              filterType === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({(products?.length || 0)})
          </button>
          <button
            onClick={() => setFilterType('physical')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              filterType === 'physical' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setFilterType('service')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              filterType === 'service' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Servicios
          </button>
          <button
            onClick={() => setFilterType('low_stock')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition ${
              filterType === 'low_stock' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
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
                <th className="p-3.5 text-right">Base Imponible ($)</th>
                <th className="p-3.5 text-right">IVA (16%)</th>
                <th className="p-3.5 text-right">PVP Final ($ / Bs)</th>
                <th className="p-3.5 text-center">Stock</th>
                {userRole === 'admin' && <th className="p-3.5 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map(p => {
                const isLowStock = p.type === 'physical' && p.stock <= p.minStock;
                const isOutOfStock = p.type === 'physical' && p.stock <= 0;
                const margin = p.costUSD && p.priceUSD ? ((p.priceUSD - p.costUSD) / p.priceUSD * 100).toFixed(0) : null;
                const ivaRate = profile.taxRatePercent || 16;
                const ivaUSD = Number(((p.priceUSD * ivaRate) / 100).toFixed(2));
                const pvpUSD = Number((p.priceUSD + ivaUSD).toFixed(2));

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

                    <td className="p-3.5 text-slate-400">
                      {p.type === 'service' ? (
                        <span className="text-slate-400 font-medium inline-flex items-center gap-1">
                          <Wrench className="w-3 h-3 text-slate-500" /> Servicio
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium inline-flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-500" /> Físico
                        </span>
                      )}
                    </td>

                    {userRole === 'admin' && (
                      <td className="p-3.5 text-right font-mono tabular-nums text-slate-400">
                        {p.costUSD ? formatUSD(p.costUSD) : '-'}
                        {margin && <div className="text-[10px] text-emerald-400 font-medium">+{margin}%</div>}
                      </td>
                    )}

                    <td className="p-3.5 text-right font-mono tabular-nums text-slate-200">
                      <div>{formatUSD(p.priceUSD)}</div>
                      <div className="text-[10px] text-slate-500">{formatVES(p.priceUSD * bcvRate)}</div>
                    </td>

                    <td className="p-3.5 text-right font-mono tabular-nums text-slate-300">
                      <div>+{formatUSD(ivaUSD)}</div>
                      <div className="text-[10px] text-slate-500">{formatVES(ivaUSD * bcvRate)}</div>
                    </td>

                    <td className="p-3.5 text-right font-mono tabular-nums">
                      <div className="font-bold text-emerald-400 text-sm">{formatUSD(pvpUSD)}</div>
                      <div className="text-[11px] text-slate-400">{formatVES(pvpUSD * bcvRate)}</div>
                    </td>

                    <td className="p-3.5 text-center font-mono tabular-nums">
                      {p.type === 'service' ? (
                        <span className="text-slate-500 text-xs">Ilimitado</span>
                      ) : isOutOfStock ? (
                        <span className="text-rose-400 font-medium text-xs">
                          0 {p.unit}
                        </span>
                      ) : isLowStock ? (
                        <span className="text-amber-400 font-medium text-xs inline-flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          {p.stock} {p.unit}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-medium text-xs">
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

              {/* Price, Margin & IVA Calculator (Formula: Costo + Ganancia = Base Imponible, Base + IVA 16% = PVP) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Calculator className="w-4 h-4" />
                    <span>Estructura de Precios: Costo + Ganancia + IVA Obligatorio</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                    IVA 16% SENIAT
                  </span>
                </div>

                {/* 3 Input Columns: Costo, Margen %, Precio de Venta (Base) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      1. Costo USD ($):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formCostUSD}
                      onChange={(e) => {
                        const newCost = e.target.value;
                        setFormCostUSD(newCost);
                        const c = parseFloat(newCost) || 0;
                        const m = parseFloat(formMarginPercent) || 0;
                        if (c > 0) {
                          const net = c + (c * m / 100);
                          setFormPriceUSD(net.toFixed(2));
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      2. Margen Ganancia (%):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={formMarginPercent}
                      onChange={(e) => {
                        const newMargin = e.target.value;
                        setFormMarginPercent(newMargin);
                        const c = parseFloat(formCostUSD) || 0;
                        const m = parseFloat(newMargin) || 0;
                        if (c > 0) {
                          const net = c + (c * m / 100);
                          setFormPriceUSD(net.toFixed(2));
                        }
                      }}
                      placeholder="30"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono text-emerald-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-emerald-400 block mb-1">
                      3. Precio Neto / Base ($): *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formPriceUSD}
                      onChange={(e) => {
                        const newPrice = e.target.value;
                        setFormPriceUSD(newPrice);
                        const p = parseFloat(newPrice) || 0;
                        const c = parseFloat(formCostUSD) || 0;
                        if (c > 0 && p >= c) {
                          const m = ((p - c) / c) * 100;
                          setFormMarginPercent(m.toFixed(1));
                        }
                      }}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-emerald-600/70 rounded-xl text-sm font-mono font-black text-white"
                    />
                  </div>
                </div>

                {/* Live Formula Decomposition Box */}
                {(() => {
                  const cost = parseFloat(formCostUSD) || 0;
                  const net = parseFloat(formPriceUSD) || 0;
                  const profit = Math.max(0, net - cost);
                  const ivaRate = profile.taxRatePercent || 16;
                  const iva = Number(((net * ivaRate) / 100).toFixed(2));
                  const pvp = Number((net + iva).toFixed(2));

                  return (
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>• Costo Base:</span>
                        <span className="font-mono font-semibold">{formatUSD(cost)} ({formatVES(cost * bcvRate)})</span>
                      </div>
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>• Ganancia Neta (+{formMarginPercent}%):</span>
                        <span className="font-mono font-semibold">+{formatUSD(profit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-100 font-bold pt-1 border-t border-slate-800">
                        <span>= Base Imponible (Precio Neto):</span>
                        <span className="font-mono">{formatUSD(net)} ({formatVES(net * bcvRate)})</span>
                      </div>
                      <div className="flex items-center justify-between text-sky-400 font-semibold">
                        <span>+ IVA ({ivaRate}% Obligatorio de Ley):</span>
                        <span className="font-mono">+{formatUSD(iva)} (+{formatVES(iva * bcvRate)})</span>
                      </div>
                      <div className="flex items-center justify-between text-white font-black text-sm pt-1.5 border-t border-slate-800 bg-slate-950 p-2 rounded-lg">
                        <span className="text-emerald-400">PVP FINAL AL CONSUMIDOR:</span>
                        <span className="font-mono text-emerald-300">{formatUSD(pvp)} · {formatVES(pvp * bcvRate)}</span>
                      </div>
                    </div>
                  );
                })()}
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
