<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\EliteSpeedService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncOrderStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:sync-statuses 
                            {--force : Force sync all orders regardless of status}
                            {--limit= : Limit number of orders to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync order statuses from EliteSpeed shipping API';

    private EliteSpeedService $shippingService;

    public function __construct(EliteSpeedService $shippingService)
    {
        parent::__construct();
        $this->shippingService = $shippingService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Starting order status synchronization...');

        // Get orders that need status updates
        // Only exclude delivered orders (Livré) - all others should continue syncing
        $query = Order::whereNotNull('tracking_number')
            ->where('status', 'NOT LIKE', '%livré%');

        if ($limit = $this->option('limit')) {
            $query->limit((int) $limit);
        }

        $orders = $query->get();

        if ($orders->isEmpty()) {
            $this->info('✅ No orders to sync.');
            return 0;
        }

        $this->info("📦 Found {$orders->count()} orders to sync");

        $progressBar = $this->output->createProgressBar($orders->count());
        $progressBar->start();

        $updated = 0;
        $failed = 0;
        $unchanged = 0;

        foreach ($orders as $order) {
            try {
                $result = $this->syncOrderStatus($order);
                
                if ($result === 'updated') {
                    $updated++;
                } elseif ($result === 'unchanged') {
                    $unchanged++;
                }
            } catch (\Exception $e) {
                $failed++;
                Log::error("Failed to sync order {$order->order_number}", [
                    'error' => $e->getMessage(),
                    'tracking_number' => $order->tracking_number
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Summary
        $this->info("✅ Synchronization complete!");
        $this->table(
            ['Status', 'Count'],
            [
                ['Updated', $updated],
                ['Unchanged', $unchanged],
                ['Failed', $failed],
                ['Total', $orders->count()],
            ]
        );

        return 0;
    }

    /**
     * Sync individual order status from EliteSpeed
     */
    private function syncOrderStatus(Order $order): string
    {
        if (!$order->tracking_number) {
            return 'skipped';
        }

        // Fetch tracking info from EliteSpeed
        $tracking = $this->shippingService->trackParcel($order->tracking_number);

        if (!$tracking) {
            Log::warning("EliteSpeed tracking failed for order {$order->order_number}", [
                'tracking_number' => $order->tracking_number,
                'response' => null
            ]);
            return 'failed';
        }

        // Extract status from EliteSpeed response
        // Handle different response formats
        $eliteStatus = null;
        
        // Format 1: Direct status fields
        if (isset($tracking['statut'])) {
            $eliteStatus = $tracking['statut'];
        } elseif (isset($tracking['last_status'])) {
            $eliteStatus = $tracking['last_status'];
        } elseif (isset($tracking['message'])) {
            $eliteStatus = $tracking['message'];
        }
        // Format 2: Array of status events (newest first)
        elseif (isset($tracking['data']) && is_array($tracking['data']) && !empty($tracking['data'])) {
            $latestEvent = $tracking['data'][0];
            $eliteStatus = $latestEvent['status'] ?? null;
        }

        if (!$eliteStatus) {
            return 'unchanged';
        }

        // Update order status with EliteSpeed status directly (no mapping)
        $statusChanged = false;
        if ($order->status !== $eliteStatus) {
            $oldStatus = $order->status;
            $order->status = $eliteStatus;
            $order->shipping_status = $eliteStatus;
            $statusChanged = true;

            Log::info("Order status updated", [
                'order_number' => $order->order_number,
                'old_status' => $oldStatus,
                'new_status' => $eliteStatus
            ]);

            // Credit seller when order is delivered
            if ($this->isDeliveredStatus($eliteStatus) && !$this->isDeliveredStatus($oldStatus)) {
                $this->creditSellerForDeliveredOrder($order);
            }
        }

        // Check if it's a return status and restrict reshipping
        if ($order->isReturnStatus()) {
            if ($order->allow_reshipping) {
                $order->allow_reshipping = false;
                $statusChanged = true;
            }
        }

        if ($statusChanged) {
            $order->save();
            return 'updated';
        }

        return 'unchanged';
    }

    /**
     * Check if status indicates delivered (order finished)
     * Only "Livré" means the order is complete and seller should be paid
     */
    private function isDeliveredStatus(string $status): bool
    {
        $statusLower = strtolower($status);
        
        return str_contains($statusLower, 'livré');
    }

    /**
     * Credit seller's balance when order is delivered
     */
    private function creditSellerForDeliveredOrder(Order $order): void
    {
        try {
            $seller = $order->user;
            
            if (!$seller) {
                Log::error("Cannot credit seller - user not found for order {$order->order_number}");
                return;
            }

            // Credit the seller with the total amount (what customer paid)
            $creditAmount = $order->total_amount;
            
            $oldBalance = $seller->balance;
            $seller->increment('balance', $creditAmount);
            $newBalance = $seller->fresh()->balance;

            Log::info("Seller credited for delivered order", [
                'order_number' => $order->order_number,
                'seller_id' => $seller->id,
                'seller_email' => $seller->email,
                'credit_amount' => $creditAmount,
                'old_balance' => $oldBalance,
                'new_balance' => $newBalance
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to credit seller for order {$order->order_number}", [
                'error' => $e->getMessage()
            ]);
        }
    }
}
