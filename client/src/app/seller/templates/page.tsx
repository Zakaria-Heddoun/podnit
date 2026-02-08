"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Badge from "@/components/ui/badge/Badge";
import { getImageUrl, getApiUrl } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Template interface matching API
interface Template {
  id: number;
  title: string;
  description: string;
  thumbnail_image: string | null;
  calculated_price?: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_feedback?: string;
  created_at: string;
  orders_count?: number; // Assuming backend appends this or we calculate
  product_id: number;
  product?: {
    id: number;
    name: string;
    base_price: string;
    product_images?: Array<{ image_url: string }>;
  };
}

export default function SellerTemplates() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Always fetch templates on mount
    fetchTemplates();

    // If there is a newly created template stored in sessionStorage (fallback from studio), prepend it immediately
    try {
      const stored = sessionStorage.getItem('new_template');
      if (stored) {
        const parsed = JSON.parse(stored);
        setTemplates(prev => prev.some(t => t.id === parsed.id) ? prev : [parsed, ...prev]);
        sessionStorage.removeItem('new_template');
        // Remove query params if present
        try { router.replace('/seller/templates'); } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.warn('Failed to load new_template from sessionStorage', err);
    }

    // If we were redirected after creating a template, fetch that single template and prepend it
    const isNew = searchParams?.get?.('new') === '1';
    const templateId = searchParams?.get?.('templateId');

    if (isNew && templateId) {
      (async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates/${templateId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (response.ok) {
            const json = await response.json();
            const newTemplate = json.data;
            // Avoid duplicates
            setTemplates(prev => prev.some(t => t.id === newTemplate.id) ? prev : [newTemplate, ...prev]);
          }
        } catch (err) {
          console.error('Failed to fetch created template', err);
        } finally {
          // Clean up the query params in the URL so we don't refetch repeatedly
          try { router.replace('/seller/templates'); } catch (e) { /* ignore */ }
        }
      })();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/seller/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Support paginator or legacy array
        let templatesData = Array.isArray(data.data) ? data.data : (data.data?.data || []);

        // If a newly created template was saved to sessionStorage as a fallback, merge it in
        try {
          const stored = sessionStorage.getItem('new_template');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!templatesData.some((t: any) => t.id === parsed.id)) {
              templatesData = [parsed, ...templatesData];
            }
            sessionStorage.removeItem('new_template');
            try { router.replace('/seller/templates'); } catch (e) { /* ignore */ }
          }
        } catch (err) {
          console.warn('Failed to merge new_template into templates list', err);
        }

        setTemplates(templatesData);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteConfirmOpen(false);
    setDeleteId(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success('Template deleted successfully');
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      console.error("Failed to delete template", error);
      toast.error('Failed to delete template');
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
    // Redirect to product studio with template ID to edit
    router.push(`/seller/studio?product=${template.product_id}&templateId=${template.id}`);
  }

  // Filter templates based on search and filters
  const filteredTemplates = Array.isArray(templates) ? templates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "All" || template.status === filterStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  }) : [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading templates...</div>;
  }

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
              {templates.length} / 50 templates used
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-black dark:text-white">
                {Math.round((templates.length / 50) * 100)}%
              </div>
              <div className="text-xs text-body dark:text-bodydark">
                Usage
              </div>
            </div>
            <div className="w-32">
              <div className="mb-2 flex justify-between text-xs text-body dark:text-bodydark">
                <span>{templates.length}</span>
                <span>50</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(templates.length / 50) * 100}%`,
                    backgroundColor: templates.length >= 50 ? '#EF4444' : templates.length >= 40 ? '#F59E0B' : '#10B981'
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

      {/* Template Cards Grid — FIX 1: xl:grid-cols-4 for 4 columns */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              onMouseEnter={() => setHoveredId(template.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => template.status === 'REJECTED' ? handleEdit(template, { stopPropagation: () => { } } as any) : null}
              className={`relative overflow-hidden rounded-lg border bg-white shadow-default dark:bg-boxdark transition-all duration-300 ${template.status === 'REJECTED' ? 'border-red-500/50 cursor-pointer' : 'border-stroke dark:border-strokedark'}`}
              style={{ height: '280px' }}
            >
              {/* Background image layer */}
              <div className="absolute inset-0 w-full h-full">
                {template.product?.product_images && template.product.product_images.length > 0 ? (
                  <div className="h-full w-full flex overflow-x-auto scroll-snap-x scroll-smooth">
                    {template.product.product_images.map((img, idx) => (
                      <div key={idx} className="min-w-full h-full scroll-snap-align-start">
                        <img
                          src={getImageUrl(img.image_url)}
                          alt={`${template.title} view ${idx + 1}`}
                          className="h-full w-full object-cover"
                          onError={(e: any) => e.target.src = '/images/placeholder-product.png'}
                        />
                      </div>
                    ))}
                  </div>
                ) : template.thumbnail_image ? (
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

              {/* Delete button — top left */}
              <div className="absolute top-3 left-3 z-10">
                <button
                  onClick={(e) => handleDeleteClick(template.id, e)}
                  className="p-1.5 rounded-full bg-black/40 text-white hover:bg-red-600 transition-colors"
                  title="Delete Template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Bottom info: title + price + feedback + date */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
                <h4 className="text-lg font-bold text-white drop-shadow-lg text-center">
                  {template.title}
                </h4>
                {template.calculated_price && (
                  <div className="mt-1 text-center">
                    <span className="inline-block bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-semibold backdrop-blur-sm">
                      {parseFloat(String(template.calculated_price)).toFixed(2)} DH
                    </span>
                  </div>
                )}
                {template.status === 'REJECTED' && template.admin_feedback && (
                  <div className="mt-1.5 p-2 bg-red-500/80 rounded text-xs text-white backdrop-blur-sm text-center">
                    Reason: {template.admin_feedback}
                    <div className="mt-1 font-bold underline">Click card to fix</div>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-300 text-right">
                  {new Date(template.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Create Order button — shown via React state, no group-hover */}
              {template.status === 'APPROVED' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateOrderFromTemplate(template);
                  }}
                  className="absolute inset-0 z-20 flex items-center justify-center transition-opacity duration-200"
                  style={{ opacity: hoveredId === template.id ? 1 : 0, pointerEvents: hoveredId === template.id ? 'auto' : 'none' }}
                >
                  <span className="bg-primary text-white px-6 py-2.5 rounded-lg font-medium shadow-lg border border-white/20 hover:bg-primary/90 hover:scale-105 transition-all duration-200">
                    Create Order
                  </span>
                </button>
              )}
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

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
  );
}