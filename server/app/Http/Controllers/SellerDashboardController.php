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
            'email' => 'required|string|email|max:255|unique:users,email,' . auth()->id(),
        ]);

        $user = auth()->user();
        $user->update($request->only(['name', 'email']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $user
        ]);
    }
}
