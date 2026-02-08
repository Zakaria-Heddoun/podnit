<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        try {
            // Ensure an admin role exists and get its id
            $role = \App\Models\Role::firstOrCreate(
                ['name' => 'admin'],
                ['description' => 'Administrator role', 'permissions' => []]
            );

            $adminUser = \App\Models\User::where('email', 'admin@podnit.com')->first();
            if ($adminUser) {
                $adminUser->update([
                    'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
                    'role_id' => $role->id,
                    'role' => 'admin',
                    'is_active' => true,
                ]);
            }
        } catch (\Exception $e) {
            // Be tolerant in test environments where constraints may differ
            \Log::warning('Finalize admin migration skipped: ' . $e->getMessage());
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
