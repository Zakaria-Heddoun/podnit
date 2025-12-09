<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Only create products if table is empty
        if (Product::count() > 0) {
            $this->command->info('Products already exist, skipping seed.');
            return;
        }

        $products = [
            [
                'name' => 'Classic T-Shirt',
                'category' => 'T-Shirts',
                'description' => 'Premium cotton t-shirt with comfortable fit. Perfect for custom printing and daily wear. High-quality fabric that maintains its shape and color after multiple washes.',
                'base_price' => 89.00,
                'available_colors' => json_encode(['White', 'Black', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Yellow']),
                'available_sizes' => json_encode(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
                'image_url' => '/images/products/product-01.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Baseball Cap',
                'category' => 'Caps',
                'description' => 'Classic 6-panel baseball cap with adjustable strap. Made from high-quality cotton twill with a structured crown and curved visor. Perfect for embroidery and heat transfer vinyl.',
                'base_price' => 65.00,
                'available_colors' => json_encode(['Black', 'White', 'Navy', 'Red', 'Green', 'Gray', 'Royal Blue']),
                'available_sizes' => json_encode(['One Size']),
                'image_url' => '/images/products/product-02.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Pullover Hoodie',
                'category' => 'Hoodies',
                'description' => 'Cozy pullover hoodie with kangaroo pocket and drawstring hood. Made from a cotton-polyester blend for warmth and durability. Excellent for screen printing and embroidery.',
                'base_price' => 159.00,
                'available_colors' => json_encode(['Black', 'Gray', 'Navy', 'Maroon', 'Forest Green', 'White']),
                'available_sizes' => json_encode(['S', 'M', 'L', 'XL', 'XXL']),
                'image_url' => '/images/products/product-03.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Tote Bag',
                'category' => 'Bags',
                'description' => 'Eco-friendly canvas tote bag with reinforced handles. Made from 100% natural cotton canvas. Perfect for custom printing and everyday use. Spacious and durable.',
                'base_price' => 45.00,
                'available_colors' => json_encode(['Natural', 'Black', 'Navy', 'Red', 'Forest Green']),
                'available_sizes' => json_encode(['Standard']),
                'image_url' => '/images/products/product-04.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Polo Shirt',
                'category' => 'T-Shirts',
                'description' => 'Professional polo shirt with 3-button placket and ribbed collar. Made from moisture-wicking fabric for comfort and style. Ideal for corporate branding and uniforms.',
                'base_price' => 119.00,
                'available_colors' => json_encode(['White', 'Black', 'Navy', 'Royal Blue', 'Red', 'Gray', 'Light Blue']),
                'available_sizes' => json_encode(['S', 'M', 'L', 'XL', 'XXL']),
                'image_url' => '/images/products/product-05.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Coffee Mug',
                'category' => 'Drinkware',
                'description' => '11oz ceramic coffee mug with full-color sublimation printing area. Dishwasher and microwave safe. Perfect for custom designs and promotional items.',
                'base_price' => 35.00,
                'available_colors' => json_encode(['White', 'Black', 'Blue', 'Red', 'Green']),
                'available_sizes' => json_encode(['11oz']),
                'image_url' => '/images/products/product-01.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Phone Case',
                'category' => 'Accessories',
                'description' => 'Protective phone case with full-wrap printing capability. Impact resistant with precise cutouts for all ports and buttons. Compatible with wireless charging.',
                'base_price' => 55.00,
                'available_colors' => json_encode(['Clear', 'Black', 'White']),
                'available_sizes' => json_encode(['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'Samsung Galaxy S24', 'Samsung Galaxy S23']),
                'image_url' => '/images/products/product-02.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Canvas Print',
                'category' => 'Wall Art',
                'description' => 'Gallery-quality canvas print with wooden frame. High-resolution printing on premium canvas material. Ready to hang with mounting hardware included.',
                'base_price' => 89.00,
                'available_colors' => json_encode(['Standard Canvas']),
                'available_sizes' => json_encode(['8x10"', '11x14"', '16x20"', '20x24"', '24x36"']),
                'image_url' => '/images/products/product-03.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Zip Hoodie',
                'category' => 'Hoodies',
                'description' => 'Full-zip hoodie with front pockets and adjustable drawstring. Made from soft cotton-poly blend. Perfect for layering and custom embroidery.',
                'base_price' => 179.00,
                'available_colors' => json_encode(['Black', 'Gray', 'Navy', 'Red', 'White', 'Forest Green']),
                'available_sizes' => json_encode(['S', 'M', 'L', 'XL', 'XXL']),
                'image_url' => '/images/products/product-04.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Throw Pillow',
                'category' => 'Home Decor',
                'description' => 'Decorative throw pillow with removable cover. Double-sided printing available. Includes hypoallergenic insert. Perfect for home and office decoration.',
                'base_price' => 75.00,
                'available_colors' => json_encode(['White', 'Linen', 'Black']),
                'available_sizes' => json_encode(['16x16"', '18x18"', '20x20"']),
                'image_url' => '/images/products/product-05.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Laptop Sleeve',
                'category' => 'Accessories',
                'description' => 'Protective laptop sleeve with zipper closure. Water-resistant neoprene material with custom printing area. Lightweight and durable protection.',
                'base_price' => 89.00,
                'available_colors' => json_encode(['Black', 'Gray', 'Navy', 'White']),
                'available_sizes' => json_encode(['13"', '15"', '16"']),
                'image_url' => '/images/products/product-01.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'name' => 'Tank Top',
                'category' => 'T-Shirts',
                'description' => 'Lightweight tank top perfect for summer wear and fitness. Soft cotton blend with excellent breathability. Great for heat transfer vinyl and screen printing.',
                'base_price' => 69.00,
                'available_colors' => json_encode(['White', 'Black', 'Gray', 'Navy', 'Red', 'Yellow', 'Pink']),
                'available_sizes' => json_encode(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
                'image_url' => '/images/products/product-02.jpg',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        $this->command->info('Products seeded successfully!');
    }
}
