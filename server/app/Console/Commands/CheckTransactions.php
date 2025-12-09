<?php

namespace App\Console\Commands;

use App\Models\Deposit;
use App\Models\Withdrawal;
use Illuminate\Console\Command;

class CheckTransactions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-transactions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check transaction amounts in database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== DEPOSITS ===');
        $deposits = Deposit::with('user')->orderBy('created_at', 'desc')->take(5)->get();
        foreach ($deposits as $deposit) {
            $this->line("ID: {$deposit->id}, User: {$deposit->user->name}, Amount: {$deposit->amount}, Status: {$deposit->status}");
        }

        $this->info('=== WITHDRAWALS ===');
        $withdrawals = Withdrawal::with('user')->orderBy('created_at', 'desc')->take(5)->get();
        foreach ($withdrawals as $withdrawal) {
            $this->line("ID: {$withdrawal->id}, User: {$withdrawal->user->name}, Amount: {$withdrawal->amount}, Fee: {$withdrawal->fee}, Status: {$withdrawal->status}");
        }
    }
}
