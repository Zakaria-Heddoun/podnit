<?php

namespace App\Http\Controllers;

use App\Models\DesignAsset;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DesignAssetController extends Controller
{
    /**
     * List design assets. Admin sees all; sellers see all (public library).
     */
    public function index(Request $request)
    {
        $query = DesignAsset::query()->orderBy('created_at', 'desc');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $assets = $query->get()->map(function ($asset) {
            return [
                'id' => $asset->id,
                'title' => $asset->title,
                'image_path' => $asset->image_path,
                'image_url' => $this->getFullUrl($asset->image_path),
                'category' => $asset->category,
                'created_at' => $asset->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $assets,
        ]);
    }

    /**
     * Store a new design asset (admin only).
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && !$user->hasPermission('manage_products')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'image' => 'required', // base64 or file
            'category' => 'nullable|string|max:100',
        ]);

        $imageUrl = $this->saveImage($request->image, $request->title);
        if (!$imageUrl) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save image',
            ], 400);
        }

        $asset = DesignAsset::create([
            'title' => $request->title,
            'image_path' => $imageUrl,
            'category' => $request->category,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Design added successfully',
            'data' => [
                'id' => $asset->id,
                'title' => $asset->title,
                'image_path' => $asset->image_path,
                'image_url' => $this->getFullUrl($asset->image_path),
                'category' => $asset->category,
            ],
        ], 201);
    }

    /**
     * Delete a design asset (admin only).
     */
    public function destroy(DesignAsset $designAsset)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && !$user->hasPermission('manage_products')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $path = ltrim($designAsset->image_path, '/');
        $path = preg_replace('/^storage\//', '', $path);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }

        $designAsset->delete();

        return response()->json([
            'success' => true,
            'message' => 'Design deleted successfully',
        ]);
    }

    private function getFullUrl(?string $path): string
    {
        if (!$path) return '';
        if (str_starts_with($path, 'http')) return $path;
        $base = rtrim(config('app.url'), '/');
        return $base . (str_starts_with($path, '/') ? $path : '/' . $path);
    }

    private function saveImage($data, string $prefix): ?string
    {
        if (!$data) return null;

        if ($this->isBase64($data)) {
            if (preg_match('/^data:image\/(\w+);base64,/', $data, $m)) {
                $ext = strtolower($m[1]);
                if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) $ext = 'png';
                $data = substr($data, strpos($data, ',') + 1);
                $data = base64_decode($data);
                if ($data === false) return null;
                $filename = 'design_' . Str::slug($prefix) . '_' . Str::random(8) . '_' . time() . '.' . $ext;
                $path = 'design-assets/' . $filename;
                Storage::disk('public')->put($path, $data);
                return '/storage/' . $path;
            }
        }

        if ($data instanceof \Illuminate\Http\UploadedFile) {
            $file = $data;
            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) $ext = 'png';
            $filename = 'design_' . Str::slug($prefix) . '_' . Str::random(8) . '_' . time() . '.' . $ext;
            $path = $file->storeAs('design-assets', $filename, 'public');
            return '/storage/' . $path;
        }

        return null;
    }

    private function isBase64($v): bool
    {
        return is_string($v) && preg_match('/^data:image\/(\w+);base64,/', $v);
    }
}
