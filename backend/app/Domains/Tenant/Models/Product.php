<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'features',
        'target_buyer',
        'pricing_model',
    ];

    protected $casts = [
        'features' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
