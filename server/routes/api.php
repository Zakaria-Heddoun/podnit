<?php

use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\SellerDashboardController;
use App\Http\Controllers\UserController;
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

// User information routes (requires authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [UserController::class, 'show']);
    Route::get('/user/redirect', [UserController::class, 'getRedirectUrl']);
});

// Admin routes (requires authentication and admin role)
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);
    Route::get('/users', [AdminDashboardController::class, 'users']);
    Route::put('/users/{user}/role', [AdminDashboardController::class, 'updateUserRole']);
});

// Seller routes (requires authentication and seller role)
Route::middleware(['auth:sanctum', 'seller'])->prefix('seller')->group(function () {
    Route::get('/dashboard', [SellerDashboardController::class, 'index']);
    Route::get('/profile', [SellerDashboardController::class, 'profile']);
    Route::put('/profile', [SellerDashboardController::class, 'updateProfile']);
});
