<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            ['setting_key' => 'min_deposit_amount', 'setting_value' => '100.00', 'description' => 'Minimum deposit amount allowed'],
            ['setting_key' => 'max_deposit_amount', 'setting_value' => '10000.00', 'description' => 'Maximum deposit amount allowed'],
            ['setting_key' => 'min_withdrawal_amount', 'setting_value' => '50.00', 'description' => 'Minimum withdrawal amount allowed'],
            ['setting_key' => 'max_withdrawal_amount', 'setting_value' => '5000.00', 'description' => 'Maximum withdrawal amount allowed'],
            ['setting_key' => 'withdrawal_fee_percentage', 'setting_value' => '2.5', 'description' => 'Withdrawal fee percentage'],
            ['setting_key' => 'withdrawal_fee_min', 'setting_value' => '10.00', 'description' => 'Minimum withdrawal fee'],
            ['setting_key' => 'withdrawal_fee_max', 'setting_value' => '100.00', 'description' => 'Maximum withdrawal fee'],
            ['setting_key' => 'referral_points_referrer', 'setting_value' => '100', 'description' => 'Points earned by referrer'],
            ['setting_key' => 'referral_points_referred', 'setting_value' => '50', 'description' => 'Points earned by referred seller'],
            ['setting_key' => 'points_per_order', 'setting_value' => '10', 'description' => 'Points earned per completed order'],
            ['setting_key' => 'template_boost_cost', 'setting_value' => '200', 'description' => 'Points cost for template boost'],
            ['setting_key' => 'withdrawal_discount_rate', 'setting_value' => '50', 'description' => 'Points for 1 MAD discount'],
            ['setting_key' => 'max_referrals_per_contact', 'setting_value' => '1', 'description' => 'Maximum referrals per email/phone/RIB'],
            ['setting_key' => 'order_auto_paid_days', 'setting_value' => '7', 'description' => 'Days after shipping to auto-mark as paid'],
            ['setting_key' => 'template_approval_required', 'setting_value' => '1', 'description' => 'Require admin approval for templates'],
            [
                'setting_key' => 'studio_canvas_colors',
                'setting_value' => json_encode([
                    '#FFFFFF',
                    '#000000',
                    '#FF0000',
                    '#00FF00',
                    '#0000FF',
                    '#FFFF00',
                    '#FF00FF',
                    '#00FFFF',
                ]),
                'description' => 'Available colors for the studio canvas background',
            ],
            ['setting_key' => 'packaging_price', 'setting_value' => '5.00', 'description' => 'Default price for packaging'],
            ['setting_key' => 'shipping_casablanca', 'setting_value' => '20.00', 'description' => 'Shipping price for Casablanca'],
            ['setting_key' => 'shipping_other', 'setting_value' => '40.00', 'description' => 'Shipping price for cities other than Casablanca'],
            ['setting_key' => 'delivery_price', 'setting_value' => '0', 'description' => 'General delivery price'],
            ['setting_key' => 'site_name', 'setting_value' => 'PODNIT', 'description' => 'Name of the website'],
            ['setting_key' => 'site_url', 'setting_value' => 'https://podnit.com', 'description' => 'Primary website URL'],
            ['setting_key' => 'site_description', 'setting_value' => 'High-quality print-on-demand products delivered to your door.', 'description' => 'Website description for SEO and metadata'],
        ];

        foreach ($settings as $setting) {
            DB::table('system_settings')->updateOrInsert(
                ['setting_key' => $setting['setting_key']],
                [
                    'setting_value' => $setting['setting_value'],
                    'description' => $setting['description'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
