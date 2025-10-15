"use client";

import React from 'react';

interface BreadcrumbContextProps {
  currentArea: string;
  onAreaChange: (area: string) => void;
}

const BreadcrumbContext: React.FC<BreadcrumbContextProps> = ({ 
  currentArea, 
  onAreaChange 
}) => {
  const areas = [
    { id: 'front', label: 'Front' },
    { id: 'back', label: 'Back' },
    { id: 'left-sleeve', label: 'Left Sleeve' },
    { id: 'right-sleeve', label: 'Right Sleeve' }
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">Design Area:</span>
        <div className="flex space-x-1">
          {areas.map((area, index) => (
            <React.Fragment key={area.id}>
              <button
                onClick={() => onAreaChange(area.id)}
                className={`px-2 py-1 rounded transition-colors ${
                  currentArea === area.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {area.label}
              </button>
              {index < areas.length - 1 && (
                <span className="text-gray-400 dark:text-gray-600">/</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BreadcrumbContext;