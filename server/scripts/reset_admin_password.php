<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // Find or create admin user
    $user = \App\Models\User::firstOrCreate(
        ['email' => 'admin@podnit.com'],
        [
            'name' => 'Admin',
            'role' => 'admin',
            'is_active' => true,
        ]
    );

    // Generate new password
    $newPassword = 'Admin@' . bin2hex(random_bytes(4));
    
    // Update password
    $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
    $user->role = 'admin';
    $user->is_active = true;
    $user->save();

    // Create API token
    $token = $user->createToken('admin-access')->plainTextToken;

    echo "\n=================================\n";
    echo "Admin Password Reset Successful!\n";
    echo "=================================\n";
    echo "Email: admin@podnit.com\n";
    echo "Password: $newPassword\n";
    echo "\nAPI Token: $token\n";
    echo "=================================\n\n";

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
