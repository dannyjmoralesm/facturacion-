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
  SupplierDebt,
  Employee,
  PayrollPeriod,
  PayrollReceipt
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
  SUPPLIER_DEBTS: 'negofact_supplier_debts_v1',
  EMPLOYEES: 'negofact_employees_v1',
  PAYROLL_PERIODS: 'negofact_payroll_periods_v1',
  PAYROLL_RECEIPTS: 'negofact_payroll_receipts_v1'
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
  enableTax: true, // IVA Obligatorio
  taxRatePercent: 16,
  enableIGTF: true, // IGTF 3% Divisas
  igtfRatePercent: 3,
  defaultCestaticketUSD: 40,
  ivssRiskRatePercent: 9
};

const INITIAL_PRODUCTS: Product[] = [
  {
    "id": "prod-1789134363293",
    "code": "TY018",
    "barcode": "7598585351680",
    "name": "ACEITE DE MOTOR 4T 20W-50 OUMURS1 UNIVERSAL",
    "description": "",
    "category": "ACEITE",
    "type": "physical",
    "priceUSD": 10,
    "costUSD": 3.9,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T13:46:03.293Z"
  },
  {
    "id": "prod-1789134425637",
    "code": "J1050-27518",
    "barcode": "7596431298342",
    "name": "CAUCHO 275-18 TW-HS/TW-HJ/CG-B",
    "description": "",
    "category": "CAUCHO",
    "type": "physical",
    "priceUSD": 25,
    "costUSD": 14.95,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T13:47:05.637Z"
  },
  {
    "id": "prod-1789134465301",
    "code": "J2320-909018",
    "barcode": "7594480188263",
    "name": "CAUCHO 90-90-18 TW-HS/TW-HJ/CG-B",
    "description": "",
    "category": "CAUCHO",
    "type": "physical",
    "priceUSD": 41,
    "costUSD": 24.05,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T13:47:45.301Z"
  },
  {
    "id": "prod-1789134873026",
    "code": "OM0175",
    "barcode": "7596339707631",
    "name": "CORONA RAYO 38T OM-EX",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 4.5,
    "costUSD": 1.69,
    "stock": 3,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T13:54:33.026Z"
  },
  {
    "id": "prod-1789134928773",
    "code": "OM0176",
    "barcode": "7593644867034",
    "name": "CORONA RAYO 39T OM-EX",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 4.5,
    "costUSD": 1.69,
    "stock": 3,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T13:55:28.773Z"
  },
  {
    "id": "prod-1789135264168",
    "code": "J013-40T",
    "barcode": "7595372609202",
    "name": "CORONA RAYO 40T TW-EX",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 4.5,
    "costUSD": 1.66,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:01:04.168Z"
  },
  {
    "id": "prod-1789135376662",
    "code": "OM0334",
    "barcode": "7598791074214",
    "name": "KIT RODAMIENTO 428H-128-41T-15T DORADO OM-HS150",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 15,
    "costUSD": 8.58,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:02:56.662Z"
  },
  {
    "id": "prod-1789135442341",
    "code": "E774",
    "barcode": "7597875266067",
    "name": "ARBOL DE LEVA ORIFICIO LUBRICACION TW-HS/TW-CG150",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 15,
    "costUSD": 5.75,
    "stock": 4,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:04:02.342Z"
  },
  {
    "id": "prod-1789135493100",
    "code": "E612",
    "barcode": "7596406885262",
    "name": "ARRANQUE TW-GNN125",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 30,
    "costUSD": 11.7,
    "stock": 1,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:04:53.100Z"
  },
  {
    "id": "prod-1789135538337",
    "code": "OM0018",
    "barcode": "7594775664700",
    "name": "ARRANQUE OM-T200",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 21,
    "costUSD": 8.05,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:05:38.337Z"
  },
  {
    "id": "prod-1789135589204",
    "code": "J008",
    "barcode": "7598095373435",
    "name": "BOBINA ARRANQUE ORIGINAL TW-HS150",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 5,
    "costUSD": 1.71,
    "stock": 3,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:06:29.204Z"
  },
  {
    "id": "prod-1789135637431",
    "code": "J080",
    "barcode": "7594872170946",
    "name": "BOMBA ACEITE TW-CG150",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 2.55,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:07:17.431Z"
  },
  {
    "id": "prod-1789135681885",
    "code": "R050",
    "barcode": "7597959750010",
    "name": "BOMBA ACEITE TW-RK200",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 10,
    "costUSD": 3.3,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:08:01.885Z"
  },
  {
    "id": "prod-1789135739350",
    "code": "E024",
    "barcode": "7594418284795",
    "name": "BOMBA FRENO CON MANILLA NEGRO TW-HS150",
    "description": "",
    "category": "FRENO",
    "type": "physical",
    "priceUSD": 16,
    "costUSD": 5.08,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:08:59.350Z"
  },
  {
    "id": "prod-1789135780391",
    "code": "GN006",
    "barcode": "7593375055522",
    "name": "BOMBA FRENO DELANTERO TW-GNN/TW-OW/TW-LN",
    "description": "",
    "category": "FRENO",
    "type": "physical",
    "priceUSD": 14,
    "costUSD": 4.55,
    "stock": 1,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:09:40.391Z"
  },
  {
    "id": "prod-1789135840097",
    "code": "E151",
    "barcode": "7597406597663",
    "name": "BUJIA CR8E UNID TW-OW/TW-GNN125",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 2,
    "costUSD": 0.52,
    "stock": 30,
    "minStock": 5,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:10:40.097Z"
  },
  {
    "id": "prod-1789135896474",
    "code": "U002",
    "barcode": "7595595053690",
    "name": "BUJIA D8TC TW-JG/TW-HS",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 2,
    "costUSD": 0.51,
    "stock": 30,
    "minStock": 5,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:11:36.475Z"
  },
  {
    "id": "prod-1789135938326",
    "code": "G114",
    "barcode": "7595948535119",
    "name": "BUJIA IRIDIUM TW-GNN125",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 2.77,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:12:18.326Z"
  },
  {
    "id": "prod-1789135978960",
    "code": "J191",
    "barcode": "7592702363845",
    "name": "BUJIA PUNTA DIAMANTE TW-JG150",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 2.91,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:12:58.960Z"
  },
  {
    "id": "prod-1789136018804",
    "code": "J148",
    "barcode": "7591397573893",
    "name": "CACHIMBO TW-MATX150",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 2,
    "costUSD": 0.54,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:13:38.804Z"
  },
  {
    "id": "prod-1789136059916",
    "code": "E082B",
    "barcode": "7596371900700",
    "name": "CADENA 428H-128 REFORZADA DORADA UNIVERSAL",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 14,
    "costUSD": 5.4,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:14:19.916Z"
  },
  {
    "id": "prod-1789136101524",
    "code": "E620",
    "barcode": "7597660697507",
    "name": "CALIPER DELANTERO TW-HS150",
    "description": "",
    "category": "FRENO",
    "type": "physical",
    "priceUSD": 26,
    "costUSD": 8.5,
    "stock": 1,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:15:01.524Z"
  },
  {
    "id": "prod-1789136146596",
    "code": "E372",
    "barcode": "7597327300245",
    "name": "CARBURADOR PZ30 TW-CG200/T200",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 26,
    "costUSD": 9.87,
    "stock": 3,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:15:46.596Z"
  },
  {
    "id": "prod-1789136206872",
    "code": "E837-38T",
    "barcode": "7596557899236",
    "name": "CORONA PALETA 38T DORADO TW-HS150",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 2.85,
    "stock": 5,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:16:46.872Z"
  },
  {
    "id": "prod-1789136280922",
    "code": "E837-39T",
    "barcode": "7597048755939",
    "name": "CORONA PALETA 39T DORADO TW-HS150",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 3,
    "stock": 5,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:18:00.922Z"
  },
  {
    "id": "prod-1789136320260",
    "code": "E837-40T",
    "barcode": "7597567275077",
    "name": "CORONA PALETA 40T DORADO TW-HS150",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 2.91,
    "stock": 5,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:18:40.260Z"
  },
  {
    "id": "prod-1789136358028",
    "code": "E837-43T",
    "barcode": "7596653520549",
    "name": "CORONA PLAETA 43T DORADO TW-HS150",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 3.03,
    "stock": 3,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:19:18.028Z"
  },
  {
    "id": "prod-1789136413611",
    "code": "E839-43T",
    "barcode": "7594494720358",
    "name": "CORONA PALETA 43T DORADO TW-T200 (NEW)",
    "description": "",
    "category": "RODAMIENTO",
    "type": "physical",
    "priceUSD": 8,
    "costUSD": 3.14,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:20:13.611Z"
  },
  {
    "id": "prod-1789136453143",
    "code": "E041",
    "barcode": "7593196592239",
    "name": "GUAYA ACELERACION TW-HS150",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 0.94,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:20:53.143Z"
  },
  {
    "id": "prod-1789136488582",
    "code": "E927",
    "barcode": "7599445510813",
    "name": "GUAYA ACELERACION TW-HS NEW",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 0.96,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:21:28.582Z"
  },
  {
    "id": "prod-1789136528951",
    "code": "E998",
    "barcode": "7595998348080",
    "name": "GUAYA CROCHE RADIO TW-EX 150",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 0.98,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:22:08.951Z"
  },
  {
    "id": "prod-1789136565327",
    "code": "E028",
    "barcode": "7597203368060",
    "name": "GUAYA CROCHE TW-HS/TW-HS2/TW-MD/CG-B",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 1.03,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:22:45.327Z"
  },
  {
    "id": "prod-1789136606818",
    "code": "E592",
    "barcode": "7592993514180",
    "name": "GUAYA CROCHE TW-RKV200",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 0.78,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:23:26.818Z"
  },
  {
    "id": "prod-1789136638984",
    "code": "R004",
    "barcode": "7599776034625",
    "name": "GUAYA KILOMETRAJE TW-RK200",
    "description": "",
    "category": "GUAYA",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 0.94,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:23:58.985Z"
  },
  {
    "id": "prod-1789136679674",
    "code": "OM0294",
    "barcode": "7598795128474",
    "name": "INSTALACION OM-ASII",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 20,
    "costUSD": 6.15,
    "stock": 1,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:24:39.674Z"
  },
  {
    "id": "prod-1789136795200",
    "code": "E045",
    "barcode": "7599757616455",
    "name": "INSTALACION TW-HS150",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 26,
    "costUSD": 8.44,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:26:35.200Z"
  },
  {
    "id": "prod-1789136833949",
    "code": "E792",
    "barcode": "7599418097824",
    "name": "INSTALACION TW-HS150NEW",
    "description": "",
    "category": "ELECTRICO",
    "type": "physical",
    "priceUSD": 26,
    "costUSD": 8.44,
    "stock": 2,
    "minStock": 1,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:27:13.949Z"
  },
  {
    "id": "prod-1789136867038",
    "code": "J087-M",
    "barcode": "7598623867716",
    "name": "KIT ESTOPERA MOTOR CON EST/CIGUEN TW-JG150/HS 150",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 3,
    "costUSD": 1.04,
    "stock": 10,
    "minStock": 2,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:27:47.038Z"
  },
  {
    "id": "prod-1789136904565",
    "code": "U035H",
    "barcode": "7594072155619",
    "name": "ROLINERA TWOM 6204 UNIDAD UNIVERSAL",
    "description": "",
    "category": "MOTOR",
    "type": "physical",
    "priceUSD": 2,
    "costUSD": 0.78,
    "stock": 10,
    "minStock": 3,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:28:24.565Z"
  },
  {
    "id": "prod-1789136942933",
    "code": "E651",
    "barcode": "7593105286353",
    "name": "TRIPA 90/90 R18 90/90R18",
    "description": "",
    "category": "CAUCHO",
    "type": "physical",
    "priceUSD": 5,
    "costUSD": 2.6,
    "stock": 50,
    "minStock": 10,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-11T14:29:02.933Z"
  },
  {
    "id": "prod-1790029195369",
    "code": "PROD-201",
    "barcode": "7592862583594",
    "name": "Harina",
    "description": "",
    "category": "Víveres",
    "type": "physical",
    "priceUSD": 2,
    "costUSD": 1,
    "stock": 20,
    "minStock": 5,
    "unit": "UND",
    "variants": [],
    "createdAt": "2026-09-21T22:19:55.369Z"
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
    address: 'Venta por Mostrador',
    direccionFiscal: 'Av. Principal, Local Comercial S/N',
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
    direccionFiscal: 'Urb. El Parral, Calle Los Almendros, Torre Arboleda, Piso 4, Valencia, Edo. Carabobo',
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
    direccionFiscal: 'Av. Circunvalación Norte, Zona Industrial Castillito, Galpón Nro 8-B, Municipio San Diego, Carabobo. RIF: J-50123499-1',
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
    direccionFiscal: 'Av. Cedeño cruce con Paseo Cabriales, Torre Banaven, Piso 5, Ofic. 502, Valencia, Edo. Carabobo',
    totalDebtUSD: 42.00,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    docType: 'V',
    docNumber: '17892341',
    firstName: 'Roberto Carlos',
    lastName: 'Pérez Silva',
    fullName: 'Roberto Carlos Pérez Silva',
    email: 'roberto.perez@empresa.com',
    phone: '04141239876',
    position: 'Gerente de Operaciones y Ventas',
    department: 'Administración',
    hireDate: '2022-01-15',
    contractType: 'indefinido',
    salaryCurrency: 'USD',
    baseSalary: 450,
    hasCestaticket: true,
    customCestaticketUSD: 40,
    productionBonusUSD: 50,
    bankName: '0102 - Banco de Venezuela',
    bankAccountNumber: '01020123450100123456',
    pagoMovilPhone: '04141239876',
    status: 'active',
    address: 'Valencia, Edo. Carabobo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-2',
    docType: 'V',
    docNumber: '24119854',
    firstName: 'Valeria Sofía',
    lastName: 'Castillo Méndez',
    fullName: 'Valeria Sofía Castillo Méndez',
    email: 'valeria.castillo@empresa.com',
    phone: '04245671122',
    position: 'Cajera Principal / Facturación',
    department: 'Ventas',
    hireDate: '2023-04-10',
    contractType: 'indefinido',
    salaryCurrency: 'USD',
    baseSalary: 230,
    hasCestaticket: true,
    customCestaticketUSD: 40,
    productionBonusUSD: 30,
    bankName: '0134 - Banesco',
    bankAccountNumber: '01340987650100987654',
    pagoMovilPhone: '04245671122',
    status: 'active',
    address: 'Naguanagua, Edo. Carabobo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-3',
    docType: 'V',
    docNumber: '21094321',
    firstName: 'José Gregorio',
    lastName: 'Rivas Delgado',
    fullName: 'José Gregorio Rivas Delgado',
    phone: '04123456789',
    position: 'Encargado de Inventario & Almacén',
    department: 'Almacén',
    hireDate: '2022-09-01',
    contractType: 'indefinido',
    salaryCurrency: 'USD',
    baseSalary: 280,
    hasCestaticket: true,
    customCestaticketUSD: 40,
    productionBonusUSD: 35,
    bankName: '0108 - Banco Provincial',
    bankAccountNumber: '01080345670100345678',
    pagoMovilPhone: '04123456789',
    status: 'active',
    address: 'San Diego, Edo. Carabobo',
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-4',
    docType: 'V',
    docNumber: '26456789',
    firstName: 'Andrea Carolina',
    lastName: 'Colmenares',
    fullName: 'Andrea Carolina Colmenares',
    phone: '04169871234',
    position: 'Asesora de Ventas Mostrador',
    department: 'Ventas',
    hireDate: '2024-02-15',
    contractType: 'indefinido',
    salaryCurrency: 'USD',
    baseSalary: 210,
    hasCestaticket: true,
    customCestaticketUSD: 40,
    productionBonusUSD: 25,
    bankName: '0105 - Banco Mercantil',
    bankAccountNumber: '01050234560100234567',
    pagoMovilPhone: '04169871234',
    status: 'active',
    address: 'Valencia, Edo. Carabobo',
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          ...p,
          variants: Array.isArray(p?.variants) ? p.variants : []
        }));
      }
    }
  } catch (e) {
    console.error('Error loading products:', e);
  }
  // Fallback to full initial repuestos catalog so products are never lost
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c: any) => ({
          ...c,
          direccionFiscal: c.direccionFiscal || c.address || 'Av. Principal, Local Comercial'
        }));
      }
    }
  } catch (e) {
    console.error('Error loading customers:', e);
  }
  const isInitialized = localStorage.getItem('negofact_initialized_v1');
  if (isInitialized) {
    // If empty after reset, return initial default customers with full fiscal addresses
    saveCustomers(INITIAL_CUSTOMERS);
    return INITIAL_CUSTOMERS;
  }
  localStorage.setItem('negofact_initialized_v1', 'true');
  saveCustomers(INITIAL_CUSTOMERS);
  return INITIAL_CUSTOMERS;
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.error('Error saving customers:', e);
  }
}

