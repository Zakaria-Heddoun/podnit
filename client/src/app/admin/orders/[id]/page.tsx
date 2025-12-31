"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Badge from '@/components/ui/badge/Badge';

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
        color: string;
        size: string;
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
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [shippingLoading, setShippingLoading] = useState(false);

    const [trackingData, setTrackingData] = useState<any[] | null>(null);

    // Get design images from template/order
    const designImages = React.useMemo(() => {
        const images: { key: string; name: string; url: string | null }[] = [];
        if (!order?.template) return images;

        // Get design_config from customization first (order data), then template
        const designConfig = order.customization?.design_config || order.template?.design_config;
        if (!designConfig) return images;

        const config = typeof designConfig === 'string' ? JSON.parse(designConfig) : designConfig;
        if (!config?.images) return images;

        const viewNames: Record<string, string> = {};
        (config.views || []).forEach((view: any) => {
            if (view?.key) {
                viewNames[view.key] = view.name || view.key;
            }
        });

        Object.entries(config.images).forEach(([key, value]) => {
            if (!value) return;
            const path = value as string;
            const imageUrl = path.startsWith('http') 
                ? path 
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${path}`;
            images.push({
                key,
                name: viewNames[key] || key,
                url: imageUrl
            });
        });

        return images;
    }, [order]);

    const handleDownloadSingleImage = async (imageKey: string, sideName: string) => {
        if (!order?.template) return;
        
        try {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            
            const downloadUrl = `${API_URL}/api/admin/templates/${order.template.id}/download/${imageKey}`;
            
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
            link.download = `${order.order_number}-${sideName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image.');
        }
    };

    const handleDownloadAllImages = async () => {
        if (!order?.template || designImages.length === 0) return;

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            for (const side of designImages) {
                if (!side.key) continue;
                
                try {
                    const response = await fetch(`${API_URL}/api/admin/templates/${order.template.id}/download/${side.key}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        console.error(`Failed to fetch ${side.key}:`, response.status);
                        continue;
                    }

                    const blob = await response.blob();
                    zip.file(`${order.order_number}-${side.name}.png`, blob);
                    
                } catch (error) {
                    console.error(`Failed to add ${side.key} to zip:`, error);
                }
            }

            const files = Object.keys(zip.files);
            if (files.length === 0) {
                alert('No images could be added to the zip file.');
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });
            const url = window.URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${order.order_number}-all-views.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Zip download failed:', error);
            alert('Failed to download zip file.');
        }
    };

    // Fetch tracking info if available
    useEffect(() => {
        if (!order?.tracking_number) return;

        const fetchTracking = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const token = localStorage.getItem('token');

                const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Order Detail API Response:', result);
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

    const handleShipOrder = async () => {
        if (!order) return;
        if (!confirm('Are you sure you want to create a parcel in EliteSpeed for this order?')) return;

        setShippingLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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
                alert(`Order shipped successfully! Tracking Code: ${result.data?.code_shippment || 'N/A'}`);
                // Update local state
                setOrder(prev => prev ? ({
                    ...prev,
                    status: 'PRINTED',
                    // tracking_number: result.data?.code_shippment // Add to types if needed, but status update is key
                }) : null);
            } else {
                alert('Shipping Failed: ' + (result.error || result.message || 'Unknown error'));
                console.error('Shipping error:', result);
            }
        } catch (error) {
            console.error('Error shipping order:', error);
            alert('An error occurred while shipping the order.');
        } finally {
            setShippingLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'PRINTED': return 'info';
            case 'DELIVERING': return 'info';
            case 'SHIPPED': return 'success';
            case 'PAID': return 'success';
            case 'CANCELLED': return 'error';
            case 'RETURNED': return 'error';
            default: return 'light';
        }
    };

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
                    <Badge size="md" color={getStatusColor(order.status)}>
                        {order.status}
                    </Badge>
                </div>
            </div>

            {/* Template Views - Only show if order is from template */}
            {order.template && designImages.length > 0 && (
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-black dark:text-white">Template Design Views</h3>
                        <button
                            onClick={handleDownloadAllImages}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-700 transition-colors"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download All as ZIP
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {designImages.map((side) => (
                            <div
                                key={side.key}
                                className="rounded-lg border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold text-black dark:text-white">
                                        {side.name}
                                    </h4>
                                    <button
                                        onClick={() => handleDownloadSingleImage(side.key, side.name)}
                                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition-colors"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download
                                    </button>
                                </div>
                                <div className="flex items-center justify-center rounded bg-gray-100 p-4 dark:bg-gray-800">
                                    {side.url && (
                                        <img
                                            src={side.url}
                                            alt={side.name}
                                            className="max-w-full h-auto rounded"
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

                {/* Product Customization */}
                <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
                    <h3 className="text-lg font-semibold text-black dark:text-white mb-4">Product Customization</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Color:</span>
                            <span className="font-medium text-black dark:text-white">{order.customization.color}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Size:</span>
                            <span className="font-medium text-black dark:text-white">{order.customization.size}</span>
                        </div>

                        {order.customization.notes && (
                            <div>
                                <span className="text-gray-600 dark:text-gray-400 block">Notes:</span>
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

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                >
                    Back to Orders
                </Button>
                <Button
                    onClick={handleShipOrder}
                    disabled={shippingLoading || order.status === 'PRINTED' || order.status === 'SHIPPED'}
                    className={`${order.status === 'PRINTED' || order.status === 'SHIPPED'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                >
                    {shippingLoading ? 'Shipping...' : (
                        order.status === 'PRINTED' || order.status === 'SHIPPED'
                            ? (order.tracking_number ? `Shipped (${order.tracking_number})` : 'Order Shipped')
                            : 'Ship & Print Label'
                    )}
                </Button>
            </div>
        </div>
    );
}
