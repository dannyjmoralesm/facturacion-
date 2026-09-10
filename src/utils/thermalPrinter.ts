import { Sale, Quote, BusinessProfile, DebtPaymentInstallment, DebtAccount } from '../types';
import { formatUSD, formatVES, formatShortDate } from './bcvService';

export interface ThermalOptions {
  width: '58mm' | '80mm';
  cutPaper?: boolean;
  openDrawer?: boolean;
}

export function generateSaleTicketText(
  sale: Sale,
  profile: BusinessProfile,
  options: ThermalOptions = { width: '80mm' }
): string {
  const is58 = options.width === '58mm';
  const width = is58 ? 32 : 44;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);

  const center = (text: string) => {
    if (text.length >= width) return text.substring(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  const justify = (left: string, right: string) => {
    const spaceCount = width - (left.length + right.length);
    if (spaceCount < 1) {
      return left.substring(0, width - right.length - 1) + ' ' + right;
    }
    return left + ' '.repeat(spaceCount) + right;
  };

  const lines: string[] = [];

  // Header
  lines.push(center((profile?.commercialName || profile?.name || 'COMPROBANTE FISCAL').toUpperCase()));
  if (profile?.name) lines.push(center(profile.name));
  lines.push(center(`RIF: ${profile?.rif || 'J-00000000-0'}`));
  if (profile?.address) lines.push(center(profile.address));
  if (profile?.phone) lines.push(center(`TELF: ${profile.phone}`));
  lines.push(line);

  // Document Info
  lines.push(justify('COMPROBANTE DE VENTA', sale.invoiceNumber));
  lines.push(justify('NRO. CONTROL:', sale.controlNumber));
  lines.push(justify('FECHA:', formatShortDate(sale.date)));
  lines.push(justify('CAJERO:', sale.cashierName));
  lines.push(dash);

  // Customer
  lines.push(`CLIENTE: ${sale.customerName}`);
  lines.push(`DOC/RIF: ${sale.customerDoc}`);
  if (sale.customerPhone) {
    lines.push(`TELF:    ${sale.customerPhone}`);
  }
  lines.push(dash);

  // Rate Notice
  const rateVal = (sale.bcvRate && sale.bcvRate > 0) ? sale.bcvRate : 86.45;
  lines.push(justify('TASA OFICIAL BCV:', `${rateVal.toFixed(2)} Bs/$`));
  lines.push(dash);

  // Items Header
  if (is58) {
    lines.push(justify('CANT x DESCRIP', 'TOTAL ($)'));
  } else {
    lines.push(justify('CANT  DESCRIPCIÓN', 'P.UNIT      TOTAL'));
  }
  lines.push(dash);

  // Items
  sale.items.forEach(item => {
    const name = item.variantName ? `${item.productName} (${item.variantName})` : item.productName;
    const subUsdStr = formatUSD(item.subtotalUSD);
    const subVesStr = formatVES(item.subtotalVES);

    if (is58) {
      lines.push(`${item.quantity} ${item.unit} x ${name.substring(0, 20)}`);
      lines.push(justify(` @ ${formatUSD(item.priceUSD)}`, `${subUsdStr}`));
    } else {
      const leftCol = `${item.quantity} ${item.unit} ${name}`.substring(0, 24);
      const rightCol = `${formatUSD(item.priceUSD)}  ${subUsdStr}`;
      lines.push(justify(leftCol, rightCol));
      lines.push(justify(`   ↳ Equiv: ${subVesStr}`, ''));
    }
  });

  lines.push(dash);

  // Totals
  if (sale.discountUSD > 0) {
    lines.push(justify('SUBTOTAL USD ($):', formatUSD(sale.subtotalUSD)));
    lines.push(justify('DESCUENTO APLICADO:', `-${formatUSD(sale.discountUSD)}`));
    lines.push(dash);
  }

  lines.push(justify('TOTAL USD ($):', formatUSD(sale.totalUSD)));
  lines.push(justify('TOTAL BS. (VES):', formatVES(sale.totalVES)));
  lines.push(dash);

  // Payments Breakdown
  lines.push(center('-- FORMAS DE PAGO --'));
  sale.payments.forEach(p => {
    const methodNameMap: Record<string, string> = {
      cash_usd: 'Efectivo Divisas ($)',
      cash_ves: 'Efectivo Bolívares (Bs)',
      pago_movil: 'Pago Móvil',
      punto_venta: 'Punto de Venta / Tarjeta',
      zelle: 'Zelle',
      binance_pay: 'Binance Pay USDT',
      credito_fiado: 'Crédito / Fiado'
    };
    const title = methodNameMap[p.method] || p.method;
    lines.push(justify(title, `${formatUSD(p.amountUSD)} (${formatVES(p.amountVES)})`));
    if (p.reference) {
      lines.push(`   Ref: ${p.reference} ${p.bank ? `(${p.bank})` : ''}`);
    }
  });

  // Change
  if (sale.change && (sale.change.amountUSD > 0 || sale.change.amountVES > 0)) {
    lines.push(dash);
    const changeMethodText = sale.change.method === 'pago_movil' 
      ? 'Vuelto Pago Móvil' 
      : sale.change.method === 'cash_usd' 
      ? 'Vuelto en Divisa $' 
      : 'Vuelto en Bs.';
    lines.push(justify(`CAMBIO (${changeMethodText}):`, `${formatUSD(sale.change.amountUSD)} / ${formatVES(sale.change.amountVES)}`));
    if (sale.change.reference) {
      lines.push(`   Ref Vuelto: ${sale.change.reference}`);
    }
  }

  // Footer
  lines.push(line);
  if (profile.footerMessage) {
    lines.push(center(profile.footerMessage));
  }

  return lines.join('\n');
}

/**
 * Generates raw ESC/POS command Uint8Array buffer
 * for Bluetooth / Network Thermal Printers
 */
export function generateEscPosBuffer(ticketText: string, cut: boolean = true): Uint8Array {
  const encoder = new TextEncoder();
  const initCmd = new Uint8Array([0x1B, 0x40]); // ESC @ (Initialize printer)
  const codePageCmd = new Uint8Array([0x1B, 0x74, 0x00]); // ESC t 0 (PC437 or standard charset)
  const lineSpacing = new Uint8Array([0x1B, 0x32]); // ESC 2 (Default line spacing)
  const textBytes = encoder.encode(ticketText + '\n\n\n\n');
  const cutCmd = cut ? new Uint8Array([0x1D, 0x56, 0x41, 0x00]) : new Uint8Array([]); // GS V A 0 (Cut paper)

  const totalLength = initCmd.length + codePageCmd.length + lineSpacing.length + textBytes.length + cutCmd.length;
  const merged = new Uint8Array(totalLength);

  let offset = 0;
  merged.set(initCmd, offset); offset += initCmd.length;
  merged.set(codePageCmd, offset); offset += codePageCmd.length;
  merged.set(lineSpacing, offset); offset += lineSpacing.length;
  merged.set(textBytes, offset); offset += textBytes.length;
  merged.set(cutCmd, offset); offset += cutCmd.length;

  return merged;
}

/**
 * Direct Web Bluetooth connection for portable thermal printers
 */
export async function printViaBluetooth(ticketText: string): Promise<{ success: boolean; message: string }> {
  // Check if Web Bluetooth API is available in browser
  const nav = navigator as unknown as { bluetooth?: { requestDevice: (opt: unknown) => Promise<unknown> } };
  if (!nav.bluetooth) {
    return {
      success: false,
      message: 'Web Bluetooth no está soportado en este navegador. Utiliza la impresión estándar o copia el texto ESC/POS.'
    };
  }

  try {
    const rawBuffer = generateEscPosBuffer(ticketText, true);
    // Request thermal printer device
    // Standard Bluetooth Serial Port Profile (SPP) / Printer Service UUIDs
    const device: any = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb',
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    if (!device.gatt) {
      throw new Error('Dispositivo sin soporte GATT');
    }

    const server = await device.gatt.connect();
    // Attempt to write to available writable characteristics
    const services = await server.getPrimaryServices();
    let wrote = false;

    for (const service of services) {
      const chars = await service.getCharacteristics();
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          // Send in chunks of 512 bytes
          const chunkSize = 512;
          for (let i = 0; i < rawBuffer.length; i += chunkSize) {
            const slice = rawBuffer.slice(i, i + chunkSize);
            if (char.properties.write) {
              await char.writeValueWithResponse(slice);
            } else {
              await char.writeValueWithoutResponse(slice);
            }
          }
          wrote = true;
          break;
        }
      }
      if (wrote) break;
    }

    if (wrote) {
      return { success: true, message: 'Ticket impreso con éxito en impresora Bluetooth' };
    } else {
      return { success: false, message: 'Dispositivo conectado pero no se encontró canal de escritura de impresión.' };
    }
  } catch (err: any) {
    console.error('Bluetooth thermal print error:', err);
    return { success: false, message: err?.message || 'Cancelado o error de conexión Bluetooth' };
  }
}

