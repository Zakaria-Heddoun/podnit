<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Get the authenticated User.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $user->toArray();

        $permissions = [];
        if ($user->roleRelation) {
            $permissions = $user->roleRelation->permissions ?? [];
        }
        $data['permissions'] = $permissions;

        return response()->json($data);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'brand_name' => 'nullable|string|max:255',
            'cin' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:255',
            'rib' => 'nullable|string|size:24',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password does not match your current password.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Get the redirect URL based on user role.
     */
    public function getRedirectUrl(Request $request): JsonResponse
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            return response()->json(['url' => '/admin/dashboard']);
        } elseif ($user->role === 'seller') {
            return response()->json(['url' => '/seller/dashboard']);
        } elseif ($user->role === 'employee') {
            return response()->json(['url' => '/employee/dashboard']);
        }
        
        return response()->json(['url' => '/']);
    }
}
