import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2 
} from 'lucide-react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  POSScreen 
} from './components/POS/POSScreen';
import { 
  SplitPaymentModal 
} from './components/POS/SplitPaymentModal';
import { 
  ReceiptModal 
} from './components/POS/ReceiptModal';
import { 
  QuotesManager 
} from './components/Quotes/QuotesManager';
import { 
  InventoryManager 
} from './components/Inventory/InventoryManager';
import { 
  DebtsManager 
} from './components/Debts/DebtsManager';
import { 
  SalesHistory 
} from './components/Sales/SalesHistory';
import { 
  CashShiftModal 
} from './components/CashShift/CashShiftModal';
import { 
  SettingsModal 
} from './components/Settings/SettingsModal';
import { 
  ArchitectureModal 
} from './components/DeveloperDocs/ArchitectureModal';
import { 
  FinanceManager 
} from './components/Finance/FinanceManager';
import { 
  UserSwitchModal 
} from './components/Auth/UserSwitchModal';
import { 
  PWAInstallModal 
} from './components/PWAInstallModal';
import { 
  OfflineIndicator 
} from './components/OfflineIndicator';

import { 
  Product, 
  Customer, 
  Sale, 
  Quote, 
  DebtAccount, 
  DebtPaymentInstallment,
  CashShift, 
  CashMovement,
  BusinessProfile, 
  CartItem, 
  PaymentRecord,
  ChangeDetail,
  UserRole,
  AppUser,
  Expense,
  Supplier,
  SupplierDebt,
  SupplierDebtInstallment
} from './types';

import { 
  getProducts, 
  saveProducts, 
  getCustomers, 
  saveCustomers, 
  getSales, 
  saveSales, 
  getQuotes, 
  saveQuotes, 
  getDebts, 
  saveDebts, 
  getShifts, 
  saveShifts, 
  getBusinessProfile, 
  saveBusinessProfile, 
  getUserRole, 
  saveUserRole,
  getUsers,
  saveUsers,
  getCurrentUser,
  saveCurrentUser,
  getExpenses,
  saveExpenses,
  getSuppliers,
  saveSuppliers,
  getSupplierDebts,
  saveSupplierDebts
} from './utils/storage';

import { 
  fetchBCVRate, 
  getFallbackRate, 
  formatUSD, 
  formatVES 
} from './utils/bcvService';

