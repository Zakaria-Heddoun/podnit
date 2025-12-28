"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeOrdersPage() {
  const { user, hasPermission, token } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user has permission to view orders
  if (!hasPermission('view_orders')) {
    return (
      <div className="p-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view orders.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${API_URL}/api/admin/orders`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const result = await response.json();
          const ordersData = result.data?.data || result.data || [];
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        } else {
          if (response.status === 403) {
            toast({ title: 'Access Denied', description: 'You don\'t have permission to view orders' });
          } else {
            toast({ title: 'Error', description: 'Failed to load orders' });
          }
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({ title: 'Error', description: 'Failed to load orders' });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, toast]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Orders</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        {loading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No orders found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium">{order.order_number || order.id}</td>
                    <td className="px-4 py-3">
                      {order.customer?.name || order.user?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">{order.product?.name || 'N/A'}</td>
                    <td className="px-4 py-3">{order.quantity || 0}</td>
                    <td className="px-4 py-3">${order.total_amount?.toFixed(2) || '0.00'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded ${
                        order.status === 'PAID' || order.status === 'SHIPPED' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : order.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {order.status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


