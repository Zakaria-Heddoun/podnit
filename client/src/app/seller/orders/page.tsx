"use client";

import React from "react";
import OrderDataTable from "@/components/DataTables/OrderDataTable";
import { sampleOrders } from "@/data/sampleData";
import { Order } from "@/types/datatable";

export default function SellerOrders() {
  const handleSelectionChange = (selectedOrders: Order[]) => {
    console.log('Selected orders:', selectedOrders);
  };

  const handleBulkAction = (action: string, selectedOrders: Order[]) => {
    console.log(`Bulk action: ${action}`, selectedOrders);
    switch (action) {
      case 'delete':
        if (confirm(`Are you sure you want to delete ${selectedOrders.length} orders?`)) {
          alert(`Deleted ${selectedOrders.length} orders`);
        }
        break;
      case 'export':
        alert(`Exporting ${selectedOrders.length} selected orders`);
        break;
      default:
        console.log('Unknown bulk action:', action);
    }
  };

  const handleEdit = (order: Order) => {
    console.log('Edit order:', order);
    alert(`Editing order ${order.orderNumber}`);
  };

  const handleDelete = (order: Order) => {
    console.log('Delete order:', order);
    if (confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      alert(`Deleted order ${order.orderNumber}`);
    }
  };

  const handleDownload = () => {
    console.log('Download all orders');
    alert('Downloading all orders as CSV...');
  };

  return (
    <div className="mx-auto max-w-screen-2xl">
     
      
      

      <OrderDataTable
        data={sampleOrders}
        title="Seller Orders Management"
        enableSelection={true}
        onSelectionChange={handleSelectionChange}
        onBulkAction={handleBulkAction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDownload={handleDownload}
      />
    </div>
  );
}