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
            // Add new design side image columns
            $table->string('big_front_image', 500)->nullable()->after('design_config');
            $table->string('small_front_image', 500)->nullable()->after('big_front_image');
            $table->string('left_sleeve_image', 500)->nullable()->after('back_image');
            $table->string('right_sleeve_image', 500)->nullable()->after('left_sleeve_image');
            
            // Rename old columns for clarity
            $table->renameColumn('front_image', 'thumbnail_image');
            $table->renameColumn('sleeve_image', 'old_sleeve_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['big_front_image', 'small_front_image', 'left_sleeve_image', 'right_sleeve_image']);
            $table->renameColumn('thumbnail_image', 'front_image');
            $table->renameColumn('old_sleeve_image', 'sleeve_image');
        });
    }
};
