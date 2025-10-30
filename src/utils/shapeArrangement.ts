import { Shape } from "@/types/shapes";

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

export const arrangeShapes = (shapes: Shape[], spacing: number, slab: Shape): Shape[] => {
  if (shapes.length === 0) return shapes;

  const slabWidth = slab.type === "slab" ? slab.width : 80;
  const slabHeight = slab.type === "slab" ? slab.height : 60;

  const arranged: Shape[] = [];
  let currentX = 1; // Start 1cm from edge
  let currentY = 1;
  let maxHeightInRow = 0;
  const maxWidth = slabWidth - 1; // Maximum width before wrapping (slab width - 1cm margin)

  shapes.forEach((shape) => {
    const bounds = getShapeBounds(shape);
    
    // Check if shape fits in current row
    if (currentX + bounds.width > maxWidth && arranged.length > 0) {
      // Move to next row
      currentX = 1;
      currentY += maxHeightInRow + spacing;
      maxHeightInRow = 0;
    }

    // Place shape
    arranged.push({
      ...shape,
      x: currentX,
      y: currentY,
    });

    // Update position for next shape
    currentX += bounds.width + spacing;
    maxHeightInRow = Math.max(maxHeightInRow, bounds.height);
  });

  return arranged;
};
