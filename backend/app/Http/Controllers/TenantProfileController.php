<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\TenantProfile;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TenantProfileController
{
    public function show(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);
        $profile = TenantProfile::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'company_name' => 'Default Startup',
                'industry' => 'Technology',
                'description' => 'Describe your company here...',
                'value_proposition' => 'Our value prop...',
                'target_audience' => 'B2B Customers',
                'brand_voice' => 'Professional',
            ]
        );

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);
        $profile = TenantProfile::where('tenant_id', $tenantId)->firstOrFail();

        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'industry' => 'required|string|max:255',
            'description' => 'required|string',
            'value_proposition' => 'required|string',
            'target_audience' => 'required|string',
            'brand_voice' => 'required|string',
            'objections_handling' => 'nullable|string',
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'profile' => $profile
        ]);
    }
}
