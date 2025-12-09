<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\SellerDashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\WithdrawalController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Include authentication routes
require __DIR__.'/auth.php';

// Public health check route
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'message' => 'Laravel API is running'
    ]);
});

// Temporary test routes without authentication (remove in production)
Route::prefix('test')->group(function () {
    Route::post('/orders/from-product', function (Request $request) {
        // Get the first seller user for testing
        $seller = \App\Models\User::where('role', 'seller')->first();
        if (!$seller) {
            return response()->json(['error' => 'No seller found'], 404);
        }

        // Temporarily inject seller into request
        app()->instance('test.seller', $seller);
        
        return app(OrderController::class)->createFromProductTest($request);
    });
    
    Route::get('/orders', function () {
        $seller = \App\Models\User::where('role', 'seller')->first();
        if (!$seller) {
            return response()->json(['error' => 'No seller found'], 404);
        }
        
        $orders = \App\Models\Order::where('user_id', $seller->id)
            ->with(['product', 'customer'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    });
});

// User information routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::get('/user/redirect', [UserController::class, 'getRedirectUrl']);
});

// Admin routes (requires authentication and admin role)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    
    // Orders
    Route::get('/orders', [OrderController::class, 'adminIndex']);
    Route::get('/orders/{order}', [OrderController::class, 'adminShow']);
    
    // Products
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::put('/users/{user}/role', [AdminDashboardController::class, 'updateUserRole']);
    
    // Admin seller management
    Route::get('/sellers', [\App\Http\Controllers\AdminSellerController::class, 'index']);
    Route::put('/sellers/{seller}', [\App\Http\Controllers\AdminSellerController::class, 'update']);
    Route::put('/sellers/{seller}/activate', [\App\Http\Controllers\AdminSellerController::class, 'activate']);

    // Admin product management
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::get('/products/{id}', [AdminProductController::class, 'show']);
    Route::put('/products/{id}', [AdminProductController::class, 'update']);
    Route::put('/products/{id}/toggle-status', [AdminProductController::class, 'toggleStatus']);
    Route::put('/products/{id}/toggle-stock', [AdminProductController::class, 'toggleStock']);

    // Admin transaction management
    Route::get('/deposits', [DepositController::class, 'adminIndex']);
    Route::get('/deposits/{deposit}', [DepositController::class, 'adminShow']);
    Route::put('/deposits/{deposit}', [DepositController::class, 'adminUpdate']);
    Route::get('/withdrawals', [WithdrawalController::class, 'adminIndex']);
    Route::get('/withdrawals/{withdrawal}', [WithdrawalController::class, 'adminShow']);
    Route::put('/withdrawals/{withdrawal}', [WithdrawalController::class, 'adminUpdate']);
});

// Seller routes (requires authentication and seller role)
Route::middleware(['auth:sanctum', 'seller'])->prefix('seller')->group(function () {
    Route::get('/dashboard', [SellerDashboardController::class, 'index']);
    Route::get('/profile', [SellerDashboardController::class, 'profile']);
    Route::put('/profile', [SellerDashboardController::class, 'updateProfile']);
    
    // Product routes
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::get('/products/featured', [ProductController::class, 'featured']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    
    // Order routes
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/stats', [OrderController::class, 'getStats']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/from-product', [OrderController::class, 'createFromProduct']);
    Route::post('/orders/from-template', [OrderController::class, 'createFromTemplate']);
    Route::put('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    
    // Customer routes (removed as per request)
    // Route::get('/customers', [CustomerController::class, 'index']);
    // Route::post('/customers', [CustomerController::class, 'store']);
    // Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    // Route::put('/customers/{customer}', [CustomerController::class, 'update']);
    // Route::delete('/customers/{customer}', [CustomerController::class, 'destroy']);
    Route::post('/customers/find-or-create', [CustomerController::class, 'createOrFind']);
    
    // Transaction routes for sellers
    Route::get('/bank-details', [DepositController::class, 'getBankDetails']);
    Route::get('/deposits', [DepositController::class, 'index']);
    Route::post('/deposits', [DepositController::class, 'store']);
    Route::get('/deposits/{deposit}', [DepositController::class, 'show']);
    Route::get('/withdrawals', [WithdrawalController::class, 'index']);
    Route::post('/withdrawals', [WithdrawalController::class, 'store']);
    Route::get('/withdrawals/{withdrawal}', [WithdrawalController::class, 'show']);
    Route::delete('/withdrawals/{withdrawal}/cancel', [WithdrawalController::class, 'cancel']);

    // Template routes
    Route::get('/templates', [\App\Http\Controllers\TemplateController::class, 'index']);
    Route::post('/templates', [\App\Http\Controllers\TemplateController::class, 'store']);
    Route::get('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'show']);
    Route::put('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'update']);
    Route::delete('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'destroy']);
});

// Admin additional routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/templates', [\App\Http\Controllers\TemplateController::class, 'index']); // Added index route for admin
    Route::get('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'show']); // Show single template
    Route::put('/templates/{template}/approve', [\App\Http\Controllers\TemplateController::class, 'approve']);
    Route::put('/templates/{template}/reject', [\App\Http\Controllers\TemplateController::class, 'reject']);
    // ... existing admin routes are defined above in a separate group, merging logically here or keeping separate
});
