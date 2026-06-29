<?php

namespace App\Domains\Company\Services;

use App\Domains\Company\Repositories\CompanyRepositoryInterface;
use App\Domains\Company\Models\Company;

class CompanyService
{
    protected CompanyRepositoryInterface $companyRepository;

    public function __construct(CompanyRepositoryInterface $companyRepository)
    {
        $this->companyRepository = $companyRepository;
    }

    public function findOrCreateCompany(int $tenantId, array $companyData): Company
    {
        $existing = Company::where('tenant_id', $tenantId)
            ->where('website', $companyData['website'] ?? '')
            ->first();

        if ($existing) {
            return $existing;
        }

        $companyData['tenant_id'] = $tenantId;
        return $this->companyRepository->create($companyData);
    }
}
