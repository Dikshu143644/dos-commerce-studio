<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class HealthController
{
    /**
     * Enhanced health check endpoint.
     * GET /api/health
     *
     * Verifies:
     * - PHP process running
     * - Required extensions loaded
     * - Storage directories writable
     * - Memory usage within limits
     */
    public function check(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $checks = [];
        $healthy = true;

        // Check PHP process
        $checks['php'] = [
            'status' => 'ok',
            'version' => PHP_VERSION,
            'sapi' => PHP_SAPI,
        ];

        // Check required extensions
        $requiredExtensions = ['json', 'mbstring', 'curl', 'gd', 'zip', 'intl', 'Zend OPcache'];
        $missingExtensions = [];
        foreach ($requiredExtensions as $ext) {
            if (!extension_loaded($ext)) {
                $missingExtensions[] = $ext;
            }
        }

        if (empty($missingExtensions)) {
            $checks['extensions'] = [
                'status' => 'ok',
                'loaded' => $requiredExtensions,
            ];
        } else {
            $checks['extensions'] = [
                'status' => 'degraded',
                'missing' => $missingExtensions,
                'loaded' => array_values(array_diff($requiredExtensions, $missingExtensions)),
            ];
            $healthy = false;
        }

        // Check storage directories writable
        $storageDirs = [
            'pdfs' => realpath(__DIR__ . '/../../storage/pdfs'),
            'exports' => realpath(__DIR__ . '/../../storage/exports'),
        ];
        $storageStatus = [];
        foreach ($storageDirs as $name => $path) {
            if ($path === false || !is_dir($path)) {
                $storageStatus[$name] = 'missing';
                $healthy = false;
            } elseif (!is_writable($path)) {
                $storageStatus[$name] = 'not_writable';
                $healthy = false;
            } else {
                $storageStatus[$name] = 'ok';
            }
        }
        $checks['storage'] = [
            'status' => in_array('missing', $storageStatus, true) || in_array('not_writable', $storageStatus, true) ? 'error' : 'ok',
            'directories' => $storageStatus,
        ];

        // Check memory usage
        $memoryUsage = memory_get_usage(true);
        $memoryLimit = $this->parseMemoryLimit(ini_get('memory_limit') ?: '128M');
        $memoryPercent = $memoryLimit > 0 ? round(($memoryUsage / $memoryLimit) * 100, 2) : 0;

        $checks['memory'] = [
            'status' => $memoryPercent > 90 ? 'warning' : 'ok',
            'used_bytes' => $memoryUsage,
            'limit_bytes' => $memoryLimit,
            'usage_percent' => $memoryPercent,
        ];

        if ($memoryPercent > 95) {
            $healthy = false;
        }

        // Check OPcache status
        if (function_exists('opcache_get_status')) {
            $opcacheStatus = @opcache_get_status(false);
            $checks['opcache'] = [
                'status' => $opcacheStatus !== false ? 'ok' : 'disabled',
                'enabled' => $opcacheStatus !== false,
            ];
        } else {
            $checks['opcache'] = [
                'status' => 'unavailable',
                'enabled' => false,
            ];
        }

        $payload = [
            'success' => $healthy,
            'message' => $healthy ? 'StockFlow PHP Backend is running' : 'StockFlow PHP Backend is degraded',
            'data' => [
                'version' => '1.0.0',
                'php_version' => PHP_VERSION,
                'timestamp' => date('c'),
                'uptime' => 'OK',
                'checks' => $checks,
            ],
        ];

        $statusCode = $healthy ? 200 : 503;

        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }

    /**
     * Parse PHP memory_limit value to bytes.
     */
    private function parseMemoryLimit(string $limit): int
    {
        if ($limit === '-1') {
            return PHP_INT_MAX;
        }

        $value = (int) $limit;
        $unit = strtolower(substr(trim($limit), -1));

        switch ($unit) {
            case 'g':
                $value *= 1024 * 1024 * 1024;
                break;
            case 'm':
                $value *= 1024 * 1024;
                break;
            case 'k':
                $value *= 1024;
                break;
        }

        return $value;
    }
}
