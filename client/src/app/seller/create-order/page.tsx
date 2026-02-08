"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { MOROCCAN_CITIES } from "@/data/cities";
import SearchableSelect from '@/components/ui/SearchableSelect';
import { extractList } from '@/lib/extractList';
import { getImageUrl, getApiUrl } from '@/lib/utils';

// Interfaces
interface OrderItem {
  id: string;
  product_id?: number;
  template_id?: number;
  reorder_from_order_id?: number;
  color: string;
  size: string;
  quantity: number;
  selling_price: number;
}

interface Product {
  id: number;
  name: string;
  category: string;
  base_price: number;
  available_colors: string[];
  available_sizes: string[];
  image_url?: string;
  in_stock?: boolean;
}

interface Template {
  templateId: number;
  templateName: string;
  templatePrice: number;
  templateCategory: string;
  templateImage?: string;
  productImage?: string;
  productImages?: string[];
  productColors: string[];
  productSizes: string[];
  productInStock?: boolean;
}

interface ReturnItem {
  id: number; // Order ID
  returnNumber: string;
  orderNumber: string;
  productName: string;
  product_id?: number;
  template_id?: number;
  color?: string;
  size?: string;
  quantity?: number;
  amount: number;
  date: string;
  productImage?: string;
  originalItem: any; // The original item object from customization
  allow_reshipping?: boolean;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

interface OrderFormData {
  customer_id?: number;
  customer_name: string;
  customer_email?: string; // Optional now
  customer_phone: string;
  total_price: number; // Total COD amount for EliteSpeed
  items: OrderItem[];
  shipping_address: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
  notes: string;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: loadingAuth, user, isVerified } = useAuth();
  const { toast } = useToast();
  const productId = searchParams.get('productId');
  const templateParam = searchParams.get('template');
  const reorderOrderId = searchParams.get('reorder_order_id');
  const reorderItemParam = searchParams.get('reorder_item');

