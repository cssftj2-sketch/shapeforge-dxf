import { Shape } from "@/types/shapes";

export const exportToSVG = (shapes: Shape[], spacing: number, slab?: Shape): string => {
  // Calculate offset for shapes if slab is included
  const shapeOffsetX = (slab && slab.type === "slab") ? (slab.width * 10) + 50 : 0; // 50mm spacing between slab and shapes
  
  // Calculate bounds to determine SVG viewBox
  let minX = 0, minY = 0, maxX = 0, maxY = 0;
  
  // Include slab dimensions if present
  if (slab && slab.type === "slab") {
    maxX = Math.max(maxX, slab.width * 10);
    maxY = Math.max(maxY, slab.height * 10);
  }
  
  // Calculate shape bounds with offset
  shapes.forEach(shape => {
    const x = shapeOffsetX; // Start shapes at offset position
    const y = 0;
    
    switch (shape.type) {
      case "rectangle":
        maxX = Math.max(maxX, x + shape.width * 10);
        maxY = Math.max(maxY, y + shape.height * 10);
        break;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        maxX = Math.max(maxX, x + shape.width * 10);
        maxY = Math.max(maxY, y + shape.height * 10);
        break;
      case "triangle":
        maxX = Math.max(maxX, x + shape.base * 10);
        maxY = Math.max(maxY, y + shape.height * 10);
        break;
      case "circle":
        maxX = Math.max(maxX, x + shape.radius * 10 * 2);
        maxY = Math.max(maxY, y + shape.radius * 10 * 2);
        break;
    }
  });
  
  const width = maxX - minX + 20; // Add padding
  const height = maxY - minY + 20;
  
  let svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`;
  svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${height}mm" viewBox="${minX - 10} ${minY - 10} ${width} ${height}">\n`;
  svg += `  <g id="shapes" fill="none" stroke="black" stroke-width="0.5">\n`;
  
  // Export slab first if included
  if (slab && slab.type === "slab") {
    svg += `    <rect id="slab" x="0" y="0" width="${slab.width * 10}" height="${slab.height * 10}" stroke="red" stroke-dasharray="5,5" />\n`;
  }
  
  // Export each shape as a separate path or element (offset from slab)
  shapes.forEach((shape, index) => {
    const x = shapeOffsetX + (shape.x * 10);
    const y = shape.y * 10;
    
    switch (shape.type) {
      case "rectangle":
        svg += `    <rect id="rect-${index}" x="${x}" y="${y}" width="${shape.width * 10}" height="${shape.height * 10}" />\n`;
        break;
        
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        const w = shape.width * 10;
        const h = shape.height * 10;
        const lw = shape.legWidth * 10;
        const lh = shape.legHeight * 10;
        let points = "";
        
        if (shape.type === "l-shape-tl") {
          // Top-left: notch in top-left corner
          points = `${x},${y} ${x + w},${y} ${x + w},${y + lh} ${x + lw},${y + lh} ${x + lw},${y + h} ${x},${y + h}`;
        } else if (shape.type === "l-shape-tr") {
          // Top-right: notch in top-right corner
          points = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x + w - lw},${y + h} ${x + w - lw},${y + lh} ${x},${y + lh}`;
        } else if (shape.type === "l-shape-bl") {
          // Bottom-left: notch in bottom-left corner
          points = `${x},${y} ${x + lw},${y} ${x + lw},${y + h - lh} ${x + w},${y + h - lh} ${x + w},${y + h} ${x},${y + h}`;
        } else if (shape.type === "l-shape-br") {
          // Bottom-right: notch in bottom-right corner
          points = `${x},${y} ${x + w},${y} ${x + w},${y + h - lh} ${x + w - lw},${y + h - lh} ${x + w - lw},${y + h} ${x},${y + h}`;
        }
        svg += `    <polygon id="lshape-${index}" points="${points}" />\n`;
        break;
        
      case "triangle":
        const triPoints = `${x + (shape.base * 10) / 2},${y} ${x + shape.base * 10},${y + shape.height * 10} ${x},${y + shape.height * 10}`;
        svg += `    <polygon id="triangle-${index}" points="${triPoints}" />\n`;
        break;
        
      case "circle":
        svg += `    <circle id="circle-${index}" cx="${x + shape.radius * 10}" cy="${y + shape.radius * 10}" r="${shape.radius * 10}" />\n`;
        break;
        
    }
  });
  
  svg += `  </g>\n`;
  svg += `</svg>`;
  
  return svg;
};

export const downloadSVG = (shapes: Shape[], spacing: number, slab?: Shape) => {
  const svgContent = exportToSVG(shapes, spacing, slab);
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marble-shapes-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
