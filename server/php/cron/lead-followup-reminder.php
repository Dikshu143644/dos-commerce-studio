<?php

declare(strict_types=1);

/**
 * Lead Follow-up Reminder Cron Job
 *
 * Sends email reminders for pending follow-ups scheduled for today.
 * Schedule: Run daily at 9:00 AM
 * Crontab: 0 9 * * * php /path/to/server/php/cron/lead-followup-reminder.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use StockFlow\Services\EmailService;
use StockFlow\Services\SupabaseService;

// Load configuration
$settings = require __DIR__ . '/../src/Config/settings.php';

echo "[" . date('c') . "] Starting lead follow-up reminders...\n";

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

    // Fetch activities scheduled for today that are still pending
    $activities = $supabase->select('activities', ['status' => 'pending']);

    $remindersSent = 0;
    $today = date('Y-m-d');

    foreach ($activities as $activity) {
        $scheduledDate = $activity['scheduled_date'] ?? '';

        // Only process activities scheduled for today
        if (empty($scheduledDate) || substr($scheduledDate, 0, 10) !== $today) {
            continue;
        }

        $assigneeEmail = $activity['assignee_email'] ?? '';
        if (empty($assigneeEmail)) {
            continue;
        }

        $templateData = [
            'sales_rep_name' => $activity['assignee_name'] ?? 'Team Member',
            'lead_name' => $activity['contact_name'] ?? 'Unknown',
            'company_name' => $activity['company_name'] ?? '',
            'deal_value' => number_format((float) ($activity['deal_value'] ?? 0), 2),
            'last_activity' => $activity['description'] ?? 'No recent activity',
            'followup_notes' => $activity['notes'] ?? 'No notes',
            'lead_url' => $settings['app']['url'] . '/crm/leads/' . ($activity['lead_id'] ?? ''),
        ];

        $emailService->send(
            $assigneeEmail,
            "Follow-up Reminder: {$activity['contact_name']} - {$activity['company_name']}",
            'lead-followup.html',
            $templateData
        );

        $remindersSent++;
        echo "[" . date('c') . "] Reminder sent to: {$assigneeEmail} for lead: {$activity['contact_name']}\n";
    }

    echo "[" . date('c') . "] Lead follow-up reminders completed. Sent: {$remindersSent}\n";
} catch (Throwable $e) {
    echo "[" . date('c') . "] ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
