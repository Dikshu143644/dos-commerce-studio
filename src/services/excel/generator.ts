import * as XLSX from 'xlsx';
import type { ExportConfig } from './types';

export function generateExcel(config: ExportConfig): void {
  const { filename, sheetName, columns, data, title } = config;

  const workbook = XLSX.utils.book_new();
  const worksheetData: unknown[][] = [];

  // Add title row if provided
  if (title) {
    worksheetData.push([title]);
    worksheetData.push([]);
  }

  // Add headers
  const headers = columns.map((col) => col.header);
  worksheetData.push(headers);

  // Add data rows
  for (const row of data) {
    const rowData = columns.map((col) => {
      const value = row[col.key];
      if (col.format === 'currency' && typeof value === 'number') {
        return value;
      }
      if (col.format === 'percentage' && typeof value === 'number') {
        return value / 100;
      }
      return value ?? '';
    });
    worksheetData.push(rowData);
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // Merge title row if present
  if (title) {
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }];
  }

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function generateCSV(config: ExportConfig): string {
  const { columns, data } = config;
  const lines: string[] = [];

  // Headers
  lines.push(columns.map((col) => `"${col.header}"`).join(','));

  // Data rows
  for (const row of data) {
    const rowData = columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return '""';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    lines.push(rowData.join(','));
  }

  return lines.join('\n');
}
