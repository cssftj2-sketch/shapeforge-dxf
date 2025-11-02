import { ShapeType } from '../types/shapes';

export const GRID_SIZE = 10;

export const COLORS: Record<ShapeType, { fill: string; stroke: string }> = {
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
