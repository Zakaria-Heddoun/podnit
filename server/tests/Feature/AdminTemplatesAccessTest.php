<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Role;
use App\Models\Product;
use App\Models\Template;

class AdminTemplatesAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_access_admin_templates()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);

        // Product and template creator (seller)
        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::create([
            'name' => 'Test Product',
            'base_price' => 10.00,
            'views' => [['key' => 'front', 'price' => 0]],
        ]);

        $template = Template::create([
            'user_id' => $seller->id,
            'product_id' => $product->id,
            'title' => 'Seller Template',
            'design_config' => ['images' => ['front' => '/storage/templates/sample.png'], 'views' => [['key' => 'front']]],
            'status' => 'PENDING',
        ]);

        $res = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/templates');
        $res->assertStatus(200);
        $res->assertJsonFragment(['title' => 'Seller Template']);
    }

    public function test_employee_with_approve_permission_can_access_admin_templates()
    {
        // Create role with permission
        $role = Role::create([
            'name' => 'template_approver',
            'permissions' => ['approve_templates'],
        ]);

        // Create employee and attach role
        $employee = User::factory()->create(['role' => 'employee', 'role_id' => $role->id]);

        // Product and template creator (seller)
        $seller = User::factory()->create(['role' => 'seller']);
        $product = Product::create([
            'name' => 'Test Product',
            'base_price' => 10.00,
            'views' => [['key' => 'front', 'price' => 0]],
        ]);

        $template = Template::create([
            'user_id' => $seller->id,
            'product_id' => $product->id,
            'title' => 'Seller Template 2',
            'design_config' => ['images' => ['front' => '/storage/templates/sample.png'], 'views' => [['key' => 'front']]],
            'status' => 'PENDING',
        ]);

        $res = $this->actingAs($employee, 'sanctum')->getJson('/api/admin/templates');
        $res->assertStatus(200);
        $res->assertJsonFragment(['title' => 'Seller Template 2']);
    }
}
