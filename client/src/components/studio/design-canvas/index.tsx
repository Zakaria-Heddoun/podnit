"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import TShirtMockup from './components/TShirtMockup';
import FloatingToolbar from './components/FloatingToolbar';

export interface DesignCanvasRef {
  getDesignData: () => Promise<{
    designConfig: any;
    images: Record<string, string | null>;
  }>;
  loadDesignData: (designConfig: any) => void;
}

interface DesignCanvasProps {
  readOnly?: boolean;
  availableColors?: string[];
  mockups?: Record<string, string | null>;
  printAreas?: Record<string, { x: number; y: number; width: number; height: number }>;
  views?: { key: string; name: string; mockup?: string | null; area?: { x: number; y: number; width: number; height: number } }[];
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
  const areaKeys = React.useMemo(() => {
    if (views && views.length > 0) return views.map(v => v.key);
    return ['big-front', 'small-front', 'back', 'left', 'right'];
  }, [views]);

  const areaDisplay = React.useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (views && views.length > 0) {
      views.forEach(v => { map[v.key] = v.name || v.key; });
    } else {
      map['big-front'] = 'Big Front';
      map['small-front'] = 'Small Front';
      map['back'] = 'Back';
      map['left'] = 'Left';
      map['right'] = 'Right';
    }
    return map;
  }, [views]);

  const [currentArea, setCurrentArea] = useState(areaKeys[0] || 'big-front');
  const resolvedColors = incomingColors && incomingColors.length > 0 ? incomingColors : fallbackColors;
  const [selectedColor, setSelectedColor] = useState(resolvedColors[0] || '#FFFFFF');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [availableColors, setAvailableColors] = useState<string[]>(resolvedColors);

  const effectivePrintAreas = React.useMemo(() => {
    const map: Record<string, { x: number; y: number; width: number; height: number }> = {};
    if (printAreas) {
      Object.assign(map, printAreas);
    }
    if (views) {
      views.forEach(v => {
        if (v.area) {
          map[v.key] = v.area;
        }
      });
    }
    return map;
  }, [printAreas, views]);

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

  // Synchronous clones of state for use in event listeners and during switches
  const isInitializedRef = useRef(false);
  const isInternalOperationRef = useRef(false);
  const prevAreaKeysRef = useRef<string[]>([]);
  const currentAreaRef = useRef(currentArea);
  const canvasStatesRef = useRef(canvasStates);
  const historyIndicesRef = useRef(historyIndices);

  // Sync refs with state
  useEffect(() => { currentAreaRef.current = currentArea; }, [currentArea]);
  useEffect(() => { canvasStatesRef.current = canvasStates; }, [canvasStates]);
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
    if (!canvasRef?.current || isInternalOperationRef.current) return;

    const canvas = canvasRef.current;
    const canvasState = JSON.stringify(canvas.toJSON());
    const area = currentAreaRef.current;

    // Update REF immediately so it's available for subsequent calls or switches
    canvasStatesRef.current[area] = canvasState;

    setCanvasStates(prev => ({
      ...prev,
      [area]: canvasState
    }));

    setCanvasHistories(prev => {
      const currentHistory = prev[area] || [];
      const currentIndex = historyIndicesRef.current[area] ?? -1;
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(canvasState);
      return {
        ...prev,
        [area]: newHistory
      };
    });

    setHistoryIndices(prev => {
      const nextIdx = (prev[area] ?? -1) + 1;
      historyIndicesRef.current[area] = nextIdx;
      return {
        ...prev,
        [area]: nextIdx
      };
    });
  }, []);

  React.useImperativeHandle(ref, () => ({
    getDesignData: async () => {
      const area = currentAreaRef.current;
      if (!canvasRef.current) {
        console.error('❌ No canvas reference available');
        return {
          designConfig: {
            states: canvasStates,
            color: selectedColor,
            views: views?.map(v => ({ key: v.key, name: v.name, area: v.area })),
          },
          images: areaKeys.reduce((acc, key) => { acc[key] = null; return acc; }, {} as Record<string, string | null>)
        };
      }

      // Step 1: Save the current canvas state for the active view
      const currentJson = JSON.stringify(canvasRef.current.toJSON());
      const updatedStates = {
        ...canvasStatesRef.current,
        [area]: currentJson
      };

      console.log('📤 Starting design export:', {
        currentArea: area,
        totalViews: areaKeys.length,
        viewsWithState: Object.keys(updatedStates).filter(k => updatedStates[k] && updatedStates[k] !== ''),
        canvasObjects: canvasRef.current.getObjects().length
      });

      // Log each state's content length to see if they're actually different
      console.log('📊 States summary:');
      areaKeys.forEach(key => {
        const state = updatedStates[key];
        console.log(`  ${key}: ${state ? `${state.length} chars, ${state === '' ? 'empty' : 'has data'}` : 'null/undefined'}`);
      });

      const images: Record<string, string | null> = {};
      
      // LOCK to prevent events during export
      isInternalOperationRef.current = true;

      // Helper to load a state onto the canvas
      const loadState = (json: string): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (!json || json === '') {
            canvasRef.current.clear();
            canvasRef.current.renderAll();
            resolve();
            return;
          }
          
          try {
            canvasRef.current.loadFromJSON(json, () => {
              canvasRef.current.renderAll();
              // Give it a moment to fully render
              setTimeout(() => resolve(), 50);
            }, (err: any) => {
              console.error('Error loading JSON:', err);
              reject(err);
            });
          } catch (e) {
            reject(e);
          }
        });
      };

      // Store original canvas dimensions to restore later
      const originalWidth = canvasRef.current.getWidth();
      const originalHeight = canvasRef.current.getHeight();
      const originalViewport = canvasRef.current.viewportTransform;

      // Export each view's image
      for (const viewKey of areaKeys) {
        const state = updatedStates[viewKey];
        
        // Check if this view has any design
        if (!state || state === '' || state === '{}') {
          console.log(`⏭️ Skipping ${viewKey}: no design data`);
          images[viewKey] = null;
          continue;
        }

        try {
          console.log(`\n📸 Exporting ${viewKey}...`);
          
          // Parse the state to check if it actually has objects
          const stateObj = JSON.parse(state);
          const objectCount = stateObj?.objects?.length || 0;
          
          if (objectCount === 0) {
            console.log(`⏭️ Skipping ${viewKey}: state has no objects`);
            images[viewKey] = null;
            continue;
          }
          
          console.log(`  └─ Loading state with ${objectCount} objects`);
          
          // CRITICAL: Set canvas dimensions to match this specific view's print area
          // This ensures the exported image matches what the user designed
          const viewPrintArea = effectivePrintAreas[viewKey] || { x: 28, y: 28, width: 44, height: 60 };
          const CANVAS_MARGIN = 40;
          const baseWidth = 500;
          const baseHeight = 600;
          
          // Calculate the exact canvas dimensions for this view
          const areaPxWidth = (viewPrintArea.width / 100) * baseWidth;
          const areaPxHeight = (viewPrintArea.height / 100) * baseHeight;
          const viewCanvasWidth = areaPxWidth + (CANVAS_MARGIN * 2);
          const viewCanvasHeight = areaPxHeight + (CANVAS_MARGIN * 2);
          
          console.log(`  └─ Setting canvas to ${viewKey} dimensions: ${viewCanvasWidth}x${viewCanvasHeight}`);
          
          // Resize canvas to this view's dimensions
          canvasRef.current.setDimensions({
            width: viewCanvasWidth,
            height: viewCanvasHeight
          });
          canvasRef.current.setViewportTransform([1, 0, 0, 1, CANVAS_MARGIN, CANVAS_MARGIN]);
          
          // Load this view's state onto the properly-sized canvas
          await loadState(state);
          
          // Wait for render to complete
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Export the canvas as PNG with high quality
          const dataURL = canvasRef.current.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 2  // 2x resolution for better quality
          });
          
          images[viewKey] = dataURL;
          console.log(`  ✅ Exported successfully (${Math.round(dataURL.length / 1024)}KB, ${viewCanvasWidth}x${viewCanvasHeight})`);
          
        } catch (error) {
          console.error(`  ❌ Error exporting ${viewKey}:`, error);
          images[viewKey] = null;
        }
      }

      // Restore original canvas dimensions
      console.log(`\n🔄 Restoring original canvas dimensions: ${originalWidth}x${originalHeight}`);
      canvasRef.current.setDimensions({
        width: originalWidth,
        height: originalHeight
      });
      canvasRef.current.setViewportTransform(originalViewport);

      // Restore the original view's state
      console.log(`\n🔄 Restoring original view: ${area}`);
      await loadState(updatedStates[area] || '');
      
      isInternalOperationRef.current = false;

      console.log('\n✅ Export complete:', {
        totalViews: areaKeys.length,
        successfulExports: Object.values(images).filter(img => img !== null).length,
        exportedViews: Object.keys(images).filter(k => images[k] !== null)
      });

      return {
        designConfig: {
          states: updatedStates,
          color: selectedColor,
          views: views?.map(v => ({ key: v.key, name: v.name, area: v.area })),
        },
        images
      };
    },
    loadDesignData: (designConfig: any) => {
      console.log('📥 Loading design data into canvas:', {
        hasStates: !!designConfig?.states,
        hasColor: !!designConfig?.color,
        hasViews: !!designConfig?.views,
        stateKeys: designConfig?.states ? Object.keys(designConfig.states) : [],
        currentArea: currentAreaRef.current,
        areaKeys: areaKeys
      });

      if (designConfig?.states) {
        // Validate that states match the expected area keys
        const stateKeys = Object.keys(designConfig.states);
        const validStates: Record<string, string> = {};
        
        // Only load states that correspond to valid area keys
        stateKeys.forEach(key => {
          if (areaKeys.includes(key)) {
            validStates[key] = designConfig.states[key];
            console.log(`✅ Loading state for view: ${key}`);
          } else {
            console.warn(`⚠️ Skipping invalid state key: ${key} (not in areaKeys)`);
          }
        });

        setCanvasStates(validStates);
        // Important: Update Ref too for sync access
        canvasStatesRef.current = validStates;

        const area = currentAreaRef.current;
        const currentState = validStates[area];
        
        if (currentState && canvasRef.current) {
          console.log(`📥 Loading canvas state for current area: ${area}`);
          isInternalOperationRef.current = true;
          canvasRef.current.loadFromJSON(currentState, () => {
            canvasRef.current.renderAll();
            isInternalOperationRef.current = false;
            console.log(`✅ Canvas state loaded for: ${area}`);
          });
        } else {
          console.log(`ℹ️ No state found for current area: ${area}`);
        }
      }
      
      if (designConfig?.color) {
        setSelectedColor(designConfig.color);
        setAvailableColors((prev) =>
          prev.includes(designConfig.color) ? prev : [...prev, designConfig.color]
        );
      }
    }
  }), [areaKeys, currentArea, canvasStates, selectedColor, views, effectivePrintAreas]);

  // Effect to load canvas state when currentArea changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isInitializedRef.current) return;

    // Use synchronous Ref to get the latest state during transitions
    const currentState = canvasStatesRef.current[currentArea];

    isInternalOperationRef.current = true;
    if (currentState && currentState !== '') {
      canvas.clear();
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
      isInternalOperationRef.current = false;
    }
  }, [currentArea]);

  const handleCanvasReady = useCallback((canvas: any) => {
    canvasRef.current = canvas;

    // Use a stable event listener that calls our ref-aware save function
    canvas.on('text:changed', () => {
      saveCanvasState();
    });

    // Handle generic object modifications
    canvas.on('object:modified', () => {
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
    const currentIndex = historyIndices[currentArea];
    const currentHistory = canvasHistories[currentArea] || [];

    if (currentIndex > 0 && canvasRef?.current) {
      const newIndex = currentIndex - 1;
      const canvasState = currentHistory[newIndex];
      canvasRef.current.loadFromJSON(canvasState, () => {
        canvasRef.current.renderAll();
      });

      canvasStatesRef.current[currentArea] = canvasState;
      historyIndicesRef.current[currentArea] = newIndex;

      setHistoryIndices(prev => ({ ...prev, [currentArea]: newIndex }));
      setCanvasStates(prev => ({ ...prev, [currentArea]: canvasState }));
    }
  }, [currentArea, historyIndices, canvasHistories]);

  const handleRedo = useCallback(() => {
    const currentIndex = historyIndices[currentArea];
    const currentHistory = canvasHistories[currentArea] || [];

    if (currentIndex < currentHistory.length - 1 && canvasRef?.current) {
      const newIndex = currentIndex + 1;
      const canvasState = currentHistory[newIndex];
      canvasRef.current.loadFromJSON(canvasState, () => {
        canvasRef.current.renderAll();
      });

      canvasStatesRef.current[currentArea] = canvasState;
      historyIndicesRef.current[currentArea] = newIndex;

      setHistoryIndices(prev => ({ ...prev, [currentArea]: newIndex }));
      setCanvasStates(prev => ({ ...prev, [currentArea]: canvasState }));
    }
  }, [currentArea, historyIndices, canvasHistories]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef?.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) return;

      const areaWidth = canvas.getWidth();
      const areaHeight = canvas.getHeight();
      const centerX = areaWidth / 2;
      const centerY = areaHeight / 2;

      const img = new Image();
      img.onload = () => {
        const maxScaleX = (areaWidth * 0.8) / img.width;
        const maxScaleY = (areaHeight * 0.8) / img.height;
        const scale = Math.min(maxScaleX, maxScaleY, 1);

        const fabricImg = new fabric.FabricImage(img, {
          left: centerX,
          top: centerY,
          originX: 'center',
          originY: 'center',
          scaleX: scale,
          scaleY: scale,
          selectable: true
        });

        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.renderAll();
        saveCanvasState();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [saveCanvasState]);

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

          <div className="flex flex-col items-center space-y-2 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">Export</span>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  if (canvasRef?.current) {
                    const dataURL = canvasRef.current.toDataURL({ format: 'png', multiplier: 1 });
                    handleExportArea(dataURL, currentArea);
                  }
                }}
                className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                title={`Export ${currentArea.charAt(0).toUpperCase() + currentArea.slice(1)}`}
              >
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={handleExportAll}
                className="p-2 rounded-lg bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                title="Export All Areas"
              >
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex justify-center space-x-1">
              {areaKeys.map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaChange(area)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${currentArea === area
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {areaDisplay[area] || area}
                </button>
              ))}
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
