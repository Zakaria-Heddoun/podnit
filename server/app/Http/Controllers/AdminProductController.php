<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    /**
     * Display a listing of all products for admin
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query();

        // Filter by category if provided
        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        // Search by name or description
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Filter by status
        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Sort options
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        if (in_array($sortBy, ['name', 'base_price', 'category', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder);
        }

        $perPage = min($request->get('per_page', 12), 50); // Max 50 per page
        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'meta' => [
                'current_page' => $products->currentPage(),
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'last_page' => $products->lastPage(),
                'has_more' => $products->hasMorePages()
            ]
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'base_price' => 'required|numeric|min:0',
            'available_colors' => 'sometimes|array',
            'available_colors.*' => 'string',
            'available_sizes' => 'sometimes|array',
            'available_sizes.*' => 'string',
            'is_active' => 'sometimes|boolean',
            'in_stock' => 'sometimes|boolean',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'views' => 'sometimes|array',
            'views.*.key' => 'required|string|max:50',
            'views.*.name' => 'required|string|max:100',
            'views.*.price' => 'nullable|numeric|min:0',
            'views.*.area.x' => 'nullable|numeric|min:0|max:100',
            'views.*.area.y' => 'nullable|numeric|min:0|max:100',
            'views.*.area.width' => 'nullable|numeric|min:1|max:100',
            'views.*.area.height' => 'nullable|numeric|min:1|max:100',
            // Mockup can be a newly uploaded file or an existing URL/path string
            'views.*.mockup' => 'nullable',
            'views.*.color' => 'nullable|string|max:50',
            // Mockup uploads
            'front_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'back_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'left_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'right_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'gallery' => 'sometimes|array',
            'gallery.*.image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'gallery.*.url' => 'nullable|string',
            'gallery.*.color' => 'nullable|string|max:50',
            // Print areas (percent-based)
            'print_areas' => 'sometimes|array',
            'print_areas.front.x' => 'numeric|min:0|max:100',
            'print_areas.front.y' => 'numeric|min:0|max:100',
            'print_areas.front.width' => 'numeric|min:1|max:100',
            'print_areas.front.height' => 'numeric|min:1|max:100',
            'print_areas.back.x' => 'numeric|min:0|max:100',
            'print_areas.back.y' => 'numeric|min:0|max:100',
            'print_areas.back.width' => 'numeric|min:1|max:100',
            'print_areas.back.height' => 'numeric|min:1|max:100',
            'print_areas.left.x' => 'numeric|min:0|max:100',
            'print_areas.left.y' => 'numeric|min:0|max:100',
            'print_areas.left.width' => 'numeric|min:1|max:100',
            'print_areas.left.height' => 'numeric|min:1|max:100',
            'print_areas.right.x' => 'numeric|min:0|max:100',
            'print_areas.right.y' => 'numeric|min:0|max:100',
            'print_areas.right.width' => 'numeric|min:1|max:100',
            'print_areas.right.height' => 'numeric|min:1|max:100',
        ]);

        $product = Product::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'] ?? 'General',
            'base_price' => $validated['base_price'],
            'available_colors' => $validated['available_colors'] ?? [],
            'available_sizes' => $validated['available_sizes'] ?? [],
            'is_active' => $validated['is_active'] ?? true,
            'in_stock' => $validated['in_stock'] ?? true,
            'mockups' => [],
            'print_areas' => $validated['print_areas'] ?? null,
            'views' => [],
        ]);

        // Handle image upload if a file is provided
        if ($request->hasFile('product_image')) {
            // Store new image directly in public/images/products
            $file = $request->file('product_image');
            $extension = $file->getClientOriginalExtension();
            // Use timestamp to ensure unique filename and avoid browser caching issues
            $filename = sprintf('product-%d-%d.%s', $product->id, time(), $extension);
            $file->move(public_path('images/products'), $filename);
            
            $product->image_url = '/images/products/' . $filename;
        }

        $viewsData = $this->buildViewsPayload($request, $validated, $product->id);
        $product->mockups = $viewsData['mockups'];
        $product->print_areas = $viewsData['print_areas'];
        $product->views = $viewsData['views'];
        
        $product->gallery = $this->buildGalleryPayload($request, $product->id);
        
        $product->save();

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product created successfully'
        ], 201);
    }

    /**
     * Display the specified product
     */
    public function show($id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'base_price' => 'sometimes|numeric|min:0',
            'category' => 'sometimes|string|max:50',
            'is_active' => 'sometimes|boolean',
            'in_stock' => 'sometimes|boolean',
            'image_url' => 'nullable|string',
            'product_image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            'available_colors' => 'sometimes|array',
            'available_sizes' => 'sometimes|array',
            'print_areas' => 'sometimes|array',
            'print_areas.front.x' => 'numeric|min:0|max:100',
            'print_areas.front.y' => 'numeric|min:0|max:100',
            'print_areas.front.width' => 'numeric|min:1|max:100',
            'print_areas.front.height' => 'numeric|min:1|max:100',
            'print_areas.back.x' => 'numeric|min:0|max:100',
            'print_areas.back.y' => 'numeric|min:0|max:100',
            'print_areas.back.width' => 'numeric|min:1|max:100',
            'print_areas.back.height' => 'numeric|min:1|max:100',
            'print_areas.left.x' => 'numeric|min:0|max:100',
            'print_areas.left.y' => 'numeric|min:0|max:100',
            'print_areas.left.width' => 'numeric|min:1|max:100',
            'print_areas.left.height' => 'numeric|min:1|max:100',
            'print_areas.right.x' => 'numeric|min:0|max:100',
            'print_areas.right.y' => 'numeric|min:0|max:100',
            'print_areas.right.width' => 'numeric|min:1|max:100',
            'print_areas.right.height' => 'numeric|min:1|max:100',
            // Mockups
            'front_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'back_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'left_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'right_mockup' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'views' => 'sometimes|array',
            'views.*.key' => 'required|string|max:50',
            'views.*.name' => 'required|string|max:100',
            'views.*.price' => 'nullable|numeric|min:0',
            'views.*.area.x' => 'nullable|numeric|min:0|max:100',
            'views.*.area.y' => 'nullable|numeric|min:0|max:100',
            'views.*.area.width' => 'nullable|numeric|min:1|max:100',
            'views.*.area.height' => 'nullable|numeric|min:1|max:100',
            // Mockup can be a newly uploaded file or an existing URL/path string
            'views.*.mockup' => 'nullable',
            'views.*.color' => 'nullable|string|max:50',
            'gallery' => 'sometimes|array',
            'gallery.*.image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:8192',
            'gallery.*.url' => 'nullable|string',
            'gallery.*.color' => 'nullable|string|max:50',
        ]);

        // Handle image upload if a file is provided
        if ($request->hasFile('product_image')) {
            // Delete old image if exists
            if ($product->image_url && file_exists(public_path(ltrim($product->image_url, '/')))) {
                unlink(public_path(ltrim($product->image_url, '/')));
            }
            
            // Store new image directly in public/images/products
            $file = $request->file('product_image');
            $extension = $file->getClientOriginalExtension();
            // Use timestamp to ensure unique filename and avoid browser caching issues
            $filename = sprintf('product-%d-%d.%s', $product->id, time(), $extension);
            $file->move(public_path('images/products'), $filename);
            
            $validated['image_url'] = '/images/products/' . $filename;
            
            // Remove product_image from validated array as it's not a database field
            unset($validated['product_image']);
        }

        $viewsData = $this->buildViewsPayload($request, $validated, $product->id, $product->mockups ?? [], $product->views ?? []);
        if (!empty($viewsData['mockups'])) {
            $validated['mockups'] = $viewsData['mockups'];
        }
        if (!empty($viewsData['print_areas'])) {
            $validated['print_areas'] = $viewsData['print_areas'];
        }
        if (!empty($viewsData['views'])) {
            $validated['views'] = $viewsData['views'];
        }

        $validated['gallery'] = $this->buildGalleryPayload($request, $product->id, $product->gallery ?? []);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product updated successfully'
        ]);
    }

    /**
     * Toggle product active status
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $validated = $request->validate([
            'is_active' => 'required|boolean'
        ]);

        $product->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product status updated successfully'
        ]);
    }

    /**
     * Toggle product stock status
     */
    public function toggleStock(Request $request, $id): JsonResponse
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $validated = $request->validate([
            'in_stock' => 'required|boolean'
        ]);

        $product->update(['in_stock' => $validated['in_stock']]);

        return response()->json([
            'success' => true,
            'data' => $product,
            'message' => 'Product stock status updated successfully'
        ]);
    }

    /**
     * Store mockup file and return relative path.
     */
    private function storeMockupFile($file, string $side, int $productId): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = sprintf('product-%d-%s-%d.%s', $productId, $side, time(), $extension);
        $file->move(public_path('images/products/mockups'), $filename);
        return '/images/products/mockups/' . $filename;
    }

    /**
     * Build views payload (mockups, print areas, view metadata) from request.
     */
    private function buildViewsPayload(Request $request, array $validated, int $productId, array $existingMockups = [], array $existingViews = []): array
    {
        $viewsInput = $request->input('views', []);
        $views = [];
        $mockups = $existingMockups;
        $printAreas = [];

        // Support legacy fixed fields as fallback
        $legacySides = ['front', 'back', 'left', 'right'];
        if (empty($viewsInput) && ($request->hasFile('front_mockup') || $request->hasFile('back_mockup') || $request->hasFile('left_mockup') || $request->hasFile('right_mockup'))) {
            foreach ($legacySides as $side) {
                $fileKey = $side . '_mockup';
                if ($request->hasFile($fileKey)) {
                    $mockups[$side] = $this->storeMockupFile($request->file($fileKey), $side, $productId);
                }
                $views[] = [
                    'key' => $side,
                    'name' => ucfirst($side),
                    'mockup' => $mockups[$side] ?? null,
                    'area' => $validated['print_areas'][$side] ?? null,
                ];
                if (isset($validated['print_areas'][$side])) {
                    $printAreas[$side] = $validated['print_areas'][$side];
                }
            }
            return [
                'views' => $views,
                'mockups' => $mockups,
                'print_areas' => $printAreas,
            ];
        }

        foreach ($viewsInput as $index => $view) {
            $key = $view['key'] ?? 'view_' . $index;
            $name = $view['name'] ?? ucfirst(Str::slug($key, ' '));
            $area = $view['area'] ?? null;
            $fileField = "views.$index.mockup";
            $price = $view['price'] ?? null;
            $color = $view['color'] ?? null;
            $mockupPath = $view['mockup'] ?? null;

            if ($request->hasFile($fileField)) {
                $mockupPath = $this->storeMockupFile($request->file($fileField), $key, $productId);
            } elseif (!empty($existingViews)) {
                $existing = collect($existingViews)->firstWhere('key', $key);
                // Also check by name and color if key is generic to find matching existing mockup
                if (!$existing && isset($view['name'])) {
                    $existing = collect($existingViews)
                        ->where('name', $view['name'])
                        ->where('color', $color)
                        ->first();
                }
                
                if ($existing && !empty($existing['mockup'])) {
                    $mockupPath = $existing['mockup'];
                }
            }

            if ($mockupPath) {
                $mockups[$key . ($color ? '_' . Str::slug($color) : '')] = $mockupPath;
            }
            if ($area) {
                $printAreas[$key . ($color ? '_' . Str::slug($color) : '')] = $area;
            }

            $views[] = [
                'key' => $key,
                'name' => $name,
                'mockup' => $mockupPath,
                'price' => $price,
                'area' => $area,
                'color' => $color,
            ];
        }

        return [
            'views' => $views,
            'mockups' => $mockups,
            'print_areas' => $printAreas,
        ];
    }

    /**
     * Build gallery payload from request
     */
    private function buildGalleryPayload(Request $request, $productId, $existingGallery = [])
    {
        $gallery = [];
        $galleryInput = $request->input('gallery', []);

        foreach ($galleryInput as $index => $item) {
            $color = $item['color'] ?? null;
            $url = $item['url'] ?? null;
            $fileField = "gallery.$index.image";

            if ($request->hasFile($fileField)) {
                $file = $request->file($fileField);
                $extension = $file->getClientOriginalExtension();
                $filename = sprintf('product-%d-gallery-%d-%d.%s', $productId, $index, time(), $extension);
                
                if (!file_exists(public_path('images/products/gallery'))) {
                    mkdir(public_path('images/products/gallery'), 0777, true);
                }
                
                $file->move(public_path('images/products/gallery'), $filename);
                $url = '/images/products/gallery/' . $filename;
            }

            if ($url) {
                $gallery[] = [
                    'url' => $url,
                    'color' => $color,
                ];
            }
        }

        return $gallery;
    }
}
