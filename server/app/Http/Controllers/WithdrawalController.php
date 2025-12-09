<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WithdrawalController extends Controller
{
    /**
     * Display a listing of the withdrawals for the authenticated seller.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $withdrawals = Withdrawal::where('user_id', $user->id)
                ->with(['processor:id,name'])
                ->orderBy('created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawals retrieved successfully',
                'data' => $withdrawals
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawals: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawals'
            ], 500);
        }
    }

    /**
     * Store a newly created withdrawal in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $validator = Validator::make($request->all(), [
                'amount' => 'required|numeric|min:100|max:20000', // Minimum 100 DH, Maximum 20,000 DH
                'bank_details' => 'required|array',
                'bank_details.bank_name' => 'required|string|max:100',
                'bank_details.account_holder' => 'required|string|max:100',
                'bank_details.rib' => 'required|string|min:24|max:28', // Moroccan RIB format
                'bank_details.swift' => 'nullable|string|max:11'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Check if user has sufficient balance
            if ($user->balance < $request->amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance. Your current balance is ' . number_format($user->balance, 2) . ' DH'
                ], 400);
            }

            // Check for pending withdrawals
            $pendingWithdrawal = Withdrawal::where('user_id', $user->id)
                ->where('status', 'PENDING')
                ->first();

            if ($pendingWithdrawal) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have a pending withdrawal request. Please wait for it to be processed.'
                ], 400);
            }

            DB::beginTransaction();

            // Calculate fees (2% of amount, minimum 10 DH, maximum 200 DH)
            $feePercentage = 0.02; // 2%
            $fee = max(10, min(200, $request->amount * $feePercentage));
            $netAmount = $request->amount - $fee;

            $withdrawal = Withdrawal::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'fee' => $fee,
                'net_amount' => $netAmount,
                'bank_details' => $request->bank_details,
                'status' => 'PENDING'
            ]);

            // Deduct amount from user's balance immediately
            $user->decrement('balance', $request->amount);

            DB::commit();

            Log::info('Withdrawal created', [
                'user_id' => $user->id, 
                'withdrawal_id' => $withdrawal->id, 
                'amount' => $request->amount,
                'fee' => $fee,
                'remaining_balance' => $user->fresh()->balance
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request submitted successfully. Processing fee: ' . number_format($fee, 2) . ' DH',
                'data' => $withdrawal
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating withdrawal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit withdrawal request'
            ], 500);
        }
    }

    /**
     * Display the specified withdrawal.
     */
    public function show(Withdrawal $withdrawal): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $withdrawal->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $withdrawal->load(['processor:id,name']);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal retrieved successfully',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawal'
            ], 500);
        }
    }

    /**
     * Admin methods for processing withdrawals
     */
    
    /**
     * Get all pending withdrawals for admin processing
     */
    public function adminIndex(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $query = Withdrawal::with(['user:id,name,email'])
                ->orderBy('created_at', 'desc');

            // Filter by status if provided
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $withdrawals = $query->paginate(20);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawals retrieved successfully',
                'data' => $withdrawals
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawals for admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawals'
            ], 500);
        }
    }

    /**
     * Get a single withdrawal for admin processing
     */
    public function adminShow(Withdrawal $withdrawal): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $withdrawal->load(['user:id,name,email', 'processor:id,name']);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal retrieved successfully',
                'data' => $withdrawal
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching withdrawal for admin: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch withdrawal'
            ], 500);
        }
    }

    /**
     * Process or reject a withdrawal
     */
    public function adminUpdate(Request $request, Withdrawal $withdrawal): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $user->role !== 'admin') {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:PROCESSED,REJECTED',
                'admin_notes' => 'nullable|string|max:1000',
                'transaction_reference' => 'nullable|string|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            if ($withdrawal->status !== 'PENDING') {
                return response()->json([
                    'success' => false,
                    'message' => 'Withdrawal has already been processed'
                ], 400);
            }

            DB::beginTransaction();

            $withdrawal->update([
                'status' => $request->status,
                'admin_notes' => $request->admin_notes,
                'transaction_reference' => $request->transaction_reference,
                'processed_by' => $user->id,
                'processed_at' => now()
            ]);

            // If rejected, refund the amount to user's balance
            if ($request->status === 'REJECTED') {
                $withdrawalUser = User::find($withdrawal->user_id);
                $withdrawalUser->increment('balance', $withdrawal->amount);

                Log::info('Withdrawal rejected and balance refunded', [
                    'withdrawal_id' => $withdrawal->id,
                    'user_id' => $withdrawal->user_id,
                    'refunded_amount' => $withdrawal->amount,
                    'new_balance' => $withdrawalUser->fresh()->balance
                ]);
            } else {
                Log::info('Withdrawal processed successfully', [
                    'withdrawal_id' => $withdrawal->id,
                    'user_id' => $withdrawal->user_id,
                    'amount' => $withdrawal->amount,
                    'net_amount' => $withdrawal->net_amount,
                    'transaction_reference' => $request->transaction_reference
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $request->status === 'PROCESSED' 
                    ? 'Withdrawal processed successfully' 
                    : 'Withdrawal rejected and balance refunded',
                'data' => $withdrawal->fresh(['processor'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating withdrawal status: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update withdrawal status'
            ], 500);
        }
    }

    /**
     * Cancel a pending withdrawal (seller can cancel their own pending withdrawal)
     */
    public function cancel(Withdrawal $withdrawal): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user || $withdrawal->user_id !== $user->id) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            if ($withdrawal->status !== 'PENDING') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending withdrawals can be cancelled'
                ], 400);
            }

            DB::beginTransaction();

            $withdrawal->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now()
            ]);

            // Refund the amount to user's balance
            $user->increment('balance', $withdrawal->amount);

            DB::commit();

            Log::info('Withdrawal cancelled by user', [
                'withdrawal_id' => $withdrawal->id,
                'user_id' => $user->id,
                'refunded_amount' => $withdrawal->amount,
                'new_balance' => $user->fresh()->balance
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal cancelled and amount refunded to your balance',
                'data' => $withdrawal->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cancelling withdrawal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel withdrawal'
            ], 500);
        }
    }
}
