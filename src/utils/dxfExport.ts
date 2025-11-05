import { Shape } from "@/types/shapes";

// Create DXF header with layers
function createDXFHeader(): string {
  let dxf = "";
  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1015\n"; // AutoCAD 2000
  dxf += "9\n$INSUNITS\n70\n4\n"; // Units: 4 = millimeters
  dxf += "9\n$MEASUREMENT\n70\n1\n"; // Metric
  dxf += "0\nENDSEC\n";
  
  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n4\n";
  dxf += "0\nLAYER\n2\nSlab\n70\n0\n62\n1\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nMarbleShapes\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nUnusedSpace\n70\n0\n62\n3\n6\nCONTINUOUS\n";
  dxf += "0\nLAYER\n2\nText\n70\n0\n62\n2\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n";
  dxf += "0\nENDSEC\n";
  return dxf;
}

// Export shape geometry to DXF
function exportShapeGeometry(shape: Shape, offsetX: number = 0, offsetY: number = 0): string {
  let dxf = "";
  const x = offsetX + ((shape.x || 0) * 10);
  const y = offsetY + ((shape.y || 0) * 10);
  
  switch (shape.type) {
    case "rectangle":
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
      dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n4\n70\n1\n";
      dxf += `10\n${x}\n20\n${y}\n`;
      dxf += `10\n${x + shape.base * 10}\n20\n${y}\n`;
      dxf += `10\n${x + (shape.base * 10) / 2}\n20\n${y + shape.height * 10}\n`;
      dxf += `10\n${x}\n20\n${y}\n`;
      break;
      
    case "circle":
      const centerX = x + shape.radius * 10;
      const centerY = y + shape.radius * 10;
      dxf += "0\nCIRCLE\n8\nMarbleShapes\n";
      dxf += `10\n${centerX}\n20\n${centerY}\n`;
      dxf += `40\n${shape.radius * 10}\n`;
      break;
      
    case "line":
      if (shape.nodes && shape.nodes.length > 0) {
        dxf += `0\nLWPOLYLINE\n8\nMarbleShapes\n90\n${shape.nodes.length}\n70\n0\n`;
        shape.nodes.forEach(node => {
          dxf += `10\n${(x + node.x * 10)}\n20\n${(y + node.y * 10)}\n`;
        });
      }
      break;
      
    case "arc":
      const innerR = shape.innerRadius * 10;
      const outerR = shape.outerRadius * 10;
      const arcAngle = shape.angle;
      
      const segments = Math.max(16, Math.ceil(arcAngle / 10));
      dxf += `0\nLWPOLYLINE\n8\nMarbleShapes\n90\n${segments * 2 + 2}\n70\n1\n`;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * arcAngle * Math.PI / 180;
        const px = x + Math.cos(angle) * outerR;
        const py = y + Math.sin(angle) * outerR;
        dxf += `10\n${px}\n20\n${py}\n`;
      }
      
      for (let i = segments; i >= 0; i--) {
        const angle = (i / segments) * arcAngle * Math.PI / 180;
        const px = x + Math.cos(angle) * innerR;
        const py = y + Math.sin(angle) * innerR;
        dxf += `10\n${px}\n20\n${py}\n`;
      }
      break;
  }
  
  return dxf;
}

// Export Version 1: Slab and shapes side by side
function exportDXFVersion1(shapes: Shape[], spacing: number, slab?: Shape): string {
  let dxf = createDXFHeader();
  dxf += "0\nSECTION\n2\nENTITIES\n";
  
  const shapeOffsetX = (slab && slab.type === "slab") ? (slab.width * 10) + 100 : 0;
  
  if (slab && slab.type === "slab") {
    dxf += "0\nLWPOLYLINE\n8\nSlab\n90\n5\n70\n1\n";
    dxf += `10\n0\n20\n0\n`;
    dxf += `10\n${slab.width * 10}\n20\n0\n`;
    dxf += `10\n${slab.width * 10}\n20\n${slab.height * 10}\n`;
    dxf += `10\n0\n20\n${slab.height * 10}\n`;
    dxf += `10\n0\n20\n0\n`;
  }
  
  shapes.forEach((shape) => {
    if (shape.type !== "slab") {
      dxf += exportShapeGeometry(shape, shapeOffsetX, 0);
    }
  });
  
  dxf += "0\nENDSEC\n";
  dxf += "0\nEOF\n";
  
  return dxf;
}

// Export Version 2: Optimized layout with unused space visualization
function exportDXFVersion2(slab: Shape, arrangedShapes: Shape[], spacing: number): string {
  let dxf = createDXFHeader();
  dxf += "0\nSECTION\n2\nENTITIES\n";
  
  const slabWidth = slab.type === "slab" ? slab.width * 10 : 0;
  const slabHeight = slab.type === "slab" ? slab.height * 10 : 0;
  
  // Export slab
  dxf += "0\nLWPOLYLINE\n8\nSlab\n90\n5\n70\n1\n";
  dxf += `10\n0\n20\n0\n`;
  dxf += `10\n${slabWidth}\n20\n0\n`;
  dxf += `10\n${slabWidth}\n20\n${slabHeight}\n`;
  dxf += `10\n0\n20\n${slabHeight}\n`;
  dxf += `10\n0\n20\n0\n`;
  
  // Export arranged shapes
  arrangedShapes.forEach((shape) => {
    if (shape.type !== "slab") {
      dxf += exportShapeGeometry(shape, 0, 0);
    }
  });
  
  // Calculate and visualize unused space
  const unusedRects = calculateUnusedSpace(arrangedShapes, slabWidth, slabHeight, spacing);
  unusedRects.forEach((rect, index) => {
    const rx = rect.x;
    const ry = rect.y;
    
    // Draw unused space rectangle
    dxf += "0\nLWPOLYLINE\n8\nUnusedSpace\n90\n5\n70\n1\n";
    dxf += `10\n${rx}\n20\n${ry}\n`;
    dxf += `10\n${rx + rect.width}\n20\n${ry}\n`;
    dxf += `10\n${rx + rect.width}\n20\n${ry + rect.height}\n`;
    dxf += `10\n${rx}\n20\n${ry + rect.height}\n`;
    dxf += `10\n${rx}\n20\n${ry}\n`;
    
    // Add text label in the center
    const textX = rx + rect.width / 2;
    const textY = ry + rect.height / 2;
    const textHeight = Math.min(rect.width, rect.height) / 4;
    const code = `U${index + 1}`;
    
    dxf += "0\nTEXT\n8\nText\n";
    dxf += `10\n${textX}\n20\n${textY}\n`;
    dxf += `40\n${textHeight}\n`;
    dxf += `1\n${code}\n`;
    dxf += `72\n1\n`; // Horizontal alignment: center
    dxf += `73\n2\n`; // Vertical alignment: middle
  });
  
  dxf += "0\nENDSEC\n";
  dxf += "0\nEOF\n";
  
  return dxf;
}

