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

  // Margin for handles to be visible outside the printable area
  const CANVAS_MARGIN = 40;

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

  const onCanvasReadyRef = useRef(onCanvasReady);
  const onSelectionChangeRef = useRef(onSelectionChange);

  useEffect(() => {
    onCanvasReadyRef.current = onCanvasReady;
  }, [onCanvasReady]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (canvasRef.current && !fabricCanvasRef.current) {
      // Create canvas with 40px margin on all sides
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: areaPx.width + (CANVAS_MARGIN * 2),
        height: areaPx.height + (CANVAS_MARGIN * 2),
        backgroundColor: 'transparent',
        selection: true,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        controlsAboveOverlay: true,
      });

      // Shift the viewport so that (0,0) in object coordinates is at (CANVAS_MARGIN, CANVAS_MARGIN) in pixels
      canvas.setViewportTransform([1, 0, 0, 1, CANVAS_MARGIN, CANVAS_MARGIN]);

      // Configure default object controls globally
      Object.assign(fabric.Object.prototype, {
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#2563eb',
        cornerSize: 14,
        padding: 20, // 20px padding moves handles out of the object border
        cornerStyle: 'circle',
        borderDashArray: [4, 4],
        hasControls: true,
      });

      // Helper function to ensure all controls are visible and styled
      const enableAllControls = (obj: any) => {
        if (obj && obj.setControlsVisibility) {
          obj.set({
            cornerStyle: 'circle',
            cornerColor: '#ffffff',
            cornerStrokeColor: '#000000',
            borderColor: '#2563eb',
            cornerSize: 14,
            transparentCorners: false,
            padding: 20,
            borderDashArray: [4, 4],
          });

          obj.setControlsVisibility({
            tl: true, tr: true, bl: true, br: true,
            ml: true, mt: true, mr: true, mb: true,
            mtr: true
          });
        }
      };

      canvas.on('object:added', (e) => {
        enableAllControls(e.target);
      });

      // Clip Path should also be at (0,0) in transformed space
      const clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: areaPx.width,
        height: areaPx.height,
        absolutePositioned: false, // Relative to viewport/transformed space
        fill: 'transparent',
        stroke: 'transparent',
        selectable: false,
        evented: false
      });
      canvas.clipPath = clipPath;

      fabricCanvasRef.current = canvas;
      onCanvasReadyRef.current(canvas);
      canvas.renderAll();

      // Configure ActiveSelection styling
      Object.assign(fabric.ActiveSelection.prototype, {
        transparentCorners: false,
        cornerColor: '#ffffff',
        cornerStrokeColor: '#000000',
        borderColor: '#2563eb',
        cornerSize: 14,
        padding: 20,
        cornerStyle: 'circle',
        borderDashArray: [4, 4],
        hasControls: true,
      });

      canvas.on('selection:created', (e) => {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
          enableAllControls(activeObject);
          if (activeObject.type === 'activeSelection') {
            (activeObject as any)._objects?.forEach((obj: any) => enableAllControls(obj));
          }
        }
        if (e.selected && e.selected[0]) {
          onSelectionChangeRef.current(e.selected[0]);
        }
      });

      canvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0]) {
          e.selected.forEach(obj => enableAllControls(obj));
          onSelectionChangeRef.current(e.selected[0]);
        }
      });

      canvas.on('selection:cleared', () => {
        onSelectionChangeRef.current(null);
      });

      canvas.on('mouse:dblclick', (e) => {
        const target = e.target;
        if (target && target.type === 'textbox') {
          canvas.setActiveObject(target);
          (target as any).enterEditing();
          (target as any).selectAll();
        }
      });

      canvas.on('text:editing:exited', () => {
        canvas.renderAll();
        canvas.fire('text:changed');
      });

      return () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        }
      };
    }
  }, []);

  // Update canvas dimensions when area changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    canvas.setDimensions({
      width: areaPx.width + (CANVAS_MARGIN * 2),
      height: areaPx.height + (CANVAS_MARGIN * 2)
    });

    canvas.setViewportTransform([1, 0, 0, 1, CANVAS_MARGIN, CANVAS_MARGIN]);

    const clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width: areaPx.width,
      height: areaPx.height,
      absolutePositioned: false,
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

        {/* Canvas Wrapper positioned with offset to account for margin */}
        <div
          className="absolute"
          style={{
            top: `${areaPx.y - CANVAS_MARGIN}px`,
            left: `${areaPx.x - CANVAS_MARGIN}px`,
            width: `${areaPx.width + (CANVAS_MARGIN * 2)}px`,
            height: `${areaPx.height + (CANVAS_MARGIN * 2)}px`,
            zIndex: 10,
            overflow: 'visible' // Ensure handles can seen
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

        {/* Printable Area Outline (stays exactly at areaPx) */}
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
