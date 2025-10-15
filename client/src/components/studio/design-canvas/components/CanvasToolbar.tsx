"use client";

import React from 'react';

interface CanvasToolbarProps {
  onImageUpload: (imageData: string, fileName: string) => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  className?: string;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onImageUpload,
  onAddText,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  className = ""
}) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onImageUpload(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tools</h3>
      
      <div className="space-y-3">
        {/* Image Upload */}
        <div>
          <label className="block w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center justify-center w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-900 dark:hover:border-gray-300 transition-colors">
              <div className="text-center">
                <svg className="w-6 h-6 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">Upload Image</span>
              </div>
            </div>
          </label>
        </div>

        {/* Add Text */}
        <button
          onClick={onAddText}
          className="w-full flex items-center justify-center p-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Add Text
        </button>

        {/* Undo/Redo */}
        <div className="flex space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CanvasToolbar;