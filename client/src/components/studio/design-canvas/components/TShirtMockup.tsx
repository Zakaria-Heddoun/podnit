"use client";

import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

interface TShirtMockupProps {
  currentArea: string;
  selectedColor: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onSelectionChange: (element: any) => void;
  className?: string;
}

const TShirtMockup: React.FC<TShirtMockupProps> = ({
  currentArea,
  selectedColor,
  onCanvasReady,
  onSelectionChange,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 400,
        height: 500,
        backgroundColor: 'transparent'
      });

      fabricCanvasRef.current = canvas;
      onCanvasReady(canvas);

      // Set up selection events
      canvas.on('selection:created', (e) => {
        onSelectionChange(e.selected?.[0]);
      });

      canvas.on('selection:updated', (e) => {
        onSelectionChange(e.selected?.[0]);
      });

      canvas.on('selection:cleared', () => {
        onSelectionChange(null);
      });

      // Enable text editing on double click
      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (target && target.type === 'text') {
          canvas.setActiveObject(target);
          target.enterEditing();
          target.selectAll();
        }
      });

      // Save canvas state after text editing
      canvas.on('text:editing:exited', () => {
        canvas.renderAll();
        // Trigger a custom event to save state
        canvas.fire('text:changed');
      });
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [onCanvasReady, onSelectionChange]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* T-Shirt Background */}
        <div 
          className="absolute inset-0 rounded-lg shadow-lg"
          style={{ backgroundColor: selectedColor }}
        />
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="relative z-10 border border-gray-300 dark:border-gray-600 rounded-lg"
        />
        
        {/* Area Indicator */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          {currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}
        </div>
      </div>
    </div>
  );
};

export default TShirtMockup;