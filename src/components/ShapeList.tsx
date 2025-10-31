import { Shape } from "@/types/shapes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit } from "lucide-react";

interface ShapeListProps {
  shapes: Shape[];
  onRemoveShape: (id: string) => void;
  onEditShape: (shape: Shape) => void;
}

export const ShapeList = ({ shapes, onRemoveShape, onEditShape }: ShapeListProps) => {
  const getShapeDescription = (shape: Shape): string => {
    switch (shape.type) {
      case "rectangle":
        return `Rectangle: ${shape.width}×${shape.height} cm`;
      case "l-shape-tl":
        return `L-Shape (TL): ${shape.width}×${shape.height} cm`;
      case "l-shape-tr":
        return `L-Shape (TR): ${shape.width}×${shape.height} cm`;
      case "l-shape-bl":
        return `L-Shape (BL): ${shape.width}×${shape.height} cm`;
      case "l-shape-br":
        return `L-Shape (BR): ${shape.width}×${shape.height} cm`;
      case "triangle":
        return `Triangle: Base ${shape.base} cm, Height ${shape.height} cm`;
      case "circle":
        return `Circle: Radius ${shape.radius} cm`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shapes ({shapes.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {shapes.length === 0 ? (
          <p className="text-muted-foreground text-sm">No shapes added yet</p>
        ) : (
          <div className="space-y-2">
            {shapes.map((shape) => (
              <div
                key={shape.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
              >
                <span className="text-sm font-medium">{getShapeDescription(shape)}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEditShape(shape)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveShape(shape.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
