<?php

declare(strict_types=1);

namespace StockFlow\Services;

use Dompdf\Dompdf;
use Dompdf\Options;

class PDFService
{
    private string $storagePath;
    private string $templatePath;

    public function __construct(string $storagePath, string $templatePath)
    {
        $this->storagePath = rtrim($storagePath, '/');
        $this->templatePath = rtrim($templatePath, '/');

        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0755, true);
        }
    }

    /**
     * Generate a PDF from an HTML template with data substitution.
     *
     * @param array<string, mixed> $data Template variables
     */
    public function generate(string $templateName, array $data, ?string $filename = null): string
    {
        $templateFile = "{$this->templatePath}/{$templateName}";

        if (!file_exists($templateFile)) {
            throw new \RuntimeException("Template not found: {$templateName}");
        }

        $html = file_get_contents($templateFile);

        if ($html === false) {
            throw new \RuntimeException("Failed to read template: {$templateName}");
        }

        // Replace template variables
        $html = $this->replaceVariables($html, $data);

        // Configure DOMPDF
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'sans-serif');
        $options->set('isFontSubsettingEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        // Generate filename if not provided
        if ($filename === null) {
            $filename = uniqid('pdf_', true) . '.pdf';
        }

        $outputPath = "{$this->storagePath}/{$filename}";
        file_put_contents($outputPath, $dompdf->output());

        return $outputPath;
    }

    /**
     * Generate PDF and return as string (for streaming).
     *
     * @param array<string, mixed> $data
     */
    public function generateString(string $templateName, array $data): string
    {
        $templateFile = "{$this->templatePath}/{$templateName}";

        if (!file_exists($templateFile)) {
            throw new \RuntimeException("Template not found: {$templateName}");
        }

        $html = file_get_contents($templateFile);

        if ($html === false) {
            throw new \RuntimeException("Failed to read template: {$templateName}");
        }

        $html = $this->replaceVariables($html, $data);

        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('defaultFont', 'sans-serif');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $output = $dompdf->output();
        return $output !== null ? $output : '';
    }

    /**
     * Replace template variables in HTML.
     *
     * @param array<string, mixed> $data
     */
    private function replaceVariables(string $html, array $data): string
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                // Handle array data (e.g., line items)
                $html = $this->replaceArrayBlock($html, $key, $value);
            } else {
                $html = str_replace("{{" . $key . "}}", (string) $value, $html);
            }
        }

        // Remove any unreplaced variables
        $html = preg_replace('/\{\{[^}]+\}\}/', '', $html) ?? $html;

        return $html;
    }

    /**
     * Replace a repeating block in the template.
     *
     * @param array<array<string, mixed>> $items
     */
    private function replaceArrayBlock(string $html, string $blockName, array $items): string
    {
        $pattern = '/\{\{#' . preg_quote($blockName, '/') . '\}\}(.*?)\{\{\/' . preg_quote($blockName, '/') . '\}\}/s';

        if (preg_match($pattern, $html, $matches)) {
            $blockTemplate = $matches[1];
            $renderedItems = '';

            foreach ($items as $item) {
                $renderedItem = $blockTemplate;
                foreach ($item as $itemKey => $itemValue) {
                    $renderedItem = str_replace("{{" . $itemKey . "}}", (string) $itemValue, $renderedItem);
                }
                $renderedItems .= $renderedItem;
            }

            $html = preg_replace($pattern, $renderedItems, $html) ?? $html;
        }

        return $html;
    }
}
