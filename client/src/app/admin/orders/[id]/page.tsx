"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import MockupView from '@/components/orders/MockupView';
import { getOrderStatusBadgeColor, isOrderShipped, isReturnStatus } from '@/lib/orderStatus';
import { getImageUrl } from '@/lib/utils';
import { renderDesignFromState, createCleanCompositeImage, proxyMockupUrl } from '@/lib/templateRender';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface OrderItem {
    id?: string;
    color: string;
    size: string;
    quantity: number;
    template_id?: number | string;
    product_id?: number | string;
    template?: {
        id: number;
        title: string;
        design_config?: any;
        product?: {
            id: number;
            name: string;
            mockups?: any;
            image_url?: string;
        };
    };
    product?: {
        id: number;
        name: string;
        mockups?: any;
        image_url?: string;
    };
}

interface OrderDetail {
    id: number;
    order_number: string;
    customer: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    user?: {
        id: number;
        name: string;
        email: string;
    };
    product: {
        id: number;
        name: string;
        category: string;
        image_url?: string;
        mockups?: any;
    };
    template?: {
        id: number;
        title: string;
        design_config?: any;
    };
    quantity: number;
    unit_price: number;
    selling_price?: number;
    total_amount: number;
    status: string;
    customization: {
        items?: OrderItem[];
        color?: string;
        size?: string;
        notes?: string;
        design_config?: any;
    };
    shipping_address: {
        street: string;
        city: string;
        postal_code: string;
        country: string;
    };
    created_at: string;
    updated_at: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    tracking_number?: string;
    allow_reshipping?: boolean;
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [shippingLoading, setShippingLoading] = useState(false);

    const [trackingData, setTrackingData] = useState<any[] | null>(null);
    const [shipConfirmOpen, setShipConfirmOpen] = useState(false);

    // Re-rendered design images per group (same fix as Admin Review Template)
    const [renderedImages, setRenderedImages] = useState<Record<string, Record<string, string>>>({});
    const [renderingImages, setRenderingImages] = useState(false);

