<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;

$order = Order::find(2);
if ($order) {
    echo "Current Phone: " . $order->customer_phone . " / " . ($order->customer->phone ?? 'N/A') . "\n";
    
    // Check customer
    if ($order->customer) {
        echo "Updating Customer ID " . $order->customer->id . " phone...\n";
        $order->customer->phone = '0661123456';
        $order->customer->save();
        echo "Customer phone updated to 0661123456\n";
    } else {
        echo "Order has no customer!\n";
    }
    
    echo "Updated successfully to 0661123456\n";
} else {
    echo "Order 2 not found.\n";
}
