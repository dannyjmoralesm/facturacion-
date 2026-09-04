import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  FileText, 
  DollarSign, 
  Building2, 
  Calendar, 
  Tag, 
  Plus, 
  ArrowRight,
  Eye,
  SlidersHorizontal,
  Info,
  Check
} from 'lucide-react';
import { Supplier, SupplierDebt } from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';

interface InvoiceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  bcvRate: number;
  onSaveDebt: (
    debtData: {
      supplierId: string;
      supplierName: string;
      supplierRif: string;
      invoiceNumber: string;
      controlNumber: string;
      dateCreated: string;
      dueDate: string;
      category: string;
      currency: 'USD' | 'VES';
      originalDebtUSD: number;
      originalDebtVES: number;
      bcvRateAtCreation: number;
      description: string;
      notes: string;
    },
    newSupplierData?: {
      name: string;
      rif: string;
      phone: string;
      contactPerson: string;
    }
  ) => void;
}

// Pre-built Venezuelan sample invoices for testing OCR immediately
const SAMPLE_INVOICES = [
  {
    title: 'Distribuidora Polar C.A. (Víveres & Harina)',
    supplierName: 'Empresas Polar C.A. / Cervecería Polar',
    supplierRif: 'J-00041372-1',
    supplierPhone: '0212-2023111',
    supplierContact: 'Carlos Mendoza (Vendedor Zona 4)',
    invoiceNumber: 'FAC-0098412',
    controlNumber: '00-00847291',
    dateCreated: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    category: 'Mercancía (Víveres & Alimentos)',
    currency: 'USD' as const,
    totalUSD: 840.00,
    description: '40 bultos Harina PAN 1kg, 20 fardos Arroz Primor 1kg, 10 cajas Mayonesa Mavesa',
    notes: 'Plazo 15 días continuos. Pago vía Transferencia Banesco o Efectivo Divisas.',
    items: [
      { description: 'Harina PAN Maíz Blanco 1kg (Bulto x 20)', quantity: 40, unitPriceUSD: 14.50, totalPriceUSD: 580.00 },
      { description: 'Arroz Primor Clásico 1kg (Bulto x 24)', quantity: 20, unitPriceUSD: 10.00, totalPriceUSD: 200.00 },
      { description: 'Mayonesa Mavesa 445g (Caja x 12)', quantity: 10, unitPriceUSD: 6.00, totalPriceUSD: 60.00 }
    ]
  },
  {
    title: 'Alimentos Heinz de Venezuela (Salsas & Enlatados)',
    supplierName: 'Alimentos Heinz C.A.',
    supplierRif: 'J-00018491-0',
    supplierPhone: '0241-8714000',
    supplierContact: 'Mariana Silva',
    invoiceNumber: 'NE-449102',
    controlNumber: '00-00124901',
    dateCreated: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
    category: 'Enlatados & Salsas',
    currency: 'USD' as const,
    totalUSD: 395.50,
    description: '15 cajas Salsa de Tomate Ketchup Heinz 397g, 8 cajas Vinagre Blanco Heinz, 10 cajas Mostaza',
    notes: 'Descuento 3% por pronto pago antes de 7 días. Banco Mercantil.',
    items: [
      { description: 'Ketchup Heinz 397g (Caja x 24)', quantity: 15, unitPriceUSD: 18.50, totalPriceUSD: 277.50 },
      { description: 'Vinagre Blanco Heinz 1L (Caja x 12)', quantity: 8, unitPriceUSD: 8.50, totalPriceUSD: 68.00 },
      { description: 'Mostaza Heinz 250g (Caja x 12)', quantity: 10, unitPriceUSD: 5.00, totalPriceUSD: 50.00 }
    ]
  },
  {
    title: 'Distribuidora Lácteos Los Andes (Charcutería)',
    supplierName: 'Lácteos & Embutidos del Centro, S.A.',
    supplierRif: 'J-31405928-4',
    supplierPhone: '0414-4918230',
    supplierContact: 'Lcdo. Jorge Torrealba',
    invoiceNumber: 'FAC-10029',
    controlNumber: '00-0038104',
    dateCreated: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    category: 'Charcutería & Lácteos',
    currency: 'USD' as const,
    totalUSD: 520.00,
    description: '6 piezas Queso Amarillo Torondoy, 4 piezas Jamón Superior Plumrose, 10kg Tocineta Ahumada',
    notes: 'Crédito semanal (7 días). Mantener refrigeración a 4°C.',
    items: [
      { description: 'Queso Gouda / Amarillo Torondoy (Pieza ~3.2kg)', quantity: 6, unitPriceUSD: 45.00, totalPriceUSD: 270.00 },
      { description: 'Jamón Cocido Superior Plumrose (Pieza ~4.5kg)', quantity: 4, unitPriceUSD: 42.50, totalPriceUSD: 170.00 },
      { description: 'Tocineta Ahumada Especial (Kilo)', quantity: 10, unitPriceUSD: 8.00, totalPriceUSD: 80.00 }
    ]
  }
];

