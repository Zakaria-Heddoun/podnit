<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TemplateController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // Admins and employees with approve_templates permission can see all templates
        if ($user->role === 'admin' || $user->hasPermission('approve_templates')) {
            $templates = Template::with(['user', 'product'])
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            // User sees their own templates
            $templates = Template::where('user_id', $user->id)
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $templates
        ]);
    }

    /**
     * Upload a single template image
     * Accepts both base64 (JSON) and file upload (multipart/form-data)
     */
    public function uploadImage(Request $request)
    {
        try {
            $imageData = null;
            $type = $request->input('type');
            
            // Check if it's a file upload (multipart/form-data)
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                // Convert file to base64 for processing
                $imageData = 'data:image/' . $file->getClientOriginalExtension() . ';base64,' . base64_encode(file_get_contents($file->getRealPath()));
            } else {
                // It's base64 in JSON
                $request->validate([
                    'image' => 'required|string', // base64 image
                    'type' => 'required|string|max:100',
                ]);
                $imageData = $request->input('image');
                $type = $request->input('type');
            }

            if (!$imageData || !$type) {
                return response()->json([
                    'success' => false,
                    'message' => 'Image and type are required'
                ], 400);
            }

            $imageUrl = $this->saveImage($imageData, $this->sanitizeTypeKey($type));
            
            if (!$imageUrl) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save image'
                ], 400);
            }

            return response()->json([
                'success' => true,
                'url' => $imageUrl,
                'type' => $type
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Image upload error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $contentLength = $_SERVER['CONTENT_LENGTH'] ?? 0;
        \Log::info('Template store request received', [
            'content_length' => $contentLength,
            'content_length_mb' => round($contentLength / 1024 / 1024, 2) . 'MB',
            'params' => $request->keys()
        ]);
        
        try {
            // Ensure database connection is active (handles "MySQL server has gone away")
            try {
                DB::connection()->getPdo();
            } catch (\Exception $e) {
                \Log::warning('Database connection lost, reconnecting...', ['error' => $e->getMessage()]);
                DB::reconnect();
            }
            
            $request->validate([
                'title' => 'required|string|max:255',
                'product_id' => 'required|exists:products,id',
                'design_config' => 'required', // Accepts JSON string or array
            ]);
            
            $designConfig = $this->prepareDesignConfig($request->design_config, $request->design_images ?? null);
            $colors = $this->extractColorsFromRequest($request, $designConfig);
            $thumbnailUrl = $this->firstImageFromConfig($designConfig);
            
            // Try to increase max_allowed_packet for this session (if possible)
            try {
                DB::statement("SET SESSION max_allowed_packet = 67108864"); // 64MB
            } catch (\Exception $e) {
                \Log::warning('Could not set max_allowed_packet', ['error' => $e->getMessage()]);
            }
            
            $maxRetries = 3;
            $retryCount = 0;
            $template = null;
            $templateData = [
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
                'title' => $request->title,
                'description' => $request->description ?? null,
                'design_config' => $designConfig,
                'thumbnail_image' => $thumbnailUrl,
                'colors' => $colors,
                'status' => 'PENDING',
            ];

            // Log payload size for debugging
            $payloadSize = strlen(json_encode($templateData));
            \Log::info('Creating template with payload size', ['size_bytes' => $payloadSize, 'size_kb' => round($payloadSize / 1024, 2)]);
            
            while ($retryCount < $maxRetries) {
                try {
                    // Ensure connection is active
                    try {
                        $pdo = DB::connection()->getPdo();
                        // Test the connection
                        $pdo->query('SELECT 1');
                    } catch (\Exception $e) {
                        \Log::warning('Connection check failed, reconnecting...', ['error' => $e->getMessage()]);
                        DB::reconnect();
                        // Try to set max_allowed_packet again after reconnect
                        try {
                            DB::statement("SET SESSION max_allowed_packet = 67108864");
                        } catch (\Exception $e2) {
                            // Ignore
                        }
                    }
                    
                    // Use Eloquent create() to handle JSON casting automatically
                    // The Template model will automatically JSON encode colors and design_config
                    $template = Template::create($templateData);

                    \Log::info('Template created successfully', ['template_id' => $template->id]);
                    break; // Success, exit retry loop
                } catch (\Illuminate\Database\QueryException $e) {
                    if (str_contains($e->getMessage(), 'MySQL server has gone away') && $retryCount < $maxRetries - 1) {
                        $retryCount++;
                        \Log::warning("MySQL connection lost, retrying... (attempt {$retryCount}/{$maxRetries})");
                        DB::reconnect();
                        sleep(1); // Wait 1 second before retry
                        continue;
                    }
                    throw $e; // Re-throw if not a connection issue or max retries reached
                }
            }
            
            if (!$template) {
                throw new \Exception('Failed to create template after multiple retries');
            }

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully and is pending approval.',
                'data' => $template
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            \Log::error('Template validation error', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            \Log::error('Template database error', [
                'message' => $e->getMessage(),
                'code' => $e->getCode()
            ]);
            
            // Handle "MySQL server has gone away" error
            if (str_contains($e->getMessage(), 'MySQL server has gone away')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Request too large. Please try reducing image sizes or contact support.',
                    'error' => 'The template data is too large. Try using smaller images or fewer design sides.'
                ], 413);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'Database error: ' . $e->getMessage(),
            ], 500);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Template store error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Template $template)
    {
        $user = Auth::user();
        
        // Admins and employees with approve_templates permission can view any template
        // Sellers can only view their own templates
        if ($user->role !== 'admin' && !$user->hasPermission('approve_templates')) {
            if ($template->user_id !== Auth::id()) {
                abort(403, 'Unauthorized access to template');
            }
        }

        // Eager load relationships
        $template->load(['user', 'product']);

        return response()->json([
            'success' => true,
            'data' => $template
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Template $template)
    {
        if (Auth::user()->role !== 'admin' && Auth::id() !== $template->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'string|max:255',
            'design_config' => 'sometimes',
        ]);

        $data = $request->except(['status', 'admin_feedback', 'approved_by', 'approved_at', 'design_images']);

        if ($request->has('design_config')) {
            $designConfig = $this->prepareDesignConfig($request->design_config, $request->design_images ?? null);
            $data['design_config'] = $designConfig;
            $data['thumbnail_image'] = $this->firstImageFromConfig($designConfig) ?? $template->thumbnail_image;
        }

        if ($request->has('colors')) {
            $data['colors'] = $this->extractColorsFromRequest($request, $data['design_config'] ?? $template->design_config ?? []);
        }

        // If seller updates, reset status to PENDING
        if (Auth::user()->role === 'seller') {
            $data['status'] = 'PENDING';
            $data['admin_feedback'] = null; // Clear old feedback
        }

        $template->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Template updated successfully.',
            'data' => $template
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Template $template)
    {
        if (Auth::user()->role !== 'admin' && Auth::id() !== $template->user_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete stored images (thumbnail + design images)
        $designConfig = $this->normalizeDesignConfigValue($template->design_config);
        $images = $designConfig['images'] ?? [];
        foreach ($images as $url) {
            $this->deleteImage($url);
        }
        $this->deleteImage($template->thumbnail_image);

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template deleted successfully.'
        ]);
    }

    /**
     * Approve the specified template.
     */
    public function approve(Template $template)
    {
        $user = Auth::user();
        
        // Admins and employees with approve_templates permission can approve
        if ($user->role !== 'admin' && !$user->hasPermission('approve_templates')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template->update([
            'status' => 'APPROVED',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'admin_feedback' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template approved successfully.',
            'data' => $template
        ]);
    }

    private function normalizeDesignConfigValue($designConfig): array
    {
        if (is_string($designConfig)) {
            $decoded = json_decode($designConfig, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return $decoded;
            }
        }
        return is_array($designConfig) ? $designConfig : [];
    }

    private function prepareDesignConfig($designConfig, $designImages = null): array
    {
        $config = $this->normalizeDesignConfigValue($designConfig);

        // Merge any explicit images payload
        if (is_array($designImages)) {
            $config['images'] = array_merge($config['images'] ?? [], $designImages);
        }

        $processedImages = [];
        foreach (($config['images'] ?? []) as $key => $value) {
            // Keep the original map key for consistency with saved states/views
            $safeTypeForFile = $this->sanitizeTypeKey((string) $key);
            $processedImages[$key] = $this->processImageValue($value, $safeTypeForFile);
        }
        $config['images'] = $processedImages;

        return $config;
    }

    private function processImageValue($imageData, string $type): ?string
    {
        if (!$imageData) {
            return null;
        }

        if (is_string($imageData) && (str_starts_with($imageData, '/storage/') || str_starts_with($imageData, 'http'))) {
            return $imageData;
        }

        if (is_string($imageData) && str_starts_with($imageData, 'data:')) {
            return $this->saveImage($imageData, $type);
        }

        return null;
    }

    private function firstImageFromConfig(array $designConfig): ?string
    {
        foreach (($designConfig['images'] ?? []) as $url) {
            if (!empty($url)) {
                return $url;
            }
        }

        return null;
    }

    private function extractColorsFromRequest(Request $request, array $designConfig): array
    {
        if (is_array($request->colors)) {
            return $request->colors;
        }

        $decoded = json_decode($request->colors ?? '[]', true);
        if (is_array($decoded) && !empty($decoded)) {
            return $decoded;
        }

        if (!empty($designConfig['color']) && is_string($designConfig['color'])) {
            return [$designConfig['color']];
        }

        return [];
    }

    private function sanitizeTypeKey(?string $type): string
    {
        $clean = strtolower($type ?? 'view');
        $clean = preg_replace('/[^a-z0-9\\-_]+/', '-', $clean);
        $clean = trim((string) $clean, '-_');
        return $clean ?: 'view';
    }

    /**
     * Reject the specified template.
     */
    public function reject(Request $request, Template $template)
    {
        $user = Auth::user();
        
        // Admins and employees with approve_templates permission can reject
        if ($user->role !== 'admin' && !$user->hasPermission('approve_templates')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'reason' => 'required|string|max:1000',
        ]);

        $template->update([
            'status' => 'REJECTED',
            'admin_feedback' => $request->reason,
            'approved_by' => Auth::id(), // Track who rejected it
            'approved_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Template rejected.',
            'data' => $template
        ]);
    }

    /**
     * Save base64 image to storage
     */
    private function saveImage($data, $type = 'image')
    {
        if (!$data) return null;

        // If it's already a URL (e.g. on update without change), return it
        if (!$this->isBase64($data)) {
            return $data;
        }

        if (preg_match('/^data:image\/(\w+);base64,/', $data, $typeMatch)) {
            $extension = strtolower($typeMatch[1]);
            if (!in_array($extension, ['jpg', 'jpeg', 'png', 'gif', 'webp'])) {
                // Default to png if unknown
                $extension = 'png';
            }
            $data = substr($data, strpos($data, ',') + 1);
            $data = base64_decode($data);

            if ($data === false) {
                return null; // Failed decode
            }

            $filename = 'template_' . $type . '_' . Str::random(10) . '_' . time() . '.' . $extension;
            
            // Store in public/templates
            Storage::disk('public')->put('templates/' . $filename, $data);

            return '/storage/templates/' . $filename;
        }

        return null;
    }

    /**
     * Delete image from storage
     */
    private function deleteImage($path)
    {
        if (!$path) return;
        
        // Convert URL to path relative to storage root
        $relativePath = str_replace('/storage/', '', $path);
        
        // Add a safety check to ensure we only delete files in public disk
        if (Storage::disk('public')->exists($relativePath)) {
            Storage::disk('public')->delete($relativePath);
        }
    }

    /**
     * Check if string is base64 image
     */
    private function isBase64($string)
    {
        if (!is_string($string)) return false;
        return preg_match('/^data:image\/(\w+);base64,/', $string);
    }
}
