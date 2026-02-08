<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $u = \App\Models\User::firstOrCreate(
        ['email' => 'admin@podnit.com'],
        [
            'name' => 'Admin',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'role' => 'admin',
            'is_active' => true,
        ]
    );

    $token = $u->createToken('dev')->plainTextToken;
    echo "TOKEN:$token\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
