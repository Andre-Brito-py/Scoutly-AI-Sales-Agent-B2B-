<?php

namespace App\Domains\Company\Repositories;

use App\Domains\Company\Models\Company;
use Illuminate\Support\Collection;

interface CompanyRepositoryInterface
{
    public function findById(int $id): ?Company;
    
    public function getByTenant(int $tenantId): Collection;
    
    public function create(array $data): Company;
    
    public function update(Company $company, array $data): bool;
    
    public function delete(Company $company): bool;
}
