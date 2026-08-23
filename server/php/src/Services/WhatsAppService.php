<?php

declare(strict_types=1);

namespace StockFlow\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class WhatsAppService
{
    private Client $client;
    private string $provider;

    // MSG91 config
    private string $msg91AuthKey;
    private string $msg91SenderId;
    private string $msg91TemplateId;

    // Twilio config
    private string $twilioAccountSid;
    private string $twilioAuthToken;
    private string $twilioWhatsAppNumber;

    public function __construct(
        string $provider = 'msg91',
        string $msg91AuthKey = '',
        string $msg91SenderId = '',
        string $msg91TemplateId = '',
        string $twilioAccountSid = '',
        string $twilioAuthToken = '',
        string $twilioWhatsAppNumber = ''
    ) {
        $this->provider = $provider;
        $this->msg91AuthKey = $msg91AuthKey;
        $this->msg91SenderId = $msg91SenderId;
        $this->msg91TemplateId = $msg91TemplateId;
        $this->twilioAccountSid = $twilioAccountSid;
        $this->twilioAuthToken = $twilioAuthToken;
        $this->twilioWhatsAppNumber = $twilioWhatsAppNumber;

        $this->client = new Client(['timeout' => 30]);
    }

    /**
     * Send a WhatsApp message.
     *
     * @param array<string, string> $templateVars
     */
    public function sendWhatsApp(string $to, string $message, array $templateVars = []): bool
    {
        return match ($this->provider) {
            'twilio' => $this->sendViaTwilio($to, $message),
            default => $this->sendViaMSG91($to, $message, $templateVars),
        };
    }

    /**
     * Send an SMS message.
     *
     * @param array<string, string> $templateVars
     */
    public function sendSMS(string $to, string $message, array $templateVars = []): bool
    {
        return match ($this->provider) {
            'twilio' => $this->sendSMSViaTwilio($to, $message),
            default => $this->sendSMSViaMSG91($to, $message, $templateVars),
        };
    }

    /**
     * Send WhatsApp via MSG91.
     *
     * @param array<string, string> $templateVars
     */
    private function sendViaMSG91(string $to, string $message, array $templateVars = []): bool
    {
        try {
            $payload = [
                'integrated_number' => $this->msg91SenderId,
                'content_type' => 'template',
                'payload' => [
                    'to' => $to,
                    'type' => 'template',
                    'template' => [
                        'name' => $this->msg91TemplateId,
                        'language' => ['code' => 'en'],
                        'components' => [
                            [
                                'type' => 'body',
                                'parameters' => array_map(
                                    fn($value) => ['type' => 'text', 'text' => $value],
                                    array_values($templateVars)
                                ),
                            ],
                        ],
                    ],
                    'messaging_product' => 'whatsapp',
                ],
            ];

            $this->client->post('https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/', [
                'headers' => [
                    'authkey' => $this->msg91AuthKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw new \RuntimeException("MSG91 WhatsApp send failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Send SMS via MSG91.
     *
     * @param array<string, string> $templateVars
     */
    private function sendSMSViaMSG91(string $to, string $message, array $templateVars = []): bool
    {
        try {
            $this->client->post('https://control.msg91.com/api/v5/flow/', [
                'headers' => [
                    'authkey' => $this->msg91AuthKey,
                    'Content-Type' => 'application/json',
                ],
                'json' => [
                    'template_id' => $this->msg91TemplateId,
                    'sender' => $this->msg91SenderId,
                    'mobiles' => $to,
                    'message' => $message,
                    ...$templateVars,
                ],
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw new \RuntimeException("MSG91 SMS send failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Send WhatsApp via Twilio.
     */
    private function sendViaTwilio(string $to, string $message): bool
    {
        try {
            $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->twilioAccountSid}/Messages.json";

            $this->client->post($url, [
                'auth' => [$this->twilioAccountSid, $this->twilioAuthToken],
                'form_params' => [
                    'From' => "whatsapp:{$this->twilioWhatsAppNumber}",
                    'To' => "whatsapp:{$to}",
                    'Body' => $message,
                ],
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Twilio WhatsApp send failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Send SMS via Twilio.
     */
    private function sendSMSViaTwilio(string $to, string $message): bool
    {
        try {
            $url = "https://api.twilio.com/2010-04-01/Accounts/{$this->twilioAccountSid}/Messages.json";

            $this->client->post($url, [
                'auth' => [$this->twilioAccountSid, $this->twilioAuthToken],
                'form_params' => [
                    'From' => $this->twilioWhatsAppNumber,
                    'To' => $to,
                    'Body' => $message,
                ],
            ]);

            return true;
        } catch (GuzzleException $e) {
            throw new \RuntimeException("Twilio SMS send failed: {$e->getMessage()}", 0, $e);
        }
    }
}