export const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  bcvRate,
  onSaveDebt,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera' | 'sample'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState<'idle' | 'analyzing' | 'extracted'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Extracted and editable fields
  const [supplierName, setSupplierName] = useState('');
  const [supplierRif, setSupplierRif] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('new');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [controlNumber, setControlNumber] = useState('');
  const [dateCreated, setDateCreated] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Mercancía (Víveres & Alimentos)');
  const [currency, setCurrency] = useState<'USD' | 'VES'>('USD');
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [totalVES, setTotalVES] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [itemsList, setItemsList] = useState<any[]>([]);

  // Camera stream references
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Match existing supplier by RIF or Name when scanned
  const matchExistingSupplier = (name: string, rif: string) => {
    const cleanRif = rif?.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const found = suppliers.find(s => {
      const sRif = s.rif.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (cleanRif && sRif === cleanRif) || s.name.toLowerCase().includes(name.toLowerCase());
    });

    if (found) {
      setSelectedSupplierId(found.id);
      setSupplierName(found.name);
      setSupplierRif(found.rif);
      setSupplierPhone(found.phone || '');
      setSupplierContact(found.contactPerson || '');
    } else {
      setSelectedSupplierId('new');
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('No se pudo acceder a la cámara. Por favor permite los permisos o usa la opción de subir imagen.');
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Capture Frame from Camera
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
      processImageWithGemini(dataUrl, 'image/jpeg');
    }
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
      setMimeType(file.type || 'image/jpeg');
      processImageWithGemini(dataUrl, file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  // Call Server-Side Gemini 3.7 Flash API
  const processImageWithGemini = async (imageBase64: string, type: string) => {
    setIsScanning(true);
    setScanStep('analyzing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/scan-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: type,
          currentBcvRate: bcvRate,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Error al procesar la factura con IA.');
      }

      const data = result.data;

      // Populate extracted fields
      setSupplierName(data.supplierName || '');
      setSupplierRif(data.supplierRif || '');
      setSupplierPhone(data.supplierPhone || '');
      setSupplierContact(data.supplierContact || '');
      setInvoiceNumber(data.invoiceNumber || '');
      setControlNumber(data.controlNumber || '');
      setDateCreated(data.dateCreated || new Date().toISOString().slice(0, 10));
      setDueDate(data.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
      setCategory(data.category || 'Mercancía (Víveres & Alimentos)');
      setCurrency(data.currency === 'VES' ? 'VES' : 'USD');
      
      const usdVal = Number(data.totalUSD) || 0;
      const vesVal = Number(data.totalVES) || Number((usdVal * bcvRate).toFixed(2));
      setTotalUSD(usdVal);
      setTotalVES(vesVal);

      setDescription(data.description || 'Mercancía adquirida de proveedor');
      setNotes(data.notes || '');
      setItemsList(data.items || []);

      matchExistingSupplier(data.supplierName || '', data.supplierRif || '');

      setScanStep('extracted');
    } catch (err: any) {
      console.error('Scan Error:', err);
      setErrorMessage(err.message || 'No se pudo digitalizar la factura. Puedes probar con un ejemplo o ingresar los datos manualmente.');
    } finally {
      setIsScanning(false);
    }
  };

  // Load a Predefined Sample
  const loadSample = (sample: typeof SAMPLE_INVOICES[0]) => {
    setIsScanning(true);
    setScanStep('analyzing');
    setErrorMessage(null);
    setSelectedImage(null);

    setTimeout(() => {
      setSupplierName(sample.supplierName);
      setSupplierRif(sample.supplierRif);
      setSupplierPhone(sample.supplierPhone);
      setSupplierContact(sample.supplierContact);
      setInvoiceNumber(sample.invoiceNumber);
      setControlNumber(sample.controlNumber);
      setDateCreated(sample.dateCreated);
      setDueDate(sample.dueDate);
      setCategory(sample.category);
      setCurrency(sample.currency);
      setTotalUSD(sample.totalUSD);
      setTotalVES(Number((sample.totalUSD * bcvRate).toFixed(2)));
      setDescription(sample.description);
      setNotes(sample.notes);
      setItemsList(sample.items);

      matchExistingSupplier(sample.supplierName, sample.supplierRif);

      setIsScanning(false);
      setScanStep('extracted');
    }, 600);
  };

  // Amount recalculations
  const handleUSDChange = (val: number) => {
    setTotalUSD(val);
    setTotalVES(Number((val * bcvRate).toFixed(2)));
  };

  const handleVESChange = (val: number) => {
    setTotalVES(val);
    setTotalUSD(bcvRate > 0 ? Number((val / bcvRate).toFixed(2)) : 0);
  };

  // Submit and save debt
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceNumber.trim() || totalUSD <= 0) {
      setErrorMessage('Por favor verifica el nombre del proveedor, nro de factura y monto total.');
      return;
    }

    const newSupData = selectedSupplierId === 'new' ? {
      name: supplierName.trim(),
      rif: supplierRif.trim() || 'J-00000000-0',
      phone: supplierPhone.trim(),
      contactPerson: supplierContact.trim(),
    } : undefined;

    onSaveDebt(
      {
        supplierId: selectedSupplierId,
        supplierName: supplierName.trim(),
        supplierRif: supplierRif.trim() || 'J-00000000-0',
        invoiceNumber: invoiceNumber.trim(),
        controlNumber: controlNumber.trim() || `00-${invoiceNumber.replace(/\D/g, '') || '001'}`,
        dateCreated: dateCreated || new Date().toISOString().slice(0, 10),
        dueDate: dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
        category,
        currency,
        originalDebtUSD: totalUSD,
        originalDebtVES: totalVES,
        bcvRateAtCreation: bcvRate,
        description: description || `Factura de compra ${invoiceNumber}`,
        notes: notes || '',
      },
      newSupData
    );

    setSuccessToast('Factura de proveedor escaneada y registrada con éxito en Cuentas por Pagar.');
    setTimeout(() => {
      onClose();
      resetState();
    }, 1000);
  };

  const resetState = () => {
    stopCamera();
    setSelectedImage(null);
    setScanStep('idle');
    setIsScanning(false);
    setErrorMessage(null);
    setSuccessToast(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">Escanear Factura de Proveedor con IA</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                  Gemini OCR Vision
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Digitaliza facturas físicas, notas de entrega y recibos para registrar automáticamente cuentas por pagar.
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetState(); onClose(); }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Mode Selection */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 border border-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveMode('upload');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeMode === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir Foto / Archivo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMode('camera');
                startCamera();
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeMode === 'camera'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Usar Cámara en Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setActiveMode('sample');
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeMode === 'sample'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Facturas de Ejemplo</span>
            </button>
          </div>

          {/* Mode View: Camera */}
          {activeMode === 'camera' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="relative aspect-video max-h-[360px] bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Laser scan animation overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                    <div className="w-full h-1 bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                  </div>
                )}

                {/* Framing guides */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-400/40 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                  <span className="text-[10px] text-amber-300 font-mono bg-black/60 px-2 py-0.5 rounded self-start">
                    Encuadra la factura del proveedor
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isScanning || !cameraActive}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Camera className="w-5 h-5" />
                  <span>{isScanning ? 'Escaneando con IA...' : 'Tomar Foto y Escanear'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode View: Upload File */}
          {activeMode === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Haz clic o arrastra la foto de la factura</h3>
                  <p className="text-xs text-slate-400 mt-1">Soporta formatos JPG, PNG, WEBP de alta resolución</p>
                </div>
              </div>

              {selectedImage && (
                <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img src={selectedImage} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                    <div>
                      <div className="text-xs font-bold text-white">Imagen cargada lista para analizar</div>
                      <div className="text-[10px] text-slate-400">Procesamiento visual con OCR Gemini</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => processImageWithGemini(selectedImage, mimeType)}
                    disabled={isScanning}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>{isScanning ? 'Analizando...' : 'Re-Escanear'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mode View: Venezuelan Sample Invoices */}
          {activeMode === 'sample' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-medium">
                Selecciona una factura de prueba para probar la extracción automática al instante:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {SAMPLE_INVOICES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => loadSample(sample)}
                    disabled={isScanning}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 text-left transition flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                          {sample.category.split(' ')[0]}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatUSD(sample.totalUSD)}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white group-hover:text-amber-400 transition line-clamp-1">
                        {sample.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 font-mono">
                        {sample.invoiceNumber} | RIF: {sample.supplierRif}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                        {sample.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-amber-400">
                      <span>Cargar y Extraer</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading Animation Card */}
          {isScanning && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/40 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Extrayendo Datos Fiscales con IA...</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Detectando RIF de proveedor, número de factura, renglones de mercancía, montos bimoneda y fecha de vencimiento.
                </p>
              </div>
            </div>
          )}

          {/* Extracted / Editable Form */}
          {scanStep === 'extracted' && !isScanning && (
            <form onSubmit={handleSave} className="space-y-6 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Datos Extraídos — Revisa y Confirma
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  Tasa BCV Aplicada: <span className="font-mono font-bold text-white">{bcvRate.toFixed(2)} Bs/$</span>
                </span>
              </div>

              {/* Supplier Information Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Proveedor Comercial</span>
                  </div>
                  {selectedSupplierId === 'new' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      + Se registrará como Proveedor Nuevo
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Proveedor Existente Asociado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Nombre / Razón Social <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      RIF / Documento <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={supplierRif}
                      onChange={(e) => setSupplierRif(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      placeholder="0414-0000000"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Vendedor / Contacto
                    </label>
                    <input
                      type="text"
                      value={supplierContact}
                      onChange={(e) => setSupplierContact(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Numbers and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Nro. Factura <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Nro. Control SENIAT
                  </label>
                  <input
                    type="text"
                    value={controlNumber}
                    onChange={(e) => setControlNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Fecha Emisión <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dateCreated}
                    onChange={(e) => setDateCreated(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Fecha Vencimiento <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Category and Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Categoría de Compra
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Mercancía (Víveres & Alimentos)">Mercancía (Víveres & Alimentos)</option>
                    <option value="Bebidas & Licores">Bebidas & Licores</option>
                    <option value="Charcutería & Lácteos">Charcutería & Lácteos</option>
                    <option value="Enlatados & Salsas">Enlatados & Salsas</option>
                    <option value="Limpieza & Cuidado Personal">Limpieza & Cuidado Personal</option>
                    <option value="Insumos Comerciales (Bolsas/Rollos)">Insumos Comerciales (Bolsas/Rollos)</option>
                    <option value="Servicios & Mantenimiento">Servicios & Mantenimiento</option>
                    <option value="Equipos & Maquinaria">Equipos & Maquinaria</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Total Factura ($ USD) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={totalUSD || ''}
                      onChange={(e) => handleUSDChange(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Equivalente en Bolívares (VES)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">Bs</span>
                    <input
                      type="number"
                      step="0.01"
                      value={totalVES || ''}
                      onChange={(e) => handleVESChange(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Items Breakdown if extracted */}
              {itemsList && itemsList.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Renglones / Productos Extraídos ({itemsList.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Identificados del comprobante</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {itemsList.map((item, idx) => (
                      <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 font-mono rounded text-[10px] font-bold">
                            {item.quantity || 1}x
                          </span>
                          <span className="text-slate-200 font-medium">{item.description}</span>
                        </div>
                        <span className="font-mono text-amber-400 font-semibold">
                          {item.totalPriceUSD ? formatUSD(item.totalPriceUSD) : item.unitPriceUSD ? formatUSD(item.unitPriceUSD * (item.quantity || 1)) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Descripción / Concepto
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Notas y Condiciones de Crédito
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setScanStep('idle')}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Volver a Escanear
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar en Cuentas por Pagar</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
