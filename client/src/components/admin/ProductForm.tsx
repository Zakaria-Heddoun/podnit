"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Switch from "@/components/form/switch/Switch";

type Mode = "create" | "edit";

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6})$/;
const NAMED_COLOR_MAP: Record<string, string> = {
  White: "#FFFFFF",
  Black: "#000000",
  Navy: "#000080",
  Gray: "#808080",
  Red: "#FF0000",
  Blue: "#0000FF",
  Green: "#008000",
  Yellow: "#FFFF00",
  "Royal Blue": "#4169E1",
  "Forest Green": "#228B22",
  Maroon: "#800000",
  "Light Blue": "#ADD8E6",
  Pink: "#FFC0CB",
  Natural: "#F5F5DC",
  Clear: "#FFFFFF",
  Linen: "#FAF0E6",
};

const defaultPrintArea = { x: 20, y: 20, width: 60, height: 60 };
const cloneArea = () => ({ ...defaultPrintArea });

type ViewItem = {
  key: string;
  name: string;
  mockupFile?: File | null;
  mockupUrl?: string | null;
  price?: number | null;
  area: { x: number; y: number; width: number; height: number };
};

type GalleryItem = {
  id: string; // for local keys
  file: File | null;
  url: string | null;
  color: string | null; // Link to product color
};

