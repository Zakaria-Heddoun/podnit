<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PointsExchangeController extends Controller
{
    /**
     * Exchange points for balance
     * 1000 points = 100 DH
     */
    public function exchange(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'points' => 'required|integer|min:1000'
        ]);

        $pointsToExchange = $request->points;

        // Check if points is a multiple of 1000
        if ($pointsToExchange % 1000 !== 0) {
            return response()->json([
                'success' => false,
                'message' => 'Points must be a multiple of 1000'
            ], 400);
        }

        // Check if user has enough points
        if ($user->points < $pointsToExchange) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient points balance'
            ], 400);
        }

        // Calculate balance amount (1000 points = 100 DH)
        $balanceAmount = ($pointsToExchange / 1000) * 100;

        try {
            DB::beginTransaction();

            // Deduct points
            $user->points -= $pointsToExchange;
            
            // Add balance
            $user->balance += $balanceAmount;
            
            $user->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully exchanged {$pointsToExchange} points for {$balanceAmount} DH",
                'data' => [
                    'points_exchanged' => $pointsToExchange,
                    'balance_added' => $balanceAmount,
                    'new_points_balance' => $user->points,
                    'new_balance' => $user->balance
                ]
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Points exchange error', [
                'user_id' => $user->id,
                'points' => $pointsToExchange,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to exchange points'
            ], 500);
        }
    }
}
