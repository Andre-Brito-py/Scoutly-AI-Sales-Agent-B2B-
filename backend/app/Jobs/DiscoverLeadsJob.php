<?php

namespace App\Jobs;

use App\Domains\Tenant\Models\Campaign;
use App\Domains\Company\Actions\SearchCompaniesAction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class DiscoverLeadsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Campaign $campaign;

    public function __construct(Campaign $campaign)
    {
        $this->campaign = $campaign;
    }

    public function handle(SearchCompaniesAction $searchAction): void
    {
        $this->campaign->update([
            'status' => 'running',
            'progress' => 15,
            'current_step' => 'Buscando empresas no segmento...',
        ]);

        // Define geographical and segment target filters
        $filters = [
            'segment' => $this->campaign->segment,
            'countries' => $this->campaign->countries,
            'states' => $this->campaign->states,
            'cities' => $this->campaign->cities,
        ];

        // Search companies using existing action
        $companies = $searchAction->execute($this->campaign->tenant_id, $filters);

        // Convert found companies into Leads targeting this campaign
        foreach ($companies as $company) {
            $lead = $this->campaign->leads()->firstOrCreate(
                ['website' => $company->website],
                [
                    'company_name' => $company->name,
                    'status' => 'found',
                ]
            );

            // Dispatch next step in pipeline for each lead
            EnrichWebsiteJob::dispatch($lead);
        }

        $this->campaign->update([
            'progress' => 30,
            'current_step' => 'Empresas identificadas, iniciando enriquecimento...',
        ]);
    }
}
