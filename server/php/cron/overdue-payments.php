<?php

declare(strict_types=1);

/**
 * Overdue Payments Reminder Cron Job
 *
 * Sends payment reminder emails for overdue invoices.
 * Schedule: Run daily at 10:00 AM
 * Crontab: 0 10 * * * php /path/to/server/php/cron/overdue-payments.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use StockFlow\Services\EmailService;
use StockFlow\Services\SupabaseService;

// Load configuration
$settings = require __DIR__ . '/../src/Config/settings.php';

echo "[" . date('c') . "] Starting overdue payment reminders...\n";

try {
    // Initialize services
    $supabase = new SupabaseService(
        $settings['supabase']['url'],
        $settings['supabase']['service_role_key']
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

    // Fetch overdue invoices (status != paid, due_date < today)
    $invoices = $supabase->select('invoices', ['status' => 'generated']);

    $overdueCount = 0;
    $today = date('Y-m-d');

    foreach ($invoices as $invoice) {
        $dueDate = $invoice['due_date'] ?? '';

        if (empty($dueDate) || $dueDate >= $today) {
            continue;
        }

        // This invoice is overdue
        $customerEmail = $invoice['customer_email'] ?? '';

        if (empty($customerEmail)) {
            continue;
        }

        $templateData = [
            'customer_name' => $invoice['customer_name'] ?? 'Customer',
            'invoice_number' => $invoice['invoice_number'] ?? '',
            'amount_due' => number_format((float) ($invoice['amount'] ?? 0), 2),
            'due_date' => date('d M Y', strtotime($dueDate)),
            'bank_name' => $settings['company']['bank_name'],
            'bank_account' => $settings['company']['bank_account'],
            'bank_ifsc' => $settings['company']['bank_ifsc'],
            'payment_url' => $settings['app']['url'] . '/pay/' . ($invoice['id'] ?? ''),
        ];

        $emailService->send(
            $customerEmail,
            "Payment Reminder: Invoice {$invoice['invoice_number']} is overdue",
            'payment-reminder.html',
            $templateData
        );

        $overdueCount++;
        echo "[" . date('c') . "] Reminder sent to: {$customerEmail} for invoice: {$invoice['invoice_number']}\n";
    }

    echo "[" . date('c') . "] Overdue payment reminders completed. Sent: {$overdueCount}\n";
} catch (Throwable $e) {
    echo "[" . date('c') . "] ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
