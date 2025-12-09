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
const AVAILABLE_COLORS = ["White", "Black", "Navy", "Gray", "Red", "Blue", "Green", "Yellow"];

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

                    setFormData({
                        name: productData.name,
                        price: priceValue,
                        image_url: imageUrl,
                        available_colors: typeof productData.available_colors === 'string'
                            ? JSON.parse(productData.available_colors)
                            : (productData.available_colors || []),
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

    const toggleColor = (color: string) => {
        setFormData(prev => ({
            ...prev,
            available_colors: prev.available_colors.includes(color)
                ? prev.available_colors.filter(c => c !== color)
                : [...prev.available_colors, color]
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
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => toggleColor(color)}
                                        className={`rounded px-3 py-1 text-sm ${formData.available_colors.includes(color)
                                            ? "bg-brand-500 text-white"
                                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                            }`}
                                    >
                                        {color}
                                    </button>
                                ))}
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
