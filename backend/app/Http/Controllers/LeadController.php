<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\Lead;
use App\Domains\Tenant\Models\Campaign;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LeadController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);

        // Fetch leads belonging to campaigns within this tenant
        $leads = Lead::whereHas('campaign', function ($query) use ($tenantId) {
            $query->where('tenant_id', $tenantId);
        })->orderBy('score', 'desc')->get();

        return response()->json($leads);
    }
}
