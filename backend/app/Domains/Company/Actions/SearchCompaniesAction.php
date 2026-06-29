<?php

namespace App\Domains\Company\Actions;

use App\Domains\Company\Services\CompanyService;
use Illuminate\Support\Collection;

class SearchCompaniesAction
{
    protected CompanyService $companyService;

    public function __construct(CompanyService $companyService)
    {
        $this->companyService = $companyService;
    }

    public function execute(int $tenantId, array $searchFilters): Collection
    {
        $results = collect();

        // Simulate B2B Search Agent behavior: query directories, Map APIs, or social data
        $mockedData = [
            [
                'name' => 'Acme SaaS Corp',
                'website' => 'https://acmesaas.com',
                'category' => $searchFilters['segment'] ?? 'Software',
                'estimated_size' => '50-100',
                'status' => 'found',
            ],
            [
                'name' => 'Beta Logistics',
                'website' => 'https://betalogistics.com.br',
                'category' => $searchFilters['segment'] ?? 'Logistics',
                'estimated_size' => '100-200',
                'status' => 'found',
            ]
        ];

        foreach ($mockedData as $item) {
            $results->push($this->companyService->findOrCreateCompany($tenantId, $item));
        }

        return $results;
    }
}
