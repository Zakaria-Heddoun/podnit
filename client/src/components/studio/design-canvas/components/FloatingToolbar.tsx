import React from 'react';

interface FloatingToolbarProps {
  selectedElement: any;
  canvasRef: React.RefObject<any>;
  onElementUpdate: () => void;
  onDeleteElement: () => void;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  selectedElement,
  canvasRef,
  onElementUpdate,
  onDeleteElement,
}) => {
  if (!selectedElement) return null;

  const handleFontFamilyChange = (fontFamily: string) => {
    if (selectedElement && canvasRef?.current) {
      selectedElement.set('fontFamily', fontFamily);
      canvasRef.current.renderAll();
      onElementUpdate();
    }
  };

  const handleFontSizeChange = (fontSize: number) => {
    if (selectedElement && canvasRef?.current) {
      selectedElement.set('fontSize', fontSize);
      canvasRef.current.renderAll();
      onElementUpdate();
    }
  };

  const handleTextStyleToggle = (property: string, value?: any) => {
    if (selectedElement && canvasRef?.current) {
      switch (property) {
        case 'bold':
          const currentWeight = selectedElement.fontWeight || 'normal';
          selectedElement.set('fontWeight', currentWeight === 'bold' ? 'normal' : 'bold');
          break;
        case 'italic':
          const currentStyle = selectedElement.fontStyle || 'normal';
          selectedElement.set('fontStyle', currentStyle === 'italic' ? 'normal' : 'italic');
          break;
        case 'underline':
          selectedElement.set('underline', !selectedElement.underline);
          break;
        case 'strikethrough':
          selectedElement.set('linethrough', !selectedElement.linethrough);
          break;

        case 'fill':
          selectedElement.set('fill', value);
          break;
      }
      canvasRef.current.renderAll();
      onElementUpdate();
    }
  };

  const handleTextContentChange = (newText: string) => {
    if (selectedElement && canvasRef?.current) {
      selectedElement.set('text', newText);
      canvasRef.current.renderAll();
      onElementUpdate();
    }
  };

  const isTextElement = selectedElement?.type === 'textbox' || selectedElement?.type === 'text';

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
      <div className="flex items-center space-x-1 max-w-screen-lg overflow-x-auto">
        {/* Text Content Input */}
        {isTextElement && (
          <>
            <input
              type="text"
              value={selectedElement.text || ''}
              onChange={(e) => handleTextContentChange(e.target.value)}
              placeholder="Edit text..."
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px] max-w-[200px]"
            />
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
          </>
        )}

        {/* Font Family Dropdown */}
        {isTextElement && (
          <select
            value={selectedElement.fontFamily || 'Arial'}
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[100px] sm:min-w-[120px]"
          >
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Times New Roman">Times</option>
            <option value="Courier New">Courier</option>
            <option value="Georgia">Georgia</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans</option>
          </select>
        )}

        {/* Divider */}
        {isTextElement && <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>}

        {/* Font Size */}
        {isTextElement && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleFontSizeChange(Math.max(8, (selectedElement.fontSize || 24) - 2))}
              className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              -
            </button>
            <input
              type="number"
              value={selectedElement.fontSize || 24}
              onChange={(e) => handleFontSizeChange(parseInt(e.target.value) || 24)}
              className="w-12 px-1 py-1 text-xs text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              min="8"
              max="72"
            />
            <button
              onClick={() => handleFontSizeChange(Math.min(72, (selectedElement.fontSize || 24) + 2))}
              className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              +
            </button>
          </div>
        )}

        {/* Divider */}
        {isTextElement && <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>}

        {/* Text Formatting */}
        {isTextElement && (
          <>
            <button
              onClick={() => handleTextStyleToggle('bold')}
              className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded ${
                selectedElement.fontWeight === 'bold'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              B
            </button>
            <button
              onClick={() => handleTextStyleToggle('italic')}
              className={`w-8 h-8 flex items-center justify-center text-sm italic rounded ${
                selectedElement.fontStyle === 'italic'
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              I
            </button>
            <button
              onClick={() => handleTextStyleToggle('underline')}
              className={`w-8 h-8 flex items-center justify-center text-sm underline rounded ${
                selectedElement.underline
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              U
            </button>
            <button
              onClick={() => handleTextStyleToggle('strikethrough')}
              className={`w-8 h-8 flex items-center justify-center text-sm line-through rounded ${
                selectedElement.linethrough
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              S
            </button>
          </>
        )}

        {/* Text Color */}
        {isTextElement && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
            <div className="relative">
              <input
                type="color"
                value={selectedElement.fill || '#000000'}
                onChange={(e) => handleTextStyleToggle('fill', e.target.value)}
                className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                title="Text Color"
              />
            </div>
          </>
        )}

        {/* Delete Button */}
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        <button
          onClick={onDeleteElement}
          className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
          title="Delete Element"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FloatingToolbar;