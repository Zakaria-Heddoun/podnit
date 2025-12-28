'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function EmployeeDashboard() {
  const { user, hasPermission } = useAuth();
  const [permissionLabels, setPermissionLabels] = useState<Record<string, string>>({});
  const [permLoadError, setPermLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/admin/roles/permissions`, { credentials: 'include', headers: { 'Accept': 'application/json' } });
        if (!res.ok) {
          const d = await res.json().catch(() => null);
          setPermLoadError(d?.message || res.statusText || 'Failed to load permissions');
          // try dev endpoint fallback
          const devRes = await fetch(`${API_URL}/api/dev/roles/permissions`, { headers: { 'Accept': 'application/json' } }).catch(() => null);
          if (devRes && devRes.ok) {
            const devData = await devRes.json().catch(() => null);
            if (mounted) setPermissionLabels(devData?.data || {});
            if (mounted) setPermLoadError(null);
          }
          return;
        }
        const data = await res.json().catch(() => null);
        if (mounted) setPermissionLabels(data?.data || {});
      } catch (err: any) {
        setPermLoadError(err?.message || String(err));
      }
    })();
    return () => { mounted = false; };
  }, []);

  const renderCard = (key: string, label: string, description: string) => (
    <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h3 className="font-semibold mb-2">{label}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );

  // Build list of known permission cards (label & description). If server provides labels, use them.
  const permissionCards: { key: string; label: string; description: string }[] = [
    { key: 'view_dashboard', label: permissionLabels['view_dashboard'] || 'Dashboard Access', description: 'You can view the dashboard' },
    { key: 'view_orders', label: permissionLabels['view_orders'] || 'View Orders', description: 'You can view orders' },
    { key: 'view_products', label: permissionLabels['view_products'] || 'View Products', description: 'You can view products' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Employee Dashboard</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-400">Welcome, {user?.name}!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Role: {user?.role}</p>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Your Permissions</h2>
          {user?.permissions && user.permissions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-3 py-1 text-sm rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {permissionLabels[permission] || permission}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No specific permissions assigned.</p>
          )}
        </div>

        {permLoadError ? (
          <div className="mt-4 text-sm text-yellow-600">Couldn't load permission definitions from the server: {permLoadError}. Showing keys instead.</div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissionCards.map((card) => (
            user && hasPermission(card.key) ? renderCard(card.key, card.label, card.description) : null
          ))}
        </div>
      </div>
    </div>
  );
}

