<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            // First, drop the foreign key constraint on seller_id if it exists
            if (Schema::hasColumn('withdrawals', 'seller_id')) {
                try {
                    $table->dropForeign(['seller_id']);
                } catch (\Exception $e) {
                    // FK might not exist or have a different name
                }
                
                try {
                    $table->dropIndex(['seller_id']);
                } catch (\Exception $e) {
                    // Index might not exist
                }
            }
        });
        
        Schema::table('withdrawals', function (Blueprint $table) {
            if (!Schema::hasColumn('withdrawals', 'user_id')) {
                // Add user_id column as unsignedBigInteger, nullable first
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
                
                // Add index for user_id
                $table->index(['user_id']);
            }
        });
        
        // Copy data from seller_id to user_id only if sellers table exists
        if (Schema::hasTable('sellers') && Schema::hasColumn('withdrawals', 'seller_id')) {
            DB::statement('UPDATE withdrawals SET user_id = (SELECT user_id FROM sellers WHERE sellers.id = withdrawals.seller_id)');
        } else if (Schema::hasColumn('withdrawals', 'seller_id')) {
             // Fallback: assume seller_id is the user_id or we can't migrate data
             DB::statement('UPDATE withdrawals SET user_id = seller_id');
        }
        
        Schema::table('withdrawals', function (Blueprint $table) {
            // Add foreign key constraint to users table AFTER update
            try {
                 $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            } catch (\Exception $e) {
                // If FK fails, we proceed without it
            }

            // Drop the seller_id column
            if (Schema::hasColumn('withdrawals', 'seller_id')) {
                $table->dropColumn('seller_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            // Add seller_id column back
            $table->unsignedBigInteger('seller_id')->after('id');
        });
        
        // Copy data back from user_id to seller_id
        DB::statement('UPDATE withdrawals SET seller_id = (SELECT id FROM sellers WHERE sellers.user_id = withdrawals.user_id)');
        
        Schema::table('withdrawals', function (Blueprint $table) {
            // Drop user_id foreign key and index
            $table->dropForeign(['user_id']);
            $table->dropIndex(['user_id']);
            
            // Drop user_id column
            $table->dropColumn('user_id');
            
            // Add foreign key constraint back to sellers table
            $table->foreign('seller_id')->references('id')->on('sellers')->onDelete('cascade');
            $table->index(['seller_id']);
        });
    }
};
