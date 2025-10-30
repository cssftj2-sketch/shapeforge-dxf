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

    // Draw shapes
    ctx.fillStyle = "hsl(var(--primary))";
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;
    shapes.forEach(shape => {
      const x = shape.x * scale;
      const y = shape.y * scale;
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
    });
  }, [slab, shapes, spacing]);
  return <div className="border rounded-lg overflow-hidden shadow-sm" style={{
    backgroundColor: "hsl(var(--canvas-bg))"
  }}>
      <canvas ref={canvasRef} className="w-full" />
    </div>;
};