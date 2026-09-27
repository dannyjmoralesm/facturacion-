import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  FileText, 
  DollarSign, 
  Receipt, 
  Users, 
  Package, 
  Calculator,
  ChevronRight,
  Printer
} from 'lucide-react';
import { BusinessProfile } from '../../types';
import { jsPDF } from 'jspdf';

interface OperationsManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  bcvRate: number;
}

export const OperationsManualModal: React.FC<OperationsManualModalProps> = ({
  isOpen,
  onClose,
  profile,
  bcvRate
}) => {
  const [activeChapter, setActiveChapter] = useState<number>(1);

  if (!isOpen) return null;

  const chapters = [
    {
      id: 1,
      title: '1. Marco Legal y Tributario en Venezuela',
      icon: ShieldCheck,
      content: `
### 1.1 Normativa Legal Aplicable
Este sistema de Punto de Venta y Gestión Empresarial opera en estricta conformidad con el marco jurídico fiscal y mercantil de la República Bolivariana de Venezuela:
- **Constitución de la República Bolivariana de Venezuela:** Principio de legalidad tributaria (Art. 317).
- **Código Orgánico Tributario (COT):** Obligaciones de los contribuyentes, emisión de facturas y deberes formales.
- **Ley del Impuesto al Valor Agregado (IVA):** Alícuota general vigente del 16% sobre la Base Imponible de bienes y servicios gravados.
- **Ley de Impuesto a las Grandes Transacciones Financieras (IGTF):** Alícuota del 3% aplicable a pagos cancelados en moneda extranjera o divisas sin intermediación bancaria nacional.
- **Ley del Banco Central de Venezuela (BCV):** Artículo 128: Libre convertibilidad de la moneda y adopción de la Tasa Oficial de Cambio del BCV como referencia legal obligatoria en transacciones bimoneda.

### 1.2 Regla de la Moneda de Facturación
Por mandato del SENIAT y la normativa bancaria nacional, la unidad monetaria legal de curso forzoso para la emisión de facturas oficiales es el **Bolívar (Bs.)**. Por tal razón, todas las facturas formales emitidas por el sistema expresan los precios, subtotales, IVA, IGTF y totales exclusivamente en Bolívares, dejando indicada la tasa de cambio oficial de referencia.
      `
    },
    {
      id: 2,
      title: '2. Estructura de Precios: Costo, Margen e IVA',
      icon: Calculator,
      content: `
### 2.1 Fórmula Oficial de Precios
La determinación del precio de venta al público en el módulo de Inventario sigue el estándar financiero y regulatorio:

\`\`\`
1. COSTO + MARGEN DE GANANCIA = PRECIO DE VENTA NETO (Base Imponible)
2. PRECIO DE VENTA NETO + IVA (16%) = PRECIO DE VENTA AL PÚBLICO (PVP)
\`\`\`

- **Costo del Producto:** Valor de adquisición al proveedor (en USD o Bs.).
- **Margen de Ganancia:** Porcentaje de rentabilidad comercial acordado por la empresa.
- **Base Imponible (Subtotal Neto):** Monto sobre el cual se calcula el Impuesto al Valor Agregado (IVA).
- **IVA (16% Obligatorio):** Débito fiscal que el comerciante percibe en nombre del Estado.
- **PVP Final:** Monto total que cancela el consumidor final.

### 2.2 Transparencia al Consumidor
En el catálogo y en la caja registradora, el sistema muestra tanto la Base Imponible como el IVA desglosado y el precio final bimoneda a la tasa oficial del día.
      `
    },
    {
      id: 3,
      title: '3. IGTF: 3% en Pagos con Divisas',
      icon: DollarSign,
      content: `
### 3.1 Aplicación del IGTF (Providencia Administrativa SENIAT)
El Impuesto a las Grandes Transacciones Financieras (IGTF) grava con una alícuota del **3%** todos los pagos realizados por personas naturales o jurídicas en divisas o moneda internacional cuando se cancelan sin la intervención del sistema financiero nacional:
- **Medios Gravados con 3% IGTF:** Efectivo en Dólares ($), Efectivo en Euros (€), Zelle, Transferencias en divisas del exterior y Binance Pay / USDT.
- **Medios Exentos de IGTF:** Pagos en Bolívares mediante Pago Móvil, Puntos de Venta (Tarjetas de Débito/Crédito nacionales), Biopago y Efectivo en Bolívares (VES).

### 3.2 Procedimiento en el Checkout
Al registrar una venta en mostrador:
1. Si el cliente paga en Pago Móvil o Punto de Venta: **IGTF = 0.00 Bs.**
2. Si el cliente abona $20 USD en efectivo o Zelle: El sistema calcula automáticamente el 3% de IGTF ($0.60 USD / equivalente en Bs.) y lo incorpora al comprobante como tributo percibido.
      `
    },
    {
      id: 4,
      title: '4. Datos del Cliente y Dirección Fiscal',
      icon: Building2,
      content: `
### 4.1 Requisitos Formales de la Factura
Para que un comprobante o factura tenga validez jurídica y probatoria ante el SENIAT y permita el aprovechamiento del Crédito Fiscal, es mandatorio registrar los siguientes datos del cliente:
1. **Tipo y Número de Identificación:** V (Venezolano), E (Extranjero), J (Jurídico / RIF), G (Gubernamental).
2. **Nombre Completo o Razón Social:** Denominación registrada en el acta constitutiva o cédula.
3. **Dirección Fiscal:** Calle, avenida, edificio, piso, oficina/local, ciudad y estado donde el contribuyente desarrolla sus actividades.
4. **Número Telefónico y Correo Electrónico:** Para trazabilidad y envío de comprobantes digitales.

### 4.2 Eliminación del Número de Control
En sistemas de facturación electrónica o comprobantes administrativos digitales configurados a la medida de la empresa, el número correlativo fiscal consecutivo (FACT-000001) asume el control formal único, eliminando la duplicidad innecesaria de números de control en la visualización.
      `
    },
    {
      id: 5,
      title: '5. Módulo de Nómina Integral (LOTTT)',
      icon: Users,
      content: `
### 5.1 Legislación Laboral y Salarios Bimoneda
El módulo de Nómina procesa las obligaciones patronales y laborales de acuerdo con la **Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT)** y los decretos de Cestaticket vigentes:
- **Periodicidad:** Quincenal (días 1 al 15 y días 16 al último del mes) o Mensual.
- **Sueldo Básico:** Proporcional a los días efectivamente laborados (15 días en quincena, 30 días en mes).
- **Cestaticket Socialista:** Bono de alimentación indexado de ley ($40 mensuales / $20 quincenales pagaderos en Bolívares a tasa oficial BCV). De carácter no remunerativo.
- **Bono de Productividad:** Bonificación compensatoria en divisas libre de incidencias pasivas para estimular la eficiencia laboral.

### 5.2 Deducciones Legales del Trabajador
- **IVSS (Seguro Social Obligatorio):** 4% sobre el salario básico normal.
- **FAOV / BANAVIH (Vivienda y Hábitat):** 1% sobre el salario básico normal.
- **RPE (Paro Forzoso y Régimen de Empleo):** 0.5% sobre el salario básico normal.

### 5.3 Aportes Patronales (Costo Empresarial)
- **IVSS Patronal:** 9% (riesgo mínimo), 10% (riesgo medio), u 11% (riesgo máximo).
- **FAOV Patronal:** 2% sobre el salario normal.
- **RPE Patronal:** 2% sobre el salario normal.

### 5.4 Recibos de Pago Formales
Cada trabajador cuenta con su comprobante individual de nómina con desglose completo de asignaciones y retenciones, apto para impresión en PDF con casilla de firma y envío directo a su teléfono por WhatsApp.
      `
    },
    {
      id: 6,
      title: '6. Flujo de Caja y Cierres de Turno',
      icon: Receipt,
      content: `
### 6.1 Apertura y Arqueo de Caja Bimoneda
Al inicio de cada jornada o turno de venta:
1. El cajero registra el fondo inicial en divisas en efectivo ($) y en bolívares en efectivo (Bs).
2. Durante el día, el sistema clasifica las ventas por método: Efectivo USD, Efectivo Bs, Pago Móvil, Punto de Venta, Zelle y Binance.
3. Se registran con precisión los cambios y vueltos otorgados, garantizando la trazabilidad de la caja.

### 6.2 Cierre de Turno (Reporte X y Z)
Al finalizar el turno:
- El cajero realiza el conteo físico de billetes y comprobantes de punto.
- El sistema compara lo esperado en caja versus lo contado físicamente, registrando sobrantes o faltantes en el reporte de auditoría.
      `
    }
  ];

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    let y = 20;

    // PORTADA
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 55, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text((profile.name || profile.commercialName || 'MI EMPRESA').toUpperCase(), margin, 24);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`RIF: ${profile.rif || 'J-00000000-0'} | Dirección Fiscal: ${profile.address || 'Venezuela'}`, margin, 32);
    doc.text(`Sistema de Gestión Comercial, Fiscal y Nómina Integral Bimoneda`, margin, 38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text(`MANUAL OFICIAL DE OPERACIONES Y PROCEDIMIENTOS`, margin, 48);

    y = 68;

    chapters.forEach((chap) => {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 1.5, 1.5, 'F');
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(chap.title, margin + 4, y + 5.5);

      y += 12;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const cleanText = chap.content
        .replace(/###/g, '')
        .replace(/```/g, '')
        .replace(/\*\*/g, '')
        .trim();

      const splitLines = doc.splitTextToSize(cleanText, pageWidth - margin * 2 - 4);

      splitLines.forEach((line: string) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin + 2, y);
        y += 4.5;
      });

      y += 6;
    });

    // Pie de página
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Manual de Operaciones Empresariales - ${profile.name || 'Empresa'} | Página ${i} de ${totalPages}`,
        pageWidth / 2,
        290,
        { align: 'center' }
      );
    }

    doc.save(`Manual_Operaciones_${(profile.name || 'Empresa').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-5xl h-full sm:h-[92vh] flex flex-col text-slate-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Manual de Operaciones & Procedimientos Legales</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Edición 2026
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Guía oficial para empresas: Facturación en Bolívares, IVA 16%, IGTF 3%, Nómina LOTTT y Caja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-download-manual-pdf"
              type="button"
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950 transition"
              title="Descargar Manual Completo en formato PDF listo para imprimir o auditar"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Chapter Navigation Sidebar */}
          <div className="w-full md:w-72 bg-slate-950/70 border-b md:border-b-0 md:border-r border-slate-800 p-3 overflow-y-auto space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-2">
              Índice de Capítulos:
            </div>
            {chapters.map(c => {
              const Icon = c.icon;
              const isActive = activeChapter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveChapter(c.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-1">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                </button>
              );
            })}
          </div>

          {/* Chapter Content Area */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-slate-900/90 text-slate-200">
            {(() => {
              const current = chapters.find(c => c.id === activeChapter) || chapters[0];
              const Icon = current.icon;
              return (
                <div className="max-w-3xl mx-auto space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
                    <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="text-lg font-black text-white">{current.title}</h3>
                      <p className="text-xs text-slate-400">
                        {profile.name || 'Empresa'} · Procedimiento Operativo Oficial
                      </p>
                    </div>
                  </div>

                  <div className="prose prose-invert prose-xs sm:prose-sm max-w-none text-slate-300 leading-relaxed space-y-3">
                    {current.content.split('\n\n').map((paragraph, idx) => {
                      if (paragraph.startsWith('###')) {
                        return (
                          <h4 key={idx} className="text-sm font-bold text-white pt-2 text-purple-300">
                            {paragraph.replace('###', '').trim()}
                          </h4>
                        );
                      }
                      if (paragraph.startsWith('```')) {
                        return (
                          <pre key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto">
                            {paragraph.replace(/```/g, '').trim()}
                          </pre>
                        );
                      }
                      return (
                        <p key={idx} className="text-xs sm:text-sm text-slate-300">
                          {paragraph.trim()}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Footer info banner */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Empresa: <span className="text-slate-200 font-semibold">{profile.name || 'Mi Comercio'}</span> | RIF: {profile.rif || 'J-00000000-0'}
          </div>
          <div className="flex items-center gap-2">
            <span>Tasa BCV Aplicable: <strong className="text-emerald-400 font-mono">{bcvRate.toFixed(2)} Bs/$</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
