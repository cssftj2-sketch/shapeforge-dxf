import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Square, Move, Trash2, Scissors, Copy, FlipHorizontal, Edit3, 
  Minus, PenTool, Circle as CircleIcon, Triangle as TriangleIcon, 
  CornerUpLeft, Smile, ArrowRightFromLine 
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
  hasSelection: boolean;
}

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
  hasSelection
}) => {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="flex items-center gap-2 p-3 overflow-x-auto">
        {/* Mode Buttons */}
        <div className="flex items-center gap-1 border-r pr-3">
          <Button
            variant={toolMode === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setToolMode('select');
              setSelectedTool(null);
            }}
            title="Select Mode"
          >
            <Move className="h-4 w-4" />
          </Button>
          <Button
            variant={toolMode === 'draw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('draw')}
            title="Draw Mode"
          >
            <PenTool className="h-4 w-4" />
          </Button>
          <Button
            variant={toolMode === 'edit-nodes' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('edit-nodes')}
            title="Edit Nodes"
          >
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button
            variant={toolMode === 'trim' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setToolMode('trim')}
            title="Trim Mode"
          >
            <Scissors className="h-4 w-4" />
          </Button>
        </div>

        {/* Shape Buttons */}
        {toolMode === 'draw' && (
          <div className="flex items-center gap-1 border-r pr-3">
            <Button
              variant={selectedTool === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('line')}
              title="Line"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'arc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('arc')}
              title="Arc"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('circle')}
              title="Circle"
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('rectangle')}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'triangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('triangle')}
              title="Triangle"
            >
              <TriangleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={selectedTool === 'l-shape-tl' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTool('l-shape-tl')}
              title="L-Shape"
            >
              <CornerUpLeft className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Transform Buttons */}
        {hasSelection && (
          <div className="flex items-center gap-1 border-r pr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicate}
              title="Duplicate"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMirror('horizontal')}
              title="Mirror Horizontal"
            >
              <FlipHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMirror('vertical')}
              title="Mirror Vertical"
            >
              <FlipHorizontal className="h-4 w-4 rotate-90" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOffset}
              title="Offset"
            >
              <ArrowRightFromLine className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onFillet}
              title="Fillet"
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
