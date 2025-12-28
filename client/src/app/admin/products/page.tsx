"use client";

import React, { useState, useEffect } from "react";
import ProductDataTable, { ProductDataItem } from "@/components/DataTables/ProductDataTable";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminProductsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<ProductDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        console.log("Fetching products from:", `${API_URL}/api/admin/products?per_page=100`);
        const response = await fetch(`${API_URL}/api/admin/products?per_page=100`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json"
          }
        });

        console.log("Response status:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("Products data:", data);
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
              price: `$${parseFloat(item.base_price).toFixed(2)}`,
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Products
        </h2>
        <button
          onClick={() => router.push("/admin/products/new")}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90"
        >
          Add Product
        </button>
      </div>

      {isLoading ? (
        <div>Loading...</div>
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
  );
}
