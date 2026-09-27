import React, { useState } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  User, 
  Printer, 
  Download, 
  Share2, 
  DollarSign, 
  CreditCard,
  Smartphone,
  Eye,
  Filter,
  BarChart3,
  Clock,
  FileText
} from 'lucide-react';
import { Sale, BusinessProfile, UserRole } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';
import { downloadSalePDF, downloadSaleTicketPDF } from '../../utils/pdfGenerator';
import { createWhatsAppSaleMessage, openWhatsAppLink } from '../../utils/whatsappHelper';
import { SalesReportModal } from './SalesReportModal';
import { Lock, Crown } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  bcvRate: number;
  profile: BusinessProfile;
  onViewReceipt: (sale: Sale) => void;
  userRole?: UserRole;
  onRequireAdmin?: () => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  bcvRate,
  profile,
  onViewReceipt,
  userRole = 'admin',
  onRequireAdmin
}) => {
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTab, setReportTab] = useState<'daily' | 'monthly'>('daily');

  const isAdmin = userRole === 'admin';

  const openReportModal = (tab: 'daily' | 'monthly') => {
    if (!isAdmin) {
      if (onRequireAdmin) onRequireAdmin();
      return;
    }
    setReportTab(tab);
    setIsReportModalOpen(true);
  };

  const filteredSales = sales.filter(s => {
    const query = search.toLowerCase();
    const matchesSearch = 
      !query ||
      s.invoiceNumber.toLowerCase().includes(query) ||
      s.customerName.toLowerCase().includes(query) ||
      s.customerDoc.toLowerCase().includes(query);

    const matchesMethod = 
      filterMethod === 'all' || 
      s.payments.some(p => p.method === filterMethod);

    return matchesSearch && matchesMethod;
  });

  const totalSalesUSD = filteredSales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalSalesVES = filteredSales.reduce((sum, s) => sum + s.totalVES, 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Historial de Ventas</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro de operaciones, comprobantes emitidos y desglose multimoneda.
          </p>
        </div>

        {/* Totals Summary & Report Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => openReportModal('daily')}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition flex items-center gap-1.5 shadow-sm"
              title={isAdmin ? 'Generar reporte diario' : 'Reporte restringido para Administradores'}
            >
              {isAdmin ? <Clock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
              <span>Reporte Diario</span>
              {!isAdmin && <span className="text-[10px] text-slate-500">Admin</span>}
            </button>
            <button
              onClick={() => openReportModal('monthly')}
              className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 transition flex items-center gap-1.5 shadow-sm"
              title={isAdmin ? 'Generar reporte mensual' : 'Reporte restringido para Administradores'}
            >
              {isAdmin ? <Calendar className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5 text-slate-500" />}
              <span>Reporte Mensual</span>
              {!isAdmin && <span className="text-[10px] text-slate-500">Admin</span>}
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl">
            <div className="text-[10px] text-slate-500 font-medium">Total Facturado</div>
            <div className="text-base sm:text-lg font-bold text-white font-mono tabular-nums leading-none mt-0.5">
              {formatUSD(totalSalesUSD)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
              {formatVES(totalSalesVES)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900/80 border border-slate-800 p-2.5 sm:p-3 rounded-xl flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Nro. Factura, Control, Cliente o Cédula..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Método de Pago:</span>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todos los métodos</option>
            <option value="pago_movil">Pago Móvil</option>
            <option value="cash_usd">Efectivo USD</option>
            <option value="cash_ves">Efectivo Bolívares</option>
            <option value="punto_venta">Punto de Venta</option>
            <option value="zelle">Zelle</option>
            <option value="binance_pay">Binance Pay</option>
            <option value="credit">Crédito / Fiado</option>
          </select>
        </div>
      </div>

      {/* Sales List / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Comprobante / Fecha</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Ítems</th>
                <th className="p-3.5">Desglose de Pago</th>
                <th className="p-3.5 text-right">Total ($ / Bs)</th>
                <th className="p-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    No se encontraron registros de ventas
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-850 transition">
                    <td className="p-3.5 font-mono">
                      <div className="font-bold text-white text-sm">{sale.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{formatShortDate(sale.date)}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{sale.customerName}</div>
                      <div className="text-[11px] text-slate-400">{sale.customerDoc}</div>
                    </td>

                    <td className="p-3.5 text-slate-300">
                      <div>{(sale.items?.length || 0)} productos</div>
                      <div className="text-[10px] text-slate-500">
                        {(sale.items || []).slice(0, 2).map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        {(sale.items?.length || 0) > 2 ? '...' : ''}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(sale.payments || []).map((p, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700"
                          >
                            {p.method}: {p.currency === 'USD' ? formatUSD(p.amount) : formatVES(p.amount)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono">
                      <div className="font-bold text-emerald-400 text-sm">{formatUSD(sale.totalUSD)}</div>
                      <div className="text-[11px] text-slate-400">{formatVES(sale.totalVES)}</div>
                      {sale.discountUSD > 0 && (
                        <div className="text-[10px] text-rose-400 font-semibold mt-0.5">
                          Desc: -{formatUSD(sale.discountUSD)}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">Tasa: {(sale.bcvRate || 86.45).toFixed(2)}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewReceipt(sale)}
                          className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Ver y Reimprimir Comprobante Térmico"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadSaleTicketPDF(sale, profile)}
                          className="p-1.5 bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Descargar Ticket PDF Térmico"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadSalePDF(sale, profile)}
                          className="p-1.5 bg-slate-800 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition"
                          title="Descargar Factura PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openWhatsAppLink(sale.customerPhone, createWhatsAppSaleMessage(sale, profile))}
                          className="p-1.5 bg-slate-800 hover:bg-emerald-700 text-emerald-400 hover:text-white rounded-lg transition"
                          title="Enviar por WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Report Modal (Daily & Monthly) */}
      <SalesReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        sales={sales}
        bcvRate={bcvRate}
        profile={profile}
        initialTab={reportTab}
      />
    </div>
  );
};
