<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Order;
use App\Models\User;
use App\Http\Controllers\OrderController;
use App\Services\EliteSpeedService;
use Illuminate\Http\Request;

echo "Preparing test...\n";

// 1. Get Order
$order = Order::find(2);
if (!$order) {
    die("Order not found.\n");
}
echo "Order found: " . $order->order_number . "\n";

// 2. Auth as Admin or Owner
$user = User::where('role', 'admin')->first(); // Try admin first
if (!$user) {
    echo "No admin found, trying owner...\n";
    $user = User::find($order->user_id);
}

if (!$user) {
    die("No user found to perform action.\n");
}

echo "Acting as User: " . $user->name . " (" . $user->role . ")\n";
auth()->login($user);

// 3. Prepare Request
$request = Request::create('/api/admin/orders/2/ship', 'POST', [
    'note' => 'Test shipment from CLI script'
]);

// 4. Instantiate Controller & Service
$controller = app(OrderController::class);
$service = new EliteSpeedService(); 

// 5. Run Action
try {
    echo "Calling shipOrder...\n";
    $response = $controller->shipOrder($request, $order, $service);
    
    echo "Response Status: " . $response->status() . "\n";
    echo "Response Content: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
