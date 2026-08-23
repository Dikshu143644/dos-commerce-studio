<?php

declare(strict_types=1);

namespace StockFlow\Controllers;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use StockFlow\Helpers\Response;
use StockFlow\Helpers\Validator;
use StockFlow\Services\PDFService;
use StockFlow\Services\SupabaseService;

class InvoiceController
{
    private PDFService $pdfService;
    private SupabaseService $supabase;

    public function __construct(PDFService $pdfService, SupabaseService $supabase)
    {
        $this->pdfService = $pdfService;
        $this->supabase = $supabase;
    }

    /**
     * Generate a PDF invoice from a sales order.
     * POST /api/invoices/generate
     */
    public function generate(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();

        $validator = new Validator();
        $validator->required($body, ['sales_order_id']);

        if ($validator->fails()) {
            return Response::error($response, 'Validation failed', 422, $validator->getErrors());
        }

        try {
            $salesOrderId = $body['sales_order_id'];

            // Fetch sales order from Supabase
            $orders = $this->supabase->select('sales_orders', ['id' => $salesOrderId]);

            if (empty($orders)) {
                return Response::error($response, 'Sales order not found', 404);
            }

            $order = $orders[0];

            // Fetch order items
            $items = $this->supabase->select('sales_order_items', ['sales_order_id' => $salesOrderId]);

            // Generate invoice number
            $invoiceNumber = $this->generateInvoiceNumber();

            // Prepare template data
            $templateData = [
                'invoice_number' => $invoiceNumber,
                'invoice_date' => date('d M Y'),
                'due_date' => date('d M Y', strtotime('+30 days')),
                'customer_name' => $order['customer_name'] ?? 'N/A',
                'customer_address' => $order['customer_address'] ?? '',
                'customer_gst' => $order['customer_gst'] ?? '',
                'customer_phone' => $order['customer_phone'] ?? '',
                'customer_email' => $order['customer_email'] ?? '',
                'order_number' => $order['order_number'] ?? '',
                'subtotal' => number_format((float) ($order['subtotal'] ?? 0), 2),
                'tax_amount' => number_format((float) ($order['tax_amount'] ?? 0), 2),
                'discount' => number_format((float) ($order['discount'] ?? 0), 2),
                'total_amount' => number_format((float) ($order['total_amount'] ?? 0), 2),
                'amount_in_words' => $this->numberToWords((float) ($order['total_amount'] ?? 0)),
                'notes' => $order['notes'] ?? '',
                'items' => array_map(function ($item, $index) {
                    return [
                        'sr_no' => $index + 1,
                        'sku' => $item['sku'] ?? '',
                        'product_name' => $item['product_name'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_price' => number_format((float) ($item['unit_price'] ?? 0), 2),
                        'tax_rate' => ($item['tax_rate'] ?? 0) . '%',
                        'tax_amount' => number_format((float) ($item['tax_amount'] ?? 0), 2),
                        'total' => number_format((float) ($item['total'] ?? 0), 2),
                    ];
                }, $items, array_keys($items)),
            ];

            // Generate PDF
            $filename = "INV_{$invoiceNumber}.pdf";
            $pdfPath = $this->pdfService->generate('invoice.html', $templateData, $filename);

            // Store invoice record in Supabase
            $this->supabase->insert('invoices', [
                'invoice_number' => $invoiceNumber,
                'sales_order_id' => $salesOrderId,
                'amount' => $order['total_amount'] ?? 0,
                'status' => 'generated',
                'pdf_path' => $pdfPath,
                'generated_at' => date('c'),
            ]);

            return Response::success($response, [
                'invoice_number' => $invoiceNumber,
                'pdf_path' => $pdfPath,
                'filename' => $filename,
            ], 'Invoice generated successfully', 201);
        } catch (\Throwable $e) {
            return Response::error($response, "Invoice generation failed: {$e->getMessage()}", 500);
        }
    }

    /**
     * Generate a PO PDF.
     * POST /api/purchase-orders/pdf
     */
    public function purchaseOrderPdf(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $body = (array) $request->getParsedBody();

        $validator = new Validator();
        $validator->required($body, ['purchase_order_id']);

        if ($validator->fails()) {
            return Response::error($response, 'Validation failed', 422, $validator->getErrors());
        }

        try {
            $poId = $body['purchase_order_id'];

            // Fetch PO from Supabase
            $orders = $this->supabase->select('purchase_orders', ['id' => $poId]);

            if (empty($orders)) {
                return Response::error($response, 'Purchase order not found', 404);
            }

            $order = $orders[0];

            // Fetch PO items
            $items = $this->supabase->select('purchase_order_items', ['purchase_order_id' => $poId]);

            $templateData = [
                'po_number' => $order['po_number'] ?? '',
                'po_date' => date('d M Y', strtotime($order['created_at'] ?? 'now')),
                'expected_date' => $order['expected_date'] ?? '',
                'supplier_name' => $order['supplier_name'] ?? '',
                'supplier_address' => $order['supplier_address'] ?? '',
                'supplier_gst' => $order['supplier_gst'] ?? '',
                'supplier_contact' => $order['supplier_contact'] ?? '',
                'subtotal' => number_format((float) ($order['subtotal'] ?? 0), 2),
                'tax_amount' => number_format((float) ($order['tax_amount'] ?? 0), 2),
                'total_amount' => number_format((float) ($order['total_amount'] ?? 0), 2),
                'notes' => $order['notes'] ?? '',
                'items' => array_map(function ($item, $index) {
                    return [
                        'sr_no' => $index + 1,
                        'sku' => $item['sku'] ?? '',
                        'product_name' => $item['product_name'] ?? '',
                        'quantity' => $item['quantity'] ?? 0,
                        'unit_price' => number_format((float) ($item['unit_price'] ?? 0), 2),
                        'total' => number_format((float) ($item['total'] ?? 0), 2),
                    ];
                }, $items, array_keys($items)),
            ];

            $filename = "PO_{$order['po_number']}.pdf";
            $pdfPath = $this->pdfService->generate('purchase-order.html', $templateData, $filename);

            return Response::success($response, [
                'po_number' => $order['po_number'],
                'pdf_path' => $pdfPath,
                'filename' => $filename,
            ], 'Purchase order PDF generated successfully', 201);
        } catch (\Throwable $e) {
            return Response::error($response, "PO PDF generation failed: {$e->getMessage()}", 500);
        }
    }

    /**
     * Generate a unique invoice number.
     * Uses a 4-digit random sequence with uniqueness check to avoid collisions.
     * Format: INV-{year}-{4-digit}
     */
    private function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $maxAttempts = 5;

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            // Generate a 4-digit random sequence
            $sequence = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            $invoiceNumber = "INV-{$year}-{$sequence}";

            // Check if this number already exists in the database
            $existing = $this->supabase->select('invoices', ['invoice_number' => $invoiceNumber]);

            if (empty($existing)) {
                return $invoiceNumber;
            }
        }

