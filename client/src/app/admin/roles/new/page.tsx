"use client";

import React, { useState, useEffect } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { useToast } from "@/hooks/use-toast";

export default function NewRolePage() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Record<string, string>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [permLoadError, setPermLoadError] = useState<string | null>(null);

  // Local fallback permissions (useful for dev when backend isn't reachable or unauthenticated)
  const FALLBACK_PERMISSIONS: Record<string, string> = {
    view_dashboard: 'View Dashboard',
    view_orders: 'View Orders',
    manage_orders: 'Manage Orders',
    view_products: 'View Products',
    manage_products: 'Manage Products',
    view_users: 'View Users',
    manage_users: 'Manage Users',
    approve_templates: 'Approve / Reject Templates',
    approve_designs: 'Approve Designs',
    configure_site: 'Site Configuration',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast({ title: 'Validation', description: 'Name is required' });
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Ensure CSRF cookie is present and X-XSRF-TOKEN header is set for Sanctum
      try {
        await fetch(`${API_URL}/sanctum/csrf-cookie`, { credentials: 'include' });
      } catch (err) {
        // ignore — server might already have set cookies
      }

      // helper to read cookie value
      const getCookie = (name: string) => {
        if (typeof document === 'undefined') return null;
        const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : null;
      };

      const xsrf = getCookie('XSRF-TOKEN');
      const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' };
      if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

      const res = await fetch(`${API_URL}/api/admin/roles`, { method: 'POST', headers, body: JSON.stringify({ name, description, permissions: selectedPermissions }), credentials: 'include' });
      if (!res.ok) {
        const d = await res.json().catch(()=>null);
        // throw a descriptive error including status
        throw new Error(d?.message || `${res.status} ${res.statusText}` || 'Failed to create role');
      }
      toast({ title: 'Role created' });
      setName(''); setDescription('');
      setSelectedPermissions([]);
    } catch (err: any) { toast({ title: 'Error', description: err?.message || String(err) }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const res = await fetch(`${API_URL}/api/admin/roles/permissions`, { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
          // try dev-only unprotected endpoint as a fallback for local development
          const d = await res.json().catch(() => null);
          if (mounted) setPermLoadError(d?.message || res.statusText || 'Failed to load permissions');
          try {
            const devRes = await fetch(`${API_URL}/api/dev/roles/permissions`, { headers: { 'Accept': 'application/json' } });
              if (devRes.ok) {
                const devData = await devRes.json().catch(() => null);
                if (mounted) setAvailablePermissions(devData?.data || {});
                // clear permLoadError since dev endpoint succeeded
                if (mounted) setPermLoadError(null);
                return;
              }
          } catch (err) {
            // ignore dev endpoint failure and fall through to using fallback permissions
          }
          return;
        }
        const data = await res.json().catch(() => null);
        const perms = data?.data || {};
        if (mounted) setAvailablePermissions(perms);
      } catch (e: any) {
        // show a friendly message so the admin knows why permissions are not shown
        setPermLoadError(e?.message || 'Failed to load permissions');
      }
    })();
    return () => { mounted = false; };
  }, []);

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
  };

  const selectAll = () => setSelectedPermissions(Object.keys(availablePermissions).length ? Object.keys(availablePermissions) : Object.keys(FALLBACK_PERMISSIONS));
  const clearAll = () => setSelectedPermissions([]);

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold mb-4">Create Role</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e)=>setName(e.target.value)} placeholder="manager" />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Role description" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>Permissions</Label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={selectAll} className="text-sm text-brand-500 hover:underline">Select all</button>
              <button type="button" onClick={clearAll} className="text-sm text-gray-500 hover:underline">Clear</button>
            </div>
          </div>

          {permLoadError ? (
            <div className="text-sm text-yellow-600">Couldn't load permission definitions from the server: {permLoadError}. Showing a local fallback list for development.</div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 mt-2">
            {(() => {
              const source = Object.entries(availablePermissions).length ? availablePermissions : FALLBACK_PERMISSIONS;
              return Object.entries(source).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={selectedPermissions.includes(key)} onChange={() => togglePermission(key)} />
                  <span className="text-sm">{label} <span className="text-xs text-gray-400">({key})</span></span>
                </label>
              ));
            })()}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="inline-flex items-center justify-center font-medium gap-2 rounded-lg transition px-5 py-3.5 text-sm bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300">
            {loading ? 'Saving...' : 'Create Role'}
          </button>
          <Button variant="outline" onClick={()=>{ setName(''); setDescription(''); }}>Reset</Button>
        </div>
      </form>
    </div>
  );
}
