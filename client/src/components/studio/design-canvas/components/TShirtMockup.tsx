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
          canvas.setActiveObject(target);
          (target as any).enterEditing();
          (target as any).selectAll();
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

  // Update canvas dimensions and clip path when area changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const width = currentArea === 'small-front' ? 176 : 220;
    const height = currentArea === 'small-front' ? 96 : 270;

    canvas.setDimensions({ width, height });

    const clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width,
      height,
      absolutePositioned: true,
      fill: 'transparent',
      stroke: 'transparent',
      selectable: false,
      evented: false
    });

    canvas.clipPath = clipPath;
    canvas.requestRenderAll();
  }, [currentArea]);

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative" style={{ width: '400px', height: '500px' }}>
        {/* T-Shirt Background Image */}
        <div
          className="absolute inset-0 rounded-lg shadow-lg bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url('/images/tshirt-template.png')`,
            filter: `hue-rotate(${selectedColor === '#FFFFFF' ? '0deg' : selectedColor === '#000000' ? '180deg' : '0deg'})`,
          }}
        />

        {/* Printable Area Outline */}
        <div
          className="absolute border-2 border-dashed border-gray-400 rounded-md z-5"
          style={{
            width: currentArea === 'small-front' ? '180px' : '220px',
            height: currentArea === 'small-front' ? '100px' : '270px',
            top: currentArea === 'small-front' ? '150px' : '140px',
            left: currentArea === 'small-front' ? '110px' : '90px',
            pointerEvents: 'none',
            backgroundColor: 'transparent'
          }}
        />

        {/* Canvas Wrapper */}
        <div
          className="absolute z-10 rounded-lg"
          style={{
            top: currentArea === 'small-front' ? '152px' : '140px',
            left: currentArea === 'small-front' ? '112px' : '90px',
            width: currentArea === 'small-front' ? '176px' : '220px',
            height: currentArea === 'small-front' ? '96px' : '270px',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{
              backgroundColor: 'transparent',
            }}
          />
        </div>

        {/* Area Indicator */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm z-20">
          {currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}
        </div>
      </div>
    </div>
  );
};

export default TShirtMockup;