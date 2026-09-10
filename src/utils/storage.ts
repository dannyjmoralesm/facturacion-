import { 
  Product, 
  Customer, 
  Sale, 
  Quote, 
  CashShift, 
  DebtAccount, 
  BusinessProfile,
  UserRole,
  AppUser,
  Expense,
  Supplier,
  SupplierDebt
} from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'negofact_products_v1',
  CUSTOMERS: 'negofact_customers_v1',
  SALES: 'negofact_sales_v1',
  QUOTES: 'negofact_quotes_v1',
  SHIFTS: 'negofact_shifts_v1',
  ACTIVE_SHIFT_ID: 'negofact_active_shift_id_v1',
  DEBTS: 'negofact_debts_v1',
  PROFILE: 'negofact_profile_v1',
  ROLE: 'negofact_user_role_v1',
  USERS: 'negofact_users_v1',
  CURRENT_USER_ID: 'negofact_current_user_id_v1',
  EXPENSES: 'negofact_expenses_v1',
  SUPPLIERS: 'negofact_suppliers_v1',
  SUPPLIER_DEBTS: 'negofact_supplier_debts_v1'
};

const DEFAULT_PROFILE: BusinessProfile = {
  name: 'MI COMERCIO, C.A.',
  commercialName: 'Mi Comercio',
  rif: 'J-00000000-0',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  invoicePrefix: 'FACT-',
  controlPrefix: '00-',
  quotePrefix: 'COT-',
  nextInvoiceSeq: 0,
  nextControlSeq: 0,
  nextQuoteSeq: 0,
  pagoMovilBank: '',
  pagoMovilPhone: '',
  pagoMovilId: '',
  zelleEmail: '',
  zelleHolder: '',
  binancePayId: '',
  defaultThermalSize: '80mm',
  footerMessage: '¡Gracias por su compra! Tasa BCV aplicada según normativa vigente.',
  enableTax: false,
  taxRatePercent: 16
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    code: 'HAR-PAN-01',
    barcode: '7591031000101',
    name: 'Harina PAN Maíz Blanco 1kg',
    description: 'Harina de maíz precocida tradicional venezolana',
    category: 'Víveres',
    type: 'physical',
    priceUSD: 1.45,
    costUSD: 1.15,
    stock: 85,
    minStock: 20,
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-2',
    code: 'ARR-MARY-01',
    barcode: '7591011002234',
    name: 'Arroz Mary Tradicional 1kg',
    description: 'Arroz de mesa tipo 1',
    category: 'Víveres',
    type: 'physical',
    priceUSD: 1.30,
    costUSD: 0.95,
    stock: 64,
    minStock: 15,
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-3',
    code: 'ACE-VAT-01',
    barcode: '7591042008891',
    name: 'Aceite Vegetal Vatel 1L',
    description: 'Aceite comestible 100% puro',
    category: 'Víveres',
    type: 'physical',
    priceUSD: 2.80,
    costUSD: 2.20,
    stock: 38,
    minStock: 10,
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-4',
    code: 'QUES-LLAN-01',
    barcode: '7592001004412',
    name: 'Queso Blanco Llanero Duro',
    description: 'Queso blanco pasteurizado para rallar',
    category: 'Charcutería',
    type: 'physical',
    priceUSD: 5.50,
    costUSD: 4.20,
    stock: 24.5,
    minStock: 5,
    unit: 'KG',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-5',
    code: 'CAF-FAMA-01',
    barcode: '7591024003319',
    name: 'Café Fama de América 500g',
    description: 'Café molido tostado venezolano',
    category: 'Víveres',
    type: 'physical',
    priceUSD: 4.20,
    costUSD: 3.40,
    stock: 45,
    minStock: 12,
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-6',
    code: 'REF-COL-01',
    barcode: '7591005001122',
    name: 'Refresco Coca-Cola 2L',
    description: 'Bebida gaseosa original',
    category: 'Bebidas',
    type: 'physical',
    priceUSD: 2.25,
    costUSD: 1.70,
    stock: 30,
    minStock: 8,
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-7',
    code: 'POL-PIL-01',
    barcode: '7591016007744',
    name: 'Cerveza Polar Pilsen 222ml (Tercio)',
    description: 'Cerveza rubia venezolana clásica',
    category: 'Licores',
    type: 'physical',
    priceUSD: 1.00,
    costUSD: 0.75,
    stock: 120,
    minStock: 24,
    unit: 'UND',
    variants: [
      { id: 'var-1', name: 'Unidad Individual', sku: 'POL-PIL-UND', priceAdjustmentUSD: 0, stock: 120 },
      { id: 'var-2', name: 'Pack x 6', sku: 'POL-PIL-SIX', priceAdjustmentUSD: 4.80, stock: 20 },
      { id: 'var-3', name: 'Caja x 36', sku: 'POL-PIL-BOX', priceAdjustmentUSD: 27.00, stock: 5 }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-8',
    code: 'CHO-SAV-01',
    barcode: '7591014009988',
    name: 'Chocolate Savoy Leche 130g',
    description: 'El auténtico sabor venezolano',
    category: 'Snacks & Dulces',
    type: 'physical',
    priceUSD: 1.85,
    costUSD: 1.35,
    stock: 4,
    minStock: 10, // low stock alert!
    unit: 'UND',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-9',
    code: 'SRV-DELIV-01',
    barcode: 'SRV-001',
    name: 'Servicio de Delivery en Moto (Casco Central)',
    description: 'Envío express directo al domicilio del cliente',
    category: 'Servicios',
    type: 'service',
    priceUSD: 2.50,
    stock: 9999,
    minStock: 0,
    unit: 'SRV',
    createdAt: new Date().toISOString()
  },
  {
    id: 'prod-10',
    code: 'SRV-MANT-01',
    barcode: 'SRV-002',
    name: 'Mantenimiento y Reparación de Equipo',
    description: 'Mano de obra técnica especializada',
    category: 'Servicios',
    type: 'service',
    priceUSD: 15.00,
    stock: 9999,
    minStock: 0,
    unit: 'SRV',
    createdAt: new Date().toISOString()
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-final',
    docType: 'V',
    docNumber: '00000000',
    name: 'Consumidor Final',
    phone: '',
    email: '',
    address: 'Mostrador',
    totalDebtUSD: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-1',
    docType: 'V',
    docNumber: '19876543',
    name: 'Carlos Mendoza Rodríguez',
    phone: '04141234567',
    email: 'carlos.mendoza@gmail.com',
    address: 'Urb. El Parral, Res. Arboleda, Apto 4B, Valencia',
    totalDebtUSD: 18.50,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-2',
    docType: 'J',
    docNumber: '50123499-1',
    name: 'Comercializadora Los Andes, C.A.',
    phone: '04245678901',
    email: 'compras@losandes.com.ve',
    address: 'Zona Industrial Castillito, Galpón 8',
    totalDebtUSD: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'cust-3',
    docType: 'V',
    docNumber: '14321098',
    name: 'María Elena Gómez',
    phone: '04129876543',
    email: 'mariae.gomez@hotmail.com',
    address: 'Av. Cedeño, Edif. Torre Banaven',
    totalDebtUSD: 42.00,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_DEBTS: DebtAccount[] = [
  {
    id: 'debt-1',
    customerId: 'cust-1',
    customerName: 'Carlos Mendoza Rodríguez',
    customerDoc: 'V-19876543',
    customerPhone: '04141234567',
    saleId: 'sale-init-1',
    invoiceNumber: 'FACT-000001',
    originalDebtUSD: 28.50,
    paidDebtUSD: 10.00,
    remainingDebtUSD: 18.50,
    dateCreated: new Date(Date.now() - 86400000 * 5).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString(),
    status: 'partially_paid',
    installments: [
      {
        id: 'inst-1',
        debtId: 'debt-1',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        amountUSD: 10.00,
        amountVES: 861.50,
        rateApplied: 86.15,
        method: 'pago_movil',
        reference: '749102',
        bank: 'Banesco',
        notes: 'Abono inicial en Pago Móvil'
      }
    ],
    notes: 'Fiado autorizado de víveres quincenales'
  },
  {
    id: 'debt-2',
    customerId: 'cust-3',
    customerName: 'María Elena Gómez',
    customerDoc: 'V-14321098',
    customerPhone: '04129876543',
    saleId: 'sale-init-2',
    invoiceNumber: 'FACT-000002',
    originalDebtUSD: 42.00,
    paidDebtUSD: 0,
    remainingDebtUSD: 42.00,
    dateCreated: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    status: 'pending',
    installments: [],
    notes: 'Compra de víveres y charcutería semanal'
  }
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    category: 'servicios',
    description: 'Pago mensual de Internet Fibra Óptica Comercial',
    amountUSD: 35.00,
    amountVES: 3025.75,
    currency: 'USD',
    amountPaid: 35.00,
    bcvRate: 86.45,
    paymentMethod: 'pago_movil',
    reference: 'PM-992144',
    beneficiary: 'FibraNet Venezuela C.A.',
    receiptNumber: 'REC-0912',
    affectsCashShift: false,
    notes: 'Servicio dedicado 200Mbps para punto de venta y facturación',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'exp-2',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    category: 'mantenimiento',
    description: 'Compra de 2 rollos térmicos 80mm y bolsas plásticas tipo camiseta',
    amountUSD: 14.50,
    amountVES: 1253.53,
    currency: 'USD',
    amountPaid: 14.50,
    bcvRate: 86.45,
    paymentMethod: 'cash_usd',
    beneficiary: 'Insumos Comerciales del Centro',
    receiptNumber: 'FAC-1104',
    affectsCashShift: true,
    shiftId: 'shift-current',
    notes: 'Descontado de la caja chica del turno de la mañana',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'exp-3',
    date: new Date(Date.now() - 86400000 * 4).toISOString(),
    category: 'transporte',
    description: 'Flete y descarga de bultos de harina y arroz',
    amountUSD: 20.00,
    amountVES: 1729.00,
    currency: 'VES',
    amountPaid: 1729.00,
    bcvRate: 86.45,
    paymentMethod: 'pago_movil',
    reference: '772183',
    beneficiary: 'Transporte y Carga Don Pedro',
    affectsCashShift: false,
    notes: 'Flete express desde el muelle',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  }
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Distribuidora Polar del Centro, C.A.',
    rif: 'J-00041372-1',
    phone: '0241-8712345',
    email: 'pedidos@polar.com.ve',
    address: 'Zona Industrial Sur, Valencia, Edo. Carabobo',
    contactPerson: 'Lcdo. Roberto Fuentes (Ejecutivo de Ventas)',
    category: 'Alimentos & Bebidas',
    totalDebtUSD: 185.00,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sup-2',
    name: 'Alimentos Heinz de Venezuela, S.A.',
    rif: 'J-00028711-4',
    phone: '0245-5641122',
    email: 'ventas.valencia@heinz.com',
    address: 'San Joaquín, Carretera Nacional, Edo. Carabobo',
    contactPerson: 'Ing. Carmen Salazar',
    category: 'Enlatados & Salsas',
    totalDebtUSD: 85.00,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sup-3',
    name: 'Charcutería y Lácteos Los Andes, C.A.',
    rif: 'J-31049281-9',
    phone: '0414-4321987',
    email: 'contacto@lacteoslosandes.ve',
    address: 'Mercado Mayorista de Tocuyito, Galpón 4',
    contactPerson: 'Sr. Antonio Morales',
    category: 'Quesos, Jamones & Lácteos',
    totalDebtUSD: 0,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_SUPPLIER_DEBTS: SupplierDebt[] = [
  {
    id: 'sup-debt-1',
    supplierId: 'sup-1',
    supplierName: 'Distribuidora Polar del Centro, C.A.',
    supplierRif: 'J-00041372-1',
    supplierPhone: '0241-8712345',
    invoiceNumber: 'FAC-POL-84920',
    controlNumber: '00-019842',
    category: 'Mercancía (Harina PAN, Arroz, Pasta)',
    description: 'Pedido semanal de víveres secos y cervezas Polar',
    originalDebtUSD: 245.00,
    paidDebtUSD: 60.00,
    remainingDebtUSD: 185.00,
    dateCreated: new Date(Date.now() - 86400000 * 6).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 8).toISOString(),
    status: 'partially_paid',
    installments: [
      {
        id: 'sup-inst-1',
        debtId: 'sup-debt-1',
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        amountUSD: 60.00,
        amountVES: 5187.00,
        rateApplied: 86.45,
        method: 'pago_movil',
        reference: 'TR-481902',
        bank: 'Banesco',
        notes: 'Primer abono de factura mayorista'
      }
    ],
    notes: 'Crédito a 15 días con pronto pago del 3%'
  },
  {
    id: 'sup-debt-2',
    supplierId: 'sup-2',
    supplierName: 'Alimentos Heinz de Venezuela, S.A.',
    supplierRif: 'J-00028711-4',
    supplierPhone: '0245-5641122',
    invoiceNumber: 'FAC-HNZ-3109',
    controlNumber: '00-008431',
    category: 'Salsas y Enlatados',
    description: 'Cajas de Ketchup 397g, Mostaza y Colados Heinz',
    originalDebtUSD: 85.00,
    paidDebtUSD: 0,
    remainingDebtUSD: 85.00,
    dateCreated: new Date(Date.now() - 86400000 * 3).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 11).toISOString(),
    status: 'pending',
    installments: [],
    notes: 'Factura con entrega en local'
  }
];

