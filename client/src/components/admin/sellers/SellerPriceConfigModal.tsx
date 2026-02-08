import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Seller } from "@/types/datatable";
import { useAuth } from "@/context/AuthContext";
import { getImageUrl } from "@/lib/utils";

interface Product {
    id: number;
    name: string;
    image_url?: string;
    base_price: string;
}

interface SellerPriceConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    seller: Seller;
}

export default function SellerPriceConfigModal({ isOpen, onClose, seller }: SellerPriceConfigModalProps) {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [prices, setPrices] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";

            // Fetch all products
            const productsRes = await fetch(`${API_URL}/api/admin/products?per_page=100`, {
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
            });

            // Fetch existing seller prices
            // Assuming endpoint: /api/admin/sellers/:id/products
            const pricesRes = await fetch(`${API_URL}/api/admin/sellers/${seller.id}/products`, {
                headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" }
            });

            if (productsRes.ok) {
                const productData = await productsRes.json();
                setProducts(productData.data || []);
            }

            if (pricesRes.ok) {
                const pricesData = await pricesRes.json();
                // Assuming data structure: { data: [{ product_id: 1, price: 50 }, ...] }
                const priceMap: Record<number, string> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                pricesData.data?.forEach((item: any) => {
                    priceMap[item.product_id] = item.price;
                });
                setPrices(priceMap);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (productId: number, val: string) => {
        setPrices(prev => ({ ...prev, [productId]: val }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.podnit.com";
            const payload = {
                products: Object.entries(prices).map(([productId, price]) => ({
                    product_id: parseInt(productId),
                    price: parseFloat(price)
                })).filter(item => !isNaN(item.price))
            };

            const response = await fetch(`${API_URL}/api/admin/sellers/${seller.id}/products`, {
                method: "POST", // or PUT
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                onClose();
            } else {
                console.error("Failed to save prices");
            }
        } catch (error) {
            console.error("Error saving prices:", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 flex flex-col h-full overflow-hidden">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                        Manage Product Prices for {seller.name}
                    </h3>
                    <p className="text-sm text-gray-500">Set specific prices for this seller per product.</p>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Search Bar */}
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search products..."
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-primary"
                                onChange={(e) => {
                                    const term = e.target.value.toLowerCase();
                                    const rows = document.querySelectorAll('.product-row');
                                    rows.forEach((row) => {
                                        const name = row.getAttribute('data-name')?.toLowerCase() || '';
                                        if (name.includes(term)) {
                                            (row as HTMLElement).style.display = '';
                                        } else {
                                            (row as HTMLElement).style.display = 'none';
                                        }
                                    });
                                }}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700">Product</th>
                                        <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 w-32">Base Price</th>
                                        <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 w-48">Seller Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
                                    {products.map(product => (
                                        <tr key={product.id} className="product-row hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" data-name={product.name}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={getImageUrl(product.image_url)}
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white text-base">{product.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {product.id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    {product.base_price} DH
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Default"
                                                        value={prices[product.id] || ''}
                                                        onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-right pr-8 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:bg-gray-800 dark:border-gray-600 dark:text-white transition-all shadow-sm"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">DH</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || loading}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
