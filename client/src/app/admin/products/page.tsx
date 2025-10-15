"use client";

import React from "react";
import ProductDataTable from "@/components/DataTables/ProductDataTable";

// Sample product data for table
const productsTableData = [
  {
    id: 1,
    name: "Premium T-Shirt",
    image: "/images/product/product-01.jpg",
    price: "$29.99",
    stock: "150",
    active: true
  },
  {
    id: 2,
    name: "Classic Hoodie",
    image: "/images/product/product-02.jpg",
    price: "$59.99",
    stock: "75",
    active: true
  },
  {
    id: 3,
    name: "Sports Cap",
    image: "/images/product/product-03.jpg",
    price: "$19.99",
    stock: "200",
    active: true
  },
  {
    id: 4,
    name: "Denim Jacket",
    image: "/images/product/product-04.jpg",
    price: "$89.99",
    stock: "45",
    active: false
  },
  {
    id: 5,
    name: "Running Shoes",
    image: "/images/product/product-05.jpg",
    price: "$129.99",
    stock: "80",
    active: true
  },
  {
    id: 6,
    name: "Winter Coat",
    image: "/images/product/product-01.jpg",
    price: "$199.99",
    stock: "25",
    active: true
  },
  {
    id: 7,
    name: "Casual Sneakers",
    image: "/images/product/product-02.jpg",
    price: "$79.99",
    stock: "120",
    active: true
  },
  {
    id: 8,
    name: "Leather Wallet",
    image: "/images/product/product-03.jpg",
    price: "$39.99",
    stock: "90",
    active: true
  }
];

export default function AdminProducts() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Products Management
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage all products in the system
          </p>
        </div>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90">
          Add Product
        </button>
      </div>
      
      {/* Products Table */}
      <ProductDataTable 
        data={productsTableData} 
        title="Products Inventory"
      />
    </div>
  );
}