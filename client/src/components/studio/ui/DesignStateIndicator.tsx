"use client";

import React from 'react';

interface DesignStateIndicatorProps {
  hasUnsavedChanges: boolean;
  isAutoSaving: boolean;
  lastSaved: Date;
}

const DesignStateIndicator: React.FC<DesignStateIndicatorProps> = ({
  hasUnsavedChanges,
  isAutoSaving,
  lastSaved
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isAutoSaving) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-600 dark:text-blue-400">Saving...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center space-x-2 text-sm">
        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
        <span className="text-orange-600 dark:text-orange-400">Unsaved changes</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-green-600 dark:text-green-400">
        Saved at {formatTime(lastSaved)}
      </span>
    </div>
  );
};

export default DesignStateIndicator;