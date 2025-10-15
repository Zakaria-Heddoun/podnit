"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import Image from "next/image";
import {
  DataTableColumn,
  DataTableProps,
  SortDirection,
  DEFAULT_DATA_TABLE_CONFIG,
} from "@/types/datatable";

// Re-export types for convenience
export type { DataTableColumn, DataTableProps } from "@/types/datatable";

// Generic DataTable component
export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  paginated = true,
  defaultPageSize = 10,
  pageSizeOptions = [5, 8, 10],
  className = "",
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!search) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [data, search]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, paginated]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, sortedData.length);

  // Handle sorting
  const handleSort = (column: keyof T) => {
    const columnConfig = columns.find(col => col.key === column);
    if (!columnConfig?.sortable) return;

    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (column: keyof T) => {
    const columnConfig = columns.find(col => col.key === column);
    if (!columnConfig?.sortable) return null;

    return (
      <span className="flex flex-col gap-0.5 ml-2">
        <svg
          className={`fill-gray-300 dark:fill-gray-700 ${
            sortColumn === column && sortDirection === 'asc' ? 'fill-gray-600 dark:fill-gray-300' : ''
          }`}
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" />
        </svg>
        <svg
          className={`fill-gray-300 dark:fill-gray-700 ${
            sortColumn === column && sortDirection === 'desc' ? 'fill-gray-600 dark:fill-gray-300' : ''
          }`}
          width="8"
          height="5"
          viewBox="0 0 8 5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3.59038 4.41483C3.78943 4.69919 4.21057 4.69919 4.40962 4.41483L6.94929 0.786733C7.18126 0.455342 6.94418 0 6.53967 0H1.46033C1.05582 0 0.81874 0.455342 1.05071 0.786733L3.59038 4.41483Z" />
        </svg>
      </span>
    );
  };

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 bg-white pt-4 dark:border-gray-800 dark:bg-white/[0.03] ${className}`}>
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Page size selector */}
        {paginated && (
          <div className="flex items-center gap-3">
            <span className="text-gray-500 dark:text-gray-400">Show</span>
            <div className="relative z-20 bg-transparent">
              <select
                className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-9 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none py-2 pr-8 pl-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size} className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    {size}
                  </option>
                ))}
              </select>
              <span className="absolute top-1/2 right-2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg
                  className="stroke-current"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165"
                    stroke=""
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
            <span className="text-gray-500 dark:text-gray-400">entries</span>
          </div>
        )}

        {/* Search */}
        {searchable && (
          <div className="relative">
            <button className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z"
                />
              </svg>
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="dark:bg-dark-900 shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
        )}
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1102px]">
          <div className="grid grid-cols-12 border-t border-gray-200 dark:border-gray-800">
            {/* Table Header */}
            {columns.map((column, index) => (
              <div
                key={String(column.key)}
                className={`col-span-${Math.floor(12 / columns.length)} flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800 ${index === columns.length - 1 ? 'border-r-0' : ''}`}
              >
                <div
                  className={`flex w-full items-center justify-between ${
                    column.sortable ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">
                    {column.label}
                  </p>
                  {renderSortIcon(column.key)}
                </div>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedData.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No data found
              </div>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-12">
                  {columns.map((column, colIndex) => (
                    <div
                      key={String(column.key)}
                      className={`col-span-${Math.floor(12 / columns.length)} border-r border-gray-100 px-4 py-4 dark:border-gray-800 ${colIndex === columns.length - 1 ? 'border-r-0' : ''}`}
                    >
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startEntry} to {endEntry} of {sortedData.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`rounded-lg px-3 py-1 text-sm ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}