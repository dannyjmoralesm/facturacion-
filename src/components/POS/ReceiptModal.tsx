import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Share2, 
  Bluetooth, 
  Copy, 
  Check, 
  FileText, 
  Coins, 
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Sale, BusinessProfile } from '../../types';
import { 
  generateSaleTicketText, 
  printViaBluetooth 
} from '../../utils/thermalPrinter';
import { downloadSalePDF } from '../../utils/pdfGenerator';
import { createWhatsAppSaleMessage, openWhatsAppLink } from '../../utils/whatsappHelper';
import { formatUSD, formatVES } from '../../utils/bcvService';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  profile: BusinessProfile;
  onNewSale: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  profile,
  onNewSale
}) => {
  const [thermalWidth, setThermalWidth] = useState<'58mm' | '80mm'>(profile.defaultThermalSize || '80mm');
  const [copied, setCopied] = useState(false);
  const [isPrintingBT, setIsPrintingBT] = useState(false);
  const [btStatus, setBtStatus] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'thermal' | 'whatsapp' | 'escpos'>('thermal');

  if (!isOpen || !sale) return null;

  const ticketText = generateSaleTicketText(sale, profile, { width: thermalWidth });
  const waMessage = createWhatsAppSaleMessage(sale, profile);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrintStandard = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket ${sale.invoiceNumber}</title>
            <style>
              body {
                font-family: 'Courier New', Courier, monospace;
                font-size: 12px;
                padding: 10px;
                white-space: pre-wrap;
                max-width: ${thermalWidth === '58mm' ? '240px' : '320px'};
                margin: 0 auto;
              }
              @media print {
                @page { margin: 0; }
                body { margin: 1cm; }
              }
            </style>
          </head>
          <body>${ticketText}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleBluetoothPrint = async () => {
    setIsPrintingBT(true);
    setBtStatus('Buscando impresora Bluetooth...');
    const res = await printViaBluetooth(ticketText);
    setBtStatus(res.message);
    setIsPrintingBT(false);
    setTimeout(() => setBtStatus(null), 4000);
  };

  const handleSendWhatsApp = () => {
    openWhatsAppLink(sale.customerPhone, waMessage);
  };

  const handleDownloadPDF = () => {
    downloadSalePDF(sale, profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base text-white">Comprobante de Venta Emitido</h2>
              <p className="text-xs text-slate-400 font-mono">
                {sale.invoiceNumber} | Control: {sale.controlNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          {/* Format selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewTab('thermal')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                viewTab === 'thermal' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Ticket Térmico
            </button>
            <button
              onClick={() => setViewTab('whatsapp')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                viewTab === 'whatsapp' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setViewTab('escpos')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                viewTab === 'escpos' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Comandos ESC/POS
            </button>
          </div>

          {viewTab === 'thermal' && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Ancho:</span>
              <button
                onClick={() => setThermalWidth('58mm')}
                className={`px-2 py-0.5 rounded font-mono font-semibold transition ${
                  thermalWidth === '58mm' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}
              >
                58mm
              </button>
              <button
                onClick={() => setThermalWidth('80mm')}
                className={`px-2 py-0.5 rounded font-mono font-semibold transition ${
                  thermalWidth === '80mm' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-900 text-slate-400'
                }`}
              >
                80mm
              </button>
            </div>
          )}
        </div>

        {/* Content Viewer */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/60 flex items-center justify-center">
          {viewTab === 'thermal' && (
            <div className={`bg-amber-50 text-slate-900 p-4 rounded-lg shadow-lg font-mono text-xs border border-amber-200/60 transition-all ${
              thermalWidth === '58mm' ? 'w-64' : 'w-80 sm:w-96'
            }`}>
              <pre className="whitespace-pre-wrap leading-tight select-all">
                {ticketText}
              </pre>
            </div>
          )}

          {viewTab === 'whatsapp' && (
            <div className="bg-[#0b141a] text-slate-100 p-4 rounded-xl shadow-lg font-sans text-xs border border-slate-800 w-full max-w-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-emerald-400 font-semibold">
                <span>Vista Previa Mensaje WhatsApp:</span>
                <button
                  onClick={() => handleCopyText(waMessage)}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200 select-all">
                {waMessage}
              </pre>
            </div>
          )}

          {viewTab === 'escpos' && (
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] border border-slate-800 w-full max-w-lg overflow-x-auto">
              <div className="text-slate-400 mb-2 font-bold">
                Buffer Binario ESC/POS estándar (Init, Charset, Center, Cut GS V A 0):
              </div>
              <div className="text-slate-300 mb-4 bg-slate-950 p-2.5 rounded">
                [0x1B, 0x40] ESC @ Initializing printer...<br />
                [0x1B, 0x74, 0x00] Code page select...<br />
                [Bytes utf-8]: {ticketText.length} caracteres codificados.<br />
                [0x1D, 0x56, 0x41, 0x00] GS V Cut Paper...
              </div>
              <button
                onClick={() => handleCopyText(ticketText)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-sans flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar texto crudo para driver externo</span>
              </button>
            </div>
          )}
        </div>

        {btStatus && (
          <div className="px-4 py-2 bg-blue-950 border-t border-blue-800 text-xs text-blue-300 flex items-center gap-2">
            <Bluetooth className="w-4 h-4 animate-pulse text-blue-400" />
            <span>{btStatus}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrintStandard}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
              title="Imprimir ticket en navegador o impresora térmica del sistema"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimir Ticket</span>
            </button>

            <button
              type="button"
              onClick={handleBluetoothPrint}
              disabled={isPrintingBT}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition disabled:opacity-50"
              title="Conectar impresora térmica Bluetooth portátil ESC/POS"
            >
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <span>Impresora Bluetooth</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition"
              title="Descargar factura en formato PDF profesional con RIF y control"
            >
              <Download className="w-4 h-4 text-purple-400" />
              <span>Factura PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
              title="Enviar comprobante directo al WhatsApp del cliente"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onNewSale();
            }}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition shadow-md"
          >
            <span>+ Nueva Venta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
