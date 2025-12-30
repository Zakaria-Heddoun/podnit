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

    const designConfig = React.useMemo(() => {
        if (!template?.design_config) return null;
        if (typeof template.design_config === 'string') {
            try {
                return JSON.parse(template.design_config);
            } catch {
                return null;
            }
        }
        return template.design_config;
    }, [template]);

    const designImages = React.useMemo(() => {
        const images: { key: string; name: string; url: string | null }[] = [];
        if (!designConfig?.images) return images;

        const viewNames: Record<string, string> = {};
        (designConfig.views || []).forEach((view: any) => {
            if (view?.key) {
                viewNames[view.key] = view.name || view.key;
            }
        });

        Object.entries(designConfig.images).forEach(([key, value]) => {
            if (!value) return;
            images.push({
                key,
                name: viewNames[key] || key,
                url: getImageUrl(value as string)
            });
        });

        return images;
    }, [designConfig]);

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

   const handleDownload = async (imageKey: string, sideName: string) => {
    try {
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        console.log('Download params:', { imageKey, sideName, templateId });
        const downloadUrl = `${API_URL}/api/admin/templates/${templateId}/download/${imageKey}`;
        console.log('Fetching from:', downloadUrl);
        
        // Fetch image through authenticated API endpoint
        const response = await fetch(downloadUrl, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Failed to fetch image');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template?.title || 'template'}-${sideName}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Download failed:', error);
        alert('Failed to download image. The image may not be accessible.');
    }
};

const handleDownloadAll = async () => {
    if (designImages.length === 0) return;

    try {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        const templateName = template?.title || 'template';
        const token = localStorage.getItem('token');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        // Fetch all images through authenticated API endpoint
        for (const side of designImages) {
            if (!side.key) continue;
            
            try {
                const response = await fetch(`${API_URL}/api/admin/templates/${templateId}/download/${side.key}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    console.error(`Failed to fetch ${side.key}:`, response.status);
                    continue;
                }

                const blob = await response.blob();
                zip.file(`${templateName}-${side.key}.png`, blob);
                
            } catch (error) {
                console.error(`Failed to add ${side.key} to zip:`, error);
                // Continue with other images even if one fails
            }
        }

        // Check if we have any files in the zip
        const files = Object.keys(zip.files);
        if (files.length === 0) {
            alert('No images could be added to the zip file. Please check if images are accessible.');
            return;
        }

        // Generate and download the zip
        const content = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${templateName}-all-views.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Zip download failed:', error);
        alert('Failed to download zip file. Please try downloading images individually.');
    }
};

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            </div>
        );
    }

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
                {designImages.length > 0 && (
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={handleDownloadAll}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download All as ZIP
                        </button>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {designImages.map((side) => {
                        const imageUrl = side.url;

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
                                        onClick={() => handleDownload(side.key, side.name)}
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

                {designImages.length === 0 && (
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
