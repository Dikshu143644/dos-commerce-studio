<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\UploadedFileInterface;
use StockFlow\Helpers\Response;
use StockFlow\Services\ExcelService;
use StockFlow\Services\SupabaseService;

class ExcelController
{
    private ExcelService $excelService;
    private SupabaseService $supabase;

    public function __construct(ExcelService $excelService, SupabaseService $supabase)
    {
        $this->excelService = $excelService;
        $this->supabase = $supabase;
    }

    /**
     * Bulk import from Excel file.
     * POST /api/excel/import
     */
    public function import(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $uploadedFiles = $request->getUploadedFiles();

        if (!isset($uploadedFiles['file'])) {
            return Response::error($response, 'No file uploaded. Use form field "file".', 400);
        }

        /** @var UploadedFileInterface $file */
        $file = $uploadedFiles['file'];

        if ($file->getError() !== UPLOAD_ERR_OK) {
            return Response::error($response, 'File upload failed', 400);
        }

        $body = (array) $request->getParsedBody();
        $targetTable = (string) ($body['table'] ?? 'products');
        $hasHeader = (bool) ($body['has_header'] ?? true);

        $allowedTables = ['products', 'customers', 'inventory', 'suppliers'];
        if (!in_array($targetTable, $allowedTables, true)) {
            return Response::error($response, "Invalid table. Allowed: " . implode(', ', $allowedTables), 400);
        }

        try {
            // Save uploaded file temporarily
            $tempPath = sys_get_temp_dir() . '/' . uniqid('import_', true) . '.xlsx';
            $file->moveTo($tempPath);

            // Parse Excel file
            $data = $this->excelService->import($tempPath, $hasHeader);

            if (empty($data)) {
                unlink($tempPath);
                return Response::error($response, 'No data found in the uploaded file', 400);
            }

            // Insert into Supabase (batch via bulk insert)
            $inserted = 0;
            $errors = [];
            $batchSize = 100;

            foreach (array_chunk($data, $batchSize) as $batchIndex => $batch) {
                try {
                    $this->supabase->bulkInsert($targetTable, $batch);
                    $inserted += count($batch);
                } catch (\Throwable $e) {
                    $errors[] = [
                        'batch' => $batchIndex + 1,
                        'rows' => count($batch),
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Cleanup temp file
            unlink($tempPath);

            return Response::success($response, [
                'total_rows' => count($data),
                'inserted' => $inserted,
                'errors' => $errors,
                'target_table' => $targetTable,
                'imported_at' => date('c'),
            ], "Import completed: {$inserted} records inserted");
        } catch (\Throwable $e) {
            return Response::error($response, "Excel import failed: {$e->getMessage()}", 500);
        }
    }

    /**
     * Export full inventory as Excel with formulas.
     * POST /api/excel/export/inventory
     */
    public function exportInventory(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();
        $warehouseId = $body['warehouse_id'] ?? null;

        try {
            // Fetch inventory data
            $filters = [];
            if ($warehouseId !== null) {
                $filters['warehouse_id'] = (string) $warehouseId;
            }

            $inventory = $this->supabase->select('inventory', $filters);

            if (empty($inventory)) {
                return Response::error($response, 'No inventory data found', 404);
            }

            // Format data for Excel export
            $excelData = array_map(function ($item) {
                return [
                    'sku' => $item['sku'] ?? '',
                    'product_name' => $item['product_name'] ?? '',
                    'category' => $item['category'] ?? '',
                    'warehouse' => $item['warehouse_name'] ?? '',
                    'quantity' => (int) ($item['quantity'] ?? 0),
                    'unit_price' => (float) ($item['unit_price'] ?? 0),
                    'reorder_level' => (int) ($item['reorder_level'] ?? 0),
                ];
            }, $inventory);

            $filename = 'inventory_export_' . date('Y-m-d_His') . '.xlsx';
            $filePath = $this->excelService->exportInventory($excelData, $filename);

            return Response::success($response, [
                'file_path' => $filePath,
                'filename' => $filename,
                'total_items' => count($inventory),
                'generated_at' => date('c'),
            ], 'Inventory export generated successfully');
        } catch (\Throwable $e) {
            return Response::error($response, "Export failed: {$e->getMessage()}", 500);
        }
    }
}
