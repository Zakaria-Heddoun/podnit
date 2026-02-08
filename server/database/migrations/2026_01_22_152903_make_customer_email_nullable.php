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
        Schema::table('customers', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
            
            // Drop the old unique constraint if it exists
            $table->dropUnique(['user_id', 'email']);
            
            // Add a new unique constraint for phone number per seller
            $table->unique(['user_id', 'phone']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
            $table->dropUnique(['user_id', 'phone']);
            $table->unique(['user_id', 'email']);
        });
    }
};
