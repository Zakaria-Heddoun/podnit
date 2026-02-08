<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class SystemSettingsController extends Controller
{
    /**
     * Get all system settings.
     */
    public function index()
    {
        try {
            $settings = DB::table('system_settings')->get();
            
            // Format as key-value pairs for easier frontend use
            $formatted = [];
            foreach ($settings as $setting) {
                $formatted[$setting->setting_key] = [
                    'value' => $setting->setting_value,
                    'description' => $setting->description
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formatted
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch system settings', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings'
            ], 500);
        }
    }

    /**
     * Update multiple settings at once.
     */
    public function updateBulk(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*' => 'required'
        ]);

        try {
            DB::beginTransaction();
            
            foreach ($validated['settings'] as $key => $value) {
                DB::table('system_settings')
                    ->where('setting_key', $key)
                    ->update([
                        'setting_value' => is_array($value) ? json_encode($value) : $value,
                        'updated_at' => now()
                    ]);
            }
            
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update system settings', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings'
            ], 500);
        }
    }
}
