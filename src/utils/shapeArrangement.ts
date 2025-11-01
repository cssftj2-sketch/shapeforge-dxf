import { Shape } from "@/types/shapes";
import { MaxRectsPacker, Rectangle } from "maxrects-packer";

const getShapeBounds = (shape: Shape): { width: number; height: number } => {
  switch (shape.type) {
    case "rectangle":
      return { width: shape.width, height: shape.height };
    case "l-shape-tl":
    case "l-shape-tr":
    case "l-shape-bl":
    case "l-shape-br":
      return { width: shape.width, height: shape.height };
    case "triangle":
      return { width: shape.base, height: shape.height };
    case "circle":
      return { width: shape.radius * 2, height: shape.radius * 2 };
    case "slab":
      return { width: shape.width, height: shape.height };
  }
};

interface PackableShape extends Rectangle {
  shapeData: Shape;
}

export const arrangeShapes = (shapes: Shape[], spacing: number, slab: Shape): Shape[] => {
  if (shapes.length === 0) return shapes;

  const slabWidth = slab.type === "slab" ? slab.width : 80;
  const slabHeight = slab.type === "slab" ? slab.height : 60;
  const margin = 1; // 1cm margin from edges
  const minSpacing = Math.max(spacing, 0.5); // Ensure minimum 0.5cm spacing

  // Calculate usable area
  const usableWidth = slabWidth - (margin * 2);
  const usableHeight = slabHeight - (margin * 2);

  // Initialize MaxRects packer with slab dimensions
  // Using MaxRects algorithm for optimal bin packing
  const packer = new MaxRectsPacker<PackableShape>(
    usableWidth,
    usableHeight,
    minSpacing, // padding between shapes
    {
      smart: true, // Enable intelligent packing
      pot: false, // Don't force power of 2
      square: false, // Don't force square bins
      allowRotation: true, // Allow 90-degree rotation for better fit
      tag: false,
      border: 0
    }
  );

  // Convert shapes to packable rectangles
  const packableShapes: PackableShape[] = shapes.map((shape) => {
    const bounds = getShapeBounds(shape);
    const rect = new Rectangle(bounds.width, bounds.height) as PackableShape;
    rect.shapeData = shape;
    return rect;
  });

  // Sort shapes by area (largest first) for better packing efficiency
  packableShapes.sort((a, b) => (b.width * b.height) - (a.width * a.height));

  // Pack the shapes using MaxRects algorithm
  packer.addArray(packableShapes);

  // Extract arranged shapes from packed bins
  const arranged: Shape[] = [];
  
  packer.bins.forEach((bin) => {
    bin.rects.forEach((rect: PackableShape) => {
      const packedShape = rect.shapeData;
      const bounds = getShapeBounds(packedShape);
      
      // Check if shape was rotated by the packer
      const wasRotated = rect.rot !== undefined && rect.rot;
      
      // Apply margin offset and handle rotation
      let finalShape: Shape;
      if (wasRotated && canRotateShape(packedShape)) {
        // Shape was rotated 90 degrees - swap dimensions
        finalShape = rotateShape(packedShape, rect.x + margin, rect.y + margin);
      } else {
        finalShape = {
          ...packedShape,
          x: rect.x + margin,
          y: rect.y + margin,
        };
      }
      
      arranged.push(finalShape);
    });
  });

  // Warn if not all shapes fit
  if (arranged.length < shapes.length) {
    console.warn(`Only ${arranged.length} of ${shapes.length} shapes fit in the slab. Consider a larger slab.`);
  }

  return arranged;
};

// Helper function to check if a shape can be rotated
const canRotateShape = (shape: Shape): boolean => {
  // Circles don't need rotation, and L-shapes are complex to rotate
  return shape.type === "rectangle" || shape.type === "triangle";
};

// Helper function to rotate a shape 90 degrees
const rotateShape = (shape: Shape, x: number, y: number): Shape => {
  switch (shape.type) {
    case "rectangle":
      return {
        ...shape,
        x,
        y,
        width: shape.height,
        height: shape.width,
      };
    case "triangle":
      return {
        ...shape,
        x,
        y,
        base: shape.height,
        height: shape.base,
      };
    default:
      return { ...shape, x, y };
  }
};
