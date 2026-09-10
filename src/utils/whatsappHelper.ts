import { Sale, Quote, DebtAccount, DebtPaymentInstallment, BusinessProfile, Product } from '../types';
import { formatUSD, formatVES, formatShortDate } from './bcvService';

export function createWhatsAppSaleMessage(sale: Sale, profile: BusinessProfile): string {
  const lines: string[] = [];

  lines.push(`🧾 *${(profile?.commercialName || profile?.name || 'COMPROBANTE DE COMPRA').toUpperCase()}*`);
  if (profile?.rif) lines.push(`🏢 RIF: ${profile.rif}`);
  if (profile?.address) lines.push(`📍 ${profile.address}`);
  lines.push(`--------------------------------`);
  lines.push(`📄 *Comprobante:* ${sale.invoiceNumber}`);
  lines.push(`🔢 *Nro. Control:* ${sale.controlNumber}`);
  lines.push(`📅 *Fecha:* ${formatShortDate(sale.date)}`);
  lines.push(`👤 *Cliente:* ${sale.customerName} (${sale.customerDoc})`);
  const saleRate = (sale.bcvRate && sale.bcvRate > 0) ? sale.bcvRate : 86.45;
  lines.push(`💵 *Tasa BCV:* ${saleRate.toFixed(2)} Bs/$`);
  lines.push(`--------------------------------`);
  lines.push(`🛒 *DETALLE DE COMPRA:*`);

  sale.items.forEach(item => {
    const vText = item.variantName ? ` (${item.variantName})` : '';
    lines.push(`▫️ ${item.quantity} ${item.unit} x ${item.productName}${vText}`);
    lines.push(`   ↳ ${formatUSD(item.subtotalUSD)} / ${formatVES(item.subtotalVES)}`);
  });

  lines.push(`--------------------------------`);
  if (sale.discountUSD > 0) {
    lines.push(`📦 *Subtotal USD:* ${formatUSD(sale.subtotalUSD)}`);
    lines.push(`🏷️ *Descuento Aplicado:* -${formatUSD(sale.discountUSD)} (-${formatVES(sale.discountUSD * saleRate)})`);
    lines.push(`--------------------------------`);
  }
  lines.push(`💰 *TOTAL USD:* ${formatUSD(sale.totalUSD)}`);
  lines.push(`🇻🇪 *TOTAL BOLÍVARES:* ${formatVES(sale.totalVES)}`);
  lines.push(`--------------------------------`);
  lines.push(`💳 *FORMA DE PAGO:*`);

  const methodMap: Record<string, string> = {
    cash_usd: 'Efectivo Divisas ($)',
    cash_ves: 'Efectivo Bolívares (Bs)',
    pago_movil: 'Pago Móvil',
    punto_venta: 'Punto de Venta / Biopago',
    zelle: 'Zelle',
    binance_pay: 'Binance Pay',
    credito_fiado: 'Crédito / Fiado'
  };

  sale.payments.forEach(p => {
    const ref = p.reference ? ` [Ref: ${p.reference}]` : '';
    lines.push(`• ${methodMap[p.method] || p.method}: ${formatUSD(p.amountUSD)} (${formatVES(p.amountVES)})${ref}`);
  });

  if (sale.change && (sale.change.amountUSD > 0 || sale.change.amountVES > 0)) {
    lines.push(`🔄 *Cambio Entregado:* ${formatUSD(sale.change.amountUSD)} / ${formatVES(sale.change.amountVES)}`);
  }

  lines.push(`--------------------------------`);
  if (profile.footerMessage) {
    lines.push(`✨ _${profile.footerMessage}_`);
  }

  return lines.join('\n');
}

