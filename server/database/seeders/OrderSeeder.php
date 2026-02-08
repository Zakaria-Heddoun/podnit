<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Product;
use Carbon\Carbon;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing orders for seller 4
        Order::where('user_id', 4)->delete();
        
        // Get customers for seller 4 and available products
        $customers = Customer::where('user_id', 4)->get();
        $products = Product::where('is_active', true)->get();
        
        if ($customers->isEmpty()) {
            $this->command->error('No customers found for seller 4. Please run CustomerSeeder first.');
            return;
        }
        
        if ($products->isEmpty()) {
            $this->command->error('No products found. Please create products first.');
            return;
        }
        
        // Generate 20 random orders for the last 30 days
        for ($i = 0; $i < 20; $i++) {
            $customer = $customers->random();
            $product = $products->random();
            $quantity = rand(1, 10);
            $unitPrice = [89.00, 125.00, 100.00, 150.00][rand(0, 3)];
            $status = ['PENDING', 'IN_PROGRESS', 'SHIPPED', 'DELIVERED'][rand(0, 3)];
            $createdAt = Carbon::now()->subDays(rand(0, 30))->subHours(rand(0, 23));

            Order::create([
                'user_id' => 4,
                'order_number' => 'POD-' . strtoupper(bin2hex(random_bytes(4))),
                'customer_id' => $customer->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_amount' => $quantity * $unitPrice,
                'status' => $status,
                'customization' => [
                    'color' => ['Black', 'White', 'Navy', 'Gray'][rand(0, 3)],
                    'size' => ['S', 'M', 'L', 'XL', 'XXL'][rand(0, 4)],
                    'notes' => 'Bulk seeded order',
                    'design_config' => []
                ],
                'shipping_address' => [
                    'street' => rand(1, 999) . ' random street',
                    'city' => ['Casablanca', 'Rabat', 'Marrakech', 'Tangier'][rand(0, 3)],
                    'postal_code' => rand(10000, 99999),
                    'country' => 'Morocco'
                ],
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            $customer->updateStats($quantity * $unitPrice);
        }
    }
}
