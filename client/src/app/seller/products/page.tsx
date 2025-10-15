"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/ui/product-card";

// Sample product data
const sampleProducts = [
  {
    id: "1",
    name: "Premium T-Shirt",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    images: [
      {
        id: "1-black",
        color: "#000000",
        images: ["/images/product/product-01.jpg", "/images/product/product-02.jpg"]
      },
      {
        id: "1-white",
        color: "#FFFFFF",
        images: ["/images/product/product-03.jpg", "/images/product/product-04.jpg"]
      }
    ],
    colors: ["#000000", "#FFFFFF"]
  },
  {
    id: "2",
    name: "Classic Hoodie",
    sizes: ["S", "M", "L", "XL"],
    images: [
      {
        id: "2-gray",
        color: "#808080",
        images: ["/images/product/product-05.jpg", "/images/product/product-01.jpg"]
      },
      {
        id: "2-navy",
        color: "#000080",
        images: ["/images/product/product-02.jpg", "/images/product/product-03.jpg"]
      }
    ],
    colors: ["#808080", "#000080"]
  },
  {
    id: "3",
    name: "Sports Cap",
    sizes: ["One Size"],
    images: [
      {
        id: "3-red",
        color: "#FF0000",
        images: ["/images/product/product-04.jpg", "/images/product/product-05.jpg"]
      },
      {
        id: "3-blue",
        color: "#0000FF",
        images: ["/images/product/product-01.jpg", "/images/product/product-02.jpg"]
      }
    ],
    colors: ["#FF0000", "#0000FF"]
  },
  {
    id: "4",
    name: "Denim Jacket",
    sizes: ["S", "M", "L", "XL", "XXL"],
    images: [
      {
        id: "4-blue",
        color: "#4169E1",
        images: ["/images/product/product-03.jpg", "/images/product/product-04.jpg"]
      },
      {
        id: "4-black",
        color: "#000000",
        images: ["/images/product/product-05.jpg", "/images/product/product-01.jpg"]
      }
    ],
    colors: ["#4169E1", "#000000"]
  }
];

export default function SellerProducts() {
  const router = useRouter();
  
  const handleSimpleProduct = (productId: string) => {
    console.log(`Simple product selected for: ${productId}`);
    // Add your simple product logic here
  };

  const handleCustomProduct = (productId: string) => {
    console.log(`Custom product selected for: ${productId}`);
    // Navigate to the integrated t-shirt designer studio
    router.push(`/seller/studio?product=${productId}`);
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            My Products
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your product listings and inventory
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90">
          Add Product
        </button>
      </div>
      
      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sampleProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            sizes={product.sizes}
            images={product.images}
            colors={product.colors}
            onSimpleProduct={() => handleSimpleProduct(product.id)}
            onCustomProduct={() => handleCustomProduct(product.id)}
            className="dark:bg-boxdark dark:border-strokedark"
          />
        ))}
      </div>
      
      {sampleProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No products found</p>
        </div>
      )}
    </div>
  );
}