import DxfParser from "dxf-parser";
import { Shape } from "@/types/shapes";

export const importFromDXF = (fileContent: string): { shapes: Shape[]; slab: Shape | null } => {
  const parser = new DxfParser();
  const dxf = parser.parseSync(fileContent);
  
  const shapes: Shape[] = [];
  let slab: Shape | null = null;
  let shapeCounter = 0;

  if (!dxf || !dxf.entities) {
    throw new Error("Invalid DXF file");
  }

  console.log("DXF entities found:", dxf.entities.length);

  // Process entities
  dxf.entities.forEach((entity: any) => {
    try {
      if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
        const vertices = entity.vertices || [];
        if (vertices.length < 3) return;

        // Convert from mm to cm
        const points = vertices.map((v: any) => ({
          x: (v.x || 0) / 10,
          y: (v.y || 0) / 10
        }));

        // Calculate bounding box
        const minX = Math.min(...points.map((p: any) => p.x));
        const maxX = Math.max(...points.map((p: any) => p.x));
        const minY = Math.min(...points.map((p: any) => p.y));
        const maxY = Math.max(...points.map((p: any) => p.y));
        
        const width = maxX - minX;
        const height = maxY - minY;

        // Check layer to determine if it's a slab
        const isSlab = entity.layer === "Slab" || entity.layer === "SLAB";

        // Detect if it's a slab (largest rectangle or on slab layer)
        if ((isSlab || (Math.abs(minX) < 1 && Math.abs(minY) < 1 && width > 50 && height > 50)) && !slab) {
          slab = {
            id: `slab-imported`,
            type: "slab",
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
            x: 0,
            y: 0
          };
          console.log("Slab detected:", slab);
        } else if (vertices.length === 5 && !isSlab) {
          // Rectangle (5 vertices including closing point)
          shapes.push({
            id: `shape-${Date.now()}-${shapeCounter++}`,
            type: "rectangle",
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
            x: Math.round(minX * 10) / 10,
            y: Math.round(minY * 10) / 10
          });
        } else if (vertices.length === 7 && !isSlab) {
          // Potentially an L-shape - try to detect which type
          // For now, import as rectangle
          shapes.push({
            id: `shape-${Date.now()}-${shapeCounter++}`,
            type: "rectangle",
            width: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
            x: Math.round(minX * 10) / 10,
            y: Math.round(minY * 10) / 10
          });
        } else if (vertices.length === 4 && !isSlab) {
          // Triangle (4 vertices including closing point)
          shapes.push({
            id: `shape-${Date.now()}-${shapeCounter++}`,
            type: "triangle",
            base: Math.round(width * 10) / 10,
            height: Math.round(height * 10) / 10,
            x: Math.round(minX * 10) / 10,
            y: Math.round(minY * 10) / 10
          });
        }
      } else if (entity.type === "CIRCLE") {
        const radius = (entity.radius || 0) / 10; // Convert mm to cm
        const centerX = (entity.center?.x || 0) / 10;
        const centerY = (entity.center?.y || 0) / 10;
        
        // Calculate top-left position from center
        const x = centerX - radius;
        const y = centerY - radius;
        
        shapes.push({
          id: `shape-${Date.now()}-${shapeCounter++}`,
          type: "circle",
          radius: Math.round(radius * 10) / 10,
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10
        });
      }
    } catch (error) {
      console.error("Error processing entity:", error);
    }
  });

  console.log("Imported shapes:", shapes.length);
  console.log("Shapes:", shapes);

  return { shapes, slab };
};

export const handleDXFUpload = (file: File): Promise<{ shapes: Shape[]; slab: Shape | null }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importFromDXF(content);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};
