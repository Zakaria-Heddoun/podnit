"use client";

import React, { useState, useMemo } from 'react';
import { Seller } from '@/types/datatable';
import Badge from '@/components/ui/badge/Badge';

interface SellerDataTableProps {
    data: Seller[];
    title?: string;
    enableSelection?: boolean;
    onSelectionChange?: (selectedItems: Seller[]) => void;
    onBulkAction?: (action: string, selectedItems: Seller[]) => void;
    onEdit?: (item: Seller) => void;
    onToggleStatus?: (item: Seller) => void;
    onManagePrices?: (item: Seller) => void;
}

const SellerDataTable: React.FC<SellerDataTableProps> = ({
    data,
    title = "Sellers Management",
    enableSelection = true,
    onSelectionChange,
    onBulkAction,
    onEdit,
    onToggleStatus,
    onManagePrices
}) => {


    const [search, setSearch] = useState("");
    const [sortColumn, setSortColumn] = useState("created_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    // Filter and sort data
    const filteredData = useMemo(() => {
        const searchLower = search.toLowerCase();
        return data
            .filter(
                (seller) =>
                    seller.name.toLowerCase().includes(searchLower) ||
                    seller.email.toLowerCase().includes(searchLower) ||
                    (seller.brand_name && seller.brand_name.toLowerCase().includes(searchLower)) ||
                    (seller.phone && seller.phone.toLowerCase().includes(searchLower))
            )
            .sort((a, b) => {
                let modifier = sortDirection === "asc" ? 1 : -1;
                const aValue = a[sortColumn as keyof Seller];
                const bValue = b[sortColumn as keyof Seller];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * modifier;
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return (aValue - bValue) * modifier;
                }
                if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
                    return (Number(aValue) - Number(bValue)) * modifier;
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
                            <button
                                onClick={() => onBulkAction && onBulkAction('delete', data.filter(item => selectedItems.has(item.id)))}
                                className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            >
                                Delete Selected ({selectedItems.size})
                            </button>
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
                            placeholder="Search sellers..."
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
                            <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("name")}>
                                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Seller</p>
                                    <span className="text-gray-400">
                                        <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                                            <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("brand_name")}>
                                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Brand</p>
                                    <span className="text-gray-400">
                                        <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                                            <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("balance")}>
                                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Balance</p>
                                    <span className="text-gray-400">
                                        <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                                            <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-1 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("points")}>
                                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Points</p>
                                    <span className="text-gray-400">
                                        <svg className="fill-current" width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M4.40962 9.58517C4.21057 9.30081 3.78943 9.30081 3.59038 9.58517L1.05071 13.2133C0.81874 13.5447 1.05582 14 1.46033 14H6.53967C6.94418 14 7.18126 13.5447 6.94929 13.2133L4.40962 9.58517Z" fill=""></path>
                                            <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy("is_active")}>
                                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Status</p>
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
                        {paginatedData.map((seller, index) => (
                            <div key={seller.id} className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
                                {enableSelection && (
                                    <div className="col-span-1 flex items-center justify-center border-r border-gray-100 px-2 py-3 dark:border-gray-800">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(seller.id)}
                                            onChange={(e) => handleSelectItem(seller.id, e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                                        />
                                    </div>
                                )}
                                <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <div className="flex items-center">
                                        <div>
                                            <p className="text-theme-sm font-medium text-gray-900 dark:text-white">{seller.name}</p>
                                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{seller.email}</p>
                                            <p className="text-theme-xs text-gray-500 dark:text-gray-400">{seller.phone}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <p className="text-theme-sm text-gray-900 dark:text-white">{seller.brand_name || '-'}</p>
                                </div>
                                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <p className="text-theme-sm font-medium text-gray-900 dark:text-white">{seller.balance || '0.00'} DH</p>
                                </div>
                                <div className="col-span-1 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <p className="text-theme-sm text-gray-900 dark:text-white">{seller.points || '0'}</p>
                                </div>
                                <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                                    <Badge size="sm" color={seller.is_active ? "success" : "error"}>
                                        {seller.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div className="col-span-1 flex items-center px-4 py-3">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onManagePrices && onManagePrices(seller)}
                                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                            title="Configure Prices"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 7V3c0-1.105.895-2 2-2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onEdit && onEdit(seller)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus && onToggleStatus(seller)}
                                            className={`${seller.is_active ? 'text-red-600 hover:text-red-900 dark:text-red-400' : 'text-green-600 hover:text-green-900 dark:text-green-400'}`}
                                            title={seller.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="md:hidden space-y-4 p-4">
                        {paginatedData.map((seller, index) => (
                            <div key={seller.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        {enableSelection && (
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(seller.id)}
                                                onChange={(e) => handleSelectItem(seller.id, e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                            />
                                        )}
                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{seller.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{seller.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => onManagePrices && onManagePrices(seller)}
                                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                            title="Configure Prices"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 7V3c0-1.105.895-2 2-2z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onEdit && onEdit(seller)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                            title="Edit"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onToggleStatus && onToggleStatus(seller)}
                                            className={`${seller.is_active ? 'text-red-600 hover:text-red-900 dark:text-red-400' : 'text-green-600 hover:text-green-900 dark:text-green-400'}`}
                                            title={seller.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Brand:</span>
                                        <span className="text-sm text-gray-900 dark:text-white">{seller.brand_name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Balance:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{seller.balance || '0.00'} DH</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Points:</span>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{seller.points || '0'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Status:</span>
                                        <Badge size="sm" color={seller.is_active ? "success" : "error"}>
                                            {seller.is_active ? "Active" : "Inactive"}
                                        </Badge>
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

export default SellerDataTable;
