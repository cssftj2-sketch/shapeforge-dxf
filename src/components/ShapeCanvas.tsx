import { useRef, useEffect, useState } from "react";
import { Shape } from "@/types/shapes";
import { useDrag, useDrop } from 'react-dnd';

interface ShapeCanvasProps {
  slab: Shape;
  shapes: Shape[];
  onUpdateShapes: (shapes: Shape[]) => void;
}

const DraggableShape = ({ shape, children }: { shape: Shape, children: React.ReactNode }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "shape",
    item: { id: shape.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move',
        position: 'absolute',
        left: `${shape.x * 10}px`,
        top: `${shape.y * 10}px`,
      }}
    >
      {children}
    </div>
  );
};

const renderShape = (shape: Shape) => {
  const scale = 10;
  switch (shape.type) {
    case "rectangle":
      return (
        <div style={{
          width: `${shape.width * scale}px`,
          height: `${shape.height * scale}px`,
          backgroundColor: "rgba(59, 130, 246, 0.3)",
          border: "2px solid rgb(59, 130, 246)",
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', fontWeight: 'bold' }}>
            {`${shape.width}x${shape.height}`}
          </div>
        </div>
      );
    case "l-shape-tl":
    case "l-shape-tr":
    case "l-shape-bl":
    case "l-shape-br":
      // L-shapes are complex to represent with simple divs, so I'll just use a rectangle for now
      return (
        <div style={{
          width: `${shape.width * scale}px`,
          height: `${shape.height * scale}px`,
          backgroundColor: "rgba(139, 92, 246, 0.3)",
          border: "2px solid rgb(139, 92, 246)",
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', fontWeight: 'bold' }}>
            {`${shape.width}x${shape.height}`}
          </div>
        </div>
      );
    case "triangle":
      // Triangles are also complex, so I'll use a rectangle for now
      return (
        <div style={{
          width: `${shape.base * scale}px`,
          height: `${shape.height * scale}px`,
          backgroundColor: "rgba(34, 197, 94, 0.3)",
          border: "2px solid rgb(34, 197, 94)",
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', fontWeight: 'bold' }}>
            {`B:${shape.base} H:${shape.height}`}
          </div>
        </div>
      );
    case "circle":
      return (
        <div style={{
          width: `${shape.radius * 2 * scale}px`,
          height: `${shape.radius * 2 * scale}px`,
          borderRadius: '50%',
          backgroundColor: "rgba(249, 115, 22, 0.3)",
          border: "2px solid rgb(249, 115, 22)",
          position: 'relative',
        }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'black', fontWeight: 'bold' }}>
            {`R:${shape.radius}`}
          </div>
        </div>
      );
    default:
      return null;
  }
}

export const ShapeCanvas = ({
  slab,
  shapes,
  onUpdateShapes
}: ShapeCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectedShape, setSelectedShape] = useState<string | null>(null);
  const [resizing, setResizing] = useState(false);

  const handleSelectShape = (id: string) => {
    setSelectedShape(id);
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizing) return;
      const newShapes = shapes.map(shape => {
        if (shape.id === selectedShape) {
          if (shape.type === 'rectangle') {
            return {
              ...shape,
              width: Math.round(e.clientX / 10 - shape.x),
              height: Math.round(e.clientY / 10 - shape.y),
            };
          }
        }
        return shape;
      });
      onUpdateShapes(newShapes);
    };

    const handleMouseUp = () => {
      setResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, selectedShape, shapes, onUpdateShapes]);

  const [, drop] = useDrop(() => ({
    accept: "shape",
    drop: (item: { id: string }, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const newShapes = shapes.map(shape => {
        if (shape.id === item.id) {
          return {
            ...shape,
            x: Math.round((shape.x * 10 + delta.x) / 10),
            y: Math.round((shape.y * 10 + delta.y) / 10),
          };
        }
        return shape;
      });
      onUpdateShapes(newShapes);
    },
  }), [shapes]);

  return (
    <div
      ref={drop}
      className="border rounded-lg overflow-hidden shadow-sm"
      style={{
        backgroundColor: "hsl(var(--canvas-bg))",
        position: 'relative',
        width: `${slab.type === 'slab' ? slab.width * 10 : 800}px`,
        height: `${slab.type === 'slab' ? slab.height * 10 : 600}px`
      }}
    >
      {shapes.map(shape => (
        <div key={shape.id} onClick={() => handleSelectShape(shape.id)}>
          <DraggableShape shape={shape}>
            {renderShape(shape)}
            {selectedShape === shape.id && (
              <>
                <div onMouseDown={() => setResizing(true)} style={{ position: 'absolute', top: '-5px', left: '-5px', width: '10px', height: '10px', backgroundColor: 'white', border: '1px solid black', cursor: 'nwse-resize' }} />
                <div onMouseDown={() => setResizing(true)} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '10px', height: '10px', backgroundColor: 'white', border: '1px solid black', cursor: 'nesw-resize' }} />
                <div onMouseDown={() => setResizing(true)} style={{ position: 'absolute', bottom: '-5px', left: '-5px', width: '10px', height: '10px', backgroundColor: 'white', border: '1px solid black', cursor: 'nesw-resize' }} />
                <div onMouseDown={() => setResizing(true)} style={{ position: 'absolute', bottom: '-5px', right: '-5px', width: '10px', height: '10px', backgroundColor: 'white', border: '1px solid black', cursor: 'nwse-resize' }} />
              </>
            )}
          </DraggableShape>
        </div>
      ))}
    </div>
  );
};
