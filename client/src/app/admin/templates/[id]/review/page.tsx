"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AdminRejectModal } from "@/components/admin/AdminRejectModal";
import MockupView from "@/components/orders/MockupView";
import { getImageUrl } from "@/lib/utils";
import { renderDesignFromState, createCleanCompositeImage, proxyMockupUrl } from "@/lib/templateRender";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function TemplateReviewPage() {
    const router = useRouter();
    const params = useParams();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Re-rendered design images from fabric states
    const [renderedImages, setRenderedImages] = useState<Record<string, string>>({});
    const [renderingImages, setRenderingImages] = useState(false);
    const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

    useEffect(() => {
        if (templateId) {
            loadTemplate();
        }
    }, [templateId]);

    const loadTemplate = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${templateId}?include=product`,
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
            toast.error('Failed to load template');
        } finally {
            setIsLoading(false);
        }
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

    // Build per-view data from the design config
    const designViews = React.useMemo(() => {
        const result: {
            key: string;
            name: string;
            area: { x: number; y: number; width: number; height: number } | null;
            backgroundUrl: string | null;
            fabricState: string | null;
            savedDimensions: { width: number; height: number } | null;
            override: any;
            fallbackImageUrl: string | null;
        }[] = [];

        if (!designConfig) return result;

        const viewConfigs: Record<string, { name: string; area?: any; mockup?: string | null }> = {};
        (designConfig.views || []).forEach((view: any) => {
            if (view?.key) {
                viewConfigs[view.key] = {
                    name: view.name || view.key,
                    area: view.area || null,
                    mockup: view.mockup || null
                };
            }
        });

        // Determine which views have content (from images or states)
        const imageKeys = Object.keys(designConfig.images || {});
        const stateKeys = Object.keys(designConfig.states || {});
        const allKeys = [...new Set([...imageKeys, ...stateKeys])].filter(k => {
            // Include if has a non-null image or non-empty state
            const hasImage = designConfig.images?.[k];
            const hasState = designConfig.states?.[k];
            return hasImage || hasState;
        });

        for (const key of allKeys) {
            const mockupFromConfig = viewConfigs[key]?.mockup;
            const mockupFromProduct = template?.product?.views?.find((v: any) => v.key === key)?.mockup;
            const rawMockupUrl = mockupFromConfig || getImageUrl(mockupFromProduct || null);
            const backgroundUrl = proxyMockupUrl(rawMockupUrl);

            result.push({
                key,
                name: viewConfigs[key]?.name || key,
                area: viewConfigs[key]?.area || null,
                backgroundUrl,
                fabricState: designConfig.states?.[key] || null,
                savedDimensions: designConfig.viewDimensions?.[key] || null,
                override: designConfig.overrides?.[key] ?? null,
                fallbackImageUrl: designConfig.images?.[key] ? getImageUrl(designConfig.images[key]) : null,
            });
        }

        return result;
    }, [designConfig, template]);

    // Re-render designs from fabric states
    useEffect(() => {
        let cancelled = false;

        const renderAll = async () => {
            if (designViews.length === 0) {
                setRenderedImages({});
                return;
            }

            setRenderingImages(true);
            const results: Record<string, string> = {};

            for (const view of designViews) {
                if (cancelled) break;

                if (view.fabricState) {
                    try {
                        const dataUrl = await renderDesignFromState(
                            view.fabricState,
                            view.area || { x: 28, y: 28, width: 44, height: 60 },
                            view.backgroundUrl,
                            view.savedDimensions
                        );
                        if (dataUrl) {
                            results[view.key] = dataUrl;
                            continue;
                        }
                    } catch (err) {
                        console.warn(`Failed to render ${view.key} from state, falling back to image:`, err);
                    }
                }

                // Fallback: try to download the pre-exported image from the server
                if (view.fallbackImageUrl) {
                    try {
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
                        const downloadUrl = `${API_URL}/api/admin/templates/${templateId}/download/${view.key}`;
                        const token = localStorage.getItem('token');
                        const res = await fetch(downloadUrl, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const blob = await res.blob();
                            results[view.key] = URL.createObjectURL(blob);
                        }
                    } catch {
                        // skip
                    }
                }
            }

            if (!cancelled) {
                setRenderedImages(results);
                setRenderingImages(false);
            }
        };

        renderAll();
        return () => { cancelled = true; };
    }, [designViews, templateId]);

    const handleApproveClick = () => {
        setApproveConfirmOpen(true);
    };

    const handleApproveConfirm = async () => {
        setApproveConfirmOpen(false);
        setIsProcessing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${templateId}/approve`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.ok) {
                toast.success('Template approved successfully');
                router.push('/admin/templates');
            } else {
                toast.error('Failed to approve template');
            }
        } catch (error) {
            console.error('Error approving template:', error);
            toast.error('Failed to approve template');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConfirm = async (reason: string) => {
        setIsProcessing(true);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com'}/api/admin/templates/${templateId}/reject`,
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
                toast.success('Template rejected');
                router.push('/admin/templates');
            }
        } catch (error) {
            console.error('Error rejecting template:', error);
            toast.error('Failed to reject template');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownload = async (view: typeof designViews[0]) => {
        try {
            const designUrl = renderedImages[view.key];
            if (!designUrl) {
                toast.error('Design image not available');
                return;
            }

            const compositeBlob = await createCleanCompositeImage(
                designUrl,
                view.backgroundUrl,
                view.area,
                designConfig?.color || '#ffffff'
            );

            if (!compositeBlob) {
                toast.error('Failed to create composite image');
                return;
            }

            const url = window.URL.createObjectURL(compositeBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${template?.title || 'template'}-${view.name}-mockup.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download image.');
        }
    };

    const handleDownloadAll = async () => {
        if (designViews.length === 0) return;

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const templateName = template?.title || 'template';

            const compositesFolder = zip.folder('composites');
            const designsFolder = zip.folder('designs');

            for (const view of designViews) {
                const designUrl = renderedImages[view.key];
                if (!designUrl) continue;

                try {
                    // Add raw design
                    const designRes = await fetch(designUrl);
                    if (designRes.ok) {
                        const designBlob = await designRes.blob();
                        designsFolder?.file(`${templateName}-${view.name}-design.png`, designBlob);
                    }

                    // Create and add composite
                    const compositeBlob = await createCleanCompositeImage(
                        designUrl,
                        view.backgroundUrl,
                        view.area,
                        designConfig?.color || '#ffffff'
                    );
                    if (compositeBlob) {
                        compositesFolder?.file(`${templateName}-${view.name}-composite.png`, compositeBlob);
                    }
                } catch (error) {
                    console.error(`Failed to process ${view.key}:`, error);
                }
            }

            const files = Object.keys(zip.files);
            if (files.length === 0) {
                toast.error('No images could be added to the zip file.');
                return;
            }

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
            toast.error('Failed to download zip file. Please try downloading images individually.');
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
                                        onClick={handleApproveClick}
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
                {designViews.length > 0 && (
                    <div className="mb-4 flex justify-end gap-3">
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

                {renderingImages && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                        Re-rendering designs from saved states...
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {designViews.map((view) => (
                        <div key={view.key} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => handleDownload(view)}
                                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors ml-auto"
                                    disabled={!renderedImages[view.key]}
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download
                                </button>
                            </div>
                            {renderingImages && !renderedImages[view.key] ? (
                                <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded">
                                    <div className="text-center">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-2"></div>
                                        <p className="text-sm text-gray-500">Rendering design...</p>
                                    </div>
                                </div>
                            ) : (
                                <MockupView
                                    imageUrl={renderedImages[view.key] ?? null}
                                    backgroundUrl={view.backgroundUrl}
                                    viewName={view.name}
                                    backgroundColor={designConfig?.color}
                                    area={view.area}
                                    templateId={templateId}
                                    viewKey={view.key}
                                    savedOverride={view.override}
                                    allowDebug={false}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {designViews.length === 0 && (
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

            <ConfirmDialog
                open={approveConfirmOpen}
                onClose={() => setApproveConfirmOpen(false)}
                onConfirm={handleApproveConfirm}
                title="Approve Template"
                message="Are you sure you want to approve this template?"
                confirmLabel="Approve"
                cancelLabel="Cancel"
                isLoading={isProcessing}
            />
        </div>
    );
}
