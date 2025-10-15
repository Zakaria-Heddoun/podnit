<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Get current authenticated user information
     */
    public function show(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'message' => 'User information',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /**
     * Get user's dashboard redirect URL based on role
     */
    public function getRedirectUrl(): JsonResponse
    {
        $user = auth()->user();
        $redirectUrl = $user->isAdmin() ? '/admin/dashboard' : '/seller/dashboard';

        return response()->json([
            'message' => 'Dashboard URL',
            'data' => [
                'redirect_url' => $redirectUrl,
                'role' => $user->role
            ]
        ]);
    }
}
