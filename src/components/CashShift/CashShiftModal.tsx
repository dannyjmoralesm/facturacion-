import React, { useState } from 'react';
import { 
  X, 
  Wallet, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2, 
  DollarSign, 
  Coins, 
  AlertCircle,
  FileSpreadsheet,
  Clock
} from 'lucide-react';
import { CashShift, CashMovement, BusinessProfile } from '../../types';
import { formatUSD, formatVES, formatShortDate } from '../../utils/bcvService';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeShift: CashShift | null;
  bcvRate: number;
  profile: BusinessProfile;
  onOpenShift: (openingUSD: number, openingVES: number, cashierName: string) => void;
  onAddMovement: (type: 'cash_in' | 'cash_out', currency: 'USD' | 'VES', amount: number, reason: string) => void;
  onCloseShift: (actualCashUSD: number, actualCashVES: number, notes?: string) => void;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({
  isOpen,
  onClose,
  activeShift,
  bcvRate,
  profile,
  onOpenShift,
  onAddMovement,
  onCloseShift
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'movement' | 'close' | 'open'>('summary');
  
  // Open shift state
  const [openUSD, setOpenUSD] = useState('50.00');
  const [openVES, setOpenVES] = useState('2500.00');
  const [cashierName, setCashierName] = useState('Cajero Principal');

  // Movement state
  const [movType, setMovType] = useState<'cash_in' | 'cash_out'>('cash_out');
  const [movCurrency, setMovCurrency] = useState<'USD' | 'VES'>('USD');
  const [movAmount, setMovAmount] = useState('');
  const [movReason, setMovReason] = useState('');

  // Close shift state (Arqueo)
  const [countUSD, setCountUSD] = useState('');
  const [countVES, setCountVES] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  if (!isOpen) return null;

  const handleOpenShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = parseFloat(openUSD) || 0;
    const v = parseFloat(openVES) || 0;
    onOpenShift(u, v, cashierName.trim() || 'Cajero');
    setActiveTab('summary');
  };

  const handleAddMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(movAmount);
    if (isNaN(amt) || amt <= 0 || !movReason.trim()) return;

    onAddMovement(movType, movCurrency, amt, movReason.trim());
    setMovAmount('');
    setMovReason('');
    setActiveTab('summary');
  };

  const handleCloseShiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const actUSD = parseFloat(countUSD) || 0;
    const actVES = parseFloat(countVES) || 0;
    onCloseShift(actUSD, actVES, closeNotes.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-100 my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-white">Control de Caja y Cuadre Z</h2>
              <p className="text-xs text-slate-400">
                {activeShift ? `Turno iniciado por ${activeShift.cashierName}` : 'No hay turno de caja abierto'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        {/* Tab Navigation */}
        {activeShift && (
          <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex items-center gap-2 text-xs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Estado de Caja
            </button>
            <button
              onClick={() => setActiveTab('movement')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'movement' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              + Entrada / Salida de Efectivo
            </button>
            <button
              onClick={() => {
                setCountUSD(((activeShift.expectedCashUSD ?? 0)).toFixed(2));
                setCountVES(((activeShift.expectedCashVES ?? 0)).toFixed(2));
                setActiveTab('close');
              }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'close' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arqueo & Cierre Z
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {!activeShift || activeTab === 'open' ? (
            /* Open Shift Form */
            <form onSubmit={handleOpenShiftSubmit} className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-slate-300">
                Inicia un nuevo turno de caja ingresando el fondo de apertura en divisas y bolívares para dar cambio.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nombre del Cajero / Responsable:</label>
                <input
                  type="text"
                  required
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-emerald-400 block mb-1">Fondo Inicial en USD ($):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openUSD}
                    onChange={(e) => setOpenUSD(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-blue-400 block mb-1">Fondo Inicial en Bs. (VES):</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={openVES}
                    onChange={(e) => setOpenVES(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm shadow-md"
              >
                Abrir Turno de Caja
              </button>
            </form>
          ) : activeTab === 'summary' && activeShift ? (
            /* Shift Summary */
            <div className="space-y-4 text-xs">
              {/* Expected Cash in drawer cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-950/30 border border-emerald-700/40 p-3.5 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Efectivo Esperado en Divisas ($)</span>
                  <div className="text-xl font-black text-emerald-300 font-mono mt-1">
                    {formatUSD(activeShift?.expectedCashUSD || 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Apertura: {formatUSD(activeShift?.openingUSD || 0)}
                  </div>
                </div>

                <div className="bg-blue-950/30 border border-blue-700/40 p-3.5 rounded-xl">
                  <span className="text-[10px] text-blue-400 font-bold uppercase">Efectivo Esperado en Bolívares (Bs)</span>
                  <div className="text-xl font-black text-blue-300 font-mono mt-1">
                    {formatVES(activeShift?.expectedCashVES || 0)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Apertura: {formatVES(activeShift?.openingVES || 0)}
                  </div>
                </div>
              </div>

              {/* Total sales in shift */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Ventas realizadas en este turno:</span>
                  <span className="font-mono font-bold text-white">{activeShift?.salesCount || 0} ventas</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Volumen Total Vendido ($):</span>
                  <span className="font-mono font-bold text-emerald-400">{formatUSD(activeShift?.totalSalesUSD || 0)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Volumen Total Vendido (Bs):</span>
                  <span className="font-mono font-bold text-slate-200">{formatVES(activeShift?.totalSalesVES || 0)}</span>
                </div>
              </div>

              {/* Cash Movements log */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">Movimientos de Caja ({(activeShift?.movements?.length || 0)}):</span>
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {(activeShift?.movements || []).map(m => (
                    <div key={m.id} className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        {m.type === 'cash_in' ? (
                          <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                        )}
                        <div>
                          <span className="font-semibold text-slate-200">{m.reason}</span>
                          <span className="text-[10px] text-slate-500 block">{formatShortDate(m.timestamp)}</span>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-slate-200">
                        {m.currency === 'USD' ? formatUSD(m.amount) : formatVES(m.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'movement' ? (
            /* Add Movement Form */
            <form onSubmit={handleAddMovementSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMovType('cash_in')}
                  className={`p-2 rounded-xl border text-xs font-bold transition ${
                    movType === 'cash_in' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  + Entrada de Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMovType('cash_out')}
                  className={`p-2 rounded-xl border text-xs font-bold transition ${
                    movType === 'cash_out' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  - Salida / Retiro (Gastos)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Moneda:</label>
                  <select
                    value={movCurrency}
                    onChange={(e: any) => setMovCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="USD">Dólares USD ($)</option>
                    <option value="VES">Bolívares VES (Bs)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Monto:</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={movAmount}
                    onChange={(e) => setMovAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Motivo o Justificación:</label>
                <input
                  type="text"
                  required
                  value={movReason}
                  onChange={(e) => setMovReason(e.target.value)}
                  placeholder="Ej. Pago a proveedor de hielo, compra de bolsas, etc."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
              >
                Registrar Movimiento
              </button>
            </form>
          ) : (
            /* Close Shift & Arqueo Z */
            <form onSubmit={handleCloseShiftSubmit} className="space-y-3.5 text-xs">
              <div className="bg-rose-950/40 border border-rose-800/40 p-3 rounded-xl text-rose-300">
                ⚠️ Realiza el conteo físico del dinero en caja para calcular sobrantes o faltantes en el Cierre Z.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Efectivo USD Contado ($):</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={countUSD}
                    onChange={(e) => setCountUSD(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono font-bold text-white text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Esperado: {formatUSD(activeShift?.expectedCashUSD || 0)}
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-1">Efectivo Bs. Contado (VES):</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={countVES}
                    onChange={(e) => setCountVES(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono font-bold text-white text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Esperado: {formatVES(activeShift?.expectedCashVES || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notas del Cierre:</label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Observaciones sobre diferencias de caja o turnos..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm shadow-md"
              >
                Confirmar Arqueo y Cerrar Turno
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
