import { jsPDF } from 'jspdf';
import { Sale, Quote, BusinessProfile, DebtAccount, DebtPaymentInstallment } from '../types';
import { formatUSD, formatVES, formatShortDate } from './bcvService';

export function getCleanCommerceName(profile?: BusinessProfile | null): string {
  if (!profile) return 'MI EMPRESA';
  // La Razón Social / Empresa configurada en el panel de configuración tiene prioridad absoluta
  const legalName = profile.name?.trim();
  const commercialName = profile.commercialName?.trim();
  return legalName || commercialName || 'MI EMPRESA';
}

export function generateInvoicePDF(sale: Sale, profile: BusinessProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  let y = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

  const commerceName = getCleanCommerceName(profile);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(commerceName, margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RIF: ${profile?.rif || 'J-00000000-0'}`, margin + 6, y + 16);
  if (profile?.address || profile?.phone) {
    const locParts = [profile?.address, profile?.city, profile?.state].filter(Boolean).join(', ');
    const phonePart = profile?.phone ? ` | Tel: ${profile.phone}` : '';
    doc.text(`${locParts}${phonePart}`, margin + 6, y + 22);
  }

  // Invoice Meta Box (Right aligned inside banner or badge)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`FACTURA / COMPROBANTE`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFontSize(13);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(sale.invoiceNumber, pageWidth - margin - 6, y + 16, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Control: ${sale.controlNumber}`, pageWidth - margin - 6, y + 22, { align: 'right' });

  y += 34;

  // Client & Transaction Info Cards
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, 100, 26, 2, 2, 'FD');
  doc.roundedRect(margin + 104, y, pageWidth - margin * 2 - 104, 26, 2, 2, 'FD');

  // Client Box
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL CLIENTE', margin + 4, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(sale.customerName, margin + 4, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`C.I. / RIF: ${sale.customerDoc}`, margin + 4, y + 16);
  if (sale.customerPhone) {
    doc.text(`Teléfono: ${sale.customerPhone}`, margin + 4, y + 21);
  }

  // Transaction Box
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLES DE EMISIÓN', margin + 108, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${formatShortDate(sale.date)}`, margin + 108, y + 11);
  doc.text(`Cajero: ${sale.cashierName}`, margin + 108, y + 16);

  // Rate highlighted
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // emerald-600
  const saleRate = (sale.bcvRate && sale.bcvRate > 0) ? sale.bcvRate : 86.45;
  doc.text(`Tasa Oficial BCV: ${saleRate.toFixed(2)} Bs/$`, margin + 108, y + 21);

  y += 32;

  // Items Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y + 8, pageWidth - margin, y + 8);

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CANT', margin + 3, y + 5.5);
  doc.text('DESCRIPCIÓN', margin + 18, y + 5.5);
  doc.text('PRECIO ($)', margin + 98, y + 5.5, { align: 'right' });
  doc.text('PRECIO (BS)', margin + 130, y + 5.5, { align: 'right' });
  doc.text('TOTAL ($)', margin + 155, y + 5.5, { align: 'right' });
  doc.text('TOTAL (BS)', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 9;

  // Items Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  sale.items.forEach((item, index) => {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(15, 23, 42);
    doc.text(`${item.quantity} ${item.unit}`, margin + 3, y + 4);

    const displayName = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    const truncatedName = displayName.length > 42 ? displayName.substring(0, 40) + '...' : displayName;
    doc.text(truncatedName, margin + 18, y + 4);

    doc.text(formatUSD(item.priceUSD), margin + 98, y + 4, { align: 'right' });
    doc.text(formatVES(item.priceVES), margin + 130, y + 4, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatUSD(item.subtotalUSD), margin + 155, y + 4, { align: 'right' });
    doc.text(formatVES(item.subtotalVES), pageWidth - margin - 3, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7.5;
  });

  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Payments & Summary Columns
  const splitBoxWidth = 100;
  const totalsBoxWidth = pageWidth - margin * 2 - splitBoxWidth - 4;

  // Left: Payment methods registered
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, splitBoxWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESGLOSE DE PAGO (SPLIT PAYMENTS)', margin + 4, y + 6);

  let payY = y + 12;
  const methodNameMap: Record<string, string> = {
    cash_usd: 'Efectivo Divisas ($)',
    cash_ves: 'Efectivo Bolívares (Bs)',
    pago_movil: 'Pago Móvil',
    punto_venta: 'Punto de Venta / Biopago',
    zelle: 'Zelle',
    binance_pay: 'Binance Pay',
    credito_fiado: 'Crédito / Fiado'
  };

  sale.payments.forEach(p => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const label = methodNameMap[p.method] || p.method;
    const refText = p.reference ? ` [Ref: ${p.reference}]` : '';
    doc.text(`• ${label}${refText}:`, margin + 4, payY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatUSD(p.amountUSD)} / ${formatVES(p.amountVES)}`, margin + splitBoxWidth - 4, payY, { align: 'right' });
    payY += 5.5;
  });

  if (sale.change && (sale.change.amountUSD > 0 || sale.change.amountVES > 0)) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(`Cambio / Vuelto:`, margin + 4, payY);
    doc.text(`${formatUSD(sale.change.amountUSD)} / ${formatVES(sale.change.amountVES)}`, margin + splitBoxWidth - 4, payY, { align: 'right' });
  }

  // Right: Grand Totals
  const rightX = margin + splitBoxWidth + 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightX, y, totalsBoxWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal USD:', rightX + 4, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatUSD(sale.subtotalUSD), pageWidth - margin - 4, y + 8, { align: 'right' });

  if (sale.discountUSD > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text('Descuento:', rightX + 4, y + 14);
    doc.text(`-${formatUSD(sale.discountUSD)}`, pageWidth - margin - 4, y + 14, { align: 'right' });
  }

  // Total USD Highlight
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(rightX + 2, y + 18, totalsBoxWidth - 4, 16, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL A PAGAR:', rightX + 6, y + 25);
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153);
  doc.text(formatUSD(sale.totalUSD), pageWidth - margin - 6, y + 25, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Equivalente BCV: ${formatVES(sale.totalVES)}`, rightX + 6, y + 31);

  y += 44;

  // Footer Note
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(profile.footerMessage, pageWidth / 2, y, { align: 'center' });
  doc.text(`Comprobante fiscal emitido por ${profile.commercialName || profile.name || 'la empresa'}`, pageWidth / 2, y + 4, { align: 'center' });

  return doc;
}

