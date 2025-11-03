import { Shape } from "@/types/shapes";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Square, Circle as CircleIcon, Triangle as TriangleIcon, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ShapeListProps {
  shapes: Shape[];
  onRemoveShape: (id: string) => void;
  onEditShape: (shape: Shape) => void;
}

export const ShapeList = ({ shapes, onRemoveShape, onEditShape }: ShapeListProps) => {
  const getShapeIcon = (type: Shape['type']) => {
    switch (type) {
      case 'rectangle':
        return <Square className="h-4 w-4" />;
      case 'circle':
        return <CircleIcon className="h-4 w-4" />;
      case 'triangle':
        return <TriangleIcon className="h-4 w-4" />;
      case 'l-shape-tl':
      case 'l-shape-tr':
      case 'l-shape-bl':
      case 'l-shape-br':
        return <Layers className="h-4 w-4" />;
      default:
        return <Square className="h-4 w-4" />;
    }
  };

  const getShapeColor = (type: Shape['type']) => {
    const colors: Record<Shape['type'], string> = {
      rectangle: 'text-blue-400',
      circle: 'text-orange-400',
      triangle: 'text-green-400',
      'l-shape-tl': 'text-purple-400',
      'l-shape-tr': 'text-purple-400',
      'l-shape-bl': 'text-purple-400',
      'l-shape-br': 'text-purple-400',
      line: 'text-gray-400',
      arc: 'text-pink-400',
      slab: 'text-primary'
    };
    return colors[type] || 'text-gray-400';
  };

  const getShapeDescription = (shape: Shape): string => {
    switch (shape.type) {
      case "rectangle":
        return `${shape.width.toFixed(1)} × ${shape.height.toFixed(1)} cm`;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        return `${shape.width.toFixed(1)} × ${shape.height.toFixed(1)} cm`;
      case "triangle":
        return `Base: ${shape.base.toFixed(1)} cm, H: ${shape.height.toFixed(1)} cm`;
      case "circle":
        return `Ø ${(shape.radius * 2).toFixed(1)} cm (R: ${shape.radius.toFixed(1)})`;
      default:
        return "";
    }
  };

  const getShapeArea = (shape: Shape): number => {
    switch (shape.type) {
      case "rectangle":
        return shape.width * shape.height;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        return (shape.width * shape.height) - ((shape.width - shape.legWidth) * (shape.height - shape.legHeight));
      case "triangle":
        return (shape.base * shape.height) / 2;
      case "circle":
        return Math.PI * shape.radius * shape.radius;
      default:
        return 0;
    }
  };

  const getShapeName = (type: Shape['type']): string => {
    const names: Record<Shape['type'], string> = {
      rectangle: "Rectangle",
      circle: "Circle",
      triangle: "Triangle",
      'l-shape-tl': "L-Shape TL",
      'l-shape-tr': "L-Shape TR",
      'l-shape-bl': "L-Shape BL",
      'l-shape-br': "L-Shape BR",
      line: "Line",
      arc: "Arc",
      slab: "Slab"
    };
    return names[type] || "Shape";
  };

  if (shapes.length === 0) {
    return (
      <div className="text-center p-8 glass-panel rounded-lg">
        <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-caption">No shapes added yet</p>
        <p className="text-micro mt-1">Add shapes above to begin</p>
      </div>
    );
  }

  // Calculate total area
  const totalArea = shapes.reduce((sum, shape) => sum + getShapeArea(shape), 0);

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="metric-display">
          <div className="metric-value text-xl text-primary">{shapes.length}</div>
          <div className="metric-label">Total Shapes</div>
        </div>
        <div className="metric-display">
          <div className="metric-value text-xl text-primary">{totalArea.toFixed(0)}</div>
          <div className="metric-label">Total Area cm²</div>
        </div>
      </div>

      {/* Shape List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
        {shapes.map((shape, index) => (
          <div
            key={shape.id}
            className="group shape-preview p-3 rounded-lg glass-panel hover:glass-elevated transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Shape Icon with Color */}
                <div className={`p-2 rounded-lg bg-background/50 ${getShapeColor(shape.type)} flex-shrink-0 transition-colors`}>
                  {getShapeIcon(shape.type)}
                </div>
                
                {/* Shape Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-body font-semibold truncate">
                      {getShapeName(shape.type)}
                    </h4>
                    <span className="text-caption text-muted-foreground flex-shrink-0">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-caption text-muted-foreground truncate mb-2">
                    {getShapeDescription(shape)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-micro text-muted-foreground whitespace-nowrap">
                      Area: {getShapeArea(shape).toFixed(1)} cm²
                    </span>
                    <span className="text-micro text-muted-foreground whitespace-nowrap">
                      Pos: ({shape.x.toFixed(1)}, {shape.y.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Always visible on mobile, hover on desktop */}
              <div className="flex gap-1 flex-shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditShape(shape)}
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="tooltip">
                    <p>Edit shape</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveShape(shape.id)}
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="tooltip">
                    <p>Delete shape</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
