"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DesignCanvas from "@/components/studio/design-canvas";

export default function StudioPage() {
  const router = useRouter();

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
          T-Shirt Designer Studio
        </h1>
        <button
          onClick={() => console.log('Save Template clicked')}
          className="absolute right-6 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors text-sm"
        >
          Save Template
        </button>
      </div>
      
      {/* Fullscreen Design Canvas */}
      <div className="flex-1">
        <DesignCanvas />
      </div>
    </div>
  );
}