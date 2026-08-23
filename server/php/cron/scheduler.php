<?php

declare(strict_types=1);

/**
 * Cron Scheduler
 *
 * Central scheduler that determines which cron tasks to run based on time.
 * Designed to be invoked every 60 seconds by the Docker cron service entrypoint.
 *
 * Schedule:
 *   - daily-stock-report: Runs at 08:00 UTC daily
 *   - overdue-payments: Runs at 09:00 UTC daily
 *   - lead-followup-reminder: Runs at 10:00 UTC daily
 *   - backup-trigger: Runs at 02:00 UTC daily
 */

$cronDir = __DIR__;
$hour = (int) date('G');
$minute = (int) date('i');

// Track which scripts to run this minute
$tasksToRun = [];

// Daily stock report at 08:00
if ($hour === 8 && $minute === 0) {
    $tasksToRun[] = ['name' => 'daily-stock-report', 'file' => $cronDir . '/daily-stock-report.php'];
}

// Overdue payments check at 09:00
if ($hour === 9 && $minute === 0) {
    $tasksToRun[] = ['name' => 'overdue-payments', 'file' => $cronDir . '/overdue-payments.php'];
}

// Lead follow-up reminders at 10:00
if ($hour === 10 && $minute === 0) {
    $tasksToRun[] = ['name' => 'lead-followup-reminder', 'file' => $cronDir . '/lead-followup-reminder.php'];
}

// Backup trigger at 02:00
if ($hour === 2 && $minute === 0) {
    $tasksToRun[] = ['name' => 'backup-trigger', 'file' => $cronDir . '/backup-trigger.php'];
}

if (empty($tasksToRun)) {
    // Nothing scheduled for this minute
    exit(0);
}

foreach ($tasksToRun as $task) {
    $name = $task['name'];
    $file = $task['file'];

    if (!file_exists($file)) {
        echo "[" . date('c') . "] ERROR: Cron script not found: {$file}\n";
        continue;
    }

    echo "[" . date('c') . "] Running scheduled task: {$name}\n";

    // Use file-based locking to prevent concurrent runs
    $lockFile = "/tmp/stockflow_cron_{$name}.lock";

    if (file_exists($lockFile)) {
        $lockTime = (int) file_get_contents($lockFile);
        // If lock is older than 30 minutes, treat as stale
        if (time() - $lockTime < 1800) {
            echo "[" . date('c') . "] SKIP: Task '{$name}' is already running (locked).\n";
            continue;
        }
    }

    // Acquire lock
    file_put_contents($lockFile, (string) time());

    try {
        require $file;
        echo "[" . date('c') . "] Completed task: {$name}\n";
    } catch (\Throwable $e) {
        echo "[" . date('c') . "] ERROR in {$name}: {$e->getMessage()}\n";
    } finally {
        // Release lock
        if (file_exists($lockFile)) {
            unlink($lockFile);
        }
    }
}
