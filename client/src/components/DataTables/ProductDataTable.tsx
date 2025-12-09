"use client";

import React, { useState, useMemo } from 'react';
import Switch from '../form/switch/Switch';

export interface ProductDataItem {
  id: number;
  name: string;
  image: string;
  price: string;
  active: boolean;
  inStock: boolean;
  orderCount?: number;
}

interface ProductDataTableProps {
  data: ProductDataItem[];
  title?: string;
  onToggleStatus?: (id: number, currentStatus: boolean) => void;
  onToggleStock?: (id: number, currentStatus: boolean) => void;
  onEdit?: (product: ProductDataItem) => void;
}

const ProductDataTable: React.FC<ProductDataTableProps> = ({
  data,
  title = "Products Inventory",
  onToggleStatus,
  onToggleStock,
  onEdit
}) => {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [productData, setProductData] = useState(data);

  // Update productData when data prop changes
  React.useEffect(() => {
    setProductData(data);
  }, [data]);

  const handleActiveToggle = (productId: number, currentStatus: boolean) => {
    if (onToggleStatus) {
      onToggleStatus(productId, currentStatus);
    } else {
      setProductData(prevData =>
        prevData.map(product =>
          product.id === productId
            ? { ...product, active: !currentStatus }
            : product
        )
      );
    }
  };

  const handleStockToggle = (productId: number, currentStatus: boolean) => {
    if (onToggleStock) {
      onToggleStock(productId, currentStatus);
    } else {
      setProductData(prevData =>
        prevData.map(product =>
          product.id === productId
            ? { ...product, inStock: !currentStatus }
            : product
        )
      );
    }
  };

  // Filter and sort data
  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return productData
      .filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.price.toLowerCase().includes(searchLower) ||
          (product.orderCount && product.orderCount.toString().includes(searchLower))
      )
      .sort((a, b) => {
        let modifier = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortColumn as keyof ProductDataItem] ?? "";
        const bValue = b[sortColumn as keyof ProductDataItem] ?? "";
        if (aValue < bValue) return -1 * modifier;
        if (aValue > bValue) return 1 * modifier;
        return 0;
      });
  }, [productData, search, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / perPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const sortBy = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
          {title}
        </h3>
      </div>
      <div className="border-t border-gray-100 p-5 dark:border-gray-800 sm:p-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400"> Show </span>
              <div className="relative z-20 bg-transparent">
                <select
                  className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-9 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none py-2 pr-8 pl-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                >
                  <option value="10" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">10</option>
                  <option value="25" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">25</option>
                  <option value="50" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">50</option>
                </select>
                <span className="absolute top-1/2 right-2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400"> entries </span>
            </div>

            <div className="relative">
              <button className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill=""></path>
                </svg>
              </button>
              <input
                type="text"
                placeholder="Search products..."
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="w-full">
              {/* table header start */}
              <div className="grid grid-cols-11 border-t border-gray-200 dark:border-gray-800">
                <div className="col-span-3 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('name')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Product</p>
                    <span className="flex flex-col gap-0.5">
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill=""></path>
                      </svg>
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('price')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Price</p>
                    <span className="flex flex-col gap-0.5">
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill=""></path>
                      </svg>
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('inStock')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Stock</p>
                    <span className="flex flex-col gap-0.5">
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill=""></path>
                      </svg>
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('orderCount')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Order Count</p>
                    <span className="flex flex-col gap-0.5">
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill=""></path>
                      </svg>
                      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('active')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Active</p>
                    <span className="flex flex-col">
                      <svg className={`h-3 w-3 ${sortColumn === 'active' && sortDirection === 'asc' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <svg className={`h-3 w-3 ${sortColumn === 'active' && sortDirection === 'desc' ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>


              </div>
              {/* table header end */}

              {/* table body start */}
              {paginatedData.map((product) => (
                <div
                  key={product.id}
                  className="grid grid-cols-11 border-t border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  onClick={() => onEdit && onEdit(product)}
                >
                  <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <p className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{product.name}</p>
                        {!product.inStock && (
                          <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{product.price}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      key={`stock-${product.id}-${product.inStock}`}
                      label=""
                      defaultChecked={product.inStock}
                      onChange={(checked) => handleStockToggle(product.id, product.inStock)}
                      color="blue"
                    />
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{product.orderCount || 0}</p>
                  </div>
                  <div className="col-span-2 flex items-center justify-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      key={`active-${product.id}-${product.active}`}
                      label=""
                      defaultChecked={product.active}
                      onChange={(checked) => handleActiveToggle(product.id, product.active)}
                      color="green"
                    />
                  </div>

                </div>
              ))}
              {/* table body end */}
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="border-t border-gray-100 py-4 pl-[18px] pr-4 dark:border-gray-800">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center justify-center gap-0.5 pb-4 xl:justify-normal xl:pt-0">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="mr-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                >
                  Previous
                </button>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${currentPage === page
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 xl:justify-normal">
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, filteredData.length)} of {filteredData.length} entries
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDataTable;