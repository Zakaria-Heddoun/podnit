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
        Schema::table('products', function (Blueprint $table) {
            // Store per-side mockup URLs (front/back/left/right)
            $table->json('mockups')->nullable()->after('available_sizes');
            // Store printable area config per side (percent-based x/y/width/height)
            $table->json('print_areas')->nullable()->after('mockups');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['mockups', 'print_areas']);
        });
    }
};
