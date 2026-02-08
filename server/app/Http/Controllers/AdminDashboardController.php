<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Display admin dashboard data
     */
    public function index(): JsonResponse
    {
        $totalUsers = User::count();
        $totalSellers = User::where('role', 'seller')->count();
        $totalAdmins = User::where('role', 'admin')->count();
        
        $recentUsers = User::latest()->take(10)->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json([
            'message' => 'Admin dashboard data',
            'data' => [
                'stats' => [
                    'total_users' => $totalUsers,
                    'total_sellers' => $totalSellers,
                    'total_admins' => $totalAdmins,
                ],
                'recent_users' => $recentUsers,
            ]
        ]);
    }

    /**
     * Get all users for admin management
     */
    public function users(): JsonResponse
    {
        $users = User::orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'message' => 'Users list',
            'data' => $users
        ]);
    }

    /**
     * Update user role (admin only)
     */
    public function updateUserRole(Request $request, User $user): JsonResponse
    {
        // Support both legacy role string and new role_id
        $request->validate([
            'role' => 'nullable|string',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        if ($request->filled('role_id')) {
            $roleModel = \App\Models\Role::find($request->role_id);
            if ($roleModel) {
                $user->role_id = $roleModel->id;
                $user->role = $roleModel->name; // keep legacy string in sync
            }
        } elseif ($request->filled('role')) {
            // simple legacy support for 'admin' and 'seller' strings
            $user->role = $request->role;
            $user->role_id = null;
        }

        $user->save();

        return response()->json([
            'message' => 'User role updated successfully',
            'data' => $user
        ]);
    }
}
