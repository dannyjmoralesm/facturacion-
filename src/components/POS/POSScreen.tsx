import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Barcode, 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  UserPlus, 
  ShoppingCart, 
  DollarSign, 
  Coins, 
  Tag, 
  Package, 
  Wrench, 
  Check, 
  AlertTriangle,
  ArrowRight,
  Layers
} from 'lucide-react';
import { 
  Product, 
  ProductVariant, 
  Customer, 
  CartItem, 
  BusinessProfile,
  UserRole
} from '../../types';
import { formatUSD, formatVES, usdToVes } from '../../utils/bcvService';
import { BarcodeScannerModal } from './BarcodeScannerModal';

interface POSScreenProps {
  products: Product[];
  customers: Customer[];
  bcvRate: number;
  profile: BusinessProfile;
  userRole: UserRole;
  onOpenCheckout: (items: CartItem[], customer: Customer) => void;
  onQuickAddCustomer: (customer: Customer) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  customers,
  bcvRate,
  profile,
  userRole,
  onOpenCheckout,
  onQuickAddCustomer
}) => {
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const fallbackCustomer: Customer = {
    id: 'cust-final',
    docType: 'V',
    docNumber: '00000000',
    name: 'Consumidor Final',
    phone: '',
    email: '',
    address: 'Mostrador',
    totalDebtUSD: 0,
    createdAt: new Date().toISOString()
  };

  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(() => {
    return (customers && customers.length > 0)
      ? (customers.find(c => c.id === 'cust-final') || customers[0])
      : fallbackCustomer;
  });

  useEffect(() => {
    if (customers && customers.length > 0 && (!selectedCustomer || !selectedCustomer.name)) {
      setSelectedCustomer(customers.find(c => c.id === 'cust-final') || customers[0]);
    }
  }, [customers, selectedCustomer]);
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCustomerSelectorOpen, setIsCustomerSelectorOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  // New customer form state
  const [newCustDocType, setNewCustDocType] = useState<'V' | 'E' | 'J' | 'G' | 'P'>('V');
  const [newCustDocNumber, setNewCustDocNumber] = useState('');
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Selected variant modal
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q);

      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add product to cart helper
  const handleAddToCart = (product: Product, variant?: ProductVariant) => {
    // Check if item has variants and none was selected yet
    if (product.variants && product.variants.length > 0 && !variant) {
      setVariantProduct(product);
      return;
    }

    const priceUSD = variant ? product.priceUSD + variant.priceAdjustmentUSD : product.priceUSD;
    const priceVES = Number((priceUSD * bcvRate).toFixed(2));
    const costUSD = product.costUSD;

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.productId === product.id && item.variantId === (variant ? variant.id : undefined)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        const subUSD = Number((newQty * item.priceUSD - item.discountUSD).toFixed(2));
        const subVES = Number((subUSD * bcvRate).toFixed(2));

        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          subtotalUSD: subUSD,
          subtotalVES: subVES
        };
        return updated;
      } else {
        const subUSD = Number(priceUSD.toFixed(2));
        const subVES = Number((subUSD * bcvRate).toFixed(2));

        const newItem: CartItem = {
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          barcode: product.barcode,
          unit: product.unit,
          variantId: variant ? variant.id : undefined,
          variantName: variant ? variant.name : undefined,
          quantity: 1,
          priceUSD,
          priceVES,
          costUSD,
          discountUSD: 0,
          subtotalUSD: subUSD,
          subtotalVES: subVES,
          isService: product.type === 'service'
        };
        return [...prev, newItem];
      }
    });

    if (variantProduct) {
      setVariantProduct(null);
    }
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    setCart(prev => {
      const updated = [...prev];
      const item = updated[index];
      const subUSD = Number((newQty * item.priceUSD - item.discountUSD).toFixed(2));
      const subVES = Number((subUSD * bcvRate).toFixed(2));

      updated[index] = {
        ...item,
        quantity: newQty,
        subtotalUSD: subUSD,
        subtotalVES: subVES
      };
      return updated;
    });
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  // Cart Calculations
  const cartSubtotalUSD = Number(cart.reduce((sum, item) => sum + (item.quantity * item.priceUSD), 0).toFixed(2));
  const cartDiscountUSD = Number(cart.reduce((sum, item) => sum + item.discountUSD, 0).toFixed(2));
  const cartTotalUSD = Math.max(0, Number((cartSubtotalUSD - cartDiscountUSD).toFixed(2)));
  const cartTotalVES = Number((cartTotalUSD * bcvRate).toFixed(2));

  // Quick customer creation
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustDocNumber.trim()) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      docType: newCustDocType,
      docNumber: newCustDocNumber.trim(),
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      totalDebtUSD: 0,
      createdAt: new Date().toISOString()
    };

    onQuickAddCustomer(newCust);
    setSelectedCustomer(newCust);
    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustDocNumber('');
    setNewCustPhone('');
  };

  // Keyboard shortcut listener (e.g. F4 to checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4' || (e.ctrlKey && e.key === 'Enter')) {
        if (cart.length > 0) {
          e.preventDefault();
          onOpenCheckout(cart, selectedCustomer);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCustomer, onOpenCheckout]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-900 text-slate-100 relative">
      {/* MOBILE TOP VIEW SWITCHER (Phones and Tablet portrait) */}
      <div className="lg:hidden bg-slate-950 p-2 border-b border-slate-800 flex items-center justify-between gap-2 z-20 shrink-0">
        <div className="grid grid-cols-2 gap-1.5 w-full bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition ${
              mobileTab === 'catalog'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catálogo ({products.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition relative ${
              mobileTab === 'cart'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Carrito</span>
            {cart.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                mobileTab === 'cart' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500 text-slate-950'
              }`}>
                {cart.reduce((a, b) => a + b.quantity, 0)} · {formatUSD(cartTotalUSD)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* LEFT PANEL: PRODUCT CATALOG & FAST SEARCH */}
      <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'} flex-1 flex-col min-w-0 border-r border-slate-800 overflow-hidden relative`}>
        {/* Search Bar & Barcode Scanner Button */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="pos-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, código de barras o categoría..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Barcode Camera Scanner Trigger */}
          <button
            id="pos-barcode-btn"
            onClick={() => setIsScannerOpen(true)}
            className="p-2.5 sm:px-3.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition active:scale-95 touch-manipulation"
            title="Abrir lector de código de barras con cámara"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Escanear</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-3 sm:px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 content-start pb-20 lg:pb-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No se encontraron productos con "{searchQuery}"</p>
            </div>
          ) : (
            filteredProducts.map(p => {
              const isLowStock = p.type === 'physical' && p.stock <= p.minStock;
              const isOutOfStock = p.type === 'physical' && p.stock <= 0;
              const priceVES = Number((p.priceUSD * bcvRate).toFixed(2));

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddToCart(p)}
                  disabled={isOutOfStock}
                  className={`bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 sm:p-3 text-left flex flex-col justify-between hover:border-emerald-500/80 hover:bg-slate-800 transition-all group relative overflow-hidden active:scale-[0.97] touch-manipulation min-h-[110px] ${
                    isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between gap-1 mb-1 text-[10px]">
                    <span className="text-slate-400 font-medium truncate">{p.category}</span>
                    {p.type === 'service' ? (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-0.5">
                        <Wrench className="w-2.5 h-2.5" /> Serv
                      </span>
                    ) : isOutOfStock ? (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                        Agotado
                      </span>
                    ) : isLowStock ? (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold flex items-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> {p.stock} {p.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">
                        {p.stock} {p.unit}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <div className="font-semibold text-xs sm:text-sm text-slate-100 group-hover:text-emerald-300 transition line-clamp-2 mb-2 leading-snug">
                    {p.name}
                  </div>

                  {/* Dual Price Footer */}
                  <div className="mt-auto pt-1.5 sm:pt-2 border-t border-slate-750 flex items-end justify-between">
                    <div>
                      <div className="text-xs sm:text-base font-black text-emerald-400 font-mono leading-none">
                        {formatUSD(p.priceUSD)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono mt-0.5">
                        {formatVES(priceVES)}
                      </div>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-700/80 group-hover:bg-emerald-600 text-slate-300 group-hover:text-white flex items-center justify-center transition shadow-xs shrink-0">
                      {p.variants && p.variants.length > 0 ? (
                        <Layers className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* MOBILE STICKY FLOATING QUICK-CART BAR (When browsing catalog on phone/tablet) */}
        {cart.length > 0 && mobileTab === 'catalog' && (
          <div className="lg:hidden absolute bottom-2 left-2 right-2 z-30 p-2.5 bg-slate-950/95 border border-emerald-500/40 backdrop-blur-md rounded-2xl shadow-2xl flex items-center justify-between gap-2 animate-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2 pl-1">
              <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold font-mono text-sm shrink-0">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
              <div>
                <div className="text-xs font-bold text-white leading-none">
                  Total: <span className="text-emerald-400 font-mono">{formatUSD(cartTotalUSD)}</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {formatVES(cartTotalVES)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileTab('cart')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950 transition active:scale-95 touch-manipulation"
            >
              <span>Ver Carrito</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: CART & CHECKOUT CONTROLLER */}
      <div className={`${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'} w-full lg:w-96 xl:w-[420px] flex-col bg-slate-950/90 border-t lg:border-t-0 border-slate-800 h-full`}>
        {/* Customer Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="truncate">
              <div className="text-[10px] sm:text-[11px] text-slate-400 uppercase font-semibold">Cliente:</div>
              <button
                onClick={() => setIsCustomerSelectorOpen(true)}
                className="text-xs sm:text-sm font-bold text-white hover:text-emerald-400 truncate text-left transition flex items-center gap-1"
              >
                <span>{selectedCustomer?.name || 'Consumidor Final'}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({selectedCustomer?.docType || 'V'}-{selectedCustomer?.docNumber || '00000000'})
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsNewCustomerModalOpen(true)}
              className="p-2 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition active:scale-95 touch-manipulation"
              title="Registrar nuevo cliente rápido"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-400 disabled:opacity-30 transition active:scale-95 touch-manipulation"
              title="Vaciar carrito"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30 stroke-1" />
              <p className="text-sm font-semibold text-slate-400">Carrito vacío</p>
              <p className="text-xs text-slate-500 mt-1">
                Toca o escanea productos del catálogo para agregar
              </p>
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="lg:hidden mt-4 px-4 py-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold"
              >
                ← Ir al Catálogo de Productos
              </button>
            </div>
          ) : (
            cart.map((item, index) => (
              <div
                key={`${item.productId}-${item.variantId || 'base'}`}
                className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-xl flex flex-col gap-2"
              >
                {/* Top Item Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-semibold text-xs sm:text-sm text-slate-200 leading-snug">
                      {item.productName}
                    </div>
                    {item.variantName && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        [{item.variantName}]
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatUSD(item.priceUSD)} c/u ({formatVES(item.priceVES)})
                    </div>
                  </div>

                  {/* Subtotal */}
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                      {formatUSD(item.subtotalUSD)}
                    </div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {formatVES(item.subtotalVES)}
                    </div>
                  </div>
                </div>

                {/* Quantity Controls & Delete */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-0.5 rounded-xl border border-slate-800">
                    <button
                      onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                      className="w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition touch-manipulation"
                    >
                      <Minus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                    <input
                      type="number"
                      min="0.1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) handleUpdateQuantity(index, val);
                      }}
                      className="w-12 sm:w-10 text-center font-mono font-bold text-xs sm:text-sm bg-transparent text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                      className="w-8 h-8 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition touch-manipulation"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{item.unit}</span>
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 sm:p-1 text-slate-500 hover:text-rose-400 transition active:scale-95 touch-manipulation"
                    >
                      <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Trigger */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 space-y-3 shrink-0">
          {/* Dual Total Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 sm:p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} ítems):</span>
              <span className="font-mono text-slate-200 font-semibold">{formatUSD(cartSubtotalUSD)}</span>
            </div>

            <div className="h-px bg-slate-800" />

            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] sm:text-xs text-slate-400 uppercase font-bold tracking-wider">Total a Pagar</div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono leading-none mt-0.5">
                  {formatUSD(cartTotalUSD)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-mono">Tasa: {(bcvRate || 86.45).toFixed(2)} Bs/$</div>
                <div className="text-base sm:text-lg font-bold text-slate-100 font-mono leading-none mt-0.5">
                  {formatVES(cartTotalVES)}
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            id="pos-checkout-btn"
            type="button"
            onClick={() => onOpenCheckout(cart, selectedCustomer)}
            disabled={cart.length === 0}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 transition active:scale-[0.98] cursor-pointer touch-manipulation"
          >
            <span>COBRAR / CHECKOUT</span>
            <span className="text-xs bg-slate-950/20 px-1.5 py-0.5 rounded font-mono hidden sm:inline">[F4]</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onProductScanned={(p) => handleAddToCart(p)}
      />

      {/* Customer Selector Modal */}
      {isCustomerSelectorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">Seleccionar Cliente</h3>
              <button onClick={() => setIsCustomerSelectorOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1">
              {customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCustomer(c);
                    setIsCustomerSelectorOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between text-xs transition ${
                    selectedCustomer.id === c.id 
                      ? 'bg-emerald-950/50 border-emerald-600 text-white' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.docType}-{c.docNumber} | Tel: {c.phone || 'N/A'}</div>
                  </div>
                  {c.totalDebtUSD > 0 && (
                    <span className="text-[10px] text-rose-400 font-bold bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/50">
                      Debe: {formatUSD(c.totalDebtUSD)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick New Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md text-slate-100">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm">Registrar Cliente Rápido</h3>
              <button onClick={() => setIsNewCustomerModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveQuickCustomer} className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Tipo:</label>
                  <select
                    value={newCustDocType}
                    onChange={(e: any) => setNewCustDocType(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="V">V (Venezolano)</option>
                    <option value="J">J (Jurídico/RIF)</option>
                    <option value="E">E (Extranjero)</option>
                    <option value="G">G (Gubernamental)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-[11px] text-slate-400 block mb-1">Nro. Cédula o RIF:</label>
                  <input
                    type="text"
                    required
                    value={newCustDocNumber}
                    onChange={(e) => setNewCustDocNumber(e.target.value)}
                    placeholder="Ej. 19876543"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Nombre Completo o Razón Social:</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Teléfono (WhatsApp):</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="Ej. 04121234567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Variant Selector Modal */}
      {variantProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm text-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm">{variantProduct.name}</h3>
              <button onClick={() => setVariantProduct(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">Seleccione la presentación / variante a despachar:</p>
            <div className="space-y-1.5">
              {variantProduct.variants?.map(v => {
                const adjPriceUSD = variantProduct.priceUSD + v.priceAdjustmentUSD;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleAddToCart(variantProduct, v)}
                    className="w-full p-2.5 bg-slate-800 hover:bg-emerald-950/60 hover:border-emerald-500 border border-slate-700 rounded-lg flex items-center justify-between text-xs transition"
                  >
                    <div>
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-[10px] text-slate-400">SKU: {v.sku}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-400">
                      {formatUSD(adjPriceUSD)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
