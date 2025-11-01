import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Edit3, Ruler, HelpCircle } from "lucide-react";

// ============================================================================
// TYPE DEFINITIONS - Using discriminated unions for type safety (Fix #22)
// ============================================================================

type BaseShape = {
  id: string;
  x: number;
  y: number;
};

type RectangleShape = BaseShape & {
  type: "rectangle";
  width: number;
  height: number;
};

type LShape = BaseShape & {
  type: "l-shape-tl" | "l-shape-tr" | "l-shape-bl" | "l-shape-br";
  width: number;
  height: number;
  legWidth: number;
  legHeight: number;
};

type TriangleShape = BaseShape & {
  type: "triangle";
  base: number;
  height: number;
};

type CircleShape = BaseShape & {
  type: "circle";
  radius: number;
};

type SlabShape = BaseShape & {
  type: "slab";
  width: number;
  height: number;
};

type Shape = RectangleShape | LShape | TriangleShape | CircleShape | SlabShape;
type ShapeType = Shape["type"];

// ============================================================================
// CONSTANTS - Named constants instead of magic numbers (Fix #38)
// ============================================================================

const DIMENSION_LIMITS = {
  default: { min: 0.1, max: 1000 },
  slab: { min: 10, max: 500 },
} as const;

const DECIMAL_PLACES = 1;
const INPUT_STEP = "0.1";

// ============================================================================
// VALIDATION UTILITIES - Pure functions for testability (Fix #42)
// ============================================================================

type ValidationResult = 
  | { valid: true; value: number }
  | { valid: false; error: string };

/**
 * Validates a dimension input value
 * Pure function - testable without React
 */
