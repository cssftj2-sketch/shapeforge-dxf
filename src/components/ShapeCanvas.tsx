import { useRef, useEffect } from "react";
import { Shape } from "@/types/shapes";
interface ShapeCanvasProps {
  slab: Shape;
  shapes: Shape[];
  spacing: number;
}
export const ShapeCanvas = ({
  slab,
  shapes,
  spacing
}: ShapeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = 10; // 1cm = 10px
    const slabWidth = slab.type === "slab" ? slab.width * scale : 800;
    const slabHeight = slab.type === "slab" ? slab.height * scale : 600;
    
    // Set canvas size to slab dimensions
    canvas.width = slabWidth;
    canvas.height = slabHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw slab background
    ctx.fillStyle = "hsl(var(--muted))";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "hsl(var(--grid))";
    ctx.lineWidth = 0.5;
    const gridSize = scale; // 1cm = 10px

    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // Draw slab border
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw shapes with different colors
    ctx.lineWidth = 2;
    
    const shapeColors: Record<string, { fill: string; stroke: string }> = {
      rectangle: { fill: "rgba(59, 130, 246, 0.3)", stroke: "rgb(59, 130, 246)" },
      "l-shape-tl": { fill: "rgba(139, 92, 246, 0.3)", stroke: "rgb(139, 92, 246)" },
      "l-shape-tr": { fill: "rgba(139, 92, 246, 0.3)", stroke: "rgb(139, 92, 246)" },
      "l-shape-bl": { fill: "rgba(139, 92, 246, 0.3)", stroke: "rgb(139, 92, 246)" },
      "l-shape-br": { fill: "rgba(139, 92, 246, 0.3)", stroke: "rgb(139, 92, 246)" },
      triangle: { fill: "rgba(34, 197, 94, 0.3)", stroke: "rgb(34, 197, 94)" },
      circle: { fill: "rgba(249, 115, 22, 0.3)", stroke: "rgb(249, 115, 22)" },
    };
    
    shapes.forEach(shape => {
      const x = shape.x * scale;
      const y = shape.y * scale;
      const colors = shapeColors[shape.type] || { fill: "rgba(100, 100, 100, 0.3)", stroke: "rgb(100, 100, 100)" };
      
      ctx.fillStyle = colors.fill;
      ctx.strokeStyle = colors.stroke;
      
      ctx.beginPath();
      switch (shape.type) {
        case "rectangle":
          ctx.rect(x, y, shape.width * scale, shape.height * scale);
          break;
        case "l-shape-tl":
        case "l-shape-tr":
        case "l-shape-bl":
        case "l-shape-br":
          // Draw L-shape as path
          const w = shape.width * scale;
          const h = shape.height * scale;
          const lw = shape.legWidth * scale;
          const lh = shape.legHeight * scale;
          ctx.moveTo(x, y);
          if (shape.type === "l-shape-tl") {
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + lh);
            ctx.lineTo(x + lw, y + lh);
            ctx.lineTo(x + lw, y + h);
            ctx.lineTo(x, y + h);
          } else if (shape.type === "l-shape-tr") {
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x + w - lw, y + h);
            ctx.lineTo(x + w - lw, y + lh);
            ctx.lineTo(x, y + lh);
          } else if (shape.type === "l-shape-bl") {
            ctx.lineTo(x + lw, y);
            ctx.lineTo(x + lw, y + h - lh);
            ctx.lineTo(x + w, y + h - lh);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
          } else if (shape.type === "l-shape-br") {
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w, y + h);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x, y + h - lh);
            ctx.lineTo(x + w - lw, y + h - lh);
            ctx.lineTo(x + w - lw, y);
          }
          ctx.closePath();
          break;
        case "triangle":
          ctx.moveTo(x + shape.base * scale / 2, y);
          ctx.lineTo(x + shape.base * scale, y + shape.height * scale);
          ctx.lineTo(x, y + shape.height * scale);
          ctx.closePath();
          break;
        case "circle":
          ctx.arc(x + shape.radius * scale, y + shape.radius * scale, shape.radius * scale, 0, Math.PI * 2);
          break;
        case "slab":
          ctx.rect(x, y, shape.width * scale, shape.height * scale);
          break;
      }
      ctx.fill();
      ctx.stroke();
      
      // Add measurements text
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.strokeStyle = "rgb(255, 255, 255)";
      ctx.lineWidth = 3;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      let measurementText = "";
      let centerX = x;
      let centerY = y;
      
      switch (shape.type) {
        case "rectangle":
          measurementText = `${shape.width}×${shape.height}cm`;
          centerX = x + (shape.width * scale) / 2;
          centerY = y + (shape.height * scale) / 2;
          break;
        case "l-shape-tl":
        case "l-shape-tr":
        case "l-shape-bl":
        case "l-shape-br":
          measurementText = `${shape.width}×${shape.height}cm`;
          centerX = x + (shape.width * scale) / 2;
          centerY = y + (shape.height * scale) / 2;
          break;
        case "triangle":
          measurementText = `B:${shape.base} H:${shape.height}cm`;
          centerX = x + (shape.base * scale) / 2;
          centerY = y + (shape.height * scale) / 2;
          break;
        case "circle":
          measurementText = `R:${shape.radius}cm`;
          centerX = x + shape.radius * scale;
          centerY = y + shape.radius * scale;
          break;
      }
      
      // Draw text with white outline
      ctx.strokeText(measurementText, centerX, centerY);
      ctx.fillText(measurementText, centerX, centerY);
    });
  }, [slab, shapes, spacing]);
  return <div className="border rounded-lg overflow-hidden shadow-sm" style={{
    backgroundColor: "hsl(var(--canvas-bg))"
  }}>
      <canvas ref={canvasRef} className="w-full" />
    </div>;
};