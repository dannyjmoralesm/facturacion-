import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Printer, 
  Download, 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CreditCard, 
  ChevronRight, 
  ChevronLeft,
  FileText,
  Filter,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  ShoppingBag
} from 'lucide-react';
import { Sale, BusinessProfile } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { 
  generateDailySalesReportTicketText, 
  generateMonthlySalesReportTicketText 
} from '../../utils/thermalPrinter';
import { 
  downloadDailySalesReportPDF, 
  downloadMonthlySalesReportPDF 
} from '../../utils/pdfGenerator';

interface SalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sales: Sale[];
  bcvRate: number;
  profile: BusinessProfile;
  initialTab?: 'daily' | 'monthly';
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const SalesReportModal: React.FC<SalesReportModalProps> = ({
  isOpen,
  onClose,
  sales,
  bcvRate,
  profile,
  initialTab = 'daily',
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>(initialTab);
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');
  const [showThermalPreview, setShowThermalPreview] = useState(false);
  const [copiedThermal, setCopiedThermal] = useState(false);

  // Daily report state
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Monthly report state
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1); // 1-12

  // Filtered sales for selected day
  const dailySales = useMemo(() => {
    return sales.filter(s => s.date.slice(0, 10) === selectedDate);
  }, [sales, selectedDate]);

  // Filtered sales for selected month
  const monthlySales = useMemo(() => {
    const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
    return sales.filter(s => s.date.startsWith(monthPrefix));
  }, [sales, selectedYear, selectedMonth]);

  // Daily Calculations
  const dailyTotalUSD = useMemo(() => dailySales.reduce((sum, s) => sum + s.totalUSD, 0), [dailySales]);
  const dailyTotalVES = useMemo(() => dailySales.reduce((sum, s) => sum + s.totalVES, 0), [dailySales]);
  const dailyItemsCount = useMemo(() => dailySales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0), [dailySales]);
  const dailyAvgTicket = useMemo(() => dailySales.length > 0 ? dailyTotalUSD / dailySales.length : 0, [dailySales, dailyTotalUSD]);

  // Monthly Calculations
  const monthlyTotalUSD = useMemo(() => monthlySales.reduce((sum, s) => sum + s.totalUSD, 0), [monthlySales]);
  const monthlyTotalVES = useMemo(() => monthlySales.reduce((sum, s) => sum + s.totalVES, 0), [monthlySales]);
  
  // Daily breakdown within the month
  const monthlyDailyBreakdown = useMemo(() => {
    const map: Record<string, { count: number; usd: number; ves: number; items: number }> = {};
    monthlySales.forEach(s => {
      const day = s.date.slice(0, 10);
      if (!map[day]) {
        map[day] = { count: 0, usd: 0, ves: 0, items: 0 };
      }
      map[day].count += 1;
      map[day].usd += s.totalUSD;
      map[day].ves += s.totalVES;
      map[day].items += s.items.reduce((acc, i) => acc + i.quantity, 0);
    });
    return Object.entries(map)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [monthlySales]);

  const activeDaysCount = monthlyDailyBreakdown.length;
  const monthlyAvgDailyUSD = activeDaysCount > 0 ? monthlyTotalUSD / activeDaysCount : 0;

  // Payments breakdown for daily
  const dailyPaymentsBreakdown = useMemo(() => {
    const map: Record<string, { count: number; usd: number; ves: number }> = {};
    dailySales.forEach(s => {
      s.payments.forEach(p => {
        if (!map[p.method]) {
          map[p.method] = { count: 0, usd: 0, ves: 0 };
        }
        map[p.method].count += 1;
        map[p.method].usd += (p.amountUSD || 0);
        map[p.method].ves += (p.amountVES || (p.amountUSD * bcvRate));
      });
    });
    return map;
  }, [dailySales, bcvRate]);

  // Top products of the selected period
  const topProducts = useMemo(() => {
    const sourceSales = activeTab === 'daily' ? dailySales : monthlySales;
    const map: Record<string, { name: string; qty: number; totalUSD: number }> = {};
    sourceSales.forEach(s => {
      s.items.forEach(i => {
        const key = i.productId || i.productName;
        if (!map[key]) {
          map[key] = { name: i.productName, qty: 0, totalUSD: 0 };
        }
        map[key].qty += i.quantity;
        map[key].totalUSD += i.subtotalUSD;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 8);
  }, [activeTab, dailySales, monthlySales]);

  // Method Labels
  const methodLabels: Record<string, string> = {
    cash_usd: 'Efectivo USD ($)',
    cash_ves: 'Efectivo Bolívares',
    pago_movil: 'Pago Móvil',
    punto_venta: 'Punto de Venta',
    zelle: 'Zelle',
    binance_pay: 'Binance Pay',
    credit: 'Crédito / Fiado'
  };

  // Thermal Ticket Text generated on the fly
  const thermalText = useMemo(() => {
    if (activeTab === 'daily') {
      return generateDailySalesReportTicketText(selectedDate, dailySales, profile, bcvRate, paperWidth);
    } else {
      const mName = MONTH_NAMES[selectedMonth - 1];
      return generateMonthlySalesReportTicketText(mName, String(selectedYear), monthlySales, profile, bcvRate, paperWidth);
    }
  }, [activeTab, selectedDate, dailySales, selectedMonth, selectedYear, monthlySales, profile, bcvRate, paperWidth]);

  // Handle thermal print
  const handlePrintThermal = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Ventas - ${profile.commercialName || 'NegoFact'}</title>
          <style>
            @page { margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: ${paperWidth === '58mm' ? '10px' : '12px'};
              width: ${paperWidth};
              padding: 6px;
              margin: 0;
              color: black;
              white-space: pre-wrap;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
${thermalText}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Copy Thermal Text
  const handleCopyThermal = () => {
    navigator.clipboard.writeText(thermalText);
    setCopiedThermal(true);
    setTimeout(() => setCopiedThermal(false), 2000);
  };

  // Handle Download PDF
  const handleDownloadPDF = () => {
    if (activeTab === 'daily') {
      downloadDailySalesReportPDF(selectedDate, dailySales, profile, bcvRate);
    } else {
      const mName = MONTH_NAMES[selectedMonth - 1];
      downloadMonthlySalesReportPDF(mName, String(selectedYear), monthlySales, profile, bcvRate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Reportes de Ventas & Cierre de Caja</h2>
              <p className="text-xs text-slate-400">
                Auditoría fiscal bimoneda, desglose de formas de pago e impresión de reportes en PDF y Ticket Térmico.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Quick Filters */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'daily'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Reporte Diario de Ventas</span>
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'monthly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Reporte Mensual Consolidado</span>
            </button>
          </div>

          {/* Date Selector based on Tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'daily' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                    selectedDate === new Date().toISOString().slice(0, 10)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
                    setSelectedDate(yday);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                    selectedDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  Ayer
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Print Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-400">
                Formato Impresora:
              </div>
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaperWidth('80mm')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    paperWidth === '80mm' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  80mm (Estándar)
                </button>
                <button
                  type="button"
                  onClick={() => setPaperWidth('58mm')}
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    paperWidth === '58mm' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  58mm (Portátil)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowThermalPreview(!showThermalPreview)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{showThermalPreview ? 'Ocultar Rollo' : 'Ver Rollo Térmico'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrintThermal}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket Térmico</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Reporte PDF (A4)</span>
              </button>
            </div>
          </div>

          {/* Thermal Receipt Preview drawer if toggled */}
          {showThermalPreview && (
            <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Printer className="w-4 h-4" />
                  <span>Previsualización Rollo Térmico ESC/POS ({paperWidth})</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyThermal}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1"
                  >
                    {copiedThermal ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedThermal ? 'Copiado!' : 'Copiar Texto'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintThermal}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Ahora</span>
                  </button>
                </div>
              </div>
              <pre className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono text-[11px] leading-tight overflow-x-auto max-h-64 whitespace-pre">
                {thermalText}
              </pre>
            </div>
          )}

          {/* KPI Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {activeTab === 'daily' ? 'Total Facturado del Día' : 'Total Mensual Facturado'}
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {formatUSD(activeTab === 'daily' ? dailyTotalUSD : monthlyTotalUSD)}
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {formatVES(activeTab === 'daily' ? dailyTotalVES : monthlyTotalVES)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {activeTab === 'daily' ? 'Facturas Emitidas' : 'Total Facturas del Mes'}
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {activeTab === 'daily' ? dailySales.length : monthlySales.length}
              </div>
              <div className="text-xs text-slate-400">
                {activeTab === 'daily' ? `${dailyItemsCount} unidades vendidas` : `${activeDaysCount} días con ventas registradas`}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                {activeTab === 'daily' ? 'Ticket Promedio ($)' : 'Promedio Diario ($)'}
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {formatUSD(activeTab === 'daily' ? dailyAvgTicket : monthlyAvgDailyUSD)}
              </div>
              <div className="text-xs text-slate-400">
                {activeTab === 'daily' ? 'Por cliente / transacción' : 'Venta diaria promedio'}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase">
                Tasa Oficial BCV Aplicada
              </div>
              <div className="text-2xl font-black text-blue-400 font-mono">
                {bcvRate.toFixed(2)} <span className="text-xs font-normal text-slate-400">Bs/$</span>
              </div>
              <div className="text-xs text-slate-400">
                Sincronización cambiaria oficial
              </div>
            </div>
          </div>

          {/* TAB 1: DAILY REPORT CONTENT */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              {/* Payment Methods Breakdown */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Ingresos por Formas de Pago ({dailySales.length} transacciones)</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatUSD(dailyTotalUSD)}
                  </span>
                </div>

                {Object.keys(dailyPaymentsBreakdown).length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No hay transacciones registradas para la fecha seleccionada ({selectedDate}).
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {(Object.entries(dailyPaymentsBreakdown) as [string, { count: number; usd: number; ves: number }][]).map(([method, data]) => {
                      const sharePct = dailyTotalUSD > 0 ? (data.usd / dailyTotalUSD) * 100 : 0;
                      return (
                        <div key={method} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-200">
                              {methodLabels[method] || method}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold">
                              {sharePct.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-sm font-mono font-bold text-white">
                              {formatUSD(data.usd)}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {formatVES(data.ves)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, sharePct)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {data.count} {data.count === 1 ? 'operación' : 'operaciones'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Products of the Day & Transactions Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3 lg:col-span-1">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                    <span>Top Productos Vendidos</span>
                  </h3>
                  {topProducts.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4">No hay ítems vendidos en esta fecha.</div>
                  ) : (
                    <div className="space-y-2">
                      {topProducts.map((prod, idx) => (
                        <div key={idx} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-purple-400 font-bold flex items-center justify-center text-[10px]">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-200 line-clamp-1">{prod.name}</div>
                              <div className="text-[10px] text-slate-400">{prod.qty} unidades</div>
                            </div>
                          </div>
                          <div className="font-mono text-emerald-400 font-bold text-right">
                            {formatUSD(prod.totalUSD)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day Transactions Table */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Facturas del Día ({dailySales.length})</span>
                    </h3>
                  </div>

                  {dailySales.length === 0 ? (
                    <div className="text-xs text-slate-500 py-6 text-center">
                      No se emitieron facturas en esta fecha ({selectedDate}).
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-72">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold sticky top-0">
                          <tr>
                            <th className="p-2.5">Factura / Hora</th>
                            <th className="p-2.5">Cliente</th>
                            <th className="p-2.5">Formas de Pago</th>
                            <th className="p-2.5 text-right">Monto ($ / Bs)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {dailySales.map(s => (
                            <tr key={s.id} className="hover:bg-slate-900/50">
                              <td className="p-2.5 font-mono">
                                <div className="font-bold text-white">{s.invoiceNumber}</div>
                                <div className="text-[10px] text-slate-500">
                                  {new Date(s.date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </td>
                              <td className="p-2.5">
                                <div className="font-bold text-slate-200">{s.customerName}</div>
                                <div className="text-[10px] text-slate-400">{s.customerDoc}</div>
                              </td>
                              <td className="p-2.5">
                                <div className="flex flex-wrap gap-1">
                                  {s.payments.map((p, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-300">
                                      {p.method}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="p-2.5 text-right font-mono">
                                <div className="font-bold text-emerald-400">{formatUSD(s.totalUSD)}</div>
                                <div className="text-[10px] text-slate-400">{formatVES(s.totalVES)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTHLY REPORT CONTENT */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              {/* Daily Breakdown Table */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>Consolidado Día a Día del Mes ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})</span>
                  </h3>
                  <div className="text-xs text-slate-400">
                    Gran Total: <span className="font-mono font-bold text-emerald-400">{formatUSD(monthlyTotalUSD)}</span>
                  </div>
                </div>

                {monthlyDailyBreakdown.length === 0 ? (
                  <div className="text-xs text-slate-500 py-8 text-center">
                    No se registran ventas para {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">Fecha</th>
                          <th className="p-2.5 text-center">Facturas</th>
                          <th className="p-2.5 text-center">Unidades</th>
                          <th className="p-2.5 text-right">Total Facturado ($ USD)</th>
                          <th className="p-2.5 text-right">Total Facturado (VES)</th>
                          <th className="p-2.5 text-right">% Cuota del Mes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {monthlyDailyBreakdown.map(day => {
                          const pct = monthlyTotalUSD > 0 ? ((day.usd / monthlyTotalUSD) * 100).toFixed(1) : '0';
                          return (
                            <tr key={day.date} className="hover:bg-slate-900/60 transition">
                              <td className="p-2.5 font-mono font-bold text-white">
                                {day.date}
                              </td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono font-semibold text-[11px]">
                                  {day.count}
                                </span>
                              </td>
                              <td className="p-2.5 text-center text-slate-400 font-mono">
                                {day.items} un.
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                                {formatUSD(day.usd)}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-300">
                                {formatVES(day.ves)}
                              </td>
                              <td className="p-2.5 text-right font-mono text-slate-400">
                                <div className="flex items-center justify-end gap-2">
                                  <span>{pct}%</span>
                                  <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Monthly Top Products */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-400" />
                  <span>Top Productos Más Vendidos del Mes</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {topProducts.map((prod, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-400">#{idx + 1} Ranking</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{formatUSD(prod.totalUSD)}</span>
                      </div>
                      <div className="text-xs font-bold text-white line-clamp-1">{prod.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{prod.qty} unidades vendidas</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
