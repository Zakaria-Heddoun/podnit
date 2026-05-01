<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\DesignAssetController;
use App\Http\Controllers\AdminProductController;
use App\Http\Controllers\AdminSellerController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\SellerDashboardController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\WithdrawalController;
use App\Http\Controllers\SystemSettingsController;
use App\Http\Controllers\PointsExchangeController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\WebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/signup', [RegisteredUserController::class, 'store']);
Route::post('/create-account', [RegisteredUserController::class, 'store']);

// Delivery provider webhook (no auth — validated by provider token if needed)
Route::post('/webhooks/delivery', [WebhookController::class, 'deliveryWebhook']);

// Authenticated routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', [UserController::class, 'show']);
    Route::put('/user', [UserController::class, 'update']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::get('/user/redirect', [UserController::class, 'getRedirectUrl']);

    // Shared design library
    Route::get('/design-assets', [DesignAssetController::class, 'index']);
});

// Seller routes
Route::middleware(['auth:sanctum'])->prefix('seller')->group(function () {
    // Dashboard & Profile
    Route::get('/dashboard', [SellerDashboardController::class, 'index']);
    Route::get('/profile', [SellerDashboardController::class, 'profile']);
    Route::put('/profile', [SellerDashboardController::class, 'updateProfile']);

    // Products
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/categories', [ProductController::class, 'categories']);
    Route::get('/products/{product}', [ProductController::class, 'show']);

    // Orders & Returns
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders/from-product', [OrderController::class, 'createFromProduct']);
    Route::post('/orders/from-template', [OrderController::class, 'createFromTemplate']);
    Route::post('/orders', [OrderController::class, 'createFromProduct']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);

    // Templates
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::post('/templates', [TemplateController::class, 'store']);
    // Backward-compatible endpoint used by Studio image uploads.
    Route::post('/templates/upload-image', [TemplateController::class, 'uploadImage']);
    Route::get('/templates/{template}', [TemplateController::class, 'show']);
    Route::put('/templates/{template}', [TemplateController::class, 'update']);
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy']);
    
    // Uploads
    Route::post('/upload', [TemplateController::class, 'uploadImage']);

    // Deposits
    Route::get('/deposits', [DepositController::class, 'index']);
    Route::post('/deposits', [DepositController::class, 'store']);
    Route::get('/deposits/{deposit}', [DepositController::class, 'show']);
    Route::get('/bank-details', [DepositController::class, 'getBankDetails']);

    // Withdrawals
    Route::get('/withdrawals', [WithdrawalController::class, 'index']);
    Route::post('/withdrawals', [WithdrawalController::class, 'store']);
    Route::put('/withdrawals/{withdrawal}/cancel', [WithdrawalController::class, 'cancel']);

    // Settings (public read for seller UI)
    Route::get('/settings', [SystemSettingsController::class, 'index']);

    // Points Exchange
    Route::post('/points-exchange', [PointsExchangeController::class, 'exchange']);
});

// Admin routes
Route::middleware(['auth:sanctum'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::put('/users/{user}/role', [AdminDashboardController::class, 'updateUserRole']);
    Route::get('/sellers', [AdminSellerController::class, 'index']);
    Route::put('/sellers/{seller}', [AdminSellerController::class, 'update']);
    Route::put('/sellers/{seller}/activate', [AdminSellerController::class, 'activate']);
    Route::post('/sellers/{seller}/logout', [AdminSellerController::class, 'logout']);
    Route::get('/sellers/{seller}/products', [AdminSellerController::class, 'getSellerProducts']);
    Route::post('/sellers/{seller}/products', [AdminSellerController::class, 'updateSellerProducts']);

    // Products
    Route::get('/products', [AdminProductController::class, 'index']);
    Route::post('/products', [AdminProductController::class, 'store']);
    Route::get('/products/{product}', [AdminProductController::class, 'show']);
    Route::put('/products/{product}', [AdminProductController::class, 'update']);
    Route::post('/products/{product}', [AdminProductController::class, 'update']); // _method=PUT via POST
    Route::put('/products/{product}/toggle-status', [AdminProductController::class, 'toggleStatus']);
    Route::put('/products/{product}/toggle-stock', [AdminProductController::class, 'toggleStock']);

    // Orders
    Route::get('/orders', [OrderController::class, 'adminIndex']);
    Route::get('/orders/{order}', [OrderController::class, 'adminShow']);
    Route::post('/orders/{order}/ship', [OrderController::class, 'shipOrder']);
    Route::get('/orders/{order}/track', [OrderController::class, 'trackOrder']);
    Route::post('/orders/{order}/mark-returned', [OrderController::class, 'markAsReturned']);
    Route::put('/orders/{order}/toggle-reshipping', [OrderController::class, 'toggleReshipping']);
    Route::post('/orders/sync-statuses', [OrderController::class, 'adminSyncStatuses']);
    Route::get('/orders/sync-stats', [OrderController::class, 'adminSyncStats']);

    // Templates
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/templates/{template}', [TemplateController::class, 'show']);
    Route::put('/templates/{template}/approve', [TemplateController::class, 'approve']);
    Route::put('/templates/{template}/reject', [TemplateController::class, 'reject']);
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy']);
    Route::get('/templates/{template}/view-override', [TemplateController::class, 'updateViewOverride']);

    // Design library
    Route::get('/design-assets', [DesignAssetController::class, 'index']);
    Route::post('/design-assets', [DesignAssetController::class, 'store']);
    Route::delete('/design-assets/{designAsset}', [DesignAssetController::class, 'destroy']);

    // Deposits management
    Route::get('/deposits', [DepositController::class, 'adminIndex']);
    Route::get('/deposits/{deposit}', [DepositController::class, 'adminShow']);
    Route::put('/deposits/{deposit}', [DepositController::class, 'adminUpdate']);

    // Withdrawals management
    Route::get('/withdrawals', [WithdrawalController::class, 'adminIndex']);
    Route::get('/withdrawals/{withdrawal}', [WithdrawalController::class, 'adminShow']);
    Route::put('/withdrawals/{withdrawal}', [WithdrawalController::class, 'adminUpdate']);

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index']);
    Route::post('/employees', [EmployeeController::class, 'store']);
    Route::get('/employees/{employee}', [EmployeeController::class, 'show']);
    Route::put('/employees/{employee}', [EmployeeController::class, 'update']);
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy']);

    // Roles & Permissions
    Route::get('/roles/permissions', [RoleController::class, 'permissions']);
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::get('/roles/{role}', [RoleController::class, 'show']);
    Route::put('/roles/{role}', [RoleController::class, 'update']);
    Route::delete('/roles/{role}', [RoleController::class, 'destroy']);

    // System Settings
    Route::get('/settings', [SystemSettingsController::class, 'index']);
    Route::put('/settings', [SystemSettingsController::class, 'updateBulk']);
});
