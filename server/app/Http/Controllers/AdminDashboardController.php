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
        $request->validate([
            'role' => 'required|in:admin,seller'
        ]);

        $user->update(['role' => $request->role]);

        return response()->json([
            'message' => 'User role updated successfully',
            'data' => $user
        ]);
    }
}
