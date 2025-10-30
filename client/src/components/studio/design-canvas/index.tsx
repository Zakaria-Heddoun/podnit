"use client";

import React, { useState, useCallback, useRef } from 'react';
import * as fabric from 'fabric';
import TShirtMockup from './components/TShirtMockup';
import FloatingToolbar from './components/FloatingToolbar';

const DesignCanvas = () => {
  const [currentArea, setCurrentArea] = useState('front');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  
  // Separate canvas states for each side
  const [canvasStates, setCanvasStates] = useState<{[key: string]: string}>({
    front: '',
    back: '',
    left: '',
    right: ''
  });
  
  // Separate history for each side
  const [canvasHistories, setCanvasHistories] = useState<{[key: string]: string[]}>({
    front: [],
    back: [],
    left: [],
    right: []
  });
  
  const [historyIndices, setHistoryIndices] = useState<{[key: string]: number}>({
    front: -1,
    back: -1,
    left: -1,
    right: -1
  });
  
  const canvasRef = useRef<any>(null);

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
    canvasRef.current = canvas;
    
    // Add listener for text changes
    canvas.on('text:changed', () => {
      saveCanvasState();
    });
    
    // Load the current area's state if it exists
    const currentState = canvasStates[currentArea];
    if (currentState) {
      canvas.loadFromJSON(currentState, () => {
        canvas.renderAll();
        // Force a second render to ensure visibility
        setTimeout(() => {
          canvas.renderAll();
        }, 10);
      });
    } else {
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
  }, [currentArea, canvasStates, saveCanvasState]);

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
      const img = new Image();
      img.onload = () => {
        const fabricImg = new fabric.FabricImage(img, {
          left: 150,
          top: 200,
          scaleX: 0.5,
          scaleY: 0.5,
          selectable: true
        });
        canvas?.add(fabricImg);
        canvas?.setActiveObject(fabricImg);
        canvas?.renderAll();
        // Force a second render to ensure visibility
        setTimeout(() => {
          canvas?.renderAll();
        }, 10);
        // Save state after adding image
        saveCanvasState();
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [saveCanvasState]);

  const handleAddText = useCallback(() => {
    if (!canvasRef?.current) return;

    const canvas = canvasRef?.current;
    const text = new fabric.Textbox('PODTEXT', {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 24,
      fill: '#FFFFFF',
      selectable: true,
      editable: true,
      width: 140,
      splitByGrapheme: false
    });
    canvas?.add(text);
    canvas?.setActiveObject(text);
    canvas?.renderAll();
    // Force a second render to ensure visibility
    setTimeout(() => {
      canvas?.renderAll();
    }, 10);
    // Save state after adding text
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

  // Color options
  const colors = ['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];

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
              {colors.map((color) => (
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
                    const dataURL = canvasRef.current.toDataURL('image/png');
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
                  const designs = {
                    front: canvasRef?.current?.toDataURL('image/png'),
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
              {['front', 'back', 'left', 'right'].map((area) => (
                <button
                  key={area}
                  onClick={() => handleAreaChange(area)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentArea === area
                      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {area.charAt(0).toUpperCase() + area.slice(1)}
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
};

export default DesignCanvas;