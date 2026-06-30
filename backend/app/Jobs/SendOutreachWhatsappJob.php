<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendOutreachWhatsappJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Lead $lead;
    protected array $apiKeys;

    public function __construct(Lead $lead, array $apiKeys = [])
    {
        $this->lead = $lead;
        $this->apiKeys = $apiKeys;
    }

    public function handle(): void
    {
        $token = $this->apiKeys['whatsapp_token'] ?? null;
        $instance = $this->apiKeys['whatsapp_instance'] ?? null;

        if (!$token || !$instance) {
            Log::warning("Skipping real WhatsApp sending for Lead ID {$this->lead->id}: token or instance URL is missing.");
            return;
        }

        // Clean URL trailing slash and set correct endpoint
        $instanceUrl = rtrim($instance, '/') . '/message/sendText';

        // Clean phone number from non-numeric characters for WhatsApp format
        $cleanPhone = preg_replace('/[^0-9]/', '', $this->lead->contact_phone);

        // Make HTTP request call to active WhatsApp instance
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
            'apikey' => $token
        ])->post($instanceUrl, [
            'number' => $cleanPhone,
            'options' => [
                'delay' => 1200,
                'presence' => 'composing'
            ],
            'textMessage' => [
                'text' => $this->lead->personalized_message
            ]
        ]);

        if ($response->successful()) {
            Log::info("Outreach WhatsApp message sent successfully to {$cleanPhone}.");
        } else {
            Log::error("Failed to send WhatsApp message to {$cleanPhone}: " . $response->body());
        }
    }
}
