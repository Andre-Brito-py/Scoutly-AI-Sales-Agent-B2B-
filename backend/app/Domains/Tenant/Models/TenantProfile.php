<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TenantProfile extends Model
{
    protected $fillable = [
        'tenant_id',
        'company_name',
        'industry',
        'description',
        'value_proposition',
        'target_audience',
        'brand_voice',
        'objections_handling',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
