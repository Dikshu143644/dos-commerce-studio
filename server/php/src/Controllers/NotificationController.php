<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use StockFlow\Helpers\Response;
use StockFlow\Helpers\Validator;
use StockFlow\Services\WhatsAppService;

class NotificationController
{
    private WhatsAppService $whatsAppService;

    public function __construct(WhatsAppService $whatsAppService)
    {
        $this->whatsAppService = $whatsAppService;
    }

    /**
     * Send WhatsApp notification.
     * POST /api/notifications/whatsapp
     */
    public function whatsapp(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();

        $validator = new Validator();
        $validator->required($body, ['to', 'message']);

        if ($validator->fails()) {
            return Response::error($response, 'Validation failed', 422, $validator->getErrors());
        }

        try {
            $to = (string) $body['to'];
            $message = (string) $body['message'];
            $type = (string) ($body['type'] ?? 'whatsapp');
            $templateVars = (array) ($body['template_vars'] ?? []);

            if ($type === 'sms') {
                $this->whatsAppService->sendSMS($to, $message, $templateVars);
            } else {
                $this->whatsAppService->sendWhatsApp($to, $message, $templateVars);
            }

            return Response::success($response, [
                'to' => $to,
                'type' => $type,
                'sent_at' => date('c'),
            ], "Message sent via {$type} successfully");
        } catch (\Throwable $e) {
            return Response::error($response, "Notification failed: {$e->getMessage()}", 500);
        }
    }
}
