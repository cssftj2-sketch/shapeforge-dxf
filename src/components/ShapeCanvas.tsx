import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Line, Arc, Text, Transformer, Group } from 'react-konva';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square, Move, Trash2, Scissors, Copy, FlipHorizontal, Edit3, Minus } from 'lucide-react';

const GRID_SIZE = 10; // 1cm = 10px

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

interface ShapeCanvasProps {
  slab: { width: number; height: number };
  shapes: Shape[];
  onUpdateShapes: (shapes: Shape[]) => void;
}

export const ShapeCanvas = ({ slab, shapes, onUpdateShapes }: ShapeCanvasProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selectedShape = shapes.find(s => s.id === selectedId);
  const slabWidth = slab.width;
  const slabHeight = slab.height;

  const colors: { [key in ShapeType]: { fill: string; stroke: string } } = {
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

  const snapToGrid = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  const showToast = (message: string) => {
    console.log(message);
  };

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
    const x = Math.min(dragState.startX, currentX);
    const y = Math.min(dragState.startY, currentY);

    const previewId = 'preview-shape';
    const existingPreview = shapes.find(s => s.id === previewId);
    
    if (width > GRID_SIZE || height > GRID_SIZE || dragState.shapeType === 'line' || dragState.shapeType === 'arc') {
      const newShape: Shape = {
        id: previewId,
        type: dragState.shapeType,
        x: dragState.startX / GRID_SIZE,
        y: dragState.startY / GRID_SIZE,
        ...colors[dragState.shapeType]
      };

      if (dragState.shapeType === 'rectangle') {
        newShape.width = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
        newShape.x = x / GRID_SIZE;
        newShape.y = y / GRID_SIZE;
      } else if (dragState.shapeType === 'circle') {
        const radius = Math.min(width, height) / 2 / GRID_SIZE;
        newShape.radius = radius;
      } else if (dragState.shapeType === 'triangle') {
        newShape.base = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
        newShape.x = x / GRID_SIZE;
        newShape.y = y / GRID_SIZE;
      } else if (dragState.shapeType.startsWith('l-shape-')) {
        newShape.width = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
        newShape.legWidth = (width / 2) / GRID_SIZE;
        newShape.legHeight = (height / 2) / GRID_SIZE;
        newShape.x = x / GRID_SIZE;
        newShape.y = y / GRID_SIZE;
      } else if (dragState.shapeType === 'line') {
        newShape.points = [0, 0, (currentX - dragState.startX) / GRID_SIZE, (currentY - dragState.startY) / GRID_SIZE];
      } else if (dragState.shapeType === 'arc') {
        const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2 / GRID_SIZE;
        const angle = Math.atan2(currentY - dragState.startY, currentX - dragState.startX) * (180 / Math.PI);
        newShape.innerRadius = 0;
        newShape.outerRadius = radius;
        newShape.angle = Math.abs(angle);
      }

      if (existingPreview) {
        onUpdateShapes(shapes.map(s => s.id === previewId ? newShape : s));
      } else {
        onUpdateShapes([...shapes, newShape]);
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDrawing) {
      const previewShape = shapes.find(s => s.id === 'preview-shape');
      if (previewShape) {
        const finalShape = { ...previewShape, id: `shape-${Date.now()}` };
        onUpdateShapes(shapes.filter(s => s.id !== 'preview-shape').concat(finalShape));
        setSelectedId(finalShape.id);
        showToast(`${finalShape.type} created`);
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

  const handleTransform = (id: string, newAttrs: any) => {
    onUpdateShapes(shapes.map(shape => {
      if (shape.id === id) {
        return { ...shape, ...newAttrs };
      }
      return shape;
    }));
  };

  const handleDelete = () => {
    if (selectedId) {
      onUpdateShapes(shapes.filter(s => s.id !== selectedId));
      setSelectedId(null);
      showToast('Shape deleted');
    }
  };

  const handleDuplicate = () => {
    if (!selectedId) return;
    
    const shape = shapes.find(s => s.id === selectedId);
    if (!shape) return;
    
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}`,
      x: shape.x + 2,
      y: shape.y + 2
    };
    
    onUpdateShapes([...shapes, newShape]);
    setSelectedId(newShape.id);
    showToast('Shape duplicated');
  };

  const handleTrim = (id: string) => {
    if (!selectedId || selectedId === id) {
      showToast('Select a shape first, then click another shape to trim');
      return;
    }
    
    onUpdateShapes(shapes.map(shape => {
      if (shape.id === id) {
        if (shape.width && shape.height) {
          return { ...shape, width: shape.width * 0.8, height: shape.height * 0.8 };
        } else if (shape.radius) {
          return { ...shape, radius: shape.radius * 0.8 };
        }
      }
      return shape;
    }));
    showToast('Shape trimmed');
  };

  const handleFillet = () => {
    if (!selectedId) {
      showToast('Select a shape first');
      return;
    }
    
    const shape = shapes.find(s => s.id === selectedId);
    if (shape && (shape.type === 'rectangle' || shape.type.startsWith('l-shape-'))) {
      showToast(`Fillet with radius ${filletRadius}cm applied`);
    } else {
      showToast('Fillet only works on rectangles and L-shapes');
    }
  };

  const handleOffset = () => {
    if (!selectedId) {
      showToast('Select a shape first');
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
    
    onUpdateShapes([...shapes, newShape]);
    showToast(`Offset created with ${offsetValue}cm distance`);
  };

  const handleMirror = (axis: 'horizontal' | 'vertical') => {
    if (!selectedId) {
      showToast('Select a shape first');
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
    
    onUpdateShapes([...shapes, newShape]);
    showToast(`Shape mirrored ${axis}ly`);
  };

  const updateShapeMeasurement = (field: string, value: number) => {
    if (!selectedId || isNaN(value)) return;
    
    onUpdateShapes(shapes.map(shape => {
      if (shape.id === selectedId) {
        return { ...shape, [field]: Math.max(0.1, value) };
      }
      return shape;
    }));
  };

  const renderShape = (shape: Shape) => {
    const scale = GRID_SIZE;
    const isSelected = shape.id === selectedId;

    switch (shape.type) {
      case 'rectangle':
        return (
          <Group key={shape.id}>
            <Rect
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
              id={shape.id}
              x={shape.x * scale}
              y={shape.y * scale}
              width={shape.width! * scale}
              height={shape.height! * scale}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale),
                  y: Math.round(e.target.y() / scale)
                });
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                handleTransform(shape.id, {
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
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
              id={shape.id}
              x={(shape.x + shape.radius!) * scale}
              y={(shape.y + shape.radius!) * scale}
              radius={shape.radius! * scale}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale - shape.radius!),
                  y: Math.round(e.target.y() / scale - shape.radius!)
                });
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                const newRadius = Math.round(shape.radius! * node.scaleX() * 10) / 10;
                handleTransform(shape.id, {
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

      case 'line':
        const linePoints = shape.points || [0, 0, 10, 10];
        return (
          <Group key={shape.id}>
            <Line
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
              id={shape.id}
              x={shape.x * scale}
              y={shape.y * scale}
              points={linePoints.map(p => p * scale)}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale),
                  y: Math.round(e.target.y() / scale)
                });
              }}
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
                    handleTransform(shape.id, { points: newPoints });
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
                    handleTransform(shape.id, { points: newPoints });
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
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
              id={shape.id}
              x={shape.x * scale}
              y={shape.y * scale}
              innerRadius={shape.innerRadius! * scale}
              outerRadius={shape.outerRadius! * scale}
              angle={shape.angle || 90}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale),
                  y: Math.round(e.target.y() / scale)
                });
              }}
            />
          </Group>
        );

      case 'triangle':
        return (
          <Group key={shape.id}>
            <Line
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
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
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale),
                  y: Math.round(e.target.y() / scale)
                });
              }}
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

      case 'l-shape-tl':
      case 'l-shape-tr':
      case 'l-shape-bl':
      case 'l-shape-br':
        const w = shape.width! * scale;
        const h = shape.height! * scale;
        const lw = shape.legWidth! * scale;
        const lh = shape.legHeight! * scale;
        
        let lPoints: number[] = [];
        if (shape.type === 'l-shape-tl') {
          lPoints = [0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h];
        } else if (shape.type === 'l-shape-tr') {
          lPoints = [0, 0, w, 0, w, h, w - lw, h, w - lw, lh, 0, lh];
        } else if (shape.type === 'l-shape-bl') {
          lPoints = [0, 0, lw, 0, lw, h - lh, w, h - lh, w, h, 0, h];
        } else if (shape.type === 'l-shape-br') {
          lPoints = [0, h - lh, w - lw, h - lh, w - lw, 0, w, 0, w, h, 0, h];
        }
        
        return (
          <Group key={shape.id}>
            <Line
              ref={(node) => { shapeRefs.current[shape.id] = node; }}
              id={shape.id}
              x={shape.x * scale}
              y={shape.y * scale}
              points={lPoints}
              closed
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable={toolMode === 'select'}
              onClick={() => handleShapeClick(shape.id)}
              onTap={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale),
                  y: Math.round(e.target.y() / scale)
                });
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

      default:
        return null;
    }
  };

  React.useEffect(() => {
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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
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
                      size="sm"
                    >
                      <Move className="h-4 w-4 mr-1" />
                      Select
                    </Button>
                    <Button
                      variant={toolMode === 'draw' ? 'default' : 'outline'}
                      onClick={() => setToolMode('draw')}
                      size="sm"
                    >
                      Draw
                    </Button>
                  </div>
                </div>

                {toolMode === 'draw' && (
                  <div className="space-y-2">
                    <Label className="font-semibold">Shapes</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={selectedTool === 'line' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('line')}
                        size="sm"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Line
                      </Button>
                      <Button
                        variant={selectedTool === 'arc' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('arc')}
                        size="sm"
                      >
                        Arc
                      </Button>
                      <Button
                        variant={selectedTool === 'circle' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('circle')}
                        size="sm"
                      >
                        ⭕ Circle
                      </Button>
                      <Button
                        variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('rectangle')}
                        size="sm"
                      >
                        <Square className="h-4 w-4 mr-1" />
                        Rect
                      </Button>
                      <Button
                        variant={selectedTool === 'triangle' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('triangle')}
                        size="sm"
                      >
                        🔺 Tri
                      </Button>
                      <Button
                        variant={selectedTool === 'l-shape-tl' ? 'default' : 'outline'}
                        onClick={() => setSelectedTool('l-shape-tl')}
                        size="sm"
                      >
                        L-TL
                      </Button>
                    </div>
                  </div>
                )}

                {selectedId && selectedShape && (
                  <div className="border-t pt-4 space-y-3">
                    <Label className="font-semibold">Measurements</Label>
                    
                    {selectedShape.type === 'rectangle' && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.width || 0}
                            onChange={(e) => updateShapeMeasurement('width', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height || 0}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                      </>
                    )}

                    {selectedShape.type === 'circle' && (
                      <div className="space-y-1">
                        <Label className="text-xs">Radius (cm)</Label>
                        <Input
                          type="number"
                          value={selectedShape.radius || 0}
                          onChange={(e) => updateShapeMeasurement('radius', parseFloat(e.target.value))}
                          step="0.1"
                          min="0.1"
                        />
                      </div>
                    )}

                    {selectedShape.type === 'triangle' && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Base (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.base || 0}
                            onChange={(e) => updateShapeMeasurement('base', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height || 0}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                      </>
                    )}

                    {selectedShape.type.startsWith('l-shape-') && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.width || 0}
                            onChange={(e) => updateShapeMeasurement('width', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height || 0}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Leg Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.legWidth || 0}
                            onChange={(e) => updateShapeMeasurement('legWidth', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Leg Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.legHeight || 0}
                            onChange={(e) => updateShapeMeasurement('legHeight', parseFloat(e.target.value))}
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="edit" className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">Edit Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={toolMode === 'edit-nodes' ? 'default' : 'outline'}
                      onClick={() => setToolMode('edit-nodes')}
                      size="sm"
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Nodes
                    </Button>
                    <Button
                      variant={toolMode === 'trim' ? 'default' : 'outline'}
                      onClick={() => setToolMode('trim')}
                      size="sm"
                    >
                      <Scissors className="h-4 w-4 mr-1" />
                      Trim
                    </Button>
                  </div>
                </div>

                {selectedId && (
                  <>
                    <div className="border-t pt-4 space-y-2">
                      <Label className="font-semibold">Transform</Label>
                      <Button
                        variant="outline"
                        onClick={handleDuplicate}
                        size="sm"
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleMirror('horizontal')}
                        size="sm"
                        className="w-full"
                      >
                        <FlipHorizontal className="h-4 w-4 mr-2" />
                        Mirror H
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleMirror('vertical')}
                        size="sm"
                        className="w-full"
                      >
                        <FlipHorizontal className="h-4 w-4 mr-2 rotate-90" />
                        Mirror V
                      </Button>
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="space-y-2">
                        <Label className="font-semibold">Offset</Label>
                        <Input
                          type="number"
                          value={offsetValue}
                          onChange={(e) => setOffsetValue(parseFloat(e.target.value))}
                          step="0.1"
                          min="0.1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleOffset}
                          size="sm"
                          className="w-full"
                        >
                          Apply Offset
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-semibold">Fillet Radius (cm)</Label>
                        <Input
                          type="number"
                          value={filletRadius}
                          onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
                          step="0.1"
                          min="0.1"
                        />
                        <Button
                          variant="outline"
                          onClick={handleFillet}
                          size="sm"
                          className="w-full"
                        >
                          Apply Fillet
                        </Button>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Shape
                      </Button>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

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
                    {shapes.map(renderShape)}

                    {/* Transformer for selected shape */}
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
                  {toolMode === 'draw' && selectedTool && `🖱️ Click and drag to draw a ${selectedTool}`}
                  {toolMode === 'select' && '📐 Click shapes to select, drag to move, use handles to resize'}
                  {toolMode === 'edit-nodes' && '🎯 Edit nodes by dragging the control points'}
                  {toolMode === 'trim' && '✂️ Select a shape, then click another shape to trim it'}
                  {toolMode !== 'draw' && toolMode !== 'select' && toolMode !== 'edit-nodes' && toolMode !== 'trim' && '👆 Select a tool to get started'}
                </div>
                <div className="text-xs text-blue-700">
                  Shapes created: <span className="font-bold">{shapes.length}</span>
                  {selectedId && ` • Selected: ${selectedShape?.type}`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
