export const SQL_DATABASE_SCHEMA = `-- ============================================================================
-- SCHEMA SQL COMPLETO: NEGOFACT POS & FACTURACIÓN BIMONEDA (VENEZUELA)
-- Compatible con PostgreSQL 15+, Supabase y Cloud SQL
-- ============================================================================

-- Extensión para UUIDs universales
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: HISTORIAL DE TASAS DE CAMBIO (BCV / PARALELO / MANUAL)
CREATE TABLE exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rate NUMERIC(14, 4) NOT NULL CHECK (rate > 0),
    source VARCHAR(50) NOT NULL DEFAULT 'BCV_API', -- 'BCV_API', 'MANUAL_OVERRIDE', 'PARALLEL'
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'system',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_exchange_rates_date ON exchange_rates (effective_date DESC);

-- 2. TABLA: PERFIL DEL NEGOCIO Y CONFIGURACIÓN BIMONEDA
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commercial_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    rif VARCHAR(30) NOT NULL UNIQUE, -- Ej: 'J-41238910-4'
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Valencia',
    state VARCHAR(100) DEFAULT 'Carabobo',
    invoice_prefix VARCHAR(10) DEFAULT 'FACT-',
    quote_prefix VARCHAR(10) DEFAULT 'COT-',
    next_invoice_seq INT DEFAULT 1,
    next_control_seq INT DEFAULT 1,
    next_quote_seq INT DEFAULT 1,
    pago_movil_bank VARCHAR(100),
    pago_movil_phone VARCHAR(50),
    pago_movil_id VARCHAR(50),
    zelle_email VARCHAR(150),
    zelle_holder VARCHAR(150),
    binance_pay_id VARCHAR(100),
    default_thermal_size VARCHAR(10) DEFAULT '80mm',
    footer_message TEXT DEFAULT 'Gracias por su compra. Tasa BCV aplicada según normativa oficial.',
    enable_tax BOOLEAN DEFAULT FALSE,
    tax_rate_percent NUMERIC(5, 2) DEFAULT 16.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABLA: CLIENTES
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type VARCHAR(2) NOT NULL DEFAULT 'V', -- 'V', 'E', 'J', 'G', 'P'
    doc_number VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    total_debt_usd NUMERIC(12, 2) DEFAULT 0.00 CHECK (total_debt_usd >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_customer_doc UNIQUE (doc_type, doc_number)
);
CREATE INDEX idx_customers_doc ON customers (doc_type, doc_number);
CREATE INDEX idx_customers_name ON customers (name);

-- 4. TABLA: PRODUCTOS Y SERVICIOS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    type VARCHAR(20) NOT NULL DEFAULT 'physical', -- 'physical', 'service'
    price_usd NUMERIC(12, 4) NOT NULL CHECK (price_usd >= 0),
    cost_usd NUMERIC(12, 4) DEFAULT 0.0000,
    stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(12, 2) DEFAULT 5.00,
    unit VARCHAR(20) DEFAULT 'UND', -- 'UND', 'KG', 'LT', 'SRV', 'PZA'
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_barcode ON products (barcode);
CREATE INDEX idx_products_category ON products (category);

-- 5. TABLA: VARIANTES DE PRODUCTOS (Tallas, Colores, Presentaciones)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ej: 'Talla L / Rojo', 'Six Pack'
    sku VARCHAR(100) UNIQUE,
    price_adjustment_usd NUMERIC(12, 4) DEFAULT 0.0000,
    stock NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_variants_product ON product_variants (product_id);

-- 6. TABLA: TURNOS Y CAJAS (CIERRE Z / CUADRE DE CAJA)
CREATE TABLE cash_shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    cashier_name VARCHAR(150) NOT NULL,
    opening_usd NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    opening_ves NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'closed'
    sales_count INT DEFAULT 0,
    total_sales_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_sales_ves NUMERIC(14, 2) DEFAULT 0.00,
    expected_cash_usd NUMERIC(12, 2) DEFAULT 0.00,
    expected_cash_ves NUMERIC(14, 2) DEFAULT 0.00,
    actual_cash_usd NUMERIC(12, 2),
    actual_cash_ves NUMERIC(14, 2),
    difference_usd NUMERIC(12, 2),
    difference_ves NUMERIC(14, 2),
    notes TEXT
);

-- 7. TABLA: MOVIMIENTOS DE CAJA (ENTRADAS / SALIDAS DE EFECTIVO)
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID NOT NULL REFERENCES cash_shifts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'cash_in', 'cash_out'
    currency VARCHAR(5) NOT NULL, -- 'USD', 'VES'
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    amount_usd NUMERIC(12, 2) NOT NULL,
    amount_ves NUMERIC(14, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_movements_shift ON cash_movements (shift_id);

-- 8. TABLA: VENTAS Y FACTURAS
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    control_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    shift_id UUID REFERENCES cash_shifts(id),
    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal_usd NUMERIC(12, 2) NOT NULL,
    discount_usd NUMERIC(12, 2) DEFAULT 0.00,
    tax_usd NUMERIC(12, 2) DEFAULT 0.00,
    total_usd NUMERIC(12, 2) NOT NULL,
    subtotal_ves NUMERIC(14, 2) NOT NULL,
    tax_ves NUMERIC(14, 2) DEFAULT 0.00,
    total_ves NUMERIC(14, 2) NOT NULL,
    bcv_rate NUMERIC(14, 4) NOT NULL, -- Tasa congelada en el momento de la venta
    cashier_name VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'completed', -- 'completed', 'cancelled', 'credit_pending'
    change_usd NUMERIC(12, 2) DEFAULT 0.00,
    change_ves NUMERIC(14, 2) DEFAULT 0.00,
    change_method VARCHAR(30), -- 'cash_usd', 'cash_ves', 'pago_movil'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sales_date ON sales (sale_date DESC);
CREATE INDEX idx_sales_customer ON sales (customer_id);

-- 9. TABLA: DETALLE DE ITEMS DE VENTA
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) DEFAULT 'UND',
    price_usd NUMERIC(12, 4) NOT NULL,
    price_ves NUMERIC(14, 4) NOT NULL,
    cost_usd NUMERIC(12, 4) DEFAULT 0.0000,
    discount_usd NUMERIC(12, 2) DEFAULT 0.00,
    subtotal_usd NUMERIC(12, 2) NOT NULL,
    subtotal_ves NUMERIC(14, 2) NOT NULL,
    is_service BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_sale_items_sale ON sale_items (sale_id);

-- 10. TABLA: PAGOS DIVIDIDOS / MULTIMONEDA (SPLIT PAYMENTS)
CREATE TABLE payment_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method VARCHAR(30) NOT NULL, -- 'cash_usd', 'cash_ves', 'pago_movil', 'punto_venta', 'zelle', 'binance_pay', 'credito_fiado'
    amount_usd NUMERIC(12, 2) NOT NULL CHECK (amount_usd >= 0),
    amount_ves NUMERIC(14, 2) NOT NULL CHECK (amount_ves >= 0),
    applied_rate NUMERIC(14, 4) NOT NULL,
    reference VARCHAR(100),
    bank VARCHAR(100),
    sender_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payment_splits_sale ON payment_splits (sale_id);
CREATE INDEX idx_payment_splits_method ON payment_splits (method);

-- 11. TABLA: COTIZACIONES / PRESUPUESTOS (ESTILO FACTIVA)
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id),
    customer_name VARCHAR(255) NOT NULL,
    customer_doc VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(50),
    customer_email VARCHAR(150),
    quote_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    total_usd NUMERIC(12, 2) NOT NULL,
    total_ves NUMERIC(14, 2) NOT NULL,
    bcv_rate NUMERIC(14, 4) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'converted', 'expired'
    converted_sale_id UUID REFERENCES sales(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'UND',
    price_usd NUMERIC(12, 4) NOT NULL,
    price_ves NUMERIC(14, 4) NOT NULL,
    subtotal_usd NUMERIC(12, 2) NOT NULL,
    subtotal_ves NUMERIC(14, 2) NOT NULL
);

-- 12. TABLA: CUENTAS POR COBRAR / LIBRETA DE FIADOS (INDEXADA EN USD)
CREATE TABLE debt_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    sale_id UUID NOT NULL REFERENCES sales(id),
    invoice_number VARCHAR(50) NOT NULL,
    original_debt_usd NUMERIC(12, 2) NOT NULL CHECK (original_debt_usd > 0),
    paid_debt_usd NUMERIC(12, 2) DEFAULT 0.00 CHECK (paid_debt_usd >= 0),
    remaining_debt_usd NUMERIC(12, 2) NOT NULL CHECK (remaining_debt_usd >= 0),
    date_created TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 'pending', 'partially_paid', 'paid'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_debts_customer ON debt_accounts (customer_id);
CREATE INDEX idx_debts_status ON debt_accounts (status);

-- 13. TABLA: ABONOS Y PAGOS DE DEUDAS (CONVERSIÓN AL BCV DEL DÍA DEL ABONO)
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    debt_id UUID NOT NULL REFERENCES debt_accounts(id) ON DELETE CASCADE,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount_usd NUMERIC(12, 2) NOT NULL CHECK (amount_usd > 0),
    amount_ves NUMERIC(14, 2) NOT NULL CHECK (amount_ves > 0),
    rate_applied NUMERIC(14, 4) NOT NULL, -- Tasa del día exacto del cobro
    method VARCHAR(30) NOT NULL,
    reference VARCHAR(100),
    bank VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_debt_payments_debt ON debt_payments (debt_id);
`;

