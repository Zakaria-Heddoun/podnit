<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StudioSettingsController extends Controller
{
    private const SETTING_KEY = 'studio_canvas_colors';

    /**
     * Default colors used when no setting exists.
     *
     * @var array<int, string>
     */
    private array $defaultColors = [
        '#FFFFFF',
        '#000000',
        '#FF0000',
        '#00FF00',
        '#0000FF',
        '#FFFF00',
        '#FF00FF',
        '#00FFFF',
    ];

    /**
     * Return the configured studio canvas colors.
     */
    public function getColors()
    {
        $setting = DB::table('system_settings')
            ->where('setting_key', self::SETTING_KEY)
            ->first();

        $colors = $this->defaultColors;
        if ($setting && $setting->setting_value) {
            $decoded = json_decode($setting->setting_value, true);
            if (is_array($decoded) && count($decoded) > 0) {
                $colors = $decoded;
            }
        }

        return response()->json([
            'success' => true,
            'data' => $colors,
        ]);
    }

    /**
     * Update the studio canvas colors (admin only).
     */
    public function updateColors(Request $request)
    {
        $validated = $request->validate([
            'colors' => 'required|array|min:1',
            'colors.*' => ['required', 'string', 'regex:/^#([A-Fa-f0-9]{6})$/'],
        ]);

        DB::table('system_settings')->updateOrInsert(
            ['setting_key' => self::SETTING_KEY],
            [
                'setting_value' => json_encode($validated['colors']),
                'description' => 'Available colors for the studio canvas background',
                'updated_by' => Auth::id(),
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Studio colors updated successfully.',
            'data' => $validated['colors'],
        ]);
    }
}
