import { phpApi } from '@/services/php';
import { parseExcelFile } from './parser';
import { generateExcel } from './generator';
import type { ParsedSheet, ExportConfig } from './types';

/** Threshold in bytes (5 MB) for routing to server-side processing */
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;

/**
 * Import an Excel file. Files smaller than 5 MB are processed client-side
 * using SheetJS; larger files are uploaded to the PHP backend for
 * server-side processing.
 */
export async function importExcelFile(
  file: File,
  type: string
): Promise<{
  clientSide: boolean;
  sheets?: ParsedSheet[];
  serverResult?: { success: boolean; imported: number; errors: Array<{ row: number; message: string }> };
}> {
  if (file.size <= LARGE_FILE_THRESHOLD) {
    // Small file: process client-side with SheetJS
    const sheets = await parseExcelFile(file);
    return { clientSide: true, sheets };
  }

  // Large file: upload to PHP backend
  const serverResult = await phpApi.importExcel(file, type);
  return { clientSide: false, serverResult };
}

/**
 * Export data to Excel. When the dataset produces a file expected to exceed
 * 5 MB (estimated by row count * column count * 50 bytes per cell), the
 * export is delegated to the PHP backend. Otherwise it is generated
 * client-side with SheetJS.
 */
export async function exportToExcel(
  config: ExportConfig,
  options?: { forceServer?: boolean; warehouseId?: string; categoryId?: string }
): Promise<{ clientSide: boolean; blob?: Blob }> {
  const estimatedSize = config.data.length * config.columns.length * 50;

  if (!options?.forceServer && estimatedSize <= LARGE_FILE_THRESHOLD) {
    // Small dataset: generate client-side
    generateExcel(config);
    return { clientSide: true };
  }

  // Large dataset: delegate to PHP backend
  const blob = await phpApi.exportInventory({
    warehouse_id: options?.warehouseId,
    category_id: options?.categoryId,
  });
  return { clientSide: false, blob };
}
