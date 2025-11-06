import React, { useState } from 'react';
import { Rect, Circle, Line, Arc, Text, Group } from 'react-konva';
import { Shape, ToolMode } from '../types/shapes';
import { GRID_SIZE } from '../constants/canvas';
import { getLShapePoints } from '../utils/geometry';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  toolMode: ToolMode;
  stageScale: number;
  onSelect: (id: string) => void;
  onTransform: (id: string, updates: Partial<Shape>) => void;
  shapeRef: (node: any) => void;
  onMeasurementEdit?: (field: string, value: number) => void;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ 
  shape, 
  isSelected, 
  toolMode,
  stageScale,
  onSelect, 
  onTransform,
  shapeRef,
  onMeasurementEdit
}) => {
  const scale = GRID_SIZE;
  const isDraggable = toolMode === 'select';
  const strokeWidth = (isSelected ? 3 : 2) / stageScale;
  const measurementColor = isSelected ? '#3b82f6' : '#6b7280';
  const measurementBg = isSelected ? '#dbeafe' : '#f3f4f6';
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  const nodeRadius = 6 / stageScale;
  const nodeStrokeWidth = 2 / stageScale;

  // Render a draggable node handle
  const renderNode = (x: number, y: number, index: number, onDrag: (newX: number, newY: number) => void) => (
    <Circle
      key={`node-${index}`}
      x={x}
      y={y}
      radius={hoveredNode === index ? nodeRadius * 1.3 : nodeRadius}
      fill={hoveredNode === index ? '#3b82f6' : 'white'}
      stroke="#3b82f6"
      strokeWidth={nodeStrokeWidth}
      draggable={toolMode === 'edit-nodes'}
      onMouseEnter={() => setHoveredNode(index)}
      onMouseLeave={() => setHoveredNode(null)}
      onDragMove={(e) => {
        onDrag(e.target.x(), e.target.y());
      }}
      hitStrokeWidth={20 / stageScale}
    />
  );

  const handleDragEnd = (e: any) => {
    onTransform(shape.id, {
      x: Math.round(e.target.x() / scale),
      y: Math.round(e.target.y() / scale)
    });
  };

  const renderMeasurementLabel = (
    x: number, 
    y: number, 
    text: string, 
    rotation: number = 0,
    field?: string,
    currentValue?: number
  ) => (
    <Group
      onClick={(e) => {
        e.cancelBubble = true;
        if (field && currentValue !== undefined && onMeasurementEdit) {
          const newValue = prompt(`Enter new value for ${field} (cm):`, currentValue.toString());
          if (newValue && !isNaN(parseFloat(newValue))) {
            onMeasurementEdit(field, parseFloat(newValue));
          }
        }
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        if (field && currentValue !== undefined && onMeasurementEdit) {
          const newValue = prompt(`Enter new value for ${field} (cm):`, currentValue.toString());
          if (newValue && !isNaN(parseFloat(newValue))) {
            onMeasurementEdit(field, parseFloat(newValue));
          }
        }
      }}
    >
      <Rect
        x={x - 30}
        y={y - 10}
        width={60}
        height={20}
        fill={measurementBg}
        cornerRadius={4}
        opacity={0.9}
        listening={!!field}
      />
      <Text
        x={x - 30}
        y={y - 6}
        width={60}
        text={text}
        fontSize={11}
        fontStyle="bold"
        fill={measurementColor}
        align="center"
        listening={!!field}
        rotation={rotation}
      />
    </Group>
  );

  // Debug logging for rectangles
  if (shape.type === 'rectangle') {
    console.log(`Rendering rectangle ${shape.id}:`, {
      shapeCm: { x: shape.x, y: shape.y, width: shape.width, height: shape.height },
      pixels: { x: shape.x * scale, y: shape.y * scale, width: shape.width! * scale, height: shape.height! * scale }
    });
  }

  switch (shape.type) {
    case 'rectangle':
      const rectX = shape.x * scale;
      const rectY = shape.y * scale;
      const rectW = shape.width! * scale;
      const rectH = shape.height! * scale;
      
      return (
        <Group key={shape.id}>
          <Rect
            ref={shapeRef}
            id={shape.id}
            x={rectX}
            y={rectY}
            width={rectW}
            height={rectH}
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
          {/* Edit nodes mode - show corner handles */}
          {toolMode === 'edit-nodes' && isSelected && (
            <>
              {/* Top-left corner */}
              {renderNode(rectX, rectY, 0, (newX, newY) => {
                const deltaX = (newX - rectX) / scale;
                const deltaY = (newY - rectY) / scale;
                onTransform(shape.id, {
                  x: shape.x + deltaX,
                  y: shape.y + deltaY,
                  width: Math.max(0.5, shape.width! - deltaX),
                  height: Math.max(0.5, shape.height! - deltaY)
                });
              })}
              {/* Top-right corner */}
              {renderNode(rectX + rectW, rectY, 1, (newX, newY) => {
                const deltaX = (newX - (rectX + rectW)) / scale;
                const deltaY = (newY - rectY) / scale;
                onTransform(shape.id, {
                  y: shape.y + deltaY,
                  width: Math.max(0.5, shape.width! + deltaX),
                  height: Math.max(0.5, shape.height! - deltaY)
                });
              })}
              {/* Bottom-left corner */}
              {renderNode(rectX, rectY + rectH, 2, (newX, newY) => {
                const deltaX = (newX - rectX) / scale;
                const deltaY = (newY - (rectY + rectH)) / scale;
                onTransform(shape.id, {
                  x: shape.x + deltaX,
                  width: Math.max(0.5, shape.width! - deltaX),
                  height: Math.max(0.5, shape.height! + deltaY)
                });
              })}
              {/* Bottom-right corner */}
              {renderNode(rectX + rectW, rectY + rectH, 3, (newX, newY) => {
                const deltaX = (newX - (rectX + rectW)) / scale;
                const deltaY = (newY - (rectY + rectH)) / scale;
                onTransform(shape.id, {
                  width: Math.max(0.5, shape.width! + deltaX),
                  height: Math.max(0.5, shape.height! + deltaY)
                });
              })}
            </>
          )}
          {/* Measurement labels on all sides - clickable */}
          {renderMeasurementLabel(rectX + rectW / 2, rectY - 20, `${shape.width?.toFixed(1)} cm`, 0, 'width', shape.width)}
          {renderMeasurementLabel(rectX + rectW / 2, rectY + rectH + 20, `${shape.width?.toFixed(1)} cm`, 0, 'width', shape.width)}
          {renderMeasurementLabel(rectX - 35, rectY + rectH / 2, `${shape.height?.toFixed(1)} cm`, -90, 'height', shape.height)}
          {renderMeasurementLabel(rectX + rectW + 35, rectY + rectH / 2, `${shape.height?.toFixed(1)} cm`, 90, 'height', shape.height)}
        </Group>
      );

    case 'circle':
      const circleX = (shape.x + shape.radius!) * scale;
      const circleY = (shape.y + shape.radius!) * scale;
      const radius = shape.radius! * scale;
      
      return (
        <Group key={shape.id}>
          <Circle
            ref={shapeRef}
            id={shape.id}
            x={circleX}
            y={circleY}
            radius={radius}
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
          {/* Radius label - clickable */}
          {renderMeasurementLabel(circleX, circleY - radius - 25, `R: ${shape.radius?.toFixed(1)} cm`, 0, 'radius', shape.radius)}
          {/* Diameter label - non-editable */}
          {renderMeasurementLabel(circleX, circleY + radius + 25, `Ø: ${(shape.radius! * 2).toFixed(1)} cm`)}
        </Group>
      );

    case 'triangle':
      const triX = shape.x * scale;
      const triY = shape.y * scale;
      const triBase = shape.base! * scale;
      const triHeight = shape.height! * scale;
      const triPoints = [triBase / 2, 0, triBase, triHeight, 0, triHeight];
      
      return (
        <Group key={shape.id}>
          <Line
            ref={shapeRef}
            id={shape.id}
            x={triX}
            y={triY}
            points={triPoints}
            closed
            fill={shape.fill}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
          />
          {/* Edit nodes mode - show vertex handles */}
          {toolMode === 'edit-nodes' && isSelected && (
            <>
              {/* Top vertex */}
              {renderNode(triX + triPoints[0], triY + triPoints[1], 0, (newX, newY) => {
                const newTop = (newY - triY) / scale;
                const newCenter = (newX - triX) / scale;
                const heightChange = shape.height! - newTop;
                onTransform(shape.id, {
                  y: shape.y + newTop,
                  height: Math.max(0.5, heightChange),
                  base: shape.base
                });
              })}
              {/* Bottom-right vertex */}
              {renderNode(triX + triPoints[2], triY + triPoints[3], 1, (newX, newY) => {
                const newWidth = (newX - triX) / scale;
                const newHeight = (newY - triY) / scale;
                onTransform(shape.id, {
                  base: Math.max(1, newWidth),
                  height: Math.max(0.5, newHeight)
                });
              })}
              {/* Bottom-left vertex */}
              {renderNode(triX + triPoints[4], triY + triPoints[5], 2, (newX, newY) => {
                const newHeight = (newY - triY) / scale;
                onTransform(shape.id, {
                  height: Math.max(0.5, newHeight)
                });
              })}
            </>
          )}
          {/* Base measurement - clickable */}
          {renderMeasurementLabel(triX + triBase / 2, triY + triHeight + 25, `B: ${shape.base?.toFixed(1)} cm`, 0, 'base', shape.base)}
          {/* Height measurement - clickable */}
          {renderMeasurementLabel(triX - 35, triY + triHeight / 2, `H: ${shape.height?.toFixed(1)} cm`, -90, 'height', shape.height)}
        </Group>
      );

    case 'line':
      const linePoints = shape.points || [0, 0, 10, 10];
      const lineX = shape.x * scale;
      const lineY = shape.y * scale;
      
      return (
        <Group key={shape.id}>
          <Line
            ref={shapeRef}
            id={shape.id}
            x={lineX}
            y={lineY}
            points={linePoints.map(p => p * scale)}
            stroke={shape.stroke}
            strokeWidth={strokeWidth}
            draggable={isDraggable}
            onClick={() => onSelect(shape.id)}
            onTap={() => onSelect(shape.id)}
            onDragEnd={handleDragEnd}
          />
          {/* Edit nodes mode - show all line points */}
          {toolMode === 'edit-nodes' && isSelected && linePoints.length >= 2 && (
            <>
              {Array.from({ length: linePoints.length / 2 }).map((_, i) => {
                const pointIndex = i * 2;
                return renderNode(
                  lineX + linePoints[pointIndex] * scale,
                  lineY + linePoints[pointIndex + 1] * scale,
                  i,
                  (newX, newY) => {
                    const newPoints = [...linePoints];
                    newPoints[pointIndex] = (newX - lineX) / scale;
                    newPoints[pointIndex + 1] = (newY - lineY) / scale;
                    onTransform(shape.id, { points: newPoints });
                  }
                );
              })}
            </>
          )}
          {/* Line length measurement */}
          {linePoints.length >= 4 && (
            <>
              {(() => {
                const dx = linePoints[2] - linePoints[0];
                const dy = linePoints[3] - linePoints[1];
                const length = Math.sqrt(dx * dx + dy * dy);
                const midX = lineX + ((linePoints[0] + linePoints[2]) / 2) * scale;
                const midY = lineY + ((linePoints[1] + linePoints[3]) / 2) * scale;
                return renderMeasurementLabel(midX, midY - 20, `${length.toFixed(1)} cm`);
              })()}
            </>
          )}
        </Group>
      );

    case 'arc':
      const arcX = shape.x * scale;
      const arcY = shape.y * scale;
      
      return (
        <Group key={shape.id}>
          <Arc
            ref={shapeRef}
            id={shape.id}
            x={arcX}
            y={arcY}
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
          {/* Arc measurements */}
          {renderMeasurementLabel(arcX, arcY - shape.outerRadius! * scale - 25, `R: ${shape.outerRadius?.toFixed(1)} cm`)}
          {renderMeasurementLabel(arcX, arcY + shape.outerRadius! * scale + 25, `${shape.angle}°`)}
        </Group>
      );

    default:
      if (shape.type.startsWith('l-shape-') && 'legWidth' in shape && 'legHeight' in shape) {
        const lX = shape.x * scale;
        const lY = shape.y * scale;
        const w = shape.width * scale;
        const h = shape.height * scale;
        const lw = shape.legWidth * scale;
        const lh = shape.legHeight * scale;
        const lPoints = getLShapePoints(shape.type, w, h, lw, lh);
        
        return (
          <Group key={shape.id}>
            <Line
              ref={shapeRef}
              id={shape.id}
              x={lX}
              y={lY}
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
            {/* Edit nodes mode - show all L-shape vertices */}
            {toolMode === 'edit-nodes' && isSelected && (
              <>
                {Array.from({ length: lPoints.length / 2 }).map((_, i) => {
                  const pointIndex = i * 2;
                  return renderNode(
                    lX + lPoints[pointIndex],
                    lY + lPoints[pointIndex + 1],
                    i,
                    (newX, newY) => {
                      // For L-shapes, we calculate the change and update dimensions accordingly
                      const deltaX = (newX - (lX + lPoints[pointIndex])) / scale;
                      const deltaY = (newY - (lY + lPoints[pointIndex + 1])) / scale;
                      
                      // Simplified: Allow basic node dragging
                      // More complex logic would involve determining which dimension to change
                      // based on which vertex is being dragged
                      if (i === 0) {
                        // Top-left corner
                        onTransform(shape.id, {
                          x: shape.x + deltaX,
                          y: shape.y + deltaY,
                          width: Math.max(shape.legWidth + 0.5, shape.width - deltaX),
                          height: Math.max(shape.legHeight + 0.5, shape.height - deltaY)
                        });
                      } else if (i === 2) {
                        // Adjust leg dimensions
                        onTransform(shape.id, {
                          legWidth: Math.max(0.5, shape.legWidth + deltaX),
                          legHeight: Math.max(0.5, shape.legHeight + deltaY)
                        });
                      }
                    }
                  );
                })}
              </>
            )}
            {/* L-Shape measurements - clickable */}
            {renderMeasurementLabel(lX + w / 2, lY - 20, `${shape.width?.toFixed(1)} cm`, 0, 'width', shape.width)}
            {renderMeasurementLabel(lX - 35, lY + h / 2, `${shape.height?.toFixed(1)} cm`, -90, 'height', shape.height)}
            {renderMeasurementLabel(lX + lw / 2, lY + h + 20, `Leg: ${shape.legWidth?.toFixed(1)}×${shape.legHeight?.toFixed(1)} cm`, 0, 'legWidth', shape.legWidth)}
          </Group>
        );
      }
      return null;
  }
};