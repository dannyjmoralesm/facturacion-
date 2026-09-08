import { 
  collection, 
  doc, 
  getDoc,
  updateDoc,
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Product, 
  Customer, 
  Sale, 
  DebtAccount, 
  CashShift, 
  Expense, 
  Supplier, 
  SupplierDebt, 
  BusinessProfile 
} from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  DEFAULT_PROFILE 
} from '../utils/storage';

// Helper to remove undefined values which Firestore forbids
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  return JSON.parse(JSON.stringify(obj, (_, value) => {
    if (value === undefined) return null;
    return value;
  }));
}

// -------------------------------------------------------------
// Auto-initialization and seeding check
// -------------------------------------------------------------
let isInitializing = false;
let isInitialized = false;

export async function ensureFirestoreInitialized(): Promise<void> {
  if (!db || isInitialized || isInitializing) return;
  isInitializing = true;

  try {
    const settingsRef = doc(db, 'settings', 'global');
    const settingsSnap = await getDoc(settingsRef);

    // If global settings already exist, the database has already been initialized previously.
    // Do NOT re-seed products, customers or suppliers because the user may have deleted or modified them!
    if (settingsSnap.exists()) {
      const existingData = settingsSnap.data();
      // If the stored rate is obsolete (less than 200 Bs, like the old 86.45 default), upgrade it to current live rate
      if (!existingData?.bcvRate || existingData.bcvRate < 200) {
        await updateDoc(settingsRef, {
          bcvRate: 813.74,
          rateDate: new Date().toISOString().split('T')[0],
          lastUpdated: new Date().toISOString()
        }).catch(() => {});
      }
      isInitialized = true;
      return;
    }

    console.log('⚡ Firestore database is clean. Initializing first-time catalog and settings...');
    const batch = writeBatch(db);

    // Seed initial products
    for (const prod of INITIAL_PRODUCTS) {
      const prodRef = doc(db, 'products', prod.id);
      batch.set(prodRef, cleanForFirestore(prod));
    }

    // Seed initial customers
    for (const cust of INITIAL_CUSTOMERS) {
      const custRef = doc(db, 'customers', cust.id);
      batch.set(custRef, cleanForFirestore(cust));
    }

    // Seed initial suppliers
    for (const sup of INITIAL_SUPPLIERS) {
      const supRef = doc(db, 'suppliers', sup.id);
      batch.set(supRef, cleanForFirestore(sup));
    }

    // Seed default settings & profile
    batch.set(settingsRef, cleanForFirestore({
      profile: DEFAULT_PROFILE,
      bcvRate: 813.74,
      rateDate: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString(),
      initialized: true
    }));

    await batch.commit();
    console.log('✅ Firestore seeded successfully with products, customers and settings.');
    isInitialized = true;
  } catch (err) {
    console.warn('Notice: Firestore seeding check completed or handled:', err);
  } finally {
    isInitializing = false;
  }
}

export async function firestoreClearAllProducts(): Promise<void> {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'products'));
    const batch = writeBatch(db);
    snap.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
    console.log('✅ All products cleared in Firestore.');
  } catch (e) {
    console.error('Error clearing products in Firestore:', e);
  }
}

// -------------------------------------------------------------
// REAL-TIME SNAPSHOT SUBSCRIBERS
// -------------------------------------------------------------

