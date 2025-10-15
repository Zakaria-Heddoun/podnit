"use client";

import React from "react";
import OrderDataTable from "@/components/DataTables/OrderDataTable";
import { sampleOrders } from "@/data/sampleData";
import { Order } from "@/types/datatable";

export default function AdminOrders() {
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
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Orders Management
        </h2>
        <p className="text-regular text-body dark:text-bodydark">
          Monitor and manage all customer orders with advanced filtering and bulk operations
        </p>
      </div>
      
      {/* Order Status Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="16"
              viewBox="0 0 22 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11 15.1156C4.19376 15.1156 0.825012 8.61876 0.687512 8.34376C0.584387 8.13751 0.584387 7.86251 0.687512 7.65626C0.825012 7.38126 4.19376 0.918762 11 0.918762C17.8063 0.918762 21.175 7.38126 21.3125 7.65626C21.4156 7.86251 21.4156 8.13751 21.3125 8.34376C21.175 8.61876 17.8063 15.1156 11 15.1156ZM2.26876 8.00001C3.02501 9.27189 5.98126 13.5688 11 13.5688C16.0188 13.5688 18.975 9.27189 19.7313 8.00001C18.975 6.72814 16.0188 2.43126 11 2.43126C5.98126 2.43126 3.02501 6.72814 2.26876 8.00001Z" />
              <path d="M11 10.9219C9.38438 10.9219 8.07812 9.61562 8.07812 8C8.07812 6.38438 9.38438 5.07812 11 5.07812C12.6156 5.07812 13.9219 6.38438 13.9219 8C13.9219 9.61562 12.6156 10.9219 11 10.9219ZM11 6.625C10.2437 6.625 9.625 7.24375 9.625 8C9.625 8.75625 10.2437 9.375 11 9.375C11.7563 9.375 12.375 8.75625 12.375 8C12.375 7.24375 11.7563 6.625 11 6.625Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {sampleOrders.length}
              </h4>
              <span className="text-sm font-medium">Total Orders</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="20"
              height="22"
              viewBox="0 0 20 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.7531 16.4312C10.3781 16.4312 9.27808 17.5312 9.27808 18.9062C9.27808 20.2812 10.3781 21.3812 11.7531 21.3812C13.1281 21.3812 14.2281 20.2812 14.2281 18.9062C14.2281 17.5656 13.1281 16.4312 11.7531 16.4312Z" />
              <path d="M19.7781 0.975006H18.8406L18.5906 2.84376C18.5563 3.23126 18.2375 3.53751 17.8156 3.53751H2.18438C1.76251 3.53751 1.44376 3.23126 1.40938 2.84376L1.15938 0.975006H0.221883C0.0968828 0.975006 -0.0281172 1.07501 -0.0281172 1.23751C-0.0281172 1.36251 0.0718828 1.49376 0.221883 1.49376H0.877508L1.43751 8.00001C1.47188 8.35001 1.76251 8.62501 2.1125 8.62501H17.8875C18.2375 8.62501 18.5281 8.35001 18.5625 8.00001L19.1225 1.49376H19.7781C19.9031 1.49376 20.0281 1.39376 20.0281 1.23126C20.0281 1.10001 19.9031 0.975006 19.7781 0.975006Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {sampleOrders.filter(order => order.status === 'Processing').length}
              </h4>
              <span className="text-sm font-medium">Processing</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M21.1063 18.0469L19.3875 3.23126C19.2157 1.71876 17.9438 0.584381 16.3969 0.584381H5.56878C4.05628 0.584381 2.78441 1.71876 2.57816 3.23126L0.859406 18.0469C0.756281 18.9063 1.03128 19.7313 1.61566 20.3844C2.20003 21.0375 2.99066 21.3813 3.85003 21.3813H18.1157C18.975 21.3813 19.8 21.0031 20.35 20.3844C20.9344 19.7313 21.2094 18.9063 21.1063 18.0469ZM19.2157 19.3531C18.9407 19.6625 18.5625 19.8344 18.15 19.8344H3.85003C3.43753 19.8344 3.05941 19.6625 2.78441 19.3531C2.50941 19.0438 2.37816 18.6313 2.44691 18.2188L4.12816 3.43751C4.19691 2.71563 4.81253 2.16563 5.56878 2.16563H16.4313C17.1875 2.16563 17.8031 2.71563 17.8719 3.43751L19.5532 18.2188C19.6219 18.6313 19.4907 19.0438 19.2157 19.3531Z" />
              <path d="M14.3344 5.29375C13.8469 5.29375 13.4688 5.67188 13.4688 6.15938V8.625C13.4688 9.1125 13.8469 9.49063 14.3344 9.49063C14.8219 9.49063 15.2 9.1125 15.2 8.625V6.15938C15.2 5.67188 14.8219 5.29375 14.3344 5.29375Z" />
              <path d="M7.66559 5.29375C7.17809 5.29375 6.79996 5.67188 6.79996 6.15938V8.625C6.79996 9.1125 7.17809 9.49063 7.66559 9.49063C8.15309 9.49063 8.53121 9.1125 8.53121 8.625V6.15938C8.53121 5.67188 8.15309 5.29375 7.66559 5.29375Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {sampleOrders.filter(order => order.status === 'Completed').length}
              </h4>
              <span className="text-sm font-medium">Completed</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
            <svg
              className="fill-primary dark:fill-white"
              width="22"
              height="18"
              viewBox="0 0 22 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M7.18418 8.03751C9.31543 8.03751 11.0686 6.35313 11.0686 4.25626C11.0686 2.15938 9.31543 0.475006 7.18418 0.475006C5.05293 0.475006 3.2998 2.15938 3.2998 4.25626C3.2998 6.35313 5.05293 8.03751 7.18418 8.03751ZM7.18418 2.05626C8.45605 2.05626 9.52168 3.05313 9.52168 4.29063C9.52168 5.52813 8.49043 6.52501 7.18418 6.52501C5.87793 6.52501 4.84668 5.52813 4.84668 4.29063C4.84668 3.05313 5.9123 2.05626 7.18418 2.05626Z" />
              <path d="M15.8124 9.6875C17.6687 9.6875 19.1468 8.24375 19.1468 6.42188C19.1468 4.6 17.6343 3.15625 15.8124 3.15625C13.9905 3.15625 12.478 4.6 12.478 6.42188C12.478 8.24375 13.9905 9.6875 15.8124 9.6875ZM15.8124 4.7375C16.8093 4.7375 17.5999 5.49375 17.5999 6.45625C17.5999 7.41875 16.8093 8.175 15.8124 8.175C14.8155 8.175 14.0249 7.41875 14.0249 6.45625C14.0249 5.49375 14.8155 4.7375 15.8124 4.7375Z" />
              <path d="M15.9843 10.0313H15.6749C14.6437 10.0313 13.6468 10.3406 12.7781 10.8563C11.8593 9.61876 10.3812 8.79376 8.73115 8.79376H5.67178C2.85303 8.82814 0.618652 11.0625 0.618652 13.8469V16.3219C0.618652 17.0406 1.13428 17.5563 1.85303 17.5563H8.97178C9.69053 17.5563 10.2062 17.0406 10.2062 16.3219V13.8469C10.2062 13.2281 9.99678 12.6094 9.65303 12.0938C10.3468 11.6781 11.1499 11.4375 11.9187 11.4375H15.2437C16.0343 11.4375 16.6531 12.0563 16.6531 12.8469V14.6094C16.6531 15.4 17.2718 16.0188 18.0624 16.0188C18.8531 16.0188 19.4718 15.4 19.4718 14.6094V12.8469C19.4718 11.2969 18.5343 10.0313 15.9843 10.0313Z" />
            </svg>
          </div>
          <div className="mt-4 flex items-end justify-between">
            <div>
              <h4 className="text-title-md font-bold text-black dark:text-white">
                {sampleOrders.filter(order => order.status === 'Cancelled' || order.status === 'Refunded').length}
              </h4>
              <span className="text-sm font-medium">Cancelled/Refunded</span>
            </div>
          </div>
        </div>
      </div>

      <OrderDataTable
        data={sampleOrders}
        title="Orders Management"
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