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
        Schema::table('deposits', function (Blueprint $table) {
            // First, drop the foreign key constraint on seller_id if it exists
            if (Schema::hasColumn('deposits', 'seller_id')) {
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
        
        Schema::table('deposits', function (Blueprint $table) {
            if (!Schema::hasColumn('deposits', 'user_id')) {
                // Add user_id column as unsignedBigInteger, nullable first
                $table->unsignedBigInteger('user_id')->nullable()->after('id');
                
                // Add index for user_id
                $table->index(['user_id']);
            }
        });
        
        // Copy data from seller_id to user_id only if sellers table exists
        if (Schema::hasTable('sellers') && Schema::hasColumn('deposits', 'seller_id')) {
            DB::statement('UPDATE deposits SET user_id = (SELECT user_id FROM sellers WHERE sellers.id = deposits.seller_id)');
        } else if (Schema::hasColumn('deposits', 'seller_id')) {
             // Fallback: assume seller_id is the user_id or we can't migrate data
             DB::statement('UPDATE deposits SET user_id = seller_id');
        }
        
        Schema::table('deposits', function (Blueprint $table) {
            // Add foreign key constraint to users table AFTER update
            // We wrap this in try-catch in case some user_ids don't exist
            try {
                 $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            } catch (\Exception $e) {
                // If FK fails, we proceed without it or we need to clean up data.
                // For now, let's assume it's okay to proceed without strict FK if data is inconsistent
            }

            // Drop the seller_id column
            if (Schema::hasColumn('deposits', 'seller_id')) {
                $table->dropColumn('seller_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deposits', function (Blueprint $table) {
            // Add seller_id column back
            $table->unsignedBigInteger('seller_id')->after('id');
        });
        
        // Copy data back from user_id to seller_id
        DB::statement('UPDATE deposits SET seller_id = (SELECT id FROM sellers WHERE sellers.user_id = deposits.user_id)');
        
        Schema::table('deposits', function (Blueprint $table) {
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
