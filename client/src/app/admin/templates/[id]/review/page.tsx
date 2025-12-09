"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminRejectModal } from "@/components/admin/AdminRejectModal";

export default function TemplateReviewPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (templateId) {
            loadTemplate();
        }
    }, [templateId]);

    const loadTemplate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/templates/${templateId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (!response.ok) throw new Error('Failed to load template');

            const data = await response.json();
            setTemplate(data.data || data.template);
        } catch (error) {
            console.error('Error loading template:', error);
            alert('Failed to load template');
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

        setIsProcessing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/templates/${templateId}/approve`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                alert('Template approved successfully');
                router.push('/admin/templates');
            }
        } catch (error) {
            console.error('Error approving template:', error);
            alert('Failed to approve template');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/templates/${templateId}/reject`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                }
            );

            if (response.ok) {
                setRejectModalOpen(false);
                alert('Template rejected');
                router.push('/admin/templates');
            }
        } catch (error) {
            console.error('Error rejecting template:', error);
            alert('Failed to reject template');
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
                                onClick={() => router.push('/admin/templates')}
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
                                    Seller: {template?.user?.name || 'Unknown'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {template?.status === 'PENDING' && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors"
                                        disabled={isProcessing}
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => setRejectModalOpen(true)}
                                        className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors"
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