const INITIAL_SHIFT: CashShift = {
  id: 'shift-current',
  openedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  cashierName: 'Juan Pérez (Cajero Principal)',
  openingUSD: 50.00,
  openingVES: 2500.00,
  status: 'open',
  movements: [
    {
      id: 'mov-1',
      shiftId: 'shift-current',
      type: 'cash_in',
      currency: 'USD',
      amount: 50.00,
      amountUSD: 50.00,
      amountVES: 4322.50,
      reason: 'Fondo de caja inicial en divisas',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'mov-2',
      shiftId: 'shift-current',
      type: 'cash_in',
      currency: 'VES',
      amount: 2500.00,
      amountUSD: 28.91,
      amountVES: 2500.00,
      reason: 'Fondo de caja inicial en bolívares para vuelto',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
    }
  ],
  salesCount: 0,
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
  },
  totalSalesUSD: 0,
  totalSalesVES: 0,
  expectedCashUSD: 50.00,
  expectedCashVES: 2500.00
};

// STORAGE GETTERS & SETTERS

export function getProducts(): Product[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => ({
          ...p,
          variants: Array.isArray(p?.variants) ? p.variants : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading products:', e);
  }
  const isInitialized = localStorage.getItem('negofact_initialized_v1');
  if (isInitialized) {
    return [];
  }
  localStorage.setItem('negofact_initialized_v1', 'true');
  saveProducts(INITIAL_PRODUCTS);
  return INITIAL_PRODUCTS;
}

export function saveProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products:', e);
  }
}

