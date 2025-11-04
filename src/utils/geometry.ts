import { Shape, ShapeType } from '../types/shapes';
import { GRID_SIZE, COLORS } from '../constants/canvas';

export const snapToGrid = (value: number): number => Math.round(value / GRID_SIZE) * GRID_SIZE;

export const createShapeFromDrag = (
  type: ShapeType,
  startX: number,
  startY: number,
  currentX: number,
  currentY: number
): Partial<Shape> => {
  // Note: coordinates are already in centimeters from ShapeCanvas
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);

  const base = {
    x: startX,
    y: startY,
    ...COLORS[type]
  };

  switch (type) {
    case 'rectangle':
      return { ...base, x, y, width, height };
    case 'circle':
      return { ...base, radius: Math.min(width, height) / 2 };
    case 'triangle':
      return { ...base, x, y, base: width, height };
    case 'line':
      return { ...base, points: [0, 0, currentX - startX, currentY - startY] };
    case 'arc':
      const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
      const angle = Math.atan2(currentY - startY, currentX - startX) * (180 / Math.PI);
      return { ...base, innerRadius: 0, outerRadius: radius, angle: Math.abs(angle) };
    default:
      if (type.startsWith('l-shape-')) {
        return {
          ...base,
          x,
          y,
          width,
          height,
          legWidth: width / 2,
          legHeight: height / 2
        };
      }
      return base;
  }
};

export const getLShapePoints = (type: ShapeType, w: number, h: number, lw: number, lh: number): number[] => {
  switch (type) {
    case 'l-shape-tl': return [0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h];
    case 'l-shape-tr': return [0, 0, w, 0, w, h, w - lw, h, w - lw, lh, 0, lh];
    case 'l-shape-bl': return [0, 0, lw, 0, lw, h - lh, w, h - lh, w, h, 0, h];
    case 'l-shape-br': return [0, h - lh, w - lw, h - lh, w - lw, 0, w, 0, w, h, 0, h];
    default: return [];
  }
};
