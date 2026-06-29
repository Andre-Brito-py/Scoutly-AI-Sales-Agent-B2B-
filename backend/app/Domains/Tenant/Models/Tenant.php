<?php

namespace App\Domains\Tenant\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Tenant extends Model
{
    protected $fillable = [
        'name',
        'domain',
        'api_key',
    ];

    public function profile(): HasOne
    {
        return $this->hasOne(TenantProfile::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
