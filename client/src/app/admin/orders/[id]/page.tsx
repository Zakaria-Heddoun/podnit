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
    };
    shipping_address: {
        street: string;
        city: string;
        postal_code: string;
        country: string;
    };
    created_at: string;
    updated_at: string;
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch order details from API
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
                {order.template && (
                    <Button
                        variant="outline"
                        onClick={async () => {
                            if (!order) return;
                            try {
                                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                const token = localStorage.getItem('token');

                                const response = await fetch(`${API_URL}/api/admin/orders/${order.id}/download-assets`, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                });

                                if (response.ok) {
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `order-${order.order_number}-assets.zip`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                } else {
                                    alert('Failed to download assets. Please try again later.');
                                    console.error('Download failed:', response.statusText);
                                }
                            } catch (error) {
                                console.error('Error downloading assets:', error);
                                alert('An error occurred while downloading assets.');
                            }
                        }}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Assets
                    </Button>
                )}
                <Button
                    onClick={() => window.print()}
                    className="bg-gray-600 hover:bg-gray-700"
                >
                    Print Order
                </Button>
            </div>
        </div>
    );
}
