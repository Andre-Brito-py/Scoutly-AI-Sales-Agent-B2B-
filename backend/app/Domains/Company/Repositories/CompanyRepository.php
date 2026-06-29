<?php

namespace App\Domains\Company\Repositories;

use App\Domains\Company\Models\Company;
use Illuminate\Support\Collection;

class CompanyRepository implements CompanyRepositoryInterface
{
    public function findById(int $id): ?Company
    {
        return Company::find($id);
    }

    public function getByTenant(int $tenantId): Collection
    {
        return Company::where('tenant_id', $tenantId)->get();
    }

    public function create(array $data): Company
    {
        return Company::create($data);
    }

    public function update(Company $company, array $data): bool
    {
        return $company->update($data);
    }

    public function delete(Company $company): bool
    {
        return $company->delete();
    }
}