export function generateQuoteTicketText(
  quote: Quote,
  profile: BusinessProfile,
  options: ThermalOptions = { width: '80mm' }
): string {
  const width = options.width === '58mm' ? 32 : 44;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);

  const center = (text: string) => {
    if (text.length >= width) return text.substring(0, width);
    const leftPad = Math.floor((width - text.length) / 2);
    return ' '.repeat(leftPad) + text;
  };

  const justify = (left: string, right: string) => {
    const spaceCount = width - (left.length + right.length);
    if (spaceCount < 1) return left.substring(0, width - right.length - 1) + ' ' + right;
    return left + ' '.repeat(spaceCount) + right;
  };

  const lines: string[] = [];
  lines.push(center((profile?.commercialName || profile?.name || 'COTIZACIÓN').toUpperCase()));
  lines.push(center(`RIF: ${profile?.rif || 'J-00000000-0'}`));
  if (profile?.phone) lines.push(center(`TELF: ${profile.phone}`));
  lines.push(line);
  lines.push(justify('PRESUPUESTO / COTIZACIÓN', quote.quoteNumber));
  lines.push(justify('FECHA EMISIÓN:', formatShortDate(quote.date)));
  lines.push(justify('VÁLIDO HASTA:', formatShortDate(quote.validUntil)));
  lines.push(dash);
  lines.push(`CLIENTE: ${quote.customerName}`);
  lines.push(`DOC:     ${quote.customerDoc}`);
  if (quote.customerPhone) lines.push(`TELF:    ${quote.customerPhone}`);
  lines.push(dash);
  const qRate = (quote.bcvRate && quote.bcvRate > 0) ? quote.bcvRate : 86.45;
  lines.push(justify('TASA REFERENCIAL BCV:', `${qRate.toFixed(2)} Bs/$`));
  lines.push(dash);

  quote.items.forEach(item => {
    lines.push(`${item.quantity} ${item.unit} x ${item.productName}`);
    lines.push(justify(` @ ${formatUSD(item.priceUSD)}`, formatUSD(item.subtotalUSD)));
    lines.push(justify(`   ↳ ${formatVES(item.subtotalVES)}`, ''));
  });

  lines.push(dash);
  lines.push(justify('TOTAL PRESUPUESTO ($):', formatUSD(quote.totalUSD)));
  lines.push(justify('TOTAL EN BOLÍVARES (Bs):', formatVES(quote.totalVES)));
  lines.push(line);
  lines.push(center('Precios en Bs. sujetos a variación según tasa BCV'));
  lines.push(center('¡Gracias por preferirnos!'));

  return lines.join('\n');
}

