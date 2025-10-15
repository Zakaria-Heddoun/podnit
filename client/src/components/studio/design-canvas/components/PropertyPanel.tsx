"use client";

import React from 'react';

interface PropertyPanelProps {
  selectedElement: any;
  onElementUpdate: (properties: any) => void;
  onElementDelete: () => void;
  className?: string;
}

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedElement,
  onElementUpdate,
  onElementDelete,
  className = ""
}) => {
  if (!selectedElement) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const handlePropertyChange = (property: string, value: any) => {
    onElementUpdate({ [property]: value });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Properties</h3>
      
      <div className="space-y-4">
        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X</label>
              <input
                type="number"
                value={Math.round(selectedElement.left || 0)}
                onChange={(e) => handlePropertyChange('left', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y</label>
              <input
                type="number"
                value={Math.round(selectedElement.top || 0)}
                onChange={(e) => handlePropertyChange('top', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
              <input
                type="number"
                value={Math.round((selectedElement.width || 0) * (selectedElement.scaleX || 1))}
                onChange={(e) => {
                  const newWidth = parseInt(e.target.value);
                  const scaleX = newWidth / (selectedElement.width || 1);
                  handlePropertyChange('scaleX', scaleX);
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={Math.round((selectedElement.height || 0) * (selectedElement.scaleY || 1))}
                onChange={(e) => {
                  const newHeight = parseInt(e.target.value);
                  const scaleY = newHeight / (selectedElement.height || 1);
                  handlePropertyChange('scaleY', scaleY);
                }}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rotation
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={selectedElement.angle || 0}
            onChange={(e) => handlePropertyChange('angle', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            {selectedElement.angle || 0}°
          </div>
        </div>

        {/* Opacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Opacity
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedElement.opacity || 1}
            onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
            {Math.round((selectedElement.opacity || 1) * 100)}%
          </div>
        </div>

        {/* Text Properties (if text element) */}
        {selectedElement.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Text
              </label>
              <textarea
                value={selectedElement.text || ''}
                onChange={(e) => handlePropertyChange('text', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size
              </label>
              <input
                type="number"
                value={selectedElement.fontSize || 24}
                onChange={(e) => handlePropertyChange('fontSize', parseInt(e.target.value))}
                className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Color
              </label>
              <input
                type="color"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => handlePropertyChange('fill', e.target.value)}
                className="w-full h-8 border border-gray-300 dark:border-gray-600 rounded"
              />
            </div>
          </>
        )}

        {/* Delete Button */}
        <button
          onClick={onElementDelete}
          className="w-full flex items-center justify-center p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Element
        </button>
      </div>
    </div>
  );
};

export default PropertyPanel;