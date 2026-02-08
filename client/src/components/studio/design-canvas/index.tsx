"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import { toast } from 'sonner';
import TShirtMockup from './components/TShirtMockup';
import FloatingToolbar from './components/FloatingToolbar';
import { DesignLibraryPanel } from '../DesignLibraryPanel';

export interface DesignCanvasRef {
  getCurrentArea: () => string;
  getDesignData: () => Promise<{
    designConfig: any;
    images: Record<string, string | null>;
  }>;
  loadDesignData: (designConfig: any) => void;
  refreshCanvas: () => void;
}

interface DesignCanvasProps {
  readOnly?: boolean;
  availableColors?: string[];
  mockups?: Record<string, string | null>;
  printAreas?: Record<string, { x: number; y: number; width: number; height: number }>;
  views?: { key: string; name: string; mockup?: string | null; area?: { x: number; y: number; width: number; height: number }; price?: string | number; color?: string | null }[];
}

const fallbackColors = [
  '#FFFFFF',
  '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
];

const DesignCanvas = React.forwardRef<DesignCanvasRef, DesignCanvasProps>(({ readOnly = false, availableColors: incomingColors, mockups, printAreas, views }, ref) => {
  const resolvedColors = incomingColors && incomingColors.length > 0 ? incomingColors : fallbackColors;
  const [selectedColor, setSelectedColor] = useState(resolvedColors[0] || '#FFFFFF');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [availableColors, setAvailableColors] = useState<string[]>(resolvedColors);

  const areaKeys = React.useMemo(() => {
    if (views && views.length > 0) {
      return views
        .filter(v => !v.color || v.color === selectedColor)
        .map(v => v.key);
    }
    return ['big-front', 'small-front', 'back', 'left', 'right'];
  }, [views, selectedColor]);

  const areaDisplay = React.useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (views && views.length > 0) {
      views
        .filter(v => !v.color || v.color === selectedColor)
        .forEach(v => { map[v.key] = v.name || v.key; });
    } else {
      map['big-front'] = 'Big Front';
      map['small-front'] = 'Small Front';
      map['back'] = 'Back';
      map['left'] = 'Left';
      map['right'] = 'Right';
    }
    return map;
  }, [views, selectedColor]);

  const [currentArea, setCurrentArea] = useState(areaKeys[0] || 'big-front');

  const effectivePrintAreas = React.useMemo(() => {
    const map: Record<string, { x: number; y: number; width: number; height: number }> = {};
    if (printAreas) {
      Object.assign(map, printAreas);
    }
    if (views) {
      views.forEach(v => {
        if (!v.color || v.color === selectedColor) {
          if (v.area) {
            map[v.key] = v.area;
          }
        }
      });
    }
    return map;
  }, [printAreas, views, selectedColor]);

  const effectiveMockups = React.useMemo(() => {
    const map: Record<string, string | null> = {};
    // First, add views-based mockups (these are the original product mockups)
    if (views) {
      views.forEach(v => {
        if (!v.color || v.color === selectedColor) {
          if (v.mockup) {
            map[v.key] = v.mockup;
          }
        }
      });
    }
    // Only use fallback mockups if not already set from views
    if (mockups) {
      Object.entries(mockups).forEach(([key, val]) => {
        if (!(key in map)) {
          map[key] = val;
        }
      });
    }
    return map;
  }, [mockups, views, selectedColor]);

  const initStates = React.useMemo(() => {
    const map: Record<string, string> = {};
    areaKeys.forEach(k => { map[k] = ''; });
    return map;
  }, [areaKeys]);

  const initHistories = React.useMemo(() => {
    const map: Record<string, string[]> = {};
    areaKeys.forEach(k => { map[k] = []; });
    return map;
  }, [areaKeys]);

  const initHistoryIdx = React.useMemo(() => {
    const map: Record<string, number> = {};
    areaKeys.forEach(k => { map[k] = -1; });
    return map;
  }, [areaKeys]);

  const [canvasStates, setCanvasStates] = useState<{ [key: string]: string }>(initStates);
  const [canvasHistories, setCanvasHistories] = useState<{ [key: string]: string[] }>(initHistories);
  const [historyIndices, setHistoryIndices] = useState<{ [key: string]: number }>(initHistoryIdx);

  const canvasRef = useRef<any>(null);

  // Track canvas dimensions per view so export uses correct sizes
  const canvasDimensionsRef = useRef<Record<string, { width: number; height: number }>>({});

  // Synchronous clones of state for use in event listeners and during switches
  const isInitializedRef = useRef(false);
  const isInternalOperationRef = useRef(false);
  const prevAreaKeysRef = useRef<string[]>([]);
  const currentAreaRef = useRef(currentArea);
  const canvasStatesRef = useRef(canvasStates);
  const canvasHistoriesRef = useRef(canvasHistories);
  const historyIndicesRef = useRef(historyIndices);

  // Sync refs with state
  useEffect(() => { currentAreaRef.current = currentArea; }, [currentArea]);
  useEffect(() => { canvasStatesRef.current = canvasStates; }, [canvasStates]);
  useEffect(() => { canvasHistoriesRef.current = canvasHistories; }, [canvasHistories]);
  useEffect(() => { historyIndicesRef.current = historyIndices; }, [historyIndices]);

  useEffect(() => {
    // Only re-initialize if we've NEVER initialized OR if areaKeys have fundamentally changed
    const keysChanged = JSON.stringify(areaKeys) !== JSON.stringify(prevAreaKeysRef.current);

    if (!isInitializedRef.current || keysChanged) {
      if (!isInitializedRef.current) {
        // Absolute first time
        setCurrentArea(areaKeys[0] || 'big-front');
        setCanvasStates(initStates);
        setCanvasHistories(initHistories);
        setHistoryIndices(initHistoryIdx);
      } else {
        // areaKeys changed - try to PRESERVE existing work
        const nextStates = { ...initStates };
        const nextHistories = { ...initHistories };
        const nextIndices = { ...initHistoryIdx };

        // Merge with existing work from refs
        Object.keys(canvasStatesRef.current).forEach(k => {
          if (nextStates.hasOwnProperty(k)) {
            nextStates[k] = canvasStatesRef.current[k];
            nextHistories[k] = canvasHistories[k] || [];
            nextIndices[k] = historyIndices[k] ?? -1;
          }
        });

        setCanvasStates(nextStates);
        setCanvasHistories(nextHistories);
        setHistoryIndices(nextIndices);

        // Don't reset currentArea if it's still valid
        if (!areaKeys.includes(currentAreaRef.current)) {
          setCurrentArea(areaKeys[0] || 'big-front');
        }
      }
      isInitializedRef.current = true;
      prevAreaKeysRef.current = areaKeys;
    }
  }, [areaKeys, initStates, initHistories, initHistoryIdx, canvasHistories, historyIndices]);

  useEffect(() => {
    const nextColors = incomingColors && incomingColors.length > 0 ? incomingColors : fallbackColors;
    setAvailableColors(nextColors);
    setSelectedColor(prev => nextColors.includes(prev) ? prev : (nextColors[0] || '#FFFFFF'));
  }, [incomingColors]);

  const saveCanvasState = useCallback(() => {
    if (!canvasRef?.current || isInternalOperationRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasState = JSON.stringify(canvas.toJSON());
    const area = currentAreaRef.current;

    // Record canvas dimensions for this view (used during export)
    canvasDimensionsRef.current[area] = {
      width: canvas.getWidth(),
      height: canvas.getHeight()
    };

    // Use the REFS which are always in sync, not state
    canvasStatesRef.current[area] = canvasState;
    
    const currentHistories = canvasHistoriesRef.current[area] || [];
    const currentIndex = historyIndicesRef.current[area] ?? -1;
    
    // Create new history by slicing up to current position and adding new state
    const newHistories = [...currentHistories.slice(0, currentIndex + 1), canvasState];
    const newIndex = newHistories.length - 1;
    
    // Update all three pieces together in state
    setCanvasStates(prev => ({ ...prev, [area]: canvasState }));
    
    setCanvasHistories(prev => ({ ...prev, [area]: newHistories }));
    
    setHistoryIndices(prev => ({ ...prev, [area]: newIndex }));
    
    // Update refs immediately for next call
    canvasHistoriesRef.current[area] = newHistories;
    historyIndicesRef.current[area] = newIndex;
  }, []);

  // Helper: load an image and return its natural dimensions
  const getImageDimensions = useCallback(async (url: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  }, []);

  // Helper: compute the canvas dimensions for a specific view key
  const computeViewCanvasDimensions = useCallback(async (viewKey: string): Promise<{ width: number; height: number }> => {
    const CANVAS_MARGIN = 40;
    const viewPrintArea = effectivePrintAreas[viewKey] || { x: 28, y: 28, width: 44, height: 60 };
    const mockupUrl = effectiveMockups[viewKey];

    let contW = 500, contH = 600;
    if (mockupUrl) {
      try {
        const dims = await getImageDimensions(mockupUrl);
        const scale = Math.min(500 / dims.width, 600 / dims.height, 1);
        contW = dims.width * scale;
        contH = dims.height * scale;
      } catch {
        // use defaults
      }
    }

    const areaPxWidth = (viewPrintArea.width / 100) * contW;
    const areaPxHeight = (viewPrintArea.height / 100) * contH;

    return {
      width: areaPxWidth + (CANVAS_MARGIN * 2),
      height: areaPxHeight + (CANVAS_MARGIN * 2)
    };
  }, [effectivePrintAreas, effectiveMockups, getImageDimensions]);

  React.useImperativeHandle(ref, () => ({
    getCurrentArea: () => currentAreaRef.current,
    getDesignData: async () => {
      const area = currentAreaRef.current;
      if (!canvasRef.current) {
        return {
          designConfig: {
            states: canvasStates,
            color: selectedColor,
            views: views?.filter(v => !v.color || v.color === selectedColor).map(v => ({ key: v.key, name: v.name, area: v.area, color: v.color })),
          },
          images: {}
        };
      }

      // Step 1: Save current view state and dimensions
      const currentJson = JSON.stringify(canvasRef.current.toJSON());
      const updatedStates = {
        ...canvasStatesRef.current,
        [area]: currentJson
      };

      // Record current view's dimensions
      canvasDimensionsRef.current[area] = {
        width: canvasRef.current.getWidth(),
        height: canvasRef.current.getHeight()
      };

      const images: Record<string, string | null> = {};
      isInternalOperationRef.current = true;

      const loadState = (json: string): Promise<void> => {
        return new Promise((resolve) => {
          if (!json || json === '') {
            canvasRef.current?.clear();
            resolve();
            return;
          }
          canvasRef.current?.loadFromJSON(json, () => {
            canvasRef.current?.renderAll();
            setTimeout(resolve, 50);
          });
        });
      };

      // Store original dimensions for restore later
      const originalWidth = canvasRef.current.getWidth();
      const originalHeight = canvasRef.current.getHeight();
      const originalViewport = [...(canvasRef.current.viewportTransform || [1, 0, 0, 1, 0, 0])];

      const CANVAS_MARGIN = 40; // Must match TShirtMockup.tsx

      for (const viewKey of areaKeys) {
        const state = updatedStates[viewKey];
        if (!state) {
          images[viewKey] = null;
          continue;
        }

        try {
          const stateObj = JSON.parse(state);
          // Check if empty
          if ((!stateObj.objects || stateObj.objects.length === 0) && !stateObj.backgroundImage && !stateObj.backgroundColor) {
            images[viewKey] = null;
            continue;
          }

          // Get the correct canvas dimensions for THIS view
          let viewWidth: number, viewHeight: number;
          const storedDims = canvasDimensionsRef.current[viewKey];

          if (storedDims && storedDims.width > 0 && storedDims.height > 0) {
            // Use recorded dimensions (most accurate)
            viewWidth = storedDims.width;
            viewHeight = storedDims.height;

          } else {
            // Fallback: compute from print area + mockup
            const computed = await computeViewCanvasDimensions(viewKey);
            viewWidth = computed.width;
            viewHeight = computed.height;

          }

          const printWidth = viewWidth - (CANVAS_MARGIN * 2);
          const printHeight = viewHeight - (CANVAS_MARGIN * 2);

          // Resize canvas to this view's dimensions
          canvasRef.current.setDimensions({ width: viewWidth, height: viewHeight });
          canvasRef.current.setViewportTransform([1, 0, 0, 1, CANVAS_MARGIN, CANVAS_MARGIN]);

          // Update clipPath for correct clipping
          canvasRef.current.clipPath = new fabric.Rect({
            left: 0,
            top: 0,
            width: printWidth,
            height: printHeight,
            absolutePositioned: false,
            fill: 'transparent',
            stroke: 'transparent',
            selectable: false,
            evented: false
          });

          // Load this view's state
          await loadState(state);

          // Export ONLY the printable area sub-rectangle
          const dataURL = canvasRef.current.toDataURL({
            format: 'png',
            quality: 1.0,
            left: CANVAS_MARGIN,
            top: CANVAS_MARGIN,
            width: printWidth,
            height: printHeight,
            multiplier: 1000 / printWidth
          });

          images[viewKey] = dataURL;
        } catch (e) {
          console.error(`Error exporting ${viewKey}`, e);
          images[viewKey] = null;
        }
      }

      // Restore original view's canvas dimensions
      canvasRef.current.setDimensions({ width: originalWidth, height: originalHeight });
      canvasRef.current.setViewportTransform(originalViewport as any);

      // Restore clipPath
      canvasRef.current.clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width: originalWidth - (CANVAS_MARGIN * 2),
        height: originalHeight - (CANVAS_MARGIN * 2),
        absolutePositioned: false,
        fill: 'transparent',
        stroke: 'transparent',
        selectable: false,
        evented: false
      });

      await loadState(updatedStates[area] || '');
      canvasRef.current.renderAll();
      isInternalOperationRef.current = false;

      // Save per-view dimensions in the design config so they survive save/load
      const viewDimensions: Record<string, { width: number; height: number }> = {};
      for (const vk of areaKeys) {
        if (canvasDimensionsRef.current[vk]) {
          viewDimensions[vk] = canvasDimensionsRef.current[vk];
        }
      }

      return {
        designConfig: {
          states: updatedStates,
          color: selectedColor,
          viewDimensions,
          views: views?.filter(v => !v.color || v.color === selectedColor).map(v => ({
            key: v.key,
            name: v.name,
            mockup: v.mockup,
            area: v.area,
            color: v.color
          })),
        },
        images
      };
    },
    loadDesignData: (designConfig: any) => {
      // Restore saved per-view dimensions
      if (designConfig?.viewDimensions) {
        Object.assign(canvasDimensionsRef.current, designConfig.viewDimensions);
      }

      if (designConfig?.states) {
        const stateKeys = Object.keys(designConfig.states);
        const validStates: Record<string, string> = {};

        stateKeys.forEach(key => {
          if (areaKeys.includes(key)) {
            validStates[key] = designConfig.states[key];
          } else {
            console.warn(`⚠️ Skipping invalid state key: ${key} (not in areaKeys)`);
          }
        });

        setCanvasStates(validStates);
        canvasStatesRef.current = validStates;

        const area = currentAreaRef.current;
        const currentState = validStates[area];

        if (currentState && canvasRef.current) {
          isInternalOperationRef.current = true;
          canvasRef.current.loadFromJSON(currentState, () => {
            canvasRef.current.renderAll();
            isInternalOperationRef.current = false;
          });
        } else {
          if (canvasRef.current) {
            try {
              isInternalOperationRef.current = true;
              canvasRef.current.clear();
              canvasRef.current.renderAll();
            } finally {
              isInternalOperationRef.current = false;
            }
          }
        }
      }

      if (designConfig?.color) {
        setSelectedColor(designConfig.color);
        setAvailableColors((prev) =>
          prev.includes(designConfig.color) ? prev : [...prev, designConfig.color]
        );
      }
    },
    refreshCanvas: () => {
      if (canvasRef.current) {
        canvasRef.current.renderAll();
      }
    }
  }), [areaKeys, currentArea, canvasStates, selectedColor, views, effectivePrintAreas, effectiveMockups, computeViewCanvasDimensions]);

  // Effect to load canvas state when currentArea changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitializedRef.current) return;

    // Use synchronous Ref to get the latest state during transitions
    const currentState = canvasStatesRef.current[currentArea];

    if (currentState && currentState !== '') {
      canvas.clear();
      isInternalOperationRef.current = true;
      canvas.loadFromJSON(currentState, () => {
        canvas.renderAll();
        setTimeout(() => {
          canvas.renderAll();
          isInternalOperationRef.current = false;
        }, 50);
      });
    } else {
      canvas.clear();
      canvas.renderAll();
    }
  }, [currentArea]);

  const handleCanvasReady = useCallback((canvas: any) => {
    canvasRef.current = canvas;

    // Use a stable event listener that calls our ref-aware save function
    canvas.on('text:changed', () => {
      saveCanvasState();
    });

    // Handle new objects added to canvas
    canvas.on('object:added', () => {
      saveCanvasState();
    });

    // Handle generic object modifications
    canvas.on('object:modified', () => {
      saveCanvasState();
    });

    // Handle object removal
    canvas.on('object:removed', () => {
      saveCanvasState();
    });

    // Initial load - use currentAreaRef to ensure we have the latest if this is called slightly late
    const area = currentAreaRef.current;
    const currentState = canvasStatesRef.current[area];
    if (currentState && currentState !== '') {
      canvas.loadFromJSON(currentState, () => {
        canvas.renderAll();
        setTimeout(() => canvas.renderAll(), 10);
      });
    } else {
      // Save blank state as initial history entry
      setTimeout(() => {
        saveCanvasState();
      }, 100);
    }
  }, [saveCanvasState]);

  const handleSelectionChange = useCallback((element: any) => {
    setSelectedElement(element);
  }, []);

  const handleExportArea = useCallback((dataURL: string, area: string) => {
    const link = document.createElement('a');
    link.download = `design-${area}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  }, []);

  const handleExportAll = useCallback(async () => {
    if (!canvasRef.current || !ref) return;

    // We can use the imperative handle logic or just access current canvas
    // For simplicity, let's use the local canvasRef
    if (canvasRef.current) {
      // Save current first
      const currentJson = JSON.stringify(canvasRef.current.toJSON());
      const updatedStates = { ...canvasStates, [currentArea]: currentJson };

      const exportOptions = { format: 'png', multiplier: 4 };

      for (const key of areaKeys) {
        const state = updatedStates[key];
        if (state && state !== '') {
          await new Promise<void>((resolve) => {
            canvasRef.current.loadFromJSON(state, () => {
              canvasRef.current.renderAll();
              const dataURL = canvasRef.current.toDataURL(exportOptions);
              const link = document.createElement('a');
              link.download = `design-${key}-${Date.now()}.png`;
              link.href = dataURL;
              link.click();
              resolve();
            });
          });
        }
      }

      // Restore
      canvasRef.current.loadFromJSON(currentJson, () => {
        canvasRef.current.renderAll();
      });
    }
  }, [currentArea, canvasStates, areaKeys]);

  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const handleUndo = useCallback(() => {
    const currentHistory = canvasHistories[currentArea] || [];
    const currentIndex = historyIndices[currentArea];

    if (currentIndex > 0 && canvasRef?.current) {
      const newIndex = currentIndex - 1;
      const canvasState = currentHistory[newIndex];
      
      if (!canvasState) {
        console.warn('⚠️ No canvas state for undo at index:', newIndex);
        return;
      }
      
      isInternalOperationRef.current = true;
      const stateObj = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;
      canvasRef.current.loadFromJSON(stateObj, () => {
        canvasRef.current.renderAll();
        canvasRef.current.requestRenderAll();
        setTimeout(() => {
          canvasRef.current.renderAll();
          isInternalOperationRef.current = false;
          // Force React re-render
          triggerUpdate();
        }, 50);
      });

      canvasStatesRef.current[currentArea] = canvasState;
      historyIndicesRef.current[currentArea] = newIndex;

      setHistoryIndices(prev => ({ ...prev, [currentArea]: newIndex }));
      setCanvasStates(prev => ({ ...prev, [currentArea]: canvasState }));
    }
  }, [currentArea, historyIndices, canvasHistories, triggerUpdate]);

  const handleRedo = useCallback(() => {
    const currentHistory = canvasHistories[currentArea] || [];
    const currentIndex = historyIndices[currentArea];

    if (currentIndex < currentHistory.length - 1 && canvasRef?.current) {
      const newIndex = currentIndex + 1;
      const canvasState = currentHistory[newIndex];
      
      if (!canvasState) {
        console.warn('⚠️ No canvas state for redo at index:', newIndex);
        return;
      }
      
      isInternalOperationRef.current = true;
      const stateObj = typeof canvasState === 'string' ? JSON.parse(canvasState) : canvasState;
      canvasRef.current.loadFromJSON(stateObj, () => {
        canvasRef.current.renderAll();
        canvasRef.current.requestRenderAll();
        setTimeout(() => {
          canvasRef.current.renderAll();
          isInternalOperationRef.current = false;
          // Force React re-render
          triggerUpdate();
        }, 50);
      });

      canvasStatesRef.current[currentArea] = canvasState;
      historyIndicesRef.current[currentArea] = newIndex;

      setHistoryIndices(prev => ({ ...prev, [currentArea]: newIndex }));
      setCanvasStates(prev => ({ ...prev, [currentArea]: canvasState }));
    }
  }, [currentArea, historyIndices, canvasHistories, triggerUpdate]);

  const addImageToCanvas = useCallback(async (src: string) => {
    const canvas = canvasRef?.current;
    if (!canvas) {
      toast.error('Canvas not ready. Please try again.');
      return;
    }

    const areaWidth = canvas.getWidth();
    const areaHeight = canvas.getHeight();
    const centerX = areaWidth / 2;
    const centerY = areaHeight / 2;

    const isDataUrl = src.startsWith('data:');
    try {
      let fabricImg: fabric.FabricImage;

      if (isDataUrl) {
        // File upload: use Image element for data URLs
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = src;
        });
        const maxScaleX = (areaWidth * 0.8) / img.width;
        const maxScaleY = (areaHeight * 0.8) / img.height;
        const scale = Math.min(maxScaleX, maxScaleY, 1);
        fabricImg = new fabric.FabricImage(img, {
          left: centerX, top: centerY,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale,
          selectable: true
        });
      } else {
        // URL (Design Library): use FabricImage.fromURL
        fabricImg = await fabric.FabricImage.fromURL(src, { crossOrigin: 'anonymous' });
        const w = (fabricImg.width ?? 1) * (fabricImg.scaleX ?? 1);
        const h = (fabricImg.height ?? 1) * (fabricImg.scaleY ?? 1);
        const maxScaleX = (areaWidth * 0.8) / w;
        const maxScaleY = (areaHeight * 0.8) / h;
        const scale = Math.min(maxScaleX, maxScaleY, 1);
        fabricImg.set({
          left: centerX, top: centerY,
          originX: 'center', originY: 'center',
          scaleX: scale, scaleY: scale,
          selectable: true
        });
      }

      canvas.add(fabricImg);
      canvas.setActiveObject(fabricImg);
      canvas.renderAll();
      saveCanvasState();
    } catch (err) {
      console.error('Failed to add image:', err);
      toast.error('Failed to add design. The image may not be accessible.');
    }
  }, [saveCanvasState]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef?.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (src) addImageToCanvas(src);
    };
    reader.readAsDataURL(file);
  }, [addImageToCanvas]);

  const handleAddDesignFromLibrary = useCallback((imageUrl: string) => {
    addImageToCanvas(imageUrl);
  }, [addImageToCanvas]);

  const [designLibraryOpen, setDesignLibraryOpen] = useState(false);

  const handleAddText = useCallback(() => {
    if (!canvasRef?.current) return;

    const canvas = canvasRef?.current;
    const areaWidth = canvas.getWidth();
    const areaHeight = canvas.getHeight();
    const centerX = areaWidth / 2;
    const centerY = areaHeight / 2;

    const text = new fabric.Textbox('PODTEXT', {
      left: centerX,
      top: centerY,
      originX: 'center',
      originY: 'center',
      fontFamily: 'Arial',
      fontSize: Math.max(16, Math.min(32, areaWidth / 10)),
      fill: '#000000',
      selectable: true,
      editable: true,
      width: Math.max(100, areaWidth * 0.4),
      splitByGrapheme: false
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveCanvasState();
  }, [saveCanvasState]);

  const handleAreaChange = useCallback((newArea: string) => {
    const prevArea = currentAreaRef.current;
    if (newArea === prevArea) return;

    if (canvasRef?.current) {
      const currentState = JSON.stringify(canvasRef.current.toJSON());
      canvasStatesRef.current[prevArea] = currentState;
      // Record canvas dimensions for the outgoing view
      canvasDimensionsRef.current[prevArea] = {
        width: canvasRef.current.getWidth(),
        height: canvasRef.current.getHeight()
      };
      setCanvasStates(prev => ({
        ...prev,
        [prevArea]: currentState
      }));
    }

    currentAreaRef.current = newArea;
    setCurrentArea(newArea);
    setSelectedElement(null);
  }, []);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 relative">
      <div className="flex h-full">
        <div className="w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">History</span>
            <div className="flex flex-col space-y-1">
              <button
                onClick={handleUndo}
                disabled={historyIndices[currentArea] <= 0}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Undo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndices[currentArea] >= (canvasHistories[currentArea]?.length || 0) - 1}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Redo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Color</span>
            <div
              className="w-8 h-8 rounded border-2 border-gray-300 cursor-pointer"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="grid grid-cols-2 gap-1">
              {availableColors.map((color) => (
                <div
                  key={color}
                  className="w-4 h-4 rounded cursor-pointer border border-gray-300"
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleAddText}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Add Text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          <label className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Add Image">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 3h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9a2 2 0 100-4 2 2 0 000 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
            </svg>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button
            onClick={() => setDesignLibraryOpen(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Design Library"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
        </div>

        <DesignLibraryPanel
          open={designLibraryOpen}
          onClose={() => setDesignLibraryOpen(false)}
          onSelect={handleAddDesignFromLibrary}
        />

        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex justify-center space-x-1">
              {areaKeys.map((area) => {
                const viewData = views?.find(v => v.key === area);
                const price = viewData?.price ? parseFloat(String(viewData.price)) : 0;

                return (
                  <button
                    key={area}
                    onClick={() => handleAreaChange(area)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentArea === area
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{areaDisplay[area] || area}</span>
                      {price > 0 && (
                        <span className={`text-xs mt-0.5 ${currentArea === area ? 'text-white/80 dark:text-gray-900/80' : 'text-gray-500 dark:text-gray-500'}`}>
                          {price.toFixed(2)} DH
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-6">
            <TShirtMockup
              currentArea={currentArea}
              selectedColor={selectedColor}
              onCanvasReady={handleCanvasReady}
              onSelectionChange={handleSelectionChange}
              mockups={mockups}
              printAreas={effectivePrintAreas}
              viewLabel={areaDisplay[currentArea]}
              className="max-w-full max-h-full"
            />
          </div>
        </div>

        <FloatingToolbar
          selectedElement={selectedElement}
          canvasRef={canvasRef}
          onElementUpdate={triggerUpdate}
          onDeleteElement={() => {
            if (selectedElement && canvasRef?.current) {
              canvasRef.current.remove(selectedElement);
              canvasRef.current.renderAll();
              setSelectedElement(null);
              setTimeout(() => saveCanvasState(), 100);
            }
          }}
        />
      </div>
    </div>
  );
});

DesignCanvas.displayName = 'DesignCanvas';

export default DesignCanvas;