export function createWhatsAppQuoteMessage(quote: Quote, profile: BusinessProfile): string {
  const lines: string[] = [];

  lines.push(`📋 *COTIZACIÓN / PRESUPUESTO*`);
  lines.push(`🏢 *${profile?.commercialName || profile?.name || 'EMPRESA'}* (RIF: ${profile?.rif || 'J-00000000-0'})`);
  lines.push(`--------------------------------`);
  lines.push(`🔖 *Presupuesto:* ${quote.quoteNumber}`);
  lines.push(`📅 *Fecha:* ${formatShortDate(quote.date)}`);
  lines.push(`⏳ *Válido hasta:* ${formatShortDate(quote.validUntil)}`);
  lines.push(`👤 *Para:* ${quote.customerName}`);
  const qRate = (quote.bcvRate && quote.bcvRate > 0) ? quote.bcvRate : 86.45;
  lines.push(`💵 *Tasa Referencial BCV:* ${qRate.toFixed(2)} Bs/$`);
  lines.push(`--------------------------------`);
  lines.push(`📦 *ÍTEMS PRESUPUESTADOS:*`);

  quote.items.forEach(item => {
    lines.push(`▫️ ${item.quantity} ${item.unit} x ${item.productName}`);
    lines.push(`   ↳ ${formatUSD(item.priceUSD)} c/u | Total: ${formatUSD(item.subtotalUSD)} (${formatVES(item.subtotalVES)})`);
  });

  lines.push(`--------------------------------`);
  lines.push(`💎 *TOTAL ESTIMADO ($):* ${formatUSD(quote.totalUSD)}`);
  lines.push(`🇻🇪 *TOTAL EN BOLÍVARES:* ${formatVES(quote.totalVES)}`);
  lines.push(`--------------------------------`);
  lines.push(`📲 *Datos para concretar tu pedido:*`);
  lines.push(`• Pago Móvil: ${profile?.pagoMovilBank || ''} | Tel: ${profile?.pagoMovilPhone || ''} | RIF: ${profile?.pagoMovilId || ''}`);
  lines.push(`• Zelle: ${profile?.zelleEmail || ''}`);
  lines.push(`--------------------------------`);
  lines.push(`¡Quedamos a tu entera disposición para procesar tu orden!`);

  return lines.join('\n');
}

export function createWhatsAppDebtReminder(debt: DebtAccount, currentRate: number, profile: BusinessProfile): string {
  const safeRate = (currentRate && currentRate > 0) ? currentRate : 86.45;
  const currentVES = (debt.remainingDebtUSD || 0) * safeRate;
  const lines: string[] = [];

  lines.push(`🔔 *ESTADO DE CUENTA / RECORDATORIO DE PAGO*`);
  lines.push(`🏢 *${(profile?.commercialName || profile?.name || 'EMPRESA').toUpperCase()}*`);
  if (profile?.rif) lines.push(`📑 RIF: ${profile.rif}`);
  lines.push(`--------------------------------`);
  lines.push(`Estimado(a) *${debt.customerName}*,`);
  lines.push(`Le recordamos que mantiene un saldo pendiente por el documento *#${debt.invoiceNumber}*.`);
  lines.push(`--------------------------------`);
  lines.push(`💵 *Saldo Pendiente ($):* ${formatUSD(debt.remainingDebtUSD)}`);
  lines.push(`🇻🇪 *Equivalente en Bs.:* ${formatVES(currentVES)}`);
  lines.push(`📊 *Tasa BCV Oficial:* ${safeRate.toFixed(2)} Bs/$`);
  if (debt.dueDate) {
    lines.push(`📅 *Fecha de Vencimiento:* ${formatShortDate(debt.dueDate)}`);
  }
  lines.push(`--------------------------------`);
  lines.push(`💳 *INSTRUCCIONES DE PAGO:*`);
  
  if (profile?.pagoMovilPhone || profile?.pagoMovilId) {
    lines.push(`📲 *Pago Móvil:*`);
    if (profile.pagoMovilBank) lines.push(`   • Banco: ${profile.pagoMovilBank}`);
    if (profile.pagoMovilPhone) lines.push(`   • Teléfono: ${profile.pagoMovilPhone}`);
    if (profile.pagoMovilId) lines.push(`   • C.I. / RIF: ${profile.pagoMovilId}`);
  }
  
  if (profile?.zelleEmail) {
    lines.push(`⚡ *Zelle:*`);
    lines.push(`   • Correo: ${profile.zelleEmail}`);
    if (profile.zelleHolder) lines.push(`   • Titular: ${profile.zelleHolder}`);
  }

  if (profile?.binancePayId) {
    lines.push(`🪙 *Binance Pay ID:* ${profile.binancePayId}`);
  }

  lines.push(`💵 *Efectivo ($ / Bs) o Punto:* En tienda / caja`);
  lines.push(`--------------------------------`);
  lines.push(`Por favor envíenos el comprobante de su abono por este medio para actualizar su saldo de inmediato.`);
  lines.push(`¡Muchas gracias por su preferencia!`);

  return lines.join('\n');
}

