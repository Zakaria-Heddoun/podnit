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
            $table->string('status')->default('PENDING')->change();
            $table->string('shipping_status')->nullable()->after('status');
            $table->boolean('allow_reshipping')->default(true)->after('shipping_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'PRINTED', 'DELIVERING', 'SHIPPED', 'PAID', 'CANCELLED', 'RETURNED'])->default('PENDING')->change();
            $table->dropColumn(['shipping_status', 'allow_reshipping']);
        });
    }
};