export default function App() {
  // User Authentication & Roles
  const [users, setUsers] = useState<AppUser[]>(() => getUsers());
  const [currentUser, setCurrentUser] = useState<AppUser>(() => getCurrentUser());
  const [isUserSwitchOpen, setIsUserSwitchOpen] = useState<boolean>(false);
  const [userSwitchRoleRequired, setUserSwitchRoleRequired] = useState<'admin' | undefined>(undefined);
  const [userSwitchPendingAction, setUserSwitchPendingAction] = useState<(() => void) | null>(null);

  // Navigation & View
  const [currentView, setCurrentView] = useState<'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance'>('pos');
  const [userRole, setUserRole] = useState<UserRole>(() => getCurrentUser().role || getUserRole());

  // BCV Rate state
  const [bcvRate, setBcvRate] = useState<number>(getFallbackRate());
  const [rateDate, setRateDate] = useState<string>('');
  const [isRateLoading, setIsRateLoading] = useState<boolean>(false);
  const [isRateOverridden, setIsRateOverridden] = useState<boolean>(false);

  // Core Data
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers());
  const [sales, setSales] = useState<Sale[]>(() => getSales());
  const [quotes, setQuotes] = useState<Quote[]>(() => getQuotes());
  const [debts, setDebts] = useState<DebtAccount[]>(() => getDebts());
  const [shifts, setShifts] = useState<CashShift[]>(() => getShifts());
  const [profile, setProfile] = useState<BusinessProfile>(() => getBusinessProfile());
  const [expenses, setExpenses] = useState<Expense[]>(() => getExpenses());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers());
  const [supplierDebts, setSupplierDebts] = useState<SupplierDebt[]>(() => getSupplierDebts());

  // Active shift
  const [activeShift, setActiveShift] = useState<CashShift | null>(() => {
    const sh = getShifts();
    return sh.find(item => item.status === 'open') || null;
  });

  // Modals
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutCustomer, setCheckoutCustomer] = useState<Customer | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);

  // Load all initial data from local storage
  const loadAllData = useCallback(() => {
    const u = getUsers();
    const curU = getCurrentUser();
    const p = getProducts();
    const c = getCustomers();
    const s = getSales();
    const q = getQuotes();
    const d = getDebts();
    const sh = getShifts();
    const prof = getBusinessProfile();
    const role = curU.role || getUserRole();
    const exp = getExpenses();
    const sup = getSuppliers();
    const sDebts = getSupplierDebts();

    setUsers(u);
    setCurrentUser(curU);
    setProducts(p);
    setCustomers(c);
    setSales(s);
    setQuotes(q);
    setDebts(d);
    setShifts(sh);
    setProfile(prof);
    setUserRole(role);
    setExpenses(exp);
    setSuppliers(sup);
    setSupplierDebts(sDebts);

    // Find if there is an open shift
    const openShift = sh.find(item => item.status === 'open') || null;
    setActiveShift(openShift);
  }, []);

  // Fetch BCV Rate on boot
  const syncRate = useCallback(async () => {
    setIsRateLoading(true);
    try {
      const data = await fetchBCVRate();
      setBcvRate(data.rate);
      setRateDate(data.date);
      setIsRateOverridden(data.isOverridden || false);
    } catch (err) {
      console.warn('Could not sync BCV rate, using fallback', err);
    } finally {
      setIsRateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    syncRate();
  }, [loadAllData, syncRate]);

  // Handle Manual BCV Rate change
  const handleUpdateRate = (newRate: number) => {
    setBcvRate(newRate);
    setIsRateOverridden(true);
    localStorage.setItem('negofact_manual_bcv_rate', newRate.toString());
  };

  // User Management Actions
  const handleSaveUser = (userData: AppUser) => {
    const exists = users.some(u => u.id === userData.id);
    let updated: AppUser[];
    if (exists) {
      updated = users.map(u => u.id === userData.id ? userData : u);
    } else {
      updated = [...users, userData];
    }
    setUsers(updated);
    saveUsers(updated);

    if (currentUser.id === userData.id) {
      setCurrentUser(userData);
      setUserRole(userData.role);
      saveCurrentUser(userData);
    }
  };

  const handleDeleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    saveUsers(updated);
  };

  const handleSwitchUser = (userToSwitch: AppUser) => {
    const updatedUser = {
      ...userToSwitch,
      lastLogin: new Date().toISOString()
    };
    const updatedList = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedList);
    saveUsers(updatedList);

    setCurrentUser(updatedUser);
    setUserRole(updatedUser.role);
    saveCurrentUser(updatedUser);
  };

  // Safe Navigation with RBAC
  const handleNavigate = (view: 'pos' | 'quotes' | 'inventory' | 'debts' | 'sales' | 'finance') => {
    if (view === 'finance' && currentUser.role === 'seller') {
      // Prompt admin auth
      setUserSwitchRoleRequired('admin');
      setUserSwitchPendingAction(() => () => setCurrentView('finance'));
      setIsUserSwitchOpen(true);
      return;
    }
    setCurrentView(view);
  };

  // Handle Legacy Role Toggle
  const handleRoleToggle = (newRole: UserRole) => {
    setUserRole(newRole);
    saveUserRole(newRole);
  };

  // Quick Customer Creation
  const handleQuickAddCustomer = (newCust: Customer) => {
    const updated = [newCust, ...customers];
    setCustomers(updated);
    saveCustomers(updated);
  };

  // Checkout flow trigger from POS
  const handleOpenCheckout = (items: CartItem[], customer: Customer) => {
    setCheckoutItems(items);
    setCheckoutCustomer(customer);
    setIsCheckoutOpen(true);
  };

  // Process Completed Sale
  const handleCompleteSale = (
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
  ) => {
    if (!checkoutCustomer || checkoutItems.length === 0) return;

    const nextInvoiceSeq = profile?.nextInvoiceSeq || 1001;
    const nextControlSeq = profile?.nextControlSeq || 5001;

    const invoiceNumber = `${profile?.invoicePrefix || 'FACT-'}${nextInvoiceSeq.toString().padStart(6, '0')}`;
    const controlNumber = `${profile?.controlPrefix || '00-'}${nextControlSeq.toString().padStart(6, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      controlNumber,
      date: new Date().toISOString(),
      customerId: checkoutCustomer.id,
      customerName: checkoutCustomer.name || 'Consumidor Final',
      customerDoc: `${checkoutCustomer.docType || 'V'}-${checkoutCustomer.docNumber || '00000000'}`,
      customerPhone: checkoutCustomer.phone || '',
      items: checkoutItems,
      subtotalUSD: totals.subtotalUSD,
      discountUSD: totals.discountUSD,
      taxUSD: totals.taxUSD,
      totalUSD: totals.totalUSD,
      subtotalVES: totals.subtotalUSD * bcvRate,
      taxVES: totals.taxUSD * bcvRate,
      totalVES: totals.totalVES,
      bcvRate,
      payments,
      change,
      status: totals.creditAmountUSD > 0 ? 'credit_pending' : 'completed',
      cashierName: activeShift ? activeShift.cashierName : 'Cajero 1'
    };

    // 1. Save Sale
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveSales(updatedSales);

    // 2. Decrement physical inventory stock
    const updatedProducts = products.map(prod => {
      const purchased = checkoutItems.filter(it => it.productId === prod.id);
      if (purchased.length > 0 && prod.type === 'physical') {
        const qtyToReduce = purchased.reduce((sum, it) => sum + it.quantity, 0);
        return {
          ...prod,
          stock: Math.max(0, prod.stock - qtyToReduce)
        };
      }
      return prod;
    });
    setProducts(updatedProducts);
    saveProducts(updatedProducts);

    // 3. If credit was generated (fiado), create DebtAccount
    if (totals.creditAmountUSD > 0) {
      const newDebt: DebtAccount = {
        id: `debt-${Date.now()}`,
        customerId: checkoutCustomer.id,
        customerName: checkoutCustomer.name,
        customerDoc: `${checkoutCustomer.docType}-${checkoutCustomer.docNumber}`,
        customerPhone: checkoutCustomer.phone || '',
        saleId: newSale.id,
        invoiceNumber,
        originalDebtUSD: totals.creditAmountUSD,
        paidDebtUSD: 0,
        remainingDebtUSD: totals.creditAmountUSD,
        dateCreated: newSale.date,
        dueDate: new Date(Date.now() + 86400000 * 15).toISOString(),
        status: 'pending',
        installments: []
      };

      const updatedDebts = [newDebt, ...debts];
      setDebts(updatedDebts);
      saveDebts(updatedDebts);

      // Update customer total debt
      const updatedCustomers = customers.map(c => {
        if (c.id === checkoutCustomer.id) {
          return {
            ...c,
            totalDebtUSD: (c.totalDebtUSD || 0) + totals.creditAmountUSD
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
    }

    // 4. Update Cash Shift if active
    if (activeShift) {
      let shiftCashUSD = activeShift.expectedCashUSD;
      let shiftCashVES = activeShift.expectedCashVES;

      payments.forEach(p => {
        if (p.method === 'cash_usd') {
          shiftCashUSD += p.amountUSD;
        } else if (p.method === 'cash_ves') {
          shiftCashVES += p.amountVES;
        }
      });

      if (change) {
        if (change.method === 'cash_usd') {
          shiftCashUSD = Math.max(0, shiftCashUSD - change.amountUSD);
        } else if (change.method === 'cash_ves') {
          shiftCashVES = Math.max(0, shiftCashVES - change.amountVES);
        }
      }

      const updatedShift: CashShift = {
        ...activeShift,
        expectedCashUSD: shiftCashUSD,
        expectedCashVES: shiftCashVES,
        totalSalesUSD: activeShift.totalSalesUSD + totals.totalUSD,
        totalSalesVES: activeShift.totalSalesVES + totals.totalVES,
        salesCount: activeShift.salesCount + 1
      };

      setActiveShift(updatedShift);
      const updatedShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
      setShifts(updatedShifts);
      saveShifts(updatedShifts);
    }

    // 5. Increment Profile sequence
    const updatedProfile: BusinessProfile = {
      ...profile,
      nextInvoiceSeq: nextInvoiceSeq + 1,
      nextControlSeq: nextControlSeq + 1
    };
    setProfile(updatedProfile);
    saveBusinessProfile(updatedProfile);

    // 6. Close checkout and show receipt
    setIsCheckoutOpen(false);
    setActiveReceiptSale(newSale);
    setIsReceiptOpen(true);
  };

  // Convert Quote to Sale
  const handleConvertQuoteToSale = (quote: Quote) => {
    const customer = customers.find(c => c.id === quote.customerId) || {
      id: quote.customerId,
      docType: 'V',
      docNumber: quote.customerDoc.replace(/\D/g, ''),
      name: quote.customerName,
      phone: quote.customerPhone,
      totalDebtUSD: 0,
      createdAt: quote.date
    };

    // Mark quote as converted
    const updatedQuotes = quotes.map(q => q.id === quote.id ? { ...q, status: 'converted' as const } : q);
    setQuotes(updatedQuotes);
    saveQuotes(updatedQuotes);

    // Switch to POS and open checkout with quote items
    setCurrentView('pos');
    handleOpenCheckout(quote.items, customer);
  };

  // Save / Update Quote
  const handleSaveQuote = (newQuote: Quote) => {
    const updated = [newQuote, ...quotes];
    setQuotes(updated);
    saveQuotes(updated);

    const updatedProfile: BusinessProfile = {
      ...profile,
      nextQuoteSeq: profile.nextQuoteSeq + 1
    };
    setProfile(updatedProfile);
    saveBusinessProfile(updatedProfile);
  };

  // Delete Quote
  const handleDeleteQuote = (quoteId: string) => {
    const updated = quotes.filter(q => q.id !== quoteId);
    setQuotes(updated);
    saveQuotes(updated);
  };

  // Save / Update Product
  const handleSaveProduct = (prod: Product) => {
    const exists = products.some(p => p.id === prod.id);
    let updated: Product[];
    if (exists) {
      updated = products.map(p => p.id === prod.id ? prod : p);
    } else {
      updated = [prod, ...products];
    }
    setProducts(updated);
    saveProducts(updated);
  };

  // Delete Product
  const handleDeleteProduct = (prodId: string) => {
    const updated = products.filter(p => p.id !== prodId);
    setProducts(updated);
    saveProducts(updated);
  };

  // Register Installment on Debt (Libreta de Fiados)
  const handleRegisterInstallment = (debtId: string, installment: DebtPaymentInstallment) => {
    const updatedDebts = debts.map(d => {
      if (d.id === debtId) {
        const newPaid = Number((d.paidDebtUSD + installment.amountUSD).toFixed(2));
        const newRemaining = Math.max(0, Number((d.originalDebtUSD - newPaid).toFixed(2)));
        const newStatus = newRemaining <= 0.01 ? ('paid' as const) : ('partially_paid' as const);

        return {
          ...d,
          paidDebtUSD: newPaid,
          remainingDebtUSD: newRemaining,
          status: newStatus,
          installments: [...d.installments, installment]
        };
      }
      return d;
    });

    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Update customer debt total
    const debtObj = debts.find(d => d.id === debtId);
    if (debtObj) {
      const updatedCustomers = customers.map(c => {
        if (c.id === debtObj.customerId) {
          return {
            ...c,
            totalDebtUSD: Math.max(0, (c.totalDebtUSD || 0) - installment.amountUSD)
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
    }

    // If active shift and cash payment, update cash register
    if (activeShift) {
      let deltaUSD = 0;
      let deltaVES = 0;
      if (installment.method === 'cash_usd') {
        deltaUSD = installment.amountUSD;
      } else if (installment.method === 'cash_ves') {
        deltaVES = installment.amountVES;
      }

      if (deltaUSD > 0 || deltaVES > 0) {
        const updatedShift: CashShift = {
          ...activeShift,
          expectedCashUSD: activeShift.expectedCashUSD + deltaUSD,
          expectedCashVES: activeShift.expectedCashVES + deltaVES
        };
        setActiveShift(updatedShift);
        const updatedShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
        setShifts(updatedShifts);
        saveShifts(updatedShifts);
      }
    }
  };

  // Open Shift
  const handleOpenShift = (openingUSD: number, openingVES: number, cashierName: string) => {
    const newShift: CashShift = {
      id: `shift-${Date.now()}`,
      cashierName,
      openedAt: new Date().toISOString(),
      openingUSD,
      openingVES,
      expectedCashUSD: openingUSD,
      expectedCashVES: openingVES,
      totalSalesUSD: 0,
      totalSalesVES: 0,
      salesCount: 0,
      status: 'open',
      movements: [],
      totalsByMethodUSD: {
        cash_usd: 0,
        cash_ves: 0,
        pago_movil: 0,
        punto_venta: 0,
        zelle: 0,
        binance_pay: 0,
        credito_fiado: 0
      },
      totalsByMethodVES: {
        cash_usd: 0,
        cash_ves: 0,
        pago_movil: 0,
        punto_venta: 0,
        zelle: 0,
        binance_pay: 0,
        credito_fiado: 0
      }
    };

    setActiveShift(newShift);
    const updated = [newShift, ...shifts];
    setShifts(updated);
    saveShifts(updated);
  };

  // Add Cash Movement (Efectivo entrada/salida)
  const handleAddShiftMovement = (type: 'cash_in' | 'cash_out', currency: 'USD' | 'VES', amount: number, reason: string) => {
    if (!activeShift) return;

    const amountUSD = currency === 'USD' ? amount : Number((amount / bcvRate).toFixed(2));
    const amountVES = currency === 'VES' ? amount : Number((amount * bcvRate).toFixed(2));

    const mov: CashMovement = {
      id: `mov-${Date.now()}`,
      shiftId: activeShift.id,
      timestamp: new Date().toISOString(),
      type,
      currency,
      amount,
      amountUSD,
      amountVES,
      reason
    };

    let newExpUSD = activeShift.expectedCashUSD;
    let newExpVES = activeShift.expectedCashVES;

    if (currency === 'USD') {
      newExpUSD = type === 'cash_in' ? newExpUSD + amount : newExpUSD - amount;
    } else {
      newExpVES = type === 'cash_in' ? newExpVES + amount : newExpVES - amount;
    }

    const updatedShift: CashShift = {
      ...activeShift,
      expectedCashUSD: Math.max(0, newExpUSD),
      expectedCashVES: Math.max(0, newExpVES),
      movements: [...activeShift.movements, mov]
    };

    setActiveShift(updatedShift);
    const updatedShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
    setShifts(updatedShifts);
    saveShifts(updatedShifts);
  };

  // Close Shift (Arqueo & Cierre Z)
  const handleCloseShift = (actualCashUSD: number, actualCashVES: number, notes?: string) => {
    if (!activeShift) return;

    const closedShift: CashShift = {
      ...activeShift,
      closedAt: new Date().toISOString(),
      actualCashUSD,
      actualCashVES,
      differenceUSD: Number((actualCashUSD - activeShift.expectedCashUSD).toFixed(2)),
      differenceVES: Number((actualCashVES - activeShift.expectedCashVES).toFixed(2)),
      status: 'closed',
      notes
    };

    setActiveShift(null);
    const updatedShifts = shifts.map(s => s.id === closedShift.id ? closedShift : s);
    setShifts(updatedShifts);
    saveShifts(updatedShifts);
  };

  // --- Financial Module Handlers (Finanzas & Tesorería) ---

  // 1. Expenses Handler
  const handleSaveExpense = (newExpense: Expense) => {
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);

    // If expense affects cash drawer / active shift, register cash movement in real time
    if (newExpense.affectsCashShift && activeShift) {
      const isUSD = newExpense.paymentMethod === 'cash_usd';
      const currency = isUSD ? 'USD' : 'VES';
      const amount = isUSD ? newExpense.amountUSD : (newExpense.amountVES || newExpense.amountUSD * bcvRate);
      
      handleAddShiftMovement(
        'cash_out',
        currency,
        amount,
        `Egreso Operativo: ${newExpense.description} (${newExpense.category})`
      );
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== expenseId);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  };

  // 2. Supplier Debt Handler
  const handleSaveSupplierDebt = (newDebt: SupplierDebt, newSupplier?: Supplier) => {
    const updatedDebts = [newDebt, ...supplierDebts];
    setSupplierDebts(updatedDebts);
    saveSupplierDebts(updatedDebts);

    let updatedSuppliers = [...suppliers];
    if (newSupplier) {
      const exists = suppliers.some(s => s.id === newSupplier.id || s.rif === newSupplier.rif);
      if (!exists) {
        updatedSuppliers = [newSupplier, ...suppliers];
      }
    }

    // Update supplier's accumulated remaining debt
    updatedSuppliers = updatedSuppliers.map(s => {
      if (s.id === newDebt.supplierId || s.rif === newDebt.supplierRif) {
        return {
          ...s,
          totalDebtUSD: (s.totalDebtUSD || 0) + newDebt.remainingDebtUSD
        };
      }
      return s;
    });

    setSuppliers(updatedSuppliers);
    saveSuppliers(updatedSuppliers);
  };

  // 3. Supplier Payment / Installment Handler
  const handleRegisterSupplierPayment = (debtId: string, installment: SupplierDebtInstallment) => {
    let affectedDebt: SupplierDebt | null = null;

    const updatedDebts = supplierDebts.map(debt => {
      if (debt.id !== debtId) return debt;

      const newPaid = Number(((debt.paidDebtUSD || 0) + installment.amountUSD).toFixed(2));
      const newRemaining = Math.max(0, Number((debt.originalDebtUSD - newPaid).toFixed(2)));
      const newStatus: 'pending' | 'partial' | 'paid' = newRemaining <= 0.01 ? 'paid' : 'partial';

      const updated: SupplierDebt = {
        ...debt,
        paidDebtUSD: newPaid,
        remainingDebtUSD: newRemaining,
        status: newStatus,
        installments: [...(debt.installments || []), installment]
      };

      affectedDebt = updated;
      return updated;
    });

    setSupplierDebts(updatedDebts);
    saveSupplierDebts(updatedDebts);

    // Update supplier totalDebtUSD
    if (affectedDebt) {
      const targetDebt: SupplierDebt = affectedDebt;
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === targetDebt.supplierId || s.rif === targetDebt.supplierRif) {
          return {
            ...s,
            totalDebtUSD: Math.max(0, Number(((s.totalDebtUSD || 0) - installment.amountUSD).toFixed(2)) )
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliers);
      saveSuppliers(updatedSuppliers);
    }

    // If installment was paid out of the active shift's cash drawer, deduce it in real time
    if (installment.affectsCashShift && activeShift) {
      const isUSD = installment.method === 'cash_usd';
      const currency = isUSD ? 'USD' : 'VES';
      const amount = isUSD ? installment.amountUSD : (installment.amountVES || installment.amountUSD * (installment.rateApplied || bcvRate));

      const debtName = affectedDebt ? (affectedDebt as SupplierDebt).supplierName : 'Proveedor';
      const invNum = affectedDebt ? (affectedDebt as SupplierDebt).invoiceNumber : '';

      handleAddShiftMovement(
        'cash_out',
        currency,
        amount,
        `Pago a Proveedor: ${debtName} (Factura #${invNum})`
      );
    }
  };

  // 4. Add direct customer debt
  const handleAddNewCustomerDebt = (newDebt: DebtAccount) => {
    const updatedDebts = [newDebt, ...debts];
    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    const updatedCustomers = customers.map(c => {
      if (c.id === newDebt.customerId) {
        return {
          ...c,
          totalDebtUSD: (c.totalDebtUSD || 0) + newDebt.remainingDebtUSD
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveCustomers(updatedCustomers);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Global Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
        bcvRate={bcvRate}
        rateDate={rateDate}
        isRateLoading={isRateLoading}
        onSyncRate={syncRate}
        onUpdateRate={handleUpdateRate}
        userRole={userRole}
        currentUser={currentUser}
        onOpenUserSwitch={() => {
          setUserSwitchRoleRequired(undefined);
          setUserSwitchPendingAction(null);
          setIsUserSwitchOpen(true);
        }}
        onToggleRole={handleRoleToggle}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        activeShift={activeShift}
        lowStockCount={products.filter(p => p.stock <= p.minStock).length}
        pendingDebtsCount={debts.filter(d => d.status !== 'paid').length}
        pendingPayablesCount={supplierDebts.filter(d => d.status !== 'paid').length}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden pb-14 md:pb-0">
        {currentView === 'pos' && (
          <POSScreen
            products={products}
            customers={customers}
            bcvRate={bcvRate}
            profile={profile}
            userRole={userRole}
            onOpenCheckout={handleOpenCheckout}
            onQuickAddCustomer={handleQuickAddCustomer}
          />
        )}

        {currentView === 'quotes' && (
          <div className="flex-1 overflow-y-auto">
            <QuotesManager
              quotes={quotes}
              products={products}
              customers={customers}
              bcvRate={bcvRate}
              profile={profile}
              onSaveQuote={handleSaveQuote}
              onConvertToSale={handleConvertQuoteToSale}
              onDeleteQuote={handleDeleteQuote}
            />
          </div>
        )}

        {currentView === 'inventory' && (
          <div className="flex-1 overflow-y-auto">
            <InventoryManager
              products={products}
              bcvRate={bcvRate}
              profile={profile}
              userRole={userRole}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </div>
        )}

        {currentView === 'debts' && (
          <div className="flex-1 overflow-y-auto">
            <DebtsManager
              debts={debts}
              bcvRate={bcvRate}
              profile={profile}
              onRegisterInstallment={handleRegisterInstallment}
            />
          </div>
        )}

        {currentView === 'finance' && (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <FinanceManager
              debts={debts}
              supplierDebts={supplierDebts}
              suppliers={suppliers}
              expenses={expenses}
              customers={customers}
              bcvRate={bcvRate}
              activeShift={activeShift}
              profile={profile}
              onRegisterCustomerInstallment={handleRegisterInstallment}
              onAddNewCustomerDebt={handleAddNewCustomerDebt}
              onSaveSupplierDebt={handleSaveSupplierDebt}
              onRegisterSupplierPayment={handleRegisterSupplierPayment}
              onSaveExpense={handleSaveExpense}
              onDeleteExpense={handleDeleteExpense}
              onOpenShiftModal={() => setIsShiftModalOpen(true)}
            />
          </div>
        )}

        {currentView === 'sales' && (
          <div className="flex-1 overflow-y-auto">
            <SalesHistory
              sales={sales}
              bcvRate={bcvRate}
              profile={profile}
              userRole={currentUser.role}
              onRequireAdmin={() => {
                setUserSwitchRoleRequired('admin');
                setUserSwitchPendingAction(null);
                setIsUserSwitchOpen(true);
              }}
              onViewReceipt={(sale) => {
                setActiveReceiptSale(sale);
                setIsReceiptOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Modal 1: Split Payment Checkout */}
      {isCheckoutOpen && checkoutCustomer && (
        <SplitPaymentModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          items={checkoutItems}
          customer={checkoutCustomer}
          bcvRate={bcvRate}
          profile={profile}
          onCompleteSale={handleCompleteSale}
        />
      )}

      {/* Modal 2: Thermal Receipt / PDF / WhatsApp */}
      {isReceiptOpen && activeReceiptSale && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sale={activeReceiptSale}
          profile={profile}
          onNewSale={() => {
            setIsReceiptOpen(false);
            setCurrentView('pos');
          }}
        />
      )}

      {/* Modal 3: Cash Shift & Z Close */}
      {isShiftModalOpen && (
        <CashShiftModal
          isOpen={isShiftModalOpen}
          onClose={() => setIsShiftModalOpen(false)}
          activeShift={activeShift}
          bcvRate={bcvRate}
          profile={profile}
          onOpenShift={handleOpenShift}
          onAddMovement={handleAddShiftMovement}
          onCloseShift={handleCloseShift}
        />
      )}

      {/* Modal 4: Business Settings, Users & Backup */}
      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          profile={profile}
          onSaveProfile={(prof) => {
            setProfile(prof);
            saveBusinessProfile(prof);
          }}
          onReloadData={loadAllData}
          users={users}
          currentUser={currentUser}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
          onSwitchUser={handleSwitchUser}
          onOpenPWAInstall={() => setIsPWAInstallOpen(true)}
        />
      )}

      {/* Modal 5: User Switch / Password Authentication */}
      {isUserSwitchOpen && (
        <UserSwitchModal
          isOpen={isUserSwitchOpen}
          onClose={() => {
            setIsUserSwitchOpen(false);
            setUserSwitchRoleRequired(undefined);
            setUserSwitchPendingAction(null);
          }}
          users={users}
          currentUser={currentUser}
          onSwitchUser={handleSwitchUser}
          requiredRole={userSwitchRoleRequired}
          title={userSwitchRoleRequired === 'admin' ? 'Acceso de Administrador Requerido' : 'Cambiar de Cuenta de Usuario'}
          subtitle={userSwitchRoleRequired === 'admin' ? 'Esta sección contiene información contable y sensible (Finanzas / Reportes) y requiere credenciales de Administrador.' : 'Selecciona una cuenta e ingresa la contraseña o PIN.'}
          onSuccessOverride={() => {
            if (userSwitchPendingAction) {
              userSwitchPendingAction();
            }
          }}
        />
      )}

      {/* Modal 6: Developer Architecture, SQL & REST API Specs */}
      {isArchitectureOpen && (
        <ArchitectureModal
          isOpen={isArchitectureOpen}
          onClose={() => setIsArchitectureOpen(false)}
        />
      )}

      {/* Modal 7: PWA Installer Wizard (Windows & Android) */}
      {isPWAInstallOpen && (
        <PWAInstallModal
          isOpen={isPWAInstallOpen}
          onClose={() => setIsPWAInstallOpen(false)}
        />
      )}

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
