import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Line, Text, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Square, Circle as CircleIcon, Triangle, Move, Trash2, Plus } from 'lucide-react';

const GRID_SIZE = 10; // 1cm = 10px

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'l-shape-tl';

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
  fill: string;
  stroke: string;
}

interface DragState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  shapeType: ShapeType | null;
}

const ShapeDesigner = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ShapeType | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    shapeType: null
  });
  const [slabWidth, setSlabWidth] = useState(80);
  const [slabHeight, setSlabHeight] = useState(60);
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const selectedShape = shapes.find(s => s.id === selectedId);

  const colors = {
    rectangle: { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgb(59, 130, 246)' },
    circle: { fill: 'rgba(249, 115, 22, 0.3)', stroke: 'rgb(249, 115, 22)' },
    triangle: { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgb(34, 197, 94)' },
    'l-shape-tl': { fill: 'rgba(139, 92, 246, 0.3)', stroke: 'rgb(139, 92, 246)' }
  };

  const handleMouseDown = (e: any) => {
    if (!selectedTool) return;
    
    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();
    const x = Math.round(pointerPos.x / GRID_SIZE) * GRID_SIZE;
    const y = Math.round(pointerPos.y / GRID_SIZE) * GRID_SIZE;

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
    const currentX = Math.round(pointerPos.x / GRID_SIZE) * GRID_SIZE;
    const currentY = Math.round(pointerPos.y / GRID_SIZE) * GRID_SIZE;

    const width = Math.abs(currentX - dragState.startX);
    const height = Math.abs(currentY - dragState.startY);
    const x = Math.min(dragState.startX, currentX);
    const y = Math.min(dragState.startY, currentY);

    // Update preview or create temporary shape
    const previewId = 'preview-shape';
    const existingPreview = shapes.find(s => s.id === previewId);
    
    if (width > GRID_SIZE || height > GRID_SIZE) {
      const newShape: Shape = {
        id: previewId,
        type: dragState.shapeType,
        x: x / GRID_SIZE,
        y: y / GRID_SIZE,
        ...colors[dragState.shapeType]
      };

      if (dragState.shapeType === 'rectangle') {
        newShape.width = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
      } else if (dragState.shapeType === 'circle') {
        const radius = Math.min(width, height) / 2 / GRID_SIZE;
        newShape.radius = radius;
        newShape.x = dragState.startX / GRID_SIZE;
        newShape.y = dragState.startY / GRID_SIZE;
      } else if (dragState.shapeType === 'triangle') {
        newShape.base = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
      } else if (dragState.shapeType === 'l-shape-tl') {
        newShape.width = width / GRID_SIZE;
        newShape.height = height / GRID_SIZE;
        newShape.legWidth = (width / 2) / GRID_SIZE;
        newShape.legHeight = (height / 2) / GRID_SIZE;
      }

      if (existingPreview) {
        setShapes(shapes.map(s => s.id === previewId ? newShape : s));
      } else {
        setShapes([...shapes, newShape]);
      }
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDrawing) {
      const previewShape = shapes.find(s => s.id === 'preview-shape');
      if (previewShape) {
        const finalShape = { ...previewShape, id: `shape-${Date.now()}` };
        setShapes(shapes.filter(s => s.id !== 'preview-shape').concat(finalShape));
        setSelectedId(finalShape.id);
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
    setSelectedId(id);
  };

  const handleTransform = (id: string, newAttrs: any) => {
    setShapes(shapes.map(shape => {
      if (shape.id === id) {
        return { ...shape, ...newAttrs };
      }
      return shape;
    }));
  };

  const handleDelete = () => {
    if (selectedId) {
      setShapes(shapes.filter(s => s.id !== selectedId));
      setSelectedId(null);
    }
  };

  const updateShapeMeasurement = (field: string, value: number) => {
    if (!selectedId) return;
    
    setShapes(shapes.map(shape => {
      if (shape.id === selectedId) {
        return { ...shape, [field]: value };
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
              x={shape.x * scale}
              y={shape.y * scale}
              width={shape.width! * scale}
              height={shape.height! * scale}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable
              onClick={() => handleShapeClick(shape.id)}
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
                  width: Math.round(node.width() * node.scaleX() / scale),
                  height: Math.round(node.height() * node.scaleY() / scale)
                });
                node.scaleX(1);
                node.scaleY(1);
              }}
            />
            {/* Measurement labels */}
            <Text
              x={shape.x * scale}
              y={shape.y * scale - 20}
              text={`${shape.width}×${shape.height} cm`}
              fontSize={12}
              fill="#333"
            />
          </Group>
        );

      case 'circle':
        return (
          <Group key={shape.id}>
            <Circle
              x={(shape.x + shape.radius!) * scale}
              y={(shape.y + shape.radius!) * scale}
              radius={shape.radius! * scale}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable
              onClick={() => handleShapeClick(shape.id)}
              onDragEnd={(e) => {
                handleTransform(shape.id, {
                  x: Math.round(e.target.x() / scale - shape.radius!),
                  y: Math.round(e.target.y() / scale - shape.radius!)
                });
              }}
              onTransformEnd={(e) => {
                const node = e.target;
                handleTransform(shape.id, {
                  x: Math.round(node.x() / scale - shape.radius! * node.scaleX()),
                  y: Math.round(node.y() / scale - shape.radius! * node.scaleY()),
                  radius: Math.round(shape.radius! * node.scaleX())
                });
                node.scaleX(1);
                node.scaleY(1);
              }}
            />
            <Text
              x={shape.x * scale}
              y={(shape.y - 2) * scale}
              text={`R: ${shape.radius} cm`}
              fontSize={12}
              fill="#333"
            />
          </Group>
        );

      case 'triangle':
        return (
          <Group key={shape.id}>
            <Line
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
              draggable
              onClick={() => handleShapeClick(shape.id)}
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
              text={`B:${shape.base} H:${shape.height} cm`}
              fontSize={12}
              fill="#333"
            />
          </Group>
        );

      case 'l-shape-tl':
        const w = shape.width! * scale;
        const h = shape.height! * scale;
        const lw = shape.legWidth! * scale;
        const lh = shape.legHeight! * scale;
        
        return (
          <Group key={shape.id}>
            <Line
              x={shape.x * scale}
              y={shape.y * scale}
              points={[0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h]}
              closed
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={isSelected ? 3 : 2}
              draggable
              onClick={() => handleShapeClick(shape.id)}
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
              text={`${shape.width}×${shape.height} cm`}
              fontSize={12}
              fill="#333"
            />
          </Group>
        );

      default:
        return null;
    }
  };

  React.useEffect(() => {
    if (selectedId && transformerRef.current) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#shape-${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedId]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">Interactive Shape Designer</h1>
          <p className="text-muted-foreground">Draw shapes by dragging on the canvas</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tools Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Drawing Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
                  onClick={() => setSelectedTool('rectangle')}
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Rectangle
                </Button>
                <Button
                  variant={selectedTool === 'circle' ? 'default' : 'outline'}
                  onClick={() => setSelectedTool('circle')}
                  className="w-full"
                >
                  <CircleIcon className="h-4 w-4 mr-2" />
                  Circle
                </Button>
                <Button
                  variant={selectedTool === 'triangle' ? 'default' : 'outline'}
                  onClick={() => setSelectedTool('triangle')}
                  className="w-full"
                >
                  <Triangle className="h-4 w-4 mr-2" />
                  Triangle
                </Button>
                <Button
                  variant={selectedTool === 'l-shape-tl' ? 'default' : 'outline'}
                  onClick={() => setSelectedTool('l-shape-tl')}
                  className="w-full"
                >
                  L-Shape
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setSelectedTool(null)}
                className="w-full"
              >
                <Move className="h-4 w-4 mr-2" />
                Select/Move
              </Button>

              {selectedId && (
                <>
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="font-semibold">Edit Measurements</h3>
                    
                    {selectedShape?.type === 'rectangle' && (
                      <>
                        <div className="space-y-2">
                          <Label>Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.width}
                            onChange={(e) => updateShapeMeasurement('width', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                      </>
                    )}

                    {selectedShape?.type === 'circle' && (
                      <div className="space-y-2">
                        <Label>Radius (cm)</Label>
                        <Input
                          type="number"
                          value={selectedShape.radius}
                          onChange={(e) => updateShapeMeasurement('radius', parseFloat(e.target.value))}
                          step="0.1"
                        />
                      </div>
                    )}

                    {selectedShape?.type === 'triangle' && (
                      <>
                        <div className="space-y-2">
                          <Label>Base (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.base}
                            onChange={(e) => updateShapeMeasurement('base', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                      </>
                    )}

                    {selectedShape?.type === 'l-shape-tl' && (
                      <>
                        <div className="space-y-2">
                          <Label>Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.width}
                            onChange={(e) => updateShapeMeasurement('width', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.height}
                            onChange={(e) => updateShapeMeasurement('height', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Leg Width (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.legWidth}
                            onChange={(e) => updateShapeMeasurement('legWidth', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Leg Height (cm)</Label>
                          <Input
                            type="number"
                            value={selectedShape.legHeight}
                            onChange={(e) => updateShapeMeasurement('legHeight', parseFloat(e.target.value))}
                            step="0.1"
                          />
                        </div>
                      </>
                    )}

                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Shape
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Canvas ({slabWidth}cm × {slabHeight}cm)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden" style={{ backgroundColor: 'hsl(var(--canvas-bg))' }}>
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
                          stroke="hsl(var(--grid))"
                          strokeWidth={0.5}
                        />
                      ))}
                      {Array.from({ length: slabHeight }).map((_, i) => (
                        <Line
                          key={`h-${i}`}
                          points={[0, i * GRID_SIZE, slabWidth * GRID_SIZE, i * GRID_SIZE]}
                          stroke="hsl(var(--grid))"
                          strokeWidth={0.5}
                        />
                      ))}

                      {/* Slab Border */}
                      <Rect
                        x={0}
                        y={0}
                        width={slabWidth * GRID_SIZE}
                        height={slabHeight * GRID_SIZE}
                        stroke="hsl(var(--border))"
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

                <div className="mt-4 text-sm text-muted-foreground">
                  {selectedTool ? (
                    <p>🖱️ Click and drag to draw a {selectedTool}</p>
                  ) : (
                    <p>📐 Select a shape to move, resize, or edit measurements</p>
                  )}
                  <p className="mt-2">Shapes created: {shapes.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShapeDesigner;