export function generateQuotePDF(quote: Quote, profile: BusinessProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  let y = 16;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

  const quoteCommerceName = getCleanCommerceName(profile);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(quoteCommerceName, margin + 6, y + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`RIF: ${profile?.rif || 'J-00000000-0'}`, margin + 6, y + 16);
  if (profile?.address || profile?.phone) {
    const locParts = [profile?.address, profile?.city, profile?.state].filter(Boolean).join(', ');
    const phonePart = profile?.phone ? ` | Tel: ${profile.phone}` : '';
    doc.text(`${locParts}${phonePart}`, margin + 6, y + 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`PRESUPUESTO / COTIZACIÓN`, pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFontSize(13);
  doc.setTextColor(96, 165, 250); // blue-400
  doc.text(quote.quoteNumber, pageWidth - margin - 6, y + 16, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Válido hasta: ${formatShortDate(quote.validUntil)}`, pageWidth - margin - 6, y + 22, { align: 'right' });

  y += 34;

  // Client Info
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${quote.customerName}`, margin + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.text(`RIF / C.I.: ${quote.customerDoc}   |   Teléfono: ${quote.customerPhone || 'N/A'}`, margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  const qRate = (quote.bcvRate && quote.bcvRate > 0) ? quote.bcvRate : 86.45;
  doc.text(`Tasa Referencial BCV: ${qRate.toFixed(2)} Bs/$`, pageWidth - margin - 6, y + 10, { align: 'right' });

  y += 26;

  // Table
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CANT', margin + 3, y + 5.5);
  doc.text('DESCRIPCIÓN', margin + 18, y + 5.5);
  doc.text('P. UNIT ($)', margin + 110, y + 5.5, { align: 'right' });
  doc.text('TOTAL ($)', margin + 145, y + 5.5, { align: 'right' });
  doc.text('TOTAL (BS)', pageWidth - margin - 3, y + 5.5, { align: 'right' });

  y += 9;

  quote.items.forEach((item, index) => {
    if (index % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, pageWidth - margin * 2, 7, 'F');
    }
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`${item.quantity} ${item.unit}`, margin + 3, y + 4);
    doc.text(item.productName.substring(0, 45), margin + 18, y + 4);
    doc.text(formatUSD(item.priceUSD), margin + 110, y + 4, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatUSD(item.subtotalUSD), margin + 145, y + 4, { align: 'right' });
    doc.text(formatVES(item.subtotalVES), pageWidth - margin - 3, y + 4, { align: 'right' });
    y += 7.5;
  });

  y += 6;

  // Grand Total box
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 90, y, 90, 22, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL COTIZADO ($):', pageWidth - margin - 85, y + 8);
  doc.setFontSize(12);
  doc.setTextColor(96, 165, 250);
  doc.text(formatUSD(quote.totalUSD), pageWidth - margin - 5, y + 8, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`En Bolívares (Bs): ${formatVES(quote.totalVES)}`, pageWidth - margin - 5, y + 16, { align: 'right' });

  y += 30;

  // Bank instructions for payment
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATOS PARA TRANSFERENCIA / PAGO MÓVIL', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`• Pago Móvil: ${profile.pagoMovilBank} | Tel: ${profile.pagoMovilPhone} | C.I/RIF: ${profile.pagoMovilId}`, margin + 4, y + 11);
  doc.text(`• Zelle: ${profile.zelleEmail} (${profile.zelleHolder})`, margin + 4, y + 16);
  doc.text(`• Binance Pay ID: ${profile.binancePayId}`, margin + 4, y + 21);

  return doc;
}

export function downloadSalePDF(sale: Sale, profile: BusinessProfile): void {
  const doc = generateInvoicePDF(sale, profile);
  doc.save(`${sale.invoiceNumber}_Factura.pdf`);
}

export function generateSaleTicketPDF(
  sale: Sale, 
  profile: BusinessProfile, 
  options: { width?: '58mm' | '80mm' } = { width: '80mm' }
): jsPDF {
  const is58 = options.width === '58mm';
  const rollWidth = is58 ? 58 : 80;
  const margin = 4;
  const printableWidth = rollWidth - margin * 2;

  // Altura dinámica según ítems y pagos
  const estimatedHeight = Math.max(
    130,
    30 +
    25 +
    18 +
    (sale.items.length * 10) +
    28 +
    (sale.payments.length * 5) +
    25 +
    15
  );

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [rollWidth, Math.ceil(estimatedHeight)]
  });

  let y = 6;
  const commerceName = getCleanCommerceName(profile);

  // 1. Encabezado limpio: solo el nombre del comercio
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(is58 ? 10 : 12);
  doc.setTextColor(15, 23, 42);
  doc.text(commerceName.toUpperCase(), rollWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`RIF: ${profile?.rif || 'J-00000000-0'}`, rollWidth / 2, y, { align: 'center' });
  y += 4;

  if (profile?.address) {
    const splitAddress = doc.splitTextToSize(profile.address, printableWidth);
    doc.text(splitAddress, rollWidth / 2, y, { align: 'center' });
    y += (splitAddress.length * 3.5);
  }
  if (profile?.phone) {
    doc.text(`Telf: ${profile.phone}`, rollWidth / 2, y, { align: 'center' });
    y += 4;
  }

  // Línea divisoria
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, rollWidth - margin, y);
  y += 4;

  // 2. Metadatos de la venta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('COMPROBANTE DE VENTA', rollWidth / 2, y, { align: 'center' });
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Factura: ${sale.invoiceNumber}`, margin, y);
  doc.text(`Control: ${sale.controlNumber}`, rollWidth - margin, y, { align: 'right' });
  y += 4;

  doc.text(`Fecha: ${formatShortDate(sale.date)}`, margin, y);
  doc.text(`Cajero: ${sale.cashierName}`, rollWidth - margin, y, { align: 'right' });
  y += 4;

  const saleRate = (sale.bcvRate && sale.bcvRate > 0) ? sale.bcvRate : 813.74;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(`Tasa Oficial BCV: ${saleRate.toFixed(2)} Bs/$`, rollWidth / 2, y, { align: 'center' });
  y += 4.5;

  // Línea divisoria
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, rollWidth - margin, y);
  y += 4;

  // 3. Datos del cliente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Cliente: ${sale.customerName}`, margin, y);
  y += 3.8;
  doc.text(`C.I./RIF: ${sale.customerDoc}`, margin, y);
  if (sale.customerPhone) {
    doc.text(`Telf: ${sale.customerPhone}`, rollWidth - margin, y, { align: 'right' });
  }
  y += 4.5;

  // Línea divisoria
  doc.line(margin, y, rollWidth - margin, y);
  y += 4;

  // 4. Encabezado de productos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('CANT / DESCRIPCIÓN', margin, y);
  doc.text('TOTAL', rollWidth - margin, y, { align: 'right' });
  y += 3.5;
  doc.line(margin, y, rollWidth - margin, y);
  y += 3.5;

  // 5. Filas de productos
  sale.items.forEach(item => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    
    const qtyText = `${item.quantity} ${item.unit}`;
    const displayName = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    const itemMaxLen = is58 ? 20 : 28;
    const truncated = displayName.length > itemMaxLen ? displayName.substring(0, itemMaxLen - 2) + '..' : displayName;
    
    doc.text(`${qtyText} ${truncated}`, margin, y);
    doc.text(formatUSD(item.subtotalUSD), rollWidth - margin, y, { align: 'right' });
    y += 3.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`P.U: ${formatUSD(item.priceUSD)} | ${formatVES(item.priceVES)}`, margin + 2, y);
    doc.text(formatVES(item.subtotalVES), rollWidth - margin, y, { align: 'right' });
    y += 4;
  });

  // Línea divisoria
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, rollWidth - margin, y);
  y += 4;

  // 6. Totales
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', margin, y);
  doc.text(formatUSD(sale.subtotalUSD), rollWidth - margin, y, { align: 'right' });
  y += 3.8;

  if (sale.discountUSD > 0) {
    doc.setTextColor(220, 38, 38);
    doc.text('Descuento:', margin, y);
    doc.text(`-${formatUSD(sale.discountUSD)}`, rollWidth - margin, y, { align: 'right' });
    y += 3.8;
  }

  // Caja de Total
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, printableWidth, 11, 1.5, 1.5, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL A PAGAR:', margin + 3, y + 4.8);
  doc.setFontSize(10.5);
  doc.setTextColor(52, 211, 153);
  doc.text(formatUSD(sale.totalUSD), rollWidth - margin - 3, y + 4.8, { align: 'right' });
  
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Equivalente: ${formatVES(sale.totalVES)}`, margin + 3, y + 9.2);
  y += 14;

  // 7. Desglose de pagos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('DESGLOSE DE PAGO:', margin, y);
  y += 3.5;

  const methodNameMap: Record<string, string> = {
    cash_usd: 'Efectivo $',
    cash_ves: 'Efectivo Bs',
    pago_movil: 'Pago Móvil',
    punto_venta: 'Punto de Venta',
    zelle: 'Zelle',
    binance_pay: 'Binance Pay',
    credito_fiado: 'Crédito / Fiado'
  };

  sale.payments.forEach(p => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    const label = methodNameMap[p.method] || p.method;
    const ref = p.reference ? ` (${p.reference})` : '';
    doc.text(`• ${label}${ref}:`, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatUSD(p.amountUSD)} / ${formatVES(p.amountVES)}`, rollWidth - margin, y, { align: 'right' });
    y += 3.5;
  });

  if (sale.change && (sale.change.amountUSD > 0 || sale.change.amountVES > 0)) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(220, 38, 38);
    doc.text('• Cambio / Vuelto:', margin, y);
    doc.text(`${formatUSD(sale.change.amountUSD)} / ${formatVES(sale.change.amountVES)}`, rollWidth - margin, y, { align: 'right' });
    y += 3.8;
  }

  y += 2;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, rollWidth - margin, y);
  y += 4;

  // 8. Mensaje de pie de página
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const footSplit = doc.splitTextToSize(profile.footerMessage || '¡Gracias por su compra!', printableWidth);
  doc.text(footSplit, rollWidth / 2, y, { align: 'center' });

  return doc;
}

