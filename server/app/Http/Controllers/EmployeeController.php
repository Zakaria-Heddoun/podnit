<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class EmployeeController extends Controller
{
    public function index()
    {
        $employees = User::where('role', 'employee')
            ->with('roleRelation:id,name')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'first_name', 'last_name', 'email', 'role', 'role_id', 'is_active', 'created_at']);

        return response()->json([
            'data' => $employees,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $nameParts = explode(' ', $request->name, 2);

        $employee = User::create([
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? '',
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'employee',
            'role_id' => $request->role_id,
            'is_active' => true,
        ]);

        $employee->load('roleRelation:id,name');

        return response()->json([
            'message' => 'Employee created successfully',
            'data' => $employee,
        ], 201);
    }

    public function show(User $employee)
    {
        $employee->load('roleRelation:id,name');

        return response()->json([
            'data' => $employee,
        ]);
    }

    public function update(Request $request, User $employee)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $employee->id,
            'password' => ['sometimes', Rules\Password::defaults()],
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'sometimes|boolean',
        ]);

        $data = $request->only(['name', 'email', 'role_id', 'is_active']);

        if ($request->filled('name')) {
            $parts = explode(' ', $request->name, 2);
            $data['first_name'] = $parts[0];
            $data['last_name'] = $parts[1] ?? '';
        }

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $employee->update($data);
        $employee->load('roleRelation:id,name');

        return response()->json([
            'message' => 'Employee updated successfully',
            'data' => $employee,
        ]);
    }

    public function destroy(User $employee)
    {
        $employee->delete();

        return response()->json([
            'message' => 'Employee deleted successfully',
        ]);
    }
}
