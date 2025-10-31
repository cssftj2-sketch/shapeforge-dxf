import { useState, useRef } from "react";
import { Shape } from "@/types/shapes";
import { ShapeForm } from "@/components/ShapeForm";
import { ShapeCanvas } from "@/components/ShapeCanvas";
import { ShapeList } from "@/components/ShapeList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { arrangeShapes } from "@/utils/shapeArrangement";
import { downloadDXF } from "@/utils/dxfExport";
import { handleDXFUpload } from "@/utils/dxfImport";
import { Download, Layout, Upload } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [slab, setSlab] = useState<Shape | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [arrangedShapes, setArrangedShapes] = useState<Shape[]>([]);
  const [spacing, setSpacing] = useState(1); // 1cm default spacing
  const [includeSlab, setIncludeSlab] = useState(true);
  const [editingShape, setEditingShape] = useState<Shape | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddShape = (shape: Shape) => {
    if (shape.type === "slab") {
      setSlab(shape);
      toast.success("Slab added successfully");
      setEditingShape(null);
    } else {
      if (!slab) {
        toast.error("Please add a slab first");
        return;
      }
      
      if (editingShape) {
        // Update existing shape
        setShapes(shapes.map(s => s.id === editingShape.id ? shape : s));
        setArrangedShapes(arrangedShapes.map(s => s.id === editingShape.id ? shape : s));
        toast.success("Shape updated successfully");
        setEditingShape(null);
      } else {
        // Add new shape
        setShapes([...shapes, shape]);
        toast.success("Shape added successfully");
      }
    }
  };

  const handleEditShape = (shape: Shape) => {
    setEditingShape(shape);
    toast.info("Edit the shape and add it again");
  };

  const handleCancelEdit = () => {
    setEditingShape(null);
    toast.info("Edit cancelled");
  };

  const handleRemoveShape = (id: string) => {
    setShapes(shapes.filter((s) => s.id !== id));
    setArrangedShapes(arrangedShapes.filter((s) => s.id !== id));
    toast.success("Shape removed");
  };

  const handleArrange = () => {
    if (!slab) {
      toast.error("Please add a slab first");
      return;
    }
    const arranged = arrangeShapes(shapes, spacing, slab);
    setArrangedShapes(arranged);
    toast.success(`Arranged ${shapes.length} shapes with ${spacing}cm spacing`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await handleDXFUpload(file);
      
      if (result.slab) {
        setSlab(result.slab);
      }
      
      if (result.shapes.length > 0) {
        setShapes(result.shapes);
        setArrangedShapes([]);
        toast.success(`Imported ${result.shapes.length} shapes${result.slab ? " and slab" : ""}`);
      } else {
        toast.warning("No shapes found in DXF file");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import DXF file. Please check the file format.");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (arrangedShapes.length === 0) {
      toast.error("Please arrange shapes before exporting");
      return;
    }
    downloadDXF(arrangedShapes, spacing, includeSlab ? (slab || undefined) : undefined);
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
            <ShapeForm 
              onAddShape={handleAddShape} 
              editingShape={editingShape}
              onCancelEdit={handleCancelEdit}
            />
            
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-slab">Include Slab in Export</Label>
                  <Switch
                    id="include-slab"
                    checked={includeSlab}
                    onCheckedChange={setIncludeSlab}
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
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import DXF
                  </Button>
                  <Button 
                    onClick={handleExport} 
                    variant="secondary"
                    className="w-full"
                    disabled={arrangedShapes.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export DXF
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".dxf"
                  onChange={handleImport}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <ShapeList 
              shapes={shapes} 
              onRemoveShape={handleRemoveShape}
              onEditShape={handleEditShape}
            />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Canvas Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {slab ? (
                  <>
                    <ShapeCanvas 
                      slab={slab}
                      shapes={arrangedShapes.length > 0 ? arrangedShapes : shapes} 
                      spacing={spacing}
                    />
                    <p className="text-sm text-muted-foreground mt-4">
                      Slab: {slab.type === "slab" ? `${slab.width}cm × ${slab.height}cm` : ""} | Grid: 1cm = 10px
                    </p>
                  </>
                ) : (
                  <div className="border rounded-lg p-12 text-center text-muted-foreground">
                    Please add a slab first to start designing
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
