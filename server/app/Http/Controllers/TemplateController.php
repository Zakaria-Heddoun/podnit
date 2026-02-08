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
            // Use paginated responses for admins to avoid returning very large collections
            $perPage = (int) $request->get('per_page', 25);
            $perPage = max(5, min(100, $perPage)); // clamp between 5 and 100

            $templates = Template::select(['id','title','status','product_id','user_id','thumbnail_image','created_at','calculated_price'])
                ->with(['user:id,name','product:id,name,base_price,category,available_colors,available_sizes,in_stock,image_url'])
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
        } else {
            // User sees their own templates — return a lightweight, paginated response to avoid memory exhaustion
            $perPage = (int) $request->get('per_page', 15);
            $perPage = max(5, min(50, $perPage)); // clamp to [5,50]

            $templates = Template::select(['id','title','status','product_id','user_id','thumbnail_image','created_at','calculated_price'])
                ->with(['product:id,name,base_price,category,available_colors,available_sizes,in_stock,image_url'])
                ->where('user_id', $user->id)
                ->when($request->status, function ($query, $status) {
                    if ($status !== 'All') {
                        return $query->where('status', strtoupper($status));
                    }
                })
                ->when($request->search, function ($query, $search) {
                    return $query->where('title', 'like', "%{$search}%");
                })
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);
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

        // Reject very large requests early to avoid PHP memory exhaustion when dealing with large base64 blobs
        $maxContentSize = 20 * 1024 * 1024; // 20MB
        if (!empty($contentLength) && $contentLength > $maxContentSize) {
            \Log::warning('Template store request too large, rejecting', ['content_length' => $contentLength]);
            return response()->json([
                'success' => false,
                'message' => 'Request payload too large. Try reducing image sizes or upload smaller images.'
            ], 413);
        }
        
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
            
            // Check template limit (50 templates per seller)
            $user = Auth::user();
            $templateCount = Template::where('user_id', $user->id)->count();
            if ($templateCount >= 50) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template limit reached. You can have a maximum of 50 templates.'
                ], 422);
            }
            
            $designConfig = $this->prepareDesignConfig($request->design_config, $request->design_images ?? null);
            $colors = $this->extractColorsFromRequest($request, $designConfig);
            // Use firstImageFromConfig as fallback; we'll try to generate composite after create
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

                    // Calculate and save the price
                    $template->calculated_price = $template->calculatePrice();
                    $template->save();

                    // Generate composite thumbnail (first view = design + mockup) for better preview
                    $compositeThumb = $this->generateFirstViewCompositeThumbnail($template, $designConfig);
                    if ($compositeThumb) {
                        $template->update(['thumbnail_image' => $compositeThumb]);
                    }

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



            // Prepare a compact response to avoid returning the full design_config and large payloads
            $result = [
                'id' => $template->id,
                'title' => $template->title,
                'thumbnail_image' => $template->thumbnail_image,
                'calculated_price' => $template->calculated_price,
                'status' => $template->status,
                'product' => [
                    'id' => $template->product->id ?? null,
                    'name' => $template->product->name ?? null,
                    'base_price' => $template->product->base_price ?? null,
                ]
            ];

            // Free large variables and trigger GC
            unset($designConfig, $templateData);
            if (function_exists('gc_collect_cycles')) gc_collect_cycles();

            return response()->json([
                'success' => true,
                'message' => 'Template created successfully and is pending approval.',
                'data' => $result
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
     * Update per-view override for a template (admin/owner use)
     */
    public function updateViewOverride(Request $request, Template $template)
    {
        $this->middleware('auth');

        try {
            $user = Auth::user();
            // Only admin or template owner can update overrides
            if ($user->role !== 'admin' && $template->user_id !== $user->id) {
                return response()->json(['success' => false, 'message' => 'Forbidden'], 403);
            }

            $data = $request->validate([
                'view_key' => 'required|string|max:100',
                'override' => 'required|array',
                'override.x' => 'required|numeric',
                'override.y' => 'required|numeric',
                'override.width' => 'required|numeric',
                'override.height' => 'required|numeric',
            ]);

            $designConfig = $template->design_config ?? [];
            if (!is_array($designConfig)) $designConfig = (array) $designConfig;

            if (!isset($designConfig['overrides']) || !is_array($designConfig['overrides'])) {
                $designConfig['overrides'] = [];
            }

            $designConfig['overrides'][$data['view_key']] = $data['override'];

            $template->design_config = $designConfig;
            $template->save();

            return response()->json(['success' => true, 'message' => 'Override saved', 'override' => $data['override']]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to save view override', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to save override'], 500);
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
            'template' => $template,
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
            // Try composite thumbnail (first view = design + mockup); fallback to first image
            $compositeThumb = $this->generateFirstViewCompositeThumbnail($template, $designConfig);
            $data['thumbnail_image'] = $compositeThumb ?? $this->firstImageFromConfig($designConfig) ?? $template->thumbnail_image;
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

        // Recalculate price if design_config changed
        if ($request->has('design_config')) {
            $template->calculated_price = $template->calculatePrice();
            $template->save();
        }

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
     * Download a specific template image with proper CORS headers
     */
    public function downloadImage(Request $request, $templateId, $imageKey)
    {
        $user = Auth::user();
        
        // Verify user has permission (admin, employee with permission, or template owner)
        $template = Template::findOrFail($templateId);
        
        if ($user->role !== 'admin' && !$user->hasPermission('approve_templates') && $user->id !== $template->user_id) {
            \Log::error('Unauthorized download attempt', ['user_id' => $user->id, 'template_id' => $templateId]);
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $designConfig = $this->normalizeDesignConfigValue($template->design_config);
        $imagePath = $designConfig['images'][$imageKey] ?? null;
        
        if (!$imagePath) {
            return response()->json(['error' => 'Image not found'], 404);
        }

        // Handle both full URLs and relative paths
        if (filter_var($imagePath, FILTER_VALIDATE_URL)) {
            // Extract path from full URL
            $imagePath = parse_url($imagePath, PHP_URL_PATH);
        }
        
        // Remove leading slash and 'storage/' prefix if present
        $imagePath = ltrim($imagePath, '/');
        $imagePath = preg_replace('/^storage\//', '', $imagePath);
        
        // Check if file exists in storage
        if (!Storage::disk('public')->exists($imagePath)) {
            \Log::error("Template image not found: {$imagePath}");
            return response()->json(['error' => 'File not found on server'], 404);
        }

        $file = Storage::disk('public')->get($imagePath);
        $mimeType = Storage::disk('public')->mimeType($imagePath);

        return response($file, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'attachment; filename="' . basename($imagePath) . '"')
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
    }

    /**
     * Approve the specified template and generate composite mockups.
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

        // Generate and save composite mockups to the template's product
        try {
            $firstCompositeUrl = $this->generateAndSaveCompositeMockups($template);
            // Update template thumbnail to first-view composite for aligned preview
            if ($firstCompositeUrl) {
                $template->update(['thumbnail_image' => $firstCompositeUrl]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to generate composite mockups for template', [
                'template_id' => $template->id,
                'error' => $e->getMessage()
            ]);
            // Don't fail the approval, just log a warning
        }

        return response()->json([
            'success' => true,
            'message' => 'Template approved successfully.',
            'data' => $template
        ]);
    }

    /**
     * Generate composite mockups and save them to the product.
     * Returns the first composite URL for use as template thumbnail.
     */
    private function generateAndSaveCompositeMockups(Template $template): ?string
    {
        if (!$template->product) {
            \Log::warning('Template has no associated product', ['template_id' => $template->id]);
            return null;
        }

        $designConfig = $this->normalizeDesignConfigValue($template->design_config);
        if (!isset($designConfig['images']) || !isset($designConfig['views'])) {
            return null;
        }

        $mockups = [];
        $firstCompositeUrl = null;

        // For each view, create a composite of design + mockup background
        foreach ($designConfig['views'] as $view) {
            $viewKey = $view['key'] ?? null;
            if (!$viewKey || !isset($designConfig['images'][$viewKey])) {
                continue;
            }

            try {
                // Try to create composite mockup
                $mockupUrl = $this->createCompositeMockup(
                    $template->id,
                    $viewKey,
                    $designConfig['images'][$viewKey],
                    $view['mockup'] ?? null,
                    $view['area'] ?? null,
                    $designConfig['color'] ?? '#ffffff'
                );

                if ($mockupUrl) {
                    if ($firstCompositeUrl === null) {
                        $firstCompositeUrl = $mockupUrl;
                    }
                    // Map view key to mockup keys (front, back, etc.)
                    $mockupKey = $this->mapViewKeyToMockupKey($viewKey);
                    $mockups[$mockupKey] = $mockupUrl;
                }
            } catch (\Exception $e) {
                \Log::warning('Failed to generate composite mockup for view', [
                    'template_id' => $template->id,
                    'view_key' => $viewKey,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Update the product with the generated mockups
        if (!empty($mockups)) {
            $currentMockups = $template->product->mockups ?? [];
            $updatedMockups = array_merge($currentMockups, $mockups);
            $template->product->update(['mockups' => $updatedMockups]);
        }

        return $firstCompositeUrl;
    }

    /**
     * Create a composite image (design + mockup) and save it
     */
    private function createCompositeMockup(
        $templateId,
        $viewKey,
        $designPath,
        $mockupPath = null,
        $printArea = null,
        $backgroundColor = '#ffffff'
    ) {
        try {
            // Use storage to get files
            $designPath = ltrim($designPath, '/');
            $designPath = preg_replace('/^storage\//', '', $designPath);

            if (!Storage::disk('public')->exists($designPath)) {
                \Log::warning('Design file not found', ['path' => $designPath]);
                return null;
            }

            // Load design image
            $designContent = Storage::disk('public')->get($designPath);
            $designImage = imagecreatefromstring($designContent);
            if (!$designImage) {
                \Log::warning('Failed to load design image', ['path' => $designPath]);
                return null;
            }

            $designWidth = imagesx($designImage);
            $designHeight = imagesy($designImage);

            // Determine output size (canvas size for composite)
            $canvasWidth = 1200;
            $canvasHeight = 1400;

            // Create canvas
            $canvas = imagecreatetruecolor($canvasWidth, $canvasHeight);
            $bgColor = $this->hexToRgb($backgroundColor);
            $bgColorId = imagecolorallocate($canvas, $bgColor['r'], $bgColor['g'], $bgColor['b']);
            imagefilledrectangle($canvas, 0, 0, $canvasWidth, $canvasHeight, $bgColorId);

            // Load and draw mockup if available
            if ($mockupPath) {
                try {
                    $mockupPath = ltrim($mockupPath, '/');
                    $mockupPath = preg_replace('/^storage\//', '', $mockupPath);

                    if (Storage::disk('public')->exists($mockupPath)) {
                        $mockupContent = Storage::disk('public')->get($mockupPath);
                        $mockupImage = imagecreatefromstring($mockupContent);
                        if ($mockupImage) {
                            $mockupWidth = imagesx($mockupImage);
                            $mockupHeight = imagesy($mockupImage);

                            // Scale and place mockup
                            imagecopyresampled(
                                $canvas,
                                $mockupImage,
                                0,
                                0,
                                0,
                                0,
                                $canvasWidth,
                                $canvasHeight,
                                $mockupWidth,
                                $mockupHeight
                            );
                            imagedestroy($mockupImage);
                        }
                    }
                } catch (\Exception $e) {
                    \Log::warning('Failed to load mockup image', ['path' => $mockupPath, 'error' => $e->getMessage()]);
                }
            }

            // Place design on canvas
            if ($printArea) {
                // Design goes in the print area
                $printX = ($printArea['x'] ?? 0) * $canvasWidth / 100;
                $printY = ($printArea['y'] ?? 0) * $canvasHeight / 100;
                $printWidth = ($printArea['width'] ?? 100) * $canvasWidth / 100;
                $printHeight = ($printArea['height'] ?? 100) * $canvasHeight / 100;

                imagecopyresampled(
                    $canvas,
                    $designImage,
                    (int)$printX,
                    (int)$printY,
                    0,
                    0,
                    (int)$printWidth,
                    (int)$printHeight,
                    $designWidth,
                    $designHeight
                );
            } else {
                // Center design on canvas
                $x = ($canvasWidth - $designWidth) / 2;
                $y = ($canvasHeight - $designHeight) / 2;
                imagecopy($canvas, $designImage, (int)$x, (int)$y, 0, 0, $designWidth, $designHeight);
            }

            imagedestroy($designImage);

            // Save composite to file
            $filename = "template-{$templateId}-{$viewKey}-composite-" . time() . '.png';
            $storagePath = "templates/composites/{$filename}";

            // Capture PNG
            ob_start();
            imagepng($canvas);
            $pngData = ob_get_clean();
            imagedestroy($canvas);

            // Save to storage
            Storage::disk('public')->put($storagePath, $pngData);

            // Return relative path for storage in database
            return "/storage/{$storagePath}";

        } catch (\Exception $e) {
            \Log::error('Error creating composite mockup', ['error' => $e->getMessage(), 'template_id' => $templateId]);
            return null;
        }
    }

    /**
     * Map view key to mockup key (e.g., front_0 -> front)
     */
    private function mapViewKeyToMockupKey($viewKey)
    {
        // Simple mapping: extract base view name
        if (preg_match('/^(front|back|left|right|left_chest|right_chest)/', $viewKey, $matches)) {
            return $matches[1];
        }
        // Fallback to the full view key
        return $viewKey;
    }

    /**
     * Convert hex color to RGB
     */
    private function hexToRgb($hex)
    {
        $hex = ltrim($hex, '#');
        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2))
        ];
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

        // Extract color once
        $hexColor = $config['color'] ?? '#ffffff';
        if (is_array($hexColor)) $hexColor = $hexColor[0] ?? '#ffffff';

        $processedImages = [];
        foreach (($config['images'] ?? []) as $key => $value) {
            $safeTypeForFile = $this->sanitizeTypeKey((string) $key);
            
            // Find the view config for this key
            $viewConfig = null;
            if (isset($config['views']) && is_array($config['views'])) {
                foreach ($config['views'] as $view) {
                    if (($view['key'] ?? '') === $key) {
                        $viewConfig = $view;
                        break;
                    }
                }
            }

            // Process and save image, potentially compositing it
            $processedUrl = $this->processImageValue($value, $safeTypeForFile, $viewConfig, $hexColor);
            
            if ($processedUrl !== null) {
                $processedImages[$key] = $processedUrl;
            } else {
                $processedImages[$key] = null;
            }
        }
        $config['images'] = $processedImages;

        return $config;
    }

    private function processImageValue($imageData, string $type, ?array $viewConfig = null, string $hexColor = '#ffffff'): ?string
    {
        if (!$imageData) {
            return null;
        }

        // If it's already a URL, return it
        if (is_string($imageData) && (str_starts_with($imageData, '/storage/') || str_starts_with($imageData, 'http'))) {
            return $imageData;
        }

        // If it's base64, save it
        if ($this->isBase64($imageData)) {
            return $this->saveImage($imageData, $type);
        }

        return null;
    }

    private function decodeBase64($data)
    {
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $typeMatch)) {
            $data = substr($data, strpos($data, ',') + 1);
        }
        return base64_decode($data);
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

    /**
     * Generate a composite thumbnail for the template's first view (design + mockup).
     * This ensures the thumbnail looks like the template first view.
     */
    private function generateFirstViewCompositeThumbnail(Template $template, array $designConfig): ?string
    {
        if (empty($designConfig['images']) || empty($designConfig['views'])) {
            return null;
        }

        $views = $designConfig['views'] ?? [];
        $images = $designConfig['images'] ?? [];

        foreach ($views as $view) {
            $viewKey = $view['key'] ?? null;
            if (!$viewKey || empty($images[$viewKey])) {
                continue;
            }

            try {
                $compositeUrl = $this->createCompositeMockup(
                    $template->id,
                    $viewKey,
                    $images[$viewKey],
                    $view['mockup'] ?? null,
                    $view['area'] ?? null,
                    $designConfig['color'] ?? '#ffffff'
                );

                return $compositeUrl;
            } catch (\Exception $e) {
                \Log::warning('Failed to generate first-view composite thumbnail', [
                    'template_id' => $template->id,
                    'view_key' => $viewKey,
                    'error' => $e->getMessage()
                ]);
                return null;
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
