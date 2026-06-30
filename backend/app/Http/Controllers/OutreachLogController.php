<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\OutreachLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OutreachLogController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);

        $logs = OutreachLog::whereHas('campaign', function ($query) use ($tenantId) {
            $query->where('tenant_id', $tenantId);
        })
        ->with(['lead', 'campaign'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json($logs);
    }
}
