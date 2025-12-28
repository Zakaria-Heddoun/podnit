"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeProductsPage() {
  const { user, hasPermission, token } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to view products
  if (!hasPermission('view_products')) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view products.
          </p>
        </div>
      </div>
    );
  }

  const fetchProducts = async () => {
    if (!token) {
      setLoading(false);
      setError('No authentication token found');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Fetch only active products for employees - explicitly filter by is_active=true
      const url = `${API_URL}/api/admin/products?per_page=100&status=active`;
      console.log('🔍 Fetching active products from:', url);
      console.log('🔑 Using token:', token.substring(0, 20) + '...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Products API response:', result);
        
        // Handle different response structures
        let productsData: any[] = [];
        if (Array.isArray(result)) {
          productsData = result;
        } else if (result.data) {
          // Handle { data: [...] } or { data: { data: [...] } }
          productsData = Array.isArray(result.data) ? result.data : (result.data.data || []);
        } else if (result.success && result.data) {
          productsData = Array.isArray(result.data) ? result.data : [];
        }
        
        // Double filter to ensure only active products are shown
        productsData = productsData.filter((product: any) => {
          const isActive = product.is_active === true || product.is_active === 1;
          console.log(`Product ${product.id} (${product.name}): is_active=${product.is_active}, filtered=${isActive}`);
          return isActive;
        });
        
        // Log product IDs and details
        const productIds = productsData.map(p => p.id);
        console.log(`✅ Extracted ${productsData.length} active products`);
        console.log(`📋 Product IDs: [${productIds.join(', ')}]`);
        console.log(`📦 Product details:`, productsData.map(p => ({ 
          id: p.id, 
          name: p.name, 
          is_active: p.is_active,
          in_stock: p.in_stock,
          price: p.base_price
        })));
        
        setProducts(productsData);
        setError(null);
      } else {
        const errorText = await response.text();
        let errorMessage = 'Failed to load products';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
          console.error('❌ Error response:', errorJson);
        } catch {
          console.error('❌ Error text:', errorText);
        }
        
        setError(errorMessage);
        
        if (response.status === 403) {
          toast({ title: 'Access Denied', description: 'You don\'t have permission to view products' });
        } else if (response.status === 401) {
          toast({ title: 'Authentication Error', description: 'Please log in again' });
        } else if (response.status === 500) {
          // Check if it's a database connection error
          if (errorMessage.includes('No connection could be made') || errorMessage.includes('Connection: mysql')) {
            toast({ 
              title: 'Database Connection Error', 
              description: 'MySQL server is not running. Please start MySQL service and try again.',
              variant: 'destructive'
            });
          } else {
            toast({ 
              title: 'Server Error', 
              description: errorMessage 
            });
          }
        } else {
          toast({ title: 'Error', description: errorMessage });
        }
      }
    } catch (error: any) {
      console.error('❌ Network error fetching products:', error);
      const errorMsg = error?.message || 'Failed to load products. Please check your connection.';
      setError(errorMsg);
      toast({ title: 'Connection Error', description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Active Products</h1>
        {error && (
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading active products...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Database Connection Error</p>
            {error.includes('No connection could be made') || error.includes('Connection: mysql') ? (
              <div className="text-left max-w-md mx-auto mb-4">
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  MySQL database server is not running. Please follow these steps:
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-4">
                  <li>If using <strong>XAMPP</strong>: Open XAMPP Control Panel → Start MySQL</li>
                  <li>If using <strong>WAMP</strong>: Open WAMP Control Panel → Start MySQL</li>
                  <li>If using <strong>Windows Service</strong>: Open Services (Win+R, type "services.msc") → Find "MySQL" → Right-click → Start</li>
                  <li>Wait a few seconds for MySQL to start</li>
                  <li>Click "Try Again" button below</li>
                </ol>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
            )}
            <button
              onClick={fetchProducts}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No active products found.</p>
            <button
              onClick={fetchProducts}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {products.length} active product{products.length !== 1 ? 's' : ''}
                {products.length > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    (IDs: {products.map(p => p.id).join(', ')})
                  </span>
                )}
              </p>
              <button
                onClick={fetchProducts}
                className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product: any) => (
                <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                  <div className="mb-3 h-48 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden flex items-center justify-center">
                    {product.image_url ? (
                      <img 
                        src={product.image_url.startsWith('/') 
                          ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${product.image_url}`
                          : product.image_url
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = '<span class="text-gray-400 text-sm">No Image</span>';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No Image</span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">{product.name || 'Unnamed Product'}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Category: {product.category || 'Uncategorized'}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                    ${parseFloat(product.base_price || 0).toFixed(2)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Active
                    </span>
                    <span className={`px-2 py-1 text-xs rounded ${
                      product.in_stock 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {product.in_stock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

