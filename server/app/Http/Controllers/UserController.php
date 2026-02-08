<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * Get current authenticated user information
     */
    public function show(): JsonResponse
    {
        $user = auth()->user();
        
        // Load role relationship if user has a role_id
        if ($user->role_id) {
            $user->load('roleRelation');
        }
        
        // Ensure seller has a referral code
        if ($user->isSeller()) {
            $user->ensureReferralCode();
        }
        
        // Get permissions if user has a role
        $permissions = [];
        if ($user->roleRelation) {
            $permissions = $user->roleRelation->permissions ?? [];
        }

        return response()->json([
            'message' => 'User information',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'role_id' => $user->role_id,
                'phone' => $user->phone,
                'brand_name' => $user->brand_name,
                'cin' => $user->cin,
                'account_holder' => $user->account_holder,
                'bank_name' => $user->bank_name,
                'rib' => $user->rib,
                'balance' => $user->balance,
                'points' => $user->points,
                'referral_code' => $user->referral_code,
                'referred_by_id' => $user->referred_by_id,
                'is_verified' => $user->is_verified,
                'permissions' => $permissions,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ]
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Base validation rules (email is not editable)
        $rules = [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ];

        // Add seller-specific validation rules
        if ($user->role === 'seller') {
            $rules = array_merge($rules, [
                'brand_name' => 'nullable|string|max:255',
                'cin' => 'nullable|string|max:20',
                // bank_name, account_holder, and RIB are not editable after being set
            ]);
        }

        $request->validate($rules);

        // Fields allowed for all users (email is not editable)
        $allowedFields = ['name', 'phone'];

        // Add seller-specific fields (bank_name, account_holder, and RIB are not editable after being set)
        if ($user->role === 'seller') {
            $allowedFields = array_merge($allowedFields, [
                'brand_name', 'cin'
            ]);
        }

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            $request->validate([
                'avatar' => 'image|mimes:jpeg,png,jpg,gif,svg|max:2048'
            ]);

            // Delete old avatar if exists
            if ($user->avatar && file_exists(public_path(ltrim($user->avatar, '/')))) {
                unlink(public_path(ltrim($user->avatar, '/')));
            }

            $file = $request->file('avatar');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('images/user'), $filename);

            // Update avatar directly
            $user->avatar = '/images/user/' . $filename;
            $user->save();
        }

        $user->update($request->only($allowedFields));

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => $user->fresh()
        ]);
    }

    /**
     * Update user password
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = auth()->user();

        // Check if current password is correct
        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Get user's dashboard redirect URL based on role
     */
    public function getRedirectUrl(): JsonResponse
    {
        $user = auth()->user();
        
        // Determine redirect URL based on role
        $redirectUrl = '/dashboard';
        if ($user->isAdmin()) {
            $redirectUrl = '/admin';
        } elseif ($user->isSeller()) {
            $redirectUrl = '/seller/dashboard';
        } elseif ($user->role_id) {
            // Employee with custom role
            $redirectUrl = '/employee/dashboard';
        }

        return response()->json([
            'message' => 'Dashboard URL',
            'data' => [
                'redirect_url' => $redirectUrl,
                'role' => $user->role,
                'role_id' => $user->role_id
            ]
        ]);
    }
}
