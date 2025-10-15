"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';

export interface DataTablesAdvancedItem {
  id: number;
  name: string;
  image: string;
  position: string;
  office: string;
  age: number;
  startDate: string;
  salary: string;
  status?: string;
}

interface DataTablesAdvancedProps {
  data: DataTablesAdvancedItem[];
  title?: string;
  showActions?: boolean;
  onEdit?: (item: DataTablesAdvancedItem) => void;
  onDelete?: (item: DataTablesAdvancedItem) => void;
}

const DataTablesAdvanced: React.FC<DataTablesAdvancedProps> = ({ 
  data, 
  title = "Datatable 2",
  showActions = true,
  onEdit,
  onDelete
}) => {
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter and sort data
  const filteredData = useMemo(() => {
    const searchLower = search.toLowerCase();
    return data
      .filter(
        (person) =>
          person.name.toLowerCase().includes(searchLower) ||
          person.position.toLowerCase().includes(searchLower) ||
          person.office.toLowerCase().includes(searchLower) ||
          (person.status && person.status.toLowerCase().includes(searchLower))
      )
      .sort((a, b) => {
        let modifier = sortDirection === "asc" ? 1 : -1;
        const aValue = a[sortColumn as keyof DataTablesAdvancedItem];
        const bValue = b[sortColumn as keyof DataTablesAdvancedItem];
        if (aValue < bValue) return -1 * modifier;
        if (aValue > bValue) return 1 * modifier;
        return 0;
      });
  }, [data, search, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    return filteredData.slice(start, end);
  }, [filteredData, currentPage, perPage]);

  const totalEntries = filteredData.length;
  const startEntry = (currentPage - 1) * perPage + 1;
  const endEntry = Math.min(currentPage * perPage, totalEntries);
  const totalPages = Math.ceil(filteredData.length / perPage);

  const sortBy = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortDirection("asc");
      setSortColumn(column);
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

  // Generate page numbers around current page
  const pagesAroundCurrent = useMemo(() => {
    let pages = [];
    const startPage = Math.max(2, currentPage - 2);
    const endPage = Math.min(totalPages - 1, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const getStatusBadge = (status: string = 'Active') => {
    const statusStyles = {
      'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Inactive': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    const colorClass = statusStyles[status as keyof typeof statusStyles] || statusStyles.Active;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {status}
      </span>
    );
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

            <div className="relative">
              <button className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.04199 9.37363C3.04199 5.87693 5.87735 3.04199 9.37533 3.04199C12.8733 3.04199 15.7087 5.87693 15.7087 9.37363C15.7087 12.8703 12.8733 15.7053 9.37533 15.7053C5.87735 15.7053 3.04199 12.8703 3.04199 9.37363ZM9.37533 1.54199C5.04926 1.54199 1.54199 5.04817 1.54199 9.37363C1.54199 13.6991 5.04926 17.2053 9.37533 17.2053C11.2676 17.2053 13.0032 16.5344 14.3572 15.4176L17.1773 18.238C17.4702 18.5309 17.945 18.5309 18.2379 18.238C18.5308 17.9451 18.5309 17.4703 18.238 17.1773L15.4182 14.3573C16.5367 13.0033 17.2087 11.2669 17.2087 9.37363C17.2087 5.04817 13.7014 1.54199 9.37533 1.54199Z" fill=""></path>
                </svg>
              </button>
              <input 
                type="text" 
                placeholder="Search..." 
                className="shadow-theme-xs focus:border-brand-300 focus:ring-brand-500/10 dark:focus:border-brand-800 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 placeholder:text-gray-400 focus:ring-3 focus:outline-hidden xl:w-[300px] dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="max-w-full overflow-x-auto">
            <div className="min-w-[1102px]">
              {/* table header start */}
              <div className="grid grid-cols-12 border-t border-gray-200 dark:border-gray-800">
                <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('name')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">User</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('position')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Position</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('office')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Office</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('age')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Age</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('startDate')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Start date</p>
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
                  <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('salary')}>
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Salary</p>
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
                {showActions && (
                  <div className="col-span-1 flex items-center px-4 py-3">
                    <p className="text-theme-xs font-medium text-gray-700 dark:text-gray-400">Action</p>
                  </div>
                )}
              </div>
              {/* table header end */}

              {/* table body start */}
              {paginatedData.map((person) => (
                <div key={person.id} className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={person.image}
                          alt={person.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/user/user-01.png';
                          }}
                        />
                      </div>
                      <p className="block text-theme-sm font-medium text-gray-800 dark:text-white/90">{person.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-700 dark:text-gray-400">{person.position}</p>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-700 dark:text-gray-400">{person.office}</p>
                  </div>
                  <div className="col-span-1 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-700 dark:text-gray-400">{person.age}</p>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-700 dark:text-gray-400">{person.startDate}</p>
                  </div>
                  <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-[17.5px] dark:border-gray-800">
                    <p className="text-theme-sm text-gray-700 dark:text-gray-400">{person.salary}</p>
                  </div>
                  {showActions && (
                    <div className="col-span-1 flex items-center px-4 py-[17.5px]">
                      <div className="flex w-full items-center gap-2">
                        <button 
                          className="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-500"
                          onClick={() => onDelete && onDelete(person)}
                        >
                          <svg className="fill-current" width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M7.04142 4.29199C7.04142 3.04935 8.04878 2.04199 9.29142 2.04199H11.7081C12.9507 2.04199 13.9581 3.04935 13.9581 4.29199V4.54199H16.1252H17.166C17.5802 4.54199 17.916 4.87778 17.916 5.29199C17.916 5.70621 17.5802 6.04199 17.166 6.04199H16.8752V8.74687V13.7469V16.7087C16.8752 17.9513 15.8678 18.9587 14.6252 18.9587H6.37516C5.13252 18.9587 4.12516 17.9513 4.12516 16.7087V13.7469V8.74687V6.04199H3.8335C3.41928 6.04199 3.0835 5.70621 3.0835 5.29199C3.0835 4.87778 3.41928 4.54199 3.8335 4.54199H4.87516H7.04142V4.29199ZM15.3752 13.7469V8.74687V6.04199H13.9581H13.2081H7.79142H7.04142H5.62516V8.74687V13.7469V16.7087C5.62516 17.1229 5.96095 17.4587 6.37516 17.4587H14.6252C15.0394 17.4587 15.3752 17.1229 15.3752 16.7087V13.7469ZM8.54142 4.54199H12.4581V4.29199C12.4581 3.87778 12.1223 3.54199 11.7081 3.54199H9.29142C8.87721 3.54199 8.54142 3.87778 8.54142 4.29199V4.54199ZM8.8335 8.50033C9.24771 8.50033 9.5835 8.83611 9.5835 9.25033V14.2503C9.5835 14.6645 9.24771 15.0003 8.8335 15.0003C8.41928 15.0003 8.0835 14.6645 8.0835 14.2503V9.25033C8.0835 8.83611 8.41928 8.50033 8.8335 8.50033ZM12.9168 9.25033C12.9168 8.83611 12.581 8.50033 12.1668 8.50033C11.7526 8.50033 11.4168 8.83611 11.4168 9.25033V14.2503C11.4168 14.6645 11.7526 15.0003 12.1668 15.0003C12.581 15.0003 12.9168 14.6645 12.9168 14.2503V9.25033Z" fill=""></path>
                          </svg>
                        </button>
                        <button 
                          className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90"
                          onClick={() => onEdit && onEdit(person)}
                        >
                          <svg className="fill-current" width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" clipRule="evenodd" d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z" fill=""></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
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
                  className="mr-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <button 
                  onClick={() => goToPage(1)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 ${
                    currentPage === 1 ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-700 dark:text-gray-400'
                  }`}
                >
                  1
                </button>

                {currentPage > 3 && (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500">...</span>
                )}

                {pagesAroundCurrent.map((page) => (
                  <button 
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500 ${
                      currentPage === page ? 'bg-blue-500/[0.08] text-brand-500' : 'text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {currentPage < totalPages - 2 && (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-500/[0.08] hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-500">...</span>
                )}

                <button 
                  onClick={nextPage}
                  className="ml-2.5 flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                  disabled={currentPage === totalPages}
                >
                  Next
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
      </div>
    </div>
  );
};

export default DataTablesAdvanced;