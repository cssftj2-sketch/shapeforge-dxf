import { useState } from "react";
import { Shape } from "@/types/shapes";
import { ShapeForm } from "@/components/ShapeForm";
import { ShapeCanvas } from "@/components/ShapeCanvas";
import { ShapeList } from "@/components/ShapeList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { arrangeShapes } from "@/utils/shapeArrangement";
import { downloadDXF } from "@/utils/dxfExport";
import { Download, Layout } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [arrangedShapes, setArrangedShapes] = useState<Shape[]>([]);
  const [spacing, setSpacing] = useState(1); // 1cm default spacing

  const handleAddShape = (shape: Shape) => {
    setShapes([...shapes, shape]);
    toast.success("Shape added successfully");
  };

  const handleRemoveShape = (id: string) => {
    setShapes(shapes.filter((s) => s.id !== id));
    setArrangedShapes(arrangedShapes.filter((s) => s.id !== id));
    toast.success("Shape removed");
  };

  const handleArrange = () => {
    const arranged = arrangeShapes(shapes, spacing);
    setArrangedShapes(arranged);
    toast.success(`Arranged ${shapes.length} shapes with ${spacing}cm spacing`);
  };

  const handleExport = () => {
    if (arrangedShapes.length === 0) {
      toast.error("Please arrange shapes before exporting");
      return;
    }
    downloadDXF(arrangedShapes, spacing);
    toast.success("DXF file downloaded successfully");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Marble Shape Designer</h1>
          <p className="text-muted-foreground">
            Design and arrange marble shapes for AlphaCAM export
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ShapeForm onAddShape={handleAddShape} />
            
            <Card>
              <CardHeader>
                <CardTitle>Arrangement Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spacing">Spacing (cm)</Label>
                  <Input
                    id="spacing"
                    type="number"
                    step="0.1"
                    min="0"
                    value={spacing}
                    onChange={(e) => setSpacing(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <Button 
                  onClick={handleArrange} 
                  className="w-full"
                  disabled={shapes.length === 0}
                >
                  <Layout className="mr-2 h-4 w-4" />
                  Arrange Shapes
                </Button>
                <Button 
                  onClick={handleExport} 
                  variant="secondary"
                  className="w-full"
                  disabled={arrangedShapes.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to DXF
                </Button>
              </CardContent>
            </Card>

            <ShapeList shapes={shapes} onRemoveShape={handleRemoveShape} />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Canvas Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <ShapeCanvas 
                  shapes={arrangedShapes.length > 0 ? arrangedShapes : shapes} 
                  spacing={spacing}
                />
                <p className="text-sm text-muted-foreground mt-4">
                  Grid: 1cm = 10px | Canvas: 80cm × 60cm
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