export function getCustomers(): Customer[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading customers:', e);
  }
  const isInitialized = localStorage.getItem('negofact_initialized_v1');
  if (isInitialized) {
    return [];
  }
  localStorage.setItem('negofact_initialized_v1', 'true');
  saveCustomers([]);
  return [];
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers:', e);
  }
}

export function getSales(): Sale[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((s: any) => ({
          ...s,
          items: Array.isArray(s?.items) ? s.items : [],
          payments: Array.isArray(s?.payments) ? s.payments : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading sales:', e);
  }
  return [];
}

export function saveSales(sales: Sale[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  } catch (e) {
    console.error('Error saving sales:', e);
  }
}

export function getQuotes(): Quote[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((q: any) => ({
          ...q,
          items: Array.isArray(q?.items) ? q.items : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading quotes:', e);
  }
  return [];
}

export function saveQuotes(quotes: Quote[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  } catch (e) {
    console.error('Error saving quotes:', e);
  }
}

export function getShifts(): CashShift[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SHIFTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((s: any) => ({
          ...s,
          movements: Array.isArray(s?.movements) ? s.movements : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading shifts:', e);
  }
  saveShifts([INITIAL_SHIFT]);
  return [INITIAL_SHIFT];
}

export function saveShifts(shifts: CashShift[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  } catch (e) {
    console.error('Error saving shifts:', e);
  }
}

export function getActiveShift(): CashShift | null {
  const shifts = getShifts();
  if (!Array.isArray(shifts)) return null;
  const openShift = shifts.find(s => s && s.status === 'open');
  if (!openShift) return null;
  return {
    ...openShift,
    movements: Array.isArray(openShift.movements) ? openShift.movements : []
  };
}

export function getDebts(): DebtAccount[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DEBTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((d: any) => ({
          ...d,
          installments: Array.isArray(d?.installments) ? d.installments : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading debts:', e);
  }
  saveDebts(INITIAL_DEBTS);
  return INITIAL_DEBTS;
}

export function saveDebts(debts: DebtAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(debts));
  } catch (e) {
    console.error('Error saving debts:', e);
  }
}

export function getBusinessProfile(): BusinessProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed = JSON.parse(saved);
      let needsResave = false;

      // Clean legacy NegoFact and Supermercado/Servicios branding
      if (parsed.commercialName && /(negofact|supermercado|servicios|víveres|viveres|la bendición)/i.test(parsed.commercialName)) {
        const cleaned = parsed.commercialName
          .replace(/supermercado\s*(&|y)?\s*(servicios|víveres|viveres)?/gi, '')
          .replace(/la bendici[oó]n/gi, '')
          .replace(/\s*negofact/gi, '')
          .trim();
        parsed.commercialName = cleaned || 'Mi Comercio';
        needsResave = true;
      }
      if (parsed.name && /(la bendici[oó]n|negofact)/i.test(parsed.name)) {
        parsed.name = 'MI COMERCIO, C.A.';
        needsResave = true;
      }
      if (parsed.name && parsed.name.trim() !== '' && (!parsed.commercialName || parsed.commercialName === 'Mi Comercio')) {
        parsed.commercialName = parsed.name.trim();
        needsResave = true;
      }
      if (parsed.email && /(negofact|labendicion)/i.test(parsed.email)) {
        parsed.email = '';
        needsResave = true;
      }
      if (parsed.zelleEmail && /(negofact|labendicion)/i.test(parsed.zelleEmail)) {
        parsed.zelleEmail = '';
        needsResave = true;
      }

      // Reset invoice sequence if unset or from legacy starting sequence >= 1000
      if (parsed.nextInvoiceSeq === undefined || parsed.nextInvoiceSeq >= 1000) {
        parsed.nextInvoiceSeq = 0;
        needsResave = true;
      }
      if (parsed.nextControlSeq === undefined || parsed.nextControlSeq >= 5000) {
        parsed.nextControlSeq = 0;
        needsResave = true;
      }
      if (parsed.nextQuoteSeq === undefined || parsed.nextQuoteSeq >= 100) {
        parsed.nextQuoteSeq = 0;
        needsResave = true;
      }

      const mergedProfile: BusinessProfile = {
        ...DEFAULT_PROFILE,
        ...parsed
      };

      if (needsResave) {
        saveBusinessProfile(mergedProfile);
      }
      return mergedProfile;
    }
  } catch (e) {
    console.error('Error loading profile:', e);
  }
  saveBusinessProfile(DEFAULT_PROFILE);
  return DEFAULT_PROFILE;
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function getUserRole(): UserRole {
  try {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role) {
      return currentUser.role;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    if (saved === 'admin' || saved === 'seller' || saved === 'cashier') return saved as UserRole;
  } catch (e) {
    console.error('Error loading role:', e);
  }
  return 'admin';
}

export function saveUserRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  } catch (e) {
    console.error('Error saving role:', e);
  }
}

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'user-admin-1',
    name: 'Administrador Principal',
    username: 'admin',
    password: 'Admin2026*',
    pin: '1234',
    role: 'admin',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  },
  {
    id: 'user-seller-1',
    name: 'Vendedor de Turno',
    username: 'vendedor',
    password: 'Venta2026*',
    pin: '0000',
    role: 'seller',
    active: true,
    createdAt: new Date().toISOString(),
    lastLogin: undefined
  }
];

