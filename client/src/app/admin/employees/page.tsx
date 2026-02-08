"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { extractList } from "@/lib/extractList";

type Employee = {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const { token } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEmployees = async () => {
      if (!token) return;
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        const res = await fetch(`${API_URL}/api/admin/employees`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (!res.ok) {
          throw new Error(`Failed to load employees (${res.status})`);
        }
        const data = await res.json();
        const list = extractList(data);
        if (mounted) setEmployees(list);
      } catch (err: any) {
        toast({ title: "Error loading employees", description: err?.message || String(err) });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEmployees();
    return () => {
      mounted = false;
    };
  }, [toast, token]);

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Employees</h2>
        <Link
          href="/admin/employees/new"
          className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600"
        >
          + Create Employee
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading employees...</div>
        ) : employees.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No employees found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b border-gray-100 dark:border-gray-800">
                  <th className="px-3 py-3 font-semibold pb-4">Name</th>
                  <th className="px-3 py-3 font-semibold pb-4">Email</th>
                  <th className="px-3 py-3 font-semibold pb-4">Role</th>
                  <th className="px-3 py-3 font-semibold pb-4">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(employees || []).map((e) => {
                  if (!e || typeof e !== 'object') return null;

                  // Safely format role
                  const roleDisplay = typeof e.role === 'string' ? e.role : (e.role as any)?.name || "-";

                  return (
                    <tr key={e.id || Math.random()} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-3 py-4 font-medium text-gray-900 dark:text-white">{e.name || "N/A"}</td>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400">{e.email || "N/A"}</td>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{roleDisplay}</span>
                      </td>
                      <td className="px-3 py-4 text-gray-600 dark:text-gray-400">
                        <ClientOnlyDate date={e.created_at} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ClientOnlyDate({ date }: { date?: string }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !date) return <span>-</span>;

  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return <span>-</span>;
    return <span>{d.toLocaleString()}</span>;
  } catch (err) {
    return <span>-</span>;
  }
}
