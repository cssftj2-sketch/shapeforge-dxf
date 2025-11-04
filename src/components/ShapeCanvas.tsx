import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import { Shape, ShapeType, ToolMode } from '@/types/shapes';
import { GRID_SIZE } from '@/constants/canvas';
import { snapToGrid, createShapeFromDrag } from '@/utils/geometry';
import { ShapeRenderer } from '@/components/ShapeRenderer';
import { HorizontalToolbar } from '@/components/HorizontalToolbar';
import { PropertiesSidebar } from '@/components/PropertiesSidebar';
import Konva from 'konva';

interface ShapeCanvasProps {
  shapes: Shape[];
  setShapes: React.Dispatch<React.SetStateAction<Shape[]>>;
  slab: Shape | null;
}

export default function ShapeCanvas({ shapes, setShapes, slab }: ShapeCanvasProps) {
  const slabWidth = slab?.type === 'slab' ? slab.width : 80;
  const slabHeight = slab?.type === 'slab' ? slab.height : 60;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedShape = shapes.find(s => s.id === selectedId);

  // New state to manage stage zoom and position
  const [stageState, setStageState] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });

  const updateShape = (id: string, updates: Partial<Shape>) => {
    setShapes(prev => prev.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, ...updates } as Shape;

      // Clamp position and dimensions to slab bounds
      if ('x' in updated && typeof updated.x === 'number') {
        const shapeWidth = 'width' in updated && typeof updated.width === 'number' ? updated.width : 0;
        updated.x = Math.max(0, Math.min(slabWidth - shapeWidth, updated.x));
      }
      if ('y' in updated && typeof updated.y === 'number') {
        const shapeHeight = 'height' in updated && typeof updated.height === 'number' ? updated.height : 0;
        updated.y = Math.max(0, Math.min(slabHeight - shapeHeight, updated.y));
      }
      if ('width' in updated && typeof updated.width === 'number') {
        updated.width = Math.max(0.5, Math.min(slabWidth - updated.x, updated.width));
      }
      if ('height' in updated && typeof updated.height === 'number') {
        updated.height = Math.max(0.5, Math.min(slabHeight - updated.y, updated.height));
      }

      return updated;
    }));
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
    const newShape: Shape = { ...shape, id: `shape-${Date.now()}`, x: shape.x + 2, y: shape.y + 2 };
    addShape(newShape);
    setSelectedId(newShape.id);
  };

  const replacePreview = (previewShape: Shape, finalId: string) => {
    setShapes(prev => prev.filter(s => s.id !== 'preview-shape').concat({ ...previewShape, id: finalId }));
  };

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<{ [key: string]: any }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  const getPointerPosition = (stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };
    return stage.getInverseTransform().point(pointer);
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      if (toolMode === 'select') {
        setSelectedId(null);
        return;
      }

      if (toolMode === 'draw' && selectedTool) {
        const stage = e.target.getStage();
        const pos = getPointerPosition(stage!);
        const x = snapToGrid(pos.x) / GRID_SIZE;
        const y = snapToGrid(pos.y) / GRID_SIZE;

        setDragState({
          isDrawing: true,
          startX: x,
          startY: y,
          shapeType: selectedTool
        });
      }
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!dragState.isDrawing || !dragState.shapeType) return;

    const stage = e.target.getStage();
    const pos = getPointerPosition(stage!);
    const currentX = Math.max(0, Math.min(slabWidth, snapToGrid(pos.x) / GRID_SIZE));
    const currentY = Math.max(0, Math.min(slabHeight, snapToGrid(pos.y) / GRID_SIZE));
    
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

    if (shapes.some(s => s.id === 'preview-shape')) {
      updateShape('preview-shape', previewShape);
    } else {
      addShape(previewShape);
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDrawing) {
      const previewShape = shapes.find(s => s.id === 'preview-shape');
      if (previewShape) {
        const finalId = `shape-${Date.now()}`;
        replacePreview(previewShape, finalId);
        setSelectedId(finalId);
      }
      setDragState({ isDrawing: false, startX: 0, startY: 0, shapeType: null });
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.05;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    setStageState({
      scale: newScale,
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  const handleShapeClick = (id: string) => {
    if (toolMode === 'select' || toolMode === 'edit-nodes') {
      setSelectedId(id);
    }
  };

  const updateShapeMeasurement = (field: string, value: number) => {
    if (!selectedId || isNaN(value)) return;
    updateShape(selectedId, { [field]: Math.max(0.1, value) });
  };
  
  useEffect(() => {
    if (transformerRef.current) {
        if (selectedId && toolMode === 'select') {
            const selectedNode = shapeRefs.current[selectedId];
            if (selectedNode) {
                transformerRef.current.nodes([selectedNode]);
            } else {
                transformerRef.current.nodes([]);
            }
        } else {
            transformerRef.current.nodes([]);
        }
        transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId, toolMode, shapes]);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <HorizontalToolbar
        toolMode={toolMode}
        setToolMode={setToolMode}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onDuplicate={() => selectedId && duplicateShape(selectedId)}
        onMirror={() => {}}
        onDelete={() => selectedId && removeShape(selectedId)}
        onOffset={() => {}}
        onFillet={() => {}}
        hasSelection={!!selectedId}
      />
      <div className="flex-1 flex relative min-h-0">
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            scaleX={stageState.scale}
            scaleY={stageState.scale}
            x={stageState.x}
            y={stageState.y}
          >
            <Layer>
              {Array.from({ length: slabWidth + 1 }).map((_, i) => (
                <Line
                  key={`v-${i}`}
                  points={[i * GRID_SIZE, 0, i * GRID_SIZE, slabHeight * GRID_SIZE]}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                />
              ))}
              {Array.from({ length: slabHeight + 1 }).map((_, i) => (
                <Line
                  key={`h-${i}`}
                  points={[0, i * GRID_SIZE, slabWidth * GRID_SIZE, i * GRID_SIZE]}
                  stroke="#e5e7eb"
                  strokeWidth={0.5}
                />
              ))}
              <Rect
                x={0}
                y={0}
                width={slabWidth * GRID_SIZE}
                height={slabHeight * GRID_SIZE}
                stroke="#374151"
                strokeWidth={3 / stageState.scale}
              />
              {shapes.filter(s => s.type !== 'slab').map(shape => (
                <ShapeRenderer
                  key={shape.id}
                  shape={shape}
                  isSelected={shape.id === selectedId}
                  toolMode={toolMode}
                  onSelect={handleShapeClick}
                  onTransform={updateShape}
                  shapeRef={(node) => { shapeRefs.current[shape.id] = node; }}
                  onMeasurementEdit={updateShapeMeasurement}
                />
              ))}
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5) ? oldBox : newBox}
              />
            </Layer>
          </Stage>
        </div>
        <PropertiesSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          selectedShape={selectedShape}
          onUpdateMeasurement={updateShapeMeasurement}
          offsetValue={offsetValue}
          setOffsetValue={setOffsetValue}
          filletRadius={filletRadius}
          setFilletRadius={setFilletRadius}
        />
      </div>
    </div>
  );
}
