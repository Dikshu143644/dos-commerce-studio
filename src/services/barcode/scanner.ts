import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import type { BarcodeConfig, BarcodeFormat, ScanResult } from './types';
import { DEFAULT_BARCODE_CONFIG } from './types';

let scannerInstance: Html5Qrcode | null = null;

const FORMAT_MAP: Record<BarcodeFormat, Html5QrcodeSupportedFormats> = {
  CODE_128: Html5QrcodeSupportedFormats.CODE_128,
  CODE_39: Html5QrcodeSupportedFormats.CODE_39,
  EAN_13: Html5QrcodeSupportedFormats.EAN_13,
  EAN_8: Html5QrcodeSupportedFormats.EAN_8,
  UPC_A: Html5QrcodeSupportedFormats.UPC_A,
  UPC_E: Html5QrcodeSupportedFormats.UPC_E,
  QR_CODE: Html5QrcodeSupportedFormats.QR_CODE,
};

function mapFormat(formatValue: number): BarcodeFormat {
  const entry = Object.entries(FORMAT_MAP).find(([, v]) => v === formatValue);
  return (entry?.[0] as BarcodeFormat) ?? 'CODE_128';
}

export async function startScanner(
  elementId: string,
  onResult: (result: ScanResult) => void,
  config: BarcodeConfig = DEFAULT_BARCODE_CONFIG
): Promise<void> {
  // Stop any existing scanner
  await stopScanner();

  const formats = (config.formatsToSupport ?? DEFAULT_BARCODE_CONFIG.formatsToSupport ?? []).map(
    (f) => FORMAT_MAP[f]
  );

  scannerInstance = new Html5Qrcode(elementId, {
    verbose: config.verbose ?? false,
    formatsToSupport: formats,
  });

  await scannerInstance.start(
    { facingMode: 'environment' },
    {
      fps: config.fps ?? 10,
      qrbox: config.qrbox ?? { width: 250, height: 250 },
      aspectRatio: config.aspectRatio,
    },
    (decodedText, decodedResult) => {
      const format = mapFormat(
        decodedResult.result.format?.format ?? Html5QrcodeSupportedFormats.CODE_128
      );
      onResult({
        value: decodedText,
        format,
        timestamp: Date.now(),
      });
    },
    () => {
      // Scan failure callback (expected when no barcode in frame)
    }
  );
}

export async function stopScanner(): Promise<void> {
  if (scannerInstance) {
    try {
      const state = scannerInstance.getState();
      // State 2 = scanning
      if (state === 2) {
        await scannerInstance.stop();
      }
    } catch {
      // Scanner may already be stopped
    }
    scannerInstance.clear();
    scannerInstance = null;
  }
}

export function isScannerRunning(): boolean {
  if (!scannerInstance) return false;
  try {
    return scannerInstance.getState() === 2;
  } catch {
    return false;
  }
}
