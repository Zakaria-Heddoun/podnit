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
        Schema::table('orders', function (Blueprint $table) {
            // Make product_id and template_id nullable since items can have different products/templates
            $table->unsignedBigInteger('product_id')->nullable()->change();
            $table->unsignedBigInteger('template_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Revert changes
            $table->unsignedBigInteger('product_id')->nullable(false)->change();
            $table->unsignedBigInteger('template_id')->nullable(false)->change();
        });
    }
};
