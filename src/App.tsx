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
  SyncModal 
} from './components/Sync/SyncModal';
import { 
  realtimeSync, 
  ConnectionStatus 
} from './services/realtimeSync';
import {
  ensureFirestoreInitialized,
  subscribeProducts,
  subscribeSales,
  subscribeCustomers,
  subscribeDebts,
  subscribeShifts,
  subscribeExpenses,
  subscribeSuppliers,
  subscribeSupplierDebts,
  subscribeGlobalSettings,
  firestoreSaveProduct,
  firestoreDeleteProduct,
  firestoreClearAllProducts,
  firestoreBatchUpdateStock,
  firestoreSaveSale,
  firestoreSaveCustomer,
  firestoreDeleteCustomer,
  firestoreSaveDebt,
  firestoreSaveShift,
  firestoreSaveExpense,
  firestoreDeleteExpense,
  firestoreSaveSupplier,
  firestoreSaveSupplierDebt,
  firestoreSaveSettings
} from './services/firestoreSync';
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
  const [saleCompletedTrigger, setSaleCompletedTrigger] = useState<number>(0);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isPWAInstallOpen, setIsPWAInstallOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Real-time synchronization state
  const [syncStatus, setSyncStatus] = useState<ConnectionStatus>(realtimeSync.getStatus());
  const [syncConnectedCount, setSyncConnectedCount] = useState<number>(realtimeSync.getConnectedDevicesCount());
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [recentSyncEvents, setRecentSyncEvents] = useState<Array<{ id: string; time: string; text: string; type: 'sale' | 'product' | 'debt' | 'shift' | 'info' }>>([
    { id: 'init-1', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: 'Sistema conectado con sincronización en tiempo real', type: 'info' }
  ]);

  const addSyncEvent = useCallback((text: string, type: 'sale' | 'product' | 'debt' | 'shift' | 'info' = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const newEvent = { id: `evt-${Date.now()}-${Math.random()}`, time, text, type };
    setRecentSyncEvents(prev => [newEvent, ...prev.slice(0, 30)]);
    setSyncToastMessage(text);
    setTimeout(() => {
      setSyncToastMessage(prev => prev === text ? null : prev);
    }, 4000);
  }, []);

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

  // Fetch BCV Rate on boot and periodically
  const syncRate = useCallback(async () => {
    setIsRateLoading(true);
    try {
      const data = await fetchBCVRate();
      if (data && typeof data.rate === 'number' && data.rate > 200) {
        setBcvRate(data.rate);
        setRateDate(data.date);
        setIsRateOverridden(data.isOverridden || false);
        firestoreSaveSettings({
          bcvRate: data.rate,
          rateDate: data.date
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Could not sync BCV rate, using fallback', err);
    } finally {
      setIsRateLoading(false);
    }
  }, []);

  // Handle incoming full state from central server
  const handleRemoteFullState = useCallback((serverState: any) => {
    if (!serverState) return;
    if (Array.isArray(serverState.products) && serverState.products.length > 0) {
      setProducts(serverState.products);
      saveProducts(serverState.products);
    }
    if (Array.isArray(serverState.customers) && serverState.customers.length > 0) {
      setCustomers(serverState.customers);
      saveCustomers(serverState.customers);
    }
    if (Array.isArray(serverState.sales)) {
      setSales(serverState.sales);
      saveSales(serverState.sales);
    }
    if (Array.isArray(serverState.quotes)) {
      setQuotes(serverState.quotes);
      saveQuotes(serverState.quotes);
    }
    if (Array.isArray(serverState.debts)) {
      setDebts(serverState.debts);
      saveDebts(serverState.debts);
    }
    if (Array.isArray(serverState.shifts)) {
      setShifts(serverState.shifts);
      saveShifts(serverState.shifts);
      const open = serverState.shifts.find((s: any) => s.status === 'open') || null;
      setActiveShift(open);
    }
    if (Array.isArray(serverState.expenses)) {
      setExpenses(serverState.expenses);
      saveExpenses(serverState.expenses);
    }
    if (Array.isArray(serverState.suppliers)) {
      setSuppliers(serverState.suppliers);
      saveSuppliers(serverState.suppliers);
    }
    if (Array.isArray(serverState.supplierDebts)) {
      setSupplierDebts(serverState.supplierDebts);
      saveSupplierDebts(serverState.supplierDebts);
    }
    if (serverState.profile) {
      setProfile(serverState.profile);
      saveBusinessProfile(serverState.profile);
    }
    if (Array.isArray(serverState.users) && serverState.users.length > 0) {
      setUsers(serverState.users);
      saveUsers(serverState.users);
    }
    addSyncEvent('Base de datos central sincronizada con éxito', 'info');
  }, [addSyncEvent]);

  // Handle incoming remote mutation broadcasted from other devices
  const handleRemoteMutation = useCallback((entity: string, action: string, payload: any, senderId: string) => {
    if (senderId && senderId === realtimeSync.getDeviceId()) {
      return; // Ignore own echoes
    }

    if (entity === 'sales' && action === 'CREATE' && payload) {
      setSales(prev => {
        if (prev.some(s => s.id === payload.id)) return prev;
        const updated = [payload, ...prev];
        saveSales(updated);
        return updated;
      });
      addSyncEvent(`Venta recibida en vivo: ${payload.invoiceNumber || 'Comprobante'} (${payload.customerName || 'Cliente'})`, 'sale');
    } else if (entity === 'products') {
      if (action === 'CREATE' || action === 'UPDATE') {
        setProducts(prev => {
          const exists = prev.some(p => p.id === payload.id);
          const updated = exists ? prev.map(p => p.id === payload.id ? payload : p) : [payload, ...prev];
          saveProducts(updated);
          return updated;
        });
        addSyncEvent(`Inventario actualizado: ${payload.name}`, 'product');
      } else if (action === 'DELETE') {
        const prodId = typeof payload === 'string' ? payload : payload.id;
        setProducts(prev => {
          const updated = prev.filter(p => p.id !== prodId);
          saveProducts(updated);
          return updated;
        });
        addSyncEvent('Producto eliminado desde otro terminal', 'product');
      } else if (action === 'UPDATE_STOCK_BATCH' && Array.isArray(payload)) {
        setProducts(prev => {
          const updated = prev.map(prod => {
            const match = payload.find((item: any) => item.id === prod.id);
            return match ? { ...prod, stock: match.stock } : prod;
          });
          saveProducts(updated);
          return updated;
        });
        addSyncEvent('Stock de productos sincronizado', 'product');
      }
    } else if (entity === 'debts') {
      setDebts(prev => {
        const exists = prev.some(d => d.id === payload.id);
        const updated = exists ? prev.map(d => d.id === payload.id ? payload : d) : [payload, ...prev];
        saveDebts(updated);
        return updated;
      });
      addSyncEvent(`Libreta de fiados actualizada: ${payload.customerName || 'Cliente'}`, 'debt');
    } else if (entity === 'shifts') {
      setShifts(prev => {
        const exists = prev.some(s => s.id === payload.id);
        const updated = exists ? prev.map(s => s.id === payload.id ? payload : s) : [payload, ...prev];
        saveShifts(updated);
        const open = updated.find(s => s.status === 'open') || null;
        setActiveShift(open);
        return updated;
      });
      addSyncEvent('Turno de caja actualizado en vivo', 'shift');
    } else if (entity === 'expenses') {
      if (action === 'CREATE' || action === 'UPDATE') {
        setExpenses(prev => {
          const exists = prev.some(e => e.id === payload.id);
          const updated = exists ? prev.map(e => e.id === payload.id ? payload : e) : [payload, ...prev];
          saveExpenses(updated);
          return updated;
        });
        addSyncEvent(`Egreso registrado: ${payload.description || ''}`, 'info');
      } else if (action === 'DELETE') {
        const expId = typeof payload === 'string' ? payload : payload.id;
        setExpenses(prev => {
          const updated = prev.filter(e => e.id !== expId);
          saveExpenses(updated);
          return updated;
        });
      }
    } else if (entity === 'customers') {
      setCustomers(prev => {
        const exists = prev.some(c => c.id === payload.id);
        const updated = exists ? prev.map(c => c.id === payload.id ? payload : c) : [payload, ...prev];
        saveCustomers(updated);
        return updated;
      });
      addSyncEvent(`Cliente registrado / actualizado: ${payload.name || ''}`, 'info');
    } else if (entity === 'quotes') {
      if (action === 'CREATE' || action === 'UPDATE') {
        setQuotes(prev => {
          const exists = prev.some(q => q.id === payload.id);
          const updated = exists ? prev.map(q => q.id === payload.id ? payload : q) : [payload, ...prev];
          saveQuotes(updated);
          return updated;
        });
      } else if (action === 'DELETE') {
        const qId = typeof payload === 'string' ? payload : payload.id;
        setQuotes(prev => {
          const updated = prev.filter(q => q.id !== qId);
          saveQuotes(updated);
          return updated;
        });
      }
    } else if (entity === 'profile') {
      setProfile(payload);
      saveBusinessProfile(payload);
      addSyncEvent('Datos de la empresa actualizados', 'info');
    }
  }, [addSyncEvent]);

  useEffect(() => {
    loadAllData();
    syncRate();

    // 1. Initialize Firestore & seed initial collections if needed
    ensureFirestoreInitialized().catch(err => console.error('Firestore init error:', err));

    // 2. Realtime subscriptions to Firestore collections
    const unsubProducts = subscribeProducts((updatedProducts) => {
      setProducts(updatedProducts);
      saveProducts(updatedProducts);
    });

    const unsubSales = subscribeSales((updatedSales) => {
      setSales(updatedSales);
      saveSales(updatedSales);
    });

    const unsubCustomers = subscribeCustomers((updatedCustomers) => {
      setCustomers(updatedCustomers);
      saveCustomers(updatedCustomers);
    });

    const unsubDebts = subscribeDebts((updatedDebts) => {
      setDebts(updatedDebts);
      saveDebts(updatedDebts);
    });

    const unsubShifts = subscribeShifts((updatedShifts) => {
      setShifts(updatedShifts);
      saveShifts(updatedShifts);
      const open = updatedShifts.find((s: any) => s.status === 'open') || null;
      setActiveShift(open);
    });

    const unsubExpenses = subscribeExpenses((updatedExpenses) => {
      setExpenses(updatedExpenses);
      saveExpenses(updatedExpenses);
    });

    const unsubSuppliers = subscribeSuppliers((updatedSuppliers) => {
      setSuppliers(updatedSuppliers);
      saveSuppliers(updatedSuppliers);
    });

    const unsubSupplierDebts = subscribeSupplierDebts((updatedSupplierDebts) => {
      setSupplierDebts(updatedSupplierDebts);
      saveSupplierDebts(updatedSupplierDebts);
    });

    const unsubSettings = subscribeGlobalSettings((settings) => {
      if (settings.profile) {
        setProfile(settings.profile);
        saveBusinessProfile(settings.profile);
      }
      if (settings.bcvRate && settings.bcvRate > 200) {
        setBcvRate(settings.bcvRate);
      }
    });

    // Check rate on window focus & every 20 minutes
    const handleFocus = () => {
      syncRate();
    };
    window.addEventListener('focus', handleFocus);
    const rateInterval = setInterval(syncRate, 1000 * 60 * 20);

    // 3. Central realtime WebSocket connection for device presence
    realtimeSync.connect();

    const unsubscribeWs = realtimeSync.subscribe({
      onStatusChange: (status, count) => {
        setSyncStatus(status);
        setSyncConnectedCount(count);
      },
      onMutation: (entity, action, payload, senderId) => {
        handleRemoteMutation(entity, action, payload, senderId);
      },
      onFullState: (serverState) => {
        handleRemoteFullState(serverState);
      }
    });

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(rateInterval);
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubDebts();
      unsubShifts();
      unsubExpenses();
      unsubSuppliers();
      unsubSupplierDebts();
      unsubSettings();
      unsubscribeWs();
    };
  }, [loadAllData, syncRate, handleRemoteMutation, handleRemoteFullState]);

  // Manual trigger to pull all data from server
  const handleForceSyncDownload = async () => {
    const data = await realtimeSync.fetchCentralState();
    if (data) {
      handleRemoteFullState(data);
    }
  };

  // Manual trigger to push local database to server
  const handleForceSyncUpload = async () => {
    const fullState = {
      products,
      customers,
      sales,
      quotes,
      debts,
      shifts,
      expenses,
      suppliers,
      supplierDebts,
      profile,
      users
    };
    await realtimeSync.pushFullLocalState(fullState);
    addSyncEvent('Datos locales publicados en el servidor central', 'info');
  };

  // Handle Manual BCV Rate change
  const handleUpdateRate = (newRate: number) => {
    setBcvRate(newRate);
    setIsRateOverridden(true);
    localStorage.setItem('negofact_manual_bcv_rate', newRate.toString());
    firestoreSaveSettings({ bcvRate: newRate, rateDate }).catch(err => console.error('Firestore save rate error:', err));
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
    realtimeSync.broadcastMutation('customers', 'CREATE', newCust);
    firestoreSaveCustomer(newCust).catch(err => console.error('Firestore save customer error:', err));
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
    change?: ChangeDetail,
    saleItems?: CartItem[],
    saleCustomer?: Customer
  ) => {
    const itemsToCharge = (saleItems && saleItems.length > 0) ? saleItems : checkoutItems;
    if (itemsToCharge.length === 0) {
      console.warn('No hay artículos para procesar en la venta');
      return;
    }

    const finalCustomer: Customer = saleCustomer || checkoutCustomer || customers.find(c => c.id === 'cust-final') || {
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

    const nextInvoiceSeq = profile?.nextInvoiceSeq || 1001;
    const nextControlSeq = profile?.nextControlSeq || 5001;

    const invoiceNumber = `${profile?.invoicePrefix || 'FACT-'}${nextInvoiceSeq.toString().padStart(6, '0')}`;
    const controlNumber = `${profile?.controlPrefix || '00-'}${nextControlSeq.toString().padStart(6, '0')}`;

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      invoiceNumber,
      controlNumber,
      date: new Date().toISOString(),
      customerId: finalCustomer.id,
      customerName: finalCustomer.name || 'Consumidor Final',
      customerDoc: `${finalCustomer.docType || 'V'}-${finalCustomer.docNumber || '00000000'}`,
      customerPhone: finalCustomer.phone || '',
      items: itemsToCharge,
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
      const purchased = itemsToCharge.filter(it => it.productId === prod.id);
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
    let createdDebt: DebtAccount | null = null;
    let updatedCustomersList = customers;
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
      createdDebt = newDebt;

      const updatedDebts = [newDebt, ...debts];
      setDebts(updatedDebts);
      saveDebts(updatedDebts);

      // Update customer total debt
      updatedCustomersList = customers.map(c => {
        if (c.id === checkoutCustomer.id) {
          return {
            ...c,
            totalDebtUSD: (c.totalDebtUSD || 0) + totals.creditAmountUSD
          };
        }
        return c;
      });
      setCustomers(updatedCustomersList);
      saveCustomers(updatedCustomersList);
    }

    // 4. Update Cash Shift if active
    let updatedShiftObj: CashShift | null = null;
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
      updatedShiftObj = updatedShift;

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

    // Broadcast changes to central server & other connected devices
    realtimeSync.broadcastMutation('sales', 'CREATE', newSale);
    realtimeSync.broadcastMutation('products', 'UPDATE_STOCK_BATCH', updatedProducts);
    if (createdDebt) {
      realtimeSync.broadcastMutation('debts', 'CREATE', createdDebt);
      realtimeSync.broadcastMutation('customers', 'UPDATE_BATCH', updatedCustomersList);
    }
    if (updatedShiftObj) {
      realtimeSync.broadcastMutation('shifts', 'UPDATE', updatedShiftObj);
    }
    realtimeSync.broadcastMutation('profile', 'UPDATE', updatedProfile);

    // Save to Firestore database in real time
    firestoreSaveSale(newSale).catch(err => console.error('Firestore save sale error:', err));
    const stockUpdates = updatedProducts.map(p => ({ id: p.id, stock: p.stock }));
    firestoreBatchUpdateStock(stockUpdates).catch(err => console.error('Firestore batch stock error:', err));
    if (createdDebt) {
      firestoreSaveDebt(createdDebt).catch(err => console.error('Firestore save debt error:', err));
      const targetCustomer = updatedCustomersList.find(c => c.id === createdDebt!.customerId);
      if (targetCustomer) {
        firestoreSaveCustomer(targetCustomer).catch(err => console.error('Firestore save customer error:', err));
      }
    }
    if (updatedShiftObj) {
      firestoreSaveShift(updatedShiftObj).catch(err => console.error('Firestore save shift error:', err));
    }
    firestoreSaveSettings({ profile: updatedProfile }).catch(err => console.error('Firestore save settings error:', err));

    // 6. Close checkout, trigger POS cart reset, and show receipt
    setIsCheckoutOpen(false);
    setSaleCompletedTrigger(Date.now());
    setActiveReceiptSale(newSale);
    setIsReceiptOpen(true);
    addSyncEvent(`Venta ${newSale.invoiceNumber} procesada con éxito ($${newSale.totalUSD.toFixed(2)})`, 'sale');
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

    realtimeSync.broadcastMutation('quotes', 'CREATE', newQuote);
    realtimeSync.broadcastMutation('profile', 'UPDATE', updatedProfile);
  };

  // Delete Quote
  const handleDeleteQuote = (quoteId: string) => {
    const updated = quotes.filter(q => q.id !== quoteId);
    setQuotes(updated);
    saveQuotes(updated);
    realtimeSync.broadcastMutation('quotes', 'DELETE', quoteId);
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
    realtimeSync.broadcastMutation('products', exists ? 'UPDATE' : 'CREATE', prod);
    firestoreSaveProduct(prod).catch(err => console.error('Firestore save product error:', err));
  };

  // Delete Product
  const handleDeleteProduct = (prodId: string) => {
    const updated = products.filter(p => p.id !== prodId);
    setProducts(updated);
    saveProducts(updated);
    realtimeSync.broadcastMutation('products', 'DELETE', prodId);
    firestoreDeleteProduct(prodId).catch(err => console.error('Firestore delete product error:', err));
  };

  // Clear All Products
  const handleClearAllProducts = async () => {
    if (window.confirm('¿Está seguro de que desea eliminar todos los productos del inventario? Esta acción limpiará el catálogo de forma permanente en la nube y en este dispositivo.')) {
      setProducts([]);
      saveProducts([]);
      realtimeSync.broadcastMutation('products', 'UPDATE_STOCK_BATCH', []);
      await firestoreClearAllProducts();
      addSyncEvent('Catálogo de productos vaciado por completo', 'product');
    }
  };

  // Register Installment on Debt (Libreta de Fiados)
  const handleRegisterInstallment = (debtId: string, installment: DebtPaymentInstallment) => {
    let affectedDebt: DebtAccount | null = null;
    const updatedDebts = debts.map(d => {
      if (d.id === debtId) {
        const newPaid = Number((d.paidDebtUSD + installment.amountUSD).toFixed(2));
        const newRemaining = Math.max(0, Number((d.originalDebtUSD - newPaid).toFixed(2)));
        const newStatus = newRemaining <= 0.01 ? ('paid' as const) : ('partially_paid' as const);

        const updatedD: DebtAccount = {
          ...d,
          paidDebtUSD: newPaid,
          remainingDebtUSD: newRemaining,
          status: newStatus,
          installments: [...d.installments, installment]
        };
        affectedDebt = updatedD;
        return updatedD;
      }
      return d;
    });

    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Update customer debt total
    let updatedCustList = customers;
    const debtObj = debts.find(d => d.id === debtId);
    if (debtObj) {
      updatedCustList = customers.map(c => {
        if (c.id === debtObj.customerId) {
          return {
            ...c,
            totalDebtUSD: Math.max(0, (c.totalDebtUSD || 0) - installment.amountUSD)
          };
        }
        return c;
      });
      setCustomers(updatedCustList);
      saveCustomers(updatedCustList);
    }

    // If active shift and cash payment, update cash register
    let updatedShiftObj: CashShift | null = null;
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
        updatedShiftObj = updatedShift;
        setActiveShift(updatedShift);
        const updatedShifts = shifts.map(s => s.id === updatedShift.id ? updatedShift : s);
        setShifts(updatedShifts);
        saveShifts(updatedShifts);
      }
    }

    // Broadcast to other devices
    if (affectedDebt) {
      realtimeSync.broadcastMutation('debts', 'UPDATE', affectedDebt);
      realtimeSync.broadcastMutation('customers', 'UPDATE_BATCH', updatedCustList);
      firestoreSaveDebt(affectedDebt).catch(err => console.error('Firestore save debt error:', err));
      const targetCustomer = updatedCustList.find(c => c.id === affectedDebt!.customerId);
      if (targetCustomer) {
        firestoreSaveCustomer(targetCustomer).catch(err => console.error('Firestore save customer error:', err));
      }
    }
    if (updatedShiftObj) {
      realtimeSync.broadcastMutation('shifts', 'UPDATE', updatedShiftObj);
      firestoreSaveShift(updatedShiftObj).catch(err => console.error('Firestore save shift error:', err));
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
    realtimeSync.broadcastMutation('shifts', 'CREATE', newShift);
    firestoreSaveShift(newShift).catch(err => console.error('Firestore save shift error:', err));
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
    realtimeSync.broadcastMutation('shifts', 'UPDATE', updatedShift);
    firestoreSaveShift(updatedShift).catch(err => console.error('Firestore save shift error:', err));
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
    realtimeSync.broadcastMutation('shifts', 'UPDATE', closedShift);
    firestoreSaveShift(closedShift).catch(err => console.error('Firestore save shift error:', err));
  };

  // --- Financial Module Handlers (Finanzas & Tesorería) ---

  // 1. Expenses Handler
  const handleSaveExpense = (newExpense: Expense) => {
    const updatedExpenses = [newExpense, ...expenses];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
    realtimeSync.broadcastMutation('expenses', 'CREATE', newExpense);
    firestoreSaveExpense(newExpense).catch(err => console.error('Firestore save expense error:', err));

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
    realtimeSync.broadcastMutation('expenses', 'DELETE', expenseId);
    firestoreDeleteExpense(expenseId).catch(err => console.error('Firestore delete expense error:', err));
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
        firestoreSaveSupplier(newSupplier).catch(err => console.error('Firestore save supplier error:', err));
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

    realtimeSync.broadcastMutation('supplierDebts', 'CREATE', newDebt);
    realtimeSync.broadcastMutation('suppliers', 'UPDATE_BATCH', updatedSuppliers);
    firestoreSaveSupplierDebt(newDebt).catch(err => console.error('Firestore save supplier debt error:', err));
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
    let updatedSuppliersList = suppliers;
    if (affectedDebt) {
      const targetDebt: SupplierDebt = affectedDebt;
      updatedSuppliersList = suppliers.map(s => {
        if (s.id === targetDebt.supplierId || s.rif === targetDebt.supplierRif) {
          return {
            ...s,
            totalDebtUSD: Math.max(0, Number(((s.totalDebtUSD || 0) - installment.amountUSD).toFixed(2)) )
          };
        }
        return s;
      });
      setSuppliers(updatedSuppliersList);
      saveSuppliers(updatedSuppliersList);
    }

    if (affectedDebt) {
      realtimeSync.broadcastMutation('supplierDebts', 'UPDATE', affectedDebt);
      realtimeSync.broadcastMutation('suppliers', 'UPDATE_BATCH', updatedSuppliersList);
      firestoreSaveSupplierDebt(affectedDebt).catch(err => console.error('Firestore save supplier debt error:', err));
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

    realtimeSync.broadcastMutation('debts', 'CREATE', newDebt);
    realtimeSync.broadcastMutation('customers', 'UPDATE_BATCH', updatedCustomers);
    firestoreSaveDebt(newDebt).catch(err => console.error('Firestore save debt error:', err));
    const targetCust = updatedCustomers.find(c => c.id === newDebt.customerId);
    if (targetCust) {
      firestoreSaveCustomer(targetCust).catch(err => console.error('Firestore save customer error:', err));
    }
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
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        syncStatus={syncStatus}
        syncConnectedCount={syncConnectedCount}
        activeShift={activeShift}
        lowStockCount={products.filter(p => p.stock <= p.minStock).length}
        pendingDebtsCount={debts.filter(d => d.status !== 'paid').length}
        pendingPayablesCount={supplierDebts.filter(d => d.status !== 'paid').length}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0">
        {currentView === 'pos' && (
          <POSScreen
            products={products}
            customers={customers}
            bcvRate={bcvRate}
            profile={profile}
            userRole={userRole}
            saleCompletedTrigger={saleCompletedTrigger}
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
              onClearAllProducts={handleClearAllProducts}
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
            realtimeSync.broadcastMutation('profile', 'UPDATE', prof);
            firestoreSaveSettings({ profile: prof }).catch(err => console.error('Firestore save profile error:', err));
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

      {/* Modal 8: Real-Time Multi-Device Sync Hub */}
      {isSyncModalOpen && (
        <SyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          status={syncStatus}
          connectedDevicesCount={syncConnectedCount}
          recentEvents={recentSyncEvents}
          onForceSyncDownload={handleForceSyncDownload}
          onForceSyncUpload={handleForceSyncUpload}
        />
      )}

      {/* Floating Live Sync Toast Notification */}
      {syncToastMessage && (
        <div 
          id="realtime-sync-toast"
          className="fixed bottom-16 right-4 z-50 max-w-sm bg-slate-900/95 border border-emerald-500/50 text-slate-100 px-3.5 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-400 leading-tight">Sincronización en Vivo</p>
            <p className="text-xs text-slate-200 truncate">{syncToastMessage}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setSyncToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Offline Status Connectivity Banner */}
      <OfflineIndicator />
    </div>
  );
}
