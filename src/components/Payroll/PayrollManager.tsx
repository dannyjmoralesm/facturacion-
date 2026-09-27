import React, { useState, useMemo } from 'react';
import { 
  Briefcase, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Printer, 
  Send, 
  CheckCircle2, 
  Clock, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  Percent, 
  ShieldCheck, 
  ChevronRight, 
  Calculator, 
  Download,
  CreditCard,
  Phone,
  Coins
} from 'lucide-react';
import { 
  Employee, 
  PayrollPeriod, 
  PayrollReceipt, 
  PayrollReceiptConcept, 
  PayrollEmployerContribution, 
  BusinessProfile, 
  Expense,
  PaymentMethodType
} from '../../types';
import { formatUSD, formatVES } from '../../utils/bcvService';
import { openWhatsAppLink } from '../../utils/whatsappHelper';
import { jsPDF } from 'jspdf';

interface PayrollManagerProps {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  bcvRate: number;
  profile: BusinessProfile;
  onSaveEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onSavePayrollPeriod: (period: PayrollPeriod) => void;
  onDeletePayrollPeriod: (periodId: string) => void;
  onRegisterPayrollExpense?: (expense: Expense) => void;
}

type PayrollTab = 'periods' | 'employees' | 'receipts' | 'employer_costs';

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  employees,
  payrollPeriods,
  bcvRate,
  profile,
  onSaveEmployee,
  onDeleteEmployee,
  onSavePayrollPeriod,
  onDeletePayrollPeriod,
  onRegisterPayrollExpense
}) => {
  const [activeTab, setActiveTab] = useState<PayrollTab>('periods');
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(() => {
    return payrollPeriods.length > 0 ? payrollPeriods[0] : null;
  });
  const [selectedReceipt, setSelectedReceipt] = useState<PayrollReceipt | null>(null);

  // Employee Modal State
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Employee Form State
  const [empDocType, setEmpDocType] = useState<'V' | 'E' | 'P'>('V');
  const [empDocNumber, setEmpDocNumber] = useState('');
  const [empFirstName, setEmpFirstName] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empPosition, setEmpPosition] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Ventas');
  const [empHireDate, setEmpHireDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [empContractType, setEmpContractType] = useState<any>('indefinido');
  const [empSalaryCurrency, setEmpSalaryCurrency] = useState<'USD' | 'VES'>('USD');
  const [empBaseSalary, setEmpBaseSalary] = useState('');
  const [empHasCestaticket, setEmpHasCestaticket] = useState(true);
  const [empCustomCestaticketUSD, setEmpCustomCestaticketUSD] = useState('40');
  const [empProductionBonusUSD, setEmpProductionBonusUSD] = useState('0');
  const [empBankName, setEmpBankName] = useState('0102 - Banco de Venezuela');
  const [empBankAccountNumber, setEmpBankAccountNumber] = useState('');
  const [empPagoMovilPhone, setEmpPagoMovilPhone] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empStatus, setEmpStatus] = useState<any>('active');
  const [empAddress, setEmpAddress] = useState('');

  // Process Payroll Modal State
  const [isProcessPayrollModalOpen, setIsProcessPayrollModalOpen] = useState(false);
  const [payrollPeriodType, setPayrollPeriodType] = useState<'1ra_quincena' | '2da_quincena' | 'mensual'>('1ra_quincena');
  const [payrollMonth, setPayrollMonth] = useState<number>(() => new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState<number>(() => new Date().getFullYear());
  const [payrollPaymentDate, setPayrollPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const activeEmployees = useMemo(() => {
    return employees.filter(e => e.status === 'active');
  }, [employees]);

  // Overall Financial Metrics
  const summaryMetrics = useMemo(() => {
    const totalStaff = employees.length;
    const activeStaff = activeEmployees.length;
    const totalMonthlyPayrollUSD = activeEmployees.reduce((sum, e) => {
      const base = e.baseSalary || 0;
      const cticket = e.hasCestaticket ? (e.customCestaticketUSD || profile.defaultCestaticketUSD || 40) : 0;
      const bonus = e.productionBonusUSD || 0;
      return sum + base + cticket + bonus;
    }, 0);
    const totalMonthlyPayrollVES = totalMonthlyPayrollUSD * bcvRate;

    return {
      totalStaff,
      activeStaff,
      totalMonthlyPayrollUSD,
      totalMonthlyPayrollVES
    };
  }, [employees, activeEmployees, bcvRate, profile]);

  const handleOpenCreateEmployee = () => {
    setEditingEmployee(null);
    setEmpDocType('V');
    setEmpDocNumber('');
    setEmpFirstName('');
    setEmpLastName('');
    setEmpPosition('');
    setEmpDepartment('Ventas');
    setEmpHireDate(new Date().toISOString().split('T')[0]);
    setEmpContractType('indefinido');
    setEmpSalaryCurrency('USD');
    setEmpBaseSalary('250');
    setEmpHasCestaticket(true);
    setEmpCustomCestaticketUSD('40');
    setEmpProductionBonusUSD('30');
    setEmpBankName('0102 - Banco de Venezuela');
    setEmpBankAccountNumber('');
    setEmpPagoMovilPhone('');
    setEmpPhone('');
    setEmpEmail('');
    setEmpStatus('active');
    setEmpAddress('');
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpDocType(emp.docType);
    setEmpDocNumber(emp.docNumber);
    setEmpFirstName(emp.firstName);
    setEmpLastName(emp.lastName);
    setEmpPosition(emp.position);
    setEmpDepartment(emp.department);
    setEmpHireDate(emp.hireDate);
    setEmpContractType(emp.contractType);
    setEmpSalaryCurrency(emp.salaryCurrency);
    setEmpBaseSalary(emp.baseSalary.toString());
    setEmpHasCestaticket(emp.hasCestaticket);
    setEmpCustomCestaticketUSD(emp.customCestaticketUSD ? emp.customCestaticketUSD.toString() : '40');
    setEmpProductionBonusUSD(emp.productionBonusUSD ? emp.productionBonusUSD.toString() : '0');
    setEmpBankName(emp.bankName || '0102 - Banco de Venezuela');
    setEmpBankAccountNumber(emp.bankAccountNumber || '');
    setEmpPagoMovilPhone(emp.pagoMovilPhone || '');
    setEmpPhone(emp.phone || '');
    setEmpEmail(emp.email || '');
    setEmpStatus(emp.status);
    setEmpAddress(emp.address || '');
    setIsEmployeeModalOpen(true);
  };

  const handleSaveEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empFirstName.trim() || !empDocNumber.trim() || !empPosition.trim()) return;

    const baseSalary = parseFloat(empBaseSalary) || 0;
    const customCestaticketUSD = empHasCestaticket ? (parseFloat(empCustomCestaticketUSD) || 40) : undefined;
    const productionBonusUSD = parseFloat(empProductionBonusUSD) || 0;

    const saved: Employee = {
      id: editingEmployee ? editingEmployee.id : `emp-${Date.now()}`,
      docType: empDocType,
      docNumber: empDocNumber.trim().toUpperCase(),
      firstName: empFirstName.trim(),
      lastName: empLastName.trim(),
      fullName: `${empFirstName.trim()} ${empLastName.trim()}`.trim(),
      email: empEmail.trim() || undefined,
      phone: empPhone.trim(),
      position: empPosition.trim(),
      department: empDepartment.trim(),
      hireDate: empHireDate,
      contractType: empContractType,
      salaryCurrency: empSalaryCurrency,
      baseSalary,
      hasCestaticket: empHasCestaticket,
      customCestaticketUSD,
      productionBonusUSD,
      bankName: empBankName,
      bankAccountNumber: empBankAccountNumber.trim() || undefined,
      pagoMovilPhone: empPagoMovilPhone.trim() || empPhone.trim() || undefined,
      status: empStatus,
      address: empAddress.trim() || undefined,
      createdAt: editingEmployee ? editingEmployee.createdAt : new Date().toISOString()
    };

    onSaveEmployee(saved);
    setIsEmployeeModalOpen(false);
  };

  // -------------------------------------------------------------
  // LOTTT & VENEZUELAN PAYROLL ENGINE
  // -------------------------------------------------------------
  const handleProcessPayroll = () => {
    if (activeEmployees.length === 0) {
      alert('No hay empleados activos registrados para procesar la nómina.');
      return;
    }

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthLabel = monthNames[payrollMonth - 1] || 'Mes';
    const periodTitle = payrollPeriodType === '1ra_quincena'
      ? `1ra Quincena de ${monthLabel} ${payrollYear}`
      : payrollPeriodType === '2da_quincena'
      ? `2da Quincena de ${monthLabel} ${payrollYear}`
      : `Nómina Mensual ${monthLabel} ${payrollYear}`;

    const isBiweekly = payrollPeriodType !== 'mensual';
    const factor = isBiweekly ? 0.5 : 1.0;
    const daysWorked = isBiweekly ? 15 : 30;

    const startDate = payrollPeriodType === '1ra_quincena'
      ? `${payrollYear}-${String(payrollMonth).padStart(2, '0')}-01`
      : payrollPeriodType === '2da_quincena'
      ? `${payrollYear}-${String(payrollMonth).padStart(2, '0')}-16`
      : `${payrollYear}-${String(payrollMonth).padStart(2, '0')}-01`;

    const lastDayOfMonth = new Date(payrollYear, payrollMonth, 0).getDate();
    const endDate = payrollPeriodType === '1ra_quincena'
      ? `${payrollYear}-${String(payrollMonth).padStart(2, '0')}-15`
      : `${payrollYear}-${String(payrollMonth).padStart(2, '0')}-${lastDayOfMonth}`;

    const newPeriodId = `payroll-${Date.now()}`;
    const receipts: PayrollReceipt[] = [];

    let totalEarningsUSD = 0;
    let totalEarningsVES = 0;
    let totalDeductionsUSD = 0;
    let totalDeductionsVES = 0;
    let netPayUSD = 0;
    let netPayVES = 0;
    let totalEmployerCostUSD = 0;
    let totalEmployerCostVES = 0;

    activeEmployees.forEach(emp => {
      // 1. Asignación: Sueldo Básico del período
      const baseSalaryUSD = Number((emp.baseSalary * factor).toFixed(2));
      const baseSalaryVES = Number((baseSalaryUSD * bcvRate).toFixed(2));

      // 2. Asignación: Cestaticket Socialista de Ley ($40 mensual / $20 quincenal indexado en Bs a BCV)
      const cticketFullUSD = emp.hasCestaticket ? (emp.customCestaticketUSD || profile.defaultCestaticketUSD || 40) : 0;
      const cticketUSD = Number((cticketFullUSD * factor).toFixed(2));
      const cticketVES = Number((cticketUSD * bcvRate).toFixed(2));

      // 3. Asignación: Bono de Productividad en Divisas
      const bonusUSD = Number(((emp.productionBonusUSD || 0) * factor).toFixed(2));
      const bonusVES = Number((bonusUSD * bcvRate).toFixed(2));

      // Conceptos de Asignaciones
      const concepts: PayrollReceiptConcept[] = [
        {
          id: `c-base-${emp.id}`,
          code: '001',
          name: isBiweekly ? 'Sueldo Básico Quincenal (15 días)' : 'Sueldo Básico Mensual (30 días)',
          type: 'earning',
          amountUSD: baseSalaryUSD,
          amountVES: baseSalaryVES,
          quantity: daysWorked,
          unitLabel: 'Días'
        }
      ];

      if (cticketUSD > 0) {
        concepts.push({
          id: `c-cticket-${emp.id}`,
          code: '002',
          name: 'Cestaticket Socialista de Ley (Decreto Oficial)',
          type: 'earning',
          amountUSD: cticketUSD,
          amountVES: cticketVES,
          notes: 'No remunerativo según LOTTT'
        });
      }

      if (bonusUSD > 0) {
        concepts.push({
          id: `c-bonus-${emp.id}`,
          code: '003',
          name: 'Bono de Productividad / Compensación Divisas',
          type: 'earning',
          amountUSD: bonusUSD,
          amountVES: bonusVES,
          notes: 'Bonificación libre de incidencia'
        });
      }

      // Deducciones de Ley del Trabajador (sobre sueldo básico según normativa venezolana)
      // IVSS Trabajador: 4%
      const ivssEmpUSD = Number((baseSalaryUSD * 0.04).toFixed(2));
      const ivssEmpVES = Number((ivssEmpUSD * bcvRate).toFixed(2));
      concepts.push({
        id: `d-ivss-${emp.id}`,
        code: 'D01',
        name: 'Retención Seguro Social Obligatorio (IVSS 4%)',
        type: 'deduction',
        amountUSD: ivssEmpUSD,
        amountVES: ivssEmpVES,
        quantity: 4,
        unitLabel: '%'
      });

      // FAOV / BANAVIH Trabajador: 1%
      const faovEmpUSD = Number((baseSalaryUSD * 0.01).toFixed(2));
      const faovEmpVES = Number((faovEmpUSD * bcvRate).toFixed(2));
      concepts.push({
        id: `d-faov-${emp.id}`,
        code: 'D02',
        name: 'Retención Fondo de Ahorro Habitacional (FAOV 1%)',
        type: 'deduction',
        amountUSD: faovEmpUSD,
        amountVES: faovEmpVES,
        quantity: 1,
        unitLabel: '%'
      });

      // RPE (Régimen Prestacional de Empleo / Paro Forzoso): 0.5%
      const rpeEmpUSD = Number((baseSalaryUSD * 0.005).toFixed(2));
      const rpeEmpVES = Number((rpeEmpUSD * bcvRate).toFixed(2));
      concepts.push({
        id: `d-rpe-${emp.id}`,
        code: 'D03',
        name: 'Retención Régimen Prestacional Empleo (RPE 0.5%)',
        type: 'deduction',
        amountUSD: rpeEmpUSD,
        amountVES: rpeEmpVES,
        quantity: 0.5,
        unitLabel: '%'
      });

      // Aportes Patronales de la Empresa (Cargas Patronales de Ley)
      const ivssRiskRate = profile.ivssRiskRatePercent || 9; // 9%, 10% u 11%
      const ivssPatronalUSD = Number((baseSalaryUSD * (ivssRiskRate / 100)).toFixed(2));
      const ivssPatronalVES = Number((ivssPatronalUSD * bcvRate).toFixed(2));

      const faovPatronalUSD = Number((baseSalaryUSD * 0.02).toFixed(2)); // 2%
      const faovPatronalVES = Number((faovPatronalUSD * bcvRate).toFixed(2));

      const rpePatronalUSD = Number((baseSalaryUSD * 0.02).toFixed(2)); // 2%
      const rpePatronalVES = Number((rpePatronalUSD * bcvRate).toFixed(2));

      const employerContributions: PayrollEmployerContribution[] = [
        {
          code: 'PAT-IVSS',
          name: `Aporte Patronal IVSS (${ivssRiskRate}%)`,
          percentage: ivssRiskRate,
          amountUSD: ivssPatronalUSD,
          amountVES: ivssPatronalVES
        },
        {
          code: 'PAT-FAOV',
          name: 'Aporte Patronal FAOV / Banavih (2%)',
          percentage: 2,
          amountUSD: faovPatronalUSD,
          amountVES: faovPatronalVES
        },
        {
          code: 'PAT-RPE',
          name: 'Aporte Patronal Paro Forzoso / RPE (2%)',
          percentage: 2,
          amountUSD: rpePatronalUSD,
          amountVES: rpePatronalVES
        }
      ];

      const empEarningsUSD = Number(concepts.filter(c => c.type === 'earning').reduce((acc, c) => acc + c.amountUSD, 0).toFixed(2));
      const empEarningsVES = Number(concepts.filter(c => c.type === 'earning').reduce((acc, c) => acc + c.amountVES, 0).toFixed(2));
      const empDeductionsUSD = Number(concepts.filter(c => c.type === 'deduction').reduce((acc, c) => acc + c.amountUSD, 0).toFixed(2));
      const empDeductionsVES = Number(concepts.filter(c => c.type === 'deduction').reduce((acc, c) => acc + c.amountVES, 0).toFixed(2));
      const empNetUSD = Number((empEarningsUSD - empDeductionsUSD).toFixed(2));
      const empNetVES = Number((empEarningsVES - empDeductionsVES).toFixed(2));

      const empEmployerContribUSD = Number(employerContributions.reduce((acc, c) => acc + c.amountUSD, 0).toFixed(2));
      const empEmployerContribVES = Number(employerContributions.reduce((acc, c) => acc + c.amountVES, 0).toFixed(2));

      const receipt: PayrollReceipt = {
        id: `rec-${newPeriodId}-${emp.id}`,
        payrollPeriodId: newPeriodId,
        employeeId: emp.id,
        employeeDoc: `${emp.docType}-${emp.docNumber}`,
        employeeName: emp.fullName,
        employeePosition: emp.position,
        employeeDepartment: emp.department,
        hireDate: emp.hireDate,
        bcvRate,
        periodName: periodTitle,
        paymentDate: payrollPaymentDate,
        daysWorked,
        concepts,
        totalEarningsUSD: empEarningsUSD,
        totalEarningsVES: empEarningsVES,
        totalDeductionsUSD: empDeductionsUSD,
        totalDeductionsVES: empDeductionsVES,
        netPayUSD: empNetUSD,
        netPayVES: empNetVES,
        employerContributions,
        status: 'pending',
        bankName: emp.bankName,
        accountNumber: emp.bankAccountNumber,
        createdAt: new Date().toISOString()
      };

      receipts.push(receipt);

      totalEarningsUSD += empEarningsUSD;
      totalEarningsVES += empEarningsVES;
      totalDeductionsUSD += empDeductionsUSD;
      totalDeductionsVES += empDeductionsVES;
      netPayUSD += empNetUSD;
      netPayVES += empNetVES;
      totalEmployerCostUSD += (empEarningsUSD + empEmployerContribUSD);
      totalEmployerCostVES += (empEarningsVES + empEmployerContribVES);
    });

    const newPeriod: PayrollPeriod = {
      id: newPeriodId,
      name: periodTitle,
      periodType: payrollPeriodType,
      month: payrollMonth,
      year: payrollYear,
      startDate,
      endDate,
      paymentDate: payrollPaymentDate,
      bcvRate,
      status: 'approved',
      receiptsCount: receipts.length,
      totalEarningsUSD: Number(totalEarningsUSD.toFixed(2)),
      totalEarningsVES: Number(totalEarningsVES.toFixed(2)),
      totalDeductionsUSD: Number(totalDeductionsUSD.toFixed(2)),
      totalDeductionsVES: Number(totalDeductionsVES.toFixed(2)),
      netPayUSD: Number(netPayUSD.toFixed(2)),
      netPayVES: Number(netPayVES.toFixed(2)),
      totalEmployerCostUSD: Number(totalEmployerCostUSD.toFixed(2)),
      totalEmployerCostVES: Number(totalEmployerCostVES.toFixed(2)),
      receipts,
      createdAt: new Date().toISOString()
    };

    onSavePayrollPeriod(newPeriod);
    setSelectedPeriod(newPeriod);
    setIsProcessPayrollModalOpen(false);
    setActiveTab('periods');
  };

  const handleRegisterAsExpense = (period: PayrollPeriod) => {
    if (!onRegisterPayrollExpense) return;
    if (confirm(`¿Desea registrar el pago total de la nómina (${formatUSD(period.netPayUSD)} / ${formatVES(period.netPayVES)}) como un egreso formal en el módulo de Finanzas?`)) {
      const exp: Expense = {
        id: `exp-nom-${Date.now()}`,
        date: period.paymentDate,
        category: 'nomina',
        description: `Pago de Nómina: ${period.name} (${period.receiptsCount} empleados)`,
        amountUSD: period.netPayUSD,
        amountVES: period.netPayVES,
        currency: 'USD',
        amountPaid: period.netPayUSD,
        bcvRate: period.bcvRate,
        paymentMethod: 'pago_movil',
        beneficiary: `Personal de la Empresa (${period.receiptsCount} trabajadores)`,
        receiptNumber: `NOM-${period.id.slice(-6).toUpperCase()}`,
        affectsCashShift: false,
        createdAt: new Date().toISOString()
      };
      onRegisterPayrollExpense(exp);
      alert('✓ Gasto de nómina asentado exitosamente en el módulo de Finanzas.');
    }
  };

  // WhatsApp individual receipt sender
  const handleSendWhatsAppReceipt = (receipt: PayrollReceipt) => {
    const emp = employees.find(e => e.id === receipt.employeeId);
    if (!emp || !emp.phone) {
      alert('El trabajador no tiene un teléfono registrado.');
      return;
    }

    const lines: string[] = [];
    lines.push(`🧾 *RECIBO OFICIAL DE PAGO DE NÓMINA*`);
    lines.push(`🏢 *${(profile.name || profile.commercialName || 'MI EMPRESA').toUpperCase()}*`);
    lines.push(`RIF: ${profile.rif || 'J-00000000-0'}`);
    lines.push(`----------------------------------------`);
    lines.push(`👤 *Trabajador:* ${receipt.employeeName}`);
    lines.push(`🆔 *Cédula:* ${receipt.employeeDoc}`);
    lines.push(`💼 *Cargo:* ${receipt.employeePosition}`);
    lines.push(`🗓️ *Período:* ${receipt.periodName}`);
    lines.push(`📅 *Fecha de Pago:* ${receipt.paymentDate}`);
    lines.push(`💱 *Tasa Oficial BCV:* ${receipt.bcvRate.toFixed(2)} Bs/$`);
    lines.push(`----------------------------------------`);
    lines.push(`🟢 *ASIGNACIONES:*`);
    receipt.concepts.filter(c => c.type === 'earning').forEach(c => {
      lines.push(` • ${c.name}: ${formatUSD(c.amountUSD)} (${formatVES(c.amountVES)})`);
    });
    lines.push(`*Total Asignaciones:* ${formatUSD(receipt.totalEarningsUSD)} (${formatVES(receipt.totalEarningsVES)})`);
    lines.push(`----------------------------------------`);
    lines.push(`🔴 *DEDUCCIONES DE LEY:*`);
    receipt.concepts.filter(c => c.type === 'deduction').forEach(c => {
      lines.push(` • ${c.name}: -${formatUSD(c.amountUSD)} (-${formatVES(c.amountVES)})`);
    });
    lines.push(`*Total Deducciones:* -${formatUSD(receipt.totalDeductionsUSD)} (-${formatVES(receipt.totalDeductionsVES)})`);
    lines.push(`----------------------------------------`);
    lines.push(`💰 *NETO A COBRAR:*`);
    lines.push(`👉 *${formatUSD(receipt.netPayUSD)}*`);
    lines.push(`👉 *${formatVES(receipt.netPayVES)}*`);
    if (receipt.bankName) {
      lines.push(`🏦 *Acreditado en:* ${receipt.bankName}`);
    }
    lines.push(`----------------------------------------`);
    lines.push(`_Comprobante emitido de acuerdo a la LOTTT y normativa laboral venezolana._`);

    openWhatsAppLink(emp.phone, lines.join('\n'));
  };

  // PDF Individual Receipt Download
  const handleDownloadReceiptPDF = (receipt: PayrollReceipt) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 16;

    // Header Company
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text((profile.name || profile.commercialName || 'MI EMPRESA').toUpperCase(), margin + 6, y + 8);
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`RIF: ${profile.rif || 'J-00000000-0'} | Dir. Fiscal: ${profile.address || 'Venezuela'}`, margin + 6, y + 14);
    doc.text(`Tel: ${profile.phone || ''} | Email: ${profile.email || ''}`, margin + 6, y + 19);

    // Title Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(52, 211, 153);
    doc.text('RECIBO DE PAGO DE NÓMINA', pageWidth - margin - 6, y + 10, { align: 'right' });
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`Tasa BCV: ${receipt.bcvRate.toFixed(2)} Bs/$`, pageWidth - margin - 6, y + 17, { align: 'right' });

    y += 28;

    // Worker Card
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 26, 2, 2, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL TRABAJADOR', margin + 4, y + 5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(`Nombre: ${receipt.employeeName}`, margin + 4, y + 11);
    doc.text(`Cédula de Identidad: ${receipt.employeeDoc}`, margin + 4, y + 16);
    doc.text(`Cargo: ${receipt.employeePosition}`, margin + 4, y + 21);

    const rightColX = pageWidth / 2 + 10;
    doc.text(`Período: ${receipt.periodName}`, rightColX, y + 11);
    doc.text(`Fecha Pago: ${receipt.paymentDate}`, rightColX, y + 16);
    doc.text(`Banco / Cuenta: ${receipt.bankName || 'Transferencia'}`, rightColX, y + 21);

    y += 31;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 7.5, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y + 7.5, pageWidth - margin, y + 7.5);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('CÓD', margin + 3, y + 5);
    doc.text('DESCRIPCIÓN DEL CONCEPTO', margin + 18, y + 5);
    doc.text('ASIGNACIONES ($)', margin + 100, y + 5, { align: 'right' });
    doc.text('ASIGNACIONES (BS)', margin + 135, y + 5, { align: 'right' });
    doc.text('DEDUCCIONES ($)', margin + 158, y + 5, { align: 'right' });
    doc.text('DEDUCCIONES (BS)', pageWidth - margin - 3, y + 5, { align: 'right' });

    y += 8.5;

    // Concepts Rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    receipt.concepts.forEach((concept, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 1, pageWidth - margin * 2, 6.5, 'F');
      }

      doc.setTextColor(15, 23, 42);
      doc.text(concept.code, margin + 3, y + 3.5);
      doc.text(concept.name.substring(0, 48), margin + 18, y + 3.5);

      if (concept.type === 'earning') {
        doc.text(formatUSD(concept.amountUSD), margin + 100, y + 3.5, { align: 'right' });
        doc.text(formatVES(concept.amountVES), margin + 135, y + 3.5, { align: 'right' });
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text(`-${formatUSD(concept.amountUSD)}`, margin + 158, y + 3.5, { align: 'right' });
        doc.text(`-${formatVES(concept.amountVES)}`, pageWidth - margin - 3, y + 3.5, { align: 'right' });
      }

      y += 6.5;
    });

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    // Totals Box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text('TOTAL ASIGNACIONES:', margin + 6, y + 7);
    doc.text(`${formatUSD(receipt.totalEarningsUSD)} / ${formatVES(receipt.totalEarningsVES)}`, margin + 70, y + 7);

    doc.text('TOTAL DEDUCCIONES DE LEY:', margin + 6, y + 13);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatUSD(receipt.totalDeductionsUSD)} / -${formatVES(receipt.totalDeductionsVES)}`, margin + 70, y + 13);

    // Highlight Net
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(pageWidth / 2 + 10, y + 4, pageWidth / 2 - margin - 14, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('NETO A COBRAR:', pageWidth / 2 + 16, y + 11);
    doc.setFontSize(12);
    doc.setTextColor(52, 211, 153);
    doc.text(formatUSD(receipt.netPayUSD), pageWidth - margin - 8, y + 11, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225);
    doc.text(formatVES(receipt.netPayVES), pageWidth - margin - 8, y + 19, { align: 'right' });

    y += 44;

    // Legal Signatures Box
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Hago constar que he recibido a mi entera satisfacción la cantidad neta indicada en este comprobante por concepto de pago de nómina.', margin, y);

    y += 18;
    const sigWidth = 70;
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 10, y, margin + 10 + sigWidth, y);
    doc.line(pageWidth - margin - 10 - sigWidth, y, pageWidth - margin - 10, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('POR LA EMPRESA', margin + 10 + sigWidth / 2, y + 5, { align: 'center' });
    doc.text('CONFORME TRABAJADOR', pageWidth - margin - 10 - sigWidth / 2, y + 5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`C.I. ${receipt.employeeDoc}`, pageWidth - margin - 10 - sigWidth / 2, y + 9, { align: 'center' });

    doc.save(`Recibo_Nomina_${receipt.employeeDoc}_${receipt.payrollPeriodId}.pdf`);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-100 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Briefcase className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
              <span>Nómina Integral Bimoneda (Bs / $)</span>
              <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                LOTTT Legal
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Cálculo formal quincenal y mensual, Cestaticket, IVSS 4%, FAOV 1%, RPE 0.5% y aportes patronales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleOpenCreateEmployee}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-purple-400" />
            <span>Ficha de Empleado</span>
          </button>

          <button
            id="btn-process-payroll"
            type="button"
            onClick={() => setIsProcessPayrollModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950/60 transition active:scale-95"
          >
            <Calculator className="w-4 h-4" />
            <span>Procesar Nómina de Período</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Nómina Activa</div>
            <div className="text-xl font-black text-white">{summaryMetrics.activeStaff} Trabajadores</div>
            <div className="text-[10px] text-slate-400">Total registrados: {summaryMetrics.totalStaff}</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Costo Mensual Estimado</div>
            <div className="text-lg font-black font-mono text-emerald-400">
              {formatUSD(summaryMetrics.totalMonthlyPayrollUSD)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {formatVES(summaryMetrics.totalMonthlyPayrollVES)}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Deducciones de Ley</div>
            <div className="text-sm font-bold text-slate-200">IVSS 4% · FAOV 1%</div>
            <div className="text-[10px] text-slate-400">Paro Forzoso RPE 0.5%</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold">Cestaticket de Ley</div>
            <div className="text-sm font-bold text-amber-400 font-mono">
              {formatUSD(profile.defaultCestaticketUSD || 40)} / mes
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {formatVES((profile.defaultCestaticketUSD || 40) * bcvRate)}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'periods'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Períodos de Nómina ({payrollPeriods.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'employees'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Fichas de Trabajadores ({employees.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'receipts'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Recibos Individuales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('employer_costs')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
            activeTab === 'employer_costs'
              ? 'bg-purple-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Aportes Patronales (Empresa)</span>
        </button>
      </div>

      {/* TAB 1: PERIODS */}
      {activeTab === 'periods' && (
        <div className="space-y-4">
          {payrollPeriods.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-purple-400">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No se han procesado nóminas</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Procese la primera quincena o mes para generar recibos de pago formales y cálculos de ley automáticos.
              </p>
              <button
                type="button"
                onClick={() => setIsProcessPayrollModalOpen(true)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl"
              >
                Procesar Primera Nómina
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {payrollPeriods.map(period => {
                const isSelected = selectedPeriod?.id === period.id;
                return (
                  <div
                    key={period.id}
                    onClick={() => setSelectedPeriod(period)}
                    className={`bg-slate-900 border p-4 rounded-2xl cursor-pointer transition shadow-md ${
                      isSelected
                        ? 'border-purple-500 ring-2 ring-purple-500/20'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {period.name}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                        {period.receiptsCount} Empleados
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mt-2 space-y-1">
                      <div>Pago: <span className="text-slate-200 font-semibold">{period.paymentDate}</span></div>
                      <div>Tasa BCV: <span className="text-slate-200 font-mono">{period.bcvRate.toFixed(2)} Bs/$</span></div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Total Neto a Pagar:</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">{formatUSD(period.netPayUSD)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>Equivalente BCV:</span>
                        <span>{formatVES(period.netPayVES)}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPeriod(period);
                          setActiveTab('receipts');
                        }}
                        className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                      >
                        <span>Ver Recibos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {onRegisterPayrollExpense && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegisterAsExpense(period);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition"
                          title="Asentar nómina como gasto en el módulo de Finanzas"
                        >
                          Asentar Gasto
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEES */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map(emp => {
              const fullDoc = `${emp.docType}-${emp.docNumber}`;
              const cticket = emp.hasCestaticket ? (emp.customCestaticketUSD || 40) : 0;
              const bonus = emp.productionBonusUSD || 0;
              const totalEstUSD = emp.baseSalary + cticket + bonus;

              return (
                <div key={emp.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between shadow-md">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800/60">
                        {fullDoc}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        emp.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {emp.status === 'active' ? 'Activo' : emp.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white">{emp.fullName}</h3>
                    <p className="text-xs text-purple-400 font-semibold">{emp.position}</p>
                    <p className="text-[11px] text-slate-400">{emp.department} · Ingreso: {emp.hireDate}</p>

                    <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Salario Base Mensual:</span>
                        <span className="font-mono font-bold text-white">{formatUSD(emp.baseSalary)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Cestaticket Ley:</span>
                        <span className="font-mono text-amber-400">+{formatUSD(cticket)}</span>
                      </div>
                      {bonus > 0 && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-400">Bono Divisas:</span>
                          <span className="font-mono text-emerald-400">+{formatUSD(bonus)}</span>
                        </div>
                      )}
                      <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                        <span>Total Percibido:</span>
                        <span className="font-mono">{formatUSD(totalEstUSD)}</span>
                      </div>
                    </div>

                    {emp.bankAccountNumber && (
                      <div className="mt-2 text-[10px] text-slate-400 font-mono truncate">
                        Cuenta: {emp.bankAccountNumber}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleOpenEditEmployee(emp)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      title="Editar ficha de trabajador"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar la ficha del trabajador ${emp.fullName}?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30"
                      title="Eliminar trabajador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: RECEIPT VIEWER */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          {(!selectedPeriod || !selectedPeriod.receipts || selectedPeriod.receipts.length === 0) ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center">
              <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">Seleccione un período de nómina para ver los recibos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Receipt List */}
              <div className="lg:col-span-1 space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Recibos ({selectedPeriod.name}):
                </div>
                {selectedPeriod.receipts.map(rec => {
                  const isSelected = selectedReceipt?.id === rec.id;
                  return (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedReceipt(rec)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{rec.employeeName}</span>
                        <span className="font-mono text-emerald-400 font-bold">{formatUSD(rec.netPayUSD)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{rec.employeeDoc} · {rec.employeePosition}</span>
                        <span className="font-mono">{formatVES(rec.netPayVES)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Receipt Preview */}
              <div className="lg:col-span-2">
                {selectedReceipt ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                      <div>
                        <div className="text-xs font-bold text-purple-400 uppercase">Comprobante Oficial de Pago</div>
                        <h2 className="text-lg font-bold text-white mt-0.5">{selectedReceipt.employeeName}</h2>
                        <p className="text-xs text-slate-400">
                          {selectedReceipt.employeeDoc} · {selectedReceipt.employeePosition} ({selectedReceipt.employeeDepartment})
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Período: <span className="text-slate-300 font-semibold">{selectedReceipt.periodName}</span> | Fecha: {selectedReceipt.paymentDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReceipt(selectedReceipt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition"
                          title="Enviar recibo detallado por WhatsApp al empleado"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadReceiptPDF(selectedReceipt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition"
                          title="Descargar Comprobante Oficial en PDF con firmas de ley"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Asignaciones */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/30">
                        <div className="text-xs font-bold text-emerald-400 mb-2 uppercase">Asignaciones:</div>
                        <div className="space-y-1.5 text-xs">
                          {selectedReceipt.concepts.filter(c => c.type === 'earning').map(c => (
                            <div key={c.id} className="flex justify-between items-center text-slate-200">
                              <span className="truncate pr-2">{c.name}:</span>
                              <span className="font-mono font-bold shrink-0">{formatUSD(c.amountUSD)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-emerald-400">
                            <span>Total Asignaciones:</span>
                            <span className="font-mono">{formatUSD(selectedReceipt.totalEarningsUSD)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deducciones */}
                      <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/30">
                        <div className="text-xs font-bold text-rose-400 mb-2 uppercase">Deducciones de Ley:</div>
                        <div className="space-y-1.5 text-xs">
                          {selectedReceipt.concepts.filter(c => c.type === 'deduction').map(c => (
                            <div key={c.id} className="flex justify-between items-center text-slate-200">
                              <span className="truncate pr-2">{c.name}:</span>
                              <span className="font-mono font-bold text-rose-400 shrink-0">-{formatUSD(c.amountUSD)}</span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-rose-400">
                            <span>Total Deducciones:</span>
                            <span className="font-mono">-{formatUSD(selectedReceipt.totalDeductionsUSD)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Net highlight */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/40 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 font-semibold">Neto a Cobrar por el Trabajador:</div>
                        <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                          {formatUSD(selectedReceipt.netPayUSD)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">Tasa Oficial: {selectedReceipt.bcvRate.toFixed(2)} Bs/$</div>
                        <div className="text-lg font-bold font-mono text-white">
                          {formatVES(selectedReceipt.netPayVES)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center text-slate-400 text-sm">
                    Seleccione un trabajador de la lista izquierda para previsualizar su recibo individual
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EMPLOYER COSTS */}
      {activeTab === 'employer_costs' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h3 className="text-base font-bold text-white mb-1">Costo Laboral Total & Cargas Sociales de la Empresa</h3>
            <p className="text-xs text-slate-400 mb-4">
              Desglose de aportes patronales obligatorios según la legislación venezolana (IVSS, FAOV y Régimen Prestacional de Empleo)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-bold uppercase">IVSS Patronal (Riesgo Empresa)</div>
                <div className="text-xl font-bold text-white mt-1">{profile.ivssRiskRatePercent || 9}%</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mínimo (9%), Medio (10%), Máximo (11%) según la clasificación de la empresa en el Seguro Social.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-bold uppercase">FAOV Patronal (Banavih)</div>
                <div className="text-xl font-bold text-white mt-1">2.0%</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Aporte empresarial obligatorio al Fondo de Ahorro Habitacional para todos los trabajadores.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-400 font-bold uppercase">RPE Patronal (Paro Forzoso)</div>
                <div className="text-xl font-bold text-white mt-1">2.0%</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Aporte empresarial al Régimen Prestacional de Empleo y Seguridad Laboral.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT EMPLOYEE MODAL */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-slate-100 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Briefcase className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-bold text-base text-white">
                    {editingEmployee ? 'Editar Ficha del Trabajador' : 'Registrar Nuevo Trabajador'}
                  </h2>
                  <p className="text-xs text-slate-400">Ficha formal laboral con parámetros bimoneda y LOTTT</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployeeSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Doc:</label>
                  <select
                    value={empDocType}
                    onChange={(e: any) => setEmpDocType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="V">V - Venezolano</option>
                    <option value="E">E - Extranjero</option>
                    <option value="P">P - Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cédula de Identidad: *</label>
                  <input
                    type="text"
                    required
                    value={empDocNumber}
                    onChange={(e) => setEmpDocNumber(e.target.value)}
                    placeholder="18945678"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nombres: *</label>
                  <input
                    type="text"
                    required
                    value={empFirstName}
                    onChange={(e) => setEmpFirstName(e.target.value)}
                    placeholder="Juan Carlos"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Apellidos: *</label>
                  <input
                    type="text"
                    required
                    value={empLastName}
                    onChange={(e) => setEmpLastName(e.target.value)}
                    placeholder="Pérez Gómez"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cargo / Puesto: *</label>
                  <input
                    type="text"
                    required
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value)}
                    placeholder="Gerente, Cajero, Vendedor, etc."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Departamento:</label>
                  <input
                    type="text"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    placeholder="Ventas, Administración, Almacén"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Compensation Box */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-900/40 space-y-3">
                <div className="text-xs font-bold text-purple-400 uppercase">Parámetros Salariales (Bimoneda):</div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Sueldo Base Mensual USD ($): *
                    </label>
                    <input
                      type="number"
                      step="5"
                      required
                      value={empBaseSalary}
                      onChange={(e) => setEmpBaseSalary(e.target.value)}
                      placeholder="250.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono font-bold"
                    />
                    {empBaseSalary && (
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        ≈ {formatVES(parseFloat(empBaseSalary) * bcvRate)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Bono Productividad Divisas ($):
                    </label>
                    <input
                      type="number"
                      step="5"
                      value={empProductionBonusUSD}
                      onChange={(e) => setEmpProductionBonusUSD(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={empHasCestaticket}
                      onChange={(e) => setEmpHasCestaticket(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Aplica Cestaticket Socialista de Ley ($40 indexado)</span>
                  </label>
                </div>
              </div>

              {/* Bank & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Banco de Nómina:</label>
                  <input
                    type="text"
                    value={empBankName}
                    onChange={(e) => setEmpBankName(e.target.value)}
                    placeholder="0102 - Banco de Venezuela"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Nro. de Cuenta (20 dígitos):</label>
                  <input
                    type="text"
                    value={empBankAccountNumber}
                    onChange={(e) => setEmpBankAccountNumber(e.target.value)}
                    placeholder="01020123450100123456"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Teléfono Móvil:</label>
                  <input
                    type="tel"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="04141234567"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha de Ingreso:</label>
                  <input
                    type="date"
                    value={empHireDate}
                    onChange={(e) => setEmpHireDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold"
                >
                  {editingEmployee ? 'Guardar Cambios' : 'Registrar Trabajador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROCESS PAYROLL MODAL */}
      {isProcessPayrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col text-slate-100 overflow-hidden my-auto">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Calculator className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-bold text-base text-white">Generar & Procesar Nómina</h2>
                  <p className="text-xs text-slate-400">Cálculo automatizado conforme a la LOTTT y tasa BCV</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProcessPayrollModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tipo de Período:</label>
                <select
                  value={payrollPeriodType}
                  onChange={(e: any) => setPayrollPeriodType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="1ra_quincena">1ra Quincena (Días 1 al 15)</option>
                  <option value="2da_quincena">2da Quincena (Días 16 al fin de mes)</option>
                  <option value="mensual">Nómina Mensual Completa (Días 1 al fin de mes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Mes:</label>
                  <select
                    value={payrollMonth}
                    onChange={(e) => setPayrollMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {[
                      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                    ].map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Año:</label>
                  <input
                    type="number"
                    value={payrollYear}
                    onChange={(e) => setPayrollYear(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Fecha de Pago Programada:</label>
                <input
                  type="date"
                  value={payrollPaymentDate}
                  onChange={(e) => setPayrollPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-800/40 text-xs space-y-1">
                <div className="text-purple-300 font-bold">Resumen de ejecución:</div>
                <div className="text-slate-300">• Empleados a procesar: <span className="font-bold text-white">{activeEmployees.length}</span></div>
                <div className="text-slate-300">• Tasa Oficial BCV aplicada: <span className="font-mono text-emerald-400 font-bold">{bcvRate.toFixed(2)} Bs/$</span></div>
                <div className="text-slate-300">• Retenciones: <span className="text-white font-semibold">IVSS (4%), FAOV (1%), RPE (0.5%)</span></div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProcessPayrollModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayroll}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-950"
                >
                  Ejecutar & Calcular Nómina
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
