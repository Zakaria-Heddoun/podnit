"use client";

import React, { useRef, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DesignCanvas, { DesignCanvasRef } from "@/components/studio/design-canvas";
import { SaveTemplateModal } from "@/components/studio/SaveTemplateModal";

function StudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("id");

  const canvasRef = useRef<DesignCanvasRef>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

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

    setIsSaving(true);
    try {
      const designData = await canvasRef.current.getDesignData();

      // Prepare payload with ALL design sides
      const payload = {
        title: name,
        product_id: 1,
        design_config: JSON.stringify(designData.designConfig),
        big_front_image: designData.images['big-front'],
        small_front_image: designData.images['small-front'],
        back_image: designData.images.back,
        left_sleeve_image: designData.images.left,
        right_sleeve_image: designData.images.right,
        colors: [designData.designConfig.color],
      };

      const url = templateId
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates/${templateId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/seller/templates`;

      const method = templateId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const result = await response.json();
      console.log('Template saved:', result);

      setIsModalOpen(false);
      router.push('/seller/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
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
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        )}
        <DesignCanvas ref={canvasRef} />
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