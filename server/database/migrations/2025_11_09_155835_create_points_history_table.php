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
        Schema::create('points_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('sellers')->onDelete('cascade');
            $table->integer('points');
            $table->enum('type', ['EARNED', 'REDEEMED']);
            $table->enum('source', ['REFERRAL', 'ADMIN', 'PROMOTION', 'REDEMPTION']);
            $table->string('description')->nullable();
            $table->unsignedBigInteger('related_id')->nullable();
            $table->timestamps();
            
            $table->index(['seller_id']);
            $table->index(['type']);
            $table->index(['source']);
            $table->index(['created_at']);
            $table->index(['related_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('points_history');
    }
};
