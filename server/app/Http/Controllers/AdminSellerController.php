<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

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

        // Auto-activate seller if balance is greater than or equal to 200
        if (isset($validated['balance']) && $validated['balance'] >= 200) {
            $validated['is_active'] = true;
        }

        $seller->update($validated);
        
        return response()->json([
            'success' => true,
            'data' => $seller,
            'message' => isset($validated['balance']) && $validated['balance'] >= 200 ? 'Seller activated due to balance >= 200' : null
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
        
        // If deactivating, revoke all tokens to force logout
        if (!$request->is_active) {
            $seller->tokens()->delete();

            // Also attempt to clear any active sessions for this user so they're immediately logged out.
            try {
                $sessions = DB::table('sessions');

                if (Schema::hasColumn('sessions', 'user_id')) {
                    $sessions->where('user_id', $seller->id)->delete();
                } else {
                    // Fallback: delete any session rows whose payload contains the user id
                    // This is a best-effort attempt; payload formats may vary.
                    $like = '%"' . $seller->id . '"%';
                    $sessions->where('payload', 'like', $like)->delete();
                }
            } catch (\Exception $e) {
                Log::warning('Failed to clear sessions for seller ' . $seller->id . ': ' . $e->getMessage());
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $seller
        ]);
    }

    /**
     * Force logout seller by revoking all tokens
     */
    public function logout(User $seller): JsonResponse
    {
        if ($seller->role !== 'seller') {
            return response()->json(['error' => 'User is not a seller'], 400);
        }
        
        // Revoke all tokens
        $seller->tokens()->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Seller has been logged out successfully'
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
