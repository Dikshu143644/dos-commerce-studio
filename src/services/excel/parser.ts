import * as XLSX from 'xlsx';
import type { ParsedSheet, ColumnMapping } from './types';

export function parseExcelFile(file: File): Promise<ParsedSheet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheets: ParsedSheet[] = [];

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);
          const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

          sheets.push({
            name: sheetName,
            headers,
            rows: jsonData,
            totalRows: jsonData.length,
          });
        }

        resolve(sheets);
      } catch (error) {
        reject(new Error(`Failed to parse file: ${error}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function detectColumns(headers: string[]): ColumnMapping[] {
  const fieldMappings: Record<string, string[]> = {
    name: ['name', 'product name', 'item name', 'product', 'item', 'title'],
    sku: ['sku', 'item code', 'product code', 'code', 'part number', 'part no'],
    price: ['price', 'selling price', 'sale price', 'mrp', 'rate', 'unit price'],
    purchase_price: ['cost', 'purchase price', 'buying price', 'cost price'],
    quantity: ['quantity', 'qty', 'stock', 'count', 'units', 'available'],
    category: ['category', 'type', 'group', 'department', 'class'],
    description: ['description', 'desc', 'details', 'notes', 'remarks'],
    email: ['email', 'e-mail', 'email address'],
    phone: ['phone', 'mobile', 'tel', 'telephone', 'contact number'],
    company: ['company', 'company name', 'organization', 'firm'],
    address: ['address', 'street', 'location'],
    city: ['city', 'town'],
    state: ['state', 'province', 'region'],
  };

  const mappings: ColumnMapping[] = [];

  for (const header of headers) {
    const normalized = header.toLowerCase().trim();
    let matched = false;

    for (const [field, patterns] of Object.entries(fieldMappings)) {
      if (patterns.some((p) => normalized === p || normalized.includes(p))) {
        mappings.push({ sourceColumn: header, targetField: field });
        matched = true;
        break;
      }
    }

    if (!matched) {
      mappings.push({ sourceColumn: header, targetField: header.toLowerCase().replace(/\s+/g, '_') });
    }
  }

  return mappings;
}

export function autoMapFields(
  headers: string[],
  entityType: 'product' | 'customer' | 'supplier'
): ColumnMapping[] {
  const entityFields: Record<string, string[]> = {
    product: ['name', 'sku', 'category', 'description', 'price', 'purchase_price', 'quantity', 'unit', 'tax_rate'],
    customer: ['company', 'name', 'email', 'phone', 'address', 'city', 'state', 'gst_number', 'customer_type'],
    supplier: ['company', 'name', 'email', 'phone', 'address', 'city', 'state', 'gst_number', 'payment_terms', 'rating'],
  };

  const availableFields = entityFields[entityType] || [];
  const detectedMappings = detectColumns(headers);

  return detectedMappings.filter((m) =>
    availableFields.includes(m.targetField) || headers.includes(m.sourceColumn)
  );
}