export function generateDebtPaymentReceiptText(
  debt: DebtAccount,
  installment: DebtPaymentInstallment,
  profile: BusinessProfile,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const width = paperWidth === '58mm' ? 32 : 44;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (t: string) => {
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const justify = (l: string, r: string) => {
    const sp = Math.max(1, width - (l.length + r.length));
    return l + ' '.repeat(sp) + r;
  };

  const lines: string[] = [];
  lines.push(center(profile.commercialName.toUpperCase()));
  lines.push(center(`RIF: ${profile.rif}`));
  lines.push(line);
  lines.push(center('RECIBO DE ABONO / PAGO DE CUENTA'));
  lines.push(justify('FACTURA ORIGEN:', debt.invoiceNumber));
  lines.push(justify('FECHA ABONO:', formatShortDate(installment.date)));
  lines.push(justify('CLIENTE:', debt.customerName));
  lines.push(justify('CÉDULA/RIF:', debt.customerDoc));
  lines.push(dash);
  const instRate = (installment.rateApplied && installment.rateApplied > 0) ? installment.rateApplied : 86.45;
  lines.push(justify('MONTO ABONADO ($):', formatUSD(installment.amountUSD)));
  lines.push(justify('MONTO EN BS:', formatVES(installment.amountVES)));
  lines.push(justify('TASA BCV APLICADA:', `${instRate.toFixed(2)} Bs/$`));
  lines.push(justify('MÉTODO:', installment.method.toUpperCase()));
  if (installment.reference) {
    lines.push(justify('REFERENCIA:', installment.reference));
  }
  lines.push(dash);
  lines.push(justify('DEUDA ORIGINAL:', formatUSD(debt.originalDebtUSD)));
  lines.push(justify('TOTAL ABONADO:', formatUSD(debt.paidDebtUSD)));
  lines.push(justify('SALDO RESTANTE ($):', formatUSD(debt.remainingDebtUSD)));
  lines.push(justify('SALDO RESTANTE (Bs):', formatVES((debt.remainingDebtUSD || 0) * instRate)));
  lines.push(line);
  lines.push(center('Comprobante de cobro emitido'));
  return lines.join('\n');
}

export function generateSupplierPaymentReceiptText(
  debt: any,
  installment: any,
  profile: BusinessProfile,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const width = paperWidth === '58mm' ? 32 : 48;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (t: string) => {
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const justify = (l: string, r: string) => {
    const sp = Math.max(1, width - (l.length + r.length));
    return l + ' '.repeat(sp) + r;
  };

  const lines: string[] = [];
  lines.push(center((profile.commercialName || profile.name).toUpperCase()));
  lines.push(center(`RIF: ${profile.rif}`));
  lines.push(line);
  lines.push(center('COMPROBANTE DE PAGO A PROVEEDOR'));
  lines.push(justify('DOC. PROVEEDOR:', debt.invoiceNumber));
  lines.push(justify('FECHA PAGO:', formatShortDate(installment.date)));
  lines.push(justify('PROVEEDOR:', debt.supplierName));
  lines.push(justify('RIF PROVEEDOR:', debt.supplierRif));
  lines.push(dash);
  const instRate = (installment.rateApplied && installment.rateApplied > 0) ? installment.rateApplied : 86.45;
  lines.push(justify('MONTO PAGADO ($):', formatUSD(installment.amountUSD)));
  lines.push(justify('MONTO EN BS:', formatVES(installment.amountVES)));
  lines.push(justify('TASA BCV APLICADA:', `${instRate.toFixed(2)} Bs/$`));
  lines.push(justify('FORMA DE PAGO:', (installment.method || '').toUpperCase()));
  if (installment.reference) {
    lines.push(justify('NRO. REFERENCIA:', installment.reference));
  }
  if (installment.affectsCashShift) {
    lines.push(justify('ORIGEN FONDOS:', 'Caja Chica (Turno Activo)'));
  }
  lines.push(dash);
  lines.push(justify('TOTAL FACTURA ($):', formatUSD(debt.originalDebtUSD)));
  lines.push(justify('TOTAL ABONADO ($):', formatUSD(debt.paidDebtUSD)));
  lines.push(justify('SALDO PENDIENTE ($):', formatUSD(debt.remainingDebtUSD)));
  lines.push(justify('SALDO EN BS:', formatVES((debt.remainingDebtUSD || 0) * instRate)));
  lines.push(line);
  lines.push(center('Egreso verificado y registrado'));
  return lines.join('\n');
}

export function generateExpenseReceiptText(
  expense: any,
  profile: BusinessProfile,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const width = paperWidth === '58mm' ? 32 : 48;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (t: string) => {
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const justify = (l: string, r: string) => {
    const sp = Math.max(1, width - (l.length + r.length));
    return l + ' '.repeat(sp) + r;
  };

  const lines: string[] = [];
  lines.push(center((profile.commercialName || profile.name).toUpperCase()));
  lines.push(center(`RIF: ${profile.rif}`));
  lines.push(line);
  lines.push(center('VALE / COMPROBANTE DE EGRESO'));
  lines.push(justify('FECHA Y HORA:', formatShortDate(expense.date)));
  lines.push(justify('CATEGORÍA:', (expense.category || '').toUpperCase()));
  if (expense.beneficiary) {
    lines.push(justify('BENEFICIARIO:', expense.beneficiary));
  }
  lines.push(dash);
  lines.push(`CONCEPTO: ${expense.description}`);
  lines.push(dash);
  lines.push(justify('MONTO TOTAL ($):', formatUSD(expense.amountUSD)));
  lines.push(justify('MONTO EN BS:', formatVES(expense.amountVES)));
  const expRate = (expense.bcvRate && expense.bcvRate > 0) ? expense.bcvRate : 86.45;
  lines.push(justify('TASA BCV:', `${expRate.toFixed(2)} Bs/$`));
  lines.push(justify('MÉTODO DE PAGO:', (expense.paymentMethod || '').toUpperCase()));
  if (expense.reference) {
    lines.push(justify('NRO. REFERENCIA:', expense.reference));
  }
  if (expense.receiptNumber) {
    lines.push(justify('NRO. COMPROBANTE:', expense.receiptNumber));
  }
  if (expense.affectsCashShift) {
    lines.push(justify('DESCONTADO DE CAJA:', 'SÍ (Caja Chica Activa)'));
  }
  lines.push(line);
  lines.push(center('Firma Autorizada: ___________________'));
  return lines.join('\n');
}

export function generateDailySalesReportTicketText(
  dateStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const width = paperWidth === '58mm' ? 32 : 44;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (t: string) => {
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const justify = (l: string, r: string) => {
    const sp = Math.max(1, width - (l.length + r.length));
    return l + ' '.repeat(sp) + r;
  };

  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const totalUSD = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalVES = sales.reduce((sum, s) => sum + s.totalVES, 0);
  const totalItemsCount = sales.reduce((sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0), 0);

  // Payments breakdown
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
    cash_ves: 'Efectivo Bs (VES)',
    pago_movil: 'Pago Móvil',
    punto_venta: 'Punto de Venta',
    zelle: 'Zelle ($)',
    binance_pay: 'Binance Pay (USDT)',
    credit: 'Crédito / Fiado'
  };

  const lines: string[] = [];
  lines.push(center((profile.commercialName || profile.name || 'REPORTE DE VENTAS').toUpperCase()));
  if (profile.name) lines.push(center(profile.name));
  lines.push(center(`RIF: ${profile.rif || 'J-00000000-0'}`));
  lines.push(line);
  lines.push(center('REPORTE DIARIO DE VENTAS'));
  lines.push(center(`CIERRE DEL DÍA: ${dateStr}`));
  lines.push(justify('EMISIÓN:', new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })));
  lines.push(justify('TASA OFICIAL BCV:', `${safeRate.toFixed(2)} Bs/$`));
  lines.push(dash);

  // Totals
  lines.push(justify('TRANSACCIONES / FACTURAS:', `${sales.length}`));
  lines.push(justify('TOTAL PRODUCTOS VENDIDOS:', `${totalItemsCount}`));
  lines.push(justify('TICKET PROMEDIO ($):', sales.length > 0 ? formatUSD(totalUSD / sales.length) : '$0.00'));
  lines.push(dash);
  lines.push(justify('GRAN TOTAL USD ($):', formatUSD(totalUSD)));
  lines.push(justify('GRAN TOTAL BS (VES):', formatVES(totalVES)));
  lines.push(line);

  // Payments breakdown
  lines.push(center('-- DESGLOSE POR FORMA DE PAGO --'));
  Object.entries(paymentTotals).forEach(([method, data]) => {
    const label = methodNameLabels[method] || method.toUpperCase();
    lines.push(justify(`${label} (${data.count}):`, formatUSD(data.usd)));
    lines.push(justify('   ↳ Equiv en Bs:', formatVES(data.ves)));
  });
  lines.push(dash);

  // Top products of the day
  const productMap: Record<string, { name: string; qty: number; totalUSD: number }> = {};
  sales.forEach(s => {
    s.items.forEach(i => {
      const key = i.productId || i.productName;
      if (!productMap[key]) {
        productMap[key] = { name: i.productName, qty: 0, totalUSD: 0 };
      }
      productMap[key].qty += i.quantity;
      productMap[key].totalUSD += i.subtotalUSD;
    });
  });

  const topProducts = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);
  if (topProducts.length > 0) {
    lines.push(center('-- TOP 5 PRODUCTOS MÁS VENDIDOS --'));
    topProducts.forEach((p, idx) => {
      const pName = p.name.length > 20 ? p.name.substring(0, 20) + '.' : p.name;
      lines.push(justify(`${idx + 1}. ${pName}`, `${p.qty} un | ${formatUSD(p.totalUSD)}`));
    });
    lines.push(dash);
  }

  lines.push(center('Reporte de Auditoría Generado'));
  lines.push(center(`Impreso: ${new Date().toLocaleString('es-VE')}`));

  return lines.join('\n');
}

