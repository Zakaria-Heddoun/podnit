"use client";

import React from 'react';

interface ExportActionsProps {
  canvas: any;
  currentArea: string;
  onExportArea: (dataURL: string, area: string) => void;
  onExportAll: (designs: any) => void;
}

const ExportActions: React.FC<ExportActionsProps> = ({
  canvas,
  currentArea,
  onExportArea,
  onExportAll
}) => {

  const handleExportCurrent = () => {
    if (canvas) {
      const dataURL = canvas.toDataURL('image/png');
      onExportArea(dataURL, currentArea);
    }
  };

  const handleExportAll = () => {
    // Mock export all functionality
    const designs = {
      front: canvas?.toDataURL('image/png'),
      back: null,
      leftSleeve: null,
      rightSleeve: null
    };
    onExportAll(designs);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-end">
        <div className="flex space-x-2">
          <button
            onClick={handleExportCurrent}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors text-sm"
          >
            Export {currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}
          </button>
          
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-white text-black border border-black rounded-lg hover:bg-gray-50 dark:bg-white dark:text-black dark:border-black dark:hover:bg-gray-100 transition-colors text-sm"
          >
            Export All
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportActions;