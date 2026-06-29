<?php

namespace App\Http\Controllers;

use App\Domains\Tenant\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController
{
    public function index(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);
        $products = Product::where('tenant_id', $tenantId)->get();

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $tenantId = $request->header('X-Tenant-ID', 1);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'features' => 'nullable|array',
            'target_buyer' => 'nullable|string',
            'pricing_model' => 'nullable|string',
        ]);

        $validated['tenant_id'] = $tenantId;
        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product saved successfully',
            'product' => $product
        ], 201);
    }
}