    // Get design images from template/order
    // Generate unique groups of designs (grouping items by template or product)
    const designGroups = React.useMemo(() => {
        if (!order) return [];

        const groups: Record<string, {
            items: number[],
            designConfig: any,
            product: any,
            name: string
        }> = {};

        const items = order.customization?.items || [];

        if (items.length === 0) {
            // Fallback for old orders or orders without explicit items array
            const designConfig = order.customization?.design_config || order.template?.design_config;
            const groupKey = order.template?.id ? `template-${order.template.id}` : 'main';
            groups[groupKey] = {
                items: [0], // Dummy index
                designConfig: designConfig,
                product: order.product,
                name: order.template?.title || order.product?.name || 'Main Product'
            };
        } else {
            items.forEach((item: OrderItem, index: number) => {
                const templateId = item.template_id || item.template?.id;
                const productId = item.product_id || item.product?.id || order.product?.id;

                // Key to group by: Template ID if available, otherwise Product ID
                const groupKey = templateId ? `template-${templateId}` : `product-${productId}`;

                if (!groups[groupKey]) {
                    groups[groupKey] = {
                        items: [],
                        designConfig: item.template?.design_config || (index === 0 ? order.customization?.design_config || order.template?.design_config : null),
                        product: item.template?.product || item.product || (index === 0 ? order.product : null),
                        name: item.template?.title || item.template?.product?.name || item.product?.name || order.product?.name || `Product ${index + 1}`
                    };
                }
                groups[groupKey].items.push(index + 1);
            });
        }

        // Transform groups into a renderable list with pre-computed mockups and assets
        return Object.entries(groups).map(([id, group]) => {
            const mockups: {
                key: string;
                name: string;
                url: string | null;
                area?: any;
                backgroundUrl?: string | null;
                backgroundColor?: string;
                fabricState?: any;
                savedDimensions?: { width: number; height: number } | null;
            }[] = [];
            const assets: { url: string; type: string }[] = [];
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

            // 1. Process Mockups with design compositing (same fix as Admin Review Template)
            if (group.designConfig) {
                const config = typeof group.designConfig === 'string' ? JSON.parse(group.designConfig) : group.designConfig;
                const viewConfigs: Record<string, { name: string; area?: any; mockup?: string | null }> = {};
                (config?.views || []).forEach((view: any) => {
                    if (view?.key) {
                        viewConfigs[view.key] = {
                            name: view.name || view.key,
                            area: view.area || null,
                            mockup: view.mockup || null
                        };
                    }
                });

                // Include keys from both images and states (like Review Template)
                const imageKeys = Object.keys(config?.images || {});
                const stateKeys = Object.keys(config?.states || {});
                const allKeys = [...new Set([...imageKeys, ...stateKeys])].filter(k => {
                    const hasImage = config?.images?.[k];
                    const hasState = config?.states?.[k];
                    return hasImage || hasState;
                });

                for (const key of allKeys) {
                    const mockupFromConfig = viewConfigs[key]?.mockup;
                    const mockupFromProduct = group.product?.views?.find((v: any) => v.key === key)?.mockup;
                    const rawMockupUrl = mockupFromConfig || getImageUrl(mockupFromProduct || null);
                    const backgroundUrl = proxyMockupUrl(rawMockupUrl);

                    mockups.push({
                        key,
                        name: viewConfigs[key]?.name || key,
                        url: config?.images?.[key] ? getImageUrl(config.images[key]) : null,
                        area: viewConfigs[key]?.area || null,
                        backgroundUrl,
                        backgroundColor: config.color || '#ffffff',
                        fabricState: config?.states?.[key] || null,
                        savedDimensions: config?.viewDimensions?.[key] || null,
                    });
                }
            }

            // Fallback to product mockups if no design config images
            if (mockups.length === 0 && group.product?.mockups && typeof group.product.mockups === 'object') {
                Object.entries(group.product.mockups).forEach(([key, path]) => {
                    if (!path) return;
                    mockups.push({
                        key,
                        name: key.charAt(0).toUpperCase() + key.slice(1),
                        url: (path as string).startsWith('http') ? (path as string) : `${API_URL}${path}`
                    });
                });
            }

            // Final fallback to image_url
            if (mockups.length === 0 && group.product?.image_url) {
                mockups.push({
                    key: 'original',
                    name: 'Product Image',
                    url: group.product.image_url.startsWith('http') ? group.product.image_url : `${API_URL}${group.product.image_url}`
                });
            }

            // 2. Process Assets
            if (group.designConfig) {
                const config = typeof group.designConfig === 'string' ? JSON.parse(group.designConfig) : group.designConfig;

                // Global objects
                if (config.objects && Array.isArray(config.objects)) {
                    config.objects.forEach((obj: any) => {
                        if (obj.type === 'image' && obj.src) {
                            assets.push({
                                url: obj.src.startsWith('http') ? obj.src : `${API_URL}${obj.src}`,
                                type: 'image'
                            });
                        }
                    });
                }

                // Side-specific objects
                ['front', 'back', 'left', 'right', 'main'].forEach(side => {
                    if (config[side]?.objects) {
                        config[side].objects.forEach((obj: any) => {
                            if (obj.type === 'image' && obj.src) {
                                assets.push({
                                    url: obj.src.startsWith('http') ? obj.src : `${API_URL}${obj.src}`,
                                    type: 'image'
                                });
                            }
                        });
                    }
                });
            }

            return {
                id,
                name: group.name,
                itemNumbers: group.items,
                mockups,
                assets,
                templateId: id.startsWith('template-') ? id.replace('template-', '') : null
            };
        });
    }, [order]);

