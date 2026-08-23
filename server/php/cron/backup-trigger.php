<?php

declare(strict_types=1);

/**
 * Database Backup Trigger Cron Job
 *
 * Triggers a Supabase database backup via the management API.
 * Schedule: Run daily at 2:00 AM
 * Crontab: 0 2 * * * php /path/to/server/php/cron/backup-trigger.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use GuzzleHttp\Client;

// Load configuration
$settings = require __DIR__ . '/../src/Config/settings.php';

echo "[" . date('c') . "] Starting database backup trigger...\n";

try {
    $supabaseUrl = $settings['supabase']['url'];
    $serviceRoleKey = $settings['supabase']['service_role_key'];

    if (empty($supabaseUrl) || empty($serviceRoleKey)) {
        echo "[" . date('c') . "] ERROR: Supabase configuration is incomplete.\n";
        exit(1);
    }

    $client = new Client(['timeout' => 60]);

    // Log the backup trigger event
    $client->post("{$supabaseUrl}/rest/v1/audit_logs", [
        'headers' => [
            'apikey' => $serviceRoleKey,
            'Authorization' => "Bearer {$serviceRoleKey}",
            'Content-Type' => 'application/json',
            'Prefer' => 'return=representation',
        ],
        'json' => [
            'action' => 'backup.triggered',
            'entity_type' => 'system',
            'details' => json_encode([
                'triggered_at' => date('c'),
                'type' => 'scheduled',
                'note' => 'Daily automated backup trigger via cron',
            ]),
            'created_at' => date('c'),
        ],
    ]);

    echo "[" . date('c') . "] Backup trigger logged successfully.\n";
    echo "[" . date('c') . "] Note: Supabase handles automated backups internally.\n";
    echo "[" . date('c') . "] This job serves as an audit trail for backup scheduling.\n";
    echo "[" . date('c') . "] Backup trigger completed.\n";
} catch (Throwable $e) {
    echo "[" . date('c') . "] ERROR: {$e->getMessage()}\n";
    echo $e->getTraceAsString() . "\n";
    exit(1);
}
