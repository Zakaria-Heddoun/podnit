"use client";

import React, { useState, useEffect, useRef } from "react";
import { getApiUrl, getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import PermissionGuard from "@/components/auth/PermissionGuard";

interface DesignAsset {
  id: number;
  title: string;
  image_path: string;
  image_url: string;
  category: string | null;
  created_at?: string;
}

export default function AdminDesignAssetsPage() {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/admin/design-assets`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.data || []);
      } else {
        toast.error("Failed to load design assets");
      }
    } catch (error) {
      console.error("Error fetching design assets:", error);
      toast.error("Failed to load design assets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", file.name.replace(/\.[^.]+$/, "") || "Design");
      formData.append("category", "");

      const res = await fetch(`${getApiUrl()}/api/admin/design-assets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Design added successfully");
        fetchAssets();
      } else {
        toast.error(data.message || "Failed to add design");
      }
    } catch (error) {
      console.error("Error uploading design:", error);
      toast.error("Failed to add design");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteConfirmOpen(false);
    setDeleteId(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${getApiUrl()}/api/admin/design-assets/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Design deleted successfully");
        setAssets((prev) => prev.filter((a) => a.id !== id));
      } else {
        toast.error("Failed to delete design");
      }
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design");
    }
  };

  return (
    <PermissionGuard permission="manage_products">
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">
            Design Library
          </h2>
          <p className="text-regular text-body dark:text-bodydark">
            Upload and manage designs that sellers can use in the Design Studio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 disabled:opacity-50"
          >
            {uploading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Uploading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Design
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-sm border border-stroke bg-white p-12 text-center dark:border-strokedark dark:bg-boxdark">
          <p className="text-gray-600 dark:text-gray-400">No designs yet.</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
            Click &quot;Add Design&quot; to upload images that sellers can use.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="group relative rounded-lg border border-stroke bg-white p-2 dark:border-strokedark dark:bg-boxdark"
            >
              <div className="aspect-square overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                <img
                  src={getImageUrl(asset.image_url || asset.image_path)}
                  alt={asset.title}
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/placeholder-product.png";
                  }}
                />
              </div>
              <p className="mt-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                {asset.title}
              </p>
              <button
                onClick={() => handleDeleteClick(asset.id)}
                className="absolute right-2 top-2 rounded bg-red-100 p-1.5 text-red-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                title="Delete"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setDeleteId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Design"
        message="Are you sure you want to delete this design? Sellers will no longer be able to use it."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
    </div>
    </PermissionGuard>
  );
}
