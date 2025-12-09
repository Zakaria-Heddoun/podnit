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
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->json('design_config')->nullable();
            $table->string('front_image', 500)->nullable();
            $table->string('back_image', 500)->nullable();
            $table->string('sleeve_image', 500)->nullable();
            $table->json('colors')->nullable();
            $table->json('sizes')->nullable();
            $table->decimal('price', 8, 2);
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');
            $table->text('admin_feedback')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            
            $table->index(['seller_id']);
            $table->index(['product_id']);
            $table->index(['status']);
            $table->index(['approved_by']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
