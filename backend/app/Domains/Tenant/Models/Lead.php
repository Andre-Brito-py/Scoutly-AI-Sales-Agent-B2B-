<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    protected $fillable = [
        'campaign_id',
        'company_name',
        'website',
        'score',
        'score_reason',
        'contact_name',
        'contact_email',
        'contact_role',
        'status',
        'personalized_message',
    ];

    protected $casts = [
        'score' => 'integer',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }
}
