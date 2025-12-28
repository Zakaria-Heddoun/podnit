"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { AdminRejectModal } from "@/components/admin/AdminRejectModal";

export default function EmployeeTemplateReviewPage() {
    const router = useRouter();
    const params = useParams();
    const { token, hasPermission } = useAuth();
    const { toast } = useToast();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Check permission
    if (!hasPermission('approve_templates')) {
        return (
            <div className="p-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
                    <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        You don't have permission to review templates.
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (templateId && token) {
            loadTemplate();
        }
    }, [templateId, token]);

    const loadTemplate = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            console.log('🔍 Fetching template:', `${API_URL}/api/admin/templates/${templateId}`);
            
            const response = await fetch(
                `${API_URL}/api/admin/templates/${templateId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            console.log('📡 Template response status:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Failed to load template:', response.status, errorText);
                throw new Error(`Failed to load template: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Template API response:', data);
            
            const templateData = data.data || data.template || data;
            console.log('📦 Template data:', templateData);
            console.log('👤 User data:', templateData.user);
            console.log('🖼️ Images:', {
                thumbnail: templateData.thumbnail_image,
                big_front: templateData.big_front_image,
                small_front: templateData.small_front_image,
                back: templateData.back_image,
                left_sleeve: templateData.left_sleeve_image,
                right_sleeve: templateData.right_sleeve_image
            });
            
            setTemplate(templateData);
        } catch (error: any) {
            console.error('❌ Error loading template:', error);
            toast({ title: 'Error', description: error?.message || 'Failed to load template' });
        } finally {
            setIsLoading(false);
        }
    };

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`;
    };

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this template?')) return;

        if (!token) {
            toast({ title: 'Error', description: 'You must be logged in to approve templates' });
            return;
        }

        setIsProcessing(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${API_URL}/api/admin/templates/${templateId}/approve`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            if (response.ok) {
                toast({ title: 'Success', description: 'Template approved successfully' });
                router.push('/employee/templates');
            } else {
                const errorText = await response.text();
                console.error('Failed to approve template:', response.status, errorText);
                toast({ title: 'Error', description: 'Failed to approve template' });
            }
        } catch (error) {
            console.error('Error approving template:', error);
            toast({ title: 'Error', description: 'Failed to approve template' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        if (!token) {
            toast({ title: 'Error', description: 'You must be logged in to reject templates' });
            return;
        }

        setIsProcessing(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await fetch(
                `${API_URL}/api/admin/templates/${templateId}/reject`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                }
            );

            if (response.ok) {
                setRejectModalOpen(false);
                toast({ title: 'Success', description: 'Template rejected successfully' });
                router.push('/employee/templates');
            } else {
                const errorText = await response.text();
                console.error('Failed to reject template:', response.status, errorText);
                toast({ title: 'Error', description: 'Failed to reject template' });
            }
        } catch (error) {
            console.error('Error rejecting template:', error);
            toast({ title: 'Error', description: 'Failed to reject template' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = (imageUrl: string | null, sideName: string) => {
        if (!imageUrl) return;

        const link = document.createElement('a');
        link.download = `${template?.title || 'template'}-${sideName}.png`;
        link.href = imageUrl;
        link.click();
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

    const designSides = [
        { name: 'Big Front', key: 'big_front_image' },
        { name: 'Small Front', key: 'small_front_image' },
        { name: 'Back', key: 'back_image' },
        { name: 'Left Sleeve', key: 'left_sleeve_image' },
        { name: 'Right Sleeve', key: 'right_sleeve_image' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="border-b border-stroke bg-white px-6 py-4 dark:border-strokedark dark:bg-boxdark">
                <div className="mx-auto max-w-screen-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/employee/templates')}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Templates
                            </button>
                            <div className="border-l border-stroke dark:border-strokedark pl-4">
                                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Review Template: {template?.title}
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Seller: {template?.user?.name || template?.user?.email || `User ID: ${template?.user_id || 'Unknown'}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {template?.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                                        disabled={isProcessing}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectModalOpen(true)}
                                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                                        disabled={isProcessing}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Design Images Grid */}
            <div className="mx-auto max-w-screen-2xl p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {designSides.map((side) => {
                        const imageUrl = getImageUrl(template?.[side.key]);

                        if (!imageUrl) return null;

                        return (
                            <div
                                key={side.key}
                                className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-black dark:text-white">
                                        {side.name}
                                    </h3>
                                    <button
                                        onClick={() => handleDownload(imageUrl, side.key)}
                                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                                <div className="flex items-center justify-center rounded bg-gray-100 p-4 dark:bg-gray-800">
                                    <img
                                        src={imageUrl}
                                        alt={side.name}
                                        className="max-w-full h-auto rounded"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {designSides.every(side => !template?.[side.key]) && (
                    <div className="py-12 text-center text-gray-500">
                        No design images found for this template
                    </div>
                )}
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

