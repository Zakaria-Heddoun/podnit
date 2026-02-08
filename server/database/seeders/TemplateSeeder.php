<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\Template;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all sellers
        $sellers = User::where('role', 'seller')->get();
        $products = Product::where('is_active', true)->take(3)->get();

        if ($products->isEmpty()) {
            $this->command->error('No products found. Please seed products first.');
            return;
        }

        foreach ($sellers as $seller) {
            $this->command->info("Creating templates for seller: {$seller->name} ({$seller->email})");

            foreach ($products as $index => $product) {
                // Check if template already exists to avoid duplicates
                $exists = Template::where('user_id', $seller->id)
                    ->where('product_id', $product->id)
                    ->where('title', "{$product->name} - Sample Design " . ($index + 1))
                    ->exists();

                if ($exists) continue;

                // Create a sample template
                Template::create([
                    'user_id' => $seller->id,
                    'product_id' => $product->id,
                    'title' => "{$product->name} - Sample Design " . ($index + 1),
                    'description' => "A sample template description for {$product->name}",
                    'status' => 'APPROVED', // Auto-approve for visibility
                    'thumbnail_image' => $product->image_url, // Use product image as fallback thumb
                    'colors' => array_slice(is_array($product->available_colors) ? $product->available_colors : (json_decode($product->available_colors, true) ?? []), 0, 1),
                    'design_config' => [
                         'color' => 'White',
                         'images' => [
                             'front' => $product->image_url // Simple placeholder
                         ],
                         'views' => [
                             [
                                 'key' => 'front',
                                 'name' => 'Front View'
                             ]
                         ]
                    ]
                ]);
            }
        }
        
        $this->command->info('Templates seeded successfully!');
    }
}