// ==========================================
// MÓDULO DE NÓMINA (STORAGE HELPERS)
// ==========================================

export function getEmployees(): Employee[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading employees:', e);
  }
  saveEmployees(INITIAL_EMPLOYEES);
  return INITIAL_EMPLOYEES;
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Error saving employees:', e);
  }
}

export function getPayrollPeriods(): PayrollPeriod[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL_PERIODS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading payroll periods:', e);
  }
  return [];
}

export function savePayrollPeriods(periods: PayrollPeriod[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYROLL_PERIODS, JSON.stringify(periods));
  } catch (e) {
    console.error('Error saving payroll periods:', e);
  }
}

export function getPayrollReceipts(): PayrollReceipt[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL_RECEIPTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading payroll receipts:', e);
  }
  return [];
}

export function savePayrollReceipts(receipts: PayrollReceipt[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYROLL_RECEIPTS, JSON.stringify(receipts));
  } catch (e) {
    console.error('Error saving payroll receipts:', e);
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

      // Ensure IVA is mandatory by default and IGTF is enabled
      if (parsed.enableTax === undefined || parsed.enableTax === false) {
        parsed.enableTax = true;
        needsResave = true;
      }
      if (!parsed.taxRatePercent) {
        parsed.taxRatePercent = 16;
        needsResave = true;
      }
      if (parsed.enableIGTF === undefined) {
        parsed.enableIGTF = true;
        needsResave = true;
      }
      if (!parsed.igtfRatePercent) {
        parsed.igtfRatePercent = 3;
        needsResave = true;
      }
      if (!parsed.defaultCestaticketUSD) {
        parsed.defaultCestaticketUSD = 40;
        needsResave = true;
      }
      if (!parsed.ivssRiskRatePercent) {
        parsed.ivssRiskRatePercent = 9;
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
    supplierDebts: getSupplierDebts(),
    employees: getEmployees(),
    payrollPeriods: getPayrollPeriods(),
    payrollReceipts: getPayrollReceipts()
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
    if (parsed.employees) saveEmployees(parsed.employees);
    if (parsed.payrollPeriods) savePayrollPeriods(parsed.payrollPeriods);
    if (parsed.payrollReceipts) savePayrollReceipts(parsed.payrollReceipts);
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
    saveEmployees([]);        // Empleados a 0
    savePayrollPeriods([]);   // Nóminas a 0
    savePayrollReceipts([]);  // Recibos a 0
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
  INITIAL_EMPLOYEES,
  DEFAULT_PROFILE 
};
