"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';

interface Employee {
  id: number;
  name: string;
  image: string;
  position: string;
  office: string;
  age: number;
  startDate: string;
  salary: string;
}

const sampleData: Employee[] = [
  {
    id: 1,
    name: "Lindsey Curtis",
    image: "/images/user/user-17.jpg",
    position: "Sales Assistant",
    office: "New York",
    age: 33,
    startDate: "12 Feb, 2027",
    salary: "$168,500",
  },
  {
    id: 2,
    name: "Kaiya George",
    image: "/images/user/user-18.jpg",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 66,
    startDate: "13 Mar, 2027",
    salary: "$23,500",
  },
  {
    id: 3,
    name: "Zain Geidt",
    image: "/images/user/user-19.jpg",
    position: "Sales Assistant",
    office: "Tokyo",
    age: 48,
    startDate: "19 Mar, 2027",
    salary: "$12,500",
  },
  {
    id: 4,
    name: "Abram Schleifer",
    image: "/images/user/user-20.jpg",
    position: "Sales Assistant",
    office: "Edinburgh",
    age: 57,
    startDate: "25 Apr, 2027",
    salary: "$89,500",
  },
  {
    id: 5,
    name: "Carla George",
    image: "/images/user/user-21.jpg",
    position: "Sales Assistant",
    office: "London",
    age: 45,
    startDate: "11 May, 2027",
    salary: "$15,500",
  },
  {
    id: 6,
    name: "Emery Culhane",
    image: "/images/user/user-22.jpg",
    position: "Sales Assistant",
    office: "New York",
    age: 45,
    startDate: "29 Jun, 2027",
    salary: "$23,500",
  },
  {
    id: 7,
    name: "Livia Donin",
    image: "/images/user/user-23.jpg",
    position: "Sales Assistant",
    office: "London",
    age: 26,
    startDate: "22 Jul, 2027",
    salary: "$58,500",
  },
  {
    id: 8,
    name: "Miracle Bator",
    image: "/images/user/user-24.jpg",
    position: "Sales Assistant",
    office: "Tokyo",
    age: 38,
    startDate: "05 Aug, 2027",
    salary: "$34,900",
  },
  {
    id: 9,
    name: "Lincoln Herwitz",
    image: "/images/user/user-25.jpg",
    position: "Sales Assistant",
    office: "London",
    age: 34,
    startDate: "09 Sep, 2027",
    salary: "$18,300",
  },
  {
    id: 10,
    name: "Ekstrom Bothman",
    image: "/images/user/user-26.jpg",
    position: "Sales Assistant",
    office: "San Francisco",
    age: 53,
    startDate: "15 Nov, 2027",
    salary: "$19,200",
  },
];

type SortColumn = keyof Employee;
type SortDirection = 'asc' | 'desc';

