import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Square, Move, Trash2, Scissors, Copy, FlipHorizontal, FlipVertical, Edit3, 
  Minus, PenTool, Circle, Triangle, 
  CornerUpLeft, Smile, ArrowRightFromLine, Undo2, Redo2, RectangleHorizontal,
  ChevronRight
} from 'lucide-react';
import { ShapeType, ToolMode } from '../types/shapes';

interface HorizontalToolbarProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectedTool: ShapeType | null;
  setSelectedTool: (tool: ShapeType | null) => void;
  onDuplicate: () => void;
  onMirror: (axis: 'horizontal' | 'vertical') => void;
  onDelete: () => void;
  onOffset: () => void;
  onFillet: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  hasSelection: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  isOperationInProgress?: boolean;
}

const KEYBOARD_SHORTCUTS = {
  select: 'V',
  draw: 'P',
  editNodes: 'A',
  trim: 'T',
  line: 'L',
  arc: 'C',
  circle: 'O',
  rectangle: 'R',
  triangle: 'Y',
  duplicate: 'Ctrl+D',
  delete: 'Del',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  offset: 'Ctrl+O',
  fillet: 'Ctrl+F'
};

export const HorizontalToolbar: React.FC<HorizontalToolbarProps> = ({
  toolMode,
  setToolMode,
  selectedTool,
  setSelectedTool,
  onDuplicate,
  onMirror,
  onDelete,
  onOffset,
  onFillet,
  onUndo,
  onRedo,
  hasSelection,
  canUndo = false,
  canRedo = false,
  isOperationInProgress = false
}) => {
  const [showOverflowIndicator, setShowOverflowIndicator] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkOverflow = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setShowOverflowIndicator(container.scrollWidth > container.clientWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [toolMode, selectedTool, hasSelection]);

  const handleModeChange = (mode: ToolMode) => {
    setToolMode(mode);
    // Clear tool selection when switching modes
    if (mode !== 'draw') {
      setSelectedTool(null);
    }
  };

  return (
    <div className="bg-white border-b shadow-sm" role="toolbar" aria-label="Design Tools">
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="flex items-center gap-2 p-3 overflow-x-auto scrollbar-thin"
        >
          {/* Undo/Redo */}
          {(onUndo || onRedo) && (
            <div className="flex items-center gap-1 border-r pr-3">
              {onUndo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onUndo}
                  disabled={!canUndo || isOperationInProgress}
                  title={`Undo (${KEYBOARD_SHORTCUTS.undo})`}
                  aria-label={`Undo (${KEYBOARD_SHORTCUTS.undo})`}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              )}
              {onRedo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRedo}
                  disabled={!canRedo || isOperationInProgress}
                  title={`Redo (${KEYBOARD_SHORTCUTS.redo})`}
                  aria-label={`Redo (${KEYBOARD_SHORTCUTS.redo})`}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Mode Buttons */}
          <div className="flex items-center gap-1 border-r pr-3" role="group" aria-label="Tool Modes">
            <Button
              variant={toolMode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('select')}
              disabled={isOperationInProgress}
              title={`Select Mode (${KEYBOARD_SHORTCUTS.select})`}
              aria-label={`Select Mode (${KEYBOARD_SHORTCUTS.select})`}
              aria-pressed={toolMode === 'select'}
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant={toolMode === 'draw' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('draw')}
              disabled={isOperationInProgress}
              title={`Draw Mode (${KEYBOARD_SHORTCUTS.draw})`}
              aria-label={`Draw Mode (${KEYBOARD_SHORTCUTS.draw})`}
              aria-pressed={toolMode === 'draw'}
            >
              <PenTool className="h-4 w-4" />
            </Button>
            <Button
              variant={toolMode === 'edit-nodes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('edit-nodes')}
              disabled={isOperationInProgress}
              title={`Edit Nodes (${KEYBOARD_SHORTCUTS.editNodes})`}
              aria-label={`Edit Nodes (${KEYBOARD_SHORTCUTS.editNodes})`}
              aria-pressed={toolMode === 'edit-nodes'}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant={toolMode === 'trim' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleModeChange('trim')}
              disabled={isOperationInProgress}
              title={`Trim Mode (${KEYBOARD_SHORTCUTS.trim})`}
              aria-label={`Trim Mode (${KEYBOARD_SHORTCUTS.trim})`}
              aria-pressed={toolMode === 'trim'}
            >
              <Scissors className="h-4 w-4" />
            </Button>
          </div>

          {/* Shape Buttons */}
          {toolMode === 'draw' && (
            <div className="flex items-center gap-1 border-r pr-3" role="group" aria-label="Shape Tools">
              <Button
                variant={selectedTool === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('line')}
                disabled={isOperationInProgress}
                title={`Line (${KEYBOARD_SHORTCUTS.line})`}
                aria-label={`Line (${KEYBOARD_SHORTCUTS.line})`}
                aria-pressed={selectedTool === 'line'}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'arc' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('arc')}
                disabled={isOperationInProgress}
                title={`Arc (${KEYBOARD_SHORTCUTS.arc})`}
                aria-label={`Arc (${KEYBOARD_SHORTCUTS.arc})`}
                aria-pressed={selectedTool === 'arc'}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('circle')}
                disabled={isOperationInProgress}
                title={`Circle (${KEYBOARD_SHORTCUTS.circle})`}
                aria-label={`Circle (${KEYBOARD_SHORTCUTS.circle})`}
                aria-pressed={selectedTool === 'circle'}
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('rectangle')}
                disabled={isOperationInProgress}
                title={`Rectangle (${KEYBOARD_SHORTCUTS.rectangle})`}
                aria-label={`Rectangle (${KEYBOARD_SHORTCUTS.rectangle})`}
                aria-pressed={selectedTool === 'rectangle'}
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'triangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('triangle')}
                disabled={isOperationInProgress}
                title={`Triangle (${KEYBOARD_SHORTCUTS.triangle})`}
                aria-label={`Triangle (${KEYBOARD_SHORTCUTS.triangle})`}
                aria-pressed={selectedTool === 'triangle'}
              >
                <Triangle className="h-4 w-4" />
              </Button>
              <Button
                variant={selectedTool === 'l-shape-tl' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('l-shape-tl')}
                disabled={isOperationInProgress}
                title="L-Shape"
                aria-label="L-Shape"
                aria-pressed={selectedTool === 'l-shape-tl'}
              >
                <CornerUpLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Transform Buttons */}
          {hasSelection && (
            <div className="flex items-center gap-1 border-r pr-3" role="group" aria-label="Transform Tools">
              <Button
                variant="outline"
                size="sm"
                onClick={onDuplicate}
                disabled={isOperationInProgress}
                title={`Duplicate (${KEYBOARD_SHORTCUTS.duplicate})`}
                aria-label={`Duplicate (${KEYBOARD_SHORTCUTS.duplicate})`}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMirror('horizontal')}
                disabled={isOperationInProgress}
                title="Mirror Horizontal"
                aria-label="Mirror Horizontal"
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMirror('vertical')}
                disabled={isOperationInProgress}
                title="Mirror Vertical"
                aria-label="Mirror Vertical"
              >
                <FlipVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOffset}
                disabled={isOperationInProgress}
                title={`Offset (${KEYBOARD_SHORTCUTS.offset})`}
                aria-label={`Offset (${KEYBOARD_SHORTCUTS.offset})`}
              >
                <ArrowRightFromLine className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onFillet}
                disabled={isOperationInProgress}
                title={`Fillet Corners (${KEYBOARD_SHORTCUTS.fillet})`}
                aria-label={`Fillet Corners (${KEYBOARD_SHORTCUTS.fillet})`}
              >
                <RectangleHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isOperationInProgress}
                title={`Delete (${KEYBOARD_SHORTCUTS.delete})`}
                aria-label={`Delete (${KEYBOARD_SHORTCUTS.delete})`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Overflow Indicator */}
        {showOverflowIndicator && (
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent flex items-center justify-end pr-2 pointer-events-none">
            <ChevronRight className="h-5 w-5 text-gray-400 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};
