<?php

declare(strict_types=1);

namespace StockFlow\Services;

class CronService
{
    /** @var array<string, array{callback: callable, interval: int, last_run: int}> */
    private array $tasks = [];

    private string $lockDir;

    public function __construct(string $lockDir = '/tmp/stockflow_cron')
    {
        $this->lockDir = $lockDir;

        if (!is_dir($this->lockDir)) {
            mkdir($this->lockDir, 0755, true);
        }
    }

    /**
     * Register a task.
     *
     * @param int $intervalSeconds Run interval in seconds
     */
    public function register(string $name, callable $callback, int $intervalSeconds): self
    {
        $this->tasks[$name] = [
            'callback' => $callback,
            'interval' => $intervalSeconds,
            'last_run' => 0,
        ];

        return $this;
    }

    /**
     * Run a specific task if it is not already running and enough time has passed.
     *
     * @return array<string, mixed>
     */
    public function runTask(string $name): array
    {
        if (!isset($this->tasks[$name])) {
            return ['success' => false, 'error' => "Task '{$name}' not registered"];
        }

        $lockFile = "{$this->lockDir}/{$name}.lock";

        // Check for lock (prevent concurrent runs)
        if (file_exists($lockFile)) {
            $lockTime = (int) file_get_contents($lockFile);
            // If lock is older than 30 minutes, consider it stale
            if (time() - $lockTime < 1800) {
                return ['success' => false, 'error' => "Task '{$name}' is already running"];
            }
        }

        // Create lock
        file_put_contents($lockFile, (string) time());

        try {
            $startTime = microtime(true);
            $result = ($this->tasks[$name]['callback'])();
            $duration = round(microtime(true) - $startTime, 3);

            $this->tasks[$name]['last_run'] = time();

            return [
                'success' => true,
                'task' => $name,
                'duration_seconds' => $duration,
                'result' => $result,
                'completed_at' => date('c'),
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'task' => $name,
                'error' => $e->getMessage(),
                'failed_at' => date('c'),
            ];
        } finally {
            // Remove lock
            if (file_exists($lockFile)) {
                unlink($lockFile);
            }
        }
    }

    /**
     * Run all tasks that are due.
     *
     * @return array<string, array<string, mixed>>
     */
    public function runDue(): array
    {
        $results = [];
        $now = time();

        foreach ($this->tasks as $name => $task) {
            if (($now - $task['last_run']) >= $task['interval']) {
                $results[$name] = $this->runTask($name);
            }
        }

        return $results;
    }

    /**
     * Get status of all registered tasks.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getStatus(): array
    {
        $status = [];

        foreach ($this->tasks as $name => $task) {
            $lockFile = "{$this->lockDir}/{$name}.lock";
            $status[$name] = [
                'interval_seconds' => $task['interval'],
                'last_run' => $task['last_run'] > 0 ? date('c', $task['last_run']) : 'never',
                'is_running' => file_exists($lockFile),
            ];
        }

        return $status;
    }
}
