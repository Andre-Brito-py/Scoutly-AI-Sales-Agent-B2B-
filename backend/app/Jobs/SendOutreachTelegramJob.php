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

        $campaign = $this->lead->campaign;

        if (!$token || !$chatId) {
            Log::warning("Skipping real Telegram outreach for Lead ID {$this->lead->id}: Bot token or Chat ID is missing.");
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'telegram',
                'recipient' => $chatId ?? 'Desconhecido',
                'message_content' => $this->lead->personalized_message,
                'status' => 'failed',
                'error_message' => 'Telegram parameters missing',
            ]);
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
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'telegram',
                'recipient' => $chatId,
                'message_content' => $this->lead->personalized_message,
                'status' => 'sent',
            ]);
        } else {
            $errorMsg = $response->body();
            Log::error("Failed to send Telegram message: " . $errorMsg);
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'telegram',
                'recipient' => $chatId,
                'message_content' => $this->lead->personalized_message,
                'status' => 'failed',
                'error_message' => $errorMsg,
            ]);
        }
    }
}
