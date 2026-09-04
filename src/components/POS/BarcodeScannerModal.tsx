import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Scan, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductScanned
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsScanning(true);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } else {
        setCameraError('Cámara no soportada en este entorno. Puedes ingresar el código manualmente o seleccionar un demo.');
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('No se pudo acceder a la cámara. Usa el escáner manual o los códigos de prueba rápidos abajo.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleProcessCode = (code: string) => {
    const clean = code.trim();
    if (!clean) return;

    const found = products.find(p => 
      p.barcode === clean || 
      p.code.toLowerCase() === clean.toLowerCase() ||
      p.variants?.some(v => v.sku.toLowerCase() === clean.toLowerCase())
    );

    if (found) {
      setScanFeedback(`¡Escaneado: ${found.name}!`);
      // Play audio beep tone if available
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch {}

      onProductScanned(found);
      setTimeout(() => {
        setScanFeedback(null);
        onClose();
      }, 500);
    } else {
      setScanFeedback(`Código no encontrado: ${clean}`);
    }
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">Lector de Código de Barras</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Camera Viewport / Simulated Target */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
            {isScanning && !cameraError ? (
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover"
                playsInline 
                muted 
              />
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 space-y-2">
                <Scan className="w-10 h-10 text-emerald-500/60 mx-auto animate-pulse" />
                <p>{cameraError || 'Cámara lista para escanear código de barras'}</p>
              </div>
            )}

            {/* Laser scanning line overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-32 border-2 border-dashed border-emerald-400/80 rounded-lg relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-sm shadow-rose-500 animate-bounce" />
              </div>
            </div>

            {scanFeedback && (
              <div className={`absolute bottom-3 left-4 right-4 p-2 rounded text-xs font-semibold text-center ${
                scanFeedback.includes('¡') ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {scanFeedback}
              </div>
            )}
          </div>

          {/* Manual / USB Scanner Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Lector USB/Bluetooth o Entrada Manual de Código:
            </label>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleProcessCode(manualCode);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ej. 7591031000101 o HAR-PAN-01"
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition"
              >
                Buscar
              </button>
            </form>
          </div>

          {/* Quick Barcode Demo Pill Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <p className="text-[11px] text-slate-400">Escaneos rápidos de prueba (Venezuela):</p>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProcessCode(p.barcode || p.code)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] rounded transition flex items-center gap-1"
                >
                  <span>{p.name.split(' ')[0]}</span>
                  <span className="font-mono text-emerald-400 text-[10px]">({p.barcode})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
