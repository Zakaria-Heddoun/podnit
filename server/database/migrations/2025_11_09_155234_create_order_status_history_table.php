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
        Schema::create('order_status_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('orders')->onDelete('cascade');
            $table->enum('old_status', ['PENDING', 'IN_PROGRESS', 'PRINTED', 'DELIVERING', 'SHIPPED', 'PAID', 'CANCELLED', 'RETURNED'])->nullable();
            $table->enum('new_status', ['PENDING', 'IN_PROGRESS', 'PRINTED', 'DELIVERING', 'SHIPPED', 'PAID', 'CANCELLED', 'RETURNED']);
            $table->text('notes')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            $table->index(['order_id']);
            $table->index(['updated_by']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_status_history');
    }
};
