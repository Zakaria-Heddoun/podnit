"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ui/product-card";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

// Product interface matching backend structure
interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  base_price: number;
  available_colors: string[];
  available_sizes: string[];
  image_url: string;
  gallery?: { url: string; color: string | null }[];
  is_active: boolean;
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

// Transform product for ProductCard component
const transformProduct = (product: Product) => {
  // Convert color names to hex values (supports stored hex values too)
  const colorMap: { [key: string]: string } = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Navy': '#000080',
    'Gray': '#808080',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Yellow': '#FFFF00',
    'Royal Blue': '#4169E1',
    'Forest Green': '#228B22',
    'Maroon': '#800000',
    'Light Blue': '#ADD8E6',
    'Pink': '#FFC0CB',
    'Natural': '#F5F5DC',
    'Clear': '#FFFFFF',
    'Linen': '#FAF0E6'
  };

  const normalizeColor = (value: string) => {
    if (typeof value !== 'string') return '#808080';
    const trimmed = value.trim();
    if (/^#([A-Fa-f0-9]{6})$/.test(trimmed)) return trimmed.toUpperCase();
    return colorMap[trimmed] || '#808080';
  };

  const colors = product.available_colors.map(normalizeColor);

  return {
    id: product.id.toString(),
    name: product.name,
    sizes: product.available_sizes,
    images: colors.map((color, index) => {
      // Find gallery images for this hex color
      // Backend stores either names or hex. transformProduct works with hex here.
      // We need to match the user's color selection.
      const galleryImages = (product.gallery || [])
        .filter(g => !g.color || g.color === color)
        .map(g => g.url);

      return {
        id: `${product.id}-${index}`,
        color: color,
        images: galleryImages.length > 0 ? galleryImages : [product.image_url]
      };
    }),
    colors: colors,
    category: product.category,
    price: product.base_price,
    description: product.description,
    inStock: product.in_stock
  };
};

export default function SellerProducts() {
  const router = useRouter();
  const { token, loading: loadingAuth } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch products from API
  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      // Wait for auth to be ready
      if (loadingAuth || !token) {
        // If we're done loading auth and still no token, we might want to stop loading products
        if (!loadingAuth && !token) {
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // Build query parameters
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim());
        }
        params.append('per_page', '20');

        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        const response = await fetch(`${API_URL}/api/seller/products?${params}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Accept paginator or legacy array
          const productsData = Array.isArray(data.data) ? data.data : (data.data?.data || []);

          // Map API data to Product interface
          const mappedProducts: Product[] = productsData.map((item: any) => {
            let imageUrl = item.image_url;
            if (imageUrl && imageUrl.startsWith('/')) {
              imageUrl = `${API_URL}${imageUrl}`;
            } else if (!imageUrl) {
              imageUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
            }

            return {
              id: item.id,
              name: item.name,
              category: item.category,
              description: item.description || '',
              base_price: parseFloat(item.base_price),
              available_colors: Array.isArray(item.available_colors) ? item.available_colors : [],
              available_sizes: Array.isArray(item.available_sizes) ? item.available_sizes : [],
              image_url: imageUrl,
              gallery: Array.isArray(item.gallery) ? item.gallery.map((g: any) => ({
                ...g,
                url: g.url && g.url.startsWith('/') ? `${API_URL}${g.url}` : g.url
              })) : [],
              is_active: Boolean(item.is_active),
              in_stock: Boolean(item.in_stock),
              created_at: item.created_at,
              updated_at: item.updated_at
            };
          });

          setProducts(mappedProducts);

          // If we haven't set categories yet, fetch them
          if (categories.length === 0) {
            const catResponse = await fetch(`${API_URL}/api/seller/products/categories`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });
            if (catResponse.ok) {
              const catData = await catResponse.json();
              if (catData.success && Array.isArray(catData.data)) {
                setCategories(catData.data);
              }
            }
          }
        } else {
          console.error('Failed to fetch products');
        }

      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [selectedCategory, searchTerm, token, loadingAuth]);

  const handleSimpleProduct = (productId: string) => {
    // Navigate to create order page with product ID
    router.push(`/seller/create-order?productId=${productId}`);
  };

  const handleCustomProduct = (productId: string) => {
    // Navigate to the integrated t-shirt designer studio
    router.push(`/seller/studio?product=${productId}`);
  };

  const handleViewMockup = (productId: string) => {
    router.push(`/seller/products/${productId}`);
  };

  // Transform products for display
  const transformedProducts = products.map(transformProduct);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Product Catalog
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Browse available products for orders and customization
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-w-[250px] rounded border border-stroke bg-transparent px-4 py-2 pl-10 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 text-body dark:text-bodydark"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {transformedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                sizes={product.sizes}
                images={product.images}
                colors={product.colors}
                inStock={product.inStock}
                onSimpleProduct={() => handleSimpleProduct(product.id)}
                onCustomProduct={() => handleCustomProduct(product.id)}
                onViewMockup={() => handleViewMockup(product.id)}
                price={product.price}
                className="dark:bg-boxdark dark:border-strokedark"
              />
            ))}
          </div>

          {/* Empty State */}
          {transformedProducts.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No products found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No products available at the moment'}
              </p>
            </div>
          )}

          {/* Results Summary */}
          {!loading && transformedProducts.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Showing {transformedProducts.length} product{transformedProducts.length !== 1 ? 's' : ''}
              {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