// Calculate unused space within the slab
function calculateUnusedSpace(shapes: Shape[], slabWidth: number, slabHeight: number, spacing: number): Array<{x: number, y: number, width: number, height: number}> {
  const minRectSize = 100; // Minimum 100mm to show unused space
  const grid: boolean[][] = [];
  const gridSize = 10; // 10mm grid resolution
  const cols = Math.ceil(slabWidth / gridSize);
  const rows = Math.ceil(slabHeight / gridSize);
  
  // Initialize grid
  for (let i = 0; i < rows; i++) {
    grid[i] = new Array(cols).fill(false);
  }
  
  // Mark occupied cells
  shapes.forEach(shape => {
    if (shape.type === "slab") return;
    
    const x = (shape.x || 0) * 10;
    const y = (shape.y || 0) * 10;
    let width = 0, height = 0;
    
    switch (shape.type) {
      case "rectangle":
        width = shape.width * 10;
        height = shape.height * 10;
        break;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        width = shape.width * 10;
        height = shape.height * 10;
        break;
      case "triangle":
        width = shape.base * 10;
        height = shape.height * 10;
        break;
      case "circle":
        width = shape.radius * 10 * 2;
        height = shape.radius * 10 * 2;
        break;
    }
    
    const startCol = Math.floor(x / gridSize);
    const endCol = Math.min(cols - 1, Math.ceil((x + width) / gridSize));
    const startRow = Math.floor(y / gridSize);
    const endRow = Math.min(rows - 1, Math.ceil((y + height) / gridSize));
    
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          grid[r][c] = true;
        }
      }
    }
  });
  
  // Find rectangular unused regions
  const unusedRects: Array<{x: number, y: number, width: number, height: number}> = [];
  const visited: boolean[][] = grid.map(row => row.map(() => false));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!grid[r][c] && !visited[r][c]) {
        // Find the largest rectangle starting from this cell
        let width = 0;
        while (c + width < cols && !grid[r][c + width] && !visited[r][c + width]) {
          width++;
        }
        
        let height = 1;
        let canExpand = true;
        while (r + height < rows && canExpand) {
          for (let w = 0; w < width; w++) {
            if (grid[r + height][c + w] || visited[r + height][c + w]) {
              canExpand = false;
              break;
            }
          }
          if (canExpand) height++;
        }
        
        const rectWidth = width * gridSize;
        const rectHeight = height * gridSize;
        
        if (rectWidth >= minRectSize && rectHeight >= minRectSize) {
          unusedRects.push({
            x: c * gridSize,
            y: r * gridSize,
            width: rectWidth,
            height: rectHeight
          });
        }
        
        // Mark as visited
        for (let rr = r; rr < r + height; rr++) {
          for (let cc = c; cc < c + width; cc++) {
            visited[rr][cc] = true;
          }
        }
      }
    }
  }
  
  return unusedRects;
}

export const exportToDXF = (shapes: Shape[], spacing: number, slab?: Shape, arrangedShapes?: Shape[]): string => {
  return exportDXFVersion1(shapes, spacing, slab);
};

export const downloadDXF = (shapes: Shape[], spacing: number, slab?: Shape, arrangedShapes?: Shape[]) => {
  const timestamp = Date.now();
  
  // Export Version 1: Slab and shapes side by side
  const dxfContentV1 = exportDXFVersion1(shapes, spacing, slab);
  const blobV1 = new Blob([dxfContentV1], { type: "application/dxf" });
  const urlV1 = URL.createObjectURL(blobV1);
  const linkV1 = document.createElement("a");
  linkV1.href = urlV1;
  linkV1.download = `marble-shapes-v1-${timestamp}.dxf`;
  document.body.appendChild(linkV1);
  linkV1.click();
  document.body.removeChild(linkV1);
  URL.revokeObjectURL(urlV1);
  
  // Export Version 2: Optimized layout with unused space codes (if arranged shapes available)
  if (slab && slab.type === "slab" && arrangedShapes && arrangedShapes.length > 0) {
    const dxfContentV2 = exportDXFVersion2(slab, arrangedShapes, spacing);
    const blobV2 = new Blob([dxfContentV2], { type: "application/dxf" });
    const urlV2 = URL.createObjectURL(blobV2);
    const linkV2 = document.createElement("a");
    linkV2.href = urlV2;
    linkV2.download = `marble-shapes-v2-optimized-${timestamp}.dxf`;
    document.body.appendChild(linkV2);
    linkV2.click();
    document.body.removeChild(linkV2);
    URL.revokeObjectURL(urlV2);
  }
};
