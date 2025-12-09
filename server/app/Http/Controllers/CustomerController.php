<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Get all customers for the authenticated seller.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $query = Customer::where('user_id', $user->id);

            // Search functionality
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            
            $allowedSortFields = ['name', 'email', 'total_orders', 'total_spent', 'last_order_date', 'created_at'];
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = 'created_at';
            }

            $customers = $query->orderBy($sortBy, $sortOrder)
                              ->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => $customers,
                'message' => 'Customers retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching customers:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customers'
            ], 500);
        }
    }

    /**
     * Store a new customer.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('customers')->where(function ($query) use ($user) {
                        return $query->where('user_id', $user->id);
                    })
                ],
                'phone' => 'required|string|max:20',
                'notes' => 'nullable|string|max:1000'
            ]);

            $customer = Customer::create([
                'user_id' => $user->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'notes' => $validated['notes'] ?? null
            ]);

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer created successfully'
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating customer:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error creating customer'
            ], 500);
        }
    }

    /**
     * Display the specified customer.
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $customer = Customer::where('user_id', $user->id)
                               ->where('id', $id)
                               ->with('orders:id,customer_id,order_number,total_amount,status,created_at')
                               ->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching customer:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customer'
            ], 500);
        }
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $customer = Customer::where('user_id', $user->id)->where('id', $id)->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => [
                    'required',
                    'email',
                    Rule::unique('customers')->where(function ($query) use ($user) {
                        return $query->where('user_id', $user->id);
                    })->ignore($customer->id)
                ],
                'phone' => 'required|string|max:20',
                'notes' => 'nullable|string|max:1000'
            ]);

            $customer->update($validated);

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => 'Customer updated successfully'
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating customer:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error updating customer'
            ], 500);
        }
    }

    /**
     * Remove the specified customer.
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $customer = Customer::where('user_id', $user->id)->where('id', $id)->first();

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found'
                ], 404);
            }

            // Check if customer has orders
            if ($customer->orders()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete customer with existing orders'
                ], 422);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting customer:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error deleting customer'
            ], 500);
        }
    }

    /**
     * Create or find customer from order data.
     */
    public function createOrFind(Request $request)
    {
        try {
            $user = Auth::user();
            
            if (!$user || $user->role !== 'seller') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access'
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20',
                'notes' => 'nullable|string|max:1000'
            ]);

            // Try to find existing customer by email
            $customer = Customer::where('user_id', $user->id)
                               ->where('email', $validated['email'])
                               ->first();

            if ($customer) {
                // Update customer info if different
                $customer->update([
                    'name' => $validated['name'],
                    'phone' => $validated['phone'],
                    'notes' => $validated['notes']
                ]);
            } else {
                // Create new customer
                $customer = Customer::create([
                    'user_id' => $user->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'],
                    'notes' => $validated['notes']
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $customer,
                'message' => $customer->wasRecentlyCreated ? 'Customer created successfully' : 'Customer found and updated'
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating/finding customer:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Error processing customer'
            ], 500);
        }
    }
}