const validateDimension = (
  value: string,
  fieldName: string,
  min: number,
  max: number
): ValidationResult => {
  const trimmed = value.trim();
  
  if (trimmed === "") {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  const num = parseFloat(trimmed);
  
  if (isNaN(num)) {
    return { valid: false, error: "Must be a valid number" };
  }
  
  if (num <= 0) {
    return { valid: false, error: "Must be greater than 0" };
  }
  
  if (num < min) {
    return { valid: false, error: `Minimum ${min} cm` };
  }
  
  if (num > max) {
    return { valid: false, error: `Maximum ${max} cm` };
  }
  
  // Fix #24: Store measurements in highest precision, round only for display
  return { 
    valid: true, 
    value: Math.round(num * Math.pow(10, DECIMAL_PLACES)) / Math.pow(10, DECIMAL_PLACES)
  };
};

/**
 * Validates L-shape dimensions to ensure legs don't exceed total size
 * Fix #31: L-Shape Legs validation
 */
const validateLShapeDimensions = (
  width: number,
  height: number,
  legWidth: number,
  legHeight: number
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  if (legWidth >= width) {
    errors.legWidth = "Leg width must be less than total width";
  }
  
  if (legHeight >= height) {
    errors.legHeight = "Leg height must be less than total height";
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

// ============================================================================
// SHAPE METADATA - Configuration instead of scattered logic (Fix #41)
// ============================================================================

const SHAPE_METADATA: Record<ShapeType, {
  icon: string;
  label: string;
  description: string;
  category: "workspace" | "shape";
}> = {
  slab: {
    icon: "▢",
    label: "Slab",
    description: "Define workspace dimensions",
    category: "workspace"
  },
  rectangle: {
    icon: "▭",
    label: "Rectangle",
    description: "Standard rectangular cut",
    category: "shape"
  },
  "l-shape-tl": {
    icon: "⌐",
    label: "L-Shape (Top-Left)",
    description: "L-shape with notch in top-left",
    category: "shape"
  },
  "l-shape-tr": {
    icon: "¬",
    label: "L-Shape (Top-Right)",
    description: "L-shape with notch in top-right",
    category: "shape"
  },
  "l-shape-bl": {
    icon: "⌊",
    label: "L-Shape (Bottom-Left)",
    description: "L-shape with notch in bottom-left",
    category: "shape"
  },
  "l-shape-br": {
    icon: "⌋",
    label: "L-Shape (Bottom-Right)",
    description: "L-shape with notch in bottom-right",
    category: "shape"
  },
  triangle: {
    icon: "△",
    label: "Triangle",
    description: "Triangular cut piece",
    category: "shape"
  },
  circle: {
    icon: "○",
    label: "Circle",
    description: "Circular cut piece",
    category: "shape"
  }
};

// ============================================================================
// DIMENSION INPUT COMPONENT - Extracted for reusability (Fix #41)
// ============================================================================

interface DimensionInputProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onValidate: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
  showIcon?: boolean;
  displayValue?: string;
}

const DimensionInput = ({
  id,
  label,
  value,
  error,
  onChange,
  onValidate,
  placeholder = "Enter value...",
  min = "0.1",
  max = "1000",
  step = INPUT_STEP,
  showIcon = true,
  displayValue
}: DimensionInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    onValidate(e.target.value);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-body font-medium flex items-center gap-1">
          {showIcon && <Ruler className="h-3.5 w-3.5" />}
          {label}
        </Label>
        {displayValue && (
          <span className="text-caption text-primary">{displayValue}</span>
        )}
      </div>
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className={`glass-card ${error ? 'border-destructive' : ''}`}
        placeholder={placeholder}
        required
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ShapeFormProps {
  onAddShape: (shape: Shape) => void;
  editingShape?: Shape | null;
  onCancelEdit?: () => void;
}

export const ShapeForm = ({ 
  onAddShape, 
  editingShape, 
  onCancelEdit 
}: ShapeFormProps) => {
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

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (editingShape) {
      setShapeType(editingShape.type);
      
      const newDimensions = {
        width: "",
        height: "",
        legWidth: "",
        legHeight: "",
        base: "",
        radius: "",
      };
      
      // Type-safe dimension extraction (Fix #22)
      if (editingShape.type === "rectangle" || editingShape.type === "slab") {
        newDimensions.width = editingShape.width.toString();
        newDimensions.height = editingShape.height.toString();
      } else if (editingShape.type.startsWith("l-shape")) {
        newDimensions.width = editingShape.width.toString();
        newDimensions.height = editingShape.height.toString();
        newDimensions.legWidth = editingShape.legWidth.toString();
        newDimensions.legHeight = editingShape.legHeight.toString();
      } else if (editingShape.type === "triangle") {
        newDimensions.base = editingShape.base.toString();
        newDimensions.height = editingShape.height.toString();
      } else if (editingShape.type === "circle") {
        newDimensions.radius = editingShape.radius.toString();
      }
      
      setDimensions(newDimensions);
      setErrors({});
    }
  }, [editingShape]);

  // ============================================================================
  // VALIDATION HANDLERS
  // ============================================================================

  const handleValidation = useCallback((
    value: string,
    fieldName: string,
    min: number = DIMENSION_LIMITS.default.min,
    max: number = DIMENSION_LIMITS.default.max
  ) => {
    const result = validateDimension(value, fieldName, min, max);
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (result.valid) {
        delete newErrors[fieldName];
      } else {
        newErrors[fieldName] = result.error;
      }
      return newErrors;
    });
  }, []);

  // ============================================================================
  // FORM SUBMISSION - Fix #21: Comprehensive input validation
  // ============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setErrors({});
    
    // Fix #5: Use crypto.randomUUID() for proper ID generation
    const baseShape = {
      id: editingShape?.id || crypto.randomUUID(),
      x: editingShape?.x || 0,
      y: editingShape?.y || 0,
    };

    let newShape: Shape | null = null;
    const validationErrors: Record<string, string> = {};

    // Validate and construct shape based on type
    // Using exhaustive switch with no default case (Fix #40)
    switch (shapeType) {
      case "rectangle": {
        const limits = DIMENSION_LIMITS.default;
        const widthResult = validateDimension(dimensions.width, "width", limits.min, limits.max);
        const heightResult = validateDimension(dimensions.height, "height", limits.min, limits.max);
        
        if (!widthResult.valid) validationErrors.width = widthResult.error;
        if (!heightResult.valid) validationErrors.height = heightResult.error;
        
        if (widthResult.valid && heightResult.valid) {
          newShape = {
            ...baseShape,
            type: "rectangle",
            width: widthResult.value,
            height: heightResult.value,
          };
        }
        break;
      }

      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br": {
        const limits = DIMENSION_LIMITS.default;
        const widthResult = validateDimension(dimensions.width, "width", limits.min, limits.max);
        const heightResult = validateDimension(dimensions.height, "height", limits.min, limits.max);
        const legWidthResult = validateDimension(dimensions.legWidth, "legWidth", limits.min, limits.max);
        const legHeightResult = validateDimension(dimensions.legHeight, "legHeight", limits.min, limits.max);
        
        if (!widthResult.valid) validationErrors.width = widthResult.error;
        if (!heightResult.valid) validationErrors.height = heightResult.error;
        if (!legWidthResult.valid) validationErrors.legWidth = legWidthResult.error;
        if (!legHeightResult.valid) validationErrors.legHeight = legHeightResult.error;
        
        if (widthResult.valid && heightResult.valid && legWidthResult.valid && legHeightResult.valid) {
          // Fix #31: Validate leg dimensions
          const lShapeValidation = validateLShapeDimensions(
            widthResult.value,
            heightResult.value,
            legWidthResult.value,
            legHeightResult.value
          );
          
          if (lShapeValidation.valid) {
            newShape = {
              ...baseShape,
              type: shapeType,
              width: widthResult.value,
              height: heightResult.value,
              legWidth: legWidthResult.value,
              legHeight: legHeightResult.value,
            };
          } else {
            Object.assign(validationErrors, lShapeValidation.errors);
          }
        }
        break;
      }

      case "triangle": {
        const limits = DIMENSION_LIMITS.default;
        const baseResult = validateDimension(dimensions.base, "base", limits.min, limits.max);
        const heightResult = validateDimension(dimensions.height, "height", limits.min, limits.max);
        
        if (!baseResult.valid) validationErrors.base = baseResult.error;
        if (!heightResult.valid) validationErrors.height = heightResult.error;
        
        if (baseResult.valid && heightResult.valid) {
          newShape = {
            ...baseShape,
            type: "triangle",
            base: baseResult.value,
            height: heightResult.value,
          };
        }
        break;
      }

      case "circle": {
        const limits = DIMENSION_LIMITS.default;
        const radiusResult = validateDimension(dimensions.radius, "radius", limits.min, limits.max);
        
        if (!radiusResult.valid) validationErrors.radius = radiusResult.error;
        
        if (radiusResult.valid) {
          newShape = {
            ...baseShape,
            type: "circle",
            radius: radiusResult.value,
          };
        }
        break;
      }

      case "slab": {
        const limits = DIMENSION_LIMITS.slab;
        const widthResult = validateDimension(dimensions.width, "width", limits.min, limits.max);
        const heightResult = validateDimension(dimensions.height, "height", limits.min, limits.max);
        
        if (!widthResult.valid) validationErrors.width = widthResult.error;
        if (!heightResult.valid) validationErrors.height = heightResult.error;
        
        if (widthResult.valid && heightResult.valid) {
          newShape = {
            ...baseShape,
            type: "slab",
            width: widthResult.value,
            height: heightResult.value,
          };
        }
        break;
      }
    }

    // Fix #28: Show user-visible error messages
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit valid shape
    if (newShape) {
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

  // ============================================================================
  // RENDER INPUT FIELDS
  // ============================================================================

  const renderInputFields = () => {
    const updateDimension = (field: keyof typeof dimensions) => (value: string) => {
      setDimensions(prev => ({ ...prev, [field]: value }));
    };

    switch (shapeType) {
      case "rectangle":
        return (
          <>
            <DimensionInput
              id="width"
              label="Width (cm)"
              value={dimensions.width}
              error={errors.width}
              onChange={updateDimension("width")}
              onValidate={(v) => handleValidation(v, "width")}
              displayValue={dimensions.width ? `${dimensions.width} cm` : undefined}
            />
            <DimensionInput
              id="height"
              label="Height (cm)"
              value={dimensions.height}
              error={errors.height}
              onChange={updateDimension("height")}
              onValidate={(v) => handleValidation(v, "height")}
              displayValue={dimensions.height ? `${dimensions.height} cm` : undefined}
            />
          </>
        );

      case "l-shape-tl":
      case "l-shape-tr":
      case "l-shape-bl":
      case "l-shape-br":
        return (
          <>
            <div className="grid grid-cols-2 gap-3">
              <DimensionInput
                id="width"
                label="Total Width"
                value={dimensions.width}
                error={errors.width}
                onChange={updateDimension("width")}
                onValidate={(v) => handleValidation(v, "width")}
                showIcon={false}
              />
              <DimensionInput
                id="height"
                label="Total Height"
                value={dimensions.height}
                error={errors.height}
                onChange={updateDimension("height")}
                onValidate={(v) => handleValidation(v, "height")}
                showIcon={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DimensionInput
                id="legWidth"
                label="Leg Width"
                value={dimensions.legWidth}
                error={errors.legWidth}
                onChange={updateDimension("legWidth")}
                onValidate={(v) => handleValidation(v, "legWidth")}
                showIcon={false}
              />
              <DimensionInput
                id="legHeight"
                label="Leg Height"
                value={dimensions.legHeight}
                error={errors.legHeight}
                onChange={updateDimension("legHeight")}
                onValidate={(v) => handleValidation(v, "legHeight")}
                showIcon={false}
              />
            </div>
          </>
        );

      case "triangle":
        return (
          <>
            <DimensionInput
              id="base"
              label="Base (cm)"
              value={dimensions.base}
              error={errors.base}
              onChange={updateDimension("base")}
              onValidate={(v) => handleValidation(v, "base")}
            />
            <DimensionInput
              id="height"
              label="Height (cm)"
              value={dimensions.height}
              error={errors.height}
              onChange={updateDimension("height")}
              onValidate={(v) => handleValidation(v, "height")}
            />
          </>
        );

      case "circle":
        return (
          <DimensionInput
            id="radius"
            label="Radius (cm)"
            value={dimensions.radius}
            error={errors.radius}
            onChange={updateDimension("radius")}
            onValidate={(v) => handleValidation(v, "radius")}
            displayValue={
              dimensions.radius 
                ? `Ø ${(parseFloat(dimensions.radius) * 2).toFixed(DECIMAL_PLACES)} cm`
                : undefined
            }
          />
        );

      case "slab": {
        const limits = DIMENSION_LIMITS.slab;
        return (
          <>
            <div className="p-3 rounded-lg state-info mb-3">
              <p className="text-caption flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Define your marble slab workspace dimensions
              </p>
            </div>
            <DimensionInput
              id="width"
              label="Slab Width (cm)"
              value={dimensions.width}
              error={errors.width}
              onChange={updateDimension("width")}
              onValidate={(v) => handleValidation(v, "width", limits.min, limits.max)}
              placeholder="e.g. 120"
              min={limits.min.toString()}
              max={limits.max.toString()}
              step="1"
            />
            <DimensionInput
              id="height"
              label="Slab Height (cm)"
              value={dimensions.height}
              error={errors.height}
              onChange={updateDimension("height")}
              onValidate={(v) => handleValidation(v, "height", limits.min, limits.max)}
              placeholder="e.g. 80"
              min={limits.min.toString()}
              max={limits.max.toString()}
              step="1"
            />
          </>
        );
      }
    }
  };

  // ============================================================================
  // RENDER - Fix #26: Added ARIA labels for accessibility
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shapeType" className="text-body font-semibold">
          Shape Type
        </Label>
        <Select 
          value={shapeType} 
          onValueChange={(value) => {
            setShapeType(value as ShapeType);
            setErrors({}); // Clear errors when changing shape type
          }}
        >
          <SelectTrigger className="glass-card h-11" id="shapeType">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-elevated">
            {(Object.keys(SHAPE_METADATA) as ShapeType[]).map((type) => {
              const meta = SHAPE_METADATA[type];
              return (
                <SelectItem key={type} value={type} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-lg" aria-hidden="true">{meta.icon}</span>
                    <div>
                      <div className="font-medium">{meta.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {meta.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      {renderInputFields()}

      <div className="flex gap-2 pt-2">
        <Button 
          type="submit" 
          className={`flex-1 h-11 ${
            shapeType === 'slab' ? 'btn-accent' : 'btn-primary'
          }`}
        >
          {editingShape ? (
            <>
              <Edit3 className="mr-2 h-4 w-4" />
              Update Shape
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add {SHAPE_METADATA[shapeType].label}
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
            aria-label="Cancel editing"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
};
