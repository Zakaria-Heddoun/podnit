<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminSellerController extends Controller
{
    /**
     * List all sellers
     */
    public function index(): JsonResponse
    {
        $sellers = User::where('role', 'seller')->orderBy('created_at', 'desc')->paginate(30);
        return response()->json([
            'success' => true,
            'data' => $sellers
        ]);
    }

    /**
     * Update seller info
     */
    public function update(Request $request, User $seller): JsonResponse
    {
        if ($seller->role !== 'seller') {
            return response()->json(['error' => 'User is not a seller'], 400);
        }
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:30',
            'brand_name' => 'nullable|string|max:255',
            'cin' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'rib' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:8',
            'balance' => 'nullable|numeric',
            'points' => 'nullable|integer',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }

        $seller->update($validated);
        
        return response()->json([
            'success' => true,
            'data' => $seller
        ]);
    }

    /**
     * Activate/deactivate seller
     */
    public function activate(Request $request, User $seller): JsonResponse
    {
        if ($seller->role !== 'seller') {
            return response()->json(['error' => 'User is not a seller'], 400);
        }
        $request->validate([
            'is_active' => 'required|boolean'
        ]);
        $seller->is_active = $request->is_active;
        $seller->save();
        return response()->json([
            'success' => true,
            'data' => $seller
        ]);
    }


    /**
     * Get seller specific product prices
     */
    public function getSellerProducts(Request $request, User $seller): JsonResponse
    {
        if ($seller->role !== 'seller') {
            return response()->json(['error' => 'User is not a seller'], 400);
        }

        $prices = \Illuminate\Support\Facades\DB::table('seller_product_prices')
            ->where('user_id', $seller->id)
            ->select('product_id', 'price')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $prices
        ]);
    }

    /**
     * Update seller specific product prices
     */
    public function updateSellerProducts(Request $request, User $seller): JsonResponse
    {
        if ($seller->role !== 'seller') {
            return response()->json(['error' => 'User is not a seller'], 400);
        }

        $validated = $request->validate([
            'products' => 'required|array',
            'products.*.product_id' => 'required|exists:products,id',
            'products.*.price' => 'required|numeric|min:0',
        ]);

        try {
            \Illuminate\Support\Facades\DB::beginTransaction();

            // We can choose to delete all representing this seller or upsert.
            // Upsert is safer if we only send partial updates, but the UI sends all modified ones.
            // Let's iterate and update/insert.
            
            foreach ($validated['products'] as $item) {
                \Illuminate\Support\Facades\DB::table('seller_product_prices')->updateOrInsert(
                    ['user_id' => $seller->id, 'product_id' => $item['product_id']],
                    ['price' => $item['price'], 'updated_at' => now(), 'created_at' => now()]
                );
            }

            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Prices updated successfully'
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollBack();
            return response()->json(['error' => 'Failed to update prices: ' . $e->getMessage()], 500);
        }
    }
}
