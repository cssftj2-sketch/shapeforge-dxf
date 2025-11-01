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
  const margin = 1; // 1cm margin from edges
  const minSpacing = Math.max(spacing, 0.5); // Ensure minimum 0.5cm spacing
  
  let currentX = margin;
  let currentY = margin;
  let maxHeightInRow = 0;
  const maxWidth = slabWidth - margin; // Maximum width before wrapping

  shapes.forEach((shape) => {
    const bounds = getShapeBounds(shape);
    
    // Check if shape fits in current row (with spacing buffer)
    if (currentX + bounds.width + margin > maxWidth && arranged.length > 0) {
      // Move to next row with proper spacing
      currentX = margin;
      currentY += maxHeightInRow + minSpacing;
      maxHeightInRow = 0;
    }

    // Check if we exceed slab height
    if (currentY + bounds.height + margin > slabHeight) {
      console.warn(`Shape exceeds slab height at Y: ${currentY}. Consider larger slab or fewer shapes.`);
    }

    // Place shape with exact positioning
    arranged.push({
      ...shape,
      x: currentX,
      y: currentY,
    });

    // Update position for next shape with guaranteed spacing
    currentX += bounds.width + minSpacing;
    maxHeightInRow = Math.max(maxHeightInRow, bounds.height);
  });

  return arranged;
};
