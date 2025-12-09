"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import SellerDataTable from "@/components/DataTables/SellerDataTable";
import { Seller } from "@/types/datatable";

export default function AdminSellersPage() {
  const { token, user } = useAuth();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [editForm, setEditForm] = useState<Partial<Seller> & { password?: string }>({});

  useEffect(() => {
    if (!user || user.role !== "admin" || !token) {
      setLoading(false);
      return;
    }
    fetchSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/admin/sellers`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        }
      });
      if (response.ok) {
        const result = await response.json();
        setSellers(result.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sellers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (seller: Seller) => {
    if (!token) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_URL}/api/admin/sellers/${seller.id}/activate`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_active: !seller.is_active })
      });
      if (response.ok) {
        fetchSellers();
      }
    } catch (error) {
      console.error("Error updating seller status:", error);
    }
  };

  const handleEditClick = (seller: Seller) => {
    setEditingSeller(seller);
    setEditForm({ ...seller, password: "" });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeller || !token) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Filter out empty password if it wasn't changed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...editForm };
      if (!payload.password) {
        delete payload.password;
      }

      const response = await fetch(`${API_URL}/api/admin/sellers/${editingSeller.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setEditingSeller(null);
        fetchSellers();
      }
    } catch (error) {
      console.error("Error updating seller info:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">Sellers Management</h2>
        <p className="text-regular text-body dark:text-bodydark">View, activate/deactivate, and edit seller accounts</p>
      </div>

      <SellerDataTable
        data={sellers}
        onEdit={handleEditClick}
        onToggleStatus={handleActivate}
      />

      {/* Edit Seller Modal */}
      {editingSeller && (
        <Modal isOpen={!!editingSeller} onClose={() => setEditingSeller(null)} className="max-w-2xl">
          <form onSubmit={handleEditSubmit} className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Seller Info</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input type="text" name="name" value={editForm.name || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="text" name="phone" value={editForm.phone || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand Name</label>
                <input type="text" name="brand_name" value={editForm.brand_name || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CIN</label>
                <input type="text" name="cin" value={editForm.cin || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name</label>
                <input type="text" name="bank_name" value={editForm.bank_name || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RIB</label>
                <input type="text" name="rib" value={editForm.rib || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password (leave empty to keep)</label>
                <input type="password" name="password" value={editForm.password || ''} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" placeholder="Min 8 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Balance (DH)</label>
                <input type="number" name="balance" value={editForm.balance || 0} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Points</label>
                <input type="number" name="points" value={editForm.points || 0} onChange={handleEditChange} className="w-full rounded border px-3 py-2 dark:bg-boxdark dark:border-strokedark" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingSeller(null)}>Cancel</Button>
              <Button type="submit" variant="default">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
