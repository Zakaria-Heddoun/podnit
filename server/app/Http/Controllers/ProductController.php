<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    /**
     * Display a listing of all products
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('is_active', true);

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

        // Sort options
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
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
        $product = Product::where('is_active', true)->find($id);

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
     * Get all unique categories
     */
    public function categories(): JsonResponse
    {
        $categories = Product::where('is_active', true)
            ->select('category')
            ->distinct()
            ->pluck('category')
            ->sort()
            ->values();

        return response()->json([
            'success' => true,
            'data' => $categories
        ]);
    }

    /**
     * Get featured products (most popular or newest)
     */
    public function featured(Request $request): JsonResponse
    {
        $limit = min($request->get('limit', 8), 20);
        
        // For now, just get newest products
        // In the future, you could add a 'featured' flag or sort by order count
        $products = Product::where('is_active', true)
            ->latest()
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ]);
    }
}
