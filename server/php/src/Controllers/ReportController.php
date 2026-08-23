<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use StockFlow\Helpers\Response;
use StockFlow\Services\ExcelService;
use StockFlow\Services\PDFService;
use StockFlow\Services\SupabaseService;

class ReportController
{
    private ExcelService $excelService;
    private PDFService $pdfService;
    private SupabaseService $supabase;

    public function __construct(ExcelService $excelService, PDFService $pdfService, SupabaseService $supabase)
    {
        $this->excelService = $excelService;
        $this->pdfService = $pdfService;
        $this->supabase = $supabase;
    }

    /**
     * Generate stock report (Excel or PDF).
     * POST /api/reports/stock
     */
    public function stockReport(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();
        $format = $body['format'] ?? 'excel';
        $warehouseId = $body['warehouse_id'] ?? null;

        try {
            // Fetch inventory data from Supabase
            $filters = [];
            if ($warehouseId !== null) {
                $filters['warehouse_id'] = $warehouseId;
            }

            $inventory = $this->supabase->select('inventory', $filters);

            if ($format === 'pdf') {
                return $this->generateStockReportPDF($response, $inventory);
            }

            return $this->generateStockReportExcel($response, $inventory);
        } catch (\Throwable $e) {
            return Response::error($response, "Report generation failed: {$e->getMessage()}", 500);
        }
    }

    /**
     * Generate stock report as Excel.
     *
     * @param array<int, array<string, mixed>> $inventory
     */
    private function generateStockReportExcel(ResponseInterface $response, array $inventory): ResponseInterface
    {
        $headers = ['SKU', 'Product Name', 'Category', 'Warehouse', 'Quantity', 'Unit Price', 'Total Value', 'Reorder Level', 'Status'];

        $data = array_map(function ($item) {
            $quantity = (int) ($item['quantity'] ?? 0);
            $unitPrice = (float) ($item['unit_price'] ?? 0);
            $reorderLevel = (int) ($item['reorder_level'] ?? 0);

            return [
                $item['sku'] ?? '',
                $item['product_name'] ?? '',
                $item['category'] ?? '',
                $item['warehouse_name'] ?? '',
                $quantity,
                $unitPrice,
                $quantity * $unitPrice,
                $reorderLevel,
                $quantity < $reorderLevel ? 'Low Stock' : 'OK',
            ];
        }, $inventory);

        $filename = 'stock_report_' . date('Y-m-d_His') . '.xlsx';
        $filePath = $this->excelService->export($headers, $data, $filename, 'Stock Report');

        return Response::success($response, [
            'file_path' => $filePath,
            'filename' => $filename,
            'format' => 'excel',
            'total_items' => count($inventory),
            'generated_at' => date('c'),
        ], 'Stock report generated successfully');
    }

    /**
     * Generate stock report as PDF.
     *
     * @param array<int, array<string, mixed>> $inventory
     */
    private function generateStockReportPDF(ResponseInterface $response, array $inventory): ResponseInterface
    {
        $totalItems = count($inventory);
        $totalValue = array_sum(array_map(function ($item) {
            return ((int) ($item['quantity'] ?? 0)) * ((float) ($item['unit_price'] ?? 0));
        }, $inventory));

        $lowStockItems = array_filter($inventory, function ($item) {
            return ((int) ($item['quantity'] ?? 0)) < ((int) ($item['reorder_level'] ?? 0));
        });

        $templateData = [
            'report_date' => date('d M Y'),
            'report_time' => date('H:i:s'),
            'total_items' => (string) $totalItems,
            'total_value' => number_format($totalValue, 2),
            'low_stock_count' => (string) count($lowStockItems),
            'items' => array_map(function ($item, $index) {
                $quantity = (int) ($item['quantity'] ?? 0);
                $unitPrice = (float) ($item['unit_price'] ?? 0);
                $reorderLevel = (int) ($item['reorder_level'] ?? 0);

                return [
                    'sr_no' => $index + 1,
                    'sku' => $item['sku'] ?? '',
                    'product_name' => $item['product_name'] ?? '',
                    'category' => $item['category'] ?? '',
                    'warehouse' => $item['warehouse_name'] ?? '',
                    'quantity' => (string) $quantity,
                    'unit_price' => number_format($unitPrice, 2),
                    'total_value' => number_format($quantity * $unitPrice, 2),
                    'status' => $quantity < $reorderLevel ? 'Low Stock' : 'OK',
                ];
            }, $inventory, array_keys($inventory)),
        ];

        $filename = 'stock_report_' . date('Y-m-d_His') . '.pdf';
        $filePath = $this->pdfService->generate('stock-report.html', $templateData, $filename);

        return Response::success($response, [
            'file_path' => $filePath,
            'filename' => $filename,
            'format' => 'pdf',
            'total_items' => $totalItems,
            'generated_at' => date('c'),
        ], 'Stock report PDF generated successfully');
    }
}
