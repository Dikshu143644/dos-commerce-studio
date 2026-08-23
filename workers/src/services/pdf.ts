import { jsPDF } from 'jspdf';
import type { InvoiceData } from '../types';

// Indian currency formatting
function formatIndianCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  } else if (absAmount >= 1000) {
    return `₹${(amount / 1000).toFixed(2)} K`;
  }
  return `₹${amount.toFixed(2)}`;
}

function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  }

  const intPart = Math.floor(num);
  let result = '';

  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  if (intPart >= 100000) {
    result += convertLessThanThousand(Math.floor((intPart % 10000000) / 100000)) + ' Lakh ';
  }
  if (intPart >= 1000) {
    result += convertLessThanThousand(Math.floor((intPart % 100000) / 1000)) + ' Thousand ';
  }
  result += convertLessThanThousand(intPart % 1000);

  return result.trim() + ' Rupees Only';
}

export function generateInvoicePDF(data: InvoiceData): string {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // Dark header background
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Emerald accent line
  doc.setFillColor(16, 185, 129); // #10b981
  doc.rect(0, 45, pageWidth, 3, 'F');

  // Company name in header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(data.company.name, 14, 20);

  // Company details in header
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(data.company.address, 14, 28);
  doc.text(`Phone: ${data.company.phone} | Email: ${data.company.email}`, 14, 34);
  if (data.company.gstin) {
    doc.text(`GSTIN: ${data.company.gstin}`, 14, 40);
  }

  // Invoice title on right
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth - 14, 20, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.invoice_number}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Date: ${data.date}`, pageWidth - 14, 34, { align: 'right' });
  doc.text(`Due Date: ${data.due_date}`, pageWidth - 14, 40, { align: 'right' });

  y = 56;

  // Bill To section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 14, y);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(data.customer.name, 14, y);
  y += 5;
  doc.text(data.customer.address, 14, y);
  if (data.customer.phone) {
    y += 5;
    doc.text(`Phone: ${data.customer.phone}`, 14, y);
  }
  if (data.customer.gstin) {
    y += 5;
    doc.text(`GSTIN: ${data.customer.gstin}`, 14, y);
  }

  y += 12;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y, pageWidth - 28, 8, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 16, y + 6);
  doc.text('Description', 24, y + 6);
  doc.text('HSN', 100, y + 6);
  doc.text('Qty', 120, y + 6);
  doc.text('Rate', 140, y + 6);
  doc.text('Amount', pageWidth - 16, y + 6, { align: 'right' });

  y += 12;
  doc.setFont('helvetica', 'normal');

  // Line items
  data.items.forEach((item, index) => {
    doc.text(String(index + 1), 16, y);
    doc.text(item.description.substring(0, 40), 24, y);
    doc.text(item.hsn_code || '-', 100, y);
    doc.text(String(item.quantity), 120, y);
    doc.text(formatCurrencyFull(item.unit_price), 140, y);
    doc.text(formatCurrencyFull(item.amount), pageWidth - 16, y, { align: 'right' });
    y += 7;
  });

  // Separator
  y += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  // Totals section
  const totalsX = pageWidth - 80;
  doc.setFontSize(9);
  doc.text('Subtotal:', totalsX, y);
  doc.text(formatCurrencyFull(data.subtotal), pageWidth - 16, y, { align: 'right' });
  y += 6;

  if (data.cgst > 0) {
    doc.text('CGST (9%):', totalsX, y);
    doc.text(formatCurrencyFull(data.cgst), pageWidth - 16, y, { align: 'right' });
    y += 6;
  }
  if (data.sgst > 0) {
    doc.text('SGST (9%):', totalsX, y);
    doc.text(formatCurrencyFull(data.sgst), pageWidth - 16, y, { align: 'right' });
    y += 6;
  }
  if (data.igst > 0) {
    doc.text('IGST (18%):', totalsX, y);
    doc.text(formatCurrencyFull(data.igst), pageWidth - 16, y, { align: 'right' });
    y += 6;
  }

  // Total with emerald accent
  y += 2;
  doc.setFillColor(16, 185, 129);
  doc.rect(totalsX - 4, y - 4, pageWidth - totalsX + 4 - 12, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', totalsX, y + 3);
  doc.text(formatCurrencyFull(data.total), pageWidth - 16, y + 3, { align: 'right' });

  // Amount in words
  y += 16;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(`Amount in Words: ${data.amount_in_words}`, 14, y);

  // Bank details
  if (data.bank_details) {
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Details:', 14, y);
    doc.setFont('helvetica', 'normal');
    y += 6;
    doc.text(`Bank: ${data.bank_details.bank_name}`, 14, y);
    y += 5;
    doc.text(`A/C No: ${data.bank_details.account_number}`, 14, y);
    y += 5;
    doc.text(`IFSC: ${data.bank_details.ifsc_code}`, 14, y);
    y += 5;
    doc.text(`Branch: ${data.bank_details.branch}`, 14, y);
  }

  // Return base64
  return doc.output('datauristring').split(',')[1];
}

export { formatIndianCurrency, formatCurrencyFull, numberToWords };