export function generateMonthlySalesReportTicketText(
  monthStr: string,
  yearStr: string,
  sales: Sale[],
  profile: BusinessProfile,
  bcvRate: number,
  paperWidth: '58mm' | '80mm' = '80mm'
): string {
  const width = paperWidth === '58mm' ? 32 : 44;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (t: string) => {
    const pad = Math.max(0, Math.floor((width - t.length) / 2));
    return ' '.repeat(pad) + t;
  };
  const justify = (l: string, r: string) => {
    const sp = Math.max(1, width - (l.length + r.length));
    return l + ' '.repeat(sp) + r;
  };

  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const totalUSD = sales.reduce((sum, s) => sum + s.totalUSD, 0);
  const totalVES = sales.reduce((sum, s) => sum + s.totalVES, 0);

  // Daily grouping
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

  const lines: string[] = [];
  lines.push(center((profile.commercialName || profile.name || 'REPORTE MENSUAL').toUpperCase()));
  if (profile.name) lines.push(center(profile.name));
  lines.push(center(`RIF: ${profile.rif || 'J-00000000-0'}`));
  lines.push(line);
  lines.push(center('REPORTE MENSUAL DE VENTAS'));
  lines.push(center(`PERÍODO: ${monthStr.toUpperCase()} ${yearStr}`));
  lines.push(justify('TASA BCV REFERENCIAL:', `${safeRate.toFixed(2)} Bs/$`));
  lines.push(dash);

  // General Totals
  lines.push(justify('TOTAL FACTURAS EMITIDAS:', `${sales.length}`));
  lines.push(justify('DÍAS CON ACTIVIDAD:', `${activeDays}`));
  lines.push(justify('PROMEDIO DIARIO ($):', formatUSD(avgDailyUSD)));
  lines.push(dash);
  lines.push(justify('TOTAL FACTURADO USD ($):', formatUSD(totalUSD)));
  lines.push(justify('TOTAL FACTURADO BS (VES):', formatVES(totalVES)));
  lines.push(line);

  // Daily breakdown
  lines.push(center('-- CONSOLIDADO DIARIO --'));
  const sortedDays = Object.keys(dailyTotals).sort();
  sortedDays.forEach(day => {
    const data = dailyTotals[day];
    const shortDay = day.slice(8, 10) + '/' + day.slice(5, 7);
    lines.push(justify(`Día ${shortDay} (${data.count} vts):`, formatUSD(data.usd)));
  });
  lines.push(dash);

  lines.push(center('Consolidado Fiscal Emitido'));
  lines.push(center(`Fecha Impresión: ${new Date().toLocaleString('es-VE')}`));

  return lines.join('\n');
}


