<?php

declare(strict_types=1);

namespace StockFlow\Helpers;

use Psr\Http\Message\ResponseInterface;
use Slim\Psr7\Response as SlimResponse;

class Response
{
    /**
     * Return a success JSON response.
     */
    public static function success(
        ResponseInterface $response,
        mixed $data = null,
        string $message = 'Success',
        int $statusCode = 200
    ): ResponseInterface {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];

        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }

    /**
     * Return an error JSON response.
     */
    public static function error(
        ResponseInterface $response,
        string $message = 'An error occurred',
        int $statusCode = 400,
        ?array $errors = null
    ): ResponseInterface {
        $payload = [
            'success' => false,
            'message' => $message,
            'errors' => $errors,
        ];

        $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));

        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($statusCode);
    }

    /**
     * Return a file download response.
     */
    public static function file(
        ResponseInterface $response,
        string $filePath,
        string $filename,
        string $contentType = 'application/octet-stream'
    ): ResponseInterface {
        $fileContent = file_get_contents($filePath);

        if ($fileContent === false) {
            return self::error($response, 'File not found', 404);
        }

        $response->getBody()->write($fileContent);

        return $response
            ->withHeader('Content-Type', $contentType)
            ->withHeader('Content-Disposition', "attachment; filename=\"{$filename}\"")
            ->withHeader('Content-Length', (string) strlen($fileContent))
            ->withStatus(200);
    }
}
