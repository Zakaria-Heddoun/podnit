<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\TemplateController;

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Login as Zakaria (User ID 5)
Auth::loginUsingId(5);

// Create Mock Request
$request = Request::create('/api/seller/templates', 'GET');

// Instantiate Controller
$controller = new TemplateController();

// Call index
try {
    $response = $controller->index($request);
    echo "Status: " . $response->getStatusCode() . "\n";
    $content = $response->getContent();
    echo "Content Length: " . strlen($content) . "\n";
    
    $json = json_decode($content, true);
    if ($json) {
        echo "Success: " . ($json['success'] ? 'YES' : 'NO') . "\n";
        echo "Data Count: " . count($json['data']) . "\n";
        if (count($json['data']) > 0) {
            echo "First Item Title: " . $json['data'][0]['title'] . "\n";
        }
    } else {
        echo "Invalid JSON response\n";
        echo substr($content, 0, 500); // Print first 500 chars
    }
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
