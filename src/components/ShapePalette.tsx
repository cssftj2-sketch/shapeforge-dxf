import { useState } from "react";
import { ShapeType } from "@/types/shapes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShapePaletteProps {
  onSelectShape: (type: ShapeType) => void;
  selectedShape: ShapeType;
}

interface ShapeCategory {
  label: string;
  shapes: {
    type: ShapeType;
    icon: string;
    label: string;
  }[];
}

const shapeCategories: ShapeCategory[] = [
  {
    label: "Formes récemment utilisées",
    shapes: [
      { type: "rectangle", icon: "▭", label: "Rectangle" },
      { type: "circle", icon: "○", label: "Circle" },
      { type: "triangle", icon: "△", label: "Triangle" },
    ],
  },
  {
    label: "Lignes",
    shapes: [
      { type: "line", icon: "─", label: "Line" },
      { type: "arc", icon: "⌒", label: "Arc" },
    ],
  },
  {
    label: "Rectangles",
    shapes: [
      { type: "rectangle", icon: "▭", label: "Rectangle" },
      { type: "l-shape-tl", icon: "⌐", label: "L-Shape TL" },
      { type: "l-shape-tr", icon: "¬", label: "L-Shape TR" },
      { type: "l-shape-bl", icon: "⌊", label: "L-Shape BL" },
      { type: "l-shape-br", icon: "⌋", label: "L-Shape BR" },
    ],
  },
  {
    label: "Formes de base",
    shapes: [
      { type: "rectangle", icon: "▭", label: "Rectangle" },
      { type: "circle", icon: "○", label: "Circle" },
      { type: "triangle", icon: "△", label: "Triangle" },
    ],
  },
];

export const ShapePalette = ({ onSelectShape, selectedShape }: ShapePaletteProps) => {
  const [openCategories, setOpenCategories] = useState<string[]>(["Rectangles"]);

  const toggleCategory = (label: string) => {
    setOpenCategories((prev) =>
      prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]
    );
  };

  return (
    <div className="glass-panel h-full flex flex-col">
      <div className="p-3 border-b border-border">
        <h3 className="text-body font-semibold">Bibliothèque de formes</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {shapeCategories.map((category) => (
            <Collapsible
              key={category.label}
              open={openCategories.includes(category.label)}
              onOpenChange={() => toggleCategory(category.label)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between p-2 hover:bg-accent/50 rounded-md text-caption font-medium group transition-colors">
                <span>{category.label}</span>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform text-muted-foreground group-hover:text-foreground",
                    openCategories.includes(category.label) && "transform rotate-180"
                  )} 
                />
              </CollapsibleTrigger>
              
              <CollapsibleContent className="pt-1 pb-2">
                <div className="grid grid-cols-4 gap-1 px-1">
                  {category.shapes.map((shape) => (
                    <button
                      key={shape.type}
                      onClick={() => onSelectShape(shape.type)}
                      className={cn(
                        "aspect-square flex items-center justify-center rounded-md border transition-all hover:scale-105 hover:shadow-md",
                        selectedShape === shape.type
                          ? "bg-primary/20 border-primary shadow-lg scale-105"
                          : "bg-card border-border hover:border-primary/50"
                      )}
                      title={shape.label}
                    >
                      <span className="text-2xl">{shape.icon}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
