<?php

declare(strict_types=1);

namespace StockFlow\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
use StockFlow\Helpers\Response as JsonResponse;

class RateLimitMiddleware implements MiddlewareInterface
{
    private int $maxRequests;
    private int $windowSeconds;

    /** @var array<string, array{count: int, reset_at: int}> */
    private static array $requestCounts = [];

    public function __construct(int $maxRequests = 100, int $windowSeconds = 60)
    {
        $this->maxRequests = $maxRequests;
        $this->windowSeconds = $windowSeconds;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $clientIp = $this->getClientIp($request);
        $now = time();

        // Clean up expired entries
        $this->cleanup($now);

        // Initialize or check the rate limit window
        if (!isset(self::$requestCounts[$clientIp])) {
            self::$requestCounts[$clientIp] = [
                'count' => 0,
                'reset_at' => $now + $this->windowSeconds,
            ];
        }

        // Reset window if expired
        if ($now >= self::$requestCounts[$clientIp]['reset_at']) {
            self::$requestCounts[$clientIp] = [
                'count' => 0,
                'reset_at' => $now + $this->windowSeconds,
            ];
        }

        self::$requestCounts[$clientIp]['count']++;

        // Check if limit exceeded
        if (self::$requestCounts[$clientIp]['count'] > $this->maxRequests) {
            $response = new Response();
            $retryAfter = self::$requestCounts[$clientIp]['reset_at'] - $now;

            return JsonResponse::error($response, 'Rate limit exceeded. Try again later.', 429)
                ->withHeader('Retry-After', (string) $retryAfter)
                ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
                ->withHeader('X-RateLimit-Remaining', '0')
                ->withHeader('X-RateLimit-Reset', (string) self::$requestCounts[$clientIp]['reset_at']);
        }

        $response = $handler->handle($request);
        $remaining = $this->maxRequests - self::$requestCounts[$clientIp]['count'];

        return $response
            ->withHeader('X-RateLimit-Limit', (string) $this->maxRequests)
            ->withHeader('X-RateLimit-Remaining', (string) max(0, $remaining))
            ->withHeader('X-RateLimit-Reset', (string) self::$requestCounts[$clientIp]['reset_at']);
    }

    private function getClientIp(ServerRequestInterface $request): string
    {
        $serverParams = $request->getServerParams();

        // Check common proxy headers
        $headers = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];

        foreach ($headers as $header) {
            if (!empty($serverParams[$header])) {
                $ips = explode(',', (string) $serverParams[$header]);
                return trim($ips[0]);
            }
        }

        return '127.0.0.1';
    }

    private function cleanup(int $now): void
    {
        foreach (self::$requestCounts as $ip => $data) {
            if ($now >= $data['reset_at']) {
                unset(self::$requestCounts[$ip]);
            }
        }
    }
}
