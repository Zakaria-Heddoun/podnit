<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Carbon\Carbon;

class DeleteInactiveSellers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sellers:delete-inactive';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete sellers that are unverified and inactive for more than a month';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $oneMonthAgo = Carbon::now()->subMonth();

        // Find sellers that are unverified and created more than a month ago
        $inactiveSellers = User::where('role', 'seller')
            ->where('is_verified', 0)
            ->where('created_at', '<=', $oneMonthAgo)
            ->get();

        $count = $inactiveSellers->count();

        if ($count === 0) {
            $this->info('No inactive sellers found to delete.');
            return 0;
        }

        $this->info("Found {$count} inactive seller(s) to delete.");

        // Delete the inactive sellers
        foreach ($inactiveSellers as $seller) {
            $this->line("Deleting seller: {$seller->email} (ID: {$seller->id})");
            $seller->delete();
        }

        $this->info("Successfully deleted {$count} inactive seller(s).");
        
        return 0;
    }
}