export function downloadSaleTicketPDF(
  sale: Sale, 
  profile: BusinessProfile, 
  width: '58mm' | '80mm' = '80mm'
): void {
  const doc = generateSaleTicketPDF(sale, profile, { width });
  doc.save(`${sale.invoiceNumber}_Ticket.pdf`);
}

export function downloadQuotePDF(quote: Quote, profile: BusinessProfile): void {
  const doc = generateQuotePDF(quote, profile);
  doc.save(`${quote.quoteNumber}_Cotizacion.pdf`);
}

export function generateDailySalesReportPDF(
  dateStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = 14;

  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const totalUSD = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalVES = sales.reduce((sum, s) => sum + s.totalVES, 0);
  const totalItemsCount = sales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0);

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 3, 3, 'F');

  const reportCommerceName = getCleanCommerceName(profile);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(reportCommerceName, margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`RIF: ${profile?.rif || 'J-00000000-0'} | Tel: ${profile?.phone || ''}`, margin + 6, y + 15);
  if (profile?.address) {
    doc.text(profile.address, margin + 6, y + 21);
  }

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REPORTE DIARIO DE VENTAS', pageWidth - margin - 6, y + 8, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.text(`Fecha: ${dateStr}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Tasa BCV: ${safeRate.toFixed(2)} Bs/$`, pageWidth - margin - 6, y + 21, { align: 'right' });

  y += 31;

  // KPI Summary Cards
  const cardW = (pageWidth - margin * 2 - 9) / 4;
  const cards = [
    { title: 'TOTAL FACTURADO ($)', val: formatUSD(totalUSD), sub: formatVES(totalVES), color: [16, 185, 129] },
    { title: 'TRANSACCIONES', val: `${sales.length} facturas`, sub: `${totalItemsCount} productos`, color: [59, 130, 246] },
    { title: 'TICKET PROMEDIO', val: sales.length > 0 ? formatUSD(totalUSD / sales.length) : '$0.00', sub: 'Por cliente', color: [168, 85, 247] },
    { title: 'HORA DE EMISIÓN', val: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }), sub: 'Cierre del día', color: [245, 158, 11] }
  ];

  cards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cx + 3, y + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, cx + 3, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cx + 3, y + 17);
  });

  y += 25;

  // Payment Breakdown Section
  const paymentTotals: Record<string, { count: number; usd: number; ves: number }> = {};
  sales.forEach(s => {
    s.payments.forEach(p => {
      if (!paymentTotals[p.method]) {
        paymentTotals[p.method] = { count: 0, usd: 0, ves: 0 };
      }
      paymentTotals[p.method].count += 1;
      paymentTotals[p.method].usd += (p.amountUSD || 0);
      paymentTotals[p.method].ves += (p.amountVES || (p.amountUSD * safeRate));
    });
  });

  const methodNameLabels: Record<string, string> = {
    cash_usd: 'Efectivo USD ($)',
    cash_ves: 'Efectivo Bolívares (VES)',
    pago_movil: 'Pago Móvil Interbancario',
    punto_venta: 'Punto de Venta (Tarjeta Débito/Crédito)',
    zelle: 'Zelle (Transferencia Directa)',
    binance_pay: 'Binance Pay (Cripto / USDT)',
    credit: 'Crédito / Cuentas por Cobrar'
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('RESUMEN DE INGRESOS POR FORMAS DE PAGO', margin, y);
  y += 3;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.text('MÉTODO DE PAGO', margin + 3, y + 4.2);
  doc.text('OP.', margin + 75, y + 4.2, { align: 'center' });
  doc.text('TOTAL USD ($)', margin + 120, y + 4.2, { align: 'right' });
  doc.text('TOTAL BS (VES)', margin + 155, y + 4.2, { align: 'right' });
  doc.text('% DEL TOTAL', pageWidth - margin - 3, y + 4.2, { align: 'right' });
  y += 6.5;

  Object.entries(paymentTotals).forEach(([m, d], idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 0.5, pageWidth - margin * 2, 5.5, 'F');
    }
    const pct = totalUSD > 0 ? ((d.usd / totalUSD) * 100).toFixed(1) + '%' : '0%';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(methodNameLabels[m] || m, margin + 3, y + 3.5);
    doc.text(`${d.count}`, margin + 75, y + 3.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatUSD(d.usd), margin + 120, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(formatVES(d.ves), margin + 155, y + 3.5, { align: 'right' });
    doc.text(pct, pageWidth - margin - 3, y + 3.5, { align: 'right' });
    y += 5.5;
  });

  y += 5;

  // Transactions list
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('DETALLE DE FACTURAS Y TICKETS DEL DÍA', margin, y);
  y += 3;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.text('FACTURA', margin + 3, y + 4.2);
  doc.text('HORA', margin + 28, y + 4.2);
  doc.text('CLIENTE / RIF', margin + 45, y + 4.2);
  doc.text('PAGOS', margin + 115, y + 4.2);
  doc.text('TOTAL ($)', margin + 155, y + 4.2, { align: 'right' });
  doc.text('TOTAL (BS)', pageWidth - margin - 3, y + 4.2, { align: 'right' });
  y += 6.5;

  sales.forEach((s, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 14;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 0.5, pageWidth - margin * 2, 5.5, 'F');
    }
    const timeStr = new Date(s.date).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    const pMethods = s.payments.map(p => p.method).join(', ');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(s.invoiceNumber, margin + 3, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.text(timeStr, margin + 28, y + 3.5);
    doc.text(`${s.customerName.substring(0, 22)} (${s.customerDoc})`, margin + 45, y + 3.5);
    doc.text(pMethods.substring(0, 20), margin + 115, y + 3.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatUSD(s.totalUSD), margin + 155, y + 3.5, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.text(formatVES(s.totalVES), pageWidth - margin - 3, y + 3.5, { align: 'right' });
    y += 5.5;
  });

  return doc;
}

