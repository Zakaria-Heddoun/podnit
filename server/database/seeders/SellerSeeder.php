<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Seller;
use Illuminate\Support\Facades\Hash;

class SellerSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create a test seller user
        $user = User::updateOrCreate(
            ['email' => 'seller@test.com'],
            [
                'name' => 'Test Seller',
                'email' => 'seller@test.com',
                'password' => Hash::make('password'),
                'role' => 'seller',
                'brand_name' => 'Test Brand',
                'phone' => '+212 600 000 000',
                'email_verified_at' => now(),
            ]
        );

        // Create seller profile
        Seller::updateOrCreate(
            ['user_id' => $user->id],
            [
                'user_id' => $user->id,
                'name' => 'Test Print Shop',
                'phone' => '+212 600 000 000',
                'cin' => 'TEST123456',
                'bank_name' => 'Test Bank',
                'rib' => 'TEST-RIB-123456789',
                'balance' => 1000.00,
                'referral_code' => 'TEST001',
                'is_verified' => true,
            ]
        );

        $this->command->info('Test seller created successfully!');
        $this->command->info('Email: seller@test.com');
        $this->command->info('Password: password');
    }
}