interface ProductFormProps {
  mode: Mode;
  productId?: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({ mode, productId }) => {
  const router = useRouter();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    image_url: "",
    description: "",
    category: "",
    available_sizes: [] as string[],
    available_colors: [] as string[],
    is_active: true,
    in_stock: true,
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [newColor, setNewColor] = useState("#000000");
  const [colorError, setColorError] = useState<string | null>(null);
  const [views, setViews] = useState<ViewItem[]>([
    { key: "front", name: "Front", area: cloneArea(), mockupFile: null, mockupUrl: null, price: null },
  ]);
  const [activeViewKey, setActiveViewKey] = useState<string>("front");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId || mode === "create" || !token) return;
      setIsFetching(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
        const response = await fetch(`${API_URL}/api/admin/products/${productId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (response.ok) {
          const result = await response.json();
          const productData = result.data;
          const priceValue = productData.base_price?.toString() || "";
          let imageUrl = productData.image_url || "";
          if (imageUrl.startsWith(API_URL)) imageUrl = imageUrl.substring(API_URL.length);

          const parsedColors = typeof productData.available_colors === "string"
            ? JSON.parse(productData.available_colors)
            : (productData.available_colors || []);

          const normalizedColors = (parsedColors as string[])
            .map((c) => {
              if (typeof c !== "string") return null;
              const trimmed = c.trim();
              if (HEX_COLOR_REGEX.test(trimmed)) return trimmed.toUpperCase();
              return NAMED_COLOR_MAP[trimmed] || null;
            })
            .filter((c): c is string => !!c);

          setFormData({
            name: productData.name || "",
            price: priceValue,
            image_url: imageUrl,
            description: productData.description || "",
            category: productData.category || "",
            available_colors: normalizedColors,
            available_sizes: typeof productData.available_sizes === "string"
              ? JSON.parse(productData.available_sizes)
              : (productData.available_sizes || []),
            is_active: Boolean(productData.is_active),
            in_stock: Boolean(productData.in_stock),
          });

          // Build views from product.views (preferred) or legacy mockups/print_areas
          let loadedViews: ViewItem[] = [];
          if (Array.isArray(productData.views) && productData.views.length > 0) {
            loadedViews = productData.views.map((v: any, idx: number) => {
              let price: number | null = null;
              if (v.price !== null && v.price !== undefined && v.price !== "") {
                const parsed = parseFloat(v.price);
                price = isNaN(parsed) ? null : parsed;
              }
              return {
                key: v.key || `view_${idx}`,
                name: v.name || v.key || `View ${idx + 1}`,
                mockupUrl: v.mockup ? (v.mockup.startsWith("/") ? `${API_URL}${v.mockup}` : v.mockup) : null,
                mockupFile: null,
                price: price,
                area: v.area || cloneArea(),
              };
            });
          } else {
            const legacyMockups = productData.mockups || {};
            const legacyAreas = productData.print_areas || {};
            const legacyKeys = Object.keys(legacyMockups).length > 0 ? Object.keys(legacyMockups) : ["front"];
              loadedViews = legacyKeys.map((key: string, idx: number) => ({
                key,
                name: key.charAt(0).toUpperCase() + key.slice(1),
                mockupUrl: legacyMockups[key] ? (legacyMockups[key].startsWith("/") ? `${API_URL}${legacyMockups[key]}` : legacyMockups[key]) : null,
                mockupFile: null,
                price: null,
                area: legacyAreas[key] || cloneArea(),
              }));
          }
            setViews(loadedViews.length > 0 ? loadedViews : [{ key: "front", name: "Front", area: cloneArea(), mockupFile: null, mockupUrl: null, price: null }]);
          setActiveViewKey(loadedViews[0]?.key || "front");

          if (Array.isArray(productData.gallery)) {
            setGallery(productData.gallery.map((g: any, idx: number) => ({
              id: `gallery_${idx}`,
              file: null,
              url: g.url ? (g.url.startsWith("/") ? `${API_URL}${g.url}` : g.url) : null,
              color: g.color || null,
            })));
          }

          if (imageUrl) {
            setImagePreview(imageUrl.startsWith("http") ? imageUrl : `${API_URL}${imageUrl}`);
          }
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchProduct();
  }, [mode, productId, token]);

  const handleImageChange = (file?: File | null) => {
    const f = file || null;
    setSelectedImageFile(f);
  };

  const handleGalleryChange = (id: string, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setGallery((prev) =>
        prev.map((item) => (item.id === id ? { ...item, file, url: reader.result as string } : item))
      );
    };
    reader.readAsDataURL(file);
  };

  const addGalleryItem = () => {
    setGallery((prev) => [...prev, { id: `gallery_${Date.now()}`, file: null, url: null, color: null }]);
  };

  const removeGalleryItem = (id: string) => {
    setGallery((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMockupChange = (key: string, fileList: FileList | null) => {
    const file = fileList?.[0] || null;
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setViews((prev) =>
        prev.map((v) => (v.key === key ? { ...v, mockupFile: file, mockupUrl: reader.result as string } : v))
      );
    };
    reader.readAsDataURL(file);
  };

  const addColor = () => {
    setColorError(null);
    const value = newColor.trim().toUpperCase();
    if (!HEX_COLOR_REGEX.test(value)) {
      setColorError("Use a 6-digit hex value like #1F2937.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      available_colors: prev.available_colors.includes(value) ? prev.available_colors : [...prev.available_colors, value],
    }));
    setNewColor("#000000");
  };

  const removeColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      available_colors: prev.available_colors.filter((c) => c !== color),
    }));
  };

  const updatePrintArea = (key: string, field: "x" | "y" | "width" | "height", value: number) => {
    setViews((prev) =>
      prev.map((v) =>
        v.key === key ? { ...v, area: { ...v.area, [field]: value } } : v
      )
    );
  };

  const addView = () => {
    const newKey = `view_${views.length + 1}`;
    setViews((prev) => [...prev, { key: newKey, name: `View ${prev.length + 1}`, mockupFile: null, mockupUrl: null, area: cloneArea(), price: null }]);
    setActiveViewKey(newKey);
  };

  const removeView = (key: string) => {
    const remaining = views.filter((v) => v.key !== key);
    setViews(remaining.length ? remaining : [{ key: "front", name: "Front", mockupFile: null, mockupUrl: null, area: cloneArea(), price: null }]);
    if (activeViewKey === key) {
      setActiveViewKey(remaining[0]?.key || "front");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (formData.available_colors.length === 0) {
      setColorError("Add at least one color.");
      return;
    }
    setIsLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("base_price", formData.price);
      if (formData.description) formDataToSend.append("description", formData.description);
      if (formData.category) formDataToSend.append("category", formData.category);
      formDataToSend.append("is_active", formData.is_active ? "1" : "0");
      formDataToSend.append("in_stock", formData.in_stock ? "1" : "0");
      formData.available_sizes.forEach((size) => formDataToSend.append("available_sizes[]", size));
      formData.available_colors.forEach((color) => formDataToSend.append("available_colors[]", color));
      if (selectedImageFile) formDataToSend.append("product_image", selectedImageFile);

      views.forEach((view, idx) => {
        formDataToSend.append(`views[${idx}][key]`, view.key);
        formDataToSend.append(`views[${idx}][name]`, view.name);
        formDataToSend.append(`views[${idx}][area][x]`, view.area.x.toString());
        formDataToSend.append(`views[${idx}][area][y]`, view.area.y.toString());
        formDataToSend.append(`views[${idx}][area][width]`, view.area.width.toString());
        formDataToSend.append(`views[${idx}][area][height]`, view.area.height.toString());
        if (view.price !== null && view.price !== undefined) {
          formDataToSend.append(`views[${idx}][price]`, view.price.toString());
        }
        if (view.mockupFile) {
          formDataToSend.append(`views[${idx}][mockup]`, view.mockupFile);
        } else if (view.mockupUrl) {
          formDataToSend.append(`views[${idx}][mockup]`, view.mockupUrl);
        }
      });

      gallery.forEach((item, idx) => {
        if (item.file) {
          formDataToSend.append(`gallery[${idx}][image]`, item.file);
        } else if (item.url) {
          // If it started with API_URL, strip it back
          let cleanUrl = item.url;
          if (cleanUrl.startsWith(API_URL)) cleanUrl = cleanUrl.substring(API_URL.length);
          formDataToSend.append(`gallery[${idx}][url]`, cleanUrl);
        }
        if (item.color) {
          formDataToSend.append(`gallery[${idx}][color]`, item.color);
        }
      });

      const url = mode === "create"
        ? `${API_URL}/api/admin/products`
        : `${API_URL}/api/admin/products/${productId}?_method=PUT`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Failed to save product", err);
        return;
      }

      router.push("/admin/products");
    } catch (err) {
      console.error("Failed to save product", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {mode === "create" ? "Add Product" : "Edit Product"}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
        >
          Back
        </button>
      </div>

      {isFetching ? (
        <div>Loading...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Basics</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name, pricing, category, description.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="e.g. T-Shirt"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  placeholder="Short product description"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Product Image
                </label>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="h-32 w-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  onChange={(e) => handleImageChange(e.target.files?.[0])}
                  className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                />
                <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">Active</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Product visible to sellers</p>
                    </div>
                    <Switch
                      label=""
                      defaultChecked={formData.is_active}
                      onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      color="green"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">In Stock</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Allow ordering</p>
                    </div>
                    <Switch
                      label=""
                      defaultChecked={formData.in_stock}
                      onChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                      color="blue"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Gallery</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add multiple images and link them to colors.</p>
                  </div>
                  <button
                    type="button"
                    onClick={addGalleryItem}
                    className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add Image
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map((item, idx) => (
                    <div key={item.id} className="relative group rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800/50">
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(item.id)}
                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="aspect-square mb-3 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                        {item.url ? (
                          <img src={item.url} alt="Gallery item" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleGalleryChange(item.id, e.target.files?.[0] || null)}
                          className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                        />
                        <div>
                          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Link to Color
                          </label>
                          <select
                            value={item.color || ""}
                            onChange={(e) =>
                              setGallery((prev) =>
                                prev.map((g) => (g.id === item.id ? { ...g, color: e.target.value || null } : g))
                              )
                            }
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          >
                            <option value="">No Color Link</option>
                            {formData.available_colors.map((color) => (
                              <option key={color} value={color}>
                                {color}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full py-8 text-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-500">No gallery images added. Click "Add Image" above.</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          available_sizes: prev.available_sizes.includes(size)
                            ? prev.available_sizes.filter((s) => s !== size)
                            : [...prev.available_sizes, size],
                        }))
                      }
                      className={`rounded px-3 py-1 text-sm ${formData.available_sizes.includes(size)
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Available Colors
                </label>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.available_colors.map((color) => (
                      <div
                        key={color}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60"
                      >
                        <span
                          className="h-6 w-6 rounded border border-gray-200 shadow-inner"
                          style={{ backgroundColor: HEX_COLOR_REGEX.test(color) ? color : "#ffffff" }}
                        />
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{color}</span>
                        <button
                          type="button"
                          onClick={() => removeColor(color)}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {formData.available_colors.length === 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No colors yet. Add at least one hex color.
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="color"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                      className="h-11 w-11 cursor-pointer rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    />
                    <input
                      type="text"
                      value={newColor}
                      onChange={(e) => setNewColor(e.target.value.toUpperCase())}
                      placeholder="#1F2937"
                      className="flex-1 min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={addColor}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      Add Color
                    </button>
                  </div>
                  {colorError && <p className="text-xs text-red-600 dark:text-red-400">{colorError}</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Designers will see these colors in the studio background picker.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Product Views / Sides
                  </label>
                  <button
                    type="button"
                    onClick={addView}
                    className="rounded bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
                  >
                    Add View
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {views.map((view) => (
                    <button
                      key={view.key}
                      type="button"
                      onClick={() => setActiveViewKey(view.key)}
                      className={`rounded px-3 py-1 text-sm ${activeViewKey === view.key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"}`}
                    >
                      {view.name}
                    </button>
                  ))}
                </div>

                {views.map((view) => {
                  if (view.key !== activeViewKey) return null;
                  return (
                    <div key={view.key} className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">View Name</label>
                          <input
                            type="text"
                            value={view.name}
                            onChange={(e) =>
                              setViews((prev) =>
                                prev.map((v) => (v.key === view.key ? { ...v, name: e.target.value } : v))
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">Price (optional)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={view.price ?? ""}
                            onChange={(e) =>
                              setViews((prev) =>
                                prev.map((v) => (v.key === view.key ? { ...v, price: e.target.value === "" ? null : Number(e.target.value) } : v))
                              )
                            }
                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            placeholder="e.g. 19.99"
                          />
                        </div>
                        {views.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeView(view.key)}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1.5">
                          Mockup (PNG recommended)
                        </label>
                        {view.mockupUrl && (
                          <img
                            src={view.mockupUrl}
                            alt={`${view.name} mockup`}
                            className="h-40 w-full object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 mb-3"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                          onChange={(e) => handleMockupChange(view.key, e.target.files)}
                          className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                          Selection Area (percent of mockup)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                          <div className="space-y-3">
                            {(["x", "y", "width", "height"] as const).map((field) => (
                              <div key={field} className="space-y-1">
                                <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 capitalize">
                                  <span>{field}</span>
                                  <span>{view.area[field]}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={field === "width" || field === "height" ? 5 : 0}
                                  max={100}
                                  value={view.area[field]}
                                  onChange={(e) => updatePrintArea(view.key, field, Number(e.target.value))}
                                  className="w-full"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="relative h-64 w-full rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
                            {view.mockupUrl ? (
                              <img
                                src={view.mockupUrl}
                                alt={`${view.name} preview`}
                                className="absolute inset-0 h-full w-full object-contain"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                                Upload mockup to preview
                              </div>
                            )}
                            <div
                              className="absolute border-2 border-brand-500 bg-brand-500/20 rounded"
                              style={{
                                top: `${view.area.y}%`,
                                left: `${view.area.x}%`,
                                width: `${view.area.width}%`,
                                height: `${view.area.height}%`,
                                maxWidth: "100%",
                                maxHeight: "100%",
                              }}
                            />
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          The selection area is where the customer's design will be placed on the mockup inside the studio.
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {isLoading ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
