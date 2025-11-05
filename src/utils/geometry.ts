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
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);

  const base = {
    x: startX,
    y: startY,
    stroke: '#000000',
    ...COLORS[type]
  };

  switch (type) {
    case 'rectangle':
      return { ...base, x, y, width, height } as Partial<Shape>;
    case 'circle':
      const radius = Math.sqrt(width ** 2 + height ** 2);
      return { ...base, x: startX - radius, y: startY - radius, radius } as Partial<Shape>;
    case 'triangle':
      return { ...base, x, y, base: width, height } as Partial<Shape>;
    case 'line':
      return { ...base, points: [0, 0, currentX - startX, currentY - startY] } as Partial<Shape>;
    case 'arc':
      const arcRadius = Math.sqrt(width ** 2 + height ** 2);
      const angle = Math.atan2(currentY - startY, currentX - startX) * (180 / Math.PI);
      return { ...base, innerRadius: 0, outerRadius: arcRadius, angle: Math.abs(angle) } as Partial<Shape>;
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
        } as Partial<Shape>;
      }
      return base as Partial<Shape>;
  }
};

export const getLShapePoints = (type: ShapeType, w: number, h: number, lw: number, lh: number): number[] => {
  switch (type) {
    case 'l-shape-tl': return [0, 0, w, 0, w, lh, lw, lh, lw, h, 0, h];
    case 'l-shape-tr': return [0, 0, w, 0, w, h, w - lw, h, w - lw, lh, 0, lh];
    case 'l-shape-bl': return [0, 0, lw, 0, lw, h - lh, w, h - lh, w, h, 0, h];
    case 'l-shape-br': return [w, 0, w, h, 0, h, 0, h-lh, w-lw, h-lh, w-lw, 0];
    default: return [];
  }
};
