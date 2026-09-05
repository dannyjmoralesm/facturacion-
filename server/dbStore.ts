import fs from 'fs';
import path from 'path';

export interface DatabaseState {
  profile: any;
  users: any[];
  products: any[];
  customers: any[];
  sales: any[];
  quotes: any[];
  shifts: any[];
  debts: any[];
  expenses: any[];
  suppliers: any[];
  supplierDebts: any[];
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'negofact_db.json');
const SEED_FILE = path.join(DATA_DIR, 'seedData.json');

let memoryState: DatabaseState | null = null;
let saveTimeout: NodeJS.Timeout | null = null;

function loadInitialSeed(): DatabaseState {
  try {
    if (fs.existsSync(SEED_FILE)) {
      const raw = fs.readFileSync(SEED_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load seedData.json, using fallback:', err);
  }

  return {
    profile: {
      name: 'INVERSIONES LA BENDICIÓN 2026, C.A.',
      commercialName: 'Supermercado & Servicios NegoFact',
      rif: 'J-41238910-4',
      phone: '+58 412-5550199',
      email: 'ventas@negofact.com.ve',
      address: 'Av. Bolívar cruce con Calle Comercio, Local 14',
      city: 'Valencia',
      state: 'Carabobo',
      invoicePrefix: 'FACT-',
      controlPrefix: '00-',
      quotePrefix: 'COT-',
      nextInvoiceSeq: 1042,
      nextControlSeq: 5820,
      nextQuoteSeq: 118,
      pagoMovilBank: '0102 - Banco de Venezuela',
      pagoMovilPhone: '04125550199',
      pagoMovilId: 'V-20123456',
      zelleEmail: 'pagos.negofact@gmail.com',
      zelleHolder: 'Inversiones La Bendicion LLC',
      binancePayId: '782910411',
      defaultThermalSize: '80mm',
      footerMessage: '¡Gracias por su compra! Tasa BCV aplicada según normativa vigente.',
      enableTax: false,
      taxRatePercent: 16
    },
    users: [],
    products: [],
    customers: [],
    sales: [],
    quotes: [],
    shifts: [],
    debts: [],
    expenses: [],
    suppliers: [],
    supplierDebts: [],
    lastUpdated: new Date().toISOString()
  };
}

export function initDatabase(): DatabaseState {
  if (memoryState) return memoryState;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      memoryState = JSON.parse(raw);
      console.log('Central Database loaded from negofact_db.json successfully.');
      return memoryState!;
    } catch (err) {
      console.error('Error reading negofact_db.json, recreating from seed:', err);
    }
  }

  // Seed database
  memoryState = loadInitialSeed();
  saveDatabaseImmediately(memoryState);
  console.log('Central Database initialized with default seed data.');
  return memoryState;
}

export function getDatabaseState(): DatabaseState {
  if (!memoryState) {
    return initDatabase();
  }
  return memoryState;
}

function saveDatabaseImmediately(state: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export function scheduleSaveDatabase(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (memoryState) {
      saveDatabaseImmediately(memoryState);
    }
  }, 100);
}

export interface MutationRequest {
  entity: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REPLACE_ALL' | 'SYNC_BATCH' | 'UPDATE_STOCK_BATCH' | 'UPDATE_BATCH';
  payload: any;
  senderId?: string;
  timestamp?: number;
}

export function applyMutation(mutation: MutationRequest): { success: boolean; entity: string; state: DatabaseState } {
  const db = getDatabaseState();
  const { entity, action, payload } = mutation;

  db.lastUpdated = new Date().toISOString();

  // Helper to find collection
  const collection = (db as any)[entity];

  if (action === 'REPLACE_ALL' || action === 'UPDATE_BATCH') {
    (db as any)[entity] = Array.isArray(payload) ? payload : payload;
  } else if (action === 'CREATE') {
    if (Array.isArray(collection)) {
      const existsIndex = collection.findIndex((item: any) => item && item.id === payload.id);
      if (existsIndex >= 0) {
        collection[existsIndex] = payload;
      } else {
        collection.unshift(payload);
      }
    } else {
      (db as any)[entity] = payload;
    }
  } else if (action === 'UPDATE') {
    if (Array.isArray(collection)) {
      const index = collection.findIndex((item: any) => item && item.id === payload.id);
      if (index >= 0) {
        collection[index] = { ...collection[index], ...payload };
      } else {
        collection.push(payload);
      }
    } else if (typeof collection === 'object' && collection !== null) {
      (db as any)[entity] = { ...collection, ...payload };
    } else {
      (db as any)[entity] = payload;
    }
  } else if (action === 'DELETE') {
    const idToDelete = typeof payload === 'string' ? payload : payload?.id;
    if (Array.isArray(collection) && idToDelete) {
      (db as any)[entity] = collection.filter((item: any) => item && item.id !== idToDelete);
    }
  } else if (action === 'UPDATE_STOCK_BATCH') {
    // Array of { productId: string, stock: number } or whole product updates
    if (Array.isArray(payload) && Array.isArray(db.products)) {
      payload.forEach((updateItem: any) => {
        const prod = db.products.find((p: any) => p.id === (updateItem.id || updateItem.productId));
        if (prod) {
          if (typeof updateItem.stock === 'number') prod.stock = updateItem.stock;
          if (updateItem.priceUSD !== undefined) prod.priceUSD = updateItem.priceUSD;
        }
      });
    }
  } else if (action === 'SYNC_BATCH') {
    // payload can contain multiple entities: { sales?: [], products?: [], debts?: [] }
    if (payload && typeof payload === 'object') {
      Object.keys(payload).forEach((key) => {
        if (Array.isArray((db as any)[key]) && Array.isArray(payload[key])) {
          (db as any)[key] = payload[key];
        } else if (key === 'profile' && payload.profile) {
          db.profile = payload.profile;
        }
      });
    }
  }

  scheduleSaveDatabase();
  return { success: true, entity, state: db };
}

export function resetDatabaseToSeed(): DatabaseState {
  memoryState = loadInitialSeed();
  memoryState.lastUpdated = new Date().toISOString();
  saveDatabaseImmediately(memoryState);
  return memoryState;
}