const DataTablesHTML: React.FC = () => {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = sampleData.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.position.toLowerCase().includes(search.toLowerCase()) ||
      item.office.toLowerCase().includes(search.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [search, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / perPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const startEntry = (currentPage - 1) * perPage + 1;
  const endEntry = Math.min(currentPage * perPage, filteredAndSortedData.length);

  const sortBy = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Generate page numbers around current page
  const pagesAroundCurrent = useMemo(() => {
    const pages = [];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  const SortIcon = () => (
    <span className="flex flex-col gap-0.5">
      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.40962 0.585167C4.21057 0.300808 3.78943 0.300807 3.59038 0.585166L1.05071 4.21327C0.81874 4.54466 1.05582 5 1.46033 5H6.53967C6.94418 5 7.18126 4.54466 6.94929 4.21327L4.40962 0.585167Z" fill=""></path>
      </svg>
      <svg className="fill-gray-300 dark:fill-gray-700" width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4.40962 4.41483C4.21057 4.69919 3.78943 4.69919 3.59038 4.41483L1.05071 0.786732C0.81874 0.455343 1.05582 0 1.46033 0H6.53967C6.94418 0 7.18126 0.455342 6.94929 0.786731L4.40962 4.41483Z" fill=""></path>
      </svg>
    </span>
  );

  return (
    <div className="rounded-[10px] bg-white px-7.5 pb-4 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
      <h4 className="mb-5.5 text-body-2xlg font-bold text-dark dark:text-white">
        Datatable 1
      </h4>

      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Show</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">entries</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-400">Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded border border-gray-300 px-3 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            placeholder="Search..."
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6">
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          {/* Table Header */}
          <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800">
            <div className="col-span-3 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('name')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  User
                </p>
                <SortIcon />
              </div>
            </div>
            <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('position')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  Position
                </p>
                <SortIcon />
              </div>
            </div>
            <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('office')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  Office
                </p>
                <SortIcon />
              </div>
            </div>
            <div className="col-span-1 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('age')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  Age
                </p>
                <SortIcon />
              </div>
            </div>
            <div className="col-span-2 flex items-center border-r border-gray-200 px-4 py-3 dark:border-gray-800">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('startDate')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  Start date
                </p>
                <SortIcon />
              </div>
            </div>
            <div className="col-span-2 flex items-center px-4 py-3">
              <div className="flex w-full cursor-pointer items-center justify-between" onClick={() => sortBy('salary')}>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-400">
                  Salary
                </p>
                <SortIcon />
              </div>
            </div>
          </div>

          {/* Table Body */}
          {paginatedData.map((person) => (
            <div key={person.id} className="grid grid-cols-12 border-t border-gray-100 dark:border-gray-800">
              <div className="col-span-3 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={person.image}
                      alt={person.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                      {person.name}
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-400">{person.position}</p>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-400">{person.office}</p>
              </div>
              <div className="col-span-1 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-400">{person.age}</p>
              </div>
              <div className="col-span-2 flex items-center border-r border-gray-100 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-400">{person.startDate}</p>
              </div>
              <div className="col-span-2 flex items-center px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-400">{person.salary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-100 py-4 pr-4 pl-[18px] dark:border-gray-800">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between">
          <p className="border-b border-gray-100 pb-3 text-center text-sm font-medium text-gray-500 xl:border-b-0 xl:pb-0 xl:text-left dark:border-gray-800 dark:text-gray-400">
            Showing {startEntry} to {endEntry} of {filteredAndSortedData.length} entries
          </p>

          <div className="flex items-center justify-center gap-0.5 pt-4 xl:justify-end xl:pt-0">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="mr-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M2.58301 9.99868C2.58272 10.1909 2.65588 10.3833 2.80249 10.53L7.79915 15.5301C8.09194 15.8231 8.56682 15.8233 8.85981 15.5305C9.15281 15.2377 9.15297 14.7629 8.86018 14.4699L5.14009 10.7472L16.6675 10.7472C17.0817 10.7472 17.4175 10.4114 17.4175 9.99715C17.4175 9.58294 17.0817 9.24715 16.6675 9.24715L5.14554 9.24715L8.86017 5.53016C9.15297 5.23717 9.15282 4.7623 8.85983 4.4695C8.56684 4.1767 8.09197 4.17685 7.79917 4.46984L2.84167 9.43049C2.68321 9.568 2.58301 9.77087 2.58301 9.99715C2.58301 9.99766 2.58301 9.99817 2.58301 9.99868Z" fill=""></path>
              </svg>
            </button>

            {totalPages > 0 && (
              <button
                onClick={() => goToPage(1)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-blue-500 dark:hover:text-blue-500 ${
                  currentPage === 1 ? 'bg-blue-500/[0.08] text-blue-500' : 'text-gray-700 dark:text-gray-400'
                }`}
              >
                1
              </button>
            )}

            {currentPage > 3 && (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-blue-500/[0.08] hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-500">
                ...
              </span>
            )}

            {pagesAroundCurrent.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-blue-500 dark:hover:text-blue-500 ${
                  currentPage === page ? 'bg-blue-500/[0.08] text-blue-500' : 'text-gray-700 dark:text-gray-400'
                }`}
              >
                {page}
              </button>
            ))}

            {currentPage < totalPages - 2 && totalPages > 3 && (
              <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium text-gray-700 hover:bg-blue-500/[0.08] hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-500">
                ...
              </span>
            )}

            {totalPages > 1 && (
              <button
                onClick={() => goToPage(totalPages)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium hover:bg-blue-500/[0.08] hover:text-blue-500 dark:hover:text-blue-500 ${
                  currentPage === totalPages ? 'bg-blue-500/[0.08] text-blue-500' : 'text-gray-700 dark:text-gray-400'
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="ml-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M17.4175 9.9986C17.4178 10.1909 17.3446 10.3832 17.198 10.53L12.2013 15.5301C11.9085 15.8231 11.4337 15.8233 11.1407 15.5305C10.8477 15.2377 10.8475 14.7629 11.1403 14.4699L14.8604 10.7472L3.33301 10.7472C2.91879 10.7472 2.58301 10.4114 2.58301 9.99715C2.58301 9.58294 2.91879 9.24715 3.33301 9.24715L14.8549 9.24715L11.1403 5.53016C10.8475 5.23717 10.8477 4.7623 11.1407 4.4695C11.4336 4.1767 11.9085 4.17685 12.2013 4.46984L17.1588 9.43049C17.3173 9.568 17.4175 9.77087 17.4175 9.99715C17.4175 9.99763 17.4175 9.99812 17.4175 9.9986Z" fill=""></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTablesHTML;