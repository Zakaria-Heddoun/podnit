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
                    'type' => 'required|string|in:big-front,small-front,back,left-sleeve,right-sleeve',
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

            $imageUrl = $this->saveImage($imageData, $type);
            
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
                'design_config' => 'required|string', // No size limit - stored as TEXT in database
            ]);
            
            $designConfig = $request->design_config;
            
            // If design_config is a JSON string, decode it so Eloquent can handle it properly
            // The model casts it as 'array', so it expects an array, not a JSON string
            if (is_string($designConfig)) {
                $decoded = json_decode($designConfig, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $designConfig = $decoded;
                }
            }
            
            // Log size for monitoring
            $configSize = is_string($designConfig) ? strlen($designConfig) : strlen(json_encode($designConfig));
            \Log::info('Design config size', ['size_bytes' => $configSize, 'size_kb' => round($configSize / 1024, 2)]);

            // Process images ONLY if they're base64 (not URLs)
            // If frontend uploaded images separately, they should already be URLs
            \Log::info('Processing images (only if base64)...');
            
            $processImage = function($imageData, $type) {
                if (!$imageData) return null;
                // If it's already a URL (starts with /storage/ or http), use it directly
                if (is_string($imageData) && (str_starts_with($imageData, '/storage/') || str_starts_with($imageData, 'http'))) {
                    return $imageData;
                }
                // If it's base64, process it
                if (is_string($imageData) && str_starts_with($imageData, 'data:')) {
                    return $this->saveImage($imageData, $type);
                }
                // Otherwise assume it's already a URL
                return $imageData;
            };
            
            $bigFrontImageUrl = $processImage($request->big_front_image, 'big-front');
            $smallFrontImageUrl = $processImage($request->small_front_image, 'small-front');
            $backImageUrl = $processImage($request->back_image, 'back');
            $leftSleeveImageUrl = $processImage($request->left_sleeve_image, 'left-sleeve');
            $rightSleeveImageUrl = $processImage($request->right_sleeve_image, 'right-sleeve');

            \Log::info('Images processed', [
                'big_front' => $bigFrontImageUrl ? 'saved' : 'null',
                'small_front' => $smallFrontImageUrl ? 'saved' : 'null',
                'back' => $backImageUrl ? 'saved' : 'null',
                'left_sleeve' => $leftSleeveImageUrl ? 'saved' : 'null',
                'right_sleeve' => $rightSleeveImageUrl ? 'saved' : 'null',
            ]);

            // Thumbnail priority: big_front > small_front > back > sleeves
            $thumbnailUrl = $bigFrontImageUrl ?? $smallFrontImageUrl ?? $backImageUrl ?? $leftSleeveImageUrl ?? $rightSleeveImageUrl;
            
            \Log::info('Selected thumbnail', ['thumbnail' => $thumbnailUrl]);

            // Now create template with ONLY URLs (no base64 data)
            // All images are already saved to disk, so we're only storing small URL strings
            \Log::info('Creating template record with image URLs only', [
                'payload_size' => strlen(json_encode([
                    'title' => $request->title,
                    'product_id' => $request->product_id,
                    'design_config' => $request->design_config,
                ]))
            ]);
            
            // Try to increase max_allowed_packet for this session (if possible)
            try {
                DB::statement("SET SESSION max_allowed_packet = 67108864"); // 64MB
            } catch (\Exception $e) {
                \Log::warning('Could not set max_allowed_packet', ['error' => $e->getMessage()]);
            }
            
            $maxRetries = 3;
            $retryCount = 0;
            $template = null;
            
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
                    
                    // Create template directly (no transaction to reduce overhead)
                    // All images are already URLs (not base64), so payload is very small
                    // Eloquent will automatically JSON encode colors and design_config (array cast)
                    $templateData = [
                        'user_id' => Auth::id(),
                        'product_id' => $request->product_id,
                        'title' => $request->title,
                        'description' => $request->description ?? null,
                        'design_config' => $designConfig, // Should be array (decoded from JSON string)
                        'thumbnail_image' => $thumbnailUrl,
                        'big_front_image' => $bigFrontImageUrl,
                        'small_front_image' => $smallFrontImageUrl,
                        'back_image' => $backImageUrl,
                        'left_sleeve_image' => $leftSleeveImageUrl,
                        'right_sleeve_image' => $rightSleeveImageUrl,
                        'colors' => is_array($request->colors) ? $request->colors : (json_decode($request->colors ?? '[]', true) ?: []),
                        'status' => 'PENDING',
                    ];
                    
                    // Log payload size for debugging
                    $payloadSize = strlen(json_encode($templateData));
                    \Log::info('Creating template with payload size', ['size_bytes' => $payloadSize, 'size_kb' => round($payloadSize / 1024, 2)]);
                    
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
        ]);

        $data = $request->except(['status', 'admin_feedback', 'approved_by', 'approved_at']);

        // Handle all design side image updates if provided
        if ($request->has('big_front_image') && $this->isBase64($request->big_front_image)) {
            $data['big_front_image'] = $this->saveImage($request->big_front_image, 'big-front');
        }
        if ($request->has('small_front_image') && $this->isBase64($request->small_front_image)) {
            $data['small_front_image'] = $this->saveImage($request->small_front_image, 'small-front');
        }
        if ($request->has('back_image') && $this->isBase64($request->back_image)) {
            $data['back_image'] = $this->saveImage($request->back_image, 'back');
        }
        if ($request->has('left_sleeve_image') && $this->isBase64($request->left_sleeve_image)) {
            $data['left_sleeve_image'] = $this->saveImage($request->left_sleeve_image, 'left-sleeve');
        }
        if ($request->has('right_sleeve_image') && $this->isBase64($request->right_sleeve_image)) {
            $data['right_sleeve_image'] = $this->saveImage($request->right_sleeve_image, 'right-sleeve');
        }

        // Update thumbnail if any image was updated
        if (isset($data['big_front_image']) || isset($data['small_front_image']) || 
            isset($data['back_image']) || isset($data['left_sleeve_image']) || isset($data['right_sleeve_image'])) {
            $data['thumbnail_image'] = $data['big_front_image'] ?? $data['small_front_image'] ?? 
                                       $data['back_image'] ?? $data['left_sleeve_image'] ?? 
                                       $data['right_sleeve_image'] ?? $template->thumbnail_image;
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

        // Delete images from storage
        if ($template->front_image) $this->deleteImage($template->front_image);
        if ($template->back_image) $this->deleteImage($template->back_image);
        if ($template->sleeve_image) $this->deleteImage($template->sleeve_image);

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
