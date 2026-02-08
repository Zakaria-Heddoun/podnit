"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: number;
  available_colors: string[];
  available_sizes: string[];
  image_url: string;
  mockups?: Record<string, string | null>;
  print_areas?: Record<string, any>;
  gallery?: { url: string; color: string | null }[];
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/api/seller/products/${productId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load product');
        }

        const data = await response.json();
        const productData = data.data || data;

        // Resolve mockup URLs if they are relative paths
        if (productData.mockups && typeof productData.mockups === 'object') {
          const resolved: Record<string, string | null> = {};
          Object.entries(productData.mockups).forEach(([key, val]) => {
            if (typeof val === 'string' && val) {
              // Handle both relative and absolute URLs
              if (val.startsWith('http')) {
                resolved[key] = val;
              } else if (val.startsWith('/')) {
                resolved[key] = `${API_URL}${val}`;
              } else {
                resolved[key] = val;
              }
            } else {
              resolved[key] = null;
            }
          });
          productData.mockups = resolved;
        }


        setProduct(productData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="aspect-square w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="space-y-4">
            <div className="h-6 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-3/4 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">
            Error
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error || 'Product not found'}
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Product Details
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Product Info Sidebar */}
        <div className="space-y-4 lg:col-span-3">
          <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {product.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {product.category}
            </p>
            <div className="mt-4 border-t border-stroke pt-4 dark:border-strokedark">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {product.base_price.toFixed(2)} DH
              </p>
            </div>

            {product.available_colors && product.available_colors.length > 0 && (
              <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Available Colors
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.available_colors.map((color, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.available_sizes && product.available_sizes.length > 0 && (
              <div className="mt-6 border-t border-stroke pt-4 dark:border-strokedark">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Available Sizes
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.available_sizes.map((size, idx) => (
                    <span
                      key={idx}
                      className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.back()}
              className="mt-6 w-full rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Back to Products
            </button>
          </div>

          {product.description && (
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Description
              </h3>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
