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
      // Define padding for controls
      const PADDING = 60;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 240 + (PADDING * 2), // Initial placeholder
        height: 280 + (PADDING * 2),
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

      // Immediately resize to correct dimensions for current area
      const areaWidth = currentArea === 'small-front' ? 176 : 220;
      const areaHeight = currentArea === 'small-front' ? 96 : 270;

      canvas.setDimensions({
        width: areaWidth + (PADDING * 2),
        height: areaHeight + (PADDING * 2)
      });

      // Add clipping path to constrain objects within the printable area
      // Positioned at (PADDING, PADDING)
      const clipPath = new fabric.Rect({
        left: PADDING,
        top: PADDING,
        width: areaWidth,
        height: areaHeight,
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

      // Constrain object movement within printable area (inside padding)
      canvas.on('object:moving', (e) => {
        const obj = e.target;
        if (!obj) return;

        const objBounds = obj.getBoundingRect();

        // Printable area boundaries
        const minLeft = PADDING;
        const minTop = PADDING;
        const maxLeft = PADDING + canvas.getWidth() - (PADDING * 2); // effectively areaWidth + PADDING
        const maxTop = PADDING + canvas.getHeight() - (PADDING * 2); // effectively areaHeight + PADDING

        // Simple clamping for now (can be refined to strictly contain rect)
        // But since users want to drag off-canvas sometimes, maybe relax this?
        // Let's stick to standard behavior: keep center or edges within bounds?

        // Let's allow dragging but clamp slightly to ensure it's reachable
        // Actually, just let them drag freely inside the padded zone?
        // No, user wants it constrained to printable area normally.

        // Let's use the clipPath as the boundary reference
        // If left < PADDING -> set to PADDING
      });
      // Removed strict constraints for now to prevent "glitching" at edges. 
      // The clipPath handles visual clipping. 
      // The extra canvas size handles control visibility.

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
  }, [currentArea, onCanvasReady, onSelectionChange]);

  // Update canvas dimensions and clip path when area changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const PADDING = 60;
    const areaWidth = currentArea === 'small-front' ? 176 : 220;
    const areaHeight = currentArea === 'small-front' ? 96 : 270;

    canvas.setDimensions({
      width: areaWidth + (PADDING * 2),
      height: areaHeight + (PADDING * 2)
    });

    const clipPath = new fabric.Rect({
      left: PADDING,
      top: PADDING,
      width: areaWidth,
      height: areaHeight,
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
      <div className="relative" style={{ width: '500px', height: '600px' }}>
        {/* T-Shirt Background Image */}
        <div
          className="absolute inset-0 rounded-lg shadow-lg bg-center bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url('/images/tshirt-template.png')`,
            filter: `hue-rotate(${selectedColor === '#FFFFFF' ? '0deg' : selectedColor === '#000000' ? '180deg' : '0deg'})`,
            pointerEvents: 'none'
          }}
        />

        {/* Canvas Wrapper - Now Larger & Centered over the outline */}
        <div
          className="absolute rounded-lg"
          style={{
            // Position shifted by -PADDING relative to the visual outline
            // New Center X (500/2=250). BigFront w=220 -> x=140. SmallFront w=176 -> x=162.
            // Vert shift +50px due to height increase (500->600). BigFront y=140->190. SmallFront y=152->202.
            top: (currentArea === 'small-front' ? 202 : 190) - 60 + 'px',
            left: (currentArea === 'small-front' ? 162 : 140) - 60 + 'px',
            // Dimensions = Area + PADDING * 2
            width: (currentArea === 'small-front' ? 176 : 220) + 120 + 'px',
            height: (currentArea === 'small-front' ? 96 : 270) + 120 + 'px',
            zIndex: 10,
            // pointerEvents: 'none', // Allow clicks to pass through valid areas? No, canvas needs events.
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              backgroundColor: 'transparent',
            }}
          />
        </div>

        {/* Printable Area Outline - VISUAL ONLY (Overlay) */}
        <div
          className="absolute border-2 border-dashed border-gray-400 rounded-md pointer-events-none"
          style={{
            width: currentArea === 'small-front' ? '180px' : '220px',
            height: currentArea === 'small-front' ? '100px' : '270px',
            top: currentArea === 'small-front' ? '200px' : '190px',
            left: currentArea === 'small-front' ? '160px' : '140px',
            zIndex: 20, // Render ON TOP of canvas image to show limits clearly
            backgroundColor: 'transparent'
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