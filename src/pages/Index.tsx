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
import { Progress } from "@/components/ui/progress";
import { arrangeShapes } from "@/utils/shapeArrangement";
import { optimizeNesting } from "@/utils/optimizedNesting";
import { downloadDXF } from "@/utils/dxfExport";
import { downloadSVG } from "@/utils/svgExport";
import { handleDXFUpload } from "@/utils/dxfImport";
import { Download, Layout, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [slab, setSlab] = useState<Shape | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [arrangedShapes, setArrangedShapes] = useState<Shape[]>([]);
  const [spacing, setSpacing] = useState(1); // 1cm default spacing
  const [includeSlab, setIncludeSlab] = useState(true);
  const [editingShape, setEditingShape] = useState<Shape | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [efficiency, setEfficiency] = useState<number | null>(null);
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
    setEfficiency(null);
    toast.success(`Arranged ${shapes.length} shapes with ${spacing}cm spacing`);
  };

  const handleOptimize = async () => {
    if (!slab) {
      toast.error("Please add a slab first");
      return;
    }
    
    if (shapes.length === 0) {
      toast.error("Please add shapes to optimize");
      return;
    }

    setIsOptimizing(true);
    setOptimizationProgress(0);
    setEfficiency(null);
    
    try {
      const result = await optimizeNesting(
        shapes,
        spacing,
        slab,
        (progress, bestSoFar) => {
          setOptimizationProgress(progress);
          if (bestSoFar.shapes.length > 0) {
            setArrangedShapes(bestSoFar.shapes);
            setEfficiency(bestSoFar.efficiency);
          }
        }
      );

      setArrangedShapes(result.shapes);
      setEfficiency(result.efficiency);
      
      toast.success(
        `Optimization complete! Placed ${result.shapes.length}/${shapes.length} shapes with ${result.efficiency.toFixed(1)}% efficiency`,
        { duration: 5000 }
      );
      
      if (result.shapes.length < shapes.length) {
        toast.warning(
          `${shapes.length - result.shapes.length} shapes didn't fit. Consider a larger slab or fewer shapes.`,
          { duration: 7000 }
        );
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error("Optimization failed. Please try again.");
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
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

  const handleExportSVG = () => {
    if (arrangedShapes.length === 0) {
      toast.error("Please arrange shapes before exporting");
      return;
    }
    downloadSVG(arrangedShapes, spacing, includeSlab ? (slab || undefined) : undefined);
    toast.success("SVG file downloaded successfully");
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
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleArrange} 
                    className="w-full"
                    disabled={shapes.length === 0 || isOptimizing}
                    variant="outline"
                  >
                    <Layout className="mr-2 h-4 w-4" />
                    Quick Arrange
                  </Button>
                  <Button 
                    onClick={handleOptimize} 
                    className="w-full"
                    disabled={shapes.length === 0 || isOptimizing}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimize
                  </Button>
                </div>
                {isOptimizing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Optimizing nesting...</span>
                      <span className="font-medium">{optimizationProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={optimizationProgress} />
                  </div>
                )}
                {efficiency !== null && !isOptimizing && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Material Efficiency</span>
                      <span className="text-lg font-bold text-primary">{efficiency.toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {arrangedShapes.length} of {shapes.length} shapes placed
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import DXF
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={handleExport} 
                      variant="secondary"
                      className="w-full"
                      disabled={arrangedShapes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export DXF
                    </Button>
                    <Button 
                      onClick={handleExportSVG} 
                      variant="secondary"
                      className="w-full"
                      disabled={arrangedShapes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export SVG
                    </Button>
                  </div>
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
