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
