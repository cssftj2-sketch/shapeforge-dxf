import { Shape } from "@/types/shapes";

export const exportToDXF = (shapes: Shape[], spacing: number, slab?: Shape): string => {
  let dxf = "";
  
  // DXF Header - DeepNest compatible
  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1015\n"; // AutoCAD 2000
  dxf += "9\n$INSUNITS\n70\n4\n"; // Units: 4 = millimeters
  dxf += "9\n$MEASUREMENT\n70\n1\n"; // Metric
  dxf += "0\nENDSEC\n";
  
  // Tables Section
  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n2\n";
  dxf += "0\nLAYER\n2\nSlab\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nMarbleShapes\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n";
  dxf += "0\nENDSEC\n";
  
  // Entities Section
  dxf += "0\nSECTION\n2\nENTITIES\n";
  
  // Export slab first if it exists (at origin)
  if (slab && slab.type === "slab") {
    dxf += "0\nLWPOLYLINE\n8\nSlab\n90\n5\n70\n1\n";
    dxf += `10\n0\n20\n0\n`;
    dxf += `10\n${slab.width * 10}\n20\n0\n`;
    dxf += `10\n${slab.width * 10}\n20\n${slab.height * 10}\n`;
    dxf += `10\n0\n20\n${slab.height * 10}\n`;
    dxf += `10\n0\n20\n0\n`;
  }
  
  shapes.forEach((shape, index) => {
    // Use the actual shape position from the canvas
    const x = (shape.x || 0) * 10;
    const y = (shape.y || 0) * 10;
    
    switch (shape.type) {
      case "rectangle":
        // Rectangle as closed POLYLINE
        dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n5\n70\n1\n";
        dxf += `10\n${x}\n20\n${y}\n`;
        dxf += `10\n${x + shape.width * 10}\n20\n${y}\n`;
        dxf += `10\n${x + shape.width * 10}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x}\n20\n${y}\n`;
        break;
        
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        const w = shape.width * 10;
        const h = shape.height * 10;
        const lw = shape.legWidth * 10;
        const lh = shape.legHeight * 10;
        
        dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n7\n70\n1\n";
        
        if (shape.type === "l-shape-tl") {
          dxf += `10\n${x}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y + lh}\n`;
          dxf += `10\n${x + lw}\n20\n${y + lh}\n`;
          dxf += `10\n${x + lw}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y}\n`;
        } else if (shape.type === "l-shape-tr") {
          dxf += `10\n${x}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y + h}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y + h}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y + lh}\n`;
          dxf += `10\n${x}\n20\n${y + lh}\n`;
          dxf += `10\n${x}\n20\n${y}\n`;
        } else if (shape.type === "l-shape-bl") {
          dxf += `10\n${x}\n20\n${y}\n`;
          dxf += `10\n${x + lw}\n20\n${y}\n`;
          dxf += `10\n${x + lw}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y}\n`;
        } else if (shape.type === "l-shape-br") {
          dxf += `10\n${x}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y}\n`;
          dxf += `10\n${x + w}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y}\n`;
        }
        break;
        
      case "triangle":
        // Triangle with proper vertices (isosceles triangle pointing up)
        dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n4\n70\n1\n";
        // Bottom left vertex
        dxf += `10\n${x}\n20\n${y}\n`;
        // Bottom right vertex
        dxf += `10\n${x + shape.base * 10}\n20\n${y}\n`;
        // Top vertex (centered)
        dxf += `10\n${x + (shape.base * 10) / 2}\n20\n${y + shape.height * 10}\n`;
        // Close the triangle back to bottom left
        dxf += `10\n${x}\n20\n${y}\n`;
        break;
        
      case "circle":
        // Circle with center point and radius
        const centerX = x + shape.radius * 10;
        const centerY = y + shape.radius * 10;
        dxf += "0\nCIRCLE\n8\nMarbleShapes\n";
        dxf += `10\n${centerX}\n20\n${centerY}\n`;
        dxf += `40\n${shape.radius * 10}\n`;
        break;
        
      case "line":
        // Line as LWPOLYLINE (open path)
        if (shape.nodes && shape.nodes.length > 0) {
          dxf += `0\nLWPOLYLINE\n8\nMarbleShapes\n90\n${shape.nodes.length}\n70\n0\n`;
          shape.nodes.forEach(node => {
            dxf += `10\n${(x + node.x * 10)}\n20\n${(y + node.y * 10)}\n`;
          });
        }
        break;
        
      case "arc":
        // Arc as two concentric arcs forming a curved band
        const innerR = shape.innerRadius * 10;
        const outerR = shape.outerRadius * 10;
        const arcAngle = shape.angle;
        
        // Calculate arc points (outer arc)
        const segments = Math.max(16, Math.ceil(arcAngle / 10));
        dxf += `0\nLWPOLYLINE\n8\nMarbleShapes\n90\n${segments * 2 + 2}\n70\n1\n`;
        
        // Outer arc points
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * arcAngle * Math.PI / 180;
          const px = x + Math.cos(angle) * outerR;
          const py = y + Math.sin(angle) * outerR;
          dxf += `10\n${px}\n20\n${py}\n`;
        }
        
        // Inner arc points (reverse direction)
        for (let i = segments; i >= 0; i--) {
          const angle = (i / segments) * arcAngle * Math.PI / 180;
          const px = x + Math.cos(angle) * innerR;
          const py = y + Math.sin(angle) * innerR;
          dxf += `10\n${px}\n20\n${py}\n`;
        }
        break;
        
      case "slab":
        // Skip - slab is already exported separately
        break;
    }
  });
  
  dxf += "0\nENDSEC\n";
  dxf += "0\nEOF\n";
  
  return dxf;
};

export const downloadDXF = (shapes: Shape[], spacing: number, slab?: Shape) => {
  const dxfContent = exportToDXF(shapes, spacing, slab);
  const blob = new Blob([dxfContent], { type: "application/dxf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `marble-shapes-${Date.now()}.dxf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
