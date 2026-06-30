<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\Campaign;
use App\Jobs\DiscoverLeadsJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CampaignController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);
        $campaigns = Campaign::where('tenant_id', $tenantId)->with('targetProduct')->get();
        return response()->json($campaigns);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'segment' => 'required|string|max:255',
            'countries' => 'required|array',
            'states' => 'nullable|array',
            'cities' => 'nullable|string',
            'language' => 'required|string',
            'target_product_id' => 'required|exists:products,id',
            'limit_daily' => 'required|integer|min:1',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['status'] = 'idle';
        $validated['progress'] = 0;
        $validated['current_step'] = 'Pronto para iniciar';

        $campaign = Campaign::create($validated);

        return response()->json($campaign, 201);
    }

    public function start(Campaign $campaign): JsonResponse
    {
        // Dispatches the background worker chain
        DiscoverLeadsJob::dispatch($campaign);

        $campaign->update([
            'status' => 'running',
            'current_step' => 'Buscando empresas no segmento...',
            'progress' => 5,
        ]);

        return response()->json([
            'message' => 'Campanha comercial autônoma iniciada com sucesso!',
            'campaign' => $campaign
        ]);
    }
}