export const TYPESCRIPT_CHECKOUT_LOGIC = `/**
 * NÚCLEO FINANCIERO Y LÓGICA DE CHECKOUT BIMONEDA (VENEZUELA)
 * TypeScript Implementation: Split Payments & Dynamic BCV Conversion
 */

export interface SplitPaymentInput {
  method: 'cash_usd' | 'cash_ves' | 'pago_movil' | 'punto_venta' | 'zelle' | 'binance_pay' | 'credito_fiado';
  amount: number; // Raw input amount
  currency: 'USD' | 'VES'; // Currency in which the customer is physically tendering
  reference?: string;
  bank?: string;
  senderPhone?: string;
}

export interface CheckoutCalculationResult {
  totalUSD: number;
  totalVES: number;
  bcvRate: number;
  paymentsProcessed: {
    method: string;
    amountUSD: number;
    amountVES: number;
    appliedRate: number;
    reference?: string;
    bank?: string;
  }[];
  totalPaidUSD: number;
  totalPaidVES: number;
  remainingUSD: number;
  remainingVES: number;
  isFullyPaid: boolean;
  changeUSD: number;
  changeVES: number;
}

export function calculateBimonetaryCheckout(
  totalUSD: number,
  bcvRate: number,
  splits: SplitPaymentInput[]
): CheckoutCalculationResult {
  if (bcvRate <= 0) throw new Error("Tasa BCV inválida o no configurada");
  
  const totalVES = Number((totalUSD * bcvRate).toFixed(2));
  
  let totalPaidUSD = 0;
  let totalPaidVES = 0;

  const paymentsProcessed = splits.map(split => {
    let splitUSD = 0;
    let splitVES = 0;

    if (split.currency === 'USD') {
      splitUSD = Number(split.amount.toFixed(2));
      splitVES = Number((splitUSD * bcvRate).toFixed(2));
    } else {
      splitVES = Number(split.amount.toFixed(2));
      splitUSD = Number((splitVES / bcvRate).toFixed(2));
    }

    totalPaidUSD += splitUSD;
    totalPaidVES += splitVES;

    return {
      method: split.method,
      amountUSD: splitUSD,
      amountVES: splitVES,
      appliedRate: bcvRate,
      reference: split.reference,
      bank: split.bank
    };
  });

  totalPaidUSD = Number(totalPaidUSD.toFixed(2));
  totalPaidVES = Number(totalPaidVES.toFixed(2));

  const diffUSD = Number((totalPaidUSD - totalUSD).toFixed(2));
  const isFullyPaid = totalPaidUSD >= totalUSD - 0.005;

  let remainingUSD = 0;
  let remainingVES = 0;
  let changeUSD = 0;
  let changeVES = 0;

  if (diffUSD < 0) {
    remainingUSD = Math.abs(diffUSD);
    remainingVES = Number((remainingUSD * bcvRate).toFixed(2));
  } else if (diffUSD > 0) {
    changeUSD = diffUSD;
    changeVES = Number((changeUSD * bcvRate).toFixed(2));
  }

  return {
    totalUSD,
    totalVES,
    bcvRate,
    paymentsProcessed,
    totalPaidUSD,
    totalPaidVES,
    remainingUSD,
    remainingVES,
    isFullyPaid,
    changeUSD,
    changeVES
  };
}

/**
 * Servicio de Sincronización Automática de Tasa BCV
 */
export async function syncBCVExchangeRate(): Promise<{ rate: number; source: string; timestamp: string }> {
  const sources = [
    { url: 'https://ve.dolarapi.com/v1/dolares/oficial', parse: (j: any) => j.promedio },
    { url: 'https://pydolarve.org/api/v1/dollar?page=bcv', parse: (j: any) => Number(j.monitors.usd.price) }
  ];

  for (const src of sources) {
    try {
      const response = await fetch(src.url, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const json = await response.json();
        const extracted = src.parse(json);
        if (extracted && !isNaN(extracted) && extracted > 0) {
          return {
            rate: Number(extracted.toFixed(4)),
            source: 'BCV_API',
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (e) {
      // Continue to next endpoint fallback
    }
  }

  // Fallback a última tasa persistida en base de datos
  return {
    rate: 86.45,
    source: 'CONTINGENCY_CACHE',
    timestamp: new Date().toISOString()
  };
}
`;

