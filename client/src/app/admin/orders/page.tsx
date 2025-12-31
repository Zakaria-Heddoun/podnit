"use client";

import React, { useState, useEffect } from "react";
import OrderDataTable from "@/components/DataTables/OrderDataTable";
import { Order } from "@/types/datatable";

// Order status type
type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'PRINTED' | 'DELIVERING' | 'SHIPPED' | 'PAID' | 'CANCELLED' | 'RETURNED';

interface OrderApiResponse {
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
  };
  template?: {
    id: number;
    title: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
  };
  quantity: number;
  unit_price: number;
  selling_price?: number;
  total_amount: number;
  status: OrderStatus;
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

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0
  });

  // Transform API response to match UI component format
  const transformApiOrder = (apiOrder: OrderApiResponse): Order => {
    return {
      id: apiOrder.id,
      orderNumber: apiOrder.order_number,
      customer: {
        name: apiOrder.user?.name || 'Unknown Seller',
        email: apiOrder.user?.email || '',
        avatar: undefined
      },
      product: apiOrder.product?.name || 'Unknown Product',
      amount: apiOrder.total_amount,
      status: apiOrder.status as 'Completed' | 'Processing' | 'Cancelled' | 'Refunded',
      date: new Date(apiOrder.created_at).toLocaleDateString(),
      paymentMethod: undefined
    };
  };

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');

        // Fetch ALL orders from admin endpoint
        const response = await fetch(`${API_URL}/api/admin/orders?per_page=100`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          console.log('API Response:', result);

          // Handle different response structures
          let ordersData;
          if (result.data && Array.isArray(result.data.data)) {
            // Paginated response
            ordersData = result.data.data;
          } else if (result.data && Array.isArray(result.data)) {
            // Direct array response
            ordersData = result.data;
          } else if (Array.isArray(result.data)) {
            // Direct data array
            ordersData = result.data;
          }

          if (ordersData && ordersData.length >= 0) {
            console.log('Orders data:', ordersData);
            // Sort by latest first (in case backend doesn't)
            const sortedOrders = ordersData.sort((a: OrderApiResponse, b: OrderApiResponse) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            const transformedOrders = sortedOrders.map(transformApiOrder);
            setOrders(transformedOrders);

            // Calculate stats from actual data
            const statsData = {
              total: ordersData.length,
              pending: ordersData.filter((o: OrderApiResponse) => o.status === 'PENDING').length,
              completed: ordersData.filter((o: OrderApiResponse) => o.status === 'PAID').length,
              revenue: ordersData
                .filter((o: OrderApiResponse) => o.status === 'PAID')
                .reduce((sum: number, o: OrderApiResponse) => sum + o.total_amount, 0)
            };
            setStats(statsData);

            setLoading(false);
            return;
          } else {
            console.error('Invalid orders data structure');
          }
        } else {
          console.error('API Error:', response.status, await response.text());
        }

        // No fallback data - show error state
        console.error('Failed to load orders from API');
        setOrders([]);
        setStats({
          total: 0,
          pending: 0,
          completed: 0,
          revenue: 0
        });

      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleSelectionChange = (selectedOrders: Order[]) => {
    console.log('Selected orders:', selectedOrders);
  };

  const handleBulkAction = (action: string, selectedOrders: Order[]) => {
    console.log(`Bulk action: ${action}`, selectedOrders);
    switch (action) {
      case 'updateStatus':
        if (selectedOrders.length > 0) {
          alert(`Updating status for ${selectedOrders.length} orders`);
        }
        break;
      case 'export':
        alert(`Exporting ${selectedOrders.length} selected orders`);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };

  const handleViewDetails = (order: Order) => {
    console.log('View order details:', order);
    // Navigate to order details page
    window.location.href = `/admin/orders/${order.id}`;
  };

  const handleDownload = () => {
    console.log('Download all orders');
    alert('Downloading all orders as CSV...');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="22" height="18" viewBox="0 0 22 18" fill="none">
                <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751Z" />
                <path d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6687 3.15625 15.8124 3.15625C13.9562 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9562 9.6875 15.8124 9.6875Z" />
                <path d="M15.8124 11.8438C12.0843 11.8438 9.0624 14.7891 9.0624 18.4219H22.5624C22.5624 14.7891 19.5405 11.8438 15.8124 11.8438Z" />
                <path d="M7.18418 9.67505C2.98918 9.67505 -0.433823 12.5844 -0.433823 16.3094H14.8061C14.8061 12.5844 11.3831 9.67505 7.18418 9.67505Z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {stats.total}
                </h4>
                <span className="text-sm font-medium">Total Orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="20" height="22" viewBox="0 0 20 22" fill="none">
                <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" />
                <path d="M5.22183 16.4312C3.84683 16.4312 2.74683 17.5312 2.74683 18.9062C2.74683 20.2812 3.84683 21.3812 5.22183 21.3812C6.59683 21.3812 7.69683 20.2812 7.69683 18.9062C7.69683 17.5656 6.59683 16.4312 5.22183 16.4312Z" />
                <path d="M19.0062 0.618744H17.15C16.775 0.618744 16.4656 0.928119 16.4656 1.30312C16.4656 1.67812 16.775 1.98749 17.15 1.98749H19.0062C19.3812 1.98749 19.6906 2.29687 19.6906 2.67187V3.42812C19.6906 3.80312 19.3812 4.11249 19.0062 4.11249H17.15C16.775 4.11249 16.4656 4.42187 16.4656 4.79687C16.4656 5.17187 16.775 5.48124 17.15 5.48124H19.0062C20.1375 5.48124 21.0594 4.55937 21.0594 3.42812V2.67187C21.0594 1.54062 20.1375 0.618744 19.0062 0.618744Z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {stats.pending}
                </h4>
                <span className="text-sm font-medium">Pending Orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99378 21.3813 3.85316 21.3813H18.1469C19.0063 21.3813 19.8 21.0031 20.3844 20.3844C20.9688 19.7656 21.2094 18.9063 21.1063 18.0469Z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {stats.completed}
                </h4>
                <span className="text-sm font-medium">Completed Orders</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center">
            <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
              <svg className="fill-primary dark:fill-white" width="20" height="22" viewBox="0 0 20 22" fill="none">
                <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" />
              </svg>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <h4 className="text-title-md font-bold text-black dark:text-white">
                  {stats.revenue} DH
                </h4>
                <span className="text-sm font-medium">Total Revenue</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrderDataTable
        data={orders}
        title="Admin Orders Management"
        customerLabel="Seller"
        enableSelection={false}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        onEdit={handleViewDetails}
        onDownload={handleDownload}
      />
    </div>
  );
}