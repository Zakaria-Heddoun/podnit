"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";

// Template interface
interface Template {
  id: number;
  name: string;
  category: "Email" | "Product" | "Invoice" | "Report" | "Landing";
  description: string;
  status: "Active" | "Draft" | "Archived";
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

// Sample template data
const sampleTemplates: Template[] = [
  {
    id: 1,
    name: "Welcome Email",
    category: "Email",
    description: "Welcome email template for new users",
    status: "Active",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    usageCount: 1250
  },
  {
    id: 2,
    name: "Product Showcase",
    category: "Product",
    description: "Template for product listing pages",
    status: "Active",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-18",
    usageCount: 890
  },
  {
    id: 3,
    name: "Invoice Standard",
    category: "Invoice",
    description: "Standard invoice template for orders",
    status: "Active",
    createdAt: "2024-01-12",
    updatedAt: "2024-01-19",
    usageCount: 2340
  },
  {
    id: 4,
    name: "Password Reset",
    category: "Email",
    description: "Password reset email template",
    status: "Draft",
    createdAt: "2024-01-22",
    updatedAt: "2024-01-22",
    usageCount: 0
  },
  {
    id: 5,
    name: "Monthly Report",
    category: "Report",
    description: "Monthly performance report template",
    status: "Active",
    createdAt: "2024-01-08",
    updatedAt: "2024-01-16",
    usageCount: 56
  },
  {
    id: 6,
    name: "Landing Hero",
    category: "Landing",
    description: "Hero section template for landing pages",
    status: "Archived",
    createdAt: "2023-12-20",
    updatedAt: "2024-01-05",
    usageCount: 340
  }
];

export default function AdminTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const categories = ["All", "Email", "Product", "Invoice", "Report", "Landing"];
  const statuses = ["All", "Active", "Draft", "Archived"];

  // Filter templates based on search and filters
  const filteredTemplates = sampleTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || template.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Template statistics
  const stats = {
    total: sampleTemplates.length,
    active: sampleTemplates.filter(t => t.status === "Active").length,
    draft: sampleTemplates.filter(t => t.status === "Draft").length,
    archived: sampleTemplates.filter(t => t.status === "Archived").length,
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Templates Management
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Manage and organize all system templates including email, product, and invoice templates
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z" />
              <path d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.total}
              </h4>
              <span className="text-sm font-medium">Total Templates</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" />
              <path d="M19.7781 0.975006H18.8406L18.5906 2.84376C18.5563 3.23126 18.2375 3.53751 17.8156 3.53751H2.18438C1.76251 3.53751 1.44376 3.23126 1.40938 2.84376L1.15938 0.975006H0.221883C0.0968828 0.975006 -0.0281172 1.07501 -0.0281172 1.23751C-0.0281172 1.36251 0.0718828 1.49376 0.221883 1.49376H0.877508L1.43751 8.00001C1.47188 8.35001 1.76251 8.62501 2.1125 8.62501H17.8875C18.2375 8.62501 18.5281 8.35001 18.5625 8.00001L19.1225 1.49376H19.7781C19.9031 1.49376 20.0281 1.39376 20.0281 1.23126C20.0281 1.10001 19.9031 0.975006 19.7781 0.975006Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.active}
              </h4>
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9344 19.7313 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37816 18.6313 2.44691 18.2188L4.12816 3.43751C4.19691 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1875 2.16563 17.8031 2.71563 17.8719 3.43751L19.5532 18.2188C19.6219 18.6313 19.4907 19.0438 19.2157 19.3531Z" />
              <path d="M14.3344 5.29375C13.8469 5.29375 13.4688 5.67188 13.4688 6.15938V8.625C13.4688 9.1125 13.8469 9.49063 14.3344 9.49063C14.8219 9.49063 15.2 9.1125 15.2 8.625V6.15938C15.2 5.67188 14.8219 5.29375 14.3344 5.29375Z" />
              <path d="M7.66559 5.29375C7.17809 5.29375 6.79996 5.67188 6.79996 6.15938V8.625C6.79996 9.1125 7.17809 9.49063 7.66559 9.49063C8.15309 9.49063 8.53121 9.1125 8.53121 8.625V6.15938C8.53121 5.67188 8.15309 5.29375 7.66559 5.29375Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.draft}
              </h4>
              <span className="text-sm font-medium">Draft</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z" />
              <path d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z" />
              <path d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7781 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 17.0406 1.13428 17.5563 1.85303 17.5563H8.97178C9.69053 17.5563 10.2062 17.0406 10.2062 16.3219V13.8469C10.2062 13.2281 9.99678 12.6094 9.65303 12.0938C10.3468 11.6781 11.1499 11.4375 11.9187 11.4375H15.2437C16.0343 11.4375 16.6531 12.0563 16.6531 12.8469V14.6094C16.6531 15.4 17.2718 16.0188 18.0624 16.0188C18.8531 16.0188 19.4718 15.4 19.4718 14.6094V12.8469C19.4718 11.2969 18.5343 10.0313 15.9843 10.0313Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {stats.archived}
              </h4>
              <span className="text-sm font-medium">Archived</span>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              All Templates
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredTemplates.length} of {sampleTemplates.length} templates
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 sm:w-64"
              />
              <svg
                className="absolute left-3 top-3 h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category} Category
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status} Status
                </option>
              ))}
            </select>

            {/* Create Button */}
            <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Template
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Category
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Usage
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400"
                >
                  Updated
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-end text-xs dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="py-4">
                    <div>
                      <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                        {template.name}
                      </p>
                      <p className="text-gray-500 text-xs dark:text-gray-400">
                        {template.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      size="sm"
                      color={
                        template.category === "Email" ? "primary" :
                        template.category === "Product" ? "success" :
                        template.category === "Invoice" ? "warning" :
                        template.category === "Report" ? "info" : "light"
                      }
                    >
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      size="sm"
                      color={
                        template.status === "Active" ? "success" :
                        template.status === "Draft" ? "warning" : "light"
                      }
                    >
                      {template.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-gray-500 text-sm dark:text-gray-400">
                    {template.usageCount.toLocaleString()} times
                  </TableCell>
                  <TableCell className="py-4 text-gray-500 text-sm dark:text-gray-400">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="py-4 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        title="Duplicate"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        title="Delete"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}