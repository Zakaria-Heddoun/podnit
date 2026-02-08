<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$order = Order::where('status', 'PENDING')->with('customer')->first();

if ($order) {
    echo "Found PENDING Order:\n";
    echo "ID: " . $order->id . "\n";
    echo "Number: " . $order->order_number . "\n";
    echo "Customer: " . ($order->customer ? $order->customer->name : 'N/A') . "\n";
    echo "City: " . ($order->shipping_address['city'] ?? 'N/A') . "\n";
} else {
    echo "No PENDING orders found. Creating one...\n";
    // TODO: Create a dummy order if needed, but let's check first.
    // We can create one using the factory/test helper
}
