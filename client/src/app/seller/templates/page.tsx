"use client";

import React, { useState } from "react";

// Template interfaces
interface Template {
  id: number;
  name: string;
  description: string;
  category: string;
  type: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
  status: "active" | "draft" | "archived";
  usageCount: number;
  price: number;
}

// Sample template data
const templateData: Template[] = [
  {
    id: 1,
    name: "T-Shirt Basic",
    description: "Standard t-shirt product template with size and color options",
    category: "Apparel",
    type: "Product",
    image: "/images/tshirt-mockup.jpg",
    createdAt: "2024-06-15",
    updatedAt: "2024-09-10",
    status: "active",
    usageCount: 47,
    price: 19.99
  },
  {
    id: 2,
    name: "Coffee Mug",
    description: "11oz ceramic mug template with customizable wrap-around design",
    category: "Drinkware",
    type: "Product",
    image: "/images/product/product-01.jpg",
    createdAt: "2024-07-23",
    updatedAt: "2024-08-05",
    status: "active",
    usageCount: 32,
    price: 14.99
  },
  {
    id: 3,
    name: "Phone Case",
    description: "Impact resistant phone case with full color printing",
    category: "Accessories",
    type: "Product",
    image: "/images/product/product-02.jpg",
    createdAt: "2024-05-12",
    updatedAt: "2024-09-01",
    status: "active",
    usageCount: 28,
    price: 24.99
  },
  {
    id: 4,
    name: "Custom Hoodie",
    description: "Premium pullover hoodie with embroidery options",
    category: "Apparel",
    type: "Product",
    image: "/images/hoodie-mockup.jpg",
    createdAt: "2024-04-18",
    updatedAt: "2024-08-30",
    status: "active",
    usageCount: 19,
    price: 39.99
  },
  {
    id: 5,
    name: "Canvas Print",
    description: "Gallery-quality canvas print with various size options",
    category: "Wall Art",
    type: "Product",
    image: "/images/product/product-04.jpg",
    createdAt: "2024-08-02",
    updatedAt: "2024-09-15",
    status: "draft",
    usageCount: 0,
    price: 29.99
  },
  {
    id: 6,
    name: "Tote Bag",
    description: "Eco-friendly cotton tote with customizable design area",
    category: "Bags",
    type: "Product",
    image: "/images/totebag-mockup.jpg",
    createdAt: "2024-07-14",
    updatedAt: "2024-08-22",
    status: "active",
    usageCount: 15,
    price: 16.99
  }
];

export default function SellerTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Filter templates based on search and filters
  const filteredTemplates = templateData.filter((template) => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "All" || template.category === filterCategory;
    const matchesStatus = filterStatus === "All" || template.status === filterStatus.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Get unique categories
  const categories = ["All", ...new Set(templateData.map(t => t.category))];
  
  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Template Usage Status Bar */}
      <div className="mb-6 rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-black dark:text-white">
              Template Usage
            </h3>
            <p className="text-sm text-body dark:text-bodydark">
              {templateData.length} / 50 templates used
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-black dark:text-white">
                {Math.round((templateData.length / 50) * 100)}%
              </div>
              <div className="text-xs text-body dark:text-bodydark">
                Usage
              </div>
            </div>
            <div className="w-32">
              <div className="mb-2 flex justify-between text-xs text-body dark:text-bodydark">
                <span>{templateData.length}</span>
                <span>50</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(templateData.length / 50) * 100}%`,
                    backgroundColor: '#10B981'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    

      {/* Filter and search section */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 pl-10 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
          />
          <span className="absolute left-3 top-3 text-body dark:text-bodydark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.11111 15.2222C12.0385 15.2222 15.2222 12.0385 15.2222 8.11111C15.2222 4.18375 12.0385 1 8.11111 1C4.18375 1 1 4.18375 1 8.11111C1 12.0385 4.18375 15.2222 8.11111 15.2222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16.9995 17.0001L13.1328 13.1334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === "All" ? "All Categories" : category}
            </option>
          ))}
        </select>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Draft">Draft</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div 
              key={template.id}
              className="relative overflow-hidden rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark h-96 hover:shadow-lg transition-shadow duration-300 template-card"
            >
              {/* Full-screen template image */}
              <div className="absolute inset-0 w-full h-full">
                {template.image ? (
                  <img
                    src={template.image}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              </div>
              
              {/* Overlaid content */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Template name at the top */}
                <div className="text-center">
                  <h4 className="text-xl font-bold text-white drop-shadow-lg">
                    {template.name}
                  </h4>
                </div>
                
                {/* Create Order Button - Only visible on hover */}
                <div className="absolute inset-0 flex items-center justify-center template-button-container z-20">
                  <button 
                    onClick={() => console.log('Create order for template:', template.name)}
                    className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200 backdrop-blur-sm border border-white/20 shadow-lg template-button"
                  >
                    Create Order
                  </button>
                </div>
                
                {/* Price and Usage count at the bottom */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
                    <div className="text-sm font-bold text-white">
                      ${template.price}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 rounded-full bg-black/50 backdrop-blur-sm px-3 py-1.5">
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium text-white">
                      {template.usageCount} uses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex h-40 items-center justify-center rounded-lg border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
            <div className="text-center">
              <svg className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p className="mt-2 text-body dark:text-bodydark">No templates found</p>
              <p className="text-sm text-body dark:text-bodydark">Try adjusting your search or filters</p>
            </div>
          </div>
        )}
      </div>
      
 
    </div>
  );
}