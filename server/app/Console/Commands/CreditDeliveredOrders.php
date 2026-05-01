<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreditDeliveredOrders extends Command
{
    protected $signature = 'orders:credit-delivered {--limit= : Limit number of orders to process}';

    protected $description = 'Credit seller balances for delivered orders';

    public function handle(): int
    {
        $query = Order::where(function ($q) {
                $q->whereNull('seller_paid_at')
                  ->orWhere('is_paid', false);
            })
            ->where(function ($q) {
                $q->whereRaw('LOWER(status) LIKE ?', ['%livré%'])
                    ->orWhereRaw('LOWER(shipping_status) LIKE ?', ['%livré%']);
            });

        if ($limit = $this->option('limit')) {
            $query->limit((int) $limit);
        }

        $orders = $query->with('user')->get();

        if ($orders->isEmpty()) {
            $this->info('✅ No delivered orders to credit.');
            return 0;
        }

        $this->info("💸 Found {$orders->count()} delivered orders to credit");

        $progressBar = $this->output->createProgressBar($orders->count());
        $progressBar->start();

        $credited = 0;
        $failed = 0;

        foreach ($orders as $order) {
            try {
                $seller = $order->user;

                if (!$seller) {
                    Log::error("Cannot credit seller - user not found for order {$order->order_number}");
                    $failed++;
                    $progressBar->advance();
                    continue;
                }

                $creditAmount = $order->total_amount;

                DB::transaction(function () use ($order, $seller, $creditAmount) {
                    $freshOrder = Order::whereKey($order->id)->lockForUpdate()->first();

                    if ($freshOrder->is_paid || $freshOrder->seller_paid_at) {
                        return;
                    }

                    $seller->refresh();
                    $oldBalance = $seller->balance;
                    $seller->increment('balance', $creditAmount);
                    $newBalance = $seller->fresh()->balance;

                    $freshOrder->seller_paid_at = now();
                    $freshOrder->is_paid = true;
                    $freshOrder->save();

                    Log::info("Seller credited for delivered order", [
                        'order_number' => $freshOrder->order_number,
                        'seller_id' => $seller->id,
                        'seller_email' => $seller->email,
                        'credit_amount' => $creditAmount,
                        'old_balance' => $oldBalance,
                        'new_balance' => $newBalance
                    ]);
                });

                $credited++;
            } catch (\Exception $e) {
                $failed++;
                Log::error("Failed to credit seller for order {$order->order_number}", [
                    'error' => $e->getMessage()
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        $this->table(
            ['Status', 'Count'],
            [
                ['Credited', $credited],
                ['Failed', $failed],
                ['Total', $orders->count()],
            ]
        );

        return 0;
    }
}
