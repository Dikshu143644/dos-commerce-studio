<?php

declare(strict_types=1);

namespace StockFlow\Tests;

use PHPUnit\Framework\TestCase;
use StockFlow\Services\PDFService;

class InvoiceControllerTest extends TestCase
{
    private string $tempStoragePath;
    private string $templatePath;

    protected function setUp(): void
    {
        $this->tempStoragePath = sys_get_temp_dir() . '/stockflow_test_pdfs_' . uniqid();
        $this->templatePath = dirname(__DIR__) . '/src/Templates';
        mkdir($this->tempStoragePath, 0755, true);
    }

    protected function tearDown(): void
    {
        // Cleanup generated test files
        $files = glob($this->tempStoragePath . '/*.pdf');
        if (is_array($files)) {
            foreach ($files as $file) {
                unlink($file);
            }
        }
        if (is_dir($this->tempStoragePath)) {
            rmdir($this->tempStoragePath);
        }
    }

    public function testPdfServiceCanGenerateInvoicePdf(): void
    {
        $pdfService = new PDFService($this->tempStoragePath, $this->templatePath);

        $templateData = [
            'invoice_number' => 'INV-2024-0001',
            'invoice_date' => '15 Jan 2024',
            'due_date' => '14 Feb 2024',
            'customer_name' => 'Acme Corp',
            'customer_address' => '456 Business Rd, Delhi 110001',
            'customer_gst' => '07BBBBB0000B1Z5',
            'customer_phone' => '+91 98765 12345',
            'customer_email' => 'billing@acme.com',
            'order_number' => 'SO-2024-0042',
            'company_address' => '123 Business Park, Mumbai 400001',
            'company_gst' => '27AAAAA0000A1Z5',
            'company_phone' => '+91 98765 43210',
            'company_email' => 'accounts@stockflow.app',
            'subtotal' => '10,000.00',
            'tax_amount' => '1,800.00',
            'discount' => '500.00',
            'total_amount' => '11,300.00',
            'amount_in_words' => 'Eleven Thousand Three Hundred Rupees Only',
            'notes' => 'Thank you for your business',
            'company_bank_name' => 'HDFC Bank',
            'company_bank_account' => '50100123456789',
            'company_bank_ifsc' => 'HDFC0001234',
            'company_bank_branch' => 'Andheri West, Mumbai',
            'items' => [
                [
                    'sr_no' => 1,
                    'sku' => 'SKU-001',
                    'product_name' => 'Widget Pro',
                    'quantity' => '10',
                    'unit_price' => '500.00',
                    'tax_rate' => '18%',
                    'tax_amount' => '900.00',
                    'total' => '5,900.00',
                ],
                [
                    'sr_no' => 2,
                    'sku' => 'SKU-002',
                    'product_name' => 'Gadget Plus',
                    'quantity' => '5',
                    'unit_price' => '1,000.00',
                    'tax_rate' => '18%',
                    'tax_amount' => '900.00',
                    'total' => '5,900.00',
                ],
            ],
        ];

        $filename = 'test_invoice.pdf';
        $pdfPath = $pdfService->generate('invoice.html', $templateData, $filename);

        $this->assertFileExists($pdfPath);
        $this->assertStringEndsWith('.pdf', $pdfPath);

        // Check that PDF has content (basic header check)
        $content = file_get_contents($pdfPath);
        $this->assertNotEmpty($content);
        $this->assertStringStartsWith('%PDF', $content);
    }

    public function testPdfServiceThrowsForMissingTemplate(): void
    {
        $pdfService = new PDFService($this->tempStoragePath, $this->templatePath);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Template not found');

        $pdfService->generate('nonexistent-template.html', []);
    }

    public function testPurchaseOrderTemplateExists(): void
    {
        $templateFile = $this->templatePath . '/purchase-order.html';
        $this->assertFileExists($templateFile);

        $content = file_get_contents($templateFile);
        $this->assertStringContainsString('PURCHASE ORDER', $content);
        $this->assertStringContainsString('{{po_number}}', $content);
    }

    public function testInvoiceTemplateHasRequiredElements(): void
    {
        $templateFile = $this->templatePath . '/invoice.html';
        $this->assertFileExists($templateFile);

        $content = file_get_contents($templateFile);

        // Check for INV-2024 format
        $this->assertStringContainsString('{{invoice_number}}', $content);

        // Check for GST
        $this->assertStringContainsString('GST', $content);

        // Check for bank details
        $this->assertStringContainsString('Bank Details', $content);
        $this->assertStringContainsString('{{company_bank_name}}', $content);
        $this->assertStringContainsString('{{company_bank_account}}', $content);
        $this->assertStringContainsString('{{company_bank_ifsc}}', $content);

        // Check for itemized table
        $this->assertStringContainsString('SKU', $content);
        $this->assertStringContainsString('Qty', $content);
        $this->assertStringContainsString('Rate', $content);
        $this->assertStringContainsString('Tax', $content);
        $this->assertStringContainsString('Total', $content);

        // Check for QR code placeholder
        $this->assertStringContainsString('QR Code', $content);
        $this->assertStringContainsString('Scan to Pay', $content);

        // Check for emerald accent color
        $this->assertStringContainsString('#10b981', $content);

        // Check for dark header
        $this->assertStringContainsString('#0a0a0a', $content);

        // Check for terms and conditions
        $this->assertStringContainsString('Terms and Conditions', $content);

        // Check for amount in words
        $this->assertStringContainsString('{{amount_in_words}}', $content);
    }

    public function testDeliveryChallanTemplateExists(): void
    {
        $templateFile = $this->templatePath . '/delivery-challan.html';
        $this->assertFileExists($templateFile);

        $content = file_get_contents($templateFile);
        $this->assertStringContainsString('DELIVERY CHALLAN', $content);
        $this->assertStringContainsString('{{challan_number}}', $content);
    }

    public function testStockReportTemplateExists(): void
    {
        $templateFile = $this->templatePath . '/stock-report.html';
        $this->assertFileExists($templateFile);

        $content = file_get_contents($templateFile);
        $this->assertStringContainsString('DAILY STOCK REPORT', $content);
        $this->assertStringContainsString('{{total_items}}', $content);
    }
}
