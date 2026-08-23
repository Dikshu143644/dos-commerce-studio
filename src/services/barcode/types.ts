export type BarcodeFormat =
  | 'CODE_128'
  | 'CODE_39'
  | 'EAN_13'
  | 'EAN_8'
  | 'UPC_A'
  | 'UPC_E'
  | 'QR_CODE';

export interface ScanResult {
  value: string;
  format: BarcodeFormat;
  timestamp: number;
}

export interface BarcodeConfig {
  fps?: number;
  qrbox?: { width: number; height: number };
  aspectRatio?: number;
  formatsToSupport?: BarcodeFormat[];
  verbose?: boolean;
}

export interface ProductQRData {
  sku: string;
  name: string;
  price: number;
  warehouse?: string;
  location?: string;
}

export const DEFAULT_BARCODE_CONFIG: BarcodeConfig = {
  fps: 10,
  qrbox: { width: 250, height: 250 },
  formatsToSupport: ['CODE_128', 'CODE_39', 'EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'QR_CODE'],
};

export const BARCODE_FORMAT_LABELS: Record<BarcodeFormat, string> = {
  CODE_128: 'Code 128',
  CODE_39: 'Code 39',
  EAN_13: 'EAN-13',
  EAN_8: 'EAN-8',
  UPC_A: 'UPC-A',
  UPC_E: 'UPC-E',
  QR_CODE: 'QR Code',
};