export function subscribeProducts(onData: (products: Product[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((d) => {
        const raw = d.data() as Product;
        items.push({ 
          ...raw, 
          id: d.id,
          variants: Array.isArray(raw.variants) ? raw.variants : []
        });
      });
      // Sort by name
      items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onData(items);
    },
    (err) => {
      console.error('Firestore products listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeSales(onData: (sales: Sale[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'sales'),
    (snapshot) => {
      const items: Sale[] = [];
      snapshot.forEach((d) => {
        const raw = d.data() as Sale;
        items.push({ 
          ...raw, 
          id: d.id,
          items: Array.isArray(raw.items) ? raw.items : [],
          payments: Array.isArray(raw.payments) ? raw.payments : []
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore sales listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeCustomers(onData: (customers: Customer[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'customers'),
    (snapshot) => {
      const items: Customer[] = [];
      snapshot.forEach((d) => {
        items.push({ ...(d.data() as Customer), id: d.id });
      });
      onData(items);
    },
    (err) => {
      console.error('Firestore customers listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeDebts(onData: (debts: DebtAccount[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'debts'),
    (snapshot) => {
      const items: DebtAccount[] = [];
      snapshot.forEach((d) => {
        const raw = d.data() as DebtAccount;
        items.push({ 
          ...raw, 
          id: d.id,
          installments: Array.isArray(raw.installments) ? raw.installments : []
        });
      });
      items.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore debts listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeShifts(onData: (shifts: CashShift[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'shifts'),
    (snapshot) => {
      const items: CashShift[] = [];
      snapshot.forEach((d) => {
        const raw = d.data() as CashShift;
        items.push({ 
          ...raw, 
          id: d.id,
          movements: Array.isArray(raw.movements) ? raw.movements : []
        });
      });
      items.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore shifts listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeExpenses(onData: (expenses: Expense[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'expenses'),
    (snapshot) => {
      const items: Expense[] = [];
      snapshot.forEach((d) => {
        items.push({ ...(d.data() as Expense), id: d.id });
      });
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore expenses listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeSuppliers(onData: (suppliers: Supplier[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'suppliers'),
    (snapshot) => {
      const items: Supplier[] = [];
      snapshot.forEach((d) => {
        items.push({ ...(d.data() as Supplier), id: d.id });
      });
      onData(items);
    },
    (err) => {
      console.error('Firestore suppliers listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeSupplierDebts(onData: (debts: SupplierDebt[]) => void, onError?: (err: any) => void): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    collection(db, 'supplierDebts'),
    (snapshot) => {
      const items: SupplierDebt[] = [];
      snapshot.forEach((d) => {
        const raw = d.data() as SupplierDebt;
        items.push({ 
          ...raw, 
          id: d.id,
          installments: Array.isArray(raw.installments) ? raw.installments : []
        });
      });
      items.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      onData(items);
    },
    (err) => {
      console.error('Firestore supplierDebts listener error:', err);
      if (onError) onError(err);
    }
  );
}

export function subscribeGlobalSettings(
  onData: (settings: { profile?: BusinessProfile; bcvRate?: number; rateDate?: string }) => void,
  onError?: (err: any) => void
): Unsubscribe {
  if (!db) return () => {};
  return onSnapshot(
    doc(db, 'settings', 'global'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = { ...docSnap.data() } as any;
        if (data.bcvRate && data.bcvRate < 200) {
          data.bcvRate = 813.74;
          firestoreSaveSettings({ bcvRate: 813.74 }).catch(() => {});
        }
        onData(data);
      }
    },
    (err) => {
      console.error('Firestore settings listener error:', err);
      if (onError) onError(err);
    }
  );
}

// -------------------------------------------------------------
// REAL-TIME MUTATIONS (PUSH TO FIRESTORE)
// -------------------------------------------------------------

export async function firestoreSaveProduct(product: Product): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'products', product.id);
  await setDoc(ref, cleanForFirestore(product));
}

export async function firestoreDeleteProduct(productId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'products', productId);
  await deleteDoc(ref);
}

export async function firestoreBatchUpdateStock(updates: { id: string; stock: number }[]): Promise<void> {
  if (!db) return;
  const batch = writeBatch(db);
  for (const item of updates) {
    const ref = doc(db, 'products', item.id);
    batch.update(ref, { stock: item.stock });
  }
  await batch.commit();
}

export async function firestoreSaveSale(sale: Sale): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'sales', sale.id);
  await setDoc(ref, cleanForFirestore(sale));
}

export async function firestoreDeleteSale(saleId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'sales', saleId);
  await deleteDoc(ref);
}

export async function firestoreSaveCustomer(customer: Customer): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'customers', customer.id);
  await setDoc(ref, cleanForFirestore(customer));
}

export async function firestoreDeleteCustomer(customerId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'customers', customerId);
  await deleteDoc(ref);
}

export async function firestoreSaveDebt(debt: DebtAccount): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'debts', debt.id);
  await setDoc(ref, cleanForFirestore(debt));
}

export async function firestoreDeleteDebt(debtId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'debts', debtId);
  await deleteDoc(ref);
}

export async function firestoreSaveShift(shift: CashShift): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'shifts', shift.id);
  await setDoc(ref, cleanForFirestore(shift));
}

export async function firestoreSaveExpense(expense: Expense): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'expenses', expense.id);
  await setDoc(ref, cleanForFirestore(expense));
}

export async function firestoreDeleteExpense(expenseId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'expenses', expenseId);
  await deleteDoc(ref);
}

export async function firestoreSaveSupplier(supplier: Supplier): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'suppliers', supplier.id);
  await setDoc(ref, cleanForFirestore(supplier));
}

export async function firestoreDeleteSupplier(supplierId: string): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'suppliers', supplierId);
  await deleteDoc(ref);
}

export async function firestoreSaveSupplierDebt(debt: SupplierDebt): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'supplierDebts', debt.id);
  await setDoc(ref, cleanForFirestore(debt));
}

export async function firestoreSaveSettings(settings: { profile?: BusinessProfile; bcvRate?: number; rateDate?: string }): Promise<void> {
  if (!db) return;
  const ref = doc(db, 'settings', 'global');
  await setDoc(ref, cleanForFirestore({
    ...settings,
    lastUpdated: new Date().toISOString()
  }), { merge: true });
}