    // Re-render designs from fabric states (same fix as Admin Review Template)
    useEffect(() => {
        let cancelled = false;
        const groupsWithTemplates = designGroups.filter(g => g.templateId && g.mockups.length > 0);
        if (groupsWithTemplates.length === 0) {
            setRenderedImages({});
            return;
        }

        const renderAll = async () => {
            setRenderingImages(true);
            const results: Record<string, Record<string, string>> = {};
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            const token = localStorage.getItem('token');

            for (const group of groupsWithTemplates) {
                if (cancelled) break;
                results[group.id] = {};

                for (const side of group.mockups) {
                    if (cancelled) break;

                    // 1. Try re-render from fabric state
                    if (side.fabricState) {
                        try {
                            const dataUrl = await renderDesignFromState(
                                side.fabricState,
                                side.area || { x: 28, y: 28, width: 44, height: 60 },
                                side.backgroundUrl,
                                side.savedDimensions || null
                            );
                            if (dataUrl) {
                                results[group.id][side.key] = dataUrl;
                                continue;
                            }
                        } catch (err) {
                            console.warn(`Failed to render ${side.key} from state:`, err);
                        }
                    }

                    // 2. Fallback: fetch from server download endpoint
                    if (side.url) {
                        try {
                            const downloadUrl = `${API_URL}/api/admin/templates/${group.templateId}/download/${side.key}`;
                            const res = await fetch(downloadUrl, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (res.ok) {
                                const blob = await res.blob();
                                results[group.id][side.key] = URL.createObjectURL(blob);
                            }
                        } catch {
                            // skip
                        }
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
    }, [designGroups]);

    const handleDownloadSingleImage = async (
        templateId: string,
        imageKey: string,
        sideName: string,
        side: { area?: any; backgroundUrl?: string | null; backgroundColor?: string },
        groupId: string
    ) => {
        if (!templateId) return;

        try {
            const designUrl = renderedImages[groupId]?.[imageKey];
            if (!designUrl) {
                toast.error('Design image not available');
                return;
            }

            const compositeBlob = await createCleanCompositeImage(
                designUrl,
                side.backgroundUrl,
                side.area || null,
                side.backgroundColor || '#ffffff'
            );

            if (!compositeBlob) {
                toast.error('Failed to create composite image');
                return;
            }

            const url = window.URL.createObjectURL(compositeBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${order?.order_number}-${sideName}-mockup.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download image.');
        }
    };

    const handleDownloadAllImages = async (groupId: string, templateId: string, designName: string, mockups: any[]) => {
        if (!templateId || mockups.length === 0) return;

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const compositesFolder = zip.folder('composites');
            const designsFolder = zip.folder('designs');

            for (const side of mockups) {
                if (!side.key) continue;

                const designUrl = renderedImages[groupId]?.[side.key];
                if (!designUrl) continue;

                try {
                    // Add raw design
                    const designRes = await fetch(designUrl);
                    if (designRes.ok) {
                        const designBlob = await designRes.blob();
                        designsFolder?.file(`${order?.order_number}-${designName}-${side.name}-design.png`, designBlob);
                    }

                    // Create and add composite
                    const compositeBlob = await createCleanCompositeImage(
                        designUrl,
                        side.backgroundUrl,
                        side.area || null,
                        side.backgroundColor || '#ffffff'
                    );
                    if (compositeBlob) {
                        compositesFolder?.file(`${order?.order_number}-${designName}-${side.name}-composite.png`, compositeBlob);
                    }
                } catch (error) {
                    console.error(`Failed to add ${side.key} to zip:`, error);
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
            link.download = `${order?.order_number}-${designName}-all-views.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Zip download failed:', error);
            toast.error('Failed to download zip file.');
        }
    };

    // Fetch tracking info if available
    useEffect(() => {
        if (!order?.tracking_number) return;

        const fetchTracking = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/api/admin/orders/${order.id}/track`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.data && json.data.data) {
                        setTrackingData(json.data.data);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch tracking details", err);
            }
        };
        fetchTracking();
    }, [order?.tracking_number, order?.id]);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            setLoading(true);

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
                const token = localStorage.getItem('token');

                const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.data) {
                        setOrder(result.data);
                        setLoading(false);
                        return;
                    }
                } else if (response.status === 404) {
                    router.push('/admin/orders');
                    return;
                } else {
                    const errorText = await response.text();
                    console.error('API Error:', response.status, errorText);
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
                setLoading(false);
                return;
            }

            setLoading(false);
        };

        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId, router]);

    const handleShipOrderClick = () => {
        setShipConfirmOpen(true);
    };

