"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// ... (interfaces remain unchanged)

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, loading: loadingAuth } = useAuth();
  const productId = searchParams.get('productId');
  const templateParam = searchParams.get('template');

  const [product, setProduct] = useState<Product | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderType, setOrderType] = useState<'product' | 'template'>('product');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    customer_id: undefined,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    create_new_customer: true,
    quantity: 1,
    selling_price: 0,
    selected_color: '',
    selected_size: '',
    shipping_address: {
      street: '',
      city: '',
      postal_code: '',
      country: 'Morocco'
    },
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        // TODO: Replace with actual API call when backend is running
        // const response = await fetch('/api/seller/customers');
        // const data = await response.json();
        // if (data.success) {
        //   setCustomers(data.data);
        // }

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

  // Fetch product data from API
  useEffect(() => {
    // Wait for auth to be ready
    if (loadingAuth) return;

    // Handle template-based order
    if (templateParam) {
      try {
        const templateData = JSON.parse(decodeURIComponent(templateParam));
        setOrderType('template');

        // Fetch full template data from API
        const fetchTemplate = async () => {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          try {
            const response = await fetch(`${API_URL}/api/seller/templates/${templateData.templateId}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
              }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data) {
                const fullTemplate = result.data;

                // Map API response to component's Template interface
                setTemplate({
                  templateId: fullTemplate.id,
                  templateName: fullTemplate.title,
                  templatePrice: parseFloat(fullTemplate.product?.base_price) || 0,
                  templateCategory: fullTemplate.product?.category || 'Unknown',
                  templateImage: fullTemplate.thumbnail_image || fullTemplate.big_front_image || fullTemplate.small_front_image
                });

                // Set default form values
                setFormData(prev => ({
                  ...prev,
                  selected_color: fullTemplate.colors?.[0] || 'Black',
                  selected_size: fullTemplate.sizes?.[0] || 'M',
                  selling_price: fullTemplate.product?.base_price || 0
                }));
              }
            } else {
              console.error('Failed to fetch template');
            }
          } catch (err) {
            console.error('Error fetching template from API:', err);
          } finally {
            setLoading(false);
          }
        };

        if (token) {
          fetchTemplate();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error parsing template data:', error);
        setLoading(false);
      }
    }

    // Handle product-based order
    if (productId && !templateParam) {
      setOrderType('product');

      if (!token) {
        // No token yet, maybe redirect or wait?
        // For now, if no token, we can't fetch.
        console.warn('No auth token available for product fetch');
        setLoading(false);
        return;
      }

      const fetchProduct = async () => {
        // Mock product data for now - matching the seeded products
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

        try {
          const response = await fetch(`${API_URL}/api/seller/products/${productId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              const foundProduct = data.data;
              // Transform API data to match component Product interface if needed,
              // or just use it directly if it matches.
              // The API returns a product object, let's map it to ensure fields match
              const mappedProduct: Product = {
                id: foundProduct.id,
                name: foundProduct.name,
                category: foundProduct.category,
                base_price: parseFloat(foundProduct.base_price),
                available_colors: foundProduct.available_colors || [],
                available_sizes: foundProduct.available_sizes || [],
                image_url: foundProduct.image_url ?
                  (foundProduct.image_url.startsWith('/') ? `${API_URL}${foundProduct.image_url}` : foundProduct.image_url)
                  : undefined
              };

              setProduct(mappedProduct);

              setFormData(prev => ({
                ...prev,
                selected_color: mappedProduct.available_colors[0] || '',
                selected_size: mappedProduct.available_sizes[0] || '',
                selling_price: mappedProduct.base_price
              }));
            }
          } else {
            console.error('Failed to fetch product');
          }
        } catch (err) {
          console.error('Error fetching product from API:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    } else if (!templateParam) {
      // If not fetching a product or template, stop loading immediately
      setLoading(false);
    }
  }, [productId, templateParam, token, loadingAuth]);

  const handleCustomerSelection = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone,
        create_new_customer: false
      }));

      // Clear customer-related errors
      setErrors(prev => ({
        ...prev,
        customer_name: '',
        customer_email: '',
        customer_phone: ''
      }));
    }
  };

  const handleNewCustomerToggle = () => {
    setFormData(prev => ({
      ...prev,
      create_new_customer: !prev.create_new_customer,
      customer_id: undefined,
      customer_name: '',
      customer_email: '',
      customer_phone: ''
    }));

    // Clear customer-related errors
    setErrors(prev => ({
      ...prev,
      customer_name: '',
      customer_email: '',
      customer_phone: ''
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.includes('shipping_address.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        shipping_address: {
          ...prev.shipping_address,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'quantity' ? parseInt(value) || 1 :
          name === 'selling_price' ? parseFloat(value) || 0 :
            value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer validation - either select existing or create new
    if (formData.create_new_customer) {
      if (!formData.customer_name.trim()) {
        newErrors.customer_name = 'Customer name is required';
      }

      if (!formData.customer_email.trim()) {
        newErrors.customer_email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
        newErrors.customer_email = 'Email is invalid';
      }

      if (!formData.customer_phone.trim()) {
        newErrors.customer_phone = 'Phone number is required';
      }
    } else {
      if (!formData.customer_id) {
        newErrors.customer_selection = 'Please select a customer or create new one';
      }
    }

    if (formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }

    // Validate selling price against base price
    const basePrice = orderType === 'template' ? template?.templatePrice : product?.base_price;
    if (!formData.selling_price || formData.selling_price <= 0) {
      newErrors.selling_price = 'Selling price is required and must be greater than 0';
    } else if (basePrice && formData.selling_price < basePrice) {
      newErrors.selling_price = `Selling price must be at least ${basePrice.toFixed(2)} DH (base cost)`;
    }

    if (!formData.selected_color) {
      newErrors.selected_color = 'Please select a color';
    }

    if (!formData.selected_size) {
      newErrors.selected_size = 'Please select a size';
    }

    if (!formData.shipping_address.street.trim()) {
      newErrors['shipping_address.street'] = 'Street address is required';
    }

    if (!formData.shipping_address.city.trim()) {
      newErrors['shipping_address.city'] = 'City is required';
    }

    if (!formData.shipping_address.postal_code.trim()) {
      newErrors['shipping_address.postal_code'] = 'Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    return formData.selling_price * formData.quantity;
  };

  const calculateProfit = () => {
    const basePrice = orderType === 'template' ? template?.templatePrice : product?.base_price;
    if (!basePrice) return 0;
    return (formData.selling_price - basePrice) * formData.quantity;
  };

  const calculateProfitPerUnit = () => {
    const basePrice = orderType === 'template' ? template?.templatePrice : product?.base_price;
    if (!basePrice) return 0;
    return formData.selling_price - basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (orderType === 'product' && !product) return;
    if (orderType === 'template' && !template) return;

    setSubmitting(true);

    try {
      let orderData;

      if (orderType === 'template' && template) {
        orderData = {
          template_id: template.templateId,
          customer_name: formData.create_new_customer ? formData.customer_name : customers.find(c => c.id === formData.customer_id)?.name || '',
          customer_email: formData.create_new_customer ? formData.customer_email : customers.find(c => c.id === formData.customer_id)?.email || '',
          customer_phone: formData.create_new_customer ? formData.customer_phone : customers.find(c => c.id === formData.customer_id)?.phone || '',
          quantity: formData.quantity,
          selected_color: formData.selected_color,
          selected_size: formData.selected_size,
          shipping_address: formData.shipping_address,
          notes: formData.notes
        };
      } else if (orderType === 'product' && product) {
        orderData = {
          product_id: product.id,
          customer_name: formData.create_new_customer ? formData.customer_name : customers.find(c => c.id === formData.customer_id)?.name || '',
          customer_email: formData.create_new_customer ? formData.customer_email : customers.find(c => c.id === formData.customer_id)?.email || '',
          customer_phone: formData.create_new_customer ? formData.customer_phone : customers.find(c => c.id === formData.customer_id)?.phone || '',
          quantity: formData.quantity,
          selected_color: formData.selected_color,
          selected_size: formData.selected_size,
          selling_price: formData.selling_price,
          shipping_address: formData.shipping_address,
          notes: formData.notes
        };
      }

      // Make actual API call to create order
      console.log('Creating order:', orderData);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const endpoint = orderType === 'template' ? 'from-template' : 'from-product';

      try {
        // Use real seller endpoint
        const apiUrl = `${API_URL}/api/seller/orders/${endpoint}`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || errorData?.message || `Failed to create order: ${response.statusText}`);
        }

        const result = await response.json();

        // Backend returns { message: "...", data: {...} } on success
        if (result.data && result.data.order_number) {
          alert(`Order created successfully! Order number: ${result.data.order_number}`);
          router.push('/seller/orders?created=true');
        } else if (result.message && result.message.includes('successfully')) {
          // Fallback: if message says success but no order_number
          alert('Order created successfully!');
          router.push('/seller/orders?created=true');
        } else {
          throw new Error(result.error || result.message || 'Failed to create order');
        }

      } catch (apiError) {
        console.error('API call failed:', apiError);
        alert(`Error creating order: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error creating order:', error);
      // Handle error (show toast, etc.)
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product && !template) {
    return (
      <div className="rounded-sm border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
          {orderType === 'template' ? 'Template Not Found' : 'Product Not Found'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The {orderType === 'template' ? 'template' : 'product'} you&apos;re trying to order could not be found.
        </p>
        <Button onClick={() => router.back()} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }


  const itemName = orderType === 'template' ? template?.templateName : product?.name;
  const itemPrice = orderType === 'template' ? template?.templatePrice : product?.base_price;
  const itemCategory = orderType === 'template' ? template?.templateCategory : product?.category;

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
        <h3 className="font-semibold text-black dark:text-white">
          Create Order: {itemName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {orderType === 'template' ? 'From Template' : 'From Product Catalog'}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6 p-6.5">
        {/* Product/Template Info */}
        <div className="col-span-12 xl:col-span-4">
          <div className="rounded-sm border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
            <div className="mb-4">
              {orderType === 'product' && product?.image_url && (
                <div className="mb-3 h-32 w-full overflow-hidden rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image_url}
                    alt={itemName || ''}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      // Fallback chain: server -> client -> placeholder
                      const target = e.target as HTMLImageElement;
                      const currentSrc = target.src;

                      if (currentSrc.includes('localhost:8000')) {
                        // Try client-side images
                        const productNum = product.id <= 5 ? product.id.toString().padStart(2, '0') : '01';
                        target.src = `/images/product/product-${productNum}.jpg`;
                      } else if (!currentSrc.includes('placeholder')) {
                        // Ultimate fallback to placeholder
                        target.src = '/images/placeholder-product.png';
                      }
                    }}
                  />
                </div>
              )}
              {orderType === 'template' && (
                <div className="mb-3 h-64 w-full overflow-hidden rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  {template?.templateImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={template.templateImage.startsWith('http') ? template.templateImage : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${template.templateImage}`}
                      alt={itemName || ''}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                      <svg className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
              <h4 className="text-lg font-semibold text-black dark:text-white">
                {itemName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Category: {itemCategory}
              </p>
              <div className="space-y-1 mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Base cost: <span className="font-medium">{Number(itemPrice || 0).toFixed(2)} DH</span>
                </p>
                <p className="text-lg font-bold text-blue-600">
                  Your price: {formData.selling_price > 0 ? `${Number(formData.selling_price).toFixed(2)} DH` : 'Set price →'}
                </p>
              </div>
            </div>

            <div className="border-t border-stroke pt-4 dark:border-strokedark">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Base cost per unit:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{Number(itemPrice || 0).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Your price per unit:</span>
                  <span className="font-medium text-blue-600">{formData.selling_price > 0 ? `${Number(formData.selling_price).toFixed(2)} DH` : 'Not set'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Profit per unit:</span>
                  <span className={`font-medium ${calculateProfitPerUnit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculateProfitPerUnit() >= 0 ? '+' : ''}{calculateProfitPerUnit().toFixed(2)} DH
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Quantity:</span>
                  <span className="font-medium text-black dark:text-white">{formData.quantity}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span className="text-black dark:text-white">Total Revenue:</span>
                  <span className="text-blue-600">{Number(calculateTotal()).toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Profit:</span>
                  <span className={`font-medium ${calculateProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
            {/* Customer Information */}
            <div>
              <h5 className="text-lg font-medium text-black dark:text-white mb-4">Customer Information</h5>

              {/* Customer Selection Toggle */}
              <div className="mb-4 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, create_new_customer: false }))}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${!formData.create_new_customer
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Select Existing Customer
                </button>
                <button
                  type="button"
                  onClick={handleNewCustomerToggle}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${formData.create_new_customer
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Create New Customer
                </button>
              </div>

              {/* Existing Customer Selection */}
              {!formData.create_new_customer && (
                <div className="mb-4">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Select Customer *
                  </label>
                  <select
                    value={formData.customer_id || ''}
                    onChange={(e) => handleCustomerSelection(parseInt(e.target.value))}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.customer_selection ? 'border-red-500' : 'border-stroke'
                      }`}
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.email}
                      </option>
                    ))}
                  </select>
                  {errors.customer_selection && (
                    <p className="mt-1 text-sm text-red-500">{errors.customer_selection}</p>
                  )}

                  {/* Display selected customer info */}
                  {formData.customer_id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h6 className="font-medium text-black dark:text-white mb-2">Selected Customer:</h6>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        <p><strong>Name:</strong> {formData.customer_name}</p>
                        <p><strong>Email:</strong> {formData.customer_email}</p>
                        <p><strong>Phone:</strong> {formData.customer_phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* New Customer Form */}
              {formData.create_new_customer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.customer_name ? 'border-red-500' : 'border-stroke'
                        }`}
                      placeholder="Enter customer full name"
                    />
                    {errors.customer_name && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                      className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.customer_email ? 'border-red-500' : 'border-stroke'
                        }`}
                      placeholder="customer@example.com"
                    />
                    {errors.customer_email && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.customer_phone ? 'border-red-500' : 'border-stroke'
                        }`}
                      placeholder="+212 600 000 000"
                    />
                    {errors.customer_phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.customer_phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      min="1"
                      className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.quantity ? 'border-red-500' : 'border-stroke'
                        }`}
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity field for existing customer mode */}
              {!formData.create_new_customer && (
                <div className="mt-4">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.quantity ? 'border-red-500' : 'border-stroke'
                      }`}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
                  )}
                </div>
              )}
            </div>

            {/* Product Customization */}
            <div>
              <h5 className="text-lg font-medium text-black dark:text-white mb-4">Product Options</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Color *
                  </label>
                  <select
                    name="selected_color"
                    value={formData.selected_color}
                    onChange={handleInputChange}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.selected_color ? 'border-red-500' : 'border-stroke'
                      }`}
                  >
                    <option value="">Select Color</option>
                    {orderType === 'product' && product?.available_colors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                    {orderType === 'template' && ['White', 'Black', 'Navy', 'Gray', 'Red'].map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                  {errors.selected_color && (
                    <p className="mt-1 text-sm text-red-500">{errors.selected_color}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Size *
                  </label>
                  <select
                    name="selected_size"
                    value={formData.selected_size}
                    onChange={handleInputChange}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.selected_size ? 'border-red-500' : 'border-stroke'
                      }`}
                  >
                    <option value="">Select Size</option>
                    {orderType === 'product' && product?.available_sizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                    {orderType === 'template' && ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  {errors.selected_size && (
                    <p className="mt-1 text-sm text-red-500">{errors.selected_size}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Your Selling Price (DH) *
                  </label>
                  <input
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    min={itemPrice || 0}
                    step="0.01"
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors.selling_price ? 'border-red-500' : 'border-stroke'
                      }`}
                    placeholder={`Min: ${Number(itemPrice || 0).toFixed(2)} DH`}
                  />
                  {errors.selling_price && (
                    <p className="mt-1 text-sm text-red-500">{errors.selling_price}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Base cost: {Number(itemPrice || 0).toFixed(2)} DH • Profit: <span className={calculateProfitPerUnit() >= 0 ? 'text-green-600' : 'text-red-600'}>{calculateProfitPerUnit() >= 0 ? '+' : ''}{Number(calculateProfitPerUnit()).toFixed(2)} DH</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h5 className="text-lg font-medium text-black dark:text-white mb-4">Shipping Address</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="shipping_address.street"
                    value={formData.shipping_address.street}
                    onChange={handleInputChange}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors['shipping_address.street'] ? 'border-red-500' : 'border-stroke'
                      }`}
                    placeholder="123 Main Street, Apartment 4"
                  />
                  {errors['shipping_address.street'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['shipping_address.street']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    City *
                  </label>
                  <input
                    type="text"
                    name="shipping_address.city"
                    value={formData.shipping_address.city}
                    onChange={handleInputChange}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors['shipping_address.city'] ? 'border-red-500' : 'border-stroke'
                      }`}
                    placeholder="Casablanca"
                  />
                  {errors['shipping_address.city'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['shipping_address.city']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="shipping_address.postal_code"
                    value={formData.shipping_address.postal_code}
                    onChange={handleInputChange}
                    className={`w-full rounded border px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary ${errors['shipping_address.postal_code'] ? 'border-red-500' : 'border-stroke'
                      }`}
                    placeholder="20000"
                  />
                  {errors['shipping_address.postal_code'] && (
                    <p className="mt-1 text-sm text-red-500">{errors['shipping_address.postal_code']}</p>
                  )}
                </div>

                <div>
                  <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                    Country *
                  </label>
                  <select
                    name="shipping_address.country"
                    value={formData.shipping_address.country}
                    onChange={handleInputChange}
                    className="w-full rounded border border-stroke px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                  >
                    <option value="Morocco">Morocco</option>
                    <option value="Algeria">Algeria</option>
                    <option value="Tunisia">Tunisia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded border border-stroke px-4 py-3 text-black focus:border-primary focus-visible:outline-none dark:border-strokedark dark:bg-meta-4 dark:text-white dark:focus:border-primary"
                placeholder="Any special instructions or requests..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Order...
                  </>
                ) : (
                  'Create Order'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}