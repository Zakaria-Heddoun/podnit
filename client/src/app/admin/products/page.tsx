"use client";

import React, { useState, useEffect } from "react";
import ProductDataTable, { ProductDataItem } from "@/components/DataTables/ProductDataTable";
import { useAuth } from "@/context/AuthContext";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const { token, hasPermission } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const accessDeniedFallback = (
    <div className="p-6">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-sm text-center">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view products. Contact your administrator.
        </p>
      </div>
    </div>
  );

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
        const response = await fetch(`${API_URL}/api/admin/products?per_page=100`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });


        if (response.ok) {
          const data = await response.json();
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
          // Map API data to ProductDataItem interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedProducts: ProductDataItem[] = data.data.map((item: any) => {
            // If image_url is a relative path, prepend API_URL
            let imageUrl = item.image_url;
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `${API_URL}${imageUrl}`;
            } else if (!imageUrl) {
              imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
            }

            return {
              id: item.id,
              name: item.name,
              image: imageUrl,
              price: `${parseFloat(item.base_price).toFixed(2)} DH`,
              active: Boolean(item.is_active),
              inStock: Boolean(item.in_stock),
              orderCount: 0 // Placeholder as API doesn't return this yet
            };
          });
          setProducts(mappedProducts);
        } else {
          const errorText = await response.text();
          console.error("Failed to fetch products:", response.status, errorText);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [token]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    if (!token) return;

    // Optimistic update
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, active: !currentStatus } : p
    ));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
      const response = await fetch(`${API_URL}/api/admin/products/${id}/toggle-status`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to toggle status:", response.status, errorText);
        // Revert on error
        setProducts(prev => prev.map(p =>
          p.id === id ? { ...p, active: currentStatus } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling status:", error);
      // Revert on error
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, active: currentStatus } : p
      ));
    }
  };

  const handleToggleStock = async (id: number, currentStatus: boolean) => {
    if (!token) return;

    // Optimistic update
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, inStock: !currentStatus } : p
    ));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
      const response = await fetch(`${API_URL}/api/admin/products/${id}/toggle-stock`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ in_stock: !currentStatus })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to toggle stock:", response.status, errorText);
        // Revert on error
        setProducts(prev => prev.map(p =>
          p.id === id ? { ...p, inStock: currentStatus } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling stock:", error);
      // Revert on error
      setProducts(prev => prev.map(p =>
        p.id === id ? { ...p, inStock: currentStatus } : p
      ));
    }
  };

  const handleEditProduct = (product: ProductDataItem) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  return (
    <PermissionGuard 
      requiredPermissions={['view_products', 'manage_products']}
      fallback={accessDeniedFallback}
    >
      <div className="space-y-6">
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-title-md2 font-bold text-black dark:text-white">
              Products
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your product inventory
            </p>
          </div>
          <button
            onClick={() => router.push("/admin/products/new")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-6 py-3 text-center font-medium text-white hover:bg-opacity-80 transition-all dark:bg-white dark:text-black dark:hover:bg-opacity-90 lg:px-8 xl:px-10"
          >
            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 4.375V15.625" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4.375 10H15.625" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Product
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
          </div>
        ) : (
          <ProductDataTable
            data={products}
            title="Products Inventory"
            onToggleStatus={handleToggleStatus}
            onToggleStock={handleToggleStock}
            onEdit={handleEditProduct}
          />
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
