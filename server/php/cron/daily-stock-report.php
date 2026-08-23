<?php

declare(strict_types=1);

/**
 * Daily Stock Report Cron Job
 *
 * Generates a daily stock summary report and emails it to configured recipients.
 * Schedule: Run daily at 8:00 AM
 * Crontab: 0 8 * * * php /path/to/server/php/cron/daily-stock-report.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use StockFlow\Services\ExcelService;
use StockFlow\Services\EmailService;
use StockFlow\Services\PDFService;
use StockFlow\Services\SupabaseService;

// Load configuration
$settings = require __DIR__ . '/../src/Config/settings.php';

echo "[" . date('c') . "] Starting daily stock report generation...\n";

try {
    // Initialize services
    $supabase = new SupabaseService(
        $settings['supabase']['url'],
        $settings['supabase']['service_role_key']
    );

    $pdfService = new PDFService(
        realpath(__DIR__ . '/../storage/pdfs') ?: __DIR__ . '/../storage/pdfs',
        realpath(__DIR__ . '/../src/Templates') ?: __DIR__ . '/../src/Templates'
    );

    $emailService = new EmailService(
        $settings['smtp']['host'],
        $settings['smtp']['port'],
        $settings['smtp']['username'],
        $settings['smtp']['password'],
        $settings['smtp']['from_name'],
        $settings['smtp']['from_email'],
        realpath(__DIR__ . '/../src/Templates') ?: __DIR__ . '/../src/Templates'
    );

    // Fetch all inventory data
    $inventory = $supabase->select('inventory');

    if (empty($inventory)) {
        echo "[" . date('c') . "] No inventory data found. Skipping report.\n";
        exit(0);
    }

    // Calculate summary metrics
    $totalItems = count($inventory);
    $totalValue = array_sum(array_map(function ($item) {
        return ((int) ($item['quantity'] ?? 0)) * ((float) ($item['unit_price'] ?? 0));
    }, $inventory));

    $lowStockItems = array_filter($inventory, function ($item) {
        return ((int) ($item['quantity'] ?? 0)) < ((int) ($item['reorder_level'] ?? 0));
    });

    // Generate PDF report
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
            $status = $quantity < $reorderLevel ? 'Low Stock' : 'OK';

            return [
                'sr_no' => $index + 1,
                'sku' => $item['sku'] ?? '',
                'product_name' => $item['product_name'] ?? '',
                'category' => $item['category'] ?? '',
                'warehouse' => $item['warehouse_name'] ?? '',
                'quantity' => (string) $quantity,
                'unit_price' => number_format($unitPrice, 2),
                'total_value' => number_format($quantity * $unitPrice, 2),
                'status' => $status,
                'status_class' => $status === 'Low Stock' ? 'low-stock' : 'ok-stock',
            ];
        }, $inventory, array_keys($inventory)),
    ];

    $filename = 'stock_report_' . date('Y-m-d') . '.pdf';
    $pdfPath = $pdfService->generate('stock-report.html', $templateData, $filename);

    echo "[" . date('c') . "] PDF report generated: {$pdfPath}\n";

    // Email the report to admin
    $adminEmail = $settings['company']['email'] ?: $settings['smtp']['from_email'];

    if (!empty($adminEmail)) {
        $emailService->sendRaw(
            $adminEmail,
            "Daily Stock Report - " . date('d M Y'),
            "<p>Hi,</p><p>Please find attached the daily stock report.</p>" .
            "<p>Summary: {$totalItems} items, Total Value: INR " . number_format($totalValue, 2) .
            ", Low Stock Alerts: " . count($lowStockItems) . "</p>" .
            "<p>Regards,<br>StockFlow System</p>"
        );
        echo "[" . date('c') . "] Report emailed to: {$adminEmail}\n";
    }

    echo "[" . date('c') . "] Daily stock report completed successfully.\n";
} catch (Throwable $e) {
    echo "[" . date('c') . "] ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
