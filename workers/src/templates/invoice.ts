import type { InvoiceData } from '../types';

// Generate invoice number in format: INV-{year}-{4-digit}
export function generateInvoiceNumber(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(4, '0');
  return `INV-${year}-${paddedNumber}`;
}

// Build invoice data from order + customer records
export function buildInvoiceData(
  order: Record<string, unknown>,
  customer: Record<string, unknown>,
  items: Array<Record<string, unknown>>,
  company: Record<string, unknown>,
  sequenceNumber: number
): InvoiceData {
  const subtotal = items.reduce(
    (sum, item) => sum + ((item.quantity as number) || 0) * ((item.unit_price as number) || 0),
    0
  );

  // GST calculation (18% split as CGST 9% + SGST 9% for intra-state)
  const gstRate = 0.18;
  const totalTax = subtotal * gstRate;
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const total = subtotal + totalTax;

  // Number to words for amount
  const amountInWords = convertAmountToWords(total);

  return {
    invoice_number: generateInvoiceNumber(sequenceNumber),
    date: new Date().toLocaleDateString('en-IN'),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN'),
    company: {
      name: (company.name as string) || 'StockFlow Enterprises',
      address: (company.address as string) || '123 Business Park, Mumbai, Maharashtra 400001',
      phone: (company.phone as string) || '+91 98765 43210',
      email: (company.email as string) || 'billing@stockflow.app',
      gstin: (company.gstin as string) || '27AABCT1234F1ZH',
    },
    customer: {
      name: (customer.name as string) || '',
      address: (customer.address as string) || '',
      phone: customer.phone as string | undefined,
      email: customer.email as string | undefined,
      gstin: customer.gstin as string | undefined,
    },
    items: items.map((item) => ({
      description: (item.product_name as string) || (item.description as string) || '',
      quantity: (item.quantity as number) || 0,
      unit_price: (item.unit_price as number) || 0,
      amount: ((item.quantity as number) || 0) * ((item.unit_price as number) || 0),
      hsn_code: item.hsn_code as string | undefined,
    })),
    subtotal,
    cgst,
    sgst,
    igst: 0, // For inter-state, set igst = totalTax, cgst = 0, sgst = 0
    total,
    amount_in_words: amountInWords,
    bank_details: {
      bank_name: 'State Bank of India',
      account_number: '1234567890123456',
      ifsc_code: 'SBIN0001234',
      branch: 'Mumbai Main Branch',
    },
  };
}

function convertAmountToWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

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
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertLessThanThousand(n % 100) : '');
  }

  const intPart = Math.floor(num);
  let result = '';

  if (intPart >= 10000000) {
    result += convertLessThanThousand(Math.floor(intPart / 10000000)) + ' Crore ';
  }
  const lakhPart = Math.floor((intPart % 10000000) / 100000);
  if (lakhPart > 0) {
    result += convertLessThanThousand(lakhPart) + ' Lakh ';
  }
  const thousandPart = Math.floor((intPart % 100000) / 1000);
  if (thousandPart > 0) {
    result += convertLessThanThousand(thousandPart) + ' Thousand ';
  }
  const remainder = intPart % 1000;
  if (remainder > 0) {
    result += convertLessThanThousand(remainder);
  }

  return result.trim() + ' Rupees Only';
}
