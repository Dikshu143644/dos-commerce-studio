<?php

declare(strict_types=1);

namespace StockFlow\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class ExcelService
{
    private string $storagePath;

    public function __construct(string $storagePath)
    {
        $this->storagePath = rtrim($storagePath, '/');

        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0755, true);
        }
    }

    /**
     * Import data from an Excel file.
     *
     * @return array<int, array<string, mixed>>
     */
    public function import(string $filePath, bool $hasHeader = true): array
    {
        if (!file_exists($filePath)) {
            throw new \RuntimeException("File not found: {$filePath}");
        }

        $spreadsheet = IOFactory::load($filePath);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        if (empty($rows)) {
            return [];
        }

        if ($hasHeader) {
            $headers = array_shift($rows);
            $headers = array_map(fn($h) => strtolower(trim((string) $h)), $headers ?? []);

            return array_map(function ($row) use ($headers) {
                $data = [];
                foreach ($headers as $index => $header) {
                    if (!empty($header)) {
                        $data[$header] = $row[$index] ?? null;
                    }
                }
                return $data;
            }, $rows);
        }

        return $rows;
    }

    /**
     * Export data to an Excel file with formatting.
     *
     * @param array<string> $headers
     * @param array<int, array<mixed>> $data
     */
    public function export(array $headers, array $data, string $filename, string $sheetTitle = 'Sheet1'): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle($sheetTitle);

        // Write headers
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '10B981'],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
        ];

        foreach ($headers as $colIndex => $header) {
            $col = chr(65 + $colIndex); // A, B, C, ...
            $sheet->setCellValue("{$col}1", $header);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $lastCol = chr(65 + count($headers) - 1);
        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray($headerStyle);

        // Write data
        foreach ($data as $rowIndex => $row) {
            foreach ($row as $colIndex => $value) {
                $col = chr(65 + $colIndex);
                $sheet->setCellValue("{$col}" . ($rowIndex + 2), $value);
            }
        }

        // Apply data borders
        $lastRow = count($data) + 1;
        if ($lastRow > 1) {
            $sheet->getStyle("A2:{$lastCol}{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => ['borderStyle' => Border::BORDER_THIN],
                ],
            ]);
        }

        // Save file
        $outputPath = "{$this->storagePath}/{$filename}";
        $writer = new Xlsx($spreadsheet);
        $writer->save($outputPath);

        return $outputPath;
    }

    /**
     * Export inventory data with formulas.
     *
     * @param array<int, array<string, mixed>> $inventoryData
     */
    public function exportInventory(array $inventoryData, string $filename = 'inventory_export.xlsx'): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Inventory');

        $headers = ['SKU', 'Product Name', 'Category', 'Warehouse', 'Quantity', 'Unit Price', 'Total Value', 'Reorder Level', 'Status'];

        // Write headers
        foreach ($headers as $colIndex => $header) {
            $col = chr(65 + $colIndex);
            $sheet->setCellValue("{$col}1", $header);
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // Header styling
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '10B981'],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);

        // Write data with formulas
        foreach ($inventoryData as $rowIndex => $item) {
            $row = $rowIndex + 2;
            $sheet->setCellValue("A{$row}", $item['sku'] ?? '');
            $sheet->setCellValue("B{$row}", $item['product_name'] ?? '');
            $sheet->setCellValue("C{$row}", $item['category'] ?? '');
            $sheet->setCellValue("D{$row}", $item['warehouse'] ?? '');
            $sheet->setCellValue("E{$row}", $item['quantity'] ?? 0);
            $sheet->setCellValue("F{$row}", $item['unit_price'] ?? 0);
            // Formula: Quantity * Unit Price
            $sheet->setCellValue("G{$row}", "=E{$row}*F{$row}");
            $sheet->setCellValue("H{$row}", $item['reorder_level'] ?? 0);
            // Formula: IF quantity < reorder_level then "Low Stock" else "OK"
            $sheet->setCellValue("I{$row}", "=IF(E{$row}<H{$row},\"Low Stock\",\"OK\")");
        }

        // Add summary row
        $lastDataRow = count($inventoryData) + 1;
        $summaryRow = $lastDataRow + 2;
        $sheet->setCellValue("D{$summaryRow}", 'TOTAL:');
        $sheet->setCellValue("E{$summaryRow}", "=SUM(E2:E{$lastDataRow})");
        $sheet->setCellValue("G{$summaryRow}", "=SUM(G2:G{$lastDataRow})");
        $sheet->getStyle("D{$summaryRow}:I{$summaryRow}")->getFont()->setBold(true);

        // Save file
        $outputPath = "{$this->storagePath}/{$filename}";
        $writer = new Xlsx($spreadsheet);
        $writer->save($outputPath);

        return $outputPath;
    }
}
