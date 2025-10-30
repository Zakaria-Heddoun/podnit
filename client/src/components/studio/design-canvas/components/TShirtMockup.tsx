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
        width: 240,
        height: 280,
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true
      });

      // Add clipping path to constrain objects within the printable area
      const clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: 240,
        height: 280,
        absolutePositioned: true,
        fill: 'transparent',
        stroke: 'transparent',
        selectable: false,
        evented: false
      });

      canvas.clipPath = clipPath;

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

      // Constrain object movement within canvas bounds
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        const objBounds = obj.getBoundingRect();
        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        // Keep object within canvas bounds
        if (objBounds.left < 0) {
          obj.left = obj.left - objBounds.left;
        }
        if (objBounds.top < 0) {
          obj.top = obj.top - objBounds.top;
        }
        if (objBounds.left + objBounds.width > canvasWidth) {
          obj.left = canvasWidth - objBounds.width + obj.left - objBounds.left;
        }
        if (objBounds.top + objBounds.height > canvasHeight) {
          obj.top = canvasHeight - objBounds.height + obj.top - objBounds.top;
        }
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
        {/* T-Shirt Background Image */}
        <div 
          className="absolute inset-0 rounded-lg shadow-lg bg-center bg-no-repeat bg-contain"
          style={{ 
            backgroundImage: `url('/images/tshirt-template.png')`,
            filter: `hue-rotate(${selectedColor === '#FFFFFF' ? '0deg' : selectedColor === '#000000' ? '180deg' : '0deg'})`,
            width: '400px',
            height: '500px'
          }}
        />
        
        {/* Printable Area Outline */}
        <div 
          className="absolute border-2 border-dashed border-gray-400 rounded-md z-5"
          style={{
            width: '220px',
            height: '270px',
            top: '140px',
            left: '90px',
            pointerEvents: 'none',
            backgroundColor: 'transparent'
          }}
        />
        
        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute z-10 rounded-lg"
          style={{ 
            backgroundColor: 'transparent',
            top: '150px',
            left: '80px'
          }}
        />
        
        {/* Area Indicator */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm z-20">
          {currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}
        </div>
      </div>
    </div>
  );
};

export default TShirtMockup;