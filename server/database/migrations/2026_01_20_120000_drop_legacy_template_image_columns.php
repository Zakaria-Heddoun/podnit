<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Move legacy columns into design_config.images before dropping them
        DB::table('templates')->orderBy('id')->chunkById(100, function ($templates) {
            foreach ($templates as $template) {
                $config = $template->design_config;
                if (is_string($config)) {
                    $decoded = json_decode($config, true);
                    $config = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
                }
                if (!is_array($config)) {
                    $config = [];
                }

                $images = $config['images'] ?? [];
                $legacyMap = [
                    'big_front_image' => 'big-front',
                    'small_front_image' => 'small-front',
                    'back_image' => 'back',
                    'left_sleeve_image' => 'left-sleeve',
                    'right_sleeve_image' => 'right-sleeve',
                    'old_sleeve_image' => 'sleeve',
                ];

                foreach ($legacyMap as $column => $key) {
                    if (!empty($template->{$column}) && empty($images[$key])) {
                        $images[$key] = $template->{$column};
                    }
                }

                $config['images'] = $images;

                if (!isset($config['views']) && !empty($images)) {
                    $config['views'] = [];
                    foreach ($images as $key => $url) {
                        $config['views'][] = [
                            'key' => $key,
                            'name' => ucwords(str_replace('-', ' ', $key)),
                        ];
                    }
                }

                $thumbnail = $template->thumbnail_image;
                if (!$thumbnail) {
                    foreach ($images as $url) {
                        if (!empty($url)) {
                            $thumbnail = $url;
                            break;
                        }
                    }
                }

                DB::table('templates')->where('id', $template->id)->update([
                    'design_config' => json_encode($config),
                    'thumbnail_image' => $thumbnail,
                ]);
            }
        });

        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn([
                'back_image',
                'old_sleeve_image',
                'big_front_image',
                'small_front_image',
                'left_sleeve_image',
                'right_sleeve_image',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->string('back_image', 500)->nullable()->after('design_config');
            $table->string('old_sleeve_image', 500)->nullable()->after('back_image');
            $table->string('big_front_image', 500)->nullable()->after('design_config');
            $table->string('small_front_image', 500)->nullable()->after('big_front_image');
            $table->string('left_sleeve_image', 500)->nullable()->after('back_image');
            $table->string('right_sleeve_image', 500)->nullable()->after('left_sleeve_image');
        });

        DB::table('templates')->orderBy('id')->chunkById(100, function ($templates) {
            foreach ($templates as $template) {
                $config = $template->design_config;
                if (is_string($config)) {
                    $decoded = json_decode($config, true);
                    $config = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
                }
                if (!is_array($config)) {
                    $config = [];
                }

                $images = $config['images'] ?? [];
                DB::table('templates')->where('id', $template->id)->update([
                    'big_front_image' => $images['big-front'] ?? null,
                    'small_front_image' => $images['small-front'] ?? null,
                    'back_image' => $images['back'] ?? null,
                    'left_sleeve_image' => $images['left-sleeve'] ?? null,
                    'right_sleeve_image' => $images['right-sleeve'] ?? null,
                ]);
            }
        });
    }
};
