"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import MockupView from '@/components/orders/MockupView';
import { getOrderStatusBadgeColor } from '@/lib/orderStatus';
import { getImageUrl } from '@/lib/utils';
import { renderDesignFromState, proxyMockupUrl } from '@/lib/templateRender';

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

export default function SellerOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAdmin } = useAuth();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Re-rendered design images per group (same fix as Admin Review Template)
    const [renderedImages, setRenderedImages] = useState<Record<string, Record<string, string>>>({});
    const [renderingImages, setRenderingImages] = useState(false);

    // Generate unique groups of designs (grouping items by template or product)
    const designGroups = React.useMemo(() => {
        if (!order) return [];

        const groups: Record<string, {
            items: number[],
            designConfig: any,
            product: any,
            name: string,
            templateId?: string | number
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
                name: order.template?.title || order.product?.name || 'Main Product',
                templateId: order.template?.id
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
                        name: item.template?.title || item.template?.product?.name || item.product?.name || order.product?.name || `Product ${index + 1}`,
                        templateId: templateId
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
                templateId: group.templateId || (id.startsWith('template-') ? id.replace('template-', '') : null)
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

                    // 2. Fallback: fetch from server download endpoint (seller route)
                    if (side.url) {
                        try {
                            const downloadUrl = `${API_URL}/api/templates/${group.templateId}/download/${side.key}`;
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

    const fetchOrderDetails = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/seller/orders/${orderId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success || result.data) {
                    setOrder(result.data);
                }
            } else {
                console.error('Failed to fetch order');
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const getStatusColor = getOrderStatusBadgeColor;

    const handleToggleReshipping = async () => {
        if (!isAdmin) return;

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            const token = localStorage.getItem('token');

            const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/toggle-reshipping`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setOrder(prev => prev ? { ...prev, allow_reshipping: result.allow_reshipping } : null);
                toast.success(result.message);
            } else {
                toast.error('Failed to update reshipping permission');
            }
        } catch (error) {
            console.error('Error toggling reshipping:', error);
            toast.error('An error occurred');
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="p-6">
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Order Not Found</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
                    </p>
                    <Button onClick={() => router.push('/seller/orders')} variant="outline">
                        Back to Orders
                    </Button>
                </div>
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
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        Order #{order.order_number}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge color={getStatusColor(order.status)}>
                        {order.status}
                    </Badge>
                    <Button onClick={() => router.push('/seller/orders')} variant="outline">
                        Back to Orders
                    </Button>
                </div>
            </div>

            {order.allow_reshipping === false && (
                <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Reshipping Restricted</h3>
                            <p className="mt-1 text-sm text-red-700">
                                This order has been flagged for return and cannot be reshipped by the seller.
                                {isAdmin && " As an administrator, you can override this restriction below."}
                            </p>
                            {isAdmin && (
                                <Button
                                    onClick={handleToggleReshipping}
                                    className="mt-2 text-xs py-1 h-8 bg-red-600 hover:bg-red-700"
                                >
                                    Allow Reshipping
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {order.allow_reshipping === true && isAdmin && order.status.toLowerCase().includes('retour') && (
                <div className="mb-6 rounded-md bg-blue-50 p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex">
                            <svg className="h-5 w-5 text-blue-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-blue-700">
                                Reshipping is currently allowed for this return order.
                            </p>
                        </div>
                        <Button
                            onClick={handleToggleReshipping}
                            variant="outline"
                            className="text-xs py-1 h-8 border-blue-400 text-blue-700"
                        >
                            Restrict Reshipping
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Information */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                            Product Information
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Product</span>
                                <span className="font-medium text-black dark:text-white">{order.product.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Category</span>
                                <span className="font-medium text-black dark:text-white">{order.product.category}</span>
                            </div>
                            {order.template && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Template</span>
                                    <span className="font-medium text-black dark:text-white">{order.template.title}</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                                <span className="text-gray-600 dark:text-gray-400">Total Quantity</span>
                                <span className="font-medium text-black dark:text-white">{order.quantity}</span>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                            Order Items
                        </h3>
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
                        </div>
                    </div>

                    {/* Design & Mockup Groups */}
                    <div className="space-y-6">
                        {designGroups.map((group, gIndex) => (
                            <div key={group.id} className="space-y-6 animate-fade-in shadow-sm rounded-lg border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                        {group.name} {group.itemNumbers.length > 0 && group.itemNumbers[0] !== 0 && `(Items: ${group.itemNumbers.join(', ')})`}
                                    </h2>
                                    <div className="h-0.5 flex-grow bg-gray-100 dark:bg-gray-800"></div>
                                </div>

                                {/* Template Views / Product Mockups */}
                                {group.mockups.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-semibold text-black dark:text-white">Product Mockups (Placement)</h3>
                                            {renderingImages && (
                                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600"></div>
                                                    Re-rendering designs...
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {group.mockups.map((side) => (
                                                <div key={side.key}>
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
                                                            backgroundUrl={side.backgroundUrl}
                                                            viewName={side.name}
                                                            backgroundColor={side.backgroundColor}
                                                            area={side.area}
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
                                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Your Design Assets</h3>
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

                    {/* Shipping Address */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                            Shipping Address
                        </h3>
                        <div className="space-y-1 text-gray-700 dark:text-gray-300">
                            <p>{order.shipping_address.street}</p>
                            <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
                            <p>{order.shipping_address.country}</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Customer & Payment */}
                <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                            Customer Information
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                                <p className="font-medium text-black dark:text-white">
                                    {order.customer?.name || order.customer_name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                                <p className="font-medium text-black dark:text-white">
                                    {order.customer?.email || order.customer_email || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                                <p className="font-medium text-black dark:text-white">
                                    {order.customer?.phone || order.customer_phone || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                        <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                            Payment Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Unit Price</span>
                                <span className="font-medium text-black dark:text-white">
                                    {Number(order.unit_price || 0).toFixed(2)} DH
                                </span>
                            </div>
                            {order.selling_price && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Selling Price</span>
                                    <span className="font-medium text-black dark:text-white">
                                        {Number(order.selling_price || 0).toFixed(2)} DH
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Quantity</span>
                                <span className="font-medium text-black dark:text-white">
                                    × {order.quantity}
                                </span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                                <span className="font-semibold text-black dark:text-white">Total</span>
                                <span className="font-bold text-black dark:text-white">
                                    {Number(order.total_amount || 0).toFixed(2)} DH
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Tracking Information */}
                    {order.tracking_number && (
                        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                            <h3 className="mb-4 text-lg font-semibold text-black dark:text-white">
                                Tracking Information
                            </h3>
                            <div className="space-y-2">
                                <p className="text-xs text-gray-600 dark:text-gray-400">Tracking Number</p>
                                <p className="font-mono font-medium text-black dark:text-white">
                                    {order.tracking_number}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
