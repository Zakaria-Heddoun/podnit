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
        
        $orders = [
            [
                'order_number' => 'POD-20251113-ABC123',
                'customer_id' => $customers->first()->id,
                'product_id' => $products->first()->id,
                'quantity' => 2,
                'unit_price' => 89.00,
                'total_amount' => 178.00,
                'status' => 'PENDING',
                'customization' => [
                    'color' => 'Black',
                    'size' => 'L',
                    'notes' => 'Please use high-quality print'
                ],
                'shipping_address' => [
                    'street' => '123 Rue Mohammed V',
                    'city' => 'Casablanca',
                    'postal_code' => '20000',
                    'country' => 'Morocco'
                ],
                'created_at' => Carbon::now()->subDays(3),
                'updated_at' => Carbon::now()->subDays(3),
            ],
            [
                'order_number' => 'POD-20251112-DEF456',
                'customer_id' => $customers->skip(1)->first()->id,
                'product_id' => $products->count() > 1 ? $products->skip(1)->first()->id : $products->first()->id,
                'quantity' => 1,
                'unit_price' => 125.00,
                'total_amount' => 125.00,
                'status' => 'IN_PROGRESS',
                'customization' => [
                    'color' => 'Navy',
                    'size' => 'M',
                    'notes' => 'Standard quality print'
                ],
                'shipping_address' => [
                    'street' => '45 Avenue Hassan II',
                    'city' => 'Rabat',
                    'postal_code' => '10000',
                    'country' => 'Morocco'
                ],
                'created_at' => Carbon::now()->subDays(2),
                'updated_at' => Carbon::now()->subDays(1),
            ],
            [
                'order_number' => 'POD-20251111-GHI789',
                'customer_id' => $customers->skip(2)->first()->id,
                'product_id' => $products->first()->id,
                'quantity' => 3,
                'unit_price' => 89.00,
                'total_amount' => 267.00,
                'status' => 'SHIPPED',
                'customization' => [
                    'color' => 'White',
                    'size' => 'XL',
                    'notes' => 'Premium quality print'
                ],
                'shipping_address' => [
                    'street' => '78 Boulevard Zerktouni',
                    'city' => 'Marrakech',
                    'postal_code' => '40000',
                    'country' => 'Morocco'
                ],
                'created_at' => Carbon::now()->subDays(1),
                'updated_at' => Carbon::now(),
            ],
        ];
        
        foreach ($orders as $orderData) {
            $order = Order::create([
                'user_id' => 4, // Seller ID
                'order_number' => $orderData['order_number'],
                'customer_id' => $orderData['customer_id'],
                'product_id' => $orderData['product_id'],
                'quantity' => $orderData['quantity'],
                'unit_price' => $orderData['unit_price'],
                'total_amount' => $orderData['total_amount'],
                'status' => $orderData['status'],
                'customization' => $orderData['customization'],
                'shipping_address' => $orderData['shipping_address'],
                'created_at' => $orderData['created_at'],
                'updated_at' => $orderData['updated_at'],
            ]);
            
            // Update customer statistics
            $customer = Customer::find($orderData['customer_id']);
            $customer->updateStats($orderData['total_amount']);
        }
    }
}
