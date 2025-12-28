"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/hooks/use-toast";

type Employee = {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  created_at?: string;
};

export default function EmployeesPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/admin/employees`, { credentials: 'include' });
        if (!res.ok) {
          throw new Error(`Failed to load employees (${res.status})`);
        }
        const data = await res.json();
        if (mounted) setEmployees(Array.isArray(data) ? data : data.data || []);
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
  }, [toast]);

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Employees</h2>
        <Link href="/admin/employees/new">
          <Button>+ Create Employee</Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        {loading ? (
          <div>Loading...</div>
        ) : employees.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No employees found.</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-3">{e.name}</td>
                    <td className="px-3 py-3">{e.email}</td>
                    <td className="px-3 py-3">{e.role || "-"}</td>
                    <td className="px-3 py-3">{e.created_at ? new Date(e.created_at).toLocaleString() : "-"}</td>
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