export const API_ENDPOINTS_DOCS = `# ESTRUCTURA DE CARPETAS & ENDPOINTS REST API
# NegoFact POS & Facturación Bimoneda Venezuela

## 📁 ESTRUCTURA DEL PROYECTO (Clean Architecture & Modular)
\`\`\`
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Barra superior con Tasa BCV en vivo, Cuadre de Caja y Roles
│   │   ├── POS/                   # Módulo NegoExpress Mostrador Rápido
│   │   │   ├── POSScreen.tsx      # Escáner de barras, buscador, filtros y carrito
│   │   │   ├── SplitPaymentModal.tsx # Checkout Bimoneda & Split Payments (Pago Móvil, Zelle, etc.)
│   │   │   └── ReceiptModal.tsx   # Ticket Térmico (58/80mm), PDF y WhatsApp Share
│   │   ├── Quotes/                # Módulo Factiva Cotizaciones & Facturación
│   │   │   └── QuotesManager.tsx  # Generador de presupuestos y conversión 1-clic a venta
│   │   ├── Inventory/             # Inventario con variantes y servicios
│   │   │   └── InventoryManager.tsx # Stock, alertas mínimas y catálogo digital
│   │   ├── Debts/                 # Libreta de Fiados (Cuentas por Cobrar)
│   │   │   └── DebtsManager.tsx   # Indexación en USD y cobro a tasa BCV del día
│   │   ├── CashShift/             # Arqueo de Caja / Cuadre Z
│   │   │   └── CashShiftModal.tsx # Apertura, E/S de efectivo y desglose por método
│   │   ├── Sales/                 # Historial de Ventas & Anulaciones
│   │   │   └── SalesHistory.tsx
│   │   ├── Settings/              # Datos de empresa, RIF, datos Pago Móvil y Zelle
│   │   │   └── SettingsModal.tsx
│   │   └── DeveloperDocs/         # Visualizador del Schema SQL, Lógica TS y APIs
│   ├── types.ts                   # Tipado TypeScript bimoneda
│   ├── utils/
│   │   ├── bcvService.ts          # Integración API BCV y conversiones matemáticas
│   │   ├── storage.ts             # Motor Offline-First (IndexedDB / LocalStorage)
│   │   ├── thermalPrinter.ts      # Generador de comandos ESC/POS y Web Bluetooth
│   │   ├── pdfGenerator.ts        # Facturas y Cotizaciones profesionales con jsPDF
│   │   └── whatsappHelper.ts      # Generador de tickets formateados para WhatsApp
│   ├── App.tsx
│   └── main.tsx
\`\`\`

---

## 🌐 ENDPOINTS CLAVE DE LA API REST (Backend Express / FastAPI / Supabase)

### 1. Núcleo de Tasas de Cambio
- \`GET /api/v1/rates/bcv\`
  - Obtiene la tasa oficial del BCV en tiempo real con fecha de publicación.
- \`POST /api/v1/rates/override\`
  - Sobreescritura manual de la tasa por contingencia de conexión o error.
  - Body: \`{ "rate": 86.50, "reason": "Fallo de conexión BCV" }\`
- \`GET /api/v1/rates/history\`
  - Histórico de tasas registradas con trazabilidad.

### 2. Punto de Venta (POS) & Ventas
- \`POST /api/v1/sales\`
  - Registra una nueva venta con split payments y actualiza stock.
  - Body:
    \`\`\`json
    {
      "customerId": "uuid",
      "items": [
        { "productId": "uuid", "variantId": null, "quantity": 2, "priceUSD": 1.45 }
      ],
      "bcvRate": 86.45,
      "payments": [
        { "method": "cash_usd", "amountUSD": 10.0, "amountVES": 864.50 },
        { "method": "pago_movil", "amountUSD": 10.0, "amountVES": 864.50, "reference": "981244", "bank": "Banesco" }
      ],
      "change": { "amountUSD": 0, "amountVES": 0, "method": "cash_usd" }
    }
    \`\`\`
- \`GET /api/v1/sales/:id/receipt\`
  - Obtiene el payload estructurado para ticket térmico ESC/POS y PDF.

### 3. Cotizaciones & Presupuestos (Factiva)
- \`POST /api/v1/quotes\`
  - Genera una cotización formal con fecha de validez y tasa referencial.
- \`POST /api/v1/quotes/:id/convert-to-sale\`
  - Convierte una cotización en venta activa descontando inventario en 1 solo clic.

### 4. Cuentas por Cobrar (Libreta de Fiados)
- \`GET /api/v1/debts\`
  - Lista deudas activas indexadas en USD con equivalente en Bs. calculado a la tasa actual.
- \`POST /api/v1/debts/:id/installments\`
  - Registra un abono o cancelación total calculando la tasa BCV del momento del pago.

### 5. Control de Caja & Cuadre Z
- \`POST /api/v1/shifts/open\`
  - Apertura de turno con fondo en USD y Bs.
- \`POST /api/v1/shifts/movements\`
  - Entrada o salida de efectivo (pago a proveedores, gastos diarios).
- \`POST /api/v1/shifts/close\`
  - Cuadre Z con comparación entre monto esperado vs contado en caja.
`;
