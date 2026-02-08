"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { getApiUrl, getImageUrl } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

interface DesignAsset {
  id: number;
  title: string;
  image_path: string;
  image_url: string;
  category: string | null;
}

interface DesignLibraryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function DesignLibraryPanel({ open, onClose, onSelect }: DesignLibraryPanelProps) {
  const [assets, setAssets] = useState<DesignAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchAssets = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${getApiUrl()}/api/design-assets`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          setAssets(data.data || []);
        } else {
          setAssets([]);
        }
      } catch (error) {
        console.error("Error fetching design assets:", error);
        setAssets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [open]);

  const handleSelect = async (asset: DesignAsset) => {
    const fullUrl = getImageUrl(asset.image_url || asset.image_path);
    const proxyPath = `/image-proxy?url=${encodeURIComponent(fullUrl)}`;
    const proxyUrl = typeof window !== 'undefined' ? `${window.location.origin}${proxyPath}` : proxyPath;

    setSelectingId(asset.id);
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) {
        throw new Error(`Image load failed: ${res.status}`);
      }
      const blob = await res.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(blob);
      });
      onSelect(dataUrl);
      onClose();
    } catch (err) {
      console.error("Design Library load error:", err);
      toast.error("Could not load design. Please try again.");
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} showCloseButton compact>
      <div className="max-h-[70vh] overflow-hidden flex flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Design Library
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select a design to add to your canvas
        </p>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            No designs available. Contact your admin to add designs.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 -mx-1">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-1">
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handleSelect(asset)}
                  disabled={selectingId !== null}
                  className="group rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:border-gray-900 dark:hover:border-gray-400 hover:ring-2 hover:ring-gray-900 dark:hover:ring-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-2">
                    <img
                      src={getImageUrl(asset.image_url || asset.image_path)}
                      alt={asset.title}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/placeholder-product.png";
                      }}
                    />
                  </div>
                  <p className="truncate text-xs font-medium text-gray-900 dark:text-white p-2 pt-0">
                    {asset.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
