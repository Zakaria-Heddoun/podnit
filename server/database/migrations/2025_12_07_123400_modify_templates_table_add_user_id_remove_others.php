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
        Schema::table('templates', function (Blueprint $table) {
            // Drop index for seller_id first for SQLite compatibility
            $table->dropIndex(['seller_id']);
            
            // Drop foreign key for seller_id
            $table->dropForeign(['seller_id']);
            
            // Drop columns
            $table->dropColumn(['seller_id', 'price', 'sizes']);

            // Add new column
            $table->foreignId('user_id')->after('id')->constrained('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');

            // Restore columns (nullable for rollback safety on existing data)
            $table->foreignId('seller_id')->nullable()->constrained('sellers')->onDelete('cascade');
            $table->decimal('price', 8, 2)->nullable();
            $table->json('sizes')->nullable();
        });
    }
};
