"use client";

import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

interface TShirtMockupProps {
  currentArea: string;
  selectedColor: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onSelectionChange: (element: any) => void;
  mockups?: Record<string, string | null>;
  printAreas?: Record<string, { x: number; y: number; width: number; height: number }>;
  viewLabel?: string;
  className?: string;
}

const TShirtMockup: React.FC<TShirtMockupProps> = ({
  currentArea,
  selectedColor,
  onCanvasReady,
  onSelectionChange,
  mockups = {},
  printAreas = {},
  viewLabel,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerSize, setContainerSize] = React.useState({ width: 500, height: 600 });

  useEffect(() => {
    const activeMockup = mockups[currentArea] || '/images/tshirt-template.png';
    const img = new Image();
    img.onload = () => {
      const maxWidth = 500;
      const maxHeight = 600;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const width = img.width * scale;
      const height = img.height * scale;
      setContainerSize({ width, height });
    };
    img.src = activeMockup;
  }, [currentArea, mockups]);

  const activeAreaConfig = printAreas[currentArea] || { x: 28, y: 28, width: 44, height: 60 }; // percent of container
  const areaPx = {
    x: (activeAreaConfig.x / 100) * containerSize.width,
    y: (activeAreaConfig.y / 100) * containerSize.height,
    width: (activeAreaConfig.width / 100) * containerSize.width,
    height: (activeAreaConfig.height / 100) * containerSize.height,
  };

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: areaPx.width,
        height: areaPx.height,
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        controlsAboveOverlay: true,
      });

      // Configure default object controls
      fabric.Object.prototype.set({
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#000000',
        cornerSize: 10,
        padding: 5,
        cornerStyle: 'circle',
        borderDashArray: [4, 4],
      });

      // Constrain drawing area to the print zone
      const clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: areaPx.width,
        height: areaPx.height,
        absolutePositioned: true,
        fill: 'transparent',
        stroke: 'transparent',
        selectable: false,
        evented: false
      });
      canvas.clipPath = clipPath;

      fabricCanvasRef.current = canvas;
      onCanvasReady(canvas);
      canvas.renderAll();

      // Set up selection events
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0]) {
          onSelectionChange(e.selected[0]);
        }
      });

      canvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0]) {
          onSelectionChange(e.selected[0]);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectionChange(null);
      });

      // Enable text editing on double click
      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (target && target.type === 'text') {
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
  }, [currentArea, onCanvasReady, onSelectionChange, areaPx.height, areaPx.width]);

  // Update canvas dimensions and clip path when area changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setDimensions({
      width: areaPx.width,
      height: areaPx.height
    });

    const clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width: areaPx.width,
      height: areaPx.height,
      absolutePositioned: true,
      fill: 'transparent',
      stroke: 'transparent',
      selectable: false,
      evented: false
    });

    canvas.clipPath = clipPath;
    canvas.requestRenderAll();
  }, [currentArea, areaPx.height, areaPx.width]);

  const activeMockup = mockups[currentArea] || '/images/tshirt-template.png';

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div ref={containerRef} className="relative" style={{ width: `${containerSize.width}px`, height: `${containerSize.height}px` }}>
        {/* Product Mockup */}
        <div
          className="absolute inset-0 rounded-lg shadow-lg bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url('${activeMockup}')`,
            backgroundColor: selectedColor,
            backgroundSize: '100% 100%',
            pointerEvents: 'none'
          }}
        />

        {/* Canvas Wrapper positioned to print area */}
        <div
          className="absolute rounded-lg"
          style={{
            top: `${areaPx.y}px`,
            left: `${areaPx.x}px`,
            width: `${areaPx.width}px`,
            height: `${areaPx.height}px`,
            zIndex: 10,
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
            }}
          />
        </div>

        {/* Printable Area Outline */}
        <div
          className="absolute border-2 border-dashed border-gray-400 rounded-md pointer-events-none"
          style={{
            width: `${areaPx.width}px`,
            height: `${areaPx.height}px`,
            top: `${areaPx.y}px`,
            left: `${areaPx.x}px`,
            zIndex: 20,
            backgroundColor: 'transparent'
          }}
        />

        {/* Area Indicator */}
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm z-20">
          {viewLabel || currentArea}
        </div>
      </div>
    </div>
  );
};

export default TShirtMockup;
