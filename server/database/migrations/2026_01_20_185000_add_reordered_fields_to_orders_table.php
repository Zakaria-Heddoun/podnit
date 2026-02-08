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
            $table->boolean('is_reordered')->default(false)->after('status');
            $table->unsignedBigInteger('reordered_from_id')->nullable()->after('is_reordered');
            $table->foreign('reordered_from_id')->references('id')->on('orders')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['reordered_from_id']);
            $table->dropColumn(['is_reordered', 'reordered_from_id']);
        });
    }
};
