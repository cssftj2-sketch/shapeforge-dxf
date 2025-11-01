import { Shape } from "@/types/shapes";

interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// Get bounding box for any shape
export const getShapeBoundingBox = (shape: Shape): BoundingBox => {
  switch (shape.type) {
    case "rectangle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
    case "l-shape-tl":
    case "l-shape-tr":
    case "l-shape-bl":
    case "l-shape-br":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
    case "triangle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.base,
        maxY: shape.y + shape.height,
      };
    case "circle":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.radius * 2,
        maxY: shape.y + shape.radius * 2,
      };
    case "slab":
      return {
        minX: shape.x,
        minY: shape.y,
        maxX: shape.x + shape.width,
        maxY: shape.y + shape.height,
      };
  }
};

// Get all points/vertices of a shape for precise collision detection
const getShapePoints = (shape: Shape): Point[] => {
  const points: Point[] = [];
  
  switch (shape.type) {
    case "rectangle":
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height }
      );
      break;
    case "l-shape-tl":
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.legHeight },
        { x: shape.x + shape.legWidth, y: shape.y + shape.legHeight },
        { x: shape.x + shape.legWidth, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height }
      );
      break;
    case "l-shape-tr":
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x + shape.width - shape.legWidth, y: shape.y + shape.height },
        { x: shape.x + shape.width - shape.legWidth, y: shape.y + shape.legHeight },
        { x: shape.x, y: shape.y + shape.legHeight }
      );
      break;
    case "l-shape-bl":
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.legWidth, y: shape.y },
        { x: shape.x + shape.legWidth, y: shape.y + shape.height - shape.legHeight },
        { x: shape.x + shape.width, y: shape.y + shape.height - shape.legHeight },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height }
      );
      break;
    case "l-shape-br":
      points.push(
        { x: shape.x, y: shape.y },
        { x: shape.x + shape.width, y: shape.y },
        { x: shape.x + shape.width, y: shape.y + shape.height },
        { x: shape.x + shape.width - shape.legWidth, y: shape.y + shape.height },
        { x: shape.x + shape.width - shape.legWidth, y: shape.y + shape.height - shape.legHeight },
        { x: shape.x, y: shape.y + shape.height - shape.legHeight }
      );
      break;
    case "triangle":
      points.push(
        { x: shape.x + shape.base / 2, y: shape.y },
        { x: shape.x + shape.base, y: shape.y + shape.height },
        { x: shape.x, y: shape.y + shape.height }
      );
      break;
    case "circle":
      // Sample circle with multiple points for collision detection
      const centerX = shape.x + shape.radius;
      const centerY = shape.y + shape.radius;
      const samples = 16;
      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;
        points.push({
          x: centerX + Math.cos(angle) * shape.radius,
          y: centerY + Math.sin(angle) * shape.radius,
        });
      }
      break;
  }
  
  return points;
};

// Point-in-polygon test using ray casting
const pointInPolygon = (point: Point, polygon: Point[]): boolean => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Check if two shapes collide/overlap
export const shapesCollide = (shape1: Shape, shape2: Shape, buffer: number = 0): boolean => {
  // First, quick bounding box check with buffer
  const box1 = getShapeBoundingBox(shape1);
  const box2 = getShapeBoundingBox(shape2);
  
  // Expand boxes by buffer amount
  box1.minX -= buffer;
  box1.minY -= buffer;
  box1.maxX += buffer;
  box1.maxY += buffer;
  
  box2.minX -= buffer;
  box2.minY -= buffer;
  box2.maxX += buffer;
  box2.maxY += buffer;
  
  // If bounding boxes don't overlap, shapes definitely don't collide
  if (box1.maxX < box2.minX || box2.maxX < box1.minX ||
      box1.maxY < box2.minY || box2.maxY < box1.minY) {
    return false;
  }
  
  // For precise collision, check if any vertex of one shape is inside the other
  const points1 = getShapePoints(shape1);
  const points2 = getShapePoints(shape2);
  
  // Check if any point of shape1 is inside shape2
  for (const point of points1) {
    if (pointInPolygon(point, points2)) {
      return true;
    }
  }
  
  // Check if any point of shape2 is inside shape1
  for (const point of points2) {
    if (pointInPolygon(point, points1)) {
      return true;
    }
  }
  
  return false;
};

// Check if shape is within slab bounds
export const shapeWithinBounds = (shape: Shape, slab: Shape, margin: number = 0): boolean => {
  const shapeBounds = getShapeBoundingBox(shape);
  const slabWidth = slab.type === "slab" ? slab.width : 80;
  const slabHeight = slab.type === "slab" ? slab.height : 60;
  
  return shapeBounds.minX >= margin &&
         shapeBounds.minY >= margin &&
         shapeBounds.maxX <= slabWidth - margin &&
         shapeBounds.maxY <= slabHeight - margin;
};

// Check if arrangement is valid (no collisions, all within bounds)
export const isValidArrangement = (shapes: Shape[], slab: Shape, spacing: number): boolean => {
  const margin = 1; // 1cm margin
  
  // Check each shape is within bounds
  for (const shape of shapes) {
    if (!shapeWithinBounds(shape, slab, margin)) {
      return false;
    }
  }
  
  // Check for collisions between all shape pairs
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      if (shapesCollide(shapes[i], shapes[j], spacing / 2)) {
        return false;
      }
    }
  }
  
  return true;
};
