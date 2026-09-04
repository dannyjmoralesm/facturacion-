import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  Send, 
  Coins, 
  BookOpen, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  ArrowRight, 
  Sparkles,
  Percent,
  Tag,
  Gift,
  CheckCircle2
} from 'lucide-react';
import { 
  Customer, 
  PaymentMethodType, 
  PaymentSplit, 
  PaymentRecord,
  ChangeDetail, 
  BusinessProfile,
  CartItem
} from '../../types';
import { formatUSD, formatVES, usdToVes, vesToUsd } from '../../utils/bcvService';

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: CartItem[];
  totalUSD?: number;
  bcvRate: number;
  customer: Customer;
  profile: BusinessProfile;
  onCompleteSale: (
    payments: PaymentRecord[],
    totals: {
      subtotalUSD: number;
      discountUSD: number;
      taxUSD: number;
      totalUSD: number;
      totalVES: number;
      creditAmountUSD: number;
    },
    change?: ChangeDetail
  ) => void;
}

type DiscountType = 'none' | 'percent' | 'fixed_usd' | 'fixed_ves';

const PAYMENT_METHODS: { id: PaymentMethodType; label: string; icon: any; color: string }[] = [
  { id: 'cash_usd', label: 'Efectivo USD ($)', icon: DollarSign, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-700/50' },
  { id: 'pago_movil', label: 'Pago Móvil (Bs)', icon: Smartphone, color: 'text-blue-400 bg-blue-950/40 border-blue-700/50' },
  { id: 'punto_venta', label: 'Punto de Venta / Biopago', icon: CreditCard, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-700/50' },
  { id: 'cash_ves', label: 'Efectivo Bolívares (Bs)', icon: Coins, color: 'text-amber-400 bg-amber-950/40 border-amber-700/50' },
  { id: 'zelle', label: 'Zelle (USD)', icon: Send, color: 'text-purple-400 bg-purple-950/40 border-purple-700/50' },
  { id: 'binance_pay', label: 'Binance Pay (USDT)', icon: Coins, color: 'text-yellow-400 bg-yellow-950/40 border-yellow-700/50' },
  { id: 'credito_fiado', label: 'Crédito / Fiado', icon: BookOpen, color: 'text-rose-400 bg-rose-950/40 border-rose-700/50' },
];

const VENEZUELAN_BANKS = [
  '0102 - Banco de Venezuela',
  '0134 - Banesco',
  '0108 - Banco Provincial (BBVA)',
  '0105 - Banco Mercantil',
  '0114 - Bancaribe',
  '0172 - Bancamiga',
  '0163 - Banco del Tesoro',
  '0104 - Banco Venezolano de Crédito',
  '0175 - Banco Bicentenario',
  'Otro Banco'
];

const DISCOUNT_REASONS = [
  'Pronto pago',
  'Cliente frecuente',
  'Promoción especial',
  'Descuento por volumen',
  'Cortesía comercial',
  'Ajuste por redondeo'
];

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  items = [],
  totalUSD = 0,
  bcvRate,
  customer,
  profile,
  onCompleteSale
}) => {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;

  // Calculate gross subtotal from items if available, or fallback to totalUSD prop
  const grossSubtotalUSD = useMemo(() => {
    if (items && items.length > 0) {
      return Number(items.reduce((sum, item) => sum + (item.quantity * item.priceUSD), 0).toFixed(2));
    }
    return (typeof totalUSD === 'number' && !isNaN(totalUSD)) ? totalUSD : 0;
  }, [items, totalUSD]);

  const grossSubtotalVES = Number((grossSubtotalUSD * safeRate).toFixed(2));

  // --- DISCOUNT STATE ---
  const [discountType, setDiscountType] = useState<DiscountType>('none');
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountReason, setDiscountReason] = useState<string>('');
  const [isDiscountExpanded, setIsDiscountExpanded] = useState<boolean>(false);

  // Calculate calculated discount in USD and VES
  const { discountUSD, discountVES, discountPercentage } = useMemo(() => {
    const rawVal = parseFloat(discountValue) || 0;
    if (rawVal <= 0 || discountType === 'none') {
      return { discountUSD: 0, discountVES: 0, discountPercentage: 0 };
    }

    let calculatedUSD = 0;
    let percentage = 0;

    if (discountType === 'percent') {
      const clampedPercent = Math.min(100, Math.max(0, rawVal));
      calculatedUSD = Number(((grossSubtotalUSD * clampedPercent) / 100).toFixed(2));
      percentage = clampedPercent;
    } else if (discountType === 'fixed_usd') {
      calculatedUSD = Number(Math.min(grossSubtotalUSD, rawVal).toFixed(2));
      percentage = grossSubtotalUSD > 0 ? Number(((calculatedUSD / grossSubtotalUSD) * 100).toFixed(1)) : 0;
    } else if (discountType === 'fixed_ves') {
      const inUSD = rawVal / safeRate;
      calculatedUSD = Number(Math.min(grossSubtotalUSD, inUSD).toFixed(2));
      percentage = grossSubtotalUSD > 0 ? Number(((calculatedUSD / grossSubtotalUSD) * 100).toFixed(1)) : 0;
    }

    const calculatedVES = Number((calculatedUSD * safeRate).toFixed(2));
    return {
      discountUSD: calculatedUSD,
      discountVES: calculatedVES,
      discountPercentage: percentage
    };
  }, [discountType, discountValue, grossSubtotalUSD, safeRate]);

  // Net totals to charge
  const netTotalUSD = Math.max(0, Number((grossSubtotalUSD - discountUSD).toFixed(2)));
  const netTotalVES = Number((netTotalUSD * safeRate).toFixed(2));

  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  
  // Current active draft method input
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('cash_usd');
  const [inputCurrency, setInputCurrency] = useState<'USD' | 'VES'>('USD');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [bank, setBank] = useState<string>(VENEZUELAN_BANKS[0]);
  const [changeMethod, setChangeMethod] = useState<'cash_usd' | 'cash_ves' | 'pago_movil'>('cash_usd');
  const [changePagoMovilRef, setChangePagoMovilRef] = useState<string>('');

  // Calculate totals paid so far
  const totalPaidUSD = Number(splits.reduce((sum, s) => sum + s.amountUSD, 0).toFixed(2));
  const totalPaidVES = Number(splits.reduce((sum, s) => sum + s.amountVES, 0).toFixed(2));

  const differenceUSD = Number((totalPaidUSD - netTotalUSD).toFixed(2));
  const remainingUSD = differenceUSD < 0 ? Math.abs(differenceUSD) : 0;
  const remainingVES = Number((remainingUSD * safeRate).toFixed(2));

  const changeUSD = differenceUSD > 0 ? differenceUSD : 0;
  const changeVES = Number((changeUSD * safeRate).toFixed(2));

  const isCovered = totalPaidUSD >= netTotalUSD - 0.005;

  // Initialize/recalculate draft input when net total or remaining changes
  useEffect(() => {
    if (isOpen) {
      if (splits.length === 0) {
        if (inputCurrency === 'USD') {
          setInputAmount(netTotalUSD.toFixed(2));
        } else {
          setInputAmount(netTotalVES.toFixed(2));
        }
      } else {
        if (remainingUSD > 0) {
          if (inputCurrency === 'USD') {
            setInputAmount(remainingUSD.toFixed(2));
          } else {
            setInputAmount(remainingVES.toFixed(2));
          }
        }
      }
    }
  }, [isOpen, netTotalUSD, netTotalVES, splits.length]);

  // Adjust input amount helper when switching currency
  const handleCurrencyChange = (newCurr: 'USD' | 'VES') => {
    setInputCurrency(newCurr);
    if (newCurr === 'VES') {
      const remainingInVes = remainingUSD > 0 ? (remainingUSD * safeRate).toFixed(2) : netTotalVES.toFixed(2);
      setInputAmount(remainingInVes);
    } else {
      const remainingInUsd = remainingUSD > 0 ? remainingUSD.toFixed(2) : netTotalUSD.toFixed(2);
      setInputAmount(remainingInUsd);
    }
  };

  const handleAddSplit = () => {
    const rawVal = parseFloat(inputAmount);
    if (isNaN(rawVal) || rawVal <= 0) return;

    let splitUSD = 0;
    let splitVES = 0;

    if (inputCurrency === 'USD') {
      splitUSD = Number(rawVal.toFixed(2));
      splitVES = Number((splitUSD * safeRate).toFixed(2));
    } else {
      splitVES = Number(rawVal.toFixed(2));
      splitUSD = Number((splitVES / safeRate).toFixed(2));
    }

    const newSplit: PaymentSplit = {
      id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      method: selectedMethod,
      amountUSD: splitUSD,
      amountVES: splitVES,
      appliedRate: safeRate,
      reference: reference.trim() || undefined,
      bank: (selectedMethod === 'pago_movil' || selectedMethod === 'punto_venta') ? bank : undefined
    };

    const newSplits = [...splits, newSplit];
    setSplits(newSplits);

    // Reset inputs
    setReference('');
    const newTotalPaid = newSplits.reduce((acc, s) => acc + s.amountUSD, 0);
    const newRemaining = Math.max(0, Number((netTotalUSD - newTotalPaid).toFixed(2)));

    if (newRemaining > 0) {
      if (inputCurrency === 'USD') {
        setInputAmount(newRemaining.toFixed(2));
      } else {
        setInputAmount((newRemaining * safeRate).toFixed(2));
      }
    } else {
      setInputAmount('');
    }
  };

  const handleRemoveSplit = (id: string) => {
    const updated = splits.filter(s => s.id !== id);
    setSplits(updated);
    const newTotalPaid = updated.reduce((acc, s) => acc + s.amountUSD, 0);
    const newRemaining = Math.max(0, Number((netTotalUSD - newTotalPaid).toFixed(2)));
    if (inputCurrency === 'USD') {
      setInputAmount(newRemaining.toFixed(2));
    } else {
      setInputAmount((newRemaining * safeRate).toFixed(2));
    }
  };

  const handleQuickPreset = (amount: number, curr: 'USD' | 'VES') => {
    setInputCurrency(curr);
    setInputAmount(amount.toString());
  };

  const handleFast100PagoMovil = () => {
    setSelectedMethod('pago_movil');
    setInputCurrency('VES');
    setInputAmount(netTotalVES.toFixed(2));
  };

  const handleFast100CashUSD = () => {
    setSelectedMethod('cash_usd');
    setInputCurrency('USD');
    setInputAmount(netTotalUSD.toFixed(2));
  };

  const handleSelectDiscountPresetPercent = (pct: number) => {
    setDiscountType('percent');
    setDiscountValue(pct.toString());
  };

  const handleSelectDiscountPresetUSD = (amt: number) => {
    setDiscountType('fixed_usd');
    setDiscountValue(amt.toString());
  };

  const handleSelectDiscountPresetVES = (amt: number) => {
    setDiscountType('fixed_ves');
    setDiscountValue(amt.toString());
  };

  const handleClearDiscount = () => {
    setDiscountType('none');
    setDiscountValue('');
    setDiscountReason('');
  };

  const handleConfirmSubmit = () => {
    if (!isCovered) return;

    let changeDetail: ChangeDetail | undefined = undefined;
    if (changeUSD > 0 || changeVES > 0) {
      changeDetail = {
        amountUSD: changeUSD,
        amountVES: changeVES,
        method: changeMethod,
        reference: changeMethod === 'pago_movil' ? changePagoMovilRef : undefined
      };
    }

    const creditAmountUSD = splits
      .filter(s => s.method === 'credito_fiado')
      .reduce((sum, s) => sum + s.amountUSD, 0);

    const totalsPayload = {
      subtotalUSD: grossSubtotalUSD,
      discountUSD: discountUSD,
      taxUSD: 0,
      totalUSD: netTotalUSD,
      totalVES: netTotalVES,
      creditAmountUSD
    };

    onCompleteSale(splits, totalsPayload, changeDetail);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col text-slate-100 overflow-hidden my-auto">
        
        {/* Header with Subtotal, Discount & Net Totals */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/30">
                <Coins className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white">Checkout Bimoneda & Descuentos</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cliente: <span className="text-slate-200 font-semibold">{customer?.name || 'Consumidor Final'}</span> ({customer?.docType || 'V'}-{customer?.docNumber || '00000000'})
            </p>
          </div>

          {/* Amount to pay badge with Discount Indicator */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 px-4 py-2 rounded-xl border border-slate-700">
            {discountUSD > 0 && (
              <>
                <div className="text-right border-r border-slate-800 pr-3 hidden sm:block">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal</div>
                  <div className="text-xs font-mono line-through text-slate-400">
                    {formatUSD(grossSubtotalUSD)}
                  </div>
                  <div className="text-[10px] text-rose-400 font-semibold font-mono">
                    Desc. -{formatUSD(discountUSD)} ({discountPercentage}%)
                  </div>
                </div>
              </>
            )}

            <div className="text-right">
              <div className="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">
                {discountUSD > 0 ? 'Total con Descuento' : 'Total a Cobrar'}
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono leading-none">
                {formatUSD(netTotalUSD)}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800" />
            
            <div className="text-left">
              <div className="text-[11px] text-slate-400 font-mono">Tasa BCV: {safeRate.toFixed(2)} Bs/$</div>
              <div className="text-base sm:text-lg font-bold text-slate-200 font-mono leading-none">
                {formatVES(netTotalVES)}
              </div>
            </div>
          </div>

          <button
            id="btn-close-checkout-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
          
          {/* Left Column: Discount Configurator & Payment Method Form (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* --- SECTION 1: DISCOUNT PANEL (PORCENTAJE O MONTO ESPECÍFICO) --- */}
            <div className={`rounded-xl border transition-all ${
              discountUSD > 0 
                ? 'bg-rose-950/20 border-rose-600/50 shadow-sm' 
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              {/* Collapsible header / summary */}
              <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg border ${
                    discountUSD > 0 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    <Tag className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        Descuento Comercial / Rebaja
                      </span>
                      {discountUSD > 0 && (
                        <span className="px-2 py-0.2 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          -{formatUSD(discountUSD)} (-{discountPercentage}%)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Aplica descuento en porcentaje (%), monto fijo en dólares ($) o bolívares (Bs.)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {discountUSD > 0 && (
                    <button
                      type="button"
                      onClick={handleClearDiscount}
                      className="text-[11px] px-2 py-1 bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 rounded-lg border border-rose-800/60 font-semibold transition"
                    >
                      Quitar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsDiscountExpanded(!isDiscountExpanded)}
                    className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 font-semibold transition"
                  >
                    {isDiscountExpanded ? 'Ocultar' : discountUSD > 0 ? 'Editar' : '+ Aplicar Descuento'}
                  </button>
                </div>
              </div>

              {/* Expandable Discount Body */}
              {isDiscountExpanded && (
                <div className="p-3.5 pt-0 border-t border-slate-800/80 space-y-3 mt-1 animate-in fade-in duration-150">
                  {/* Mode selector */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('percent');
                        if (!discountValue) setDiscountValue('10');
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        discountType === 'percent'
                          ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <Percent className="w-3.5 h-3.5" />
                      <span>Porcentaje (%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('fixed_usd');
                        if (!discountValue) setDiscountValue('5');
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        discountType === 'fixed_usd'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Monto Dólares ($)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDiscountType('fixed_ves');
                        if (!discountValue) setDiscountValue('200');
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                        discountType === 'fixed_ves'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Monto Bolívares (Bs)</span>
                    </button>
                  </div>

                  {/* Input & Live Equivalency */}
                  {discountType !== 'none' && (
                    <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                            {discountType === 'percent' ? '%' : discountType === 'fixed_usd' ? '$' : 'Bs.'}
                          </span>
                          <input
                            id="input-discount-val"
                            type="number"
                            step={discountType === 'percent' ? '1' : '0.01'}
                            min="0"
                            max={discountType === 'percent' ? '100' : grossSubtotalUSD}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            placeholder={discountType === 'percent' ? 'Ej. 10 (para 10%)' : '0.00'}
                            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-500"
                          />
                        </div>

                        {/* Calculated Live Badge */}
                        <div className="text-right text-xs">
                          <div className="text-slate-400 text-[10px]">Ahorro Cliente:</div>
                          <div className="font-mono font-bold text-rose-400">
                            -{formatUSD(discountUSD)}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400">
                            -{formatVES(discountVES)}
                          </div>
                        </div>
                      </div>

                      {/* Quick Chips Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400">Valores rápidos:</span>
                        {discountType === 'percent' && (
                          [5, 10, 15, 20, 25, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleSelectDiscountPresetPercent(pct)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                                discountValue === pct.toString()
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {pct}%
                            </button>
                          ))
                        )}

                        {discountType === 'fixed_usd' && (
                          [1, 2, 5, 10, 20, 50].filter(amt => amt <= grossSubtotalUSD).map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleSelectDiscountPresetUSD(amt)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                                discountValue === amt.toString()
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              ${amt}
                            </button>
                          ))
                        )}

                        {discountType === 'fixed_ves' && (
                          [50, 100, 250, 500, 1000].map(amt => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => handleSelectDiscountPresetVES(amt)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                                discountValue === amt.toString()
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              Bs. {amt}
                            </button>
                          ))
                        )}
                      </div>

                      {/* Motivo / Razón del Descuento */}
                      <div className="pt-1.5 border-t border-slate-800/80">
                        <div className="flex flex-wrap items-center gap-1 mb-1">
                          <span className="text-[10px] text-slate-400">Motivo:</span>
                          {DISCOUNT_REASONS.map(reason => (
                            <button
                              key={reason}
                              type="button"
                              onClick={() => setDiscountReason(reason)}
                              className={`px-1.5 py-0.2 rounded text-[10px] transition ${
                                discountReason === reason 
                                  ? 'bg-slate-700 text-white font-bold' 
                                  : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {reason}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          value={discountReason}
                          onChange={(e) => setDiscountReason(e.target.value)}
                          placeholder="Nota o motivo del descuento (opcional)..."
                          className="w-full px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-[11px] text-slate-300 focus:outline-none focus:border-slate-600"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick 100% Shortcuts */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Atajos Rápidos:</span>
              <button
                id="btn-fast-100-usd"
                type="button"
                onClick={handleFast100CashUSD}
                className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 rounded-lg text-xs font-semibold transition"
              >
                100% Efectivo $ ({formatUSD(netTotalUSD)})
              </button>
              <button
                id="btn-fast-100-pm"
                type="button"
                onClick={handleFast100PagoMovil}
                className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded-lg text-xs font-semibold transition"
              >
                100% Pago Móvil ({formatVES(netTotalVES)})
              </button>
            </div>

            {/* Method Grid */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Seleccione Método de Pago a Registrar:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m.id);
                        if (m.id === 'cash_usd' || m.id === 'zelle') {
                          setInputCurrency('USD');
                        } else if (m.id === 'pago_movil' || m.id === 'cash_ves' || m.id === 'punto_venta') {
                          setInputCurrency('VES');
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        isSelected 
                          ? `${m.color} ring-2 ring-emerald-500 shadow-md` 
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className="w-4 h-4" />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-xs font-bold leading-tight">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount and Currency Tendered Box */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <span>Monto a Abonar en este Método:</span>
                </label>

                {/* Currency Switcher */}
                <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('USD')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition ${
                      inputCurrency === 'USD' 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    USD ($)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCurrencyChange('VES')}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition ${
                      inputCurrency === 'VES' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    VES (Bs.)
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                  {inputCurrency === 'USD' ? '$' : 'Bs.'}
                </span>
                <input
                  id="input-split-amount"
                  type="number"
                  step="0.01"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Conversion hint */}
              {inputAmount && !isNaN(parseFloat(inputAmount)) && parseFloat(inputAmount) > 0 && (
                <div className="text-xs text-slate-400 flex items-center justify-between px-1">
                  <span>Equivalente:</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {inputCurrency === 'USD' 
                      ? formatVES(parseFloat(inputAmount) * safeRate)
                      : formatUSD(parseFloat(inputAmount) / safeRate)
                    }
                  </span>
                </div>
              )}

              {/* Presets for USD bills / Bs amounts */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {inputCurrency === 'USD' ? (
                  [1, 5, 10, 20, 50, 100].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickPreset(val, 'USD')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-md border border-slate-700 transition"
                    >
                      ${val}
                    </button>
                  ))
                ) : (
                  [50, 100, 500, 1000, 2000, 5000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickPreset(val, 'VES')}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-md border border-slate-700 transition"
                    >
                      Bs. {val}
                    </button>
                  ))
                )}
                {remainingUSD > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (inputCurrency === 'USD') {
                        setInputAmount(remainingUSD.toFixed(2));
                      } else {
                        setInputAmount(remainingVES.toFixed(2));
                      }
                    }}
                    className="px-2 py-1 bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-semibold rounded-md transition hover:bg-emerald-900"
                  >
                    Restante Exacto ({inputCurrency === 'USD' ? formatUSD(remainingUSD) : formatVES(remainingVES)})
                  </button>
                )}
              </div>

              {/* Dynamic Bank & Reference fields for Pago Móvil / Punto de Venta / Zelle */}
              {(selectedMethod === 'pago_movil' || selectedMethod === 'punto_venta') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Banco Emisor:</label>
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      {VENEZUELAN_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nro. Referencia (Últimos 4-6 dígitos):</label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Ej. 849102"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {selectedMethod === 'zelle' && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Titular / Confirmación Zelle:</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Nombre del titular o código de confirmación"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {selectedMethod === 'binance_pay' && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 block mb-1">Binance Order ID / Pay ID:</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej. 294018491"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {selectedMethod === 'credito_fiado' && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/50 rounded-lg text-xs text-rose-300">
                  ⚠️ <span className="font-semibold">Crédito a Libreta de Fiados:</span> Esta deuda quedará registrada a nombre de <strong>{customer?.name || 'Cliente'}</strong> indexada en USD para proteger el valor de la devaluación.
                </div>
              )}

              {/* Add Split Button */}
              <button
                id="btn-add-split-payment"
                type="button"
                onClick={handleAddSplit}
                disabled={!inputAmount || parseFloat(inputAmount) <= 0}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-950 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Forma de Pago</span>
              </button>
            </div>
          </div>

          {/* Right Column: Active Split Summary, Total Calculation Breakdown & Change Payout (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pagos Registrados ({splits.length})
                </h3>
                {splits.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSplits([])}
                    className="text-[11px] text-rose-400 hover:text-rose-300"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              {/* Split list */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {splits.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    Aún no has agregado formas de pago. Usa el panel izquierdo para registrar abonos combinados.
                  </div>
                ) : (
                  splits.map(s => {
                    const methodInfo = PAYMENT_METHODS.find(m => m.id === s.method);
                    return (
                      <div 
                        key={s.id}
                        className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="p-1 rounded bg-slate-900 border border-slate-700 text-slate-300">
                            {methodInfo?.icon && React.createElement(methodInfo.icon, { className: 'w-3.5 h-3.5' })}
                          </span>
                          <div className="truncate">
                            <div className="font-semibold text-slate-200 truncate">{methodInfo?.label}</div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {s.reference ? `Ref: ${s.reference}` : ''} {s.bank ? `(${s.bank})` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-400">{formatUSD(s.amountUSD)}</div>
                            <div className="font-mono text-[10px] text-slate-400">{formatVES(s.amountVES)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSplit(s.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 transition"
                            title="Eliminar este pago"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Calculation Summary Card */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal Bruto:</span>
                  <span className="font-mono text-slate-200">{formatUSD(grossSubtotalUSD)} ({formatVES(grossSubtotalVES)})</span>
                </div>

                {discountUSD > 0 && (
                  <div className="flex justify-between text-rose-400 font-semibold bg-rose-950/30 p-1.5 rounded-lg border border-rose-900/40">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Descuento ({discountPercentage}%):</span>
                    </span>
                    <span className="font-mono">-{formatUSD(discountUSD)} (-{formatVES(discountVES)})</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
                  <span>Total Neto Factura:</span>
                  <span className="font-mono text-emerald-400">{formatUSD(netTotalUSD)} / {formatVES(netTotalVES)}</span>
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>Total Abonado:</span>
                  <span className="font-mono font-bold text-cyan-400">{formatUSD(totalPaidUSD)} / {formatVES(totalPaidVES)}</span>
                </div>

                <div className="h-px bg-slate-800" />

                {remainingUSD > 0 ? (
                  <div className="flex justify-between text-amber-400 font-bold bg-amber-950/40 p-2 rounded-lg border border-amber-800/40">
                    <span>Faltante por Pagar:</span>
                    <span className="font-mono">{formatUSD(remainingUSD)} ({formatVES(remainingVES)})</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                    <span>Estado de Cobro:</span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>CUBIERTO 100%</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Change / Vuelto Section */}
              {changeUSD > 0 && (
                <div className="bg-emerald-950/30 border border-emerald-700/50 p-3.5 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">Vuelto / Cambio a Entregar:</span>
                    <span className="text-sm font-mono font-black text-emerald-400">
                      {formatUSD(changeUSD)} ({formatVES(changeVES)})
                    </span>
                  </div>

                  {/* Change Payout Method */}
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Entregar vuelto en:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setChangeMethod('cash_usd')}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-semibold border text-center transition ${
                          changeMethod === 'cash_usd' 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        Efectivo $
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeMethod('cash_ves')}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-semibold border text-center transition ${
                          changeMethod === 'cash_ves' 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        Efectivo Bs
                      </button>
                      <button
                        type="button"
                        onClick={() => setChangeMethod('pago_movil')}
                        className={`py-1 px-1.5 rounded-md text-[11px] font-semibold border text-center transition ${
                          changeMethod === 'pago_movil' 
                            ? 'bg-blue-600 text-white border-blue-500' 
                            : 'bg-slate-900 text-slate-300 border-slate-700'
                        }`}
                      >
                        Pago Móvil
                      </button>
                    </div>
                  </div>

                  {changeMethod === 'pago_movil' && (
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Ref. de Pago Móvil enviado:</label>
                      <input
                        type="text"
                        value={changePagoMovilRef}
                        onChange={(e) => setChangePagoMovilRef(e.target.value)}
                        placeholder="Nro. referencia del vuelto"
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                id="btn-confirm-sale-finish"
                type="button"
                onClick={handleConfirmSubmit}
                disabled={!isCovered}
                className={`w-full py-3 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition shadow-lg ${
                  isCovered 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950 font-black cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Finalizar y Emitir Comprobante</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Cancelar y Volver al Mostrador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

