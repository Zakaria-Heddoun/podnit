<?php

/**
 * Simple API Test Script for Laravel Backend
 * This script tests the authentication flow and role-based access control
 */

$baseUrl = 'http://127.0.0.1:8000/api';

function makeRequest($url, $method = 'GET', $data = null, $headers = []) {
    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge([
        'Content-Type: application/json',
        'Accept: application/json'
    ], $headers));
    
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'status' => $httpCode,
        'body' => json_decode($response, true)
    ];
}

echo "=== Laravel API Testing ===\n\n";

// Test 1: Health Check
echo "1. Testing Health Check...\n";
$response = makeRequest($baseUrl . '/health');
echo "Status: " . $response['status'] . "\n";
echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";

// Test 2: Register a new seller with unique email
echo "2. Testing Seller Registration...\n";
$uniqueEmail = 'seller' . time() . '@test.com';
$sellerData = [
    'name' => 'Test Seller',
    'email' => $uniqueEmail,
    'password' => 'password123',
    'password_confirmation' => 'password123'
];
$response = makeRequest($baseUrl . '/register', 'POST', $sellerData);
echo "Status: " . $response['status'] . "\n";
echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";

// Test 3: Login as Admin
echo "3. Testing Admin Login...\n";
$adminLogin = [
    'email' => 'admin@podnit.com',
    'password' => 'admin123'
];
$response = makeRequest($baseUrl . '/login', 'POST', $adminLogin);
echo "Status: " . $response['status'] . "\n";
echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";

if ($response['status'] === 200 && isset($response['body']['token'])) {
    $adminToken = $response['body']['token'];
    echo "Admin token obtained successfully!\n\n";
    
    // Test 4: Access Admin Dashboard
    echo "4. Testing Admin Dashboard Access...\n";
    $response = makeRequest($baseUrl . '/admin/dashboard', 'GET', null, ['Authorization: Bearer ' . $adminToken]);
    echo "Status: " . $response['status'] . "\n";
    echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";
    
    // Test 5: Get All Users (Admin only)
    echo "5. Testing Get All Users (Admin only)...\n";
    $response = makeRequest($baseUrl . '/admin/users', 'GET', null, ['Authorization: Bearer ' . $adminToken]);
    echo "Status: " . $response['status'] . "\n";
    echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Admin login failed!\n\n";
}

// Test 6: Login as Seller
echo "6. Testing Seller Login...\n";
$sellerLogin = [
    'email' => $uniqueEmail,
    'password' => 'password123'
];
$response = makeRequest($baseUrl . '/login', 'POST', $sellerLogin);
echo "Status: " . $response['status'] . "\n";
echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n";

if ($response['status'] === 200 && isset($response['body']['token'])) {
    $sellerToken = $response['body']['token'];
    echo "Seller token obtained successfully!\n\n";
    
    // Test 7: Access Seller Dashboard
    echo "7. Testing Seller Dashboard Access...\n";
    $response = makeRequest($baseUrl . '/seller/dashboard', 'GET', null, ['Authorization: Bearer ' . $sellerToken]);
    echo "Status: " . $response['status'] . "\n";
    echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";
    
    // Test 8: Try to access Admin Dashboard as Seller (should fail)
    echo "8. Testing Admin Dashboard Access as Seller (should fail)...\n";
    $response = makeRequest($baseUrl . '/admin/dashboard', 'GET', null, ['Authorization: Bearer ' . $sellerToken]);
    echo "Status: " . $response['status'] . "\n";
    echo "Response: " . json_encode($response['body'], JSON_PRETTY_PRINT) . "\n\n";
} else {
    echo "Seller login failed!\n\n";
}

echo "=== Testing Complete ===\n";