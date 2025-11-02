import { Shape } from "@/types/shapes";
import { MaxRectsPacker, Rectangle } from "maxrects-packer";
import { isValidArrangement, shapesCollide } from "./collisionDetection";

interface PackableShape extends Rectangle {
  shapeData: Shape;
}

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

const canRotateShape = (shape: Shape): boolean => {
  return shape.type === "rectangle" || shape.type === "triangle";
};

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

interface OptimizationResult {
  shapes: Shape[];
  efficiency: number;
  usedArea: number;
  totalArea: number;
  iteration: number;
}

// Calculate efficiency (percentage of slab used)
const calculateEfficiency = (shapes: Shape[], slab: Shape): number => {
  const totalShapeArea = shapes.reduce((sum, shape) => {
    const bounds = getShapeBounds(shape);
    return sum + (bounds.width * bounds.height);
  }, 0);
  
  const slabArea = slab.type === "slab" ? slab.width * slab.height : 4800;
  return (totalShapeArea / slabArea) * 100;
};

// State-of-the-art sorting strategies for optimization
const sortingStrategies = [
  { name: "area-desc", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    return (bB.width * bB.height) - (aB.width * aB.height);
  }},
  { name: "area-asc", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    return (aB.width * aB.height) - (bB.width * bB.height);
  }},
  { name: "width-desc", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    return bB.width - aB.width;
  }},
  { name: "height-desc", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    return bB.height - aB.height;
  }},
  { name: "perimeter-desc", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    return (2 * (bB.width + bB.height)) - (2 * (aB.width + aB.height));
  }},
  { name: "aspect-ratio", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    const ratioA = Math.max(aB.width, aB.height) / Math.min(aB.width, aB.height);
    const ratioB = Math.max(bB.width, bB.height) / Math.min(bB.width, bB.height);
    return ratioB - ratioA;
  }},
  { name: "mixed-strategy", fn: (a: Shape, b: Shape) => {
    const aB = getShapeBounds(a);
    const bB = getShapeBounds(b);
    // Combine area and perimeter for balanced optimization
    const scoreA = (aB.width * aB.height) + (aB.width + aB.height);
    const scoreB = (bB.width * bB.height) + (bB.width + bB.height);
    return scoreB - scoreA;
  }},
];

export const optimizeNesting = async (
  shapes: Shape[],
  spacing: number,
  slab: Shape,
  onProgress?: (progress: number, bestSoFar: OptimizationResult) => void
): Promise<OptimizationResult> => {
  if (shapes.length === 0) {
    return {
      shapes: [],
      efficiency: 0,
      usedArea: 0,
      totalArea: slab.type === "slab" ? slab.width * slab.height : 4800,
      iteration: 0,
    };
  }

  const slabWidth = slab.type === "slab" ? slab.width : 80;
  const slabHeight = slab.type === "slab" ? slab.height : 60;
  const margin = 1;
  const minSpacing = Math.max(spacing, 0.5);

  const usableWidth = slabWidth - (margin * 2);
  const usableHeight = slabHeight - (margin * 2);

  let bestResult: OptimizationResult = {
    shapes: [],
    efficiency: 0,
    usedArea: 0,
    totalArea: slabWidth * slabHeight,
    iteration: 0,
  };

  const totalIterations = sortingStrategies.length * 2; // with and without rotation
  let currentIteration = 0;

  // Try different sorting strategies
  for (const strategy of sortingStrategies) {
    // Try with and without rotation
    for (const allowRotation of [true, false]) {
      currentIteration++;
      
      const sortedShapes = [...shapes].sort(strategy.fn);
      
      const packer = new MaxRectsPacker<PackableShape>(
        usableWidth,
        usableHeight,
        minSpacing,
        {
          smart: true,
          pot: false,
          square: false,
          allowRotation: allowRotation,
          tag: false,
          border: 0
        }
      );

      const packableShapes: PackableShape[] = sortedShapes.map((shape) => {
        const bounds = getShapeBounds(shape);
        const rect = new Rectangle(bounds.width, bounds.height) as PackableShape;
        rect.shapeData = shape;
        return rect;
      });

      packer.addArray(packableShapes);

      const arranged: Shape[] = [];
      
      packer.bins.forEach((bin) => {
        bin.rects.forEach((rect: PackableShape) => {
          const packedShape = rect.shapeData;
          const wasRotated = rect.rot !== undefined && rect.rot;
          
          let finalShape: Shape;
          if (wasRotated && canRotateShape(packedShape)) {
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

      // Validate arrangement for collisions
      const isValid = isValidArrangement(arranged, slab, minSpacing);
      
      if (isValid && arranged.length > 0) {
        const efficiency = calculateEfficiency(arranged, slab);
        const usedArea = arranged.reduce((sum, shape) => {
          const bounds = getShapeBounds(shape);
          return sum + (bounds.width * bounds.height);
        }, 0);

        // Update best result if this is better
        if (arranged.length > bestResult.shapes.length ||
            (arranged.length === bestResult.shapes.length && efficiency > bestResult.efficiency)) {
          bestResult = {
            shapes: arranged,
            efficiency,
            usedArea,
            totalArea: slabWidth * slabHeight,
            iteration: currentIteration,
          };
        }
      }

      // Report progress
      if (onProgress) {
        const progress = (currentIteration / totalIterations) * 100;
        onProgress(progress, bestResult);
      }

      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  return bestResult;
};
