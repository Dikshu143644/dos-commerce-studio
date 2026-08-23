<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use StockFlow\Helpers\Response;
use StockFlow\Services\PaymentService;
use StockFlow\Services\SupabaseService;

class WebhookController
{
    private PaymentService $paymentService;
    private SupabaseService $supabase;
    private string $shippingWebhookSecret;

    public function __construct(PaymentService $paymentService, SupabaseService $supabase, string $shippingWebhookSecret = '')
    {
        $this->paymentService = $paymentService;
        $this->supabase = $supabase;
        $this->shippingWebhookSecret = $shippingWebhookSecret;
    }

    /**
     * Handle Razorpay payment webhook.
     * POST /api/webhooks/razorpay
     */
    public function razorpay(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $rawBody = (string) $request->getBody();
        $signature = $request->getHeaderLine('X-Razorpay-Signature');

        if (empty($signature)) {
            return Response::error($response, 'Missing webhook signature', 400);
        }

        // Verify signature
        if (!$this->paymentService->verifyWebhookSignature($rawBody, $signature)) {
            return Response::error($response, 'Invalid webhook signature', 401);
        }

        try {
            $event = json_decode($rawBody, true);

            if (!is_array($event)) {
                return Response::error($response, 'Invalid JSON payload', 400);
            }

            $result = $this->paymentService->processWebhookEvent($event);

            // Log the webhook event
            $this->supabase->insert('audit_logs', [
                'action' => 'webhook.razorpay',
                'entity_type' => 'payment',
                'details' => json_encode($result),
                'created_at' => date('c'),
            ]);

            return Response::success($response, $result, 'Webhook processed');
        } catch (\Throwable $e) {
            return Response::error($response, "Webhook processing failed: {$e->getMessage()}", 500);
        }
    }

    /**
     * Handle shipping status webhook.
     * POST /api/webhooks/shipping
     *
     * Requires HMAC-SHA256 signature verification via X-Shipping-Signature header.
     */
    public function shipping(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $rawBody = (string) $request->getBody();

        // Verify webhook signature (HMAC-SHA256)
        if (!empty($this->shippingWebhookSecret)) {
            $signature = $request->getHeaderLine('X-Shipping-Signature');

            if (empty($signature)) {
                return Response::error($response, 'Missing webhook signature', 400);
            }

            $expectedSignature = hash_hmac('sha256', $rawBody, $this->shippingWebhookSecret);

            if (!hash_equals($expectedSignature, $signature)) {
                return Response::error($response, 'Invalid webhook signature', 401);
            }
        }

        $body = (array) json_decode($rawBody, true);

        $trackingNumber = $body['tracking_number'] ?? null;
        $status = $body['status'] ?? null;
        $carrier = $body['carrier'] ?? null;
        $estimatedDelivery = $body['estimated_delivery'] ?? null;
        $orderId = $body['order_id'] ?? null;

        if (empty($trackingNumber) || empty($status)) {
            return Response::error($response, 'tracking_number and status are required', 400);
        }

        try {
            // Update sales order shipping status
            if (!empty($orderId)) {
                $this->supabase->update('sales_orders', [
                    'shipping_status' => $status,
                    'tracking_number' => $trackingNumber,
                    'carrier' => $carrier,
                    'estimated_delivery' => $estimatedDelivery,
                    'updated_at' => date('c'),
                ], ['id' => $orderId]);
            }

            // Log the event
            $this->supabase->insert('audit_logs', [
                'action' => 'webhook.shipping',
                'entity_type' => 'sales_order',
                'entity_id' => $orderId,
                'details' => json_encode([
                    'tracking_number' => $trackingNumber,
                    'status' => $status,
                    'carrier' => $carrier,
                ]),
                'created_at' => date('c'),
            ]);

            // Create notification for status change
            $this->supabase->insert('notifications', [
                'type' => 'shipping_update',
                'title' => "Shipping Update: {$status}",
                'message' => "Order tracking #{$trackingNumber} status changed to: {$status}",
                'data' => json_encode($body),
                'created_at' => date('c'),
            ]);

            return Response::success($response, [
                'tracking_number' => $trackingNumber,
                'status' => $status,
                'processed_at' => date('c'),
            ], 'Shipping webhook processed');
        } catch (\Throwable $e) {
            return Response::error($response, "Shipping webhook failed: {$e->getMessage()}", 500);
        }
    }
}
