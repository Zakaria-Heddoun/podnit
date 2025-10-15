"use client";

import React, { useState, useMemo } from 'react';

export interface TransactionDataItem {
  id: number;
  transactionNo: string;
  description: string;
  amount: string;
  createdAt: string;
  status: 'DEPOSIT' | 'WITHDRAWAL' | 'PENDING' | 'COMPLETED' | 'FAILED';
  transactionState: 'PENDING' | 'COMPLETED' | 'FAILED';
}

interface TransactionDataTableProps {
  data: TransactionDataItem[];
  title?: string;
}

const TransactionDataTable: React.FC<TransactionDataTableProps> = ({ 
  data, 
  title = "Transactions" 
}) => {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");

  // Filter and sort data
  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return data
      .filter((transaction) => {
        const matchesSearch = 
          transaction.transactionNo.toLowerCase().includes(searchLower) ||
          transaction.description.toLowerCase().includes(searchLower) ||
          transaction.amount.toLowerCase().includes(searchLower);
        
        const matchesStatus = statusFilter === "" || 
          transaction.status === statusFilter || 
          transaction.transactionState === statusFilter;
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let modifier = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortColumn as keyof TransactionDataItem];
        const bValue = b[sortColumn as keyof TransactionDataItem];
        if (aValue < bValue) return -1 * modifier;
        if (aValue > bValue) return 1 * modifier;
        return 0;
      });
  }, [data, search, sortColumn, sortDirection, statusFilter]);

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

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium uppercase tracking-wide";
    
    switch (status) {
      case 'DEPOSIT':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'WITHDRAWAL':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400`;
    }
  };

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
                  <option value="8" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">8</option>
                  <option value="5" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">5</option>
                </select>
                <span className="absolute top-1/2 right-2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-400"> entries </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select 
                  className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none py-2 pr-8 pl-3 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">Filter by status</option>
                  <option value="DEPOSIT" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">DEPOSIT</option>
                  <option value="WITHDRAWAL" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">WITHDRAWAL</option>
                  <option value="PENDING" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">PENDING</option>
                  <option value="COMPLETED" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">COMPLETED</option>
                  <option value="FAILED" className="text-gray-500 dark:bg-gray-900 dark:text-gray-400">FAILED</option>
                </select>
                <span className="absolute top-1/2 right-2 z-30 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg className="stroke-current" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.8335 5.9165L8.00016 10.0832L12.1668 5.9165" stroke="" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
              </div>

              <div className="relative">
                <button className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill=""></path>
                  </svg>
                </button>
                <input 
                  type="text" 
                  placeholder="Search By transaction NO..." 
                  className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="w-full">
              {/* table header start */}
              <div className="grid grid-cols-12 border-t border-gray-200 dark:border-gray-800">
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('transactionNo')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Transaction No</p>
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
                <div className="col-span-3 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('description')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Description</p>
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
                <div className="col-span-1 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('amount')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Amount</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('createdAt')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Created At</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('status')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Status</p>
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
                <div className="col-span-2 flex items-center px-4 py-3">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('transactionState')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Transaction State</p>
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
              </div>
              {/* table header end */}

              {/* table body start */}
              {paginatedData.map((transaction) => (
                <div key={transaction.id} className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{transaction.transactionNo}</p>
                  </div>
                  <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-800 dark:text-white/90">{transaction.description}</p>
                  </div>
                  <div className="col-span-1 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm font-semibold text-gray-800 dark:text-white/90">{transaction.amount}</p>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-800 dark:text-white/90">{transaction.createdAt}</p>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <span className={getStatusBadge(transaction.status)}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center px-4 py-[17.5px]">
                    <span className={getStatusBadge(transaction.transactionState)}>
                      {transaction.transactionState}
                    </span>
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
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                      currentPage === page
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

export default TransactionDataTable;