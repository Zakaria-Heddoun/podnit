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
use App\Http\Controllers\StudioSettingsController;
use App\Http\Controllers\TestMailController;
use App\Http\Controllers\WebhookController;
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

// Webhook endpoint for EliteSpeed (no auth required - verified by token in request)
Route::post('/webhooks/elitespeed', [WebhookController::class, 'eliteSpeedWebhook']);

// Ensure a named login route exists to prevent exceptions when unauthenticated
Route::any('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');

// Development helper: expose permissions without auth when running locally
if (app()->environment('local')) {
    Route::get('/dev/roles/permissions', function () {
        return response()->json(['message' => 'Dev permissions', 'data' => config('roles.permissions', [])]);
    });
    
    // Debug endpoint to check current user permissions
    Route::middleware('auth:sanctum')->get('/dev/user-debug', function (Request $request) {
        $user = auth()->user();
        if ($user->role_id) {
            $user->load('roleRelation');
        }
        
        return response()->json([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'role_id' => $user->role_id,
            'roleRelation' => $user->roleRelation,
            'permissions' => $user->roleRelation ? ($user->roleRelation->permissions ?? []) : [],
            'hasViewOrders' => $user->hasPermission('view_orders'),
            'hasManageOrders' => $user->hasPermission('manage_orders'),
        ]);
    });

    // Local helper: create/get a dev admin and return a token for testing
    Route::get('/dev/admin-token', function () {
        $admin = \App\Models\User::firstOrCreate(
            ['email' => 'dev-admin@localhost'],
            ['name' => 'Dev Admin', 'password' => bcrypt('password'), 'role' => 'admin']
        );

        $token = $admin->createToken('dev-token')->plainTextToken;
        return response()->json(['token' => $token]);
    });

    // Local helper: create/get a dev seller and return a token for testing
    Route::get('/dev/seller-token', function () {
        $seller = \App\Models\User::firstOrCreate(
            ['email' => 'dev-seller@localhost'],
            ['name' => 'Dev Seller', 'password' => bcrypt('password'), 'role' => 'seller']
        );

        $token = $seller->createToken('dev-token')->plainTextToken;
        return response()->json(['token' => $token]);
    });
}

// User information routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'show']);
    // Backwards-compatibility: some older client bundles call /api/profile — proxy to /user
    Route::get('/profile', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::get('/user/redirect', [UserController::class, 'getRedirectUrl']);
    Route::get('/studio/colors', [StudioSettingsController::class, 'getColors']);
    Route::get('/design-assets', [\App\Http\Controllers\DesignAssetController::class, 'index']);
    Route::get('/storage/proxy', [\App\Http\Controllers\StorageProxyController::class, 'proxy']);
    
    // Test mail endpoint (authenticated users only)
    Route::post('/test-mail', [TestMailController::class, 'sendTestEmail']);
});

// Admin routes (requires authentication, permissions checked in controllers)
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // Orders
    Route::get('/orders', [OrderController::class, 'adminIndex']);
    Route::get('/orders/{order}', [OrderController::class, 'adminShow']);
    Route::post('/orders/{order}/ship', [OrderController::class, 'shipOrder']);
    Route::get('/orders/{order}/track', [OrderController::class, 'trackOrder']);
    Route::put('/orders/{order}/toggle-reshipping', [OrderController::class, 'toggleReshipping']);

    // Templates
    Route::put('/templates/{template}/view-override', [\App\Http\Controllers\TemplateController::class, 'updateViewOverride']);
    
    // Products
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::put('/users/{user}/role', [AdminDashboardController::class, 'updateUserRole']);
    
    // Admin seller management
    Route::get('/sellers', [\App\Http\Controllers\AdminSellerController::class, 'index']);
    Route::put('/sellers/{seller}', [\App\Http\Controllers\AdminSellerController::class, 'update']);
    Route::put('/sellers/{seller}/activate', [\App\Http\Controllers\AdminSellerController::class, 'activate']);
    Route::post('/sellers/{seller}/logout', [\App\Http\Controllers\AdminSellerController::class, 'logout']);
    Route::get('/sellers/{seller}/products', [\App\Http\Controllers\AdminSellerController::class, 'getSellerProducts']);
    Route::post('/sellers/{seller}/products', [\App\Http\Controllers\AdminSellerController::class, 'updateSellerProducts']);

    // Admin product management
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
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

    // Role management
    Route::get('/roles', [\App\Http\Controllers\AdminRoleController::class, 'index']);
    Route::get('/roles/permissions', [\App\Http\Controllers\AdminRoleController::class, 'permissions']);
    Route::post('/roles', [\App\Http\Controllers\AdminRoleController::class, 'store']);
    Route::put('/roles/{role}', [\App\Http\Controllers\AdminRoleController::class, 'update']);
    Route::delete('/roles/{role}', [\App\Http\Controllers\AdminRoleController::class, 'destroy']);

    // Employee management (admin)
    Route::get('/employees', [\App\Http\Controllers\AdminEmployeeController::class, 'index']);
    Route::post('/employees', [\App\Http\Controllers\AdminEmployeeController::class, 'store']);
    Route::put('/employees/{employee}', [\App\Http\Controllers\AdminEmployeeController::class, 'update']);
    Route::put('/studio/colors', [StudioSettingsController::class, 'updateColors']);
    
    // Design Library (admin-uploaded designs for sellers)
    Route::get('/design-assets', [\App\Http\Controllers\DesignAssetController::class, 'index']);
    Route::post('/design-assets', [\App\Http\Controllers\DesignAssetController::class, 'store']);
    Route::delete('/design-assets/{designAsset}', [\App\Http\Controllers\DesignAssetController::class, 'destroy']);

    // System Settings
    Route::get('/settings', [\App\Http\Controllers\SystemSettingsController::class, 'index']);
    Route::put('/settings/bulk', [\App\Http\Controllers\SystemSettingsController::class, 'updateBulk']);
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

    // Points exchange
    Route::post('/points/exchange', [\App\Http\Controllers\PointsExchangeController::class, 'exchange']);

    // Template routes
    Route::get('/templates', [\App\Http\Controllers\TemplateController::class, 'index']);
    Route::post('/templates', [\App\Http\Controllers\TemplateController::class, 'store']);
    Route::post('/templates/upload-image', [\App\Http\Controllers\TemplateController::class, 'uploadImage']);
    Route::get('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'show']);
    Route::put('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'update']);
    Route::delete('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'destroy']);
    Route::get('/templates/{template}/download/{imageKey}', [\App\Http\Controllers\TemplateController::class, 'downloadImage']);

    // Settings
    Route::get('/settings', [\App\Http\Controllers\SystemSettingsController::class, 'index']);
});

// Admin additional routes (auth only — controller enforces admin/permission checks)
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/templates', [\App\Http\Controllers\TemplateController::class, 'index']); // Added index route for admin
    Route::get('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'show']); // Show single template
    Route::get('/templates/{template}/download/{imageKey}', [\App\Http\Controllers\TemplateController::class, 'downloadImage']);
    Route::put('/templates/{template}/approve', [\App\Http\Controllers\TemplateController::class, 'approve']);
    Route::put('/templates/{template}/reject', [\App\Http\Controllers\TemplateController::class, 'reject']);
    
    // Order status sync management
    Route::post('/orders/sync-statuses', [OrderController::class, 'adminSyncStatuses']);
    Route::get('/orders/sync-stats', [OrderController::class, 'adminSyncStats']);
    Route::delete('/templates/{template}', [\App\Http\Controllers\TemplateController::class, 'destroy']); // Delete template
    // ... existing admin routes are defined above in a separate group, merging logically here or keeping separate
});
