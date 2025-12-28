import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { ProductDataItem } from "@/components/DataTables/ProductDataTable";

interface EditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: ProductDataItem | null;
    onSave: (id: number, data: any) => Promise<void>;
}

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];

const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6})$/;
const NAMED_COLOR_MAP: Record<string, string> = {
    "White": "#FFFFFF",
    "Black": "#000000",
    "Navy": "#000080",
    "Gray": "#808080",
    "Red": "#FF0000",
    "Blue": "#0000FF",
    "Green": "#008000",
    "Yellow": "#FFFF00",
    "Royal Blue": "#4169E1",
    "Forest Green": "#228B22",
    "Maroon": "#800000",
    "Light Blue": "#ADD8E6",
    "Pink": "#FFC0CB",
    "Natural": "#F5F5DC",
    "Clear": "#FFFFFF",
    "Linen": "#FAF0E6"
};

export const EditProductModal: React.FC<EditProductModalProps> = ({
    isOpen,
    onClose,
    product,
    onSave,
}) => {
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        image_url: "",
        available_sizes: [] as string[],
        available_colors: [] as string[],
    });
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingProduct, setIsFetchingProduct] = useState(false);
    const [newColor, setNewColor] = useState("#000000");
    const [colorError, setColorError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductDetails = async () => {
            if (!product) return;

            setIsFetchingProduct(true);
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                const token = localStorage.getItem('token');

                const response = await fetch(`${API_URL}/api/admin/products/${product.id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json"
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    const productData = result.data;

                    const priceValue = product.price.replace(/[^0-9.]/g, "");

                    let imageUrl = productData.image_url || "";
                    if (imageUrl.startsWith(API_URL)) {
                        imageUrl = imageUrl.substring(API_URL.length);
                    }

                    const parsedColors = typeof productData.available_colors === 'string'
                        ? JSON.parse(productData.available_colors)
                        : (productData.available_colors || []);

                    const normalizedColors = (parsedColors as string[])
                        .map((c) => {
                            if (typeof c !== 'string') return null;
                            const trimmed = c.trim();
                            if (HEX_COLOR_REGEX.test(trimmed)) return trimmed.toUpperCase();
                            return NAMED_COLOR_MAP[trimmed] || null;
                        })
                        .filter((c): c is string => !!c);

                    setFormData({
                        name: productData.name,
                        price: priceValue,
                        image_url: imageUrl,
                        available_colors: normalizedColors,
                        available_sizes: typeof productData.available_sizes === 'string'
                            ? JSON.parse(productData.available_sizes)
                            : (productData.available_sizes || []),
                    });

                    if (imageUrl) {
                        setImagePreview(product.image);
                    }
                } else {
                    console.error("Failed to fetch product details");
                }
            } catch (error) {
                console.error("Error fetching product details:", error);
            } finally {
                setIsFetchingProduct(false);
            }
        };

        fetchProductDetails();
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        if (formData.available_colors.length === 0) {
            setColorError("Add at least one color for the studio background.");
            return;
        }

        setIsLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const token = localStorage.getItem('token');

            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('base_price', formData.price);
            formData.available_sizes.forEach(size => {
                formDataToSend.append('available_sizes[]', size);
            });
            formData.available_colors.forEach(color => {
                formDataToSend.append('available_colors[]', color);
            });

            if (selectedImageFile) {
                formDataToSend.append('product_image', selectedImageFile);
            }

            const response = await fetch(`${API_URL}/api/admin/products/${product.id}?_method=PUT`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/json"
                },
                body: formDataToSend
            });

            if (response.ok) {
                const result = await response.json();
                await onSave(product.id, result.data);
                onClose();
            } else {
                const errorText = await response.text();
                console.error("Failed to update product:", response.status, errorText);
            }
        } catch (error) {
            console.error("Failed to update product:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSize = (size: string) => {
        setFormData(prev => ({
            ...prev,
            available_sizes: prev.available_sizes.includes(size)
                ? prev.available_sizes.filter(s => s !== size)
                : [...prev.available_sizes, size]
        }));
    };

    const addColor = () => {
        setColorError(null);
        const value = newColor.trim().toUpperCase();
        if (!HEX_COLOR_REGEX.test(value)) {
            setColorError("Use a 6-digit hex value like #1F2937.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            available_colors: prev.available_colors.includes(value)
                ? prev.available_colors
                : [...prev.available_colors, value]
        }));
        setNewColor("#000000");
    };

    const removeColor = (color: string) => {
        setFormData(prev => ({
            ...prev,
            available_colors: prev.available_colors.filter(c => c !== color)
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
            <div className="p-6">
                <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Edit Product
                    </h3>
                </div>
                {isFetchingProduct ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-gray-500">Loading product details...</div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                Product Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-500"
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
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-500 focus:ring-0 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-500"
                                required
                            />
                        </div>

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
                                onChange={handleImageChange}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                            />
                            <p className="mt-1 text-xs text-gray-500">Accepted formats: JPEG, PNG, JPG, GIF, WEBP (Max: 5MB)</p>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                                Available Sizes
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_SIZES.map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => toggleSize(size)}
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
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {formData.available_colors.map((color) => (
                                        <div
                                            key={color}
                                            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800/60"
                                        >
                                            <span
                                                className="h-6 w-6 rounded border border-gray-200 shadow-inner"
                                                style={{ backgroundColor: HEX_COLOR_REGEX.test(color) ? color : '#ffffff' }}
                                                aria-label={`Color ${color}`}
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
                                {colorError && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{colorError}</p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Designers will see these colors in the studio background picker.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                            >
                                {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};
