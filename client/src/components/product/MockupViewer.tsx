"use client";

import React, { useState } from 'react';
import { toast } from 'sonner';

interface MockupViewerProps {
  mockups: Record<string, string | null>;
  productName: string;
}

export const MockupViewer: React.FC<MockupViewerProps> = ({
  mockups,
  productName
}) => {
  const [currentView, setCurrentView] = useState(() => {
    const views = Object.keys(mockups).filter(k => mockups[k]);
    return views[0] || 'front';
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const viewNames: Record<string, string> = {
    front: 'Front',
    back: 'Back',
    left: 'Left Sleeve',
    right: 'Right Sleeve',
    left_chest: 'Left Chest',
    right_chest: 'Right Chest',
  };

  const currentMockup = mockups[currentView];
  const availableViews = Object.entries(mockups)
    .filter(([, url]) => url)
    .map(([key]) => key);

  const handleDownload = async () => {
    if (!currentMockup) return;

    setIsDownloading(true);
    try {
      const response = await fetch(currentMockup);
      if (!response.ok) throw new Error('Failed to download mockup');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from URL or use default
      const urlParts = currentMockup.split('/');
      const fileName = urlParts[urlParts.length - 1] || `${productName}-${currentView}-mockup.png`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download mockup. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (Object.keys(mockups).length === 0 || !Object.values(mockups).some(v => v)) {
    return (
      <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-col items-center justify-center py-12">
          <svg
            className="mb-4 h-16 w-16 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-center text-gray-600 dark:text-gray-400">
            No mockup available for this product
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark overflow-hidden">
      {/* Header */}
      <div className="border-b border-stroke px-6 py-4 dark:border-strokedark">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Mockup
          </h3>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:bg-gray-400 dark:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {/* View Selector */}
      {availableViews.length > 1 && (
        <div className="border-b border-stroke px-6 py-3 dark:border-strokedark">
          <div className="flex flex-wrap gap-2">
            {availableViews.map((view) => (
              <button
                key={view}
                onClick={() => setCurrentView(view)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {viewNames[view] || view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mockup Image */}
      <div className="relative w-full bg-white dark:bg-gray-950 p-8 flex items-center justify-center" style={{ minHeight: '600px' }}>
        <div className="relative w-full h-full max-w-2xl">
          <img
            src={currentMockup}
            alt={`${productName} ${viewNames[currentView] || currentView} mockup`}
            className="w-full h-full object-contain"
            style={{ maxHeight: '600px' }}
          />
        </div>
      </div>

      {/* Info Footer */}
      <div className="border-t border-stroke px-6 py-3 dark:border-strokedark">
        <p className="text-xs text-body dark:text-bodydark">
          Right-click to download or use the Download button above to save the mockup
        </p>
      </div>
    </div>
  );
};
