import { Stage, Layer, Rect, Circle, Line, Text } from "react-konva";
import { Shape } from "@/types/shapes";
import React from "react";
import Konva from "konva";

interface ShapeCanvasProps {
  slab: Shape;
  shapes: Shape[];
  onUpdateShapes: (shapes: Shape[]) => void;
}

const GRID_SIZE = 10; // 1cm = 10px

export const ShapeCanvas = ({ slab, shapes, onUpdateShapes }: ShapeCanvasProps) => {
  if (slab.type !== 'slab') {
    return null;
  }

  const handleDragEnd = (e: any, id: string) => {
    const newShapes = shapes.map(shape => {
      if (shape.id === id) {
        return {
          ...shape,
          x: e.target.x() / GRID_SIZE,
          y: e.target.y() / GRID_SIZE,
        };
      }
      return shape;
    });
    onUpdateShapes(newShapes);
  };

  const slabWidth = slab.width * GRID_SIZE;
  const slabHeight = slab.height * GRID_SIZE;

  const [selectedShape, setSelectedShape] = React.useState<string | null>(null);

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedShape(null);
    }
  };

  const renderShape = (shape: Shape) => {
    const scale = GRID_SIZE;

    switch (shape.type) {
      case "rectangle":
        return (
          <ShapeComponent shape={shape}>
            <Rect
              x={shape.x * scale}
              y={shape.y * scale}
              draggable
              onDragEnd={(e) => handleDragEnd(e, shape.id)}
              width={shape.width * scale}
              height={shape.height * scale}
              fill="rgba(59, 130, 246, 0.3)"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              onTransformEnd={(e) => {
                const node = e.target;
                const newShapes = shapes.map(s => {
                  if (s.id === shape.id && s.type === 'rectangle') {
                    return {
                      ...s,
                      x: node.x() / scale,
                      y: node.y() / scale,
                      width: node.width() * node.scaleX() / scale,
                      height: node.height() * node.scaleY() / scale,
                    };
                  }
                  return s;
                });
                onUpdateShapes(newShapes);
              }}
            />
          </ShapeComponent>
        );
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        const w = shape.width * scale;
        const h = shape.height * scale;
        const lw = shape.legWidth * scale;
        const lh = shape.legHeight * scale;
        
        let points: number[] = [];

        if (shape.type === "l-shape-tl") {
          points = [0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h];
        } else if (shape.type === "l-shape-tr") {
          points = [0, 0, w, 0, w, h, w - lw, h, w - lw, lh, 0, lh];
        } else if (shape.type === "l-shape-bl") {
          points = [0, 0, lw, 0, lw, h - lh, w, h - lh, w, h, 0, h];
        } else if (shape.type === "l-shape-br") {
          points = [0, 0, w, 0, w, h, 0, h, 0, h - lh, w - lw, h-lh, w-lw, 0];
        }

        return (
          <ShapeComponent shape={shape}>
            <Line
              x={shape.x * scale}
              y={shape.y * scale}
              points={points}
              closed
              fill="rgba(139, 92, 246, 0.3)"
              stroke="rgb(139, 92, 246)"
              strokeWidth={2}
              draggable
              onDragEnd={(e) => handleDragEnd(e, shape.id)}
              onTransformEnd={(e) => {
                const node = e.target;
                const newShapes = shapes.map(s => {
                  if (s.id === shape.id && (s.type === 'l-shape-tl' || s.type === 'l-shape-tr' || s.type === 'l-shape-bl' || s.type === 'l-shape-br')) {
                    return {
                      ...s,
                      x: node.x() / scale,
                      y: node.y() / scale,
                      width: s.width * node.scaleX(),
                      height: s.height * node.scaleY(),
                    };
                  }
                  return s;
                });
                onUpdateShapes(newShapes);
              }}
            />
          </ShapeComponent>
        )

      case "triangle":
        return (
          <ShapeComponent shape={shape}>
            <Line
              x={shape.x * scale}
              y={shape.y * scale}
              points={[
                shape.base * scale / 2, 0,
                shape.base * scale, shape.height * scale,
                0, shape.height * scale,
              ]}
              closed
              fill="rgba(34, 197, 94, 0.3)"
              stroke="rgb(34, 197, 94)"
              strokeWidth={2}
              draggable
              onDragEnd={(e) => handleDragEnd(e, shape.id)}
              onTransformEnd={(e) => {
                const node = e.target;
                const newShapes = shapes.map(s => {
                  if (s.id === shape.id && s.type === 'triangle') {
                    return {
                      ...s,
                      x: node.x() / scale,
                      y: node.y() / scale,
                      base: s.base * node.scaleX(),
                      height: s.height * node.scaleY(),
                    };
                  }
                  return s;
                });
                onUpdateShapes(newShapes);
              }}
            />
          </ShapeComponent>
        );
      case "circle":
        return (
          <ShapeComponent shape={shape}>
            <Circle
              x={shape.x * scale + shape.radius * scale}
              y={shape.y * scale + shape.radius * scale}
              draggable
              onDragEnd={(e) => handleDragEnd(e, shape.id)}
              radius={shape.radius * scale}
              fill="rgba(249, 115, 22, 0.3)"
              stroke="rgb(249, 115, 22)"
              strokeWidth={2}
              onTransformEnd={(e) => {
                const node = e.target;
                const newShapes = shapes.map(s => {
                  if (s.id === shape.id && s.type === 'circle') {
                    return {
                      ...s,
                      x: node.x() / scale - (s.radius * node.scaleX()),
                      y: node.y() / scale - (s.radius * node.scaleY()),
                      radius: s.radius * node.scaleX(),
                    };
                  }
                  return s;
                });
                onUpdateShapes(newShapes);
              }}
            />
          </ShapeComponent>
        );
      default:
        return null;
    }
  };

  const ShapeComponent = ({ shape, children }: { shape: Shape, children: React.ReactNode }) => {
    const shapeRef = React.useRef<any>();
    const trRef = React.useRef<any>();

    React.useEffect(() => {
      if (selectedShape === shape.id) {
        trRef.current.nodes([shapeRef.current]);
        trRef.current.getLayer().batchDraw();
      }
    }, [selectedShape]);

    return (
      <React.Fragment>
        {React.cloneElement(children as React.ReactElement, {
          ref: shapeRef,
          onClick: () => setSelectedShape(shape.id),
          onTap: () => setSelectedShape(shape.id),
        })}
        {selectedShape === shape.id && (
          <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox: any, newBox: any) => {
              // limit resize
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm" style={{ backgroundColor: "hsl(var(--canvas-bg))" }}>
      <Stage width={slabWidth} height={slabHeight} onMouseDown={checkDeselect} onTouchStart={checkDeselect}>
        <Layer>
          {/* Slab Background */}
          <Rect
            x={0}
            y={0}
            width={slabWidth}
            height={slabHeight}
            fill="hsl(var(--muted))"
          />

          {/* Grid */}
          {Array.from({ length: slabWidth / GRID_SIZE }).map((_, i) => (
            <Line
              key={`v-${i}`}
              points={[i * GRID_SIZE, 0, i * GRID_SIZE, slabHeight]}
              stroke="hsl(var(--grid))"
              strokeWidth={0.5}
            />
          ))}
          {Array.from({ length: slabHeight / GRID_SIZE }).map((_, i) => (
            <Line
              key={`h-${i}`}
              points={[0, i * GRID_SIZE, slabWidth, i * GRID_SIZE]}
              stroke="hsl(var(--grid))"
              strokeWidth={0.5}
            />
          ))}
          
          {/* Slab Border */}
          <Rect
            x={0}
            y={0}
            width={slabWidth}
            height={slabHeight}
            stroke="hsl(var(--border))"
            strokeWidth={3}
          />
          
          {shapes.map(renderShape)}
        </Layer>
      </Stage>
    </div>
  );
};
