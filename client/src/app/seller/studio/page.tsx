"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import DesignCanvas, { DesignCanvasRef } from "@/components/studio/design-canvas";
import { SaveTemplateModal } from "@/components/studio/SaveTemplateModal";
import { getApiUrl } from "@/lib/utils";

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id") || searchParams.get("templateId");
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
  const loadTemplate = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/seller/templates/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load template');

      const data = await response.json();

      const templateData = data.template || data.data;
      
      if (templateData && templateData.design_config && canvasRef.current) {
        try {
          const config = typeof templateData.design_config === 'string'
            ? JSON.parse(templateData.design_config)
            : templateData.design_config;

          // Wait for canvas to be ready
          setTimeout(() => {
            canvasRef.current?.loadDesignData(config);
          }, 500);
        } catch (e) {
          console.error('❌ Error parsing design config:', e);
        }
      }
    } catch (error) {
      console.error('❌ Error loading template:', error);
      toast.error('Failed to load template details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  // Reset canvas to blank when product data is loaded but no template is being edited
  useEffect(() => {
    if (!templateId && productId && !isProductLoading && Object.keys(productMockups).length > 0 && canvasRef.current) {
      // Product mockups have been loaded, reset canvas to show blank design
      canvasRef.current.loadDesignData({
        states: {},
        images: {},
        views: [],
        color: '#FFFFFF'
      });
    }
  }, [templateId, productId, isProductLoading, productMockups]);

  useEffect(() => {
    const fetchProductColors = async (id: string) => {
      setIsProductLoading(true);
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
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

        // First get views and their mockups (these are the product's actual mockup images)
        const views = Array.isArray(payload?.data?.views) ? payload.data.views : [];
        const resolvedViews = views.map((v: any) => ({
          ...v,
          mockup: typeof v.mockup === 'string' && v.mockup.startsWith('/') ? `${API_URL}${v.mockup}` : v.mockup
        }));
        setProductViews(resolvedViews);

        // Build mockups from views (prioritize these over legacy mockups)
        const mockupsFromViews: Record<string, string | null> = {};
        resolvedViews.forEach((v: any) => {
          if (v.mockup) {
            mockupsFromViews[v.key] = v.mockup;
          }
        });

        // Fall back to legacy mockups if no views exist
        const legacyMockups = payload?.data?.mockups || payload?.mockups || {};
        const resolvedMockups: Record<string, string | null> = {};
        Object.entries(legacyMockups || {}).forEach(([key, val]) => {
          if (typeof val === 'string') {
            resolvedMockups[key] = val.startsWith('/') ? `${API_URL}${val}` : val;
          }
        });

        // Merge: views mockups take precedence
        const finalMockups = { ...resolvedMockups, ...mockupsFromViews };
        setProductMockups(finalMockups);

        // Get print areas from views first, then fall back to legacy
        const printAreas = payload?.data?.print_areas || payload?.print_areas || {};
        let finalPrintAreas = { ...printAreas };
        
        if (resolvedViews.length > 0) {
          const areasMap: Record<string, { x: number; y: number; width: number; height: number }> = {};
          resolvedViews.forEach((v: any) => {
            if (v.area) {
              areasMap[v.key] = v.area;
            }
          });
          finalPrintAreas = { ...finalPrintAreas, ...areasMap };
        }
        setProductPrintAreas(finalPrintAreas);
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

  const handleExport = async () => {
    if (!canvasRef.current) {
      toast.error('Canvas not ready');
      return;
    }

    try {
      const currentViewKey = canvasRef.current.getCurrentArea();
      const currentViewName = productViews.find(v => v.key === currentViewKey)?.name || currentViewKey;
      
      // Get the mockup URL for the current view
      const mockupUrl = productMockups[currentViewKey] || productMockups['front'];
      
      // Get design data - this includes rendered canvas as data URL
      // NOTE: getDesignData() saves state but doesn't modify the canvas
      const designData = await canvasRef.current.getDesignData();
      const designDataUrl = designData.images[currentViewKey];
      
      if (!designDataUrl) {
        console.warn('⚠️ No design data URL found, trying all available images:', designData.images);
        // Fallback to first available design
        const firstDesignKey = Object.keys(designData.images).find(k => designData.images[k]);
        if (!firstDesignKey) {
          toast.error('No design to export. Please add some elements first.');
          return;
        }
      }

      const finalDesignUrl = designDataUrl || Object.values(designData.images).find((v: any) => v);
      
      if (!finalDesignUrl || typeof finalDesignUrl !== 'string') {
        toast.error('Design data is invalid. Please try again.');
        return;
      }

      // Create composite image (doesn't modify the canvas)
      const compositeBlob = await createCompositeImage(finalDesignUrl, mockupUrl, currentViewKey);
      
      if (!compositeBlob) {
        toast.error('Failed to create composite image');
        return;
      }

      // Download
      const url = window.URL.createObjectURL(compositeBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-${currentViewName}-composite.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Refresh canvas to ensure design is visible
      if (canvasRef.current?.refreshCanvas) {
        canvasRef.current.refreshCanvas();
      }
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      toast.error('Failed to export design. Please try again.');
    }
  };

  const createCompositeImage = async (
    designDataUrl: string,
    mockupUrl: string | null | undefined,
    viewKey: string
  ): Promise<Blob | null> => {
    return new Promise(async (resolve) => {
      try {
        const loadImage = async (url: string, label: string = 'Image'): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            if (!url || typeof url !== 'string') {
              console.error(`❌ Invalid URL for ${label}:`, typeof url, url);
              reject(new Error(`Invalid URL for ${label}`));
              return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Add timeout
            const timeout = setTimeout(() => {
              reject(new Error(`${label} load timeout`));
            }, 10000);

            img.onload = () => {
              clearTimeout(timeout);
              resolve(img);
            };
            
            img.onerror = (e) => {
              clearTimeout(timeout);
              console.error(`❌ Failed to load ${label}:`, e, 'URL:', url.substring(0, 100));
              reject(new Error(`Failed to load ${label}`));
            };
            
            // If URL is from backend API, use proxy to avoid CORS
            let finalUrl = url;
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.podnit.com';
            if (url.startsWith(API_URL) && label === 'Mockup') {
              finalUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
            }
            
            img.src = finalUrl;
          });
        };

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('❌ Failed to get canvas context');
          resolve(null);
          return;
        }

        // Load mockup first to get dimensions
        let mockupImg: HTMLImageElement | null = null;
        let canvasWidth = 1200;
        let canvasHeight = 1400;

        if (mockupUrl) {
          try {
            mockupImg = await loadImage(mockupUrl, 'Mockup');
            canvasWidth = mockupImg.width;
            canvasHeight = mockupImg.height;
          } catch (e) {
            console.warn('⚠️ Failed to load mockup:', e);
          }
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw mockup if loaded
        if (mockupImg) {
          try {
            ctx.drawImage(mockupImg, 0, 0, canvasWidth, canvasHeight);
          } catch (e) {
            console.warn('⚠️ Failed to draw mockup:', e);
          }
        }

        // Load and draw design
        try {
          const designImg = await loadImage(designDataUrl, 'Design');
          
          // Get print area from productPrintAreas
          const printArea = productPrintAreas[viewKey];
          
          if (printArea) {
            const printX = (printArea.x / 100) * canvasWidth;
            const printY = (printArea.y / 100) * canvasHeight;
            const printWidth = (printArea.width / 100) * canvasWidth;
            const printHeight = (printArea.height / 100) * canvasHeight;
            
            ctx.drawImage(designImg, printX, printY, printWidth, printHeight);
          } else {
            // Fallback: center design on canvas
            const designWidth = canvasWidth * 0.6;
            const designHeight = canvasHeight * 0.6;
            const designX = (canvasWidth - designWidth) / 2;
            const designY = (canvasHeight - designHeight) / 2;
            
            ctx.drawImage(designImg, designX, designY, designWidth, designHeight);
          }
        } catch (e) {
          console.error('❌ Failed to load/draw design:', e);
        }

        canvas.toBlob((blob: Blob | null) => {
          if (blob) {
            resolve(blob);
          } else {
            console.error('❌ Failed to create blob');
            resolve(null);
          }
        }, 'image/png', 1.0);
      } catch (error) {
        console.error('❌ Error creating composite:', error);
        resolve(null);
      }
    });
  };

  const handleSaveClick = () => {
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (name: string) => {
    if (!canvasRef.current) return;
    if (!productId) {
      toast.error('Missing product reference for this template.');
      return;
    }

    setIsSaving(true);
    try {
      const designData = await canvasRef.current.getDesignData();
      const API_URL = getApiUrl();
      const token = localStorage.getItem('token');

      // Step 1: Upload images separately to avoid large payload
      const imageUrls: Record<string, string> = {};

      // Upload each image separately (only if it's base64, skip if already a URL)
      for (const [key, data] of Object.entries(designData.images)) {
        if (!data) {
          // Keep null values to maintain structure
          imageUrls[key] = '';
          continue;
        }
        
        // If it's already a URL, use it directly
        if (typeof data === 'string' && !data.startsWith('data:')) {
          imageUrls[key] = data;
          continue;
        }

        // Upload base64 image
        try {
          const uploadResponse = await fetch(`${API_URL || ''}/api/seller/templates/upload-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              image: data,
              type: key // Use the view key as the type to maintain mapping
            })
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            imageUrls[key] = uploadResult.url;
          } else {
            const errorText = await uploadResponse.text();
            console.warn(`⚠️ Failed to upload ${key}:`, errorText);
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
      const payload = {
        title: name,
        product_id: Number(productId),
        design_config: designConfig,
        colors: [designData.designConfig.color].filter(Boolean),
      };

      const url = templateId
        ? `${API_URL || ''}/api/seller/templates/${templateId}`
        : `${API_URL || ''}/api/seller/templates`;

      const method = templateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

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
      // Persist created template to sessionStorage as a fallback so seller list can show it immediately
      try {
        if (result?.data) {
          sessionStorage.setItem('new_template', JSON.stringify(result.data));
        }
      } catch (e) {
        console.warn('Failed to store new_template in sessionStorage', e);
      }

      setIsModalOpen(false);
      // Redirect to seller templates and pass the created template id so the list can show it immediately
      const createdId = result?.data?.id || null;
      if (createdId) {
        router.push(`/seller/templates?new=1&templateId=${createdId}`);
      } else {
        router.push('/seller/templates');
      }
    } catch (error: any) {
      console.error('❌ Error saving template:', error);
      const errorMessage = error?.message || 'Failed to save template. Please try again.';
      toast.error(errorMessage);
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
        <div className="absolute right-6 flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
          <button
            onClick={handleSaveClick}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors text-sm"
            disabled={isLoading}
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
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