export function getUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  saveUsers(INITIAL_USERS);
  return INITIAL_USERS;
}

export function saveUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function getCurrentUser(): AppUser {
  const allUsers = getUsers();
  try {
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (currentId) {
      const found = allUsers.find(u => u.id === currentId && u.active);
      if (found) return found;
    }
  } catch (e) {
    console.error('Error loading current user:', e);
  }
  // Fallback to first active admin or first active user
  const firstAdmin = allUsers.find(u => u.role === 'admin' && u.active);
  if (firstAdmin) return firstAdmin;
  return allUsers[0] || INITIAL_USERS[0];
}

export function saveCurrentUser(user: AppUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
    saveUserRole(user.role);
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}

export function getExpenses(): Expense[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading expenses:', e);
  }
  saveExpenses(INITIAL_EXPENSES);
  return INITIAL_EXPENSES;
}

export function saveExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  } catch (e) {
    console.error('Error saving expenses:', e);
  }
}

export function getSuppliers(): Supplier[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading suppliers:', e);
  }
  const isInitialized = localStorage.getItem('negofact_initialized_v1');
  if (isInitialized) {
    return [];
  }
  saveSuppliers([]);
  return [];
}

export function saveSuppliers(suppliers: Supplier[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  } catch (e) {
    console.error('Error saving suppliers:', e);
  }
}

