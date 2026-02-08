<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SellerDashboardController extends Controller
{
    /**
     * Display seller dashboard data
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();
        
        return response()->json([
            'message' => 'Seller dashboard data',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                ],
                'stats' => [
                    'total_products' => 0, // Placeholder for future product functionality
                    'total_orders' => 0,   // Placeholder for future order functionality
                    'total_revenue' => 0,  // Placeholder for future revenue functionality
                ],
            ]
        ]);
    }

    /**
     * Get seller profile
     */
    public function profile(): JsonResponse
    {
        $user = auth()->user();

        // Ensure seller has a referral code
        if ($user->isSeller()) {
            $user->ensureReferralCode();
        }

        return response()->json([
            'message' => 'Seller profile',
            'data' => $user
        ]);
    }

    /**
     * Update seller profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'brand_name' => 'nullable|string|max:255',
            'cin' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:100',
            // Email and RIB are not editable
        ]);

        $user = auth()->user();
        $user->update($request->only([
            'name', 'phone', 'brand_name', 'cin', 'bank_name'
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $user->fresh()
        ]);
    }
}
