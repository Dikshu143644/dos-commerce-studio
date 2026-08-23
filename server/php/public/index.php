<?php

declare(strict_types=1);

use DI\Container;
use DI\ContainerBuilder;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;
use StockFlow\Controllers\EmailController;
use StockFlow\Controllers\ExcelController;
use StockFlow\Controllers\InvoiceController;
use StockFlow\Controllers\NotificationController;
use StockFlow\Controllers\ReportController;
use StockFlow\Controllers\WebhookController;
use StockFlow\Middleware\AuthMiddleware;
use StockFlow\Middleware\CorsMiddleware;
use StockFlow\Middleware\RateLimitMiddleware;
use StockFlow\Services\CronService;
use StockFlow\Services\EmailService;
use StockFlow\Services\ExcelService;
use StockFlow\Services\PaymentService;
use StockFlow\Services\PDFService;
use StockFlow\Services\SupabaseService;
use StockFlow\Services\WhatsAppService;

require __DIR__ . '/../vendor/autoload.php';

// Load configuration
$settings = require __DIR__ . '/../src/Config/settings.php';

// Build DI Container
$containerBuilder = new ContainerBuilder();

$containerBuilder->addDefinitions([
    'settings' => $settings,

    // Services
    SupabaseService::class => function (Container $c) {
        $settings = $c->get('settings');
        return new SupabaseService(
            $settings['supabase']['url'],
            $settings['supabase']['service_role_key']
        );
    },

    PDFService::class => function (Container $c) {
        $settings = $c->get('settings');
        $storagePath = realpath(__DIR__ . '/..') . '/storage/pdfs';
        $templatePath = realpath(__DIR__ . '/..') . '/src/Templates';
        return new PDFService($storagePath, $templatePath);
    },

    EmailService::class => function (Container $c) {
        $settings = $c->get('settings');
        $templatePath = realpath(__DIR__ . '/..') . '/src/Templates';
        return new EmailService(
            $settings['smtp']['host'],
            $settings['smtp']['port'],
            $settings['smtp']['username'],
            $settings['smtp']['password'],
            $settings['smtp']['from_name'],
            $settings['smtp']['from_email'],
            $templatePath
        );
    },

    ExcelService::class => function (Container $c) {
        $storagePath = realpath(__DIR__ . '/..') . '/storage/exports';
        return new ExcelService($storagePath);
    },

    WhatsAppService::class => function (Container $c) {
        $settings = $c->get('settings');
        return new WhatsAppService(
            'msg91',
            $settings['msg91']['auth_key'],
            $settings['msg91']['sender_id'],
            $settings['msg91']['template_id'],
            $settings['twilio']['account_sid'],
            $settings['twilio']['auth_token'],
            $settings['twilio']['whatsapp_number']
        );
    },

    PaymentService::class => function (Container $c) {
        $settings = $c->get('settings');
        return new PaymentService(
            $settings['razorpay']['key_id'],
            $settings['razorpay']['key_secret'],
            $settings['razorpay']['webhook_secret'],
            $c->get(SupabaseService::class)
        );
    },

    CronService::class => function () {
        return new CronService();
    },

    // Controllers
    InvoiceController::class => function (Container $c) {
        return new InvoiceController(
            $c->get(PDFService::class),
            $c->get(SupabaseService::class)
        );
    },

    ReportController::class => function (Container $c) {
        return new ReportController(
            $c->get(ExcelService::class),
            $c->get(PDFService::class),
            $c->get(SupabaseService::class)
        );
    },

    EmailController::class => function (Container $c) {
        return new EmailController($c->get(EmailService::class));
    },

    WebhookController::class => function (Container $c) {
        return new WebhookController(
            $c->get(PaymentService::class),
            $c->get(SupabaseService::class)
        );
    },

    NotificationController::class => function (Container $c) {
        return new NotificationController($c->get(WhatsAppService::class));
    },

    ExcelController::class => function (Container $c) {
        return new ExcelController(
            $c->get(ExcelService::class),
            $c->get(SupabaseService::class)
        );
    },

    // Middleware
    AuthMiddleware::class => function (Container $c) {
        $settings = $c->get('settings');
        return new AuthMiddleware($settings['supabase']['jwt_secret']);
    },

    CorsMiddleware::class => function (Container $c) {
        $settings = $c->get('settings');
        return new CorsMiddleware($settings['cors']['allowed_origins']);
    },

    RateLimitMiddleware::class => function (Container $c) {
        $settings = $c->get('settings');
        return new RateLimitMiddleware(
            $settings['rate_limit']['max_requests'],
            $settings['rate_limit']['window_seconds']
        );
    },
]);

$container = $containerBuilder->build();

// Create Slim App
AppFactory::setContainer($container);
$app = AppFactory::create();

// Parse JSON body
$app->addBodyParsingMiddleware();

// Global middleware
$app->add($container->get(RateLimitMiddleware::class));
$app->add($container->get(CorsMiddleware::class));

// Error handling
$app->addErrorMiddleware(
    $settings['app']['debug'],
    true,
    true
);

// Health check route (no auth required)
$app->get('/api/health', function (ServerRequestInterface $request, ResponseInterface $response) {
    $payload = [
        'success' => true,
        'message' => 'StockFlow PHP Backend is running',
        'data' => [
            'version' => '1.0.0',
            'php_version' => PHP_VERSION,
            'timestamp' => date('c'),
            'uptime' => 'OK',
        ],
    ];

    $response->getBody()->write(json_encode($payload, JSON_THROW_ON_ERROR));
    return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
});

// Public webhook routes (no auth - they verify their own signatures)
$app->post('/api/webhooks/razorpay', [WebhookController::class, 'razorpay']);
$app->post('/api/webhooks/shipping', [WebhookController::class, 'shipping']);

// Authenticated API routes
$app->group('/api', function (RouteCollectorProxy $group) {
    // Invoice routes
    $group->post('/invoices/generate', [InvoiceController::class, 'generate']);
    $group->post('/purchase-orders/pdf', [InvoiceController::class, 'purchaseOrderPdf']);

    // Report routes
    $group->post('/reports/stock', [ReportController::class, 'stockReport']);

    // Email routes
    $group->post('/email/send', [EmailController::class, 'send']);

    // Notification routes
    $group->post('/notifications/whatsapp', [NotificationController::class, 'whatsapp']);

    // Excel routes
    $group->post('/excel/import', [ExcelController::class, 'import']);
    $group->post('/excel/export/inventory', [ExcelController::class, 'exportInventory']);
})->add($container->get(AuthMiddleware::class));

// Run application
$app->run();
