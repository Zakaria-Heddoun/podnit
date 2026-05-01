<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    private const AVAILABLE_PERMISSIONS = [
        'view_dashboard' => 'View Dashboard',
        'view_orders' => 'View Orders',
        'manage_orders' => 'Manage Orders',
        'view_products' => 'View Products',
        'manage_products' => 'Manage Products',
        'view_users' => 'View Users',
        'manage_users' => 'Manage Users',
        'approve_templates' => 'Approve / Reject Templates',
        'approve_designs' => 'Approve Designs',
        'configure_site' => 'Site Configuration',
    ];

    public function index()
    {
        return response()->json([
            'data' => Role::all(),
        ]);
    }

    public function permissions()
    {
        return response()->json([
            'data' => self::AVAILABLE_PERMISSIONS,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:1000',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(self::AVAILABLE_PERMISSIONS)),
        ]);

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions ?? [],
        ]);

        return response()->json([
            'message' => 'Role created successfully',
            'data' => $role,
        ], 201);
    }

    public function show(Role $role)
    {
        return response()->json([
            'data' => $role,
        ]);
    }

    public function update(Request $request, Role $role)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'description' => 'nullable|string|max:1000',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:' . implode(',', array_keys(self::AVAILABLE_PERMISSIONS)),
        ]);

        $role->update([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $request->permissions ?? [],
        ]);

        return response()->json([
            'message' => 'Role updated successfully',
            'data' => $role,
        ]);
    }

    public function destroy(Role $role)
    {
        if ($role->users()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete a role that is assigned to users',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ]);
    }
}
