<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
}
