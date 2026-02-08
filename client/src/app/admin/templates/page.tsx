"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { AdminRejectModal } from "@/components/admin/AdminRejectModal";
import { getImageUrl, getApiUrl } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Template interface
interface Template {
  id: number;
  title: string;
  description?: string;
  thumbnail_image?: string;
  design_config?: any;
  calculated_price?: number;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
  };
  product?: {
    name: string;
    base_price: string;
  };
}

export default function AdminTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Approve / Delete confirmation dialogs
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const query = selectedStatus !== 'All' ? `?status=${encodeURIComponent(selectedStatus)}` : '';

      const response = await fetch(`${getApiUrl()}/api/admin/templates${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Support paginator or legacy array
        const list = Array.isArray(data.data) ? data.data : (data.data?.data || []);
        setTemplates(list);
      }
    } catch (error) {
      console.error("Failed to fetch templates", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setApproveId(id);
    setApproveConfirmOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!approveId) return;
    const id = approveId;
    setApproveConfirmOpen(false);
    setApproveId(null);
    setIsProcessing(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${id}/approve`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: 'APPROVED' } : t));
        toast.success('Template approved successfully');
      } else {
        toast.error('Failed to approve template');
      }
    } catch (error) {
      console.error("Failed to approve template", error);
      toast.error('Error approving template');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedTemplateId(id);
    setRejectModalOpen(true);
  };

  const parseDesignConfig = (config: any) => {
    if (!config) return null;
    if (typeof config === 'string') {
      try {
        return JSON.parse(config);
      } catch {
        return null;
      }
    }
    return config;
  };

  const resolveThumbnail = (template: Template) => {
    const parsed = parseDesignConfig(template.design_config);
    const firstImage = parsed?.images ? (Object.values(parsed.images).find(Boolean) as string | undefined) : undefined;
    return getImageUrl(template.thumbnail_image || firstImage || null);
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedTemplateId) return;
    setIsProcessing(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${selectedTemplateId}/reject`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, status: 'REJECTED' } : t));
        setRejectModalOpen(false);
        setSelectedTemplateId(null);
        toast.success('Template rejected successfully');
      } else {
        toast.error('Failed to reject template');
      }
    } catch (error) {
      console.error("Failed to reject template", error);
      toast.error('Error rejecting template');
    } finally {
      setIsProcessing(false);
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
    setIsProcessing(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast.success('Template and all associated files deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error("Failed to delete template", error);
      toast.error('Error deleting template');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter templates based on search locally
  const filteredTemplates = Array.isArray(templates) ? templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const statuses = ["All", "Pending", "Approved", "Rejected"];

  // Template statistics
  const stats = {
    total: Array.isArray(templates) ? templates.length : 0,
    approved: Array.isArray(templates) ? templates.filter(t => t.status === "APPROVED").length : 0,
    pending: Array.isArray(templates) ? templates.filter(t => t.status === "PENDING").length : 0,
    rejected: Array.isArray(templates) ? templates.filter(t => t.status === "REJECTED").length : 0,
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Templates Management
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Review and manage seller product templates
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Total */}
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-title-md font-bold text-black dark:text-white">{stats.total}</div>
          <span className="text-sm font-medium">Total Templates</span>
        </div>
        {/* Pending */}
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-title-md font-bold text-yellow-500">{stats.pending}</div>
          <span className="text-sm font-medium">Pending Review</span>
        </div>
        {/* Approved */}
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-title-md font-bold text-green-500">{stats.approved}</div>
          <span className="text-sm font-medium">Approved</span>
        </div>
        {/* Rejected */}
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="text-title-md font-bold text-red-500">{stats.rejected}</div>
          <span className="text-sm font-medium">Rejected</span>
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
              {filteredTemplates.length} templates
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
          </div>
        </div>

        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Template</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">User</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Price</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Date</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">Loading...</TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-gray-500">No templates found.</TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => {
                  const thumbUrl = resolveThumbnail(template);
                  return (
                    <TableRow key={template.id}>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          {thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={template.title}
                              className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800"></div>
                          )}
                          <div>
                            <p className="font-medium text-gray-800 text-sm dark:text-white/90">
                              {template.title}
                            </p>
                            <p className="text-gray-500 text-xs dark:text-gray-400">
                              {template.product?.name || 'Product'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        {template.user?.name || 'Unknown'}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm font-semibold text-gray-800 dark:text-white">
                          {template.calculated_price ? `${parseFloat(String(template.calculated_price)).toFixed(2)} DH` : 
                           template.product?.base_price ? `${parseFloat(template.product.base_price).toFixed(2)} DH` : 
                           'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge
                          size="sm"
                          color={
                            template.status === "APPROVED" ? "success" :
                              template.status === "REJECTED" ? "error" : "warning"
                          }
                          variant="solid"
                        >
                          {template.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-gray-500 text-sm dark:text-gray-400">
                        {new Date(template.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-end">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Designs Button */}
                          <button
                            onClick={() => router.push(`/admin/templates/${template.id}/review`)}
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                            title="View Designs"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {template.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(template.id)}
                                className="rounded-lg bg-green-50 p-2 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                                title="Approve"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => openRejectModal(template.id)}
                                className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                title="Reject"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </>
                          )}
                          
                          {/* Delete Button - Always visible for admin */}
                          <button
                            onClick={(e) => handleDeleteClick(template.id, e)}
                            className="rounded-lg bg-gray-50 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                            title="Delete Template"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AdminRejectModal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        isProcessing={isProcessing}
      />

      <ConfirmDialog
        open={approveConfirmOpen}
        onClose={() => { setApproveConfirmOpen(false); setApproveId(null); }}
        onConfirm={handleApproveConfirm}
        title="Approve Template"
        message="Are you sure you want to approve this template?"
        confirmLabel="Approve"
        cancelLabel="Cancel"
        isLoading={isProcessing}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Template"
        message="Are you sure you want to delete this template? This will also delete all associated asset files."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={isProcessing}
      />
    </div>
  );
}
