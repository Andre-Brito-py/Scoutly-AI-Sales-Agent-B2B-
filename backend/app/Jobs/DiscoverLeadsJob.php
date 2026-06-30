<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Campaign;
use App\Domains\Company\Actions\SearchCompaniesAction;
use Illuminate\Support\Facades\Http;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DiscoverLeadsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Campaign $campaign;
    protected array $apiKeys;

    public function __construct(Campaign $campaign, array $apiKeys = [])
    {
        $this->campaign = $campaign;
        $this->apiKeys = $apiKeys;
    }

    public function handle(SearchCompaniesAction $searchAction): void
    {
        $this->campaign->update([
            'status' => 'running',
            'progress' => 15,
            'current_step' => 'Buscando empresas no segmento...',
        ]);

        $apolloKey = $this->apiKeys['apollo'] ?? null;
        $leadsFound = [];

        if ($apolloKey) {
            // Live query to Apollo.io mixed people search endpoint
            $response = Http::withHeaders([
                'Cache-Control' => 'no-cache',
                'Content-Type' => 'application/json',
                'X-Api-Key' => $apolloKey
            ])->post('https://api.apollo.io/v1/mixed_people/search', [
                'q_organization_keyword_tags' => [$this->campaign->segment],
                'person_locations' => $this->campaign->countries,
                'person_titles' => ['CEO', 'Founder', 'VP of Sales', 'Diretor Comercial', 'Sales Director'],
                'page' => 1,
                'per_page' => 5
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $people = $data['people'] ?? [];
                foreach ($people as $person) {
                    $org = $person['organization'] ?? [];
                    $leadsFound[] = [
                        'name' => $org['name'] ?? 'Empresa Desconhecida',
                        'website' => $org['primary_domain'] ? 'https://' . $org['primary_domain'] : 'https://example.com',
                        'contact_name' => $person['name'] ?? 'Tomador de Decisão',
                        'contact_email' => $person['email'] ?? ($person['primary_email']['email'] ?? null),
                        'contact_phone' => $person['phone_numbers'][0]['raw_number'] ?? ($org['phone'] ?? null),
                        'contact_role' => $person['title'] ?? 'Executivo'
                    ];
                }
            }
        }

        // Fallback to SearchCompaniesAction mock if Apollo returned nothing or key is absent
        if (empty($leadsFound)) {
            $filters = [
                'segment' => $this->campaign->segment,
                'countries' => $this->campaign->countries,
                'states' => $this->campaign->states,
                'cities' => $this->campaign->cities,
            ];
            $companies = $searchAction->execute($this->campaign->tenant_id, $filters);
            foreach ($companies as $company) {
                $leadsFound[] = [
                    'name' => $company->name,
                    'website' => $company->website,
                    'contact_name' => null,
                    'contact_email' => null,
                    'contact_phone' => null,
                    'contact_role' => null
                ];
            }
        }

        // Convert parsed raw data into leads records
        foreach ($leadsFound as $item) {
            $lead = $this->campaign->leads()->firstOrCreate(
                ['website' => $item['website']],
                [
                    'company_name' => $item['name'],
                    'contact_name' => $item['contact_name'],
                    'contact_email' => $item['contact_email'],
                    'contact_phone' => $item['contact_phone'] ?? null,
                    'contact_role' => $item['contact_role'],
                    'status' => 'found',
                ]
            );

            // Dispatch next step in pipeline passing along the API Keys
            EnrichWebsiteJob::dispatch($lead, $this->apiKeys);
        }

        $this->campaign->update([
            'progress' => 30,
            'current_step' => 'Empresas identificadas, iniciando enriquecimento...',
        ]);
    }
}
