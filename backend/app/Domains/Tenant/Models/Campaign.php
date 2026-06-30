<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'segment',
        'countries',
        'states',
        'cities',
        'language',
        'target_product_id',
        'limit_daily',
        'status',
        'progress',
        'current_step',
    ];

    protected $casts = [
        'countries' => 'array',
        'states' => 'array',
        'limit_daily' => 'integer',
        'progress' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function targetProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'target_product_id');
    }

    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    public function abTests(): HasMany
    {
        return $this->hasMany(AbTest::class);
    }
}
