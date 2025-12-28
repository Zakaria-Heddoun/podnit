<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class AdminEmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::orderBy('created_at', 'desc')->paginate(50);
        return response()->json(['message' => 'Employees list', 'data' => $users]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $roleId = $request->input('role_id');
        $roleName = null;
        if ($roleId) {
            $role = Role::find($roleId);
            $roleName = $role ? $role->name : null;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $roleName ?? 'staff',
            'role_id' => $roleId,
            'is_active' => true,
        ]);

        return response()->json(['message' => 'Employee created', 'data' => $user], 201);
    }
}
