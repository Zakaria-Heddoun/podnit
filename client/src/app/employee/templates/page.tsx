"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { AdminRejectModal } from "@/components/admin/AdminRejectModal";

// Template interface
interface Template {
  id: number;
  title: string;
  description: string;
  thumbnail_image: string;
  big_front_image: string;
  small_front_image: string;
  back_image: string;
  left_sleeve_image: string;
  right_sleeve_image: string;
  design_config: string;
  status: string;
  created_at: string;
  updated_at: string;
  user: {
    name: string;
  };
  product?: {
    name: string;
  };
}

export default function EmployeeTemplatesPage() {
  const { user, hasPermission, token } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const router = useRouter();

  // Check if user has permission to view templates
  if (!hasPermission('approve_templates')) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view templates.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, token]);

  const fetchTemplates = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const url = new URL(`${API_URL}/api/admin/templates`);
      if (selectedStatus !== 'All') {
        url.searchParams.append('status', selectedStatus);
      }

      console.log('🔍 Fetching templates from:', url.toString());

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log('📡 Templates response status:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Templates API response:', data);
        const templatesData = data.data || [];
        console.log(`✅ Extracted ${templatesData.length} templates`);
        
        // Log user data for each template
        templatesData.forEach((t: any) => {
          console.log(`Template ${t.id}:`, {
            title: t.title,
            user: t.user,
            user_id: t.user_id,
            user_name: t.user?.name,
            images: {
              thumbnail: t.thumbnail_image,
              big_front: t.big_front_image,
              small_front: t.small_front_image,
              back: t.back_image
            }
          });
        });
        
        setTemplates(templatesData);
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch templates:', response.status, errorText);
        
        if (response.status === 403) {
          toast({ title: 'Access Denied', description: 'You don\'t have permission to view templates' });
        } else if (response.status === 401) {
          toast({ title: 'Authentication Error', description: 'Please log in again' });
        } else {
          toast({ title: 'Error', description: 'Failed to load templates' });
        }
      }
    } catch (error) {
      console.error("❌ Error fetching templates:", error);
      toast({ title: 'Error', description: 'Failed to load templates. Please check your connection.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Are you sure you want to approve this template?")) return;

    if (!token) {
      toast({ title: 'Error', description: 'You must be logged in to approve templates' });
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/admin/templates/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, status: 'APPROVED' } : t));
        toast({ title: 'Success', description: 'Template approved successfully' });
        fetchTemplates(); // Refresh the list
      } else {
        const errorText = await response.text();
        console.error('Failed to approve template:', response.status, errorText);
        toast({ title: 'Error', description: 'Failed to approve template' });
      }
    } catch (error) {
      console.error("Failed to approve template", error);
      toast({ title: 'Error', description: 'Failed to approve template' });
    }
  };

  const openRejectModal = (id: number) => {
    setSelectedTemplateId(id);
    setRejectModalOpen(true);
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`;
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!selectedTemplateId || !token) {
      toast({ title: 'Error', description: 'You must be logged in to reject templates' });
      return;
    }

    setIsProcessing(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/api/admin/templates/${selectedTemplateId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, status: 'REJECTED' } : t));
        setRejectModalOpen(false);
        setSelectedTemplateId(null);
        toast({ title: 'Success', description: 'Template rejected successfully' });
        fetchTemplates(); // Refresh the list
      } else {
        const errorText = await response.text();
        console.error('Failed to reject template:', response.status, errorText);
        toast({ title: 'Error', description: 'Failed to reject template' });
      }
    } catch (error) {
      console.error("Failed to reject template", error);
      toast({ title: 'Error', description: 'Failed to reject template' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter templates based on search locally
  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statuses = ["All", "Pending", "Approved", "Rejected"];

  // Template statistics
  const stats = {
    total: templates.length,
    approved: templates.filter(t => t.status === "APPROVED").length,
    pending: templates.filter(t => t.status === "PENDING").length,
    rejected: templates.filter(t => t.status === "REJECTED").length,
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
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-xs dark:text-gray-400">Date</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-end text-xs dark:text-gray-400">Actions</TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
                    <p className="mt-2">Loading templates...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-gray-500">No templates found.</TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        {template.thumbnail_image ? (
                          <img
                            src={getImageUrl(template.thumbnail_image)}
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
                      {template.user?.name || template.user?.email || `User ID: ${template.user_id || 'N/A'}`}
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
                          onClick={() => router.push(`/employee/templates/${template.id}/review`)}
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
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
    </div>
  );
}
