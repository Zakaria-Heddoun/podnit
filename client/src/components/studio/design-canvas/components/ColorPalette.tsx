"use client";

import React from 'react';

interface ColorPaletteProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onColorChange
}) => {
  const colors = [
    '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#008000', '#000080'
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        T-Shirt Colors
      </h4>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              selectedColor === color
                ? 'border-gray-900 scale-110'
                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        
        {/* Custom Color Picker */}
        <label className="w-8 h-8 rounded-full border-2 border-dashed border-gray-400 dark:border-gray-500 flex items-center justify-center cursor-pointer hover:border-gray-900 dark:hover:border-gray-300 transition-colors">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-0 h-0 opacity-0"
          />
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </label>
      </div>
    </div>
  );
};

export default ColorPalette;