export function createWhatsAppCustomerStatementMessage(
  customerName: string,
  customerDoc: string,
  customerDebts: DebtAccount[],
  currentRate: number,
  profile: BusinessProfile
): string {
  const safeRate = (currentRate && currentRate > 0) ? currentRate : 86.45;
  const pendingDebts = customerDebts.filter(d => d.status !== 'paid');
  const totalPendingUSD = pendingDebts.reduce((acc, d) => acc + (d.remainingDebtUSD || 0), 0);
  const totalPendingVES = totalPendingUSD * safeRate;

  const lines: string[] = [];

  lines.push(`📊 *ESTADO DE CUENTA CONSOLIDADO*`);
  lines.push(`🏢 *${(profile?.commercialName || profile?.name || 'EMPRESA').toUpperCase()}*`);
  if (profile?.rif) lines.push(`📑 RIF: ${profile.rif}`);
  if (profile?.address) lines.push(`📍 ${profile.address}`);
  lines.push(`--------------------------------`);
  lines.push(`👤 *Cliente:* ${customerName}`);
  if (customerDoc) lines.push(`🆔 *Documento:* ${customerDoc}`);
  lines.push(`📅 *Fecha de Emisión:* ${formatShortDate(new Date().toISOString())}`);
  lines.push(`📊 *Tasa BCV Aplicada:* ${safeRate.toFixed(2)} Bs/$`);
  lines.push(`--------------------------------`);
  lines.push(`💰 *RESUMEN TOTAL PENDIENTE:*`);
  lines.push(`💵 *Total en Divisas:* ${formatUSD(totalPendingUSD)}`);
  lines.push(`🇻🇪 *Total en Bolívares:* ${formatVES(totalPendingVES)}`);
  lines.push(`--------------------------------`);

  if (pendingDebts.length > 0) {
    lines.push(`📋 *DETALLE DE CUENTAS PENDIENTES:*`);
    pendingDebts.forEach((debt, index) => {
      const isOverdue = debt.dueDate && new Date(debt.dueDate).getTime() < new Date().getTime();
      const statusIcon = isOverdue ? '⚠️' : '🔹';
      const debtVes = (debt.remainingDebtUSD || 0) * safeRate;
      lines.push(`${statusIcon} *Doc #${debt.invoiceNumber}* ${debt.notes ? `(${debt.notes})` : ''}`);
      lines.push(`   ↳ Pendiente: ${formatUSD(debt.remainingDebtUSD)} / ${formatVES(debtVes)}`);
      if (debt.dueDate) {
        lines.push(`   ↳ Vencimiento: ${formatShortDate(debt.dueDate)} ${isOverdue ? '[VENCIDO]' : ''}`);
      }
    });
    lines.push(`--------------------------------`);
  }

  lines.push(`💳 *INSTRUCCIONES Y DATOS DE PAGO:*`);

  if (profile?.pagoMovilPhone || profile?.pagoMovilId) {
    lines.push(`📲 *Pago Móvil (Bolívares):*`);
    if (profile.pagoMovilBank) lines.push(`   • Banco: ${profile.pagoMovilBank}`);
    if (profile.pagoMovilPhone) lines.push(`   • Teléfono: ${profile.pagoMovilPhone}`);
    if (profile.pagoMovilId) lines.push(`   • C.I. / RIF: ${profile.pagoMovilId}`);
  }

  if (profile?.zelleEmail) {
    lines.push(`⚡ *Zelle (Dólares):*`);
    lines.push(`   • Correo: ${profile.zelleEmail}`);
    if (profile.zelleHolder) lines.push(`   • Titular: ${profile.zelleHolder}`);
  }

  if (profile?.binancePayId) {
    lines.push(`🪙 *Binance Pay (USDT):*`);
    lines.push(`   • Pay ID: ${profile.binancePayId}`);
  }

  lines.push(`💵 *Efectivo ($ / Bs) / Tarjeta de Débito:* Directo en caja`);
  lines.push(`--------------------------------`);
  lines.push(`📌 *Importante:* Al realizar tu abono, por favor envía la captura o número de referencia por este medio para asentar el pago en tu cuenta.`);
  lines.push(`_Agradecemos tu puntualidad. ¡Estamos a tu orden!_`);

  return lines.join('\n');
}

