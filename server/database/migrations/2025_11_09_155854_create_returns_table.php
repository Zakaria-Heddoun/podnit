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
        Schema::create('returns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('cascade');
            $table->enum('reason', ['DEFECTIVE', 'WRONG_SIZE', 'CUSTOMER_CHANGE', 'OTHER']);
            $table->text('description')->nullable();
            $table->enum('status', ['REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSED'])->default('REQUESTED');
            $table->decimal('refund_amount', 10, 2)->nullable();
            $table->text('admin_notes')->nullable();
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
            
            $table->index(['order_id']);
            $table->index(['seller_id']);
            $table->index(['status']);
            $table->index(['reason']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returns');
    }
};
