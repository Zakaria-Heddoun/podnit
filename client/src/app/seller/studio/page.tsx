"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DesignCanvas, { DesignCanvasRef } from "@/components/studio/design-canvas";
import { SaveTemplateModal } from "@/components/studio/SaveTemplateModal";

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");
  const productId = searchParams.get("product");

  const canvasRef = useRef<DesignCanvasRef>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [productMockups, setProductMockups] = useState<Record<string, string | null>>({});
  const [productPrintAreas, setProductPrintAreas] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const [productViews, setProductViews] = useState<any[]>([]);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  useEffect(() => {
    const fetchProductColors = async (id: string) => {
      setIsProductLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/seller/products/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        const rawColors: string[] = Array.isArray(payload?.data?.available_colors)
          ? payload.data.available_colors
          : Array.isArray(payload?.available_colors)
            ? payload.available_colors
            : [];

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

        const resolved = rawColors
          .map((c) => {
            if (typeof c !== 'string') return null;
            const trimmed = c.trim();
            if (/^#([A-Fa-f0-9]{6})$/.test(trimmed)) return trimmed.toUpperCase();
            return colorMap[trimmed] || null;
          })
          .filter((c): c is string => !!c);

        if (resolved.length > 0) {
          setProductColors(resolved);
        }

        const mockups = payload?.data?.mockups || payload?.mockups || {};
        const resolvedMockups: Record<string, string | null> = {};
        Object.entries(mockups || {}).forEach(([key, val]) => {
          if (typeof val === 'string') {
            resolvedMockups[key] = val.startsWith('/') ? `${API_URL}${val}` : val;
          }
        });
        setProductMockups(resolvedMockups);

        const printAreas = payload?.data?.print_areas || payload?.print_areas || {};
        setProductPrintAreas(printAreas);

        const views = Array.isArray(payload?.data?.views) ? payload.data.views : [];
        const resolvedViews = views.map((v: any) => ({
          ...v,
          mockup: typeof v.mockup === 'string' && v.mockup.startsWith('/') ? `${API_URL}${v.mockup}` : v.mockup
        }));
        setProductViews(resolvedViews);

        if (resolvedViews.length > 0) {
          const areasMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
          resolvedViews.forEach((v: any) => {
            if (v.area) {
              areasMap[v.key] = v.area;
            }
          });
          setProductPrintAreas(areasMap);
        }
      } catch (error) {
        console.error('Failed to load product colors', error);
      } finally {
        setIsProductLoading(false);
      }
    };

    if (productId) {
      fetchProductColors(productId);
    }
  }, [productId]);

  const loadTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load template');

      const data = await response.json();
      console.log('Loaded template:', data);

      if (data.template && data.template.design_config && canvasRef.current) {
        try {
          const config = typeof data.template.design_config === 'string'
            ? JSON.parse(data.template.design_config)
            : data.template.design_config;

          // Wait for canvas to be ready
          setTimeout(() => {
            canvasRef.current?.loadDesignData(config);
          }, 500);
        } catch (e) {
          console.error('Error parsing design config', e);
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert('Failed to load template details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (name: string) => {
    if (!canvasRef.current) return;
    if (!productId) {
      alert('Missing product reference for this template.');
      return;
    }

    setIsSaving(true);
    try {
      const designData = await canvasRef.current.getDesignData();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = localStorage.getItem('token');

      // Step 1: Upload images separately to avoid large payload
      console.log('📤 Step 1: Uploading images separately...');
      const imageUrls: Record<string, string> = {};

      // Upload each image separately (only if it's base64, skip if already a URL)
      for (const [key, data] of Object.entries(designData.images)) {
        if (!data) continue;
        
        // If it's already a URL, use it directly
        if (typeof data === 'string' && !data.startsWith('data:')) {
          imageUrls[key] = data;
          continue;
        }

        // Upload base64 image
        try {
          const uploadResponse = await fetch(`${API_URL}/api/seller/templates/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              image: data,
              type: key
            })
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            imageUrls[key] = uploadResult.url;
            console.log(`✅ Uploaded ${key}:`, uploadResult.url);
          } else {
            console.warn(`⚠️ Failed to upload ${key}, will try to process in template creation`);
            // Fallback: will be processed in template creation
            imageUrls[key] = data;
          }
        } catch (error) {
          console.warn(`⚠️ Error uploading ${key}:`, error);
          // Fallback: will be processed in template creation
          imageUrls[key] = data;
        }
      }

      const designConfig = {
        ...designData.designConfig,
        images: imageUrls,
      };

      // Step 2: Create template with image URLs (much smaller payload)
      console.log('📤 Step 2: Creating template with image URLs...');
      const payload = {
        title: name,
        product_id: Number(productId),
        design_config: designConfig,
        colors: [designData.designConfig.color].filter(Boolean),
      };

      const url = templateId
        ? `${API_URL}/api/seller/templates/${templateId}`
        : `${API_URL}/api/seller/templates`;

      const method = templateId ? 'PUT' : 'POST';

      console.log('📤 Creating template:', { url, method, payloadSize: JSON.stringify(payload).length });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = 'Failed to save template';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          if (errorJson.errors) {
            // Handle validation errors
            const validationErrors = Object.entries(errorJson.errors)
              .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join('\n');
            errorMessage = validationErrors || errorMessage;
          }
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Template saved:', result);

      setIsModalOpen(false);
      router.push('/seller/templates');
    } catch (error: any) {
      console.error('❌ Error saving template:', error);
      const errorMessage = error?.message || 'Failed to save template. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Centered Title with Back Button */}
      <div className="flex items-center justify-center relative py-6">
        <button
          onClick={() => router.back()}
          className="absolute left-6 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {templateId ? 'Edit Template' : 'T-Shirt Designer Studio'}
        </h1>
        <button
          onClick={handleSaveClick}
          className="absolute right-6 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors text-sm"
          disabled={isLoading}
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </button>
      </div>

      {/* Fullscreen Design Canvas */}
      <div className="flex-1 relative">
        {(isLoading || isProductLoading) && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
        {!isProductLoading && (
          <DesignCanvas
            ref={canvasRef}
            availableColors={productColors}
            mockups={productMockups}
            printAreas={productPrintAreas}
            views={productViews}
          />
        )}
      </div>

      <SaveTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleConfirmSave}
        isSaving={isSaving}
        initialName={templateId ? "Updated Template" : ""}
      />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudioContent />
    </Suspense>
  );
}