export function createWhatsAppCatalogMessage(products: Product[], bcvRate: number, profile: BusinessProfile): string {
  const safeRate = (bcvRate && bcvRate > 0) ? bcvRate : 86.45;
  const lines: string[] = [];

  lines.push(`🌟 *CATÁLOGO DE PRODUCTOS & PRECIOS AL DÍA*`);
  lines.push(`🏢 *${profile?.commercialName || profile?.name || 'EMPRESA'}*`);
  lines.push(`💵 *Tasa BCV del Día:* ${safeRate.toFixed(2)} Bs/$`);
  lines.push(`--------------------------------`);

  const activeProducts = products.filter(p => p.type === 'service' || p.stock > 0);
  
  activeProducts.slice(0, 25).forEach(p => {
    const vesPrice = p.priceUSD * bcvRate;
    const stockBadge = p.type === 'service' ? '🛠️ Servicio' : `📦 Stock: ${p.stock} ${p.unit}`;
    lines.push(`🔹 *${p.name}*`);
    lines.push(`   💵 ${formatUSD(p.priceUSD)} | 🇻🇪 ${formatVES(vesPrice)} | ${stockBadge}`);
  });

  lines.push(`--------------------------------`);
  lines.push(`📍 *Dirección:* ${profile?.address || ''}`);
  lines.push(`📞 *Pedidos:* ${profile?.phone || ''}`);
  lines.push(`_Escríbenos para armar tu pedido express y recibirlo en delivery o pick-up._`);

  return lines.join('\n');
}

export function createWhatsAppSupplierPaymentMessage(
  debt: any,
  installment: any,
  profile: BusinessProfile
): string {
  const safeRate = (installment.rateApplied && installment.rateApplied > 0) ? installment.rateApplied : 86.45;
  const lines: string[] = [];

  lines.push(`📑 *COMPROBANTE DE PAGO / ABONO A PROVEEDOR*`);
  lines.push(`🏢 *${profile?.commercialName || profile?.name || 'EMPRESA'}* (RIF: ${profile?.rif || ''})`);
  lines.push(`--------------------------------`);
  lines.push(`Estimados *${debt.supplierName}* (RIF: ${debt.supplierRif}):`);
  lines.push(`Le notificamos que hemos emitido un pago correspondiente a la factura *${debt.invoiceNumber}*.`);
  lines.push(`--------------------------------`);
  lines.push(`💵 *Monto Pagado en Divisas:* ${formatUSD(installment.amountUSD)}`);
  lines.push(`🇻🇪 *Monto Pagado en Bolívares:* ${formatVES(installment.amountVES)}`);
  lines.push(`📊 *Tasa BCV Aplicada:* ${safeRate.toFixed(2)} Bs/$`);
  lines.push(`💳 *Forma de Pago:* ${(installment.method || '').toUpperCase()}`);
  if (installment.reference) {
    lines.push(`🔢 *Nro. de Referencia:* ${installment.reference}`);
  }
  lines.push(`--------------------------------`);
  lines.push(`📊 *Estado de Cuenta Actual:*`);
  lines.push(`• Total Factura: ${formatUSD(debt.originalDebtUSD)}`);
  lines.push(`• Total Abonado: ${formatUSD(debt.paidDebtUSD)}`);
  lines.push(`• Saldo Restante: ${formatUSD(debt.remainingDebtUSD)} (~${formatVES((debt.remainingDebtUSD || 0) * safeRate)})`);
  lines.push(`--------------------------------`);
  lines.push(`Agradecemos confirmar la recepción del abono. ¡Gracias por su excelente servicio comercial!`);

  return lines.join('\n');
}

export function openWhatsAppLink(phone: string | undefined, message: string): void {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  // Format Venezuelan numbers if starting with 0412 / 0414 / 0424 / 0416 / 0426
  let formattedPhone = cleanPhone;
  if (formattedPhone.startsWith('0') && formattedPhone.length === 11) {
    formattedPhone = '58' + formattedPhone.substring(1);
  }

  const encodedMsg = encodeURIComponent(message);
  const url = formattedPhone 
    ? `https://wa.me/${formattedPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  window.open(url, '_blank');
}
