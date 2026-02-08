<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use Illuminate\Support\Facades\Config;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $perms = Config::get('roles.permissions', []);

        // Create some default roles
        Role::updateOrCreate(['name' => 'admin'], [
            'description' => 'Administrator with all permissions',
            'permissions' => array_keys($perms),
        ]);

        Role::updateOrCreate(['name' => 'manager'], [
            'description' => 'Manager with limited management permissions',
            'permissions' => array_values(array_filter(array_keys($perms), function($k){
                return in_array($k, ['view_dashboard','view_orders','manage_orders','view_products','approve_templates','approve_designs']);
            })),
        ]);

        Role::updateOrCreate(['name' => 'staff'], [
            'description' => 'Staff with minimal permissions',
            'permissions' => ['view_products'],
        ]);
    }
}