export function getSupplierDebts(): SupplierDebt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIER_DEBTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((d: any) => ({
          ...d,
          installments: Array.isArray(d?.installments) ? d.installments : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading supplier debts:', e);
  }
  saveSupplierDebts(INITIAL_SUPPLIER_DEBTS);
  return INITIAL_SUPPLIER_DEBTS;
}

export function saveSupplierDebts(supplierDebts: SupplierDebt[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUPPLIER_DEBTS, JSON.stringify(supplierDebts));
  } catch (e) {
    console.error('Error saving supplier debts:', e);
  }
}

export function exportAllDataJSON(): string {
  const data = {
    exportDate: new Date().toISOString(),
    profile: getBusinessProfile(),
    users: getUsers(),
    products: getProducts(),
    customers: getCustomers(),
    sales: getSales(),
    quotes: getQuotes(),
    shifts: getShifts(),
    debts: getDebts(),
    expenses: getExpenses(),
    suppliers: getSuppliers(),
    supplierDebts: getSupplierDebts()
  };
  return JSON.stringify(data, null, 2);
}

export const exportAllDataAsJSON = exportAllDataJSON;

export function importAllDataJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.users) saveUsers(parsed.users);
    if (parsed.products) saveProducts(parsed.products);
    if (parsed.customers) saveCustomers(parsed.customers);
    if (parsed.sales) saveSales(parsed.sales);
    if (parsed.quotes) saveQuotes(parsed.quotes);
    if (parsed.shifts) saveShifts(parsed.shifts);
    if (parsed.debts) saveDebts(parsed.debts);
    if (parsed.expenses) saveExpenses(parsed.expenses);
    if (parsed.suppliers) saveSuppliers(parsed.suppliers);
    if (parsed.supplierDebts) saveSupplierDebts(parsed.supplierDebts);
    if (parsed.profile) saveBusinessProfile(parsed.profile);
    return true;
  } catch (err) {
    console.error('Failed to import backup JSON:', err);
    return false;
  }
}

