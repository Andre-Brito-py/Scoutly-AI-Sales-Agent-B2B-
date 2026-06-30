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

class SendOutreachTelegramJob implements ShouldQueue
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
        $token = $this->apiKeys['telegram_token'] ?? null;
        $chatId = $this->apiKeys['telegram_chat_id'] ?? null;

        if (!$token || !$chatId) {
            Log::warning("Skipping real Telegram outreach for Lead ID {$this->lead->id}: Bot token or Chat ID is missing.");
            return;
        }

        $url = "https://api.telegram.org/bot{$token}/sendMessage";

        // Dispatch HTTP call to official Telegram Bot API
        $response = Http::post($url, [
            'chat_id' => $chatId,
            'text' => "*[Scoutly Outreach]*\n\nAbordagem para *{$this->lead->company_name}* (Contato: {$this->lead->contact_name} - {$this->lead->contact_role}):\n\n{$this->lead->personalized_message}",
            'parse_mode' => 'Markdown'
        ]);

        if ($response->successful()) {
            Log::info("Outreach Telegram message sent to chat {$chatId}.");
        } else {
            Log::error("Failed to send Telegram message: " . $response->body());
        }
    }
}
