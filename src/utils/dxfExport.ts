import { Shape } from "@/types/shapes";

export const exportToDXF = (shapes: Shape[], spacing: number): string => {
  let dxf = "";
  
  // DXF Header
  dxf += "0\nSECTION\n2\nHEADER\n";
  dxf += "9\n$ACADVER\n1\nAC1015\n"; // AutoCAD 2000
  dxf += "0\nENDSEC\n";
  
  // Tables Section
  dxf += "0\nSECTION\n2\nTABLES\n";
  dxf += "0\nTABLE\n2\nLAYER\n70\n1\n";
  dxf += "0\nLAYER\n2\nMarbleShapes\n70\n0\n62\n7\n6\nCONTINUOUS\n";
  dxf += "0\nENDTAB\n";
  dxf += "0\nENDSEC\n";
  
  // Entities Section
  dxf += "0\nSECTION\n2\nENTITIES\n";
  
  shapes.forEach((shape) => {
    const x = shape.x * 10; // Convert cm to mm
    const y = shape.y * 10;
    
    switch (shape.type) {
      case "rectangle":
        // Rectangle as POLYLINE
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
          dxf += `10\n${x + w}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y + h}\n`;
          dxf += `10\n${x}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y + h - lh}\n`;
          dxf += `10\n${x + w - lw}\n20\n${y}\n`;
        }
        break;
        
      case "triangle":
        dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n4\n70\n1\n";
        dxf += `10\n${x + (shape.base * 10) / 2}\n20\n${y}\n`;
        dxf += `10\n${x + shape.base * 10}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x + (shape.base * 10) / 2}\n20\n${y}\n`;
        break;
        
      case "circle":
        dxf += "0\nCIRCLE\n8\nMarbleShapes\n";
        dxf += `10\n${x + shape.radius * 10}\n20\n${y + shape.radius * 10}\n`;
        dxf += `40\n${shape.radius * 10}\n`;
        break;
        
      case "slab":
        // Slab as POLYLINE
        dxf += "0\nLWPOLYLINE\n8\nMarbleShapes\n90\n5\n70\n1\n";
        dxf += `10\n${x}\n20\n${y}\n`;
        dxf += `10\n${x + shape.width * 10}\n20\n${y}\n`;
        dxf += `10\n${x + shape.width * 10}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x}\n20\n${y + shape.height * 10}\n`;
        dxf += `10\n${x}\n20\n${y}\n`;
        break;
    }
  });
  
  dxf += "0\nENDSEC\n";
  dxf += "0\nEOF\n";
  
  return dxf;
};

export const downloadDXF = (shapes: Shape[], spacing: number) => {
  const dxfContent = exportToDXF(shapes, spacing);
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
