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

class SendOutreachEmailJob implements ShouldQueue
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
        $resendKey = $this->apiKeys['resend'] ?? null;
        $campaign = $this->lead->campaign;
        $tenantProfile = $campaign->tenant->profile;

        if (!$resendKey) {
            Log::warning("Skipping real email sending for Lead ID {$this->lead->id}: Resend key is missing.");
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'email',
                'recipient' => $this->lead->contact_email,
                'message_content' => $this->lead->personalized_message,
                'status' => 'failed',
                'error_message' => 'Resend API Key is missing',
            ]);
            return;
        }

        // Send active HTTP request to Resend API
        $response = Http::withToken($resendKey)->post('https://api.resend.com/emails', [
            'from' => "SDR <sdr@scoutly.ai>", // Modify to matching verified Resend sender domain
            'to' => [$this->lead->contact_email],
            'subject' => "Abordagem Comercial: Otimização comercial para {$this->lead->company_name}",
            'text' => $this->lead->personalized_message
        ]);

        if ($response->successful()) {
            $this->lead->update(['status' => 'sent']);
            Log::info("Outreach email successfully sent to {$this->lead->contact_email} via Resend.");
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'email',
                'recipient' => $this->lead->contact_email,
                'message_content' => $this->lead->personalized_message,
                'status' => 'sent',
            ]);
        } else {
            $errorMsg = $response->body();
            Log::error("Failed to send outreach email to {$this->lead->contact_email}: " . $errorMsg);
            \App\Domains\Tenant\Models\OutreachLog::create([
                'lead_id' => $this->lead->id,
                'campaign_id' => $campaign->id,
                'channel' => 'email',
                'recipient' => $this->lead->contact_email,
                'message_content' => $this->lead->personalized_message,
                'status' => 'failed',
                'error_message' => $errorMsg,
            ]);
        }
    }
}
