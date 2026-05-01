<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'name' => null,
            'email' => 'test@example.com',
            'role' => 'seller',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
        ]);

        $this->call([
            SystemSettingsSeeder::class,
            ProductsSeeder::class,
            \Database\Seeders\RoleSeeder::class,
            \Database\Seeders\AdminUserSeeder::class,
            \Database\Seeders\TemplateSeeder::class,
        ]);
    }
}
