<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the deletion of inactive sellers to run daily at midnight
Schedule::command('sellers:delete-inactive')->daily();

// Report active shipped orders (OZON status is managed via the OZON portal)
Schedule::command('orders:sync-statuses')->cron('*/10 * * * *');
Schedule::command('orders:credit-delivered')->dailyAt('00:00');
