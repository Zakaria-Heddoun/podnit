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

const MAX_IMAGE_DIMENSION = 2048;
const COMPRESS_THRESHOLD_BYTES = 3 * 1024 * 1024;

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Failed to compress image"));
        return;
      }
      resolve(blob);
    }, type, quality);
  });

export default function AdminDesignAssetsPage() {
  const CONCURRENT_UPLOADS = 3;
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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

  const optimizeImageForUpload = async (file: File): Promise<File> => {
    if (file.size <= COMPRESS_THRESHOLD_BYTES) {
      return file;
    }

    try {
      const image = await loadImage(file);
      const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
      const targetWidth = Math.max(1, Math.round(image.width * ratio));
      const targetHeight = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return file;
      }

      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

      const outputType = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
      const blob = await canvasToBlob(canvas, outputType, 0.85);

      if (blob.size >= file.size) {
        return file;
      }

      const extension = outputType === "image/jpeg"
        ? "jpg"
        : outputType === "image/webp"
          ? "webp"
          : "png";

      const baseName = file.name.replace(/\.[^.]+$/, "");
      return new File([blob], `${baseName}.${extension}`, {
        type: outputType,
        lastModified: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error);
      return file;
    }
  };

  const processFiles = async (fileList: File[]) => {
    const imageFiles = fileList.filter(file => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast.error("Please select valid image files");
      return;
    }

    if (imageFiles.length !== fileList.length) {
      toast.warning(`${fileList.length - imageFiles.length} non-image file(s) skipped`);
    }

    setUploading(true);
    setUploadedCount(0);
    setUploadTotal(imageFiles.length);
    setUploadProgress(`Uploading 0 of ${imageFiles.length}...`);

    const token = localStorage.getItem("token");
    let successCount = 0;
    let failCount = 0;
    let completed = 0;

    const uploadSingleFile = async (file: File) => {
      const optimizedFile = await optimizeImageForUpload(file);
      const formData = new FormData();
      formData.append("image", optimizedFile);
      formData.append("title", file.name.replace(/\.[^.]+$/, "") || "Design");
      formData.append("category", "");

      try {
        const res = await fetch(`${getApiUrl()}/api/admin/design-assets`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const raw = await res.text();
        let data: any = null;
        try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }

        if (res.ok && data?.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to upload ${file.name}:`, raw || data?.message || res.statusText);
        }
      } catch (error) {
        failCount++;
        console.error(`Error uploading ${file.name}:`, error);
      } finally {
        completed++;
        setUploadedCount(completed);
        setUploadProgress(`Uploading ${completed} of ${imageFiles.length}...`);
      }
    };

    try {
      for (let i = 0; i < imageFiles.length; i += CONCURRENT_UPLOADS) {
        const chunk = imageFiles.slice(i, i + CONCURRENT_UPLOADS);
        await Promise.all(chunk.map(uploadSingleFile));
      }

      if (successCount > 0) {
        toast.success(`Successfully added ${successCount} design${successCount > 1 ? "s" : ""}`);
        fetchAssets();
      }
      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} design${failCount > 1 ? "s" : ""}`);
      }
    } catch (error) {
      console.error("Error in upload process:", error);
      toast.error("An unexpected error occurred during upload");
    } finally {
      setUploading(false);
      setUploadProgress("");
      setUploadedCount(0);
      setUploadTotal(0);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processFiles(Array.from(files));
    if (e.target) e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFiles(files);
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

  const progressPercent = uploadTotal > 0 ? Math.round((uploadedCount / uploadTotal) * 100) : 0;

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
            multiple
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
                Add Designs
              </>
            )}
          </button>
        </div>
      </div>

      {/* Drag-and-drop zone */}
      <div
        ref={dropRef}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
          isDragging
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-gray-500 dark:hover:bg-gray-800"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <svg className={`mb-3 h-10 w-10 ${isDragging ? "text-blue-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDragging ? "Drop images here" : "Drag & drop images here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Select as many images as you want — PNG, JPG, WebP
        </p>
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="mb-6 rounded-xl border border-stroke bg-white p-4 dark:border-strokedark dark:bg-boxdark">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{uploadProgress}</span>
            <span className="text-gray-500 dark:text-gray-400">{progressPercent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gray-900 transition-all duration-300 dark:bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

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
