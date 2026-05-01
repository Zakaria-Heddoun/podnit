<?php

namespace App\Console\Commands;

use App\Models\Order;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncOrderStatuses extends Command
{
    protected $signature = 'orders:sync-statuses
                            {--force : Force sync all orders regardless of status}
                            {--limit= : Limit number of orders to process}';

    protected $description = 'Report orders with a BL reference (OZON tracking is managed via the OZON portal)';

    public function handle(): int
    {
        $this->info('Checking orders with OZON BL references...');

        $query = Order::whereNotNull('tracking_number')
                      ->whereNotIn('status', ['RETURNED', 'PAID', 'CANCELLED']);

        if ($limit = $this->option('limit')) {
            $query->limit((int) $limit);
        }

        $orders = $query->get();

        if ($orders->isEmpty()) {
            $this->info('No active shipped orders found.');
            return 0;
        }

        $this->info("Found {$orders->count()} active shipped orders.");

        $this->table(
            ['Order Number', 'BL Ref', 'Status', 'Customer'],
            $orders->map(fn(Order $o) => [
                $o->order_number,
                $o->tracking_number,
                $o->status,
                $o->customer_name ?? 'N/A',
            ])->toArray()
        );

        $this->line('');
        $this->comment('Tip: update order statuses manually via the admin panel or OZON portal.');

        return 0;
    }
}
