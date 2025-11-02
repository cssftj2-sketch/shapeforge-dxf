import React from 'react';
import { Rect, Circle, Line, Arc, Text, Group } from 'react-konva';
import { Shape, ToolMode } from '../types/shapes';
import { GRID_SIZE } from '../constants/canvas';
import { getLShapePoints } from '../utils/geometry';

interface ShapeRendererProps {
  shape: Shape;
  isSelected: boolean;
  toolMode: ToolMode;
  onSelect: (id: string) => void;
  onTransform: (id: string, updates: Partial<Shape>) => void;
  shapeRef: (node: any) => void;
}

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({ 
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
      if (shape.type.startsWith('l-shape-') && 'legWidth' in shape && 'legHeight' in shape) {
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
