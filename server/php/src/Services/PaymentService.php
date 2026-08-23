<?php

declare(strict_types=1);

namespace StockFlow\Services;

class PaymentService
{
    private string $razorpayKeyId;
    private string $razorpayKeySecret;
    private string $webhookSecret;
    private SupabaseService $supabase;

    public function __construct(
        string $razorpayKeyId,
        string $razorpayKeySecret,
        string $webhookSecret,
        SupabaseService $supabase
    ) {
        $this->razorpayKeyId = $razorpayKeyId;
        $this->razorpayKeySecret = $razorpayKeySecret;
        $this->webhookSecret = $webhookSecret;
        $this->supabase = $supabase;
    }

    /**
     * Verify Razorpay webhook signature.
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Verify Razorpay payment signature (for client-side verification).
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', "{$orderId}|{$paymentId}", $this->razorpayKeySecret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * Process a payment webhook event.
     *
     * @param array<string, mixed> $event
     * @return array<string, mixed>
     */
    public function processWebhookEvent(array $event): array
    {
        $eventType = $event['event'] ?? '';
        $payload = $event['payload'] ?? [];

        return match ($eventType) {
            'payment.captured' => $this->handlePaymentCaptured($payload),
            'payment.failed' => $this->handlePaymentFailed($payload),
            'order.paid' => $this->handleOrderPaid($payload),
            'refund.created' => $this->handleRefundCreated($payload),
            default => ['status' => 'ignored', 'event' => $eventType],
        };
    }

    /**
     * Handle payment captured event.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function handlePaymentCaptured(array $payload): array
    {
        $payment = $payload['payment']['entity'] ?? [];
        $orderId = $payment['order_id'] ?? '';
        $paymentId = $payment['id'] ?? '';
        $amount = ($payment['amount'] ?? 0) / 100; // Convert from paise to rupees

        // Update invoice status in Supabase
        if (!empty($orderId)) {
            $this->supabase->update('invoices', [
                'status' => 'paid',
                'payment_reference' => $paymentId,
                'paid_amount' => $amount,
                'paid_at' => date('c'),
            ], ['payment_reference' => $orderId]);
        }

        return [
            'status' => 'processed',
            'event' => 'payment.captured',
            'payment_id' => $paymentId,
            'amount' => $amount,
        ];
    }

    /**
     * Handle payment failed event.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function handlePaymentFailed(array $payload): array
    {
        $payment = $payload['payment']['entity'] ?? [];
        $orderId = $payment['order_id'] ?? '';
        $reason = $payment['error_description'] ?? 'Payment failed';

        if (!empty($orderId)) {
            $this->supabase->update('invoices', [
                'status' => 'payment_failed',
                'notes' => $reason,
            ], ['payment_reference' => $orderId]);
        }

        return [
            'status' => 'processed',
            'event' => 'payment.failed',
            'reason' => $reason,
        ];
    }

    /**
     * Handle order paid event.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function handleOrderPaid(array $payload): array
    {
        $order = $payload['order']['entity'] ?? [];
        $orderId = $order['id'] ?? '';

        return [
            'status' => 'processed',
            'event' => 'order.paid',
            'order_id' => $orderId,
        ];
    }

    /**
     * Handle refund created event.
     *
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function handleRefundCreated(array $payload): array
    {
        $refund = $payload['refund']['entity'] ?? [];
        $paymentId = $refund['payment_id'] ?? '';
        $amount = ($refund['amount'] ?? 0) / 100;

        return [
            'status' => 'processed',
            'event' => 'refund.created',
            'payment_id' => $paymentId,
            'refund_amount' => $amount,
        ];
    }
}
