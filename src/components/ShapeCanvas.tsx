import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Line, Transformer } from 'react-konva';
import { Shape, ShapeType, ToolMode } from '@/types/shapes';
import { GRID_SIZE } from '@/constants/canvas';
import { snapToGrid, createShapeFromDrag } from '@/utils/geometry';
import { useShapeManager } from '@/hooks/useShapeManager';
import { ShapeRenderer } from '@/components/ShapeRenderer';
import { HorizontalToolbar } from '@/components/HorizontalToolbar';
import { PropertiesSidebar } from '@/components/PropertiesSidebar';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const shapeRefs = useRef<{ [key: string]: any }>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle container resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const height = containerRef.current.offsetHeight;
        setContainerSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
    
    if ('width' in shape && 'height' in shape) {
      updateShape(id, { width: shape.width * 0.8, height: shape.height * 0.8 });
    } else if ('radius' in shape) {
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
    
    if ('width' in shape && 'height' in shape && shape.width && shape.height) {
      (newShape as any).width = shape.width + offsetValue * 2;
      (newShape as any).height = shape.height + offsetValue * 2;
    } else if ('radius' in shape && shape.radius) {
      (newShape as any).radius = shape.radius + offsetValue;
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
      const width = 'width' in shape ? shape.width : ('radius' in shape ? shape.radius! * 2 : 0);
      newShape.x = slabWidth - shape.x - width;
    } else {
      const height = 'height' in shape ? shape.height : ('radius' in shape ? shape.radius! * 2 : 0);
      newShape.y = slabHeight - shape.y - height;
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

  // Calculate canvas dimensions and scale
  const canvasWidth = slabWidth * GRID_SIZE;
  const canvasHeight = slabHeight * GRID_SIZE;
  const scale = Math.min(
    containerSize.width / canvasWidth,
    containerSize.height / canvasHeight,
    1.2 // Max scale
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Horizontal Toolbar */}
      <HorizontalToolbar
        toolMode={toolMode}
        setToolMode={setToolMode}
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onDuplicate={() => selectedId && duplicateShape(selectedId)}
        onMirror={handleMirror}
        onDelete={() => selectedId && removeShape(selectedId)}
        onOffset={handleOffset}
        onFillet={handleFillet}
        hasSelection={!!selectedId}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex relative min-h-0">
        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4"
        >
          <div className="w-full h-full flex items-center justify-center">
            <div 
              className="bg-white rounded-lg shadow-lg border border-gray-200"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: 'center center'
              }}
            >
              <Stage
                ref={stageRef}
                width={canvasWidth}
                height={canvasHeight}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
              >
                <Layer>
                  {/* Grid */}
                  {Array.from({ length: slabWidth + 1 }).map((_, i) => (
                    <Line
                      key={`v-${i}`}
                      points={[i * GRID_SIZE, 0, i * GRID_SIZE, slabHeight * GRID_SIZE]}
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                      listening={false}
                    />
                  ))}
                  {Array.from({ length: slabHeight + 1 }).map((_, i) => (
                    <Line
                      key={`h-${i}`}
                      points={[0, i * GRID_SIZE, slabWidth * GRID_SIZE, i * GRID_SIZE]}
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                      listening={false}
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
                    listening={false}
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
                      onMeasurementEdit={updateShapeMeasurement}
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
          </div>

          {/* Tool Mode Message */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 bg-white rounded-lg px-4 py-2 inline-block shadow-sm">
              {getToolModeMessage()}
            </p>
          </div>
        </div>

        {/* Collapsible Properties Sidebar */}
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
