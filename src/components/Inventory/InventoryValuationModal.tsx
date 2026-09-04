import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  X, 
  Printer, 
  Download, 
  Search, 
  Boxes, 
  PieChart, 
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Product, BusinessProfile } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';

interface InventoryValuationModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  bcvRate: number;
  profile: BusinessProfile;
}

export const InventoryValuationModal: React.FC<InventoryValuationModalProps> = ({
  isOpen,
  onClose,
  products,
  bcvRate,
  profile
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  // Filter physical products only (services don't have finite stock valuation)
  const physicalProducts = useMemo(() => {
    return products.filter(p => p.type === 'physical');
  }, [products]);

  // Total metrics
  const totals = useMemo(() => {
    let totalSaleValueUSD = 0;
    let totalCostValueUSD = 0;
    let totalUnits = 0;
    let totalProductsWithStock = 0;
    let outOfStockCount = 0;

    physicalProducts.forEach(p => {
      const stock = Math.max(0, p.stock || 0);
      totalUnits += stock;
      if (stock > 0) {
        totalProductsWithStock += 1;
        totalSaleValueUSD += stock * (p.priceUSD || 0);
        if (p.costUSD) {
          totalCostValueUSD += stock * p.costUSD;
        }
      } else {
        outOfStockCount += 1;
      }
    });

    const totalSaleValueVES = totalSaleValueUSD * bcvRate;
    const projectedGrossProfitUSD = totalCostValueUSD > 0 ? totalSaleValueUSD - totalCostValueUSD : 0;
    const projectedMarginPercent = totalCostValueUSD > 0 ? ((projectedGrossProfitUSD / totalSaleValueUSD) * 100) : null;

    return {
      totalSaleValueUSD,
      totalSaleValueVES,
      totalCostValueUSD,
      totalUnits,
      totalProductsWithStock,
      outOfStockCount,
      projectedGrossProfitUSD,
      projectedMarginPercent
    };
  }, [physicalProducts, bcvRate]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: { [cat: string]: { name: string; count: number; totalUnits: number; totalSaleUSD: number } } = {};

    physicalProducts.forEach(p => {
      const cat = p.category || 'Sin Categoría';
      const stock = Math.max(0, p.stock || 0);
      const valUSD = stock * (p.priceUSD || 0);

      if (!map[cat]) {
        map[cat] = { name: cat, count: 0, totalUnits: 0, totalSaleUSD: 0 };
      }
      map[cat].count += 1;
      map[cat].totalUnits += stock;
      map[cat].totalSaleUSD += valUSD;
    });

    return Object.values(map).sort((a, b) => b.totalSaleUSD - a.totalSaleUSD);
  }, [physicalProducts]);

  // Filtered and sorted product list
  const evaluatedProducts = useMemo(() => {
    return physicalProducts
      .map(p => {
        const stock = Math.max(0, p.stock || 0);
        const totalSaleUSD = stock * (p.priceUSD || 0);
        const totalSaleVES = totalSaleUSD * bcvRate;
        const totalCostUSD = p.costUSD ? stock * p.costUSD : undefined;
        const potentialProfitUSD = totalCostUSD !== undefined ? totalSaleUSD - totalCostUSD : undefined;
        const shareOfTotal = totals.totalSaleValueUSD > 0 ? (totalSaleUSD / totals.totalSaleValueUSD) * 100 : 0;

        return {
          ...p,
          stock,
          totalSaleUSD,
          totalSaleVES,
          totalCostUSD,
          potentialProfitUSD,
          shareOfTotal
        };
      })
      .filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
        const s = searchTerm.toLowerCase();
        const matchesSearch = !s || p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s);
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => b.totalSaleUSD - a.totalSaleUSD);
  }, [physicalProducts, bcvRate, selectedCategory, searchTerm, totals.totalSaleValueUSD]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Codigo', 'Producto', 'Categoria', 'Stock', 'Unidad', 'Precio_USD', 'Total_Venta_USD', 'Total_Venta_VES'];
    const rows = evaluatedProducts.map(p => [
      `"${p.code}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category}"`,
      p.stock,
      p.unit,
      p.priceUSD.toFixed(2),
      p.totalSaleUSD.toFixed(2),
      p.totalSaleVES.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `valoracion_inventario_precio_venta_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySummary = () => {
    const text = `📊 *VALORACIÓN TOTAL DEL INVENTARIO (A PRECIO DE VENTA)*
🏢 *Negocio:* ${profile.businessName}
📅 *Fecha:* ${new Date().toLocaleDateString('es-VE')}
🇻🇪 *Tasa BCV:* ${(bcvRate || 86.45).toFixed(2)} Bs/$
--------------------------------------
💰 *VALOR TOTAL USD:* ${formatUSD(totals.totalSaleValueUSD)}
🇻🇪 *VALOR TOTAL BS.:* ${formatVES(totals.totalSaleValueVES)}
📦 *Unidades en Stock:* ${totals.totalUnits.toLocaleString()} unidades
🏷️ *Artículos con Existencia:* ${totals.totalProductsWithStock} de ${physicalProducts.length} productos
${totals.projectedGrossProfitUSD > 0 ? `📈 *Ganancia Bruta Proyectada:* ${formatUSD(totals.projectedGrossProfitUSD)} (${totals.projectedMarginPercent?.toFixed(1)}%)` : ''}
--------------------------------------
Top 3 Categorías con Mayor Valor:
${categoryBreakdown.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}: ${formatUSD(c.totalSaleUSD)} (${formatVES(c.totalSaleUSD * bcvRate)})`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col text-slate-100 my-auto overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <DollarSign className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Valor Total del Inventario (A Precio de Venta)
              </h2>
              <p className="text-xs text-slate-400">
                Cálculo bimoneda en tiempo real según stock actual y tasa oficial BCV ({(bcvRate || 86.45).toFixed(2)} Bs/$).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Copiar resumen para WhatsApp o portapapeles"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5 text-indigo-400" />}
              <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar Resumen'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
              title="Descargar en formato Excel / CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Main Valuation Highlight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Total Sale Value USD */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-slate-900 border border-emerald-500/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-400 text-xs font-bold mb-1">
                <span>VALOR VENTA USD ($)</span>
                <DollarSign className="w-4 h-4 opacity-80" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {formatUSD(totals.totalSaleValueUSD)}
              </div>
              <div className="text-[11px] text-emerald-300 font-medium mt-1">
                Ingreso potencial total en divisas
              </div>
            </div>

            {/* Total Sale Value VES */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-indigo-400 text-xs font-bold mb-1">
                <span>VALOR VENTA BOLÍVARES (VES)</span>
                <span className="text-[10px] bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-700">BCV</span>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight truncate">
                {formatVES(totals.totalSaleValueVES)}
              </div>
              <div className="text-[11px] text-indigo-300 font-medium mt-1">
                Tasa activa: {(bcvRate || 86.45).toFixed(2)} Bs/$
              </div>
            </div>

            {/* Total Units in Stock */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>UNIDADES EN ALMACÉN</span>
                <Boxes className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                {totals.totalUnits.toLocaleString()} <span className="text-sm font-normal text-slate-400">unds</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {totals.totalProductsWithStock} de {physicalProducts.length} productos con stock
              </div>
            </div>

            {/* Projected Gross Profit */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-1">
                <span>UTILIDAD BRUTA ESTIMADA</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 tracking-tight">
                {totals.projectedGrossProfitUSD > 0 ? formatUSD(totals.projectedGrossProfitUSD) : 'N/D'}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">
                {totals.projectedMarginPercent !== null 
                  ? `Margen estimado del ${totals.projectedMarginPercent.toFixed(1)}%` 
                  : 'Registra los costos para ver margen'}
              </div>
            </div>
          </div>

          {/* Category Share Distribution */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span>Distribución del Valor por Categoría</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                {categoryBreakdown.length} categorías
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categoryBreakdown.map((cat) => {
                const percent = totals.totalSaleValueUSD > 0 ? (cat.totalSaleUSD / totals.totalSaleValueUSD) * 100 : 0;
                return (
                  <div 
                    key={cat.name} 
                    onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'all' : cat.name)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      selectedCategory === cat.name 
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md' 
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white truncate">{cat.name}</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{percent.toFixed(1)}%</span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden my-2">
                      <div 
                        className="bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{cat.totalUnits} unds</span>
                      <span className="font-bold text-slate-200">{formatUSD(cat.totalSaleUSD)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar producto en valoración..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas ({physicalProducts.length})
              </button>
              {categoryBreakdown.map(c => (
                <button
                  key={c.name}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === c.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Valuation Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto max-h-80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Producto / Categoría</th>
                    <th className="p-3 text-center">Stock</th>
                    <th className="p-3 text-right">Precio Unitario</th>
                    <th className="p-3 text-right">Total Venta ($)</th>
                    <th className="p-3 text-right">Total Venta (Bs.)</th>
                    <th className="p-3 text-right">% Participación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {evaluatedProducts.map((p) => {
                    const isZero = p.stock <= 0;
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-900/60 transition ${isZero ? 'opacity-50' : ''}`}
                      >
                        <td className="p-3 font-mono text-slate-400">{p.code}</td>
                        <td className="p-3">
                          <div className="font-bold text-white text-xs">{p.name}</div>
                          <div className="text-[10px] text-slate-400">{p.category}</div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                            isZero 
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800' 
                              : 'bg-slate-900 text-slate-200'
                          }`}>
                            {p.stock} {p.unit}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div className="font-bold text-slate-200">{formatUSD(p.priceUSD)}</div>
                          <div className="text-[10px] text-slate-400">{formatVES(p.priceUSD * bcvRate)}</div>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                          {formatUSD(p.totalSaleUSD)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-300 text-xs">
                          {formatVES(p.totalSaleVES)}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-400 text-xs">
                          {p.shareOfTotal.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                  {evaluatedProducts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        No se encontraron productos con los filtros aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer with Sum */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-slate-400">
                Mostrando <strong>{evaluatedProducts.length}</strong> de <strong>{physicalProducts.length}</strong> productos físicos
              </span>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-slate-400">
                  Total Filtrado: <strong className="text-emerald-400">{formatUSD(evaluatedProducts.reduce((acc, p) => acc + p.totalSaleUSD, 0))}</strong>
                </span>
                <span className="text-slate-400">
                  Total Bolívares: <strong className="text-indigo-300">{formatVES(evaluatedProducts.reduce((acc, p) => acc + p.totalSaleVES, 0))}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Los servicios sin control de stock no se incluyen en la valoración física.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
