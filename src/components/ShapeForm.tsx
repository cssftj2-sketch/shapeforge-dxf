import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShapeType, Shape } from "@/types/shapes";
import { Plus, X, Edit3, Ruler, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShapePalette } from "@/components/ShapePalette";

interface ShapeFormProps {
  onAddShape: (shape: Shape) => void;
  editingShape?: Shape | null;
  onCancelEdit?: () => void;
  slab?: Shape | null;
}

export const ShapeForm = ({ onAddShape, editingShape, onCancelEdit, slab }: ShapeFormProps) => {
  const [shapeType, setShapeType] = useState<ShapeType>("rectangle");
  const [dimensions, setDimensions] = useState({
    width: "",
    height: "",
    legWidth: "",
    legHeight: "",
    base: "",
    radius: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingShape) {
      setShapeType(editingShape.type);
      
      const newDimensions: any = {
        width: "",
        height: "",
        legWidth: "",
        legHeight: "",
        base: "",
        radius: "",
      };
      
      if ("width" in editingShape) newDimensions.width = editingShape.width.toString();
      if ("height" in editingShape) newDimensions.height = editingShape.height.toString();
      if ("radius" in editingShape) newDimensions.radius = editingShape.radius.toString();
      if ("base" in editingShape) newDimensions.base = editingShape.base.toString();
      if ("legWidth" in editingShape) newDimensions.legWidth = editingShape.legWidth.toString();
      if ("legHeight" in editingShape) newDimensions.legHeight = editingShape.legHeight.toString();
      
      setDimensions(newDimensions);
    }
  }, [editingShape]);

  const validateDimension = (value: string, fieldName: string, min = 0.1, max = 1000): boolean => {
    const num = parseFloat(value);
    if (isNaN(num)) {
      setErrors(prev => ({ ...prev, [fieldName]: "Must be a number" }));
      return false;
    }
    if (num < min) {
      setErrors(prev => ({ ...prev, [fieldName]: `Minimum ${min} cm` }));
      return false;
    }
    if (num > max) {
      setErrors(prev => ({ ...prev, [fieldName]: `Maximum ${max} cm` }));
      return false;
    }
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Calculate smart positioning for new shapes
    const getSmartPosition = (shapeWidth: number, shapeHeight: number) => {
      if (editingShape) {
        return { x: editingShape.x, y: editingShape.y };
      }
      
      const slabWidth = slab?.type === 'slab' ? slab.width : 80;
      const slabHeight = slab?.type === 'slab' ? slab.height : 60;
      
      // Center the shape in the slab with some random offset
      const randomOffsetX = (Math.random() - 0.5) * 10;
      const randomOffsetY = (Math.random() - 0.5) * 10;
      
      const centerX = Math.max(0, Math.min(slabWidth - shapeWidth, (slabWidth - shapeWidth) / 2 + randomOffsetX));
      const centerY = Math.max(0, Math.min(slabHeight - shapeHeight, (slabHeight - shapeHeight) / 2 + randomOffsetY));
      
      return { x: Math.round(centerX * 10) / 10, y: Math.round(centerY * 10) / 10 };
    };
    
    const baseShape = {
      id: editingShape?.id || crypto.randomUUID(),
      x: 0,
      y: 0,
    };

    let newShape: Shape | null = null;
    let isValid = true;

    switch (shapeType) {
      case "rectangle":
        isValid = validateDimension(dimensions.width, "width") && 
                  validateDimension(dimensions.height, "height");
        if (dimensions.width && dimensions.height && isValid) {
          const width = parseFloat(dimensions.width);
          const height = parseFloat(dimensions.height);
          const pos = getSmartPosition(width, height);
          newShape = {
            ...baseShape,
            type: "rectangle",
            x: pos.x,
            y: pos.y,
            width,
            height,
          };
        }
        break;
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        isValid = validateDimension(dimensions.width, "width") && 
                  validateDimension(dimensions.height, "height") &&
                  validateDimension(dimensions.legWidth, "legWidth") &&
                  validateDimension(dimensions.legHeight, "legHeight");
        
        if (isValid && dimensions.width && dimensions.height && dimensions.legWidth && dimensions.legHeight) {
          const w = parseFloat(dimensions.width);
          const h = parseFloat(dimensions.height);
          const lw = parseFloat(dimensions.legWidth);
          const lh = parseFloat(dimensions.legHeight);
          
          // Validate leg dimensions don't exceed total dimensions
          if (lw > w) {
            setErrors(prev => ({ ...prev, legWidth: "Leg width cannot exceed total width" }));
            isValid = false;
          }
          if (lh > h) {
            setErrors(prev => ({ ...prev, legHeight: "Leg height cannot exceed total height" }));
            isValid = false;
          }
          
          if (isValid) {
            const pos = getSmartPosition(w, h);
            newShape = {
              ...baseShape,
              type: shapeType,
              x: pos.x,
              y: pos.y,
              width: w,
              height: h,
              legWidth: lw,
              legHeight: lh,
            };
          }
        }
        break;
      case "triangle":
        isValid = validateDimension(dimensions.base, "base") && 
                  validateDimension(dimensions.height, "height");
        if (dimensions.base && dimensions.height && isValid) {
          const base = parseFloat(dimensions.base);
          const height = parseFloat(dimensions.height);
          const pos = getSmartPosition(base, height);
          newShape = {
            ...baseShape,
            type: "triangle",
            x: pos.x,
            y: pos.y,
            base,
            height,
          };
        }
        break;
      case "circle":
        isValid = validateDimension(dimensions.radius, "radius");
        if (dimensions.radius && isValid) {
          const radius = parseFloat(dimensions.radius);
          const diameter = radius * 2;
          const pos = getSmartPosition(diameter, diameter);
          newShape = {
            ...baseShape,
            type: "circle",
            x: pos.x,
            y: pos.y,
            radius,
          };
        }
        break;
      case "slab":
        isValid = validateDimension(dimensions.width, "width", 10, 500) && 
                  validateDimension(dimensions.height, "height", 10, 500);
        if (dimensions.width && dimensions.height && isValid) {
          newShape = {
            ...baseShape,
            type: "slab",
            width: parseFloat(dimensions.width),
            height: parseFloat(dimensions.height),
          };
        }
        break;
    }

    if (newShape && isValid) {
      onAddShape(newShape);
      
      // Reset form only if not editing
      if (!editingShape) {
        setDimensions({
          width: "",
          height: "",
          legWidth: "",
          legHeight: "",
          base: "",
          radius: "",
        });
      }
    }
  };

  const getShapeIcon = (type: ShapeType) => {
    const icons: Record<ShapeType, string> = {
      rectangle: "▭",
      "l-shape-tl": "⌐",
      "l-shape-tr": "¬",
      "l-shape-bl": "⌊",
      "l-shape-br": "⌋",
      triangle: "△",
      circle: "○",
      line: "⟍",
      arc: "⌒",
      slab: "▢"
    };
    return icons[type] || "▭";
  };

  const getShapeDescription = (type: ShapeType) => {
    const descriptions: Record<ShapeType, string> = {
      rectangle: "Standard rectangular cut",
      "l-shape-tl": "L-shape with notch in top-left",
      "l-shape-tr": "L-shape with notch in top-right",
      "l-shape-bl": "L-shape with notch in bottom-left",
      "l-shape-br": "L-shape with notch in bottom-right",
      triangle: "Triangular cut piece",
      circle: "Circular cut piece",
      line: "Line segment",
      arc: "Arc segment",
      slab: "Define workspace dimensions"
    };
    return descriptions[type] || "";
  };

  const renderInputs = () => {
    switch (shapeType) {
      case "rectangle":
        return (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="width" className="text-body font-medium flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" />
                  Width (cm)
                </Label>
                {dimensions.width && (
                  <span className="text-caption text-primary">{dimensions.width} cm</span>
                )}
              </div>
              <Input
                id="width"
                type="number"
                step="0.1"
                min="0.1"
                max="1000"
                value={dimensions.width}
                onChange={(e) => {
                  setDimensions({ ...dimensions, width: e.target.value });
                  validateDimension(e.target.value, "width");
                }}
                className={`glass-card ${errors.width ? 'border-destructive' : ''}`}
                placeholder="Enter width..."
                required
              />
              {errors.width && <p className="text-xs text-destructive">{errors.width}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="height" className="text-body font-medium flex items-center gap-1">
                  <Ruler className="h-3.5 w-3.5" />
                  Height (cm)
                </Label>
                {dimensions.height && (
                  <span className="text-caption text-primary">{dimensions.height} cm</span>
                )}
              </div>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0.1"
                max="1000"
                value={dimensions.height}
                onChange={(e) => {
                  setDimensions({ ...dimensions, height: e.target.value });
                  validateDimension(e.target.value, "height");
                }}
                className={`glass-card ${errors.height ? 'border-destructive' : ''}`}
                placeholder="Enter height..."
                required
              />
              {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
            </div>
          </>
        );
      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-caption font-medium">Total Width</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={dimensions.width}
                  onChange={(e) => {
                    setDimensions({ ...dimensions, width: e.target.value });
                    validateDimension(e.target.value, "width");
                  }}
                  className={`glass-card ${errors.width ? 'border-destructive' : ''}`}
                  required
                />
                {errors.width && <p className="text-xs text-destructive">{errors.width}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-caption font-medium">Total Height</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={dimensions.height}
                  onChange={(e) => {
                    setDimensions({ ...dimensions, height: e.target.value });
                    validateDimension(e.target.value, "height");
                  }}
                  className={`glass-card ${errors.height ? 'border-destructive' : ''}`}
                  required
                />
                {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="legWidth" className="text-caption font-medium">Leg Width</Label>
                <Input
                  id="legWidth"
                  type="number"
                  step="0.1"
                  value={dimensions.legWidth}
                  onChange={(e) => {
                    setDimensions({ ...dimensions, legWidth: e.target.value });
                    validateDimension(e.target.value, "legWidth");
                  }}
                  className={`glass-card ${errors.legWidth ? 'border-destructive' : ''}`}
                  required
                />
                {errors.legWidth && <p className="text-xs text-destructive">{errors.legWidth}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="legHeight" className="text-caption font-medium">Leg Height</Label>
                <Input
                  id="legHeight"
                  type="number"
                  step="0.1"
                  value={dimensions.legHeight}
                  onChange={(e) => {
                    setDimensions({ ...dimensions, legHeight: e.target.value });
                    validateDimension(e.target.value, "legHeight");
                  }}
                  className={`glass-card ${errors.legHeight ? 'border-destructive' : ''}`}
                  required
                />
                {errors.legHeight && <p className="text-xs text-destructive">{errors.legHeight}</p>}
              </div>
            </div>
          </>
        );
      case "triangle":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="base" className="text-body font-medium">Base (cm)</Label>
              <Input
                id="base"
                type="number"
                step="0.1"
                value={dimensions.base}
                onChange={(e) => {
                  setDimensions({ ...dimensions, base: e.target.value });
                  validateDimension(e.target.value, "base");
                }}
                className={`glass-card ${errors.base ? 'border-destructive' : ''}`}
                placeholder="Enter base..."
                required
              />
              {errors.base && <p className="text-xs text-destructive">{errors.base}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-body font-medium">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={dimensions.height}
                onChange={(e) => {
                  setDimensions({ ...dimensions, height: e.target.value });
                  validateDimension(e.target.value, "height");
                }}
                className={`glass-card ${errors.height ? 'border-destructive' : ''}`}
                placeholder="Enter height..."
                required
              />
              {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
            </div>
          </>
        );
      case "circle":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius" className="text-body font-medium flex items-center gap-1">
                <Ruler className="h-3.5 w-3.5" />
                Radius (cm)
              </Label>
              {dimensions.radius && (
                <span className="text-caption text-primary">Ø {(parseFloat(dimensions.radius) * 2).toFixed(1)} cm</span>
              )}
            </div>
            <Input
              id="radius"
              type="number"
              step="0.1"
              value={dimensions.radius}
              onChange={(e) => {
                setDimensions({ ...dimensions, radius: e.target.value });
                validateDimension(e.target.value, "radius");
              }}
              className={`glass-card ${errors.radius ? 'border-destructive' : ''}`}
              placeholder="Enter radius..."
              required
            />
            {errors.radius && <p className="text-xs text-destructive">{errors.radius}</p>}
          </div>
        );
      case "slab":
        return (
          <>
            <div className="p-3 rounded-lg state-info mb-3">
              <p className="text-caption flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Define your marble slab workspace dimensions
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="width" className="text-body font-medium">Slab Width (cm)</Label>
              <Input
                id="width"
                type="number"
                step="1"
                min="10"
                max="500"
                value={dimensions.width}
                onChange={(e) => {
                  setDimensions({ ...dimensions, width: e.target.value });
                  validateDimension(e.target.value, "width", 10, 500);
                }}
                className={`glass-card ${errors.width ? 'border-destructive' : ''}`}
                placeholder="e.g. 120"
                required
              />
              {errors.width && <p className="text-xs text-destructive">{errors.width}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-body font-medium">Slab Height (cm)</Label>
              <Input
                id="height"
                type="number"
                step="1"
                min="10"
                max="500"
                value={dimensions.height}
                onChange={(e) => {
                  setDimensions({ ...dimensions, height: e.target.value });
                  validateDimension(e.target.value, "height", 10, 500);
                }}
                className={`glass-card ${errors.height ? 'border-destructive' : ''}`}
                placeholder="e.g. 80"
                required
              />
              {errors.height && <p className="text-xs text-destructive">{errors.height}</p>}
            </div>
          </>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label className="text-body font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Shape Type
        </Label>
        <div className="h-[400px]">
          <ShapePalette 
            onSelectShape={(type) => setShapeType(type)} 
            selectedShape={shapeType}
          />
        </div>
      </div>
      
      {renderInputs()}

      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          className={`flex-1 h-11 ${shapeType === 'slab' ? 'btn-accent' : 'btn-primary'}`}
        >
          {editingShape ? (
            <>
              <Edit3 className="mr-2 h-4 w-4" />
              Update Shape
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add {shapeType === 'slab' ? 'Slab' : 'Shape'}
            </>
          )}
        </Button>
        {editingShape && onCancelEdit && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancelEdit}
            className="glass-panel"
            size="icon"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