    const handleShipOrderConfirm = async () => {
        if (!order) return;
        setShipConfirmOpen(false);
        setShippingLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/ship`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ note: '' })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(`Order shipped successfully! Tracking Code: ${result.data?.code_shippment || 'N/A'}`);
                // Update local state
                setOrder(prev => prev ? ({
                    ...prev,
                    status: 'PRINTED',
                    // tracking_number: result.data?.code_shippment // Add to types if needed, but status update is key
                }) : null);
            } else {
                // Better error message parsing
                let errorMsg = 'Shipping Failed: ';
                
                // Try to parse the shipping API error from the message
                if (result.message && result.message.includes('Shipping API returned unexpected status:')) {
                    try {
                        const jsonMatch = result.message.match(/\{[^}]+\}/);
                        if (jsonMatch) {
                            const apiError = JSON.parse(jsonMatch[0]);
                            errorMsg += apiError.error || result.message;
                        } else {
                            errorMsg += result.message;
                        }
                    } catch (e) {
                        errorMsg += result.message;
                    }
                } else {
                    errorMsg += result.error || result.message || 'Unknown error';
                }
                
                toast.error(errorMsg);
                console.error('Shipping error:', result);
            }
        } catch (error) {
            console.error('Error shipping order:', error);
            toast.error('An error occurred while shipping the order.');
        } finally {
            setShippingLoading(false);
        }
    };

    const handleToggleReshipping = async () => {
        if (!order) return;
        setLoading(true); // Using main loading state or create a new one
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/toggle-reshipping`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                setOrder(prev => prev ? ({ ...prev, allow_reshipping: result.data.allow_reshipping }) : null);
                // Optional: Toast notification
            } else {
                toast.error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating reshipping status:', error);
            toast.error('Error updating status');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = getOrderStatusBadgeColor;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Order Not Found</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    The order you're looking for could not be found or there was an error loading the data.
                </p>
                <Button onClick={() => router.back()} variant="outline">
                    Go Back
                </Button>
            </div>
        );
    }

    // Get items from customization (new structure) or create from old structure
    const orderItems: OrderItem[] = order.customization?.items || [
        {
            color: order.customization?.color || 'N/A',
            size: order.customization?.size || 'N/A',
            quantity: order.quantity || 1
        }
    ];

    return (
        <div className="mx-auto max-w-4xl space-y-6">
            {/* Header */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-semibold text-black dark:text-white">
                            Order Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {order.order_number}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge size="md" color={getStatusColor(order.status)}>
                            {order.status}
                        </Badge>
                        {/* Reorder Approval Button - Only for returned orders */}
                        {isReturnStatus(order.status) && (
                            <button
                                onClick={handleToggleReshipping}
                                disabled={loading}
                                className={`text-xs px-2 py-1 rounded transition-colors ${order.allow_reshipping
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                    }`}
                            >
                                {order.allow_reshipping ? 'Disable Reordering' : 'Enable Reordering'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Design & Mockup Groups */}
            <div className="space-y-6">
                {designGroups.map((group, gIndex) => (
                    <div key={group.id} className="space-y-6 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <div className="h-0.5 flex-grow bg-gray-200 dark:bg-gray-700"></div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white px-4 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                                {group.name} {group.itemNumbers.length > 0 && group.itemNumbers[0] !== 0 && `(Items: ${group.itemNumbers.join(', ')})`}
                            </h2>
                            <div className="h-0.5 flex-grow bg-gray-200 dark:bg-gray-700"></div>
                        </div>

                        {/* Template Views / Product Mockups - Only show for template-based orders */}
                        {group.templateId && group.mockups.length > 0 && (
                            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-black dark:text-white">Product Mockups (Placement)</h3>
                                    <div className="flex items-center gap-3">
                                        {renderingImages && (
                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                                                Re-rendering designs...
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleDownloadAllImages(group.id, group.templateId!, group.name, group.mockups)}
                                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                                            disabled={renderingImages}
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download All Views
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {group.mockups.map((side: any) => (
                                        <div key={side.key} className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => handleDownloadSingleImage(group.templateId!, side.key, side.name, side, group.id)}
                                                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors ml-auto disabled:opacity-50"
                                                    disabled={!renderedImages[group.id]?.[side.key]}
                                                >
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                    Download
                                                </button>
                                            </div>
                                            {renderingImages && !renderedImages[group.id]?.[side.key] ? (
                                                <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded">
                                                    <div className="text-center">
                                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-2"></div>
                                                        <p className="text-sm text-gray-500">Rendering design...</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <MockupView
                                                    imageUrl={renderedImages[group.id]?.[side.key] ?? side.url}
                                                    viewName={side.name}
                                                    area={side.area}
                                                    backgroundUrl={side.backgroundUrl}
                                                    backgroundColor={side.backgroundColor}
                                                    allowDebug={false}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seller Design Assets */}
                        {group.assets.length > 0 && (
                            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Seller Design Assets</h3>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
                                    {group.assets.map((asset, index) => (
                                        <div key={index} className="group relative rounded-lg border border-stroke bg-gray-50 p-2 dark:border-strokedark dark:bg-gray-800">
                                            <div className="aspect-square flex items-center justify-center overflow-hidden rounded bg-white dark:bg-gray-700">
                                                <img
                                                    src={asset.url}
                                                    alt={`Design asset ${index + 1}`}
                                                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                                                />
                                            </div>
                                            <div className="mt-2 text-center">
                                                <span className="text-xs text-gray-500 uppercase font-medium">Asset {index + 1}</span>
                                            </div>
                                            <a
                                                href={asset.url}
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                                            >
                                                <span className="bg-white text-black px-3 py-1 rounded text-xs font-bold">View Full</span>
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Order Information</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Order Number:</span>
                            <span className="font-medium text-black dark:text-white">{order.order_number}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Product:</span>
                            <span className="font-medium text-black dark:text-white">{order.product.name}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Category:</span>
                            <span className="font-medium text-black dark:text-white">{order.product.category}</span>
                        </div>

                        {order.template && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Template:</span>
                                <span className="font-medium text-black dark:text-white">{order.template.title}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
                            <span className="font-medium text-black dark:text-white">{order.quantity}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Base Cost per Unit:</span>
                            <span className="font-medium text-black dark:text-white">{Number(order.unit_price).toFixed(2)} DH</span>
                        </div>

                        {order.selling_price && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Selling Price per Unit:</span>
                                <span className="font-medium text-blue-600">{Number(order.selling_price).toFixed(2)} DH</span>
                            </div>
                        )}

                        {order.selling_price && (
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Profit per Unit:</span>
                                <span className="font-medium text-green-600">
                                    +{(Number(order.selling_price) - Number(order.unit_price)).toFixed(2)} DH
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between border-t pt-3">
                            <span className="text-lg font-semibold text-black dark:text-white">Total:</span>
                            <span className="text-lg font-bold text-blue-600">{Number(order.total_amount).toFixed(2)} DH</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Order Date:</span>
                            <span className="font-medium text-black dark:text-white">
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Seller Information */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Seller Information</h3>

                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Name:</span>
                            <span className="font-medium text-black dark:text-white">{order.user?.name || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Email:</span>
                            <span className="font-medium text-black dark:text-white">{order.user?.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Customer Information */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Customer Information</h3>

                    <div className="space-y-3">
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Name:</span>
                            <span className="font-medium text-black dark:text-white">{order.customer?.name || order.customer_name || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Email:</span>
                            <span className="font-medium text-black dark:text-white">{order.customer?.email || order.customer_email || 'N/A'}</span>
                        </div>

                        <div>
                            <span className="text-gray-600 dark:text-gray-400 block">Phone:</span>
                            <span className="font-medium text-black dark:text-white">{order.customer?.phone || order.customer_phone || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Order Items</h3>

                    <div className="space-y-4">
                        {orderItems.map((item, index) => (
                            <div key={item.id || index} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/40">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-black dark:text-white">
                                        Item #{index + 1}
                                    </h4>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Qty: {item.quantity}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-600 dark:text-gray-400">Color:</span>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="font-medium text-black dark:text-white">{item.color}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-gray-600 dark:text-gray-400">Size: </span>
                                        <span className="font-medium text-black dark:text-white">{item.size}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {order.customization?.notes && (
                            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400 block mb-1">Notes:</span>
                                <span className="font-medium text-black dark:text-white">{order.customization.notes}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Shipping Address</h3>

                <div className="space-y-2">
                    <p className="text-black dark:text-white">{order.shipping_address.street}</p>
                    <p className="text-black dark:text-white">
                        {order.shipping_address.city}, {order.shipping_address.postal_code}
                    </p>
                    <p className="text-black dark:text-white">{order.shipping_address.country}</p>
                </div>
            </div>

            <ConfirmDialog
                open={shipConfirmOpen}
                onClose={() => setShipConfirmOpen(false)}
                onConfirm={handleShipOrderConfirm}
                title="Ship Order"
                message="Are you sure you want to create a parcel in EliteSpeed for this order?"
                confirmLabel="Ship"
                cancelLabel="Cancel"
                isLoading={shippingLoading}
            />

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Back to Orders
                </Button>
                <Button
                    onClick={handleShipOrderClick}
                    disabled={shippingLoading || isOrderShipped(order.status)}
                    className={`${isOrderShipped(order.status)
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                >
                    {shippingLoading ? 'Shipping...' : (
                        isOrderShipped(order.status)
                            ? (order.tracking_number ? `Shipped (${order.tracking_number})` : 'Order Shipped')
                            : 'Ship & Print Label'
                    )}
                </Button>
            </div>
        </div>
    );
}

