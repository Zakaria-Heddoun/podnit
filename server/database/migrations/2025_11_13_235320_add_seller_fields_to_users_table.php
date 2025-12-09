<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Seller-specific fields from sellers table
            $table->string('seller_phone', 20)->nullable()->after('phone');
            $table->string('cin', 50)->unique()->nullable()->after('seller_phone');
            $table->string('bank_name', 100)->nullable()->after('cin');
            $table->string('rib', 50)->unique()->nullable()->after('bank_name');
            $table->decimal('balance', 10, 2)->default(0.00)->after('rib');
            $table->string('referral_code', 10)->unique()->nullable()->after('balance');
            $table->foreignId('referred_by_id')->nullable()->constrained('users')->onDelete('set null')->after('referral_code');
            $table->boolean('is_verified')->default(false)->after('referred_by_id');
            $table->boolean('is_active')->default(true)->after('is_verified');
            
            // Indexes for performance
            $table->index(['referral_code']);
            $table->index(['referred_by_id']);
            $table->index(['cin']);
            $table->index(['rib']);
            $table->index(['is_verified']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['referred_by_id']);
            $table->dropIndex(['referral_code']);
            $table->dropIndex(['referred_by_id']);
            $table->dropIndex(['cin']);
            $table->dropIndex(['rib']);
            $table->dropIndex(['is_verified']);
            
            $table->dropColumn([
                'seller_phone',
                'cin',
                'bank_name',
                'rib',
                'balance',
                'referral_code',
                'referred_by_id',
                'is_verified',
                'is_active'
            ]);
        });
    }
};
