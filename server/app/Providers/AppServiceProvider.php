<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Force cache and session to use filesystem to avoid missing DB tables
        if (config('cache.default') !== 'file') {
            config(['cache.default' => 'file']);
        }
        if (config('session.driver') !== 'file') {
            config(['session.driver' => 'file']);
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/reset-password?token={$token}&email={$notifiable->getEmailForPasswordReset()}";
        });

        // Handle "MySQL server has gone away" errors by reconnecting
        \DB::listen(function ($query) {
            try {
                // Test connection before executing query
                \DB::connection()->getPdo();
            } catch (\Exception $e) {
                if (str_contains($e->getMessage(), 'MySQL server has gone away')) {
                    \DB::reconnect();
                }
            }
        });
    }
}
