<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class StorageProxyController extends Controller
{
    public function proxy(Request $request)
    {
        $path = $request->query('path');

        if (!$path) {
            return response()->json(['message' => 'Path required'], 400);
        }

        // Clean path to prevent traversal
        $path = str_replace(['..', '//'], ['', '/'], $path);
        
        // remove leading /storage/ for storage disk check
        $storagePath = preg_replace('#^/?storage/#', '', $path);
        
        // Priority 1: Check Public Storage disk
        if (Storage::disk('public')->exists($storagePath)) {
            return response()->file(Storage::disk('public')->path($storagePath));
        }

        // Priority 2: Check absolute public path (for assets like /images/...)
        // Remove leading slash for local path resolution
        $relativePath = ltrim($path, '/');
        $absolutePath = public_path($relativePath);

        if (file_exists($absolutePath)) {
            // Security check: ensure file is within public directory
            if (strpos(realpath($absolutePath), public_path()) === 0) {
                 return response()->file($absolutePath);
            }
        }

        return response()->json(['message' => 'File not found', 'path' => $path], 404);
    }
}
