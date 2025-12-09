"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";

// Template interface matching API
interface Template {
  id: number;
  title: string;
  description: string;
  thumbnail_image: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_feedback?: string;
  created_at: string;
  orders_count?: number; // Assuming backend appends this or we calculate
}

export default function SellerTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const getImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`;
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete template", error);
    }
  };

  const handleCreateOrderFromTemplate = (template: Template) => {
    if (template.status !== 'APPROVED') return;

    // Navigate to order creation with template data
    // Simplify passing data - just ID might be enough if create-order page fetches it
    // But keeping consistent with previous pattern for now
    const templateData = encodeURIComponent(JSON.stringify({
      templateId: template.id,
      templateName: template.title,
    }));

    router.push(`/seller/create-order?template=${templateData}`);
  };

  const handleEdit = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit template", template.id);
    router.push(`/seller/studio?id=${template.id}`);
  }

  // Filter templates based on search and filters
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || template.status === filterStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      {/* Header & Stats could go here */}

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
              <path d="M8.11111 15.2222C12.0385 15.2222 15.2222 12.0385 15.2222 8.11111C15.2222 4.18375 12.0385 1 8.11111 1C4.18375 1 1 4.18375 1 8.11111C1 12.0385 4.18375 15.2222 8.11111 15.2222Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16.9995 17.0001L13.1328 13.1334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-stroke bg-transparent px-5 py-3 outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
        >
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => template.status === 'REJECTED' ? handleEdit(template, { stopPropagation: () => { } } as any) : null}
              className={`group relative overflow-hidden rounded-lg border bg-white shadow-default dark:bg-boxdark h-96 transition-all duration-300 ${template.status === 'REJECTED' ? 'border-red-500/50 cursor-pointer' : 'border-stroke dark:border-strokedark'
                }`}
            >
              {/* Status Badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge
                  color={
                    template.status === 'APPROVED' ? 'success' :
                      template.status === 'REJECTED' ? 'error' : 'warning'
                  }
                  variant="solid"
                >
                  {template.status}
                </Badge>
              </div>

              {/* Full-screen template image */}
              <div className="absolute inset-0 w-full h-full">
                {template.thumbnail_image ? (
                  <img
                    src={getImageUrl(template.thumbnail_image)}
                    alt={template.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              </div>

              {/* Overlaid content */}
              <div className="absolute inset-0 flex flex-col justify-between p-6">
                {/* Actions Top Left */}
                <div className="self-start z-10">
                  <button
                    onClick={(e) => handleDelete(template.id, e)}
                    className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-600 transition-colors"
                    title="Delete Template"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="text-center mt-auto">
                  <h4 className="text-xl font-bold text-white drop-shadow-lg">
                    {template.title}
                  </h4>
                  {template.status === 'REJECTED' && template.admin_feedback && (
                    <div className="mt-2 p-2 bg-red-500/80 rounded text-xs text-white backdrop-blur-sm">
                      Reason: {template.admin_feedback}
                      <div className="mt-1 font-bold underline">Click card to fix</div>
                    </div>
                  )}
                </div>

                {/* Create Order Button - Only visible on hover and if Approved */}
                {template.status === 'APPROVED' && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 bg-black/20 backdrop-blur-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateOrderFromTemplate(template);
                      }}
                      className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 hover:scale-105 transition-all duration-200 shadow-lg border border-white/20"
                    >
                      Create Order
                    </button>
                  </div>
                )}

                {/* Date */}
                <div className="flex items-center justify-end mt-4">
                  <div className="text-xs text-gray-300">
                    {new Date(template.created_at).toLocaleDateString()}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}