export const importDataFromJSON = importAllDataJSON;

export function resetToFactoryDefaults(): void {
  try {
    // Clear all app specific keys from localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also remove any custom or stale negofact_* keys
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('negofact_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // Reset all app values strictly to 0 as requested by the user:
    // inventories = 0, customers = 0, suppliers = 0, billing numbers = 0
    localStorage.setItem('negofact_initialized_v1', 'true');
    saveUsers(INITIAL_USERS);
    saveCurrentUser(INITIAL_USERS[0]);
    saveUserRole('admin');
    saveProducts([]);         // Inventarios a 0
    saveCustomers([]);        // Clientes a 0
    saveSales([]);            // Ventas a 0
    saveQuotes([]);           // Cotizaciones a 0
    saveShifts([]);           // Turnos de caja a 0
    saveDebts([]);            // Libreta de fiados a 0
    saveExpenses([]);         // Gastos a 0
    saveSuppliers([]);        // Proveedores a 0
    saveSupplierDebts([]);    // Deudas a 0
    saveBusinessProfile({
      ...DEFAULT_PROFILE,
      commercialName: 'Mi Comercio',
      name: 'MI COMERCIO, C.A.',
      rif: 'J-00000000-0',
      nextInvoiceSeq: 0,
      nextControlSeq: 0,
      nextQuoteSeq: 0
    });
  } catch (e) {
    console.error('Error during factory reset:', e);
  }
}

export { 
  INITIAL_PRODUCTS, 
  INITIAL_CUSTOMERS, 
  INITIAL_SUPPLIERS, 
  DEFAULT_PROFILE 
};
