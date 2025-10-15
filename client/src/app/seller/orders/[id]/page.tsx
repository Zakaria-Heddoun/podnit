"use client";

import React from "react";
import Image from "next/image";
import { sampleOrders } from "@/data/sampleData";
import { Order } from "@/types/datatable";

type Params = { id: string };

const statusStyles: Record<Order["status"], string> = {
  Completed: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100",
  Refunded: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
}

function buildStatusTimeline(order: Order) {
  const steps: { label: string; date?: string; done: boolean }[] = [
    { label: "Placed", date: order.date, done: true },
  ];

  if (order.status === "Processing") {
    steps.push({ label: "Processing", done: true });
  }
  if (order.status === "Completed") {
    steps.push({ label: "Processing", done: true });
    steps.push({ label: "Completed", done: true });
  }
  if (order.status === "Cancelled") {
    steps.push({ label: "Cancelled", done: true });
  }
  if (order.status === "Refunded") {
    steps.push({ label: "Completed", done: true });
    steps.push({ label: "Refunded", done: true });
  }

  return steps;
}

export default function SellerOrderDetails({ params }: { params: Params }) {
  const id = Number(params.id);
  const order = sampleOrders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="mx-auto max-w-screen-lg p-4 md:p-6 2xl:p-10">
        <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-title-md font-semibold text-black dark:text-white">Order Not Found</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            The requested order does not exist. Please check the URL or return to orders.
          </p>
        </div>
      </div>
    );
  }

  const timeline = buildStatusTimeline(order);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Order {order.orderNumber}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Date: {order.date}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusStyles[order.status]}`}>
          {order.status}
        </span>
      </div>

      {/* Top summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="flex items-center gap-3">
            {order.customer.avatar && (
              <Image src={order.customer.avatar} alt={order.customer.name} width={40} height={40} className="rounded-full" />
            )}
            <div>
              <p className="text-sm font-medium text-black dark:text-white">{order.customer.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{order.customer.email}</p>
            </div>
          </div>
          <p className="mt-4 text-xs font-medium text-gray-500 dark:text-gray-400">Shipping Address</p>
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Not provided</p>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm font-medium text-black dark:text-white">Payment</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Method</span>
              <span className="text-black dark:text-white">{order.paymentMethod ?? "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300">Total</span>
              <span className="text-black dark:text-white">{formatCurrency(order.amount)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
          <p className="text-sm font-medium text-black dark:text-white">Template</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">Not provided</p>
        </div>
      </div>

      {/* Products */}
      <div className="mb-6 rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="mb-4 text-sm font-medium text-black dark:text-white">Products</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-gray-100 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-black dark:text-white">{order.product}</p>
              <span className="text-xs text-gray-600 dark:text-gray-300">Qty: 1</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Size</span>
                <span className="text-black dark:text-white">N/A</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-300">Price</span>
                <span className="text-black dark:text-white">{formatCurrency(order.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-boxdark">
        <p className="mb-4 text-sm font-medium text-black dark:text-white">Order History</p>
        <div className="space-y-3">
          {timeline.map((step, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs">
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-black dark:text-white">{step.label}</p>
                {step.date && (
                  <p className="text-xs text-gray-600 dark:text-gray-300">{step.date}</p>
                )}
              </div>
              {step.done && (
                <span className="text-xs text-green-600 dark:text-green-400">Done</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}