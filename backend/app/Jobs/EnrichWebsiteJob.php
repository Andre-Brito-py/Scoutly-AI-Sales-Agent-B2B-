<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class EnrichWebsiteJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Lead $lead;

    public function __construct(Lead $lead)
    {
        $this->lead = $lead;
    }

    public function handle(): void
    {
        $campaign = $this->lead->campaign;
        $campaign->update([
            'progress' => 45,
            'current_step' => "Visitando site e enriquecendo dados de: {$this->lead->company_name}...",
        ]);

        $this->lead->update(['status' => 'enriched']);

        // Simulate contact identification (Founder, VP of Sales, etc.)
        // In production, integration with LinkedIn scraper, Hunter.io, or Apollo API goes here.
        $mockContacts = [
            ['name' => 'Sarah Jenkins', 'email' => 'sarah.jenkins@acme.com', 'role' => 'VP of Sales'],
            ['name' => 'Carlos Silva', 'email' => 'carlos@alphamkt.io', 'role' => 'Founder'],
            ['name' => 'Amanda Oliveira', 'email' => 'amanda@testenterprise.com', 'role' => 'Diretora Comercial'],
        ];

        // Select a mock contact randomly or default
        $contact = $mockContacts[array_rand($mockContacts)];

        $this->lead->update([
            'contact_name' => $contact['name'],
            'contact_email' => $contact['email'],
            'contact_role' => $contact['role'],
            'status' => 'enriched',
        ]);

        // Dispatch Qualification & Scoring Job
        CalculateLeadScoreJob::dispatch($this->lead);
    }
}