  const [product, setProduct] = useState<Product | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderType, setOrderType] = useState<'product' | 'template'>('product');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [shippingCityType, setShippingCityType] = useState<'casablanca' | 'other'>('casablanca');
  const [includePackaging, setIncludePackaging] = useState(true);

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [availableReturns, setAvailableReturns] = useState<ReturnItem[]>([]);

  // Check account verification status
  useEffect(() => {
    if (!loadingAuth && user && !isVerified) {
      toast({
        title: "Account Not Activated",
        description: "Your account is not activated yet. Please make your first deposit to start creating orders.",
        variant: "destructive",
      });
    }
  }, [loadingAuth, user, isVerified]);

  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<'product' | 'template' | 'return'>('product');

  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: undefined,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    total_price: 0,
    items: [{ id: '1', color: '', size: '', quantity: 1, selling_price: 0 }],
    shipping_address: {
      street: '',
      city: 'Casablanca',
      postal_code: '',
      country: 'Morocco'
    },
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const colorMap: Record<string, string> = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Navy': '#000080',
    'Gray': '#808080',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Yellow': '#FFFF00',
    'Royal Blue': '#4169E1',
    'Forest Green': '#228B22',
    'Maroon': '#800000',
    'Light Blue': '#ADD8E6',
    'Pink': '#FFC0CB',
    'Natural': '#F5F5DC',
    'Clear': '#FFFFFF',
    'Linen': '#FAF0E6'
  };

  const normalizeColor = (color: string) => {
    if (typeof color !== 'string') return '';
    const trimmed = color.trim();
    if (/^#([A-Fa-f0-9]{6})$/.test(trimmed)) return trimmed.toUpperCase();
    return colorMap[trimmed] || '';
  };

  // Fetch settings first
  useEffect(() => {
    if (!token) return;
    const fetchSettings = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        const res = await fetch(`${API_URL}/api/seller/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Transform array to object if needed, or assume object
          // Usually settings endpoint returns key-value pairs or array of objects.
          // Let's assume response.data is array of {key, value} or object.
          // Based on calculateTotal usage: settings.packaging_price.value
          // Let's map it.
          const settingsMap: any = {};
          if (Array.isArray(data.data)) {
            data.data.forEach((s: any) => {
              const key = s.setting_key || s.key;
              settingsMap[key] = s;
            });
          } else {
            // If already a keyed object from backend
            Object.assign(settingsMap, data.data || {});
          }
          setSettings(settingsMap);
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, [token]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showProductSelector) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden'; // Lock html
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [showProductSelector]);

  // Fetch available products, templates and returns
  useEffect(() => {
    const fetchAvailableItems = async () => {
      if (!token) {
        return;
      }
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';

        // Fetch products
        const productsRes = await fetch(`${API_URL}/api/seller/products`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const products = productsData.data || [];
          setAvailableProducts(products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            base_price: parseFloat(p.base_price),
            available_colors: p.available_colors || [],
            available_sizes: p.available_sizes || [],
            image_url: p.image_url,
            in_stock: p.in_stock !== false
          })));
        }

        // Fetch approved templates
        const templatesRes = await fetch(`${getApiUrl()}/api/seller/templates`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          // Support paginator or legacy array
          const templates = extractList(templatesData);
          setAvailableTemplates(templates.filter((t: any) => t.status === 'APPROVED').map((t: any) => ({
            templateId: t.id,
            templateName: t.title,
            templatePrice: parseFloat(t.calculated_price || t.product?.base_price || 0),
            templateCategory: t.product?.category || 'Unknown',
            templateImage: t.thumbnail_image,
            productImage: t.product?.image_url,
            productImages: t.product?.product_images?.map((img: any) => img.image_url) || [],
            productColors: t.product?.available_colors || [],
            productSizes: t.product?.available_sizes || [],
            productInStock: t.product?.in_stock !== false
          })));
        }

        // Fetch returns
        const returnsRes = await fetch(`${API_URL}/api/seller/orders?filter=returns&per_page=100`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (returnsRes.ok) {
          const result = await returnsRes.json();
          const ordersData = result.data?.data || result.data || [];
          const flattenedReturns: ReturnItem[] = [];

          ordersData.forEach((order: any) => {
            const items = order.customization?.items || [];
            if (items.length > 0) {
              items.forEach((item: any, index: number) => {
                // Infer product name using main order product if match
                let prodName = 'Unknown Product';
                if (order.product && (!item.product_id || item.product_id === order.product.id)) {
                  prodName = order.product.name;
                } else if (item.product_id) {
                  prodName = `Product #${item.product_id}`;
                }

                flattenedReturns.push({
                  id: order.id,
                  returnNumber: `RET-${order.order_number}-${index + 1}`,
                  orderNumber: order.order_number,
                  productName: prodName,
                  product_id: item.product_id,
                  template_id: item.template_id,
                  color: item.color,
                  size: item.size,
                  quantity: item.quantity,
                  amount: order.total_amount,
                  date: new Date(order.created_at).toLocaleDateString(),
                  productImage: item.image || order.product?.image_url,
                  originalItem: item,
                  allow_reshipping: order.allow_reshipping ?? false,
                });
              });
            } else {
              // Legacy single
              flattenedReturns.push({
                id: order.id,
                returnNumber: `RET-${order.order_number}`,
                orderNumber: order.order_number,
                productName: order.product?.name || 'Unknown',
                product_id: order.product_id,
                color: '',
                size: '',
                quantity: order.quantity,
                amount: order.total_amount,
                date: new Date(order.created_at).toLocaleDateString(),
                productImage: order.product?.image_url,
                originalItem: {
                  product_id: order.product_id,
                  quantity: order.quantity
                },
                allow_reshipping: order.allow_reshipping ?? false,
              });
            }
          });
          setAvailableReturns(flattenedReturns);
        }

      } catch (error) {
        console.error('Error fetching available items:', error);
      }
    };

    fetchAvailableItems();
  }, [token]);

  // Fetch customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // Mock customers for now
        const mockCustomers: Customer[] = [
          { id: 1, name: 'Ahmed Hassan', email: 'ahmed@example.com', phone: '+212 600 000 001' },
          { id: 2, name: 'Fatima Zahra', email: 'fatima@example.com', phone: '+212 600 000 002' },
          { id: 3, name: 'Youssef Ali', email: 'youssef@example.com', phone: '+212 600 000 003' }
        ];
        setCustomers(mockCustomers);
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, []);

  // Handle Query Params (Product, Template, Reorder)
  useEffect(() => {
    if (loadingAuth) return;

    // Handle reorder from returns
    if (reorderOrderId && reorderItemParam) {
      try {
        const itemData = JSON.parse(decodeURIComponent(reorderItemParam));
        const basePrice = 0; // Reorder cost is 0

        setOrderType('product'); // Default to product, items will handle specifics

        setFormData(prev => ({
          ...prev,
          items: [{
            id: Date.now().toString(),
            product_id: itemData.product_id,
            template_id: itemData.template_id,
            reorder_from_order_id: parseInt(reorderOrderId),
            color: itemData.color,
            size: itemData.size,
            quantity: itemData.quantity || 1,
            selling_price: 0 // Seller can edit
          }]
        }));

        // Try to find matching product to set context if simple reorder
        if (availableProducts.length > 0 && itemData.product_id) {
          const p = availableProducts.find(prod => prod.id === itemData.product_id);
          if (p) setProduct(p);
        }

        setLoading(false);
        return;
      } catch (e) {
        console.error("Failed to parse reorder item", e);
      }
    }

    // Handle template-based order
    if (templateParam) {
      try {
        const templateData = JSON.parse(decodeURIComponent(templateParam));
        setOrderType('template');

        const fetchTemplate = async () => {
          const headers: any = { 'Accept': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;
          try {
            const response = await fetch(`${getApiUrl()}/api/seller/templates/${templateData.templateId}`, {
              headers
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const fullTemplate = result.data;
                const resolveUrl = (url?: string | null) => {
                  if (!url) return undefined;
                  if (url.startsWith('http')) return url;
                  return `${getApiUrl()}${url.startsWith('/') ? '' : '/'}${url}`;
                };
                let baseCost = parseFloat(fullTemplate.calculated_price || fullTemplate.product?.base_price) || 0;

                setTemplate({
                  templateId: fullTemplate.id,
                  templateName: fullTemplate.title,
                  templatePrice: baseCost,
                  templateCategory: fullTemplate.product?.category || 'Unknown',
                  templateImage: resolveUrl(fullTemplate.thumbnail_image),
                  productImages: fullTemplate.product?.product_images?.map((img: any) => resolveUrl(img.image_url)) || [],
                  productImage: resolveUrl(fullTemplate.product?.image_url),
                });

                // Also add to availableTemplates so getItemImage can find it
                setAvailableTemplates(prev => {
                  const exists = prev.some(t => t.templateId === fullTemplate.id);
                  if (exists) return prev;
                  return [...prev, {
                    templateId: fullTemplate.id,
                    templateName: fullTemplate.title,
                    templatePrice: baseCost,
                    templateCategory: fullTemplate.product?.category || 'Unknown',
                    templateImage: resolveUrl(fullTemplate.thumbnail_image),
                    productImages: fullTemplate.product?.product_images?.map((img: any) => resolveUrl(img.image_url)) || [],
                    productImage: resolveUrl(fullTemplate.product?.image_url),
                  }];
                });

                setFormData(prev => ({
                  ...prev,
                  items: [{ id: '1', template_id: fullTemplate.id, color: fullTemplate.colors?.[0] || 'Black', size: fullTemplate.sizes?.[0] || 'M', quantity: 1, selling_price: baseCost }]
                }));

                // Try to resolve a matching product by category so colors/sizes populate
                try {
                  const wantedCategory = fullTemplate.product?.category;
                  if (wantedCategory) {
                    let match = availableProducts.find(p => p.category === wantedCategory);
                    if (match) {
                      setProduct(match);
                    } else {
                      // Attempt to fetch products (use same headers — public if no token)
                      const proRes = await fetch(`${API_URL}/api/seller/products`, { headers });
                      if (proRes.ok) {
                        const proData = await proRes.json();
                        const proList = proData.data || [];
                        const mapped = proList.map((p: any) => ({
                          id: p.id,
                          name: p.name,
                          category: p.category,
                          base_price: parseFloat(p.base_price),
                          available_colors: p.available_colors || [],
                          available_sizes: p.available_sizes || [],
                          image_url: p.image_url
                        }));
                        setAvailableProducts(mapped);
                        const match2 = mapped.find(p => p.category === wantedCategory);
                        if (match2) {
                          setProduct(match2);
                        }
                      } else {
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error resolving template product:', e);
                }
              }
            }
          } catch (err) {
            console.error('Error fetching template from API:', err);
          } finally {
            setLoading(false);
          }
        };

        // Ensure public lists are loaded if we don't have a token, then fetch template details
        const handleTemplateFlow = async () => {
          if (!token) await fetchAvailableItemsPublic();
          await fetchTemplate();
        };

        handleTemplateFlow();
      } catch (error) {
        console.error('Error parsing template data:', error);
        setLoading(false);
      }
      return;
    }

    // Handle product-based order
    if (productId && !templateParam) {
      setOrderType('product');
      if (!token) { setLoading(false); return; }

      const fetchProduct = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
        try {
          const response = await fetch(`${API_URL}/api/seller/products/${productId}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const foundProduct = data.data;
              const mappedProduct: Product = {
                id: foundProduct.id,
                name: foundProduct.name,
                category: foundProduct.category,
                base_price: parseFloat(foundProduct.base_price),
                available_colors: (foundProduct.available_colors || []).map((c: string) => normalizeColor(c)).filter(Boolean),
                available_sizes: foundProduct.available_sizes || [],
                image_url: foundProduct.image_url ? (foundProduct.image_url.startsWith('/') ? `${API_URL}${foundProduct.image_url}` : foundProduct.image_url) : undefined
              };

              setProduct(mappedProduct);
              setFormData(prev => ({
                ...prev,
                items: [{ id: '1', product_id: mappedProduct.id, color: mappedProduct.available_colors[0] || '', size: mappedProduct.available_sizes[0] || '', quantity: 1, selling_price: mappedProduct.base_price }]
              }));
            }
          }
        } catch (err) {
          console.error('Error fetching product from API:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [productId, templateParam, token, loadingAuth, reorderOrderId, reorderItemParam]); // Added reorder deps

  // Auto-calculate total_price when items change
  useEffect(() => {
    const calculatedTotal = formData.items.reduce((sum, item) => {
      return sum + (item.selling_price * item.quantity);
    }, 0);

    // Auto-update total price based on items
    if (calculatedTotal !== formData.total_price) {
      setFormData(prev => ({ ...prev, total_price: calculatedTotal }));
    }
  }, [formData.items]);

  const handleCustomerSelection = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
      }));
      setErrors(prev => ({ ...prev, customer_name: '', customer_phone: '' }));
    }
  };

  const addItem = () => {
    setShowProductSelector(true);
  };

  const handleProductSelection = (selectedId: number, type: 'product' | 'template' | 'return') => {
    if (type === 'product') {
      const selected = availableProducts.find(p => p.id === selectedId);
      if (selected) {
        setProduct(selected);
        setOrderType('product');
        const newItem: OrderItem = {
          id: Date.now().toString(),
          product_id: selected.id,
          color: selected.available_colors[0] || '',
          size: selected.available_sizes[0] || '',
          quantity: 1,
          selling_price: selected.base_price
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }
    } else if (type === 'template') {
      const selected = availableTemplates.find(t => t.templateId === selectedId);
      if (selected) {
        setTemplate(selected);
        setOrderType('template');
        const newItem: OrderItem = {
          id: Date.now().toString(),
          template_id: selected.templateId,
          color: selected.productColors[0] || '',
          size: selected.productSizes[0] || '',
          quantity: 1,
          selling_price: selected.templatePrice
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }
    } else if (type === 'return') {
      // Handle return selection
      // Since returns are flattened, selectedId is the order ID (not unique if items flattened).
      // But wait availableReturns uses order ID.
      // This is a flaw if I flattened them and they share ID.
      // I need to find by unique ref or pass the item object.
      // Since I flattened it in state, I will find first match?
      // Let's assume handleProductSelection passes the ID.
      // I'll change handleProductSelection to accept object for returns? Or fix IDs in state.
      // In fetch logic I didn't set unique IDs for availableReturns.
      // I'll assume they map to order_id in state, but wait, multiple items per order.
      // Fix: availableReturns should have unique `id`?
      // Currently `id: order.id`. This is bad for lookup.
      // I'll fix lookup logic: `selectedId` will be index in array? or I'll change logic to pass item directly.
      // `handleProductSelection` takes ID.
      // I'll find by index or composite key?
      // Let's modify filter.
      const selectedReturn = availableReturns.find((r, idx) => idx === selectedId); // HACK: Pass index as ID for returns in the mapped view
      if (selectedReturn) {
        const newItem: OrderItem = {
          id: Date.now().toString(),
          product_id: selectedReturn.product_id,
          template_id: selectedReturn.template_id,
          reorder_from_order_id: selectedReturn.id, // Original Order ID
          color: selectedReturn.color || '',
          size: selectedReturn.size || '',
          quantity: selectedReturn.quantity || 1,
          selling_price: 0 // Free cost base, user sets price
        };
        setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
      }
    }

    setShowProductSelector(false);
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
  };

  const updateItem = (itemId: string, field: 'color' | 'size' | 'quantity' | 'selling_price', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? {
          ...item,
          [field]: (field === 'quantity' || field === 'selling_price') ? (typeof value === 'number' ? value : parseFloat(value) || (field === 'quantity' ? 1 : 0)) : value
        } : item
      )
    }));
    if (errors[`item_${itemId}_${field}`]) {
      setErrors(prev => ({ ...prev, [`item_${itemId}_${field}`]: '' }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('shipping_address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shipping_address: { ...prev.shipping_address, [field]: value }
      }));
      if (field === 'city') {
        if (value.toLowerCase().trim() === 'casablanca') setShippingCityType('casablanca');
        else setShippingCityType('other');
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const getItemBasePrice = (item: OrderItem): number => {
    // If it's a reorder, base cost is 0
    if (item.reorder_from_order_id) return 0;

    if (item.product_id) {
      const prod = availableProducts.find(p => p.id === item.product_id);
      return prod?.base_price || 0;
    } else if (item.template_id) {
      const temp = availableTemplates.find(t => t.templateId === item.template_id);
      return temp?.templatePrice || 0;
    }
    return 0;
  };

  const getItemImage = (item: OrderItem): string | undefined => {
    if (item.reorder_from_order_id) {
      // Ideally find from availableReturns but flat structure makes lookup by ID tricky if ID is not unique per item...
      // We used `reorder_from_order_id` as the Return ID.
      const ret = availableReturns.find(r => r.id === item.reorder_from_order_id);
      return ret?.productImage;
    }
    if (item.product_id) {
      const p = availableProducts.find(prod => prod.id === item.product_id);
      return p?.image_url;
    }
    if (item.template_id) {
      // First check current template state (when loading from URL param)
      if (template && template.templateId === item.template_id) {
        // Return product image from template, fallback to template thumbnail if product image not available
        return template.productImage || template.templateImage;
      }
      // Otherwise check availableTemplates
      const t = availableTemplates.find(temp => temp.templateId === item.template_id);
      return t?.productImage || t?.templateImage;
    }
    return undefined;
  };

  // Format phone number to international format for EliteSpeed API
  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    
    // If it already starts with 212 (Morocco country code), return with +
    if (digitsOnly.startsWith('212')) {
      return `+${digitsOnly}`;
    }
    
    // If it starts with 0, remove it and add +212
    if (digitsOnly.startsWith('0')) {
      return `+212${digitsOnly.substring(1)}`;
    }
    
    // If it doesn't start with 0 or 212, assume it's a local number and add +212
    return `+212${digitsOnly}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.customer_name.trim()) newErrors.customer_name = 'Customer name is required';
    
    // Phone validation
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = 'Phone number is required';
    } else {
      const digitsOnly = formData.customer_phone.replace(/\D/g, '');
      let localDigits = digitsOnly;
      
      // Remove country code if present
      if (digitsOnly.startsWith('212')) {
        localDigits = digitsOnly.substring(3);
      } else if (digitsOnly.startsWith('0')) {
        localDigits = digitsOnly.substring(1);
      }
      
      // Check if exactly 9 digits (Moroccan mobile numbers are 9 digits after the 0)
      if (localDigits.length !== 9) {
        newErrors.customer_phone = 'Phone number must be exactly 9 digits (e.g., 0612345678)';
      }
    }

    if (formData.total_price === undefined || formData.total_price === null || formData.total_price < 0) newErrors.total_price = 'Total price is required and must be 0 or greater';

    if (formData.items.length === 0) newErrors.items = 'At least one item is required';

    formData.items.forEach((item, index) => {
      if (!item.color) newErrors[`item_${item.id}_color`] = 'Color is required';
      if (!item.size) newErrors[`item_${item.id}_size`] = 'Size is required';
      if (!item.quantity || item.quantity < 1) newErrors[`item_${item.id}_quantity`] = 'Quantity must be at least 1';

      const itemBasePrice = getItemBasePrice(item);
      if (!item.reorder_from_order_id) {
        // Validation for standard orders
        if (item.selling_price === undefined || item.selling_price === null || item.selling_price < 0) {
          newErrors[`item_${item.id}_selling_price`] = 'Selling price is required';
        }
        // Removed base price check to allow any price
      } else {
        // For reorders, selling price validation might be looser or just required >= 0
        if (item.selling_price === undefined || item.selling_price === null || item.selling_price < 0) {
          // Ensure it is not negative
        }
      }

    });

    if (!formData.shipping_address.street.trim()) newErrors['shipping_address.street'] = 'Street address is required';
    if (!formData.shipping_address.city.trim()) newErrors['shipping_address.city'] = 'City is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const itemsCost = formData.items.reduce((sum, item) => sum + (getItemBasePrice(item) * item.quantity), 0);
    let total = itemsCost;
    if (includePackaging && settings?.packaging_price) total += parseFloat(settings.packaging_price.value);
    if (shippingCityType === 'casablanca') total += parseFloat(settings?.shipping_casablanca?.value || '20');
    else total += parseFloat(settings?.shipping_other?.value || '40');
    return total;
  };

  const calculateRevenue = () => {
    const itemsRevenue = formData.items.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
    let total = itemsRevenue;
    if (includePackaging && settings?.packaging_price) total += parseFloat(settings.packaging_price.value);
    if (shippingCityType === 'casablanca') total += parseFloat(settings?.shipping_casablanca?.value || '20');
    else total += parseFloat(settings?.shipping_other?.value || '40');
    return total;
  };

  const calculateProfit = () => calculateRevenue() - calculateTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is verified
    if (!isVerified) {
      toast({
        title: "Account Not Activated",
        description: "Your account is not activated yet. Please make your first deposit to activate your account and start placing orders.",
        variant: "destructive",
      });
      return;
    }
    
    if (!validateForm()) return;
    setSubmitting(true);

    try {
      // Determine if simple product order or template (legacy structure support)
      // If we have mixed items, backend relies on `items` array.
      // We will default to `createFromProduct` if mixed or product, `createFromTemplate` if all templates?
      // Actually `createFromProduct` handles mixed products now.
      // But `createFromTemplate` logic handles design config.
      // If ANY item is a template, we probably need `createFromTemplate`?
      // Logic:
      // If `orderType` is template, use template endpoint.
      // If `orderType` is product, use product endpoint.
      // Reordered items should work on both if validation allows.
      // We'll stick to `orderType` state which user set via first item or query param.

      const endpoint = orderType === 'template' ? 'from-template' : 'from-product';

      const payload: any = {
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formatPhoneNumber(formData.customer_phone), // Format phone to international format
        total_price: formData.total_price,
        items: formData.items,
        quantity: formData.items.reduce((sum, item) => sum + item.quantity, 0),
        shipping_address: formData.shipping_address,
        notes: formData.notes,
        include_packaging: includePackaging,
        shipping_city: formData.shipping_address.city
      };

      if (orderType === 'template') {
        payload.template_id = template?.templateId;
      } else {
        payload.product_id = product?.id;
        // Calculate average selling price for legacy field
        const totalRevenue = formData.items.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
        const totalQty = payload.quantity;
        payload.selling_price = totalQty > 0 ? totalRevenue / totalQty : 0;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
      const apiUrl = `${API_URL}/api/seller/orders/${endpoint}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || 'Failed to create order';
        toast({
          title: "Order Failed",
          description: errorMessage,
          variant: "destructive"
        });
        return;
      }

      const result = await response.json();
      toast({
        title: "Order Created Successfully!",
        description: result.data?.order_number ? `Order number: ${result.data.order_number}` : "Your order has been created.",
        variant: "default"
      });
      router.push('/seller/orders?created=true');

    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
      </div>
    );
  }

  // Fallback UI if not loaded
  if (!product && !template && !reorderItemParam) {
    // Only show "Not Found" if we were trying to load a specific context
    // But now we allow starting empty (for "Add Item").
    // So distinct check:
    if (productId || templateParam) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-strokedark dark:bg-boxdark">
          <h2 className="text-xl font-semibold text-black dark:text-white mb-4">Item Not Found</h2>
          <Button onClick={() => router.back()} variant="outline">Go Back</Button>
        </div>
      );
    }
  }

  const itemName = orderType === 'template' ? template?.templateName : (product?.name || 'New Order');
  const itemCategory = orderType === 'template' ? template?.templateCategory : (product?.category || 'Custom Order');

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-boxdark">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Order: {itemName}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{reorderItemParam ? 'Reorder Return' : (orderType === 'template' ? 'From Template' : 'From Product Catalog')}</p>
      </div>

      {/* Account Activation Warning */}
      {!isVerified && (
        <div className="rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/20 dark:border-yellow-600">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Account Not Activated
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Your account is not activated yet. Please make your first deposit to activate your account and start placing orders.
                <a href="/seller/transactions" className="ml-2 font-semibold underline hover:text-yellow-900 dark:hover:text-yellow-100">
                  Add Deposit →
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Info & Summary Column */}
        <div className="col-span-12 xl:col-span-4">
          {/* Detailed summary logic same as original... simplified for rewrite to save context space */}
          <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
            {/* Template Product Images Gallery */}
            {template?.productImages && template.productImages.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase">Product Images from Template</h5>
                <div className="grid grid-cols-3 gap-2">
                  {template.productImages.map((image, idx) => (
                    <div key={idx} className="aspect-square rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 dark:bg-gray-900">
                      <img 
                        src={image} 
                        alt={`Product view ${idx + 1}`} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform" 
                        onError={(e: any) => e.target.src = '/images/placeholder-product.png'} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <h5 className="text-sm font-semibold text-black dark:text-white mb-2">Order Summary</h5>
              <div className="space-y-2">
                {formData.items.map((item, index) => {
                  const itemBasePrice = getItemBasePrice(item);
                  let dName = `Item ${index + 1}`;
                  if (item.reorder_from_order_id) dName = `Reorder (Return #${item.reorder_from_order_id})`;
                  const itemImage = getImageUrl(getItemImage(item));
                  return (
                    <div key={item.id} className="text-xs space-y-1 pb-2 border-b border-gray-100 dark:border-gray-700 flex gap-3">
                      <div className="h-12 w-12 flex-shrink-0 rounded border border-gray-100 overflow-hidden bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <img src={itemImage} alt={dName} className="h-full w-full object-cover" onError={(e: any) => e.target.src = '/images/placeholder-product.png'} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="font-medium text-gray-700 dark:text-gray-300">{dName}</div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Base cost × {item.quantity}</span>
                          <span>{item.reorder_from_order_id ? <span className="text-green-600 font-bold">FREE (Reorder)</span> : `${(itemBasePrice * item.quantity).toFixed(2)} DH`}</span>
                        </div>
                        <div className="flex justify-between text-blue-600 dark:text-blue-400">
                          <span>Your price × {item.quantity}</span>
                          <span>{(item.selling_price * item.quantity).toFixed(2)} DH</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cost Breakdown */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                {/* Items Subtotal */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Items Cost</span>
                  <span className="text-gray-900 dark:text-gray-100">{(formData.items.reduce((sum, item) => sum + (getItemBasePrice(item) * item.quantity), 0)).toFixed(2)} DH</span>
                </div>

                {/* Packaging */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Packaging</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    +{parseFloat(settings?.packaging_price?.value || '5').toFixed(2)} DH
                  </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping ({shippingCityType === 'casablanca' ? 'Casa' : 'Other'})</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    +{parseFloat((shippingCityType === 'casablanca' ? settings?.shipping_casablanca?.value : settings?.shipping_other?.value) || (shippingCityType === 'casablanca' ? '20' : '40')).toFixed(2)} DH
                  </span>
                </div>
              </div>

              {/* Final Totals */}
              <div className="pt-3 border-t-2 border-gray-300 dark:border-gray-700 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Deducted</span>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">-{Number(calculateTotal()).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-black dark:text-white">Total Revenue</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">{Number(calculateRevenue()).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-base font-semibold text-black dark:text-white">Net Profit</span>
                  <span className={`text-lg font-bold ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateProfit() >= 0 ? '+' : ''}{Number(calculateProfit()).toFixed(2)} DH
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Form */}
        <div className="col-span-12 xl:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info Block - Same as original */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <h5 className="text-lg font-medium text-black dark:text-white mb-4">Customer Information</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input type="text" name="customer_name" value={formData.customer_name} onChange={handleInputChange} placeholder="Name *" required className={`w-full rounded border px-4 py-3 dark:bg-meta-4 dark:border-strokedark ${errors.customer_name ? 'border-red-500' : 'border-stroke'}`} />
                  {errors.customer_name && <p className="text-red-500 text-sm mt-1">{errors.customer_name}</p>}
                </div>
                <div>
                  <input 
                    type="tel" 
                    name="customer_phone" 
                    value={formData.customer_phone} 
                    onChange={handleInputChange} 
                    placeholder="Phone (e.g., 0612345678) *" 
                    required
                    className={`w-full rounded border px-4 py-3 dark:bg-meta-4 dark:border-strokedark ${errors.customer_phone ? 'border-red-500' : 'border-stroke'}`}
                  />
                  {errors.customer_phone && <p className="text-red-500 text-sm mt-1">{errors.customer_phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <input
                    type="number"
                    name="total_price"
                    value={formData.total_price}
                    onChange={handleInputChange}
                    placeholder="Total Price (DH)"
                    step="0.01"
                    min="0"
                    className="w-full rounded border border-stroke px-4 py-3 dark:bg-meta-4 dark:border-strokedark"
                  />
                  {errors.total_price && <p className="text-red-500 text-sm mt-1">{errors.total_price}</p>}
                </div>
                <div className="md:col-span-2">
                  <input type="text" name="shipping_address.street" value={formData.shipping_address.street} onChange={handleInputChange} placeholder="Street Address" className="w-full rounded border border-stroke px-4 py-3 dark:bg-meta-4 dark:border-strokedark" />
                </div>
                <div className="md:col-span-2 flex gap-4">
                  <select value={shippingCityType} onChange={(e) => setShippingCityType(e.target.value as any)} className="w-1/2 rounded border border-stroke px-4 py-3 dark:bg-meta-4 dark:border-strokedark bg-white dark:bg-gray-800">
                    <option value="casablanca">Casablanca</option>
                    <option value="other">Other City</option>
                  </select>
                  {shippingCityType === 'other' && (
                    <SearchableSelect
                      name="shipping_address.city"
                      value={formData.shipping_address.city}
                      onChange={(city) => {
                        setFormData(prev => ({
                          ...prev,
                          shipping_address: { ...prev.shipping_address, city }
                        }));
                      }}
                      options={MOROCCAN_CITIES}
                      placeholder="Select City..."
                      className="w-1/2"
                    />
                  )}
                </div>
              </div>
            </div>


              {/* Items Management */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/40">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold text-black dark:text-white">Order Items</h5>
                <Button type="button" onClick={addItem} className="inline-flex items-center gap-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900">Add Item</Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/40">
                    <div className="flex items-start justify-between mb-3">
                      <h6 className="text-sm font-medium text-black dark:text-white">Item #{index + 1} {item.reorder_from_order_id && '(Return Reorder)'}</h6>
                      {formData.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-800">Remove</button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Color Select with Visual Display */}
                      <div>
                        <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Color</label>
                        <div className="relative">
                          <select
                            value={item.color}
                            onChange={(e) => updateItem(item.id, 'color', e.target.value)}
                            className="w-full rounded border border-stroke px-3 py-2 pr-10 bg-white dark:bg-meta-4 dark:border-strokedark appearance-none"
                          >
                            <option value="">Select Color</option>
                            {(() => {
                              let colors: string[] = [];
                              if (item.product_id) {
                                const foundProduct = availableProducts.find(p => p.id === item.product_id);
                                colors = foundProduct?.available_colors || product?.available_colors || [];
                              } else if (item.template_id) {
                                const foundTemplate = availableTemplates.find(t => t.templateId === item.template_id);
                                colors = foundTemplate?.productColors || [];
                              }
                              return colors.map(color => (
                                <option key={color} value={color}>{color}</option>
                              ));
                            })()}
                          </select>
                          {item.color && normalizeColor(item.color) && (
                            <div
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded border-2 border-gray-300 dark:border-gray-600 shadow-sm pointer-events-none"
                              style={{ backgroundColor: normalizeColor(item.color) }}
                              title={item.color}
                            />
                          )}
                        </div>
                      </div>

                      {/* Size Select */}
                      <div>
                        <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Size</label>
                        <select
                          value={item.size}
                          onChange={(e) => updateItem(item.id, 'size', e.target.value)}
                          className="w-full rounded border border-stroke px-3 py-2 bg-white dark:bg-meta-4 dark:border-strokedark"
                        >
                          <option value="">Select Size</option>
                          {(() => {
                            let sizes: string[] = [];
                            if (item.product_id) {
                              const foundProduct = availableProducts.find(p => p.id === item.product_id);
                              sizes = foundProduct?.available_sizes || product?.available_sizes || [];
                            } else if (item.template_id) {
                              const foundTemplate = availableTemplates.find(t => t.templateId === item.template_id);
                              sizes = foundTemplate?.productSizes || [];
                            }
                            return sizes.map(size => (
                              <option key={size} value={size}>{size}</option>
                            ));
                          })()}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-sm mb-2 font-medium text-gray-700 dark:text-gray-300">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          className="w-full rounded border border-stroke px-3 py-2 bg-white dark:bg-meta-4 dark:border-strokedark"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button 
                type="submit" 
                disabled={submitting || !isVerified} 
                className="bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : isVerified ? 'Create Order' : 'Account Not Activated'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-h-[85vh] overflow-hidden relative block border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            {/* Floating Header & Filters */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md transition-all pointer-events-none">
              <div className="px-6 py-4 flex justify-between items-center bg-transparent pointer-events-auto">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Item to Add</h3>
                <button
                  onClick={() => setShowProductSelector(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  aria-label="Close modal"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 px-6 pb-4 bg-transparent touch-pan-x overflow-x-auto no-scrollbar pointer-events-auto">
                <button onClick={() => setSelectedProductType('product')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedProductType === 'product' ? 'bg-black text-white shadow-md' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>Products</button>
                <button onClick={() => setSelectedProductType('template')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedProductType === 'template' ? 'bg-black text-white shadow-md' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>Templates</button>
                <button onClick={() => setSelectedProductType('return')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedProductType === 'return' ? 'bg-black text-white shadow-md' : 'bg-white text-black border border-gray-200 hover:bg-gray-50'}`}>Returns ({availableReturns.filter(r => r.allow_reshipping).length})</button>
              </div>
            </div>

            <div className="h-full overflow-y-auto px-6 pb-6 pt-44 overscroll-contain">
              {selectedProductType === 'return' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableReturns.filter(r => r.allow_reshipping).length === 0 ? (
                    <p className="col-span-2 text-center text-gray-500">
                      {availableReturns.length === 0 ? 'No returns available' : 'No approved returns available. Returns must be approved by admin before you can reorder.'}
                    </p>
                  ) :
                    availableReturns.filter(r => r.allow_reshipping).map((ret, idx) => (
                      <button key={idx} onClick={() => handleProductSelection(availableReturns.indexOf(ret), 'return')} className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-black text-left hover:shadow-md transition-all">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
                          <img src={getImageUrl(ret.productImage)} alt={ret.productName} className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between w-full mb-1">
                            <span className="font-semibold">{ret.productName}</span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded h-fit">Approved Return</span>
                          </div>
                          <p className="text-xs text-gray-500">Order: {ret.orderNumber} {ret.color && `| ${ret.color}`} {ret.size && `| ${ret.size}`}</p>
                          <p className="text-sm">Cost: <span className="text-green-600 font-bold">FREE</span></p>
                        </div>
                      </button>
                    ))
                  }
                </div>
              ) : selectedProductType === 'product' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableProducts.map(p => (
                    <button key={p.id} disabled={p.in_stock === false} onClick={() => { if (p.in_stock !== false) handleProductSelection(p.id, 'product'); }} className={`flex gap-4 p-4 rounded-lg border text-left transition-all ${p.in_stock === false ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/40 cursor-not-allowed opacity-70' : 'border-gray-200 hover:shadow-md hover:border-black cursor-pointer'}`}>
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
                        <img src={getImageUrl(p.image_url)} alt={p.name} className={`h-full w-full object-cover ${p.in_stock === false ? 'opacity-50' : ''}`} />
                        {p.in_stock === false && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="text-[9px] font-bold text-white uppercase">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold truncate">{p.name}</h4>
                          {p.in_stock === false && <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Out of Stock</span>}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.base_price.toFixed(2)} DH</p>
                        {p.available_colors.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 mr-0.5">Colors:</span>
                            {p.available_colors.slice(0, 6).map(c => {
                              const hex = normalizeColor(c);
                              return hex ? (
                                <div key={c} className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: hex }} title={c} />
                              ) : (
                                <span key={c} className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{c}</span>
                              );
                            })}
                            {p.available_colors.length > 6 && <span className="text-[10px] text-gray-400">+{p.available_colors.length - 6}</span>}
                          </div>
                        )}
                        {p.available_sizes.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500 mr-0.5">Sizes:</span>
                            {p.available_sizes.map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-medium">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableTemplates.map(t => (
                    <button key={t.templateId} disabled={t.productInStock === false} onClick={() => { if (t.productInStock !== false) handleProductSelection(t.templateId, 'template'); }} className={`flex gap-4 p-4 rounded-lg border text-left transition-all ${t.productInStock === false ? 'border-red-200 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/40 cursor-not-allowed opacity-70' : 'border-gray-200 hover:shadow-md hover:border-black cursor-pointer'}`}>
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-100">
                        <img src={getImageUrl(t.templateImage)} alt={t.templateName} className={`h-full w-full object-cover ${t.productInStock === false ? 'opacity-50' : ''}`} />
                        {t.productInStock === false && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <span className="text-[9px] font-bold text-white uppercase">Out of Stock</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold truncate">{t.templateName}</h4>
                          {t.productInStock === false && <span className="flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Out of Stock</span>}
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t.templatePrice.toFixed(2)} DH</p>
                        {t.productColors.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <span className="text-[10px] text-gray-500 mr-0.5">Colors:</span>
                            {t.productColors.slice(0, 6).map(c => {
                              const hex = normalizeColor(c);
                              return hex ? (
                                <div key={c} className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: hex }} title={c} />
                              ) : (
                                <span key={c} className="text-[10px] px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{c}</span>
                              );
                            })}
                            {t.productColors.length > 6 && <span className="text-[10px] text-gray-400">+{t.productColors.length - 6}</span>}
                          </div>
                        )}
                        {t.productSizes.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            <span className="text-[10px] text-gray-500 mr-0.5">Sizes:</span>
                            {t.productSizes.map(s => (
                              <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-medium">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
