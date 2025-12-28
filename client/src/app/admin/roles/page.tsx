"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/hooks/use-toast";

export default function RolesPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string,string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/admin/roles`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch roles');
        const data = await res.json();
        if (mounted) setRoles(data.data || data);
        // fetch permission labels
        try {
          const permRes = await fetch(`${API_URL}/api/admin/roles/permissions`, { credentials: 'include' });
          if (permRes.ok) {
            const permData = await permRes.json().catch(()=>null);
            if (mounted) setAvailablePermissions(permData?.data || {});
          }
        } catch (e) {}
      } catch (err: any) {
        toast({ title: 'Error', description: err?.message || String(err) });
      } finally { if (mounted) setLoading(false); }
    };
    load();
    return () => { mounted = false; };
  }, [toast]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Roles</h2>
        <Link href="/admin/roles/new"><Button>+ Create Role</Button></Link>
      </div>

      <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm">
        {loading ? <div>Loading...</div> : (
          roles.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">No roles found.</div>
          ) : (
            <ul className="space-y-2">
              {roles.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-gray-500">{r.description}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(r.permissions || []).map((p: string) => (
                        <span key={p} className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800">{availablePermissions[p] || p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">{(r.permissions || []).length} perms</div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  );
}
