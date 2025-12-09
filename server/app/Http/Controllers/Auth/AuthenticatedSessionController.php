<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = Auth::user();
        
        // Create API token for the user
        $token = $user->createToken('api-token')->plainTextToken;
        
        // Return user data with token and role for frontend redirection
        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'brand_name' => $user->brand_name,
                // Seller fields
                'cin' => $user->cin,
                'bank_name' => $user->bank_name,
                'rib' => $user->rib,
                'balance' => $user->balance,
                'points' => $user->points,
                'referral_code' => $user->referral_code,
                'referred_by_id' => $user->referred_by_id,
                'is_verified' => $user->is_verified,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
            'redirect_url' => $user->isAdmin() ? '/admin/dashboard' : '/seller/dashboard'
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): JsonResponse
    {
        // Revoke all tokens for the user
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
