<?php

namespace App\Http\Controllers;

use App\Models\Deposit;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class DepositController extends Controller
{
    /**
     * Display a listing of the deposits for the authenticated seller.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $deposits = Deposit::where('user_id', $user->id)
                ->with(['validator:id,name'])
                ->orderBy('created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'message' => 'Deposits retrieved successfully',
                'data' => $deposits
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching deposits: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch deposits'
            ], 500);
        }
    }

    /**
     * Store a newly created deposit in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:50|max:50000', // Minimum 50 DH, Maximum 50,000 DH
                'bank_name' => 'required|in:CIH,ATTIJARI',
                'receipt_image' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
                'reference_number' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            DB::beginTransaction();

            // Store the receipt image
            $receiptPath = $request->file('receipt_image')->store('deposits/receipts', 'public');

            $deposit = Deposit::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'bank_name' => $request->bank_name,
                'receipt_image' => $receiptPath,
                'reference_number' => $request->reference_number,
                'status' => 'PENDING'
            ]);

            DB::commit();

            Log::info('Deposit created', ['user_id' => $user->id, 'deposit_id' => $deposit->id, 'amount' => $request->amount]);

            return response()->json([
                'success' => true,
                'message' => 'Deposit request submitted successfully. It will be reviewed by admin.',
                'data' => $deposit
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating deposit: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit deposit request'
            ], 500);
        }
    }

    /**
     * Display the specified deposit.
     */
    public function show(Deposit $deposit): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $deposit->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $deposit->load(['validator:id,name']);

            return response()->json([
                'success' => true,
                'message' => 'Deposit retrieved successfully',
                'data' => $deposit
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching deposit: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch deposit'
            ], 500);
        }
    }

    /**
     * Get bank account details for deposits
     */
    public function getBankDetails(): JsonResponse
    {
        $bankDetails = [
            'CIH' => [
                'bank_name' => 'Crédit Immobilier et Hôtelier (CIH)',
                'rib' => '007-780-0001234567890-12',
                'account_holder' => 'PODNIT SARL',
                'swift' => 'CIHMMAMC'
            ],
            'ATTIJARI' => [
                'bank_name' => 'Attijariwafa Bank',
                'rib' => '007-001-0009876543210-34',
                'account_holder' => 'PODNIT SARL',
                'swift' => 'BCMAMAMC'
            ]
        ];

        return response()->json([
            'success' => true,
            'message' => 'Bank details retrieved successfully',
            'data' => $bankDetails
        ]);
    }

    /**
     * Admin methods for validating deposits
     */
    
    /**
     * Get all pending deposits for admin review
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = Deposit::with(['user:id,name,email'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $deposits = $query->paginate(20);

            return response()->json([
                'success' => true,
                'message' => 'Deposits retrieved successfully',
                'data' => $deposits
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching deposits for admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch deposits'
            ], 500);
        }
    }

    /**
     * Get a single deposit for admin review
     */
    public function adminShow(Deposit $deposit): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $deposit->load(['user:id,name,email', 'validator:id,name']);

            return response()->json([
                'success' => true,
                'message' => 'Deposit retrieved successfully',
                'data' => $deposit
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching deposit for admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch deposit'
            ], 500);
        }
    }

    /**
     * Validate or reject a deposit
     */
    public function adminUpdate(Request $request, Deposit $deposit): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:VALIDATED,REJECTED',
                'admin_notes' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($deposit->status !== 'PENDING') {
                return response()->json([
                    'success' => false,
                    'message' => 'Deposit has already been processed'
                ], 400);
            }

            DB::beginTransaction();

            $deposit->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
                'validated_by' => $user->id,
                'validated_at' => now()
            ]);

            // If validated, add amount to user's balance
            if ($request->status === 'VALIDATED') {
                $depositUser = User::find($deposit->user_id);
                $depositUser->increment('balance', $deposit->amount);

                Log::info('Deposit validated and balance updated', [
                    'deposit_id' => $deposit->id,
                    'user_id' => $deposit->user_id,
                    'amount' => $deposit->amount,
                    'new_balance' => $depositUser->fresh()->balance
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $request->status === 'VALIDATED' 
                    ? 'Deposit validated and balance updated successfully' 
                    : 'Deposit rejected successfully',
                'data' => $deposit->fresh(['validator'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating deposit status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update deposit status'
            ], 500);
        }
    }
}
