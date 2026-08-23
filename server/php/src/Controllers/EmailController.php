<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use StockFlow\Helpers\Response;
use StockFlow\Helpers\Validator;
use StockFlow\Services\EmailService;

class EmailController
{
    private EmailService $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Send a transactional email.
     * POST /api/email/send
     */
    public function send(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();

        $validator = new Validator();
        $validator
            ->required($body, ['to', 'subject', 'template'])
            ->email($body, 'to');

        if ($validator->fails()) {
            return Response::error($response, 'Validation failed', 422, $validator->getErrors());
        }

        try {
            $to = (string) $body['to'];
            $subject = (string) $body['subject'];
            $template = (string) $body['template'];
            $data = (array) ($body['data'] ?? []);
            $cc = (array) ($body['cc'] ?? []);

            // Note: attachments parameter is intentionally not accepted from the public API
            // to prevent arbitrary file read vulnerabilities.

            // Validate template exists
            $allowedTemplates = [
                'order-confirmation.html',
                'low-stock-alert.html',
                'payment-reminder.html',
                'lead-followup.html',
                'welcome.html',
            ];

            if (!in_array($template, $allowedTemplates, true)) {
                return Response::error($response, "Invalid template: {$template}. Allowed: " . implode(', ', $allowedTemplates), 400);
            }

            $this->emailService->send($to, $subject, $template, $data, $cc);

            return Response::success($response, [
                'to' => $to,
                'subject' => $subject,
                'template' => $template,
                'sent_at' => date('c'),
            ], 'Email sent successfully');
        } catch (\Throwable $e) {
            return Response::error($response, "Email sending failed: {$e->getMessage()}", 500);
        }
    }
}
