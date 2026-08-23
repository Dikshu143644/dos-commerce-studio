<?php

declare(strict_types=1);

namespace StockFlow\Middleware;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
use StockFlow\Helpers\Response as JsonResponse;

class AuthMiddleware implements MiddlewareInterface
{
    private string $jwtSecret;

    public function __construct(string $jwtSecret)
    {
        $this->jwtSecret = $jwtSecret;
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $authHeader = $request->getHeaderLine('Authorization');

        if (empty($authHeader)) {
            $response = new Response();
            return JsonResponse::error($response, 'Authorization header is required', 401);
        }

        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $response = new Response();
            return JsonResponse::error($response, 'Invalid authorization format. Use: Bearer <token>', 401);
        }

        $token = $matches[1];

        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));

            // Add user info to request attributes
            $request = $request->withAttribute('user_id', $decoded->sub ?? null);
            $request = $request->withAttribute('user_email', $decoded->email ?? null);
            $request = $request->withAttribute('user_role', $decoded->role ?? 'authenticated');
            $request = $request->withAttribute('jwt_payload', (array) $decoded);

            return $handler->handle($request);
        } catch (\Firebase\JWT\ExpiredException $e) {
            $response = new Response();
            return JsonResponse::error($response, 'Token has expired', 401);
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            $response = new Response();
            return JsonResponse::error($response, 'Invalid token signature', 401);
        } catch (\Exception $e) {
            $response = new Response();
            return JsonResponse::error($response, 'Invalid authentication token', 401);
        }
    }
}
