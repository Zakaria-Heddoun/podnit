<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$host = $_ENV['DB_HOST'];
$database = $_ENV['DB_DATABASE'];
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASSWORD'];

try {
    $pdo = new PDO("mysql:host={$host};dbname={$database}", $username, $password);
    
    echo "✅ Connected to database: {$database}\n\n";
    
    // Get list of tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo "📊 Tables created successfully:\n";
    foreach ($tables as $table) {
        echo "- {$table}\n";
    }
    
    // Check some specific tables for data
    echo "\n📋 Sample data:\n";
    
    // Check products
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM products");
    $productCount = $stmt->fetchColumn();
    echo "- Products: {$productCount} records\n";
    
    // Check system settings
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM system_settings");
    $settingsCount = $stmt->fetchColumn();
    echo "- System Settings: {$settingsCount} records\n";
    
    echo "\n🎉 Database setup completed successfully!\n";
    
} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
}