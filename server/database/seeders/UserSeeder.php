<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create seller user if it doesn't exist
        User::firstOrCreate(
            ['email' => 'seller@podnit.com'],
            [
                'name' => 'Seller User',
                'email' => 'seller@podnit.com',
                'password' => Hash::make('seller123'),
                'role' => 'seller',
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Seller user created successfully!');
        $this->command->info('Email: seller@podnit.com');
        $this->command->info('Password: seller123');
    }
}

