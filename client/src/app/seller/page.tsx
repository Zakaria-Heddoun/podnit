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
  selling_price?: number;
  quantity?: number;
};

type Template = {
  id: number;
  title: string;
  status?: string;
  created_at?: string;
};

export default function SellerDashboard() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [balance, setBalance] = useState(0);
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
    pendingTemplates: 0,
    approvedTemplates: 0,
    uniqueCustomers: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_URL}/api/seller/orders?per_page=20`, {
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
        
        // Calculate revenue as selling_price * quantity for each order
        const totalRevenue = list.reduce((sum: number, o: any) => {
          const orderRevenue = (Number(o.selling_price) || 0) * (Number(o.quantity) || 0);
          return sum + orderRevenue;
        }, 0);
        
        setMetrics((prev) => ({
          ...prev,
          totalOrders: list.length,
          pendingOrders: list.filter((o: any) => o.status === "PENDING").length,
          revenue: totalRevenue,
          uniqueCustomers,
        }));
      } catch (err) {
        console.error("Failed to load orders", err);
      }
    };

    const fetchTemplates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/seller/templates?per_page=15`, {
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

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setBalance(Number(data?.data?.balance || 0));
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    Promise.all([fetchOrders(), fetchTemplates(), fetchProfile()]).finally(() =>
      setLoading(false)
    );
  }, [API_URL]);

  const currency = (v: number) => `${v.toFixed(2)} MAD`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Live overview of your orders, templates, and earnings
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
          label="Revenue"
          value={currency(metrics.revenue)}
          hint="total sales revenue"
        />
        <MetricCard
          icon={<DollarLineIcon className="text-gray-800 size-5 dark:text-white/80" />}
          label="Balance"
          value={currency(balance)}
          hint="available balance"
        />
        <MetricCard
          icon={<TimeIcon className="text-gray-800 size-5 dark:text-white/80" />}
          label="Templates"
          value={metrics.approvedTemplates}
          hint={`${metrics.pendingTemplates} pending`}
        />
      </div>

      {/* Charts and data */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-7">
          <MonthlySalesChart userRole="seller" />
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
            headers={["Order", "Customer", "Status", "Revenue", "Date"]}
            rows={orders.slice(0, 6).map((o) => [
              o.order_number || `#${o.id}`,
              o.customer_name || "Customer",
              o.status || "PENDING",
              currency((Number(o.selling_price) || 0) * (Number(o.quantity) || 0)),
              o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
            ])}
          />
        </div>

        <div className="col-span-12 xl:col-span-5 space-y-4">
          <DataPanel
            icon={<TimeIcon className="text-gray-800 size-5 dark:text-white/80" />}
            title="My Templates"
            loading={loading}
            empty="No templates yet."
            headers={["Title", "Status", "Created"]}
            rows={templates.slice(0, 8).map((t) => [
              t.title,
              t.status || "PENDING",
              t.created_at ? new Date(t.created_at).toLocaleDateString() : "",
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