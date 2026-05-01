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
        if (!Schema::hasColumn('templates', 'calculated_price')) {
            Schema::table('templates', function (Blueprint $table) {
                $table->decimal('calculated_price', 10, 2)->nullable()->after('thumbnail_image');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('templates', 'calculated_price')) {
            Schema::table('templates', function (Blueprint $table) {
                $table->dropColumn('calculated_price');
            });
        }
    }
};
