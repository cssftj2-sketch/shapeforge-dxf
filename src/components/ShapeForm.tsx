import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShapeType, Shape } from "@/types/shapes";
import { Plus } from "lucide-react";

interface ShapeFormProps {
  onAddShape: (shape: Shape) => void;
}

export const ShapeForm = ({ onAddShape }: ShapeFormProps) => {
  const [shapeType, setShapeType] = useState<ShapeType>("rectangle");
  const [dimensions, setDimensions] = useState({
    width: "",
    height: "",
    legWidth: "",
    legHeight: "",
    base: "",
    radius: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const baseShape = {
      id: crypto.randomUUID(),
      x: 0,
      y: 0,
    };

    let newShape: Shape | null = null;

    switch (shapeType) {
      case "rectangle":
        if (dimensions.width && dimensions.height) {
          newShape = {
            ...baseShape,
            type: "rectangle",
            width: parseFloat(dimensions.width),
            height: parseFloat(dimensions.height),
          };
        }
        break;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        if (dimensions.width && dimensions.height && dimensions.legWidth && dimensions.legHeight) {
          newShape = {
            ...baseShape,
            type: shapeType,
            width: parseFloat(dimensions.width),
            height: parseFloat(dimensions.height),
            legWidth: parseFloat(dimensions.legWidth),
            legHeight: parseFloat(dimensions.legHeight),
          };
        }
        break;
      case "triangle":
        if (dimensions.base && dimensions.height) {
          newShape = {
            ...baseShape,
            type: "triangle",
            base: parseFloat(dimensions.base),
            height: parseFloat(dimensions.height),
          };
        }
        break;
      case "circle":
        if (dimensions.radius) {
          newShape = {
            ...baseShape,
            type: "circle",
            radius: parseFloat(dimensions.radius),
          };
        }
        break;
      case "slab":
        if (dimensions.width && dimensions.height) {
          newShape = {
            ...baseShape,
            type: "slab",
            width: parseFloat(dimensions.width),
            height: parseFloat(dimensions.height),
          };
        }
        break;
    }

    if (newShape) {
      onAddShape(newShape);
      setDimensions({
        width: "",
        height: "",
        legWidth: "",
        legHeight: "",
        base: "",
        radius: "",
      });
    }
  };

  const renderInputs = () => {
    switch (shapeType) {
      case "rectangle":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                required
              />
            </div>
          </>
        );
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="width">Total Width (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Total Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legWidth">Leg Width (cm)</Label>
              <Input
                id="legWidth"
                type="number"
                step="0.1"
                value={dimensions.legWidth}
                onChange={(e) => setDimensions({ ...dimensions, legWidth: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legHeight">Leg Height (cm)</Label>
              <Input
                id="legHeight"
                type="number"
                step="0.1"
                value={dimensions.legHeight}
                onChange={(e) => setDimensions({ ...dimensions, legHeight: e.target.value })}
                required
              />
            </div>
          </>
        );
      case "triangle":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="base">Base (cm)</Label>
              <Input
                id="base"
                type="number"
                step="0.1"
                value={dimensions.base}
                onChange={(e) => setDimensions({ ...dimensions, base: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                required
              />
            </div>
          </>
        );
      case "circle":
        return (
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (cm)</Label>
            <Input
              id="radius"
              type="number"
              step="0.1"
              value={dimensions.radius}
              onChange={(e) => setDimensions({ ...dimensions, radius: e.target.value })}
              required
            />
          </div>
        );
      case "slab":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="width">Width (cm)</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                required
              />
            </div>
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Marble Shape</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shapeType">Shape Type</Label>
            <Select value={shapeType} onValueChange={(value) => setShapeType(value as ShapeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="l-shape-tl">L-Shape (Top-Left)</SelectItem>
                <SelectItem value="l-shape-tr">L-Shape (Top-Right)</SelectItem>
                <SelectItem value="l-shape-bl">L-Shape (Bottom-Left)</SelectItem>
                <SelectItem value="l-shape-br">L-Shape (Bottom-Right)</SelectItem>
                <SelectItem value="triangle">Triangle</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="slab">Slab</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {renderInputs()}

          <Button type="submit" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Shape
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
