<?php

namespace App\Domains\Company\Models;

use App\Domains\Tenant\Models\Tenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Company extends Model
{
    protected $fillable = [
        'tenant_id',
        'name',
        'website',
        'email',
        'phone',
        'address',
        'social_links',
        'google_rating',
        'google_reviews_count',
        'category',
        'estimated_size',
        'status',
    ];

    protected $casts = [
        'social_links' => 'array',
        'google_rating' => 'float',
        'google_reviews_count' => 'integer',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
