<?php

declare(strict_types=1);

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(dirname(__DIR__, 2));
$dotenv->safeLoad();

return [
    'app' => [
        'name' => $_ENV['APP_NAME'] ?? 'StockFlow',
        'env' => $_ENV['APP_ENV'] ?? 'development',
        'debug' => filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN),
        'url' => $_ENV['APP_URL'] ?? 'http://localhost:8080',
    ],
    'supabase' => [
        'url' => $_ENV['SUPABASE_URL'] ?? '',
        'anon_key' => $_ENV['SUPABASE_ANON_KEY'] ?? '',
        'service_role_key' => $_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? '',
        'jwt_secret' => $_ENV['SUPABASE_JWT_SECRET'] ?? '',
    ],
    'smtp' => [
        'host' => $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com',
        'port' => (int) ($_ENV['SMTP_PORT'] ?? 587),
        'username' => $_ENV['SMTP_USERNAME'] ?? '',
        'password' => $_ENV['SMTP_PASSWORD'] ?? '',
        'from_name' => $_ENV['SMTP_FROM_NAME'] ?? 'StockFlow',
        'from_email' => $_ENV['SMTP_FROM_EMAIL'] ?? 'noreply@stockflow.app',
    ],
    'razorpay' => [
        'key_id' => $_ENV['RAZORPAY_KEY_ID'] ?? '',
        'key_secret' => $_ENV['RAZORPAY_KEY_SECRET'] ?? '',
        'webhook_secret' => $_ENV['RAZORPAY_WEBHOOK_SECRET'] ?? '',
    ],
    'shipping' => [
        'webhook_secret' => $_ENV['SHIPPING_WEBHOOK_SECRET'] ?? '',
    ],
    'msg91' => [
        'auth_key' => $_ENV['MSG91_AUTH_KEY'] ?? '',
        'sender_id' => $_ENV['MSG91_SENDER_ID'] ?? 'STFLOW',
        'template_id' => $_ENV['MSG91_TEMPLATE_ID'] ?? '',
    ],
    'twilio' => [
        'account_sid' => $_ENV['TWILIO_ACCOUNT_SID'] ?? '',
        'auth_token' => $_ENV['TWILIO_AUTH_TOKEN'] ?? '',
        'whatsapp_number' => $_ENV['TWILIO_WHATSAPP_NUMBER'] ?? '',
    ],
    'cors' => [
        'allowed_origins' => array_filter(
            explode(',', $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'http://localhost:5173')
        ),
    ],
    'rate_limit' => [
        'max_requests' => (int) ($_ENV['RATE_LIMIT_MAX_REQUESTS'] ?? 100),
        'window_seconds' => (int) ($_ENV['RATE_LIMIT_WINDOW_SECONDS'] ?? 60),
    ],
    'storage' => [
        'path' => $_ENV['STORAGE_PATH'] ?? './storage',
        'pdf_path' => $_ENV['PDF_STORAGE_PATH'] ?? './storage/pdfs',
        'export_path' => $_ENV['EXPORT_STORAGE_PATH'] ?? './storage/exports',
    ],
    'company' => [
        'name' => $_ENV['COMPANY_NAME'] ?? 'StockFlow Pvt. Ltd.',
        'address' => $_ENV['COMPANY_ADDRESS'] ?? '',
        'gst' => $_ENV['COMPANY_GST'] ?? '',
        'phone' => $_ENV['COMPANY_PHONE'] ?? '',
        'email' => $_ENV['COMPANY_EMAIL'] ?? '',
        'bank_name' => $_ENV['COMPANY_BANK_NAME'] ?? '',
        'bank_account' => $_ENV['COMPANY_BANK_ACCOUNT'] ?? '',
        'bank_ifsc' => $_ENV['COMPANY_BANK_IFSC'] ?? '',
        'bank_branch' => $_ENV['COMPANY_BANK_BRANCH'] ?? '',
    ],
];
