"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReturnDataTable from "@/components/DataTables/ReturnDataTable";
import { Return } from "@/types/datatable";
import { useAuth } from "@/context/AuthContext";

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
  total_amount: number;
  status: string;
  created_at: string;
  customization?: {
    items?: Array<{
      product_id: number;
      reorder_from_order_id?: number;
      template_id?: number;
      color: string;
      size: string;
      quantity: number;
    }>;
  };
  allow_reshipping?: boolean;
}

export default function SellerReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchReturns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/seller/orders?filter=returns&per_page=100`, {
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

          if (items.length > 0) {
            // Flatten items
            items.forEach((item, index) => {
              // Determine product name
              let productName = 'Unknown Product';
              if (order.product && (!item.product_id || item.product_id === order.product.id)) {
                productName = order.product.name;
              } else if (item.product_id) {
                productName = `Product #${item.product_id}`;
              }

              transformedReturns.push({
                id: order.id, // Keeping original order ID for reference
                returnNumber: `RET-${order.order_number}-${index + 1}`,
                orderNumber: order.order_number,
                customer: {
                  name: order.customer?.name || 'Unknown',
                  email: order.customer?.email || '',
                },
                product: productName,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                amount: order.total_amount, // This is order total, might be misleading for item? But ok for now.
                status: order.status as any,
                date: new Date(order.created_at).toLocaleDateString(),
                reason: 'Shipping Issue' as any,
                customization: item,
                allow_reshipping: order.allow_reshipping ?? false,
              });
            });
          } else {
            // Fallback for legacy orders without items array
            transformedReturns.push({
              id: order.id,
              returnNumber: `RET-${order.order_number}`,
              orderNumber: order.order_number,
              customer: {
                name: order.customer?.name || 'Unknown',
                email: order.customer?.email || '',
              },
              product: order.product?.name || 'Unknown',
              amount: order.total_amount,
              status: order.status as any,
              date: new Date(order.created_at).toLocaleDateString(),
              reason: 'Shipping Issue' as any
            });
          }
        });

        setReturns(transformedReturns);
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

  const handleSelectionChange = (selectedReturns: Return[]) => {
  };

  const handleBulkAction = (action: string, selectedReturns: Return[]) => {
  };

  const handleReorder = (returnItem: Return) => {
    // Navigate to Create Order page with reorder parameters
    // We pass the order ID and potentially the item details or index
    // Using query params to pass simple data
    const queryParams = new URLSearchParams();
    queryParams.set('reorder_order_id', returnItem.id.toString());
    if (returnItem.customization) {
      queryParams.set('reorder_item', JSON.stringify(returnItem.customization));
    }
    router.push(`/seller/create-order?${queryParams.toString()}`);
  };

  const handleDelete = (returnItem: Return) => {
  };

  const handleDownload = () => {
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <ReturnDataTable
        data={returns}
        title="Seller Returns Management"
        enableSelection={true}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        onEdit={handleReorder} // Reusing onEdit for Reorder action
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
}