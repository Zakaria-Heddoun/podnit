<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

class AdminRoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::orderBy('name')->get();
        return response()->json(['message' => 'Roles list', 'data' => $roles]);
    }

    /**
     * Return available permission keys and labels from config
     */
    public function permissions(): JsonResponse
    {
        $perms = Config::get('roles.permissions', []);
        return response()->json(['message' => 'Available permissions', 'data' => $perms]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        // Filter permissions to only allowed keys
        $allowed = array_keys(Config::get('roles.permissions', []));
        $requested = $request->input('permissions', []);
        $filtered = [];
        if (is_array($requested)) {
            foreach ($requested as $p) {
                if (in_array($p, $allowed, true)) {
                    $filtered[] = $p;
                }
            }
        }

        $role = Role::create([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $filtered,
        ]);

        return response()->json(['message' => 'Role created', 'data' => $role], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $allowed = array_keys(Config::get('roles.permissions', []));
        $requested = $request->input('permissions', []);
        $filtered = [];
        if (is_array($requested)) {
            foreach ($requested as $p) {
                if (in_array($p, $allowed, true)) {
                    $filtered[] = $p;
                }
            }
        }

        $role->update([
            'name' => $request->name,
            'description' => $request->description,
            'permissions' => $filtered,
        ]);

        return response()->json(['message' => 'Role updated', 'data' => $role]);
    }

    public function destroy(Role $role): JsonResponse
    {
        // Detach role from users (set role_id null) before deleting
        User::where('role_id', $role->id)->update(['role_id' => null, 'role' => '']);
        $role->delete();
        return response()->json(['message' => 'Role deleted']);
    }
}
