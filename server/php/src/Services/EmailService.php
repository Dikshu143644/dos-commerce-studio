<?php

declare(strict_types=1);

namespace StockFlow\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

class EmailService
{
    private string $host;
    private int $port;
    private string $username;
    private string $password;
    private string $fromName;
    private string $fromEmail;
    private string $templatePath;

    public function __construct(
        string $host,
        int $port,
        string $username,
        string $password,
        string $fromName,
        string $fromEmail,
        string $templatePath
    ) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
        $this->fromName = $fromName;
        $this->fromEmail = $fromEmail;
        $this->templatePath = rtrim($templatePath, '/');
    }

    /**
     * Send an email using an HTML template.
     *
     * @param array<string, mixed> $data Template variables
     * @param array<string> $cc
     * @param array<string> $attachments File paths
     */
    public function send(
        string $to,
        string $subject,
        string $templateName,
        array $data = [],
        array $cc = [],
        array $attachments = []
    ): bool {
        $mail = new PHPMailer(true);

        try {
            // SMTP configuration
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->port;

            // Sender and recipients
            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($to);

            foreach ($cc as $ccAddress) {
                $mail->addCC($ccAddress);
            }

            // Attachments
            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $mail->addAttachment($attachment);
                }
            }

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $this->renderTemplate($templateName, $data);
            $mail->AltBody = strip_tags($mail->Body);

            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            throw new \RuntimeException("Email sending failed: {$mail->ErrorInfo}", 0, $e);
        }
    }

    /**
     * Send a raw HTML email (no template).
     *
     * @param array<string> $attachments Optional file paths to attach
     */
    public function sendRaw(string $to, string $subject, string $htmlBody, array $attachments = []): bool
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = $this->host;
            $mail->SMTPAuth = true;
            $mail->Username = $this->username;
            $mail->Password = $this->password;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->port;

            $mail->setFrom($this->fromEmail, $this->fromName);
            $mail->addAddress($to);

            // Attachments (only from internal callers, not user-supplied paths)
            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $mail->addAttachment($attachment);
                }
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);

            $mail->send();
            return true;
        } catch (PHPMailerException $e) {
            throw new \RuntimeException("Email sending failed: {$mail->ErrorInfo}", 0, $e);
        }
    }

    /**
     * Render an email template with variable substitution.
     *
     * @param array<string, mixed> $data
     */
    private function renderTemplate(string $templateName, array $data): string
    {
        $templateFile = "{$this->templatePath}/email/{$templateName}";

        if (!file_exists($templateFile)) {
            throw new \RuntimeException("Email template not found: {$templateName}");
        }

        $html = file_get_contents($templateFile);

        if ($html === false) {
            throw new \RuntimeException("Failed to read email template: {$templateName}");
        }

        foreach ($data as $key => $value) {
            if (is_string($value) || is_numeric($value)) {
                $html = str_replace("{{" . $key . "}}", (string) $value, $html);
            }
        }

        // Remove unreplaced placeholders
        $html = preg_replace('/\{\{[^}]+\}\}/', '', $html) ?? $html;

        return $html;
    }
}
