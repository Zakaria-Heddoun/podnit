<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Customer;
use Carbon\Carbon;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = [
            [
                'user_id' => 4, // Seller ID
                'name' => 'Ahmed Hassan',
                'email' => 'ahmed.hassan@gmail.com',
                'phone' => '+212 600 123 456',
                'created_at' => Carbon::now()->subDays(30),
                'updated_at' => Carbon::now()->subDays(30),
            ],
            [
                'user_id' => 4,
                'name' => 'Fatima Zahra',
                'email' => 'fatima.zahra@hotmail.com',
                'phone' => '+212 661 234 567',
                'created_at' => Carbon::now()->subDays(25),
                'updated_at' => Carbon::now()->subDays(25),
            ],
            [
                'user_id' => 4,
                'name' => 'Mohamed Alami',
                'email' => 'mohamed.alami@yahoo.com',
                'phone' => '+212 662 345 678',
                'created_at' => Carbon::now()->subDays(20),
                'updated_at' => Carbon::now()->subDays(20),
            ],
            [
                'user_id' => 4,
                'name' => 'Khadija Benali',
                'email' => 'khadija.benali@outlook.com',
                'phone' => '+212 663 456 789',
                'created_at' => Carbon::now()->subDays(18),
                'updated_at' => Carbon::now()->subDays(18),
            ],
            [
                'user_id' => 4,
                'name' => 'Youssef Idrissi',
                'email' => 'youssef.idrissi@gmail.com',
                'phone' => '+212 664 567 890',
                'created_at' => Carbon::now()->subDays(15),
                'updated_at' => Carbon::now()->subDays(15),
            ],
            [
                'user_id' => 4,
                'name' => 'Aicha Tazi',
                'email' => 'aicha.tazi@gmail.com',
                'phone' => '+212 665 678 901',
                'created_at' => Carbon::now()->subDays(12),
                'updated_at' => Carbon::now()->subDays(12),
            ],
            [
                'user_id' => 4,
                'name' => 'Omar Benjelloun',
                'email' => 'omar.benjelloun@hotmail.com',
                'phone' => '+212 666 789 012',
                'created_at' => Carbon::now()->subDays(10),
                'updated_at' => Carbon::now()->subDays(10),
            ],
            [
                'user_id' => 4,
                'name' => 'Nadia Fassi',
                'email' => 'nadia.fassi@yahoo.com',
                'phone' => '+212 667 890 123',
                'created_at' => Carbon::now()->subDays(8),
                'updated_at' => Carbon::now()->subDays(8),
            ],
            [
                'user_id' => 4,
                'name' => 'Rachid Chraibi',
                'email' => 'rachid.chraibi@outlook.com',
                'phone' => '+212 668 901 234',
                'created_at' => Carbon::now()->subDays(6),
                'updated_at' => Carbon::now()->subDays(6),
            ],
            [
                'user_id' => 4,
                'name' => 'Leila Amrani',
                'email' => 'leila.amrani@gmail.com',
                'phone' => '+212 669 012 345',
                'created_at' => Carbon::now()->subDays(4),
                'updated_at' => Carbon::now()->subDays(4),
            ],
            [
                'user_id' => 4,
                'name' => 'Karim Belkhadir',
                'email' => 'karim.belkhadir@hotmail.com',
                'phone' => '+212 670 123 456',
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'user_id' => 4,
                'name' => 'Salma Ouali',
                'email' => 'salma.ouali@yahoo.com',
                'phone' => '+212 671 234 567',
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(2),
            ],
            [
                'user_id' => 4,
                'name' => 'Hassan Boukhari',
                'email' => 'hassan.boukhari@gmail.com',
                'phone' => '+212 672 345 678',
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now()->subDays(1),
            ],
            [
                'user_id' => 4,
                'name' => 'Zineb Kettani',
                'email' => 'zineb.kettani@outlook.com',
                'phone' => '+212 673 456 789',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}
