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
        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('phone', 20)->nullable();
            $table->string('cin', 50)->unique()->nullable();
            $table->string('bank_name', 100)->nullable();
            $table->string('rib', 50)->unique()->nullable();
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->string('referral_code', 10)->unique();
            $table->foreignId('referred_by_id')->nullable()->constrained('sellers')->onDelete('set null');
            $table->boolean('is_verified')->default(false);
            $table->timestamps();
            
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
        Schema::dropIfExists('sellers');
    }
};
