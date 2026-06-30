<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AbTest extends Model
{
    protected $table = 'ab_tests';

    protected $fillable = [
        'campaign_id',
        'variant_name',
        'send_count',
        'conversion_count',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
