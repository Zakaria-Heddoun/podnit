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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained('templates')->onDelete('set null');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('order_number', 50)->unique();
            $table->json('customization')->nullable();
            $table->integer('quantity')->default(1);
            $table->decimal('unit_price', 8, 2);
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'PRINTED', 'DELIVERING', 'SHIPPED', 'PAID', 'CANCELLED', 'RETURNED'])->default('PENDING');
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->json('shipping_address');
            $table->string('tracking_number', 100)->nullable();
            $table->timestamps();
            
            $table->index(['seller_id']);
            $table->index(['template_id']);
            $table->index(['order_number']);
            $table->index(['status']);
            $table->index(['created_at']);
            $table->index(['tracking_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
