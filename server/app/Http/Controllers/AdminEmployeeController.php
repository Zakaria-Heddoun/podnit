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

    public function update(Request $request, User $employee): JsonResponse
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email',
            'password' => 'sometimes|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
            'balance' => 'nullable|numeric|min:0',
        ]);

        $validated = $request->all();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Auto-activate employee if balance is greater than or equal to 200
        if (isset($validated['balance']) && $validated['balance'] >= 200) {
            $validated['is_active'] = true;
        }

        if (isset($validated['role_id'])) {
            $role = Role::find($validated['role_id']);
            $validated['role'] = $role ? $role->name : null;
        }

        $employee->update($validated);

        $message = isset($validated['balance']) && $validated['balance'] >= 200 ? 'Employee updated and activated (balance >= 200)' : 'Employee updated';

        return response()->json(['message' => $message, 'data' => $employee]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role_id' => 'nullable|exists:roles,id',
            'balance' => 'nullable|numeric|min:0',
        ]);

        $roleId = $request->input('role_id');
        $roleName = null;
        if ($roleId) {
            $role = Role::find($roleId);
            $roleName = $role ? $role->name : null;
        }

        $balance = $request->input('balance', 0);
        $isActive = $balance >= 200; // Auto-activate if balance >= 200

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $roleName ?? 'staff',
            'role_id' => $roleId,
            'balance' => $balance,
            'is_active' => $isActive,
        ]);

        $message = $isActive ? 'Employee created and activated (balance >= 200)' : 'Employee created';

        return response()->json(['message' => $message, 'data' => $user], 201);
    }
}
