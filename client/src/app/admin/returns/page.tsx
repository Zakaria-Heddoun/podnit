"use client";

import React, { useState, useEffect } from "react";
import ReturnDataTable from "@/components/DataTables/ReturnDataTable";
import { Return } from "@/types/datatable";
import { useAuth } from "@/context/AuthContext";

interface OrderApiResponse {
  id: number;
  order_number: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
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
  total_amount: number;
  status: string;
  shipping_status: string;
  created_at: string;
  customization?: {
    items?: Array<{
      product_id: number;
      template_id?: number;
      color: string;
      size: string;
      quantity: number;
    }>;
  };
  allow_reshipping?: boolean;
}

export default function AdminReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, approved: 0, pendingApproval: 0 });

  const fetchReturns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/admin/orders?filter=returns&per_page=200`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const ordersData = result.data?.data || result.data || [];

        const transformedReturns: Return[] = [];

        ordersData.forEach((order: OrderApiResponse) => {
          const items = order.customization?.items || [];
          const sellerName = order.user?.name || 'Unknown Seller';

          if (items.length > 0) {
            items.forEach((item, index) => {
              let productName = 'Unknown Product';
              if (order.product && (!item.product_id || item.product_id === order.product.id)) {
                productName = order.product.name;
              } else if (item.product_id) {
                productName = `Product #${item.product_id}`;
              }

              transformedReturns.push({
                id: order.id,
                returnNumber: `RET-${order.order_number}-${index + 1}`,
                orderNumber: order.order_number,
                customer: {
                  name: sellerName,
                  email: order.user?.email || '',
                },
                product: productName,
                templateName: order.template?.title,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                amount: order.total_amount,
                status: order.status,
                date: new Date(order.created_at).toLocaleDateString(),
                customization: item,
                allow_reshipping: order.allow_reshipping ?? false,
              });
            });
          } else {
            transformedReturns.push({
              id: order.id,
              returnNumber: `RET-${order.order_number}`,
              orderNumber: order.order_number,
              customer: {
                name: sellerName,
                email: order.user?.email || '',
              },
              product: order.product?.name || 'Unknown',
              templateName: order.template?.title,
              amount: order.total_amount,
              status: order.status,
              date: new Date(order.created_at).toLocaleDateString(),
              allow_reshipping: order.allow_reshipping ?? false,
            });
          }
        });

        setReturns(transformedReturns);
        setStats({
          total: transformedReturns.length,
          approved: transformedReturns.filter(r => r.allow_reshipping).length,
          pendingApproval: transformedReturns.filter(r => !r.allow_reshipping).length,
        });
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [user]);

  const handleApprove = async (returnItem: Return) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/admin/orders/${returnItem.id}/toggle-reshipping`, {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state - toggle the approval for all items from the same order
        setReturns(prev => prev.map(r =>
          r.id === returnItem.id
            ? { ...r, allow_reshipping: !r.allow_reshipping }
            : r
        ));
        setStats(prev => {
          const wasApproved = returnItem.allow_reshipping;
          // Count how many items share this order ID
          const sameOrderCount = returns.filter(r => r.id === returnItem.id).length;
          return {
            ...prev,
            approved: wasApproved ? prev.approved - sameOrderCount : prev.approved + sameOrderCount,
            pendingApproval: wasApproved ? prev.pendingApproval + sameOrderCount : prev.pendingApproval - sameOrderCount,
          };
        });
      }
    } catch (error) {
      console.error('Error toggling return approval:', error);
    }
  };

  const handleSelectionChange = (selectedReturns: Return[]) => {
    // For future bulk actions
  };

  const handleBulkAction = (action: string, selectedReturns: Return[]) => {
    // For future bulk actions
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Returns</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved for Reorder</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{stats.approved}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">{stats.pendingApproval}</p>
        </div>
      </div>

      <ReturnDataTable
        data={returns}
        title="Admin Returns Management"
        enableSelection={false}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        onApprove={handleApprove}
      />
    </div>
  );
}
