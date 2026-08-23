import type { BarcodeFormat, ProductQRData } from './types';

/**
 * Generates an SVG barcode image as a data URL.
 * NOTE: This produces a visual placeholder for display purposes only.
 * The output is not a valid Code 128/EAN symbology and will not scan correctly
 * from printed labels. For scannable output, integrate a library like JsBarcode.
 */
export function generateBarcode(value: string, format: BarcodeFormat = 'CODE_128'): string {
  const width = 200;
  const height = 80;
  const barWidth = 2;
  const totalBars = Math.min(value.length * 11, Math.floor(width / barWidth));

  // Generate deterministic bar pattern from value
  let bars = '';
  let x = 10;
  for (let i = 0; i < totalBars && x < width - 10; i++) {
    const charCode = value.charCodeAt(i % value.length);
    const isBar = (charCode + i) % 2 === 0;
    if (isBar) {
      const bw = i % 3 === 0 ? barWidth * 2 : barWidth;
      bars += `<rect x="${x}" y="10" width="${bw}" height="${height - 30}" fill="white"/>`;
      x += bw + 1;
    } else {
      x += barWidth + 1;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="#0a0a0a"/>
    ${bars}
    <text x="${width / 2}" y="${height - 5}" text-anchor="middle" fill="white" font-size="10" font-family="monospace">${value} (${format})</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generates a QR code SVG as a data URL.
 * Uses a simplified QR-like pattern for display.
 */
export function generateQRCode(data: string | ProductQRData): string {
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const size = 200;
  const modules = 21;
  const cellSize = Math.floor((size - 20) / modules);

  let cells = '';
  // Generate a deterministic pattern from the data
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      const charIndex = (row * modules + col) % payload.length;
      const charCode = payload.charCodeAt(charIndex);
      const isFilled =
        // Position detection patterns (corners)
        (row < 7 && col < 7) ||
        (row < 7 && col >= modules - 7) ||
        (row >= modules - 7 && col < 7) ||
        // Data pattern
        ((charCode + row * col) % 3 === 0);

      if (isFilled) {
        const x = 10 + col * cellSize;
        const y = 10 + row * cellSize;
        cells += `<rect x="${x}" y="${y}" width="${cellSize - 1}" height="${cellSize - 1}" fill="white" rx="1"/>`;
      }
    }
  }

  // Add position detection pattern borders
  const addFinder = (ox: number, oy: number) => {
    const s = cellSize * 7;
    return `<rect x="${ox}" y="${oy}" width="${s}" height="${s}" fill="none" stroke="#10b981" stroke-width="2" rx="2"/>
    <rect x="${ox + cellSize * 2}" y="${oy + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#10b981" rx="1"/>`;
  };

  const finders = [
    addFinder(10, 10),
    addFinder(10 + (modules - 7) * cellSize, 10),
    addFinder(10, 10 + (modules - 7) * cellSize),
  ].join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#0a0a0a" rx="8"/>
    ${cells}
    ${finders}
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Formats product data into a QR code payload string.
 */
export function formatProductQRData(product: ProductQRData): string {
  return JSON.stringify({
    sku: product.sku,
    name: product.name,
    price: product.price,
    warehouse: product.warehouse ?? '',
    location: product.location ?? '',
  });
}
