"use client";

import React, { useEffect, useState } from "react";
import MonthlySalesChart from "@/components/ecommerce/MonthlySalesChart";
import { BoxIconLine, GroupIcon, DollarLineIcon, TimeIcon } from "@/icons";

type Order = {
  id: number;
  order_number?: string;
  status?: string;
  total_amount?: number;
  customer_name?: string;
  created_at?: string;
};

type Template = {
  id: number;
  title: string;
  status?: string;
  user?: { name?: string };
  created_at?: string;
};

type Product = { id: number; name: string; base_price?: number };

export default function AdminDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    pendingTemplates: 0,
    approvedTemplates: 0,
    productsCount: 0,
    uniqueCustomers: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/orders?per_page=20`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data?.data || data?.data || [];
        setOrders(list);
        const uniqueCustomers = new Set(
          list
            .map((o: any) => o.customer_name)
            .filter((v: string | undefined) => !!v)
        ).size;
        setMetrics((prev) => ({
          ...prev,
          totalOrders: list.length,
          pendingOrders: list.filter((o: any) => o.status === "PENDING").length,
          revenue: list.reduce(
            (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
            0
          ),
          uniqueCustomers,
        }));
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/templates?per_page=15`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data || [];
        setTemplates(list);
        setMetrics((prev) => ({
          ...prev,
          pendingTemplates: list.filter((t: any) => t.status === "PENDING")
            .length,
          approvedTemplates: list.filter((t: any) => t.status === "APPROVED")
            .length,
        }));
      } catch (err) {
        console.error("Failed to load templates", err);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/products?per_page=12`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const list = data?.data?.data || data?.data || [];
        setProducts(list);
        setMetrics((prev) => ({
          ...prev,
          productsCount: list.length,
        }));
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };

    Promise.all([fetchOrders(), fetchTemplates(), fetchProducts()]).finally(() =>
      setLoading(false)
    );
  }, [API_URL]);

  const currency = (v: number) => `${v.toFixed(2)} DH`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Live overview of orders, templates, and products
        </p>
      </div>

      {/* Metric row with soft cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<GroupIcon className="text-gray-800 size-5 dark:text-white/80" />}
          label="Total Orders"
          value={metrics.totalOrders}
          hint={`${metrics.pendingOrders} pending`}
        />
        <MetricCard
          icon={<DollarLineIcon className="text-gray-800 size-5 dark:text-white/80" />}
          label="Revenue (last 20)"
          value={currency(metrics.revenue)}
          hint="sum of latest orders"
        />
        <MetricCard
          icon={<TimeIcon className="text-gray-800 size-5 dark:text-white/80" />}
          label="Pending Templates"
          value={metrics.pendingTemplates}
          hint={`${metrics.approvedTemplates} approved`}
        />
        <MetricCard
          icon={<BoxIconLine className="text-gray-800 size-5 dark:text-white/80" />}
          label="Products"
          value={metrics.productsCount}
          hint="latest fetched"
        />
      </div>

      {/* Charts and data */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <MonthlySalesChart userRole="admin" />
        </div>
      </div>

      {/* Data tables */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <DataPanel
            icon={<BoxIconLine className="text-gray-800 size-5 dark:text-white/80" />}
            title="Recent Orders"
            loading={loading}
            empty="No orders yet."
            headers={["Order", "Customer", "Status", "Total", "Date"]}
            rows={orders.slice(0, 6).map((o) => [
              o.order_number || `#${o.id}`,
              o.customer_name || "Customer",
              o.status || "PENDING",
              currency(Number(o.total_amount || 0)),
              o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
            ])}
          />
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-4">
          <DataPanel
            icon={<TimeIcon className="text-gray-800 size-5 dark:text-white/80" />}
            title="Latest Templates"
            loading={loading}
            empty="No templates."
            headers={["Title", "Seller", "Status", "Created"]}
            rows={templates.slice(0, 6).map((t) => [
              t.title,
              t.user?.name || "Seller",
              t.status || "PENDING",
              t.created_at ? new Date(t.created_at).toLocaleDateString() : "",
            ])}
          />

          <DataPanel
            icon={<BoxIconLine className="text-gray-800 size-5 dark:text-white/80" />}
            title="Products"
            loading={loading}
            empty="No products."
            headers={["Name", "Base Price"]}
            rows={products.slice(0, 6).map((p) => [
              p.name,
              currency(Number(p.base_price || 0)),
            ])}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </div>
          {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function DataPanel({
  title,
  headers,
  rows,
  loading,
  empty,
  icon,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  loading?: boolean;
  empty?: string;
  icon?: React.ReactNode;
}) {
  const getStatusBadge = (status: string | number) => {
    const statusStr = String(status).toUpperCase();
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      PRINTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      SHIPPED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    };
    return colors[statusStr] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400";
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              {icon}
            </div>
          )}
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h4>
        </div>
        {loading && (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900 dark:border-gray-600 dark:border-t-white" />
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              {headers.map((h) => (
                <th key={h} className="pb-3 pr-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.length === 0 && !loading ? (
              <tr>
                <td className="py-8 text-center text-sm text-gray-500 dark:text-gray-400" colSpan={headers.length}>
                  {empty || "No data"}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {row.map((cell, i) => (
                    <td key={i} className="py-3 pr-4 align-middle text-sm">
                      {headers[i] === "Status" ? (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadge(cell)}`}>
                          {cell}
                        </span>
                      ) : i === 0 ? (
                        <span className="font-medium text-gray-900 dark:text-white">{cell}</span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