        // Fallback: use random 4-digit sequence matching the primary format (INV-{year}-{4-digit})
        $fallbackSequence = str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
        return "INV-{$year}-{$fallbackSequence}";
    }

    /**
     * Convert number to words (simplified for Indian currency).
     */
    private function numberToWords(float $number): string
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        $intPart = (int) floor($number);

        if ($intPart === 0) {
            return 'Zero Rupees Only';
        }

        $words = '';

        if ($intPart >= 10000000) {
            $words .= $this->convertBelowThousand((int) floor($intPart / 10000000)) . ' Crore ';
            $intPart %= 10000000;
        }

        if ($intPart >= 100000) {
            $words .= $this->convertBelowThousand((int) floor($intPart / 100000)) . ' Lakh ';
            $intPart %= 100000;
        }

        if ($intPart >= 1000) {
            $words .= $this->convertBelowThousand((int) floor($intPart / 1000)) . ' Thousand ';
            $intPart %= 1000;
        }

        if ($intPart > 0) {
            $words .= $this->convertBelowThousand($intPart);
        }

        return trim($words) . ' Rupees Only';
    }

    /**
     * Convert a number below 1000 to words.
     */
    private function convertBelowThousand(int $number): string
    {
        $ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen'];
        $tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        $words = '';

        if ($number >= 100) {
            $words .= $ones[(int) floor($number / 100)] . ' Hundred ';
            $number %= 100;
        }

        if ($number >= 20) {
            $words .= $tens[(int) floor($number / 10)] . ' ';
            $number %= 10;
        }

        if ($number > 0) {
            $words .= $ones[$number] . ' ';
        }

        return trim($words);
    }
}
