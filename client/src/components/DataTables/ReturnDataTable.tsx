"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Return } from '@/types/datatable';
import { getOrderStatusClasses } from '@/lib/orderStatus';

interface ReturnDataTableProps {
  data: Return[];
  title?: string;
  enableSelection?: boolean;
  onSelectionChange?: (selectedItems: Return[]) => void;
  onBulkAction?: (action: string, selectedItems: Return[]) => void;
  onEdit?: (item: Return) => void;
  onApprove?: (item: Return) => void;
  onDelete?: (item: Return) => void;
  onDownload?: () => void;
}

const ReturnDataTable: React.FC<ReturnDataTableProps> = ({
  data,
  title = "Returns Management",
  enableSelection = true,
  onSelectionChange,
  onBulkAction,
  onEdit,
  onApprove,
  onDelete,
  onDownload
}) => {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // Filter and sort data
  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return data
      .filter(
        (returnItem) =>
          returnItem.returnNumber.toLowerCase().includes(searchLower) ||
          returnItem.product.toLowerCase().includes(searchLower) ||
          returnItem.templateName?.toLowerCase().includes(searchLower) ||
          returnItem.status.toLowerCase().includes(searchLower) ||
          returnItem.date.toLowerCase().includes(searchLower)
      )
      .sort((a, b) => {
        let modifier = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortColumn as keyof Return];
        const bValue = b[sortColumn as keyof Return];

        if (sortColumn === "date") {
          const dateA = new Date(aValue as string).getTime();
          const dateB = new Date(bValue as string).getTime();
          return (dateA - dateB) * modifier;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * modifier;
        }
        return 0;
      });
  }, [data, search, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredData.slice(startIndex, startIndex + perPage);
  }, [filteredData, currentPage, perPage]);

  const totalPages = Math.ceil(filteredData.length / perPage);
  const totalEntries = filteredData.length;
  const startEntry = (currentPage - 1) * perPage + 1;
  const endEntry = Math.min(currentPage * perPage, totalEntries);

  const sortBy = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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

  const pagesAroundCurrent = useMemo(() => {
    const pages = [];
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(paginatedData.map(item => item.id));
      setSelectedItems(allIds);
      if (onSelectionChange) {
        onSelectionChange(paginatedData);
      }
    } else {
      setSelectedItems(new Set());
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);

    if (onSelectionChange) {
      const selectedData = data.filter(item => newSelected.has(item.id));
      onSelectionChange(selectedData);
    }
  };

  const isAllSelected = paginatedData.length > 0 && paginatedData.every(item => selectedItems.has(item.id));

  // Use shared status color utility that handles raw French delivery statuses
  const getStatusColor = getOrderStatusClasses;

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="px-4 py-6 md:px-6 xl:px-7.5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-xl font-semibold text-black dark:text-white">
              {title}
            </h4>
          </div>

          <div className="flex gap-3">
            {selectedItems.size > 0 && (
              <>
                <button
                  onClick={() => onBulkAction && onBulkAction('delete', data.filter(item => selectedItems.has(item.id)))}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete Selected ({selectedItems.size})
                </button>
                <button
                  onClick={() => onBulkAction && onBulkAction('export', data.filter(item => selectedItems.has(item.id)))}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Export Selected
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <label htmlFor="perPage" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Show
            </label>
            <select
              id="perPage"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">entries</span>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search returns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-400 sm:w-64"
            />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Desktop Table */}
          <div className="hidden md:block bg-gray-50 dark:bg-gray-800">
            {/* table header start */}
            <div className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
              {enableSelection && (
                <div className="col-span-1 flex items-center justify-center border-r border-gray-100 px-2 py-3 dark:border-gray-800">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                  />
                </div>
              )}
              <div className={`${enableSelection ? 'col-span-2' : 'col-span-2'} flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800`}>
                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("returnNumber")}>
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Return Number</p>
                  <span className="text-gray-400">
                    <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                      <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("product")}>
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Product</p>
                  <span className="text-gray-400">
                    <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                      <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("templateName")}>
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Template Name</p>
                  <span className="text-gray-400">
                    <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                      <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("status")}>
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Status</p>
                  <span className="text-gray-400">
                    <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                      <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("date")}>
                  <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Date</p>
                  <span className="text-gray-400">
                    <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                      <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                    </svg>
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex items-center px-4 py-3">
                <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Action</p>
              </div>
            </div>
            {/* table header end */}

            {/* Desktop table body start */}
            {paginatedData.map((returnItem, index) => (
              <div key={returnItem.id} className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
                {enableSelection && (
                  <div className="col-span-1 flex items-center justify-center border-r border-gray-100 px-2 py-3 dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(returnItem.id)}
                      onChange={(e) => handleSelectItem(returnItem.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                    />
                  </div>
                )}
                <div className={`${enableSelection ? 'col-span-2' : 'col-span-2'} flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800`}>
                  <p className="text-theme-sm font-medium text-gray-900 dark:text-white">{returnItem.returnNumber}</p>
                </div>
                <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                  <p className="text-theme-sm text-gray-900 dark:text-white">{returnItem.product}</p>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                  <p className="text-theme-sm text-gray-900 dark:text-white">{returnItem.templateName}</p>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(returnItem.status)}`}>
                    {returnItem.status}
                  </span>
                </div>
                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                  <p className="text-theme-sm text-gray-900 dark:text-white">{returnItem.date}</p>
                </div>
                <div className="col-span-1 flex items-center gap-2 px-4 py-3">
                  {/* Admin: Approve/Revoke button */}
                  {onApprove && (
                    <button
                      onClick={() => onApprove(returnItem)}
                      className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                        returnItem.allow_reshipping
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                      title={returnItem.allow_reshipping ? 'Approved - Click to revoke' : 'Click to approve reorder'}
                    >
                      {returnItem.allow_reshipping ? 'Approved' : 'Approve'}
                    </button>
                  )}
                  {/* Seller: Reorder button */}
                  {onEdit && (
                    <div className="relative group">
                      <button
                        onClick={() => returnItem.allow_reshipping && onEdit(returnItem)}
                        disabled={!returnItem.allow_reshipping}
                        className={`${returnItem.allow_reshipping ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300' : 'text-gray-400 cursor-not-allowed'}`}
                        title={returnItem.allow_reshipping ? "Reorder" : "Waiting for Admin Approval"}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      {!returnItem.allow_reshipping && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                          Waiting for Admin Approval
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden space-y-4 p-4">
            {paginatedData.map((returnItem, index) => (
              <div key={returnItem.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {enableSelection && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(returnItem.id)}
                        onChange={(e) => handleSelectItem(returnItem.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    )}
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{returnItem.returnNumber}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Return #{returnItem.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {onApprove && (
                      <button
                        onClick={() => onApprove(returnItem)}
                        className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                          returnItem.allow_reshipping
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        }`}
                      >
                        {returnItem.allow_reshipping ? 'Approved' : 'Approve'}
                      </button>
                    )}
                    {onEdit && (
                      <div className="relative group">
                        <button
                          onClick={() => returnItem.allow_reshipping && onEdit(returnItem)}
                          disabled={!returnItem.allow_reshipping}
                          className={`${returnItem.allow_reshipping ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300' : 'text-gray-400 cursor-not-allowed'}`}
                          title={returnItem.allow_reshipping ? "Reorder" : "Waiting for Admin Approval"}
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        {!returnItem.allow_reshipping && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                            Waiting for Admin Approval
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Product:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{returnItem.product}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Template Name:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{returnItem.templateName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(returnItem.status)}`}>
                      {returnItem.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Reorder:</span>
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      returnItem.allow_reshipping
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                    }`}>
                      {returnItem.allow_reshipping ? 'Approved' : 'Pending Approval'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Date:</span>
                    <span className="text-sm text-gray-900 dark:text-white">{returnItem.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-100 px-4 py-6 dark:border-gray-800 md:px-6 xl:px-7.5">
        <div className="flex flex-col items-center justify-between gap-4 xl:flex-row">
          <div className="flex items-center gap-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-brand-500"
            >
              <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.12499 1.20833L2.33332 6L7.12499 10.7917L5.91666 12L0.124989 6.20833L5.91666 0.416664L7.12499 1.20833Z" fill=""></path>
              </svg>
            </button>

            {totalPages > 0 && (
              <button
                onClick={() => goToPage(1)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 ${currentPage === 1 ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                1
              </button>
            )}

            {currentPage > 3 && (
              <span className="text-gray-500 dark:text-gray-400">...</span>
            )}

            {pagesAroundCurrent.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 ${currentPage === page ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages - 2 && totalPages > 3 && (
              <span className="text-gray-500 dark:text-gray-400">...</span>
            )}

            {totalPages > 1 && (
              <button
                onClick={() => goToPage(totalPages)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 ${currentPage === totalPages ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-brand-500"
            >
              <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0.875006 12.7917L5.66668 8L0.875006 3.20833L2.08334 2L7.87501 7.79167L2.08334 13.5833L0.875006 12.7917Z" fill=""></path>
              </svg>
            </button>
          </div>

          <p className="border-t border-gray-100 pt-3 text-center text-sm font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400 xl:border-t-0 xl:pt-0 xl:text-left">
            Showing <span>{startEntry}</span> to
            <span> {endEntry}</span> of
            <span> {totalEntries}</span> entries
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReturnDataTable;