"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import TShirtMockup from './components/TShirtMockup';
import FloatingToolbar from './components/FloatingToolbar';

// ... existing imports ...

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

  // Separate canvas states for each side (dynamic)
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

  useEffect(() => {
    setCurrentArea(areaKeys[0] || 'big-front');
    setCanvasStates(initStates);
    setCanvasHistories(initHistories);
    setHistoryIndices(initHistoryIdx);
  }, [areaKeys, initHistories, initHistoryIdx, initStates]);

  useEffect(() => {
    const nextColors = incomingColors && incomingColors.length > 0 ? incomingColors : fallbackColors;
    setAvailableColors(nextColors);
    setSelectedColor(prev => nextColors.includes(prev) ? prev : (nextColors[0] || '#FFFFFF'));
  }, [incomingColors]);

  React.useImperativeHandle(ref, () => ({
    getDesignData: async () => {
      // Save current canvas state first
      if (canvasRef.current) {
        const currentJson = JSON.stringify(canvasRef.current.toJSON());
        const updatedStates = {
          ...canvasStates,
          [currentArea]: currentJson
        };
        setCanvasStates(updatedStates);

        const exportOptions = { format: 'png', multiplier: 4 };

        // Export all areas based on saved states
        const images: Record<string, string | null> = {};
        const originalState = currentJson;

        const loadState = (canvasObj: any, json: string) =>
          new Promise<void>((resolve, reject) => {
            // Always reset to avoid leaking previous view drawings
            canvasObj.clear();
            canvasObj.renderAll();
            if (!json) {
              return resolve();
            }
            canvasObj.loadFromJSON(json, () => {
              canvasObj.renderAll();
              resolve();
            }, (err: any) => reject(err));
          });

        for (const key of areaKeys) {
          const state = updatedStates[key];
          if (!state) {
            images[key] = null;
            continue;
          }
          try {
            await loadState(canvasRef.current, state);
            images[key] = canvasRef.current.toDataURL(exportOptions);
          } catch (e) {
            console.error('Error exporting state', key, e);
            images[key] = null;
          }
        }

        // Restore original state for current area
        await loadState(canvasRef.current, originalState);

        return {
          designConfig: {
            states: updatedStates,
            color: selectedColor,
            views: views?.map(v => ({ key: v.key, name: v.name, area: v.area })),
          },
          images
        };
      }

      // Fallback
      return {
        designConfig: {
          states: canvasStates,
          color: selectedColor,
          views: views?.map(v => ({ key: v.key, name: v.name, area: v.area })),
        },
        images: areaKeys.reduce((acc, key) => { acc[key] = null; return acc; }, {} as Record<string, string | null>)
      };
    },
    loadDesignData: (designConfig: any) => {
      console.log('=== loadDesignData called ===');
      console.log('designConfig:', designConfig);
      console.log('designConfig.states:', designConfig?.states);
      console.log('currentArea:', currentArea);

      if (designConfig?.states) {
        setCanvasStates(designConfig.states);

        // Load initial state for current area immediately if possible
        const currentState = designConfig.states[currentArea];
        console.log('Current area state:', currentState);

        if (currentState && canvasRef.current) {
          console.log('Loading canvas state for', currentArea);
          canvasRef.current.loadFromJSON(currentState, () => {
            canvasRef.current.renderAll();
            console.log('Canvas rendered successfully');
          });
        } else {
          console.log('No state found for current area or no canvas ref');
        }
      }
      if (designConfig?.color) {
        setSelectedColor(designConfig.color);
        setAvailableColors((prev) =>
          prev.includes(designConfig.color) ? prev : [...prev, designConfig.color]
        );
      }
    }
  }));

  // Undo/Redo functionality
  const saveCanvasState = useCallback(() => {
    if (!canvasRef?.current) return;

    const canvasState = JSON.stringify(canvasRef.current.toJSON());

    // Update the current area's state
    setCanvasStates(prev => ({
      ...prev,
      [currentArea]: canvasState
    }));

    // Update the current area's history
    setCanvasHistories(prev => {
      const currentHistory = prev[currentArea] || [];
      const currentIndex = historyIndices[currentArea];
      const newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(canvasState);
      return {
        ...prev,
        [currentArea]: newHistory
      };
    });

    // Update the current area's history index
    setHistoryIndices(prev => ({
      ...prev,
      [currentArea]: prev[currentArea] + 1
    }));
  }, [currentArea, historyIndices]);

  // Canvas event handlers
  const handleCanvasReady = useCallback((canvas: any) => {
    console.log('=== CANVAS READY ===');
    console.log('Current area:', currentArea);
    console.log('Canvas states available:', Object.keys(canvasStates));

    canvasRef.current = canvas;

    // Add listener for text changes
    canvas.on('text:changed', () => {
      saveCanvasState();
    });

    // Load the current area's state if it exists
    const currentState = canvasStates[currentArea];
    if (currentState) {
      console.log('Loading saved state for', currentArea);
      canvas.loadFromJSON(currentState, () => {
        canvas.renderAll();
        // Force a second render to ensure visibility
        setTimeout(() => {
          canvas.renderAll();
        }, 10);
      });
    } else {
      console.log('No saved state, initializing empty canvas for', currentArea);
      // Save initial empty state for new area
      const initialState = JSON.stringify(canvas.toJSON());
      setCanvasStates(prev => ({
        ...prev,
        [currentArea]: initialState
      }));
      setCanvasHistories(prev => ({
        ...prev,
        [currentArea]: [initialState]
      }));
      setHistoryIndices(prev => ({
        ...prev,
        [currentArea]: 0
      }));
    }
    console.log('=== END CANVAS READY ===');
  }, [currentArea, saveCanvasState]); // REMOVED canvasStates dependency!

  const handleSelectionChange = useCallback((element: any) => {
    setSelectedElement(element);
  }, []);

  // Mobile property panel state
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Force re-render of selected element properties
  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => {
    forceUpdate({});
  }, []);

  const handleExportArea = (dataURL: string, area: string) => {
    console.log(`Exporting ${area}:`, dataURL);
    // Here you could implement actual export functionality
    // For now, we'll trigger a download
    const link = document.createElement('a');
    link.download = `design-${area}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleExportAll = (designs: any) => {
    console.log('Exporting all designs:', designs);
    // Here you could implement bulk export functionality
    Object.entries(designs).forEach(([area, dataURL]) => {
      if (dataURL) {
        const link = document.createElement('a');
        link.download = `design-${area}-${Date.now()}.png`;
        link.href = dataURL as string;
        link.click();
      }
    });
  };

  const handleUndo = useCallback(() => {
    const currentIndex = historyIndices[currentArea];
    const currentHistory = canvasHistories[currentArea] || [];

    if (currentIndex > 0 && canvasRef?.current) {
      const newIndex = currentIndex - 1;
      const canvasState = currentHistory[newIndex];
      canvasRef.current.loadFromJSON(canvasState, () => {
        canvasRef.current.renderAll();
      });
      setHistoryIndices(prev => ({
        ...prev,
        [currentArea]: newIndex
      }));
      // Update current area's state
      setCanvasStates(prev => ({
        ...prev,
        [currentArea]: canvasState
      }));
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
      setHistoryIndices(prev => ({
        ...prev,
        [currentArea]: newIndex
      }));
      // Update current area's state
      setCanvasStates(prev => ({
        ...prev,
        [currentArea]: canvasState
      }));
    }
  }, [currentArea, historyIndices, canvasHistories]);

  // Essential toolbar actions
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !canvasRef?.current) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const canvas = canvasRef?.current;
      if (!canvas) {
        console.error('Canvas ref is null during image load');
        return;
      }

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

        setTimeout(() => {
          canvas.renderAll();
        }, 10);
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
      fontSize: Math.max(16, Math.min(32, areaWidth / 8)),
      fill: '#FFFFFF',
      selectable: true,
      editable: true,
      width: Math.max(80, areaWidth * 0.5),
      splitByGrapheme: false
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    setTimeout(() => {
      canvas.renderAll();
    }, 10);
    saveCanvasState();
  }, [saveCanvasState]);

  // Area switching
  const handleAreaChange = useCallback((newArea: string) => {
    // Save current area's state before switching
    if (canvasRef?.current) {
      const currentState = JSON.stringify(canvasRef.current.toJSON());
      setCanvasStates(prev => ({
        ...prev,
        [currentArea]: currentState
      }));
    }

    // Switch to new area
    setCurrentArea(newArea);
    setSelectedElement(null);

    // Load new area's state
    setTimeout(() => {
      if (canvasRef?.current) {
        const newAreaState = canvasStates[newArea];
        if (newAreaState) {
          canvasRef.current.loadFromJSON(newAreaState, () => {
            canvasRef.current.renderAll();
            // Force a second render to ensure visibility
            setTimeout(() => {
              canvasRef.current.renderAll();
            }, 10);
          });
        } else {
          // Clear canvas for new area
          canvasRef.current.clear();
          canvasRef.current.renderAll();
        }
      }
    }, 50);
  }, [currentArea, canvasStates]);

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* Main Content */}
      <div className="flex h-full">
        {/* Left Toolbar - Essential Tools Only */}
        <div className="w-20 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-4">
          {/* Undo/Redo */}
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

          {/* Color Selector */}
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

          {/* Add Text */}
          <button
            onClick={handleAddText}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title="Add Text"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>

          {/* Add Image */}
          <label className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer" title="Add Image">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 3h16a2 2 0 012 2v14a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9a2 2 0 100-4 2 2 0 000 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          {/* Export Actions */}
          <div className="flex flex-col items-center space-y-2 mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">Export</span>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => {
                  if (canvasRef?.current) {
                    const dataURL = canvasRef.current.toDataURL({ format: 'png', multiplier: 1 }); // Keep PNG for download
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
                onClick={() => {
                  const exportOptions: any = { format: 'jpeg', quality: 0.8 };
                  const designs = {
                    'big-front': canvasRef?.current?.toDataURL(exportOptions),
                    'small-front': null,
                    back: null,
                    leftSleeve: null,
                    rightSleeve: null
                  };
                  handleExportAll(designs);
                }}
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

        {/* Center Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Design Area Tabs */}
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

          {/* T-Shirt Mockup - Centered */}
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

        {/* Floating Toolbar */}
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
