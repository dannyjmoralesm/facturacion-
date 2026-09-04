export type Currency = 'USD' | 'VES';

export interface ExchangeRateData {
  rate: number;
  lastUpdated: string;
  source: 'BCV_API' | 'MANUAL_OVERRIDE' | 'FALLBACK';
  history: {
    date: string;
    rate: number;
    source: string;
  }[];
}

export type ProductType = 'physical' | 'service';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "Talla L / Rojo", "1 Litro", "Caja x 12"
  sku: string;
  priceAdjustmentUSD: number;
  stock: number;
}

export interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  description?: string;
  category: string;
  type: ProductType;
  priceUSD: number;
  costUSD?: number;
  stock: number;
  minStock: number;
  unit: string; // 'UND', 'KG', 'LT', 'SRV', 'PZA'
  variants?: ProductVariant[];
  imageUrl?: string;
  createdAt: string;
}

export type DocumentType = 'V' | 'E' | 'J' | 'G' | 'P';

export interface Customer {
  id: string;
  docType: DocumentType;
  docNumber: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDebtUSD: number;
  createdAt: string;
}

export type PaymentMethodType = 
  | 'cash_usd'
  | 'cash_ves'
  | 'pago_movil'
  | 'punto_venta'
  | 'zelle'
  | 'binance_pay'
  | 'credito_fiado';

export interface PaymentSplit {
  id: string;
  method: PaymentMethodType;
  amountUSD: number;
  amountVES: number;
  appliedRate: number;
  reference?: string;
  bank?: string;
  senderPhone?: string;
  notes?: string;
}

export type PaymentRecord = PaymentSplit;

export interface ChangeDetail {
  amountUSD: number;
  amountVES: number;
  method: 'cash_usd' | 'cash_ves' | 'pago_movil';
  reference?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  barcode?: string;
  unit: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  priceUSD: number;
  priceVES: number;
  costUSD?: number;
  discountUSD: number;
  subtotalUSD: number;
  subtotalVES: number;
  isService: boolean;
}

export type SaleStatus = 'completed' | 'cancelled' | 'credit_pending';

export interface Sale {
  id: string;
  invoiceNumber: string; // e.g. FACT-000142
  controlNumber: string; // e.g. 00-001284
  date: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  customerPhone?: string;
  items: CartItem[];
  subtotalUSD: number;
  discountUSD: number;
  taxUSD: number;
  totalUSD: number;
  subtotalVES: number;
  taxVES: number;
  totalVES: number;
  bcvRate: number;
  payments: PaymentSplit[];
  change?: ChangeDetail;
  cashierName: string;
  status: SaleStatus;
  notes?: string;
}

export type QuoteStatus = 'pending' | 'converted' | 'expired';

export interface Quote {
  id: string;
  quoteNumber: string; // e.g. COT-000085
  date: string;
  validUntil: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  customerPhone?: string;
  customerEmail?: string;
  items: CartItem[];
  subtotalUSD: number;
  discountUSD: number;
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  status: QuoteStatus;
  convertedSaleId?: string;
  notes?: string;
}

export interface CashMovement {
  id: string;
  shiftId: string;
  type: 'cash_in' | 'cash_out';
  currency: Currency;
  amount: number;
  amountUSD: number;
  amountVES: number;
  reason: string;
  timestamp: string;
}

export interface CashShift {
  id: string;
  openedAt: string;
  closedAt?: string;
  cashierName: string;
  openingUSD: number;
  openingVES: number;
  status: 'open' | 'closed';
  movements: CashMovement[];
  salesCount: number;
  totalsByMethodUSD: Record<PaymentMethodType, number>;
  totalsByMethodVES: Record<PaymentMethodType, number>;
  totalSalesUSD: number;
  totalSalesVES: number;
  expectedCashUSD: number;
  expectedCashVES: number;
  actualCashUSD?: number;
  actualCashVES?: number;
  differenceUSD?: number;
  differenceVES?: number;
  notes?: string;
}

export interface DebtPaymentInstallment {
  id: string;
  debtId: string;
  date: string;
  amountUSD: number;
  amountVES: number;
  rateApplied: number;
  method: PaymentMethodType;
  reference?: string;
  bank?: string;
  notes?: string;
}

export interface DebtAccount {
  id: string;
  customerId: string;
  customerName: string;
  customerDoc: string;
  customerPhone: string;
  saleId: string;
  invoiceNumber: string;
  originalDebtUSD: number;
  paidDebtUSD: number;
  remainingDebtUSD: number;
  dateCreated: string;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'paid';
  installments: DebtPaymentInstallment[];
  notes?: string;
}

export interface BusinessProfile {
  name: string;
  commercialName: string;
  rif: string; // e.g. "J-40912345-0"
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  invoicePrefix: string;
  controlPrefix?: string;
  quotePrefix: string;
  nextInvoiceSeq: number;
  nextControlSeq: number;
  nextQuoteSeq: number;
  pagoMovilBank: string;
  pagoMovilPhone: string;
  pagoMovilId: string;
  zelleEmail: string;
  zelleHolder: string;
  binancePayId: string;
  defaultThermalSize: '58mm' | '80mm';
  footerMessage: string;
  enableTax: boolean;
  taxRatePercent: number; // default 16% (IVA in Venezuela)
}

export type UserRole = 'admin' | 'seller' | 'cashier';

export interface AppUser {
  id: string;
  name: string;
  username: string;
  password?: string;
  pin?: string;
  role: 'admin' | 'seller';
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

// FINANCIAL MODULE TYPES

export type ExpenseCategory = 
  | 'servicios'      // Luz, Agua, Internet, Teléfono, Gas
  | 'alquiler'       // Alquiler de Local / Depósito
  | 'nomina'         // Salarios, Comisiones, Anticipos
  | 'mercancia'      // Compra directa de inventario / insumos al contado
  | 'mantenimiento'  // Reparaciones, Limpieza, Mantenimiento
  | 'impuestos'      // SENIAT, Alcaldía, Patente, Aseo
  | 'transporte'     // Fletes, Gasolina, Delivery
  | 'varios';        // Otros gastos operativos

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amountUSD: number;
  amountVES: number;
  currency: Currency;
  amountPaid: number;
  bcvRate: number;
  paymentMethod: PaymentMethodType;
  reference?: string;
  beneficiary?: string;
  receiptNumber?: string;
  affectsCashShift: boolean;
  shiftId?: string;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  rif: string; // e.g. "J-30123456-7"
  phone: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  totalDebtUSD: number;
  createdAt: string;
}

export interface SupplierDebtInstallment {
  id: string;
  debtId: string;
  date: string;
  amountUSD: number;
  amountVES: number;
  rateApplied: number;
  method: PaymentMethodType;
  reference?: string;
  bank?: string;
  affectsCashShift?: boolean;
  shiftId?: string;
  notes?: string;
}

export interface SupplierDebt {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierRif: string;
  supplierPhone?: string;
  invoiceNumber: string; // Nro. Factura o Nota de Entrega del Proveedor
  controlNumber?: string;
  category: string; // Mercancía, Insumos, Servicios, Equipamiento
  description?: string;
  originalDebtUSD: number;
  paidDebtUSD: number;
  remainingDebtUSD: number;
  dateCreated: string;
  dueDate: string;
  status: 'pending' | 'partially_paid' | 'paid';
  installments: SupplierDebtInstallment[];
  notes?: string;
}
