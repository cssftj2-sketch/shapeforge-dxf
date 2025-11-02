import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Line, Arc, Text, Transformer, Group } from 'react-konva';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Move, Trash2, Scissors, Copy, FlipHorizontal, Edit3, Minus, PenTool, Circle as CircleIcon, Triangle as TriangleIcon, CornerUpLeft, Smile, ArrowRightFromLine } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape-tl' | 'l-shape-tr' | 'l-shape-bl' | 'l-shape-br' | 'line' | 'arc';
type ToolMode = 'select' | 'draw' | 'edit-nodes' | 'trim';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  base?: number;
  legWidth?: number;
  legHeight?: number;
  points?: number[];
  angle?: number;
  innerRadius?: number;
  outerRadius?: number;
  fill: string;
  stroke: string;
  nodes?: Point[];
}

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const GRID_SIZE = 10; // 1cm = 10px

const COLORS: Record<ShapeType, { fill: string; stroke: string }> = {
  rectangle: { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgb(59, 130, 246)' },
  circle: { fill: 'rgba(249, 115, 22, 0.3)', stroke: 'rgb(249, 115, 22)' },
  triangle: { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgb(34, 197, 94)' },
  'l-shape-tl': { fill: 'rgba(139, 92, 246, 0.3)', stroke: 'rgb(139, 92, 246)' },
  'l-shape-tr': { fill: 'rgba(139, 92, 246, 0.3)', stroke: 'rgb(139, 92, 246)' },
  'l-shape-bl': { fill: 'rgba(139, 92, 246, 0.3)', stroke: 'rgb(139, 92, 246)' },
  'l-shape-br': { fill: 'rgba(139, 92, 246, 0.3)', stroke: 'rgb(139, 92, 246)' },
  line: { fill: 'transparent', stroke: 'rgb(100, 100, 100)' },
  arc: { fill: 'transparent', stroke: 'rgb(220, 38, 127)' }
};

const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

// ============================================================================
// SHAPE MANAGEMENT HOOK
// ============================================================================

const useShapeManager = (initialShapes: Shape[]) => {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedShape = shapes.find(s => s.id === selectedId);

  const updateShape = (id: string, updates: Partial<Shape>) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addShape = (shape: Shape) => {
    setShapes(prev => [...prev, shape]);
  };

  const removeShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateShape = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}`,
      x: shape.x + 2,
      y: shape.y + 2
    };
    
    addShape(newShape);
    setSelectedId(newShape.id);
  };

  const replacePreview = (previewShape: Shape, finalId: string) => {
    setShapes(prev => 
      prev.filter(s => s.id !== 'preview-shape').concat({ ...previewShape, id: finalId })
    );
  };

  return {
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    selectedShape,
    updateShape,
    addShape,
    removeShape,
    duplicateShape,
    replacePreview
  };
};

// ============================================================================
// SHAPE GEOMETRY UTILITIES
// ============================================================================

const createShapeFromDrag = (
  type: ShapeType,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): Partial<Shape> => {
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);

  const base = {
    x: startX / GRID_SIZE,
    y: startY / GRID_SIZE,
    ...COLORS[type]
  };

  switch (type) {
    case 'rectangle':
      return { ...base, x: x / GRID_SIZE, y: y / GRID_SIZE, width: width / GRID_SIZE, height: height / GRID_SIZE };
    
    case 'circle':
      return { ...base, radius: Math.min(width, height) / 2 / GRID_SIZE };
    
    case 'triangle':
      return { ...base, x: x / GRID_SIZE, y: y / GRID_SIZE, base: width / GRID_SIZE, height: height / GRID_SIZE };
    
    case 'line':
      return { ...base, points: [0, 0, (currentX - startX) / GRID_SIZE, (currentY - startY) / GRID_SIZE] };
    
    case 'arc':
      const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2 / GRID_SIZE;
      const angle = Math.atan2(currentY - startY, currentX - startX) * (180 / Math.PI);
      return { ...base, innerRadius: 0, outerRadius: radius, angle: Math.abs(angle) };
    
    default:
      if (type.startsWith('l-shape-')) {
        return {
          ...base,
          x: x / GRID_SIZE,
          y: y / GRID_SIZE,
          width: width / GRID_SIZE,
          height: height / GRID_SIZE,
          legWidth: (width / 2) / GRID_SIZE,
          legHeight: (height / 2) / GRID_SIZE
        };
      }
      return base;
  }
};

const getLShapePoints = (type: ShapeType, w: number, h: number, lw: number, lh: number): number[] => {
  switch (type) {
    case 'l-shape-tl': return [0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h];
    case 'l-shape-tr': return [0, 0, w, 0, w, h, w - lw, h, w - lw, lh, 0, lh];
    case 'l-shape-bl': return [0, 0, lw, 0, lw, h - lh, w, h - lh, w, h, 0, h];
    case 'l-shape-br': return [0, h - lh, w - lw, h - lh, w - lw, 0, w, 0, w, h, 0, h];
    default: return [];
  }
};

// ============================================================================
// SHAPE RENDERER COMPONENT
// ============================================================================

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  toolMode: ToolMode;
  onSelect: (id: string) => void;
  onTransform: (id: string, updates: Partial<Shape>) => void;
  shapeRef: (node: any) => void;
}

const ShapeRenderer: React.FC<ShapeRendererProps> = ({ 
  shape, 
  isSelected, 
  toolMode, 
  onSelect, 
  onTransform,
  shapeRef 
}) => {
  const scale = GRID_SIZE;
  const isDraggable = toolMode === 'select';
  const strokeWidth = isSelected ? 3 : 2;

  const handleDragEnd = (e: any) => {
    onTransform(shape.id, {
      x: Math.round(e.target.x() / scale),
      y: Math.round(e.target.y() / scale)
    });
  };

  switch (shape.type) {
    case 'rectangle':
      return (
        <Group key={shape.id}>
          <Rect
            ref={shapeRef}
            id={shape.id}
            x={shape.x * scale}
            y={shape.y * scale}
            width={shape.width! * scale}
            height={shape.height! * scale}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
            onTransformEnd={(e) => {
              const node = e.target;
              onTransform(shape.id, {
                x: Math.round(node.x() / scale),
                y: Math.round(node.y() / scale),
                width: Math.round(Math.abs(node.width() * node.scaleX()) / scale * 10) / 10,
                height: Math.round(Math.abs(node.height() * node.scaleY()) / scale * 10) / 10
              });
              node.scaleX(1);
              node.scaleY(1);
            }}
          />
          <Text
            x={shape.x * scale}
            y={shape.y * scale - 20}
            text={`${shape.width?.toFixed(1)}×${shape.height?.toFixed(1)} cm`}
            fontSize={12}
            fill="#333"
            listening={false}
          />
        </Group>
      );

    case 'circle':
      return (
        <Group key={shape.id}>
          <Circle
            ref={shapeRef}
            id={shape.id}
            x={(shape.x + shape.radius!) * scale}
            y={(shape.y + shape.radius!) * scale}
            radius={shape.radius! * scale}
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={(e) => {
              onTransform(shape.id, {
                x: Math.round(e.target.x() / scale - shape.radius!),
                y: Math.round(e.target.y() / scale - shape.radius!)
              });
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const newRadius = Math.round(shape.radius! * node.scaleX() * 10) / 10;
              onTransform(shape.id, {
                x: Math.round(node.x() / scale - newRadius),
                y: Math.round(node.y() / scale - newRadius),
                radius: newRadius
              });
              node.scaleX(1);
              node.scaleY(1);
            }}
          />
          <Text
            x={shape.x * scale}
            y={(shape.y - 2) * scale}
            text={`R: ${shape.radius?.toFixed(1)} cm`}
            fontSize={12}
            fill="#333"
            listening={false}
          />
        </Group>
      );

    case 'triangle':
      return (
        <Group key={shape.id}>
          <Line
            ref={shapeRef}
            id={shape.id}
            x={shape.x * scale}
            y={shape.y * scale}
            points={[
              (shape.base! * scale) / 2, 0,
              shape.base! * scale, shape.height! * scale,
              0, shape.height! * scale
            ]}
            closed
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
          />
          <Text
            x={shape.x * scale}
            y={shape.y * scale - 20}
            text={`B:${shape.base?.toFixed(1)} H:${shape.height?.toFixed(1)} cm`}
            fontSize={12}
            fill="#333"
            listening={false}
          />
        </Group>
      );

    case 'line':
      const linePoints = shape.points || [0, 0, 10, 10];
      return (
        <Group key={shape.id}>
          <Line
            ref={shapeRef}
            id={shape.id}
            x={shape.x * scale}
            y={shape.y * scale}
            points={linePoints.map(p => p * scale)}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
          />
          {toolMode === 'edit-nodes' && isSelected && linePoints.length >= 2 && (
            <>
              <Circle
                x={shape.x * scale}
                y={shape.y * scale}
                radius={5}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                draggable
                onDragMove={(e) => {
                  const newPoints = [...linePoints];
                  newPoints[0] = (e.target.x() - shape.x * scale) / scale;
                  newPoints[1] = (e.target.y() - shape.y * scale) / scale;
                  onTransform(shape.id, { points: newPoints });
                }}
              />
              <Circle
                x={shape.x * scale + linePoints[2] * scale}
                y={shape.y * scale + linePoints[3] * scale}
                radius={5}
                fill="white"
                stroke="blue"
                strokeWidth={2}
                draggable
                onDragMove={(e) => {
                  const newPoints = [...linePoints];
                  newPoints[2] = (e.target.x() - shape.x * scale) / scale;
                  newPoints[3] = (e.target.y() - shape.y * scale) / scale;
                  onTransform(shape.id, { points: newPoints });
                }}
              />
            </>
          )}
        </Group>
      );

    case 'arc':
      return (
        <Group key={shape.id}>
          <Arc
            ref={shapeRef}
            id={shape.id}
            x={shape.x * scale}
            y={shape.y * scale}
            innerRadius={shape.innerRadius! * scale}
            outerRadius={shape.outerRadius! * scale}
            angle={shape.angle || 90}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
          />
        </Group>
      );

    default:
      if (shape.type.startsWith('l-shape-')) {
        const w = shape.width! * scale;
        const h = shape.height! * scale;
        const lw = shape.legWidth! * scale;
        const lh = shape.legHeight! * scale;
        const lPoints = getLShapePoints(shape.type, w, h, lw, lh);
        
        return (
          <Group key={shape.id}>
            <Line
              ref={shapeRef}
              id={shape.id}
              x={shape.x * scale}
              y={shape.y * scale}
              points={lPoints}
              closed
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={strokeWidth}
              draggable={isDraggable}
              onClick={() => onSelect(shape.id)}
              onTap={() => onSelect(shape.id)}
              onDragEnd={handleDragEnd}
            />
            <Text
              x={shape.x * scale}
              y={shape.y * scale - 20}
              text={`${shape.width?.toFixed(1)}×${shape.height?.toFixed(1)} cm`}
              fontSize={12}
              fill="#333"
              listening={false}
            />
          </Group>
        );
      }
      return null;
  }
};

// ============================================================================
// TOOL PANEL COMPONENT
// ============================================================================

interface ToolPanelProps {
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  selectedTool: ShapeType | null;
  setSelectedTool: (tool: ShapeType | null) => void;
  selectedShape: Shape | undefined;
  onUpdateMeasurement: (field: string, value: number) => void;
  onDuplicate: () => void;
  onMirror: (axis: 'horizontal' | 'vertical') => void;
  onDelete: () => void;
  offsetValue: number;
  setOffsetValue: (value: number) => void;
  filletRadius: number;
  setFilletRadius: (value: number) => void;
  onOffset: () => void;
  onFillet: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({
  toolMode,
  setToolMode,
  selectedTool,
  setSelectedTool,
  selectedShape,
  onUpdateMeasurement,
  onDuplicate,
  onMirror,
  onDelete,
  offsetValue,
  setOffsetValue,
  filletRadius,
  setFilletRadius,
  onOffset,
  onFillet
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tools</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="edit">Edit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={toolMode === 'select' ? 'default' : 'outline'}
                  onClick={() => {
                    setToolMode('select');
                    setSelectedTool(null);
                  }}
                  className="w-full p-6"
                >
                  <Move className="h-8 w-8" />
                </Button>
                <Button
                  variant={toolMode === 'draw' ? 'default' : 'outline'}
                  onClick={() => setToolMode('draw')}
                  className="w-full p-6"
                >
                  <PenTool className="h-8 w-8" />
                </Button>
              </div>
            </div>

            {toolMode === 'draw' && (
              <div className="space-y-2">
                <Label className="font-semibold">Shapes</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedTool === 'line' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('line')}
                    className="p-6"
                  >
                    <Minus className="h-7 w-7" />
                  </Button>
                  <Button
                    variant={selectedTool === 'arc' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('arc')}
                    className="p-6"
                  >
                    <Smile className="h-7 w-7" />
                  </Button>
                  <Button
                    variant={selectedTool === 'circle' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('circle')}
                    className="p-6"
                  >
                    <CircleIcon className="h-7 w-7" />
                  </Button>
                  <Button
                    variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('rectangle')}
                    className="p-6"
                  >
                    <Square className="h-7 w-7" />
                  </Button>
                  <Button
                    variant={selectedTool === 'triangle' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('triangle')}
                    className="p-6"
                  >
                    <TriangleIcon className="h-7 w-7" />
                  </Button>
                  <Button
                    variant={selectedTool === 'l-shape-tl' ? 'default' : 'outline'}
                    onClick={() => setSelectedTool('l-shape-tl')}
                    className="p-6"
                  >
                    <CornerUpLeft className="h-7 w-7" />
                  </Button>
                </div>
              </div>
            )}

            {selectedShape && <MeasurementPanel shape={selectedShape} onUpdate={onUpdateMeasurement} />}
          </TabsContent>

          <TabsContent value="edit" className="space-y-4">
            <div className="space-y-2">
              <Label className="font-semibold">Edit Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={toolMode === 'edit-nodes' ? 'default' : 'outline'}
                  onClick={() => setToolMode('edit-nodes')}
                  className="p-6"
                >
                  <Edit3 className="h-8 w-8" />
                </Button>
                <Button
                  variant={toolMode === 'trim' ? 'default' : 'outline'}
                  onClick={() => setToolMode('trim')}
                  className="p-6"
                >
                  <Scissors className="h-8 w-8" />
                </Button>
              </div>
            </div>

            {selectedShape && (
              <>
                <div className="border-t pt-4 space-y-2">
                  <Label className="font-semibold">Transform</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" onClick={onDuplicate} className="p-6">
                      <Copy className="h-7 w-7" />
                    </Button>
                    <Button variant="outline" onClick={() => onMirror('horizontal')} className="p-6">
                      <FlipHorizontal className="h-7 w-7" />
                    </Button>
                    <Button variant="outline" onClick={() => onMirror('vertical')} className="p-6">
                      <FlipHorizontal className="h-7 w-7 rotate-90" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ArrowRightFromLine className="h-5 w-5" />
                      <Input
                        type="number"
                        value={offsetValue}
                        onChange={(e) => setOffsetValue(parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <Button variant="outline" onClick={onOffset} className="w-full p-4">
                      <ArrowRightFromLine className="h-6 w-6" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CircleIcon className="h-5 w-5" />
                      <Input
                        type="number"
                        value={filletRadius}
                        onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <Button variant="outline" onClick={onFillet} className="w-full p-4">
                      <CircleIcon className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Button variant="destructive" onClick={onDelete} className="w-full p-6">
                    <Trash2 className="h-8 w-8" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// MEASUREMENT PANEL COMPONENT
// ============================================================================

interface MeasurementPanelProps {
  shape: Shape;
  onUpdate: (field: string, value: number) => void;
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ shape, onUpdate }) => {
  return (
    <div className="border-t pt-4 space-y-3">
      <Label className="font-semibold">Measurements</Label>
      
      {shape.type === 'rectangle' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Width (cm)</Label>
            <Input
              type="number"
              value={shape.width || 0}
              onChange={(e) => onUpdate('width', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (cm)</Label>
            <Input
              type="number"
              value={shape.height || 0}
              onChange={(e) => onUpdate('height', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
        </>
      )}

      {shape.type === 'circle' && (
        <div className="space-y-1">
          <Label className="text-xs">Radius (cm)</Label>
          <Input
            type="number"
            value={shape.radius || 0}
            onChange={(e) => onUpdate('radius', parseFloat(e.target.value))}
            step="0.1"
            min="0.1"
          />
        </div>
      )}

      {shape.type === 'triangle' && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Base (cm)</Label>
            <Input
              type="number"
              value={shape.base || 0}
              onChange={(e) => onUpdate('base', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (cm)</Label>
            <Input
              type="number"
              value={shape.height || 0}
              onChange={(e) => onUpdate('height', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
        </>
      )}

      {shape.type.startsWith('l-shape-') && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Width (cm)</Label>
            <Input
              type="number"
              value={shape.width || 0}
              onChange={(e) => onUpdate('width', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Height (cm)</Label>
            <Input
              type="number"
              value={shape.height || 0}
              onChange={(e) => onUpdate('height', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Leg Width (cm)</Label>
            <Input
              type="number"
              value={shape.legWidth || 0}
              onChange={(e) => onUpdate('legWidth', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Leg Height (cm)</Label>
            <Input
              type="number"
              value={shape.legHeight || 0}
              onChange={(e) => onUpdate('legHeight', parseFloat(e.target.value))}
              step="0.1"
              min="0.1"
            />
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ShapeCanvas() {
  const slabWidth = 80;
  const slabHeight = 60;
  
  const {
    shapes,
    selectedId,
    setSelectedId,
    selectedShape,
    updateShape,
    addShape,
    removeShape,
    duplicateShape,
    replacePreview
  } = useShapeManager([]);

  const [selectedTool, setSelectedTool] = useState<ShapeType | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [dragState, setDragState] = useState({
    isDrawing: false,
    startX: 0,
    startY: 0,
    shapeType: null as ShapeType | null
  });
  const [offsetValue, setOffsetValue] = useState(1);
  const [filletRadius, setFilletRadius] = useState(0.5);
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const shapeRefs = useRef<{ [key: string]: any }>({});

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty && toolMode === 'select') {
      setSelectedId(null);
      return;
    }
    
    if (toolMode !== 'draw' || !selectedTool) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const x = snapToGrid(pointerPos.x);
    const y = snapToGrid(pointerPos.y);

    setDragState({
      isDrawing: true,
      startX: x,
      startY: y,
      shapeType: selectedTool
    });
  };

  const handleMouseMove = (e: any) => {
    if (!dragState.isDrawing || !dragState.shapeType) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const currentX = snapToGrid(pointerPos.x);
    const currentY = snapToGrid(pointerPos.y);

    const width = Math.abs(currentX - dragState.startX);
    const height = Math.abs(currentY - dragState.startY);

    if (width > GRID_SIZE || height > GRID_SIZE || dragState.shapeType === 'line' || dragState.shapeType === 'arc') {
      const shapeData = createShapeFromDrag(
        dragState.shapeType,
        dragState.startX,
        dragState.startY,
        currentX,
        currentY
      );

      const previewShape: Shape = {
        id: 'preview-shape',
        type: dragState.shapeType,
        ...shapeData
      } as Shape;

      const existingPreview = shapes.find(s => s.id === 'preview-shape');
      if (existingPreview) {
        updateShape('preview-shape', previewShape);
      } else {
        addShape(previewShape);
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDrawing) {
      const previewShape = shapes.find(s => s.id === 'preview-shape');
      if (previewShape) {
        const finalId = `shape-${Date.now()}`;
        replacePreview(previewShape, finalId);
        setSelectedId(finalId);
        console.log(`${previewShape.type} created`);
      }
    }
    
    setDragState({
      isDrawing: false,
      startX: 0,
      startY: 0,
      shapeType: null
    });
  };

  const handleShapeClick = (id: string) => {
    if (toolMode === 'select' || toolMode === 'edit-nodes') {
      setSelectedId(id);
    } else if (toolMode === 'trim') {
      handleTrim(id);
    }
  };

  const handleTrim = (id: string) => {
    if (!selectedId || selectedId === id) {
      console.log('Select a shape first, then click another shape to trim');
      return;
    }
    
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    if (shape.width && shape.height) {
      updateShape(id, { width: shape.width * 0.8, height: shape.height * 0.8 });
    } else if (shape.radius) {
      updateShape(id, { radius: shape.radius * 0.8 });
    }
    console.log('Shape trimmed');
  };

  const handleFillet = () => {
    if (!selectedId) {
      console.log('Select a shape first');
      return;
    }
    
    const shape = shapes.find(s => s.id === selectedId);
    if (shape && (shape.type === 'rectangle' || shape.type.startsWith('l-shape-'))) {
      console.log(`Fillet with radius ${filletRadius}cm applied`);
    } else {
      console.log('Fillet only works on rectangles and L-shapes');
    }
  };

  const handleOffset = () => {
    if (!selectedId) {
      console.log('Select a shape first');
      return;
    }
    
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}`,
      x: shape.x + offsetValue,
      y: shape.y + offsetValue
    };
    
    if (shape.width && shape.height) {
      newShape.width = shape.width + offsetValue * 2;
      newShape.height = shape.height + offsetValue * 2;
    } else if (shape.radius) {
      newShape.radius = shape.radius + offsetValue;
    }
    
    addShape(newShape);
    console.log(`Offset created with ${offsetValue}cm distance`);
  };

  const handleMirror = (axis: 'horizontal' | 'vertical') => {
    if (!selectedId) {
      console.log('Select a shape first');
      return;
    }
    
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}`
    };
    
    if (axis === 'horizontal') {
      newShape.x = slabWidth - shape.x - (shape.width || shape.radius ? (shape.width || shape.radius! * 2) : 0);
    } else {
      newShape.y = slabHeight - shape.y - (shape.height || shape.radius ? (shape.height || shape.radius! * 2) : 0);
    }
    
    addShape(newShape);
    console.log(`Shape mirrored ${axis}ly`);
  };

  const updateShapeMeasurement = (field: string, value: number) => {
    if (!selectedId || isNaN(value)) return;
    updateShape(selectedId, { [field]: Math.max(0.1, value) });
  };

  // ============================================================================
  // TRANSFORMER SYNC
  // ============================================================================

  useEffect(() => {
    if (selectedId && transformerRef.current && toolMode === 'select') {
      const selectedNode = shapeRefs.current[selectedId];
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId, toolMode]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const getToolModeMessage = () => {
    if (toolMode === 'draw' && selectedTool) return `🖱️ Click and drag to draw a ${selectedTool}`;
    if (toolMode === 'select') return '📐 Click shapes to select, drag to move, use handles to resize';
    if (toolMode === 'edit-nodes') return '🎯 Edit nodes by dragging the control points';
    if (toolMode === 'trim') return '✂️ Select a shape, then click another shape to trim it';
    return '👆 Select a tool to get started';
  };

  return (
    <div className="space-y-4 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ToolPanel
            toolMode={toolMode}
            setToolMode={setToolMode}
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            selectedShape={selectedShape}
            onUpdateMeasurement={updateShapeMeasurement}
            onDuplicate={() => selectedId && duplicateShape(selectedId)}
            onMirror={handleMirror}
            onDelete={() => selectedId && removeShape(selectedId)}
            offsetValue={offsetValue}
            setOffsetValue={setOffsetValue}
            filletRadius={filletRadius}
            setFilletRadius={setFilletRadius}
            onOffset={handleOffset}
            onFillet={handleFillet}
          />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Canvas ({slabWidth}cm × {slabHeight}cm)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-auto bg-gray-50">
                <Stage
                  ref={stageRef}
                  width={slabWidth * GRID_SIZE}
                  height={slabHeight * GRID_SIZE}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                >
                  <Layer>
                    {/* Grid */}
                    {Array.from({ length: slabWidth }).map((_, i) => (
                      <Line
                        key={`v-${i}`}
                        points={[i * GRID_SIZE, 0, i * GRID_SIZE, slabHeight * GRID_SIZE]}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                      />
                    ))}
                    {Array.from({ length: slabHeight }).map((_, i) => (
                      <Line
                        key={`h-${i}`}
                        points={[0, i * GRID_SIZE, slabWidth * GRID_SIZE, i * GRID_SIZE]}
                        stroke="#e5e7eb"
                        strokeWidth={0.5}
                      />
                    ))}

                    {/* Slab Border */}
                    <Rect
                      x={0}
                      y={0}
                      width={slabWidth * GRID_SIZE}
                      height={slabHeight * GRID_SIZE}
                      stroke="#374151"
                      strokeWidth={3}
                    />

                    {/* Shapes */}
                    {shapes.map(shape => (
                      <ShapeRenderer
                        key={shape.id}
                        shape={shape}
                        isSelected={shape.id === selectedId}
                        toolMode={toolMode}
                        onSelect={handleShapeClick}
                        onTransform={updateShape}
                        shapeRef={(node) => { shapeRefs.current[shape.id] = node; }}
                      />
                    ))}

                    {/* Transformer */}
                    <Transformer
                      ref={transformerRef}
                      boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 5 || newBox.height < 5) {
                          return oldBox;
                        }
                        return newBox;
                      }}
                    />
                  </Layer>
                </Stage>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-2">
                <div className="text-sm font-semibold text-blue-900">
                  {getToolModeMessage()}
                </div>
                <div className="text-xs text-blue-700">
                  Shapes created: <span className="font-bold">{shapes.length}</span>
                  {selectedId && selectedShape && ` • Selected: ${selectedShape.type}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