export function generateMonthlySalesReportPDF(
  monthStr: string,
  yearStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  let y = 14;

  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const totalUSD = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalVES = sales.reduce((sum, s) => sum + s.totalVES, 0);

  // Group by day
  const dailyTotals: Record<string, { count: number; usd: number; ves: number }> = {};
  sales.forEach(s => {
    const dayKey = s.date.slice(0, 10);
    if (!dailyTotals[dayKey]) {
      dailyTotals[dayKey] = { count: 0, usd: 0, ves: 0 };
    }
    dailyTotals[dayKey].count += 1;
    dailyTotals[dayKey].usd += s.totalUSD;
    dailyTotals[dayKey].ves += s.totalVES;
  });

  const activeDays = Object.keys(dailyTotals).length;
  const avgDailyUSD = activeDays > 0 ? totalUSD / activeDays : 0;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 3, 3, 'F');

  const monthlyCommerceName = getCleanCommerceName(profile);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(monthlyCommerceName, margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`RIF: ${profile?.rif || 'J-00000000-0'} | Tel: ${profile?.phone || ''}`, margin + 6, y + 15);
  if (profile?.address) {
    doc.text(profile.address, margin + 6, y + 21);
  }

  // Title Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REPORTE MENSUAL DE VENTAS', pageWidth - margin - 6, y + 8, { align: 'right' });
  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153);
  doc.text(`${monthStr.toUpperCase()} ${yearStr}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Tasa Ref. BCV: ${safeRate.toFixed(2)} Bs/$`, pageWidth - margin - 6, y + 21, { align: 'right' });

  y += 31;

  // Summary Metrics
  const cardW = (pageWidth - margin * 2 - 9) / 4;
  const cards = [
    { title: 'GRAN TOTAL ($)', val: formatUSD(totalUSD), sub: formatVES(totalVES), color: [16, 185, 129] },
    { title: 'FACTURAS EMITIDAS', val: `${sales.length} docs`, sub: `${activeDays} días operados`, color: [59, 130, 246] },
    { title: 'PROMEDIO POR DÍA', val: formatUSD(avgDailyUSD), sub: 'Venta diaria promedio', color: [168, 85, 247] },
    { title: 'TICKET PROMEDIO', val: sales.length > 0 ? formatUSD(totalUSD / sales.length) : '$0.00', sub: 'Por factura', color: [245, 158, 11] }
  ];

  cards.forEach((c, idx) => {
    const cx = margin + idx * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cx, y, cardW, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.title, cx + 3, y + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(c.color[0], c.color[1], c.color[2]);
    doc.text(c.val, cx + 3, y + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cx + 3, y + 17);
  });

  y += 26;

  // Daily Breakdown Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSOLIDADO DÍA POR DÍA DEL MES', margin, y);
  y += 3;

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(7.5);
  doc.text('FECHA', margin + 3, y + 4.2);
  doc.text('FACTURAS', margin + 45, y + 4.2, { align: 'center' });
  doc.text('TOTAL FACTURADO ($)', margin + 110, y + 4.2, { align: 'right' });
  doc.text('TOTAL FACTURADO (BS)', margin + 155, y + 4.2, { align: 'right' });
  doc.text('% DEL MES', pageWidth - margin - 3, y + 4.2, { align: 'right' });
  y += 6.5;

  const sortedDays = Object.keys(dailyTotals).sort();
  sortedDays.forEach((day, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 14;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 0.5, pageWidth - margin * 2, 5.5, 'F');
    }
    const d = dailyTotals[day];
    const pct = totalUSD > 0 ? ((d.usd / totalUSD) * 100).toFixed(1) + '%' : '0%';

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(day, margin + 3, y + 3.5);
    doc.text(`${d.count}`, margin + 45, y + 3.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(formatUSD(d.usd), margin + 110, y + 3.5, { align: 'right' });
    doc.setTextColor(71, 85, 105);
    doc.text(formatVES(d.ves), margin + 155, y + 3.5, { align: 'right' });
    doc.text(pct, pageWidth - margin - 3, y + 3.5, { align: 'right' });
    y += 5.5;
  });

  return doc;
}

export function downloadDailySalesReportPDF(
  dateStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number
): void {
  const doc = generateDailySalesReportPDF(dateStr, sales, profile, bcvRate);
  doc.save(`Reporte_Ventas_Diario_${dateStr}.pdf`);
}

export function downloadMonthlySalesReportPDF(
  monthStr: string,
  yearStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number
): void {
  const doc = generateMonthlySalesReportPDF(monthStr, yearStr, sales, profile, bcvRate);
  doc.save(`Reporte_Ventas_Mensual_${monthStr}_${yearStr}.pdf`);
}

