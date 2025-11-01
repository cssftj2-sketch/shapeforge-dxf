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
import { Download, Layout, Upload, Sparkles, Scissors, Layers } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [slab, setSlab] = useState<Shape | null>(null);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [arrangedShapes, setArrangedShapes] = useState<Shape[]>([]);
  const [spacing, setSpacing] = useState(1);
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
        setShapes(shapes.map(s => s.id === editingShape.id ? shape : s));
        setArrangedShapes(arrangedShapes.map(s => s.id === editingShape.id ? shape : s));
        toast.success("Shape updated successfully");
        setEditingShape(null);
      } else {
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

  const handleUpdateShapes = (updatedShapes: Shape[]) => {
    setShapes(updatedShapes);
    setArrangedShapes([]);
    setEfficiency(null);
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
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-[1800px] mx-auto space-y-8">
        {/* Premium Header */}
        <header className="space-y-3 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl glass-panel gold-glow">
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent shimmer">
                Marble Cut Nesting
              </h1>
              <p className="text-muted-foreground mt-1 text-lg">
                Professional marble shape optimization for precision cutting
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Sidebar - Tools & Controls */}
          <div className="xl:col-span-3 space-y-6">
            {/* Shape Form */}
            <div className="premium-card">
              <ShapeForm 
                onAddShape={handleAddShape} 
                editingShape={editingShape}
                onCancelEdit={handleCancelEdit}
              />
            </div>
            
            {/* Arrangement Settings */}
            <Card className="premium-card border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Arrangement</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label htmlFor="spacing" className="text-sm font-semibold text-foreground/90">
                    Spacing (cm)
                  </Label>
                  <Input
                    id="spacing"
                    type="number"
                    step="0.1"
                    min="0"
                    value={spacing}
                    onChange={(e) => setSpacing(parseFloat(e.target.value) || 1)}
                    className="glass-card border-primary/20 focus:border-primary/50"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg glass-panel">
                  <Label htmlFor="include-slab" className="font-medium">
                    Include Slab in Export
                  </Label>
                  <Switch
                    id="include-slab"
                    checked={includeSlab}
                    onCheckedChange={setIncludeSlab}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={handleArrange} 
                    disabled={shapes.length === 0 || isOptimizing}
                    variant="outline"
                    className="glass-panel hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    <Layout className="mr-2 h-4 w-4" />
                    Quick
                  </Button>
                  <Button 
                    onClick={handleOptimize} 
                    disabled={shapes.length === 0 || isOptimizing}
                    className="btn-gold"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Optimize
                  </Button>
                </div>
                
                {isOptimizing && (
                  <div className="space-y-3 p-4 rounded-lg glass-panel">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Optimizing...</span>
                      <span className="font-bold text-primary">{optimizationProgress.toFixed(0)}%</span>
                    </div>
                    <div className="progress-bar h-2">
                      <div 
                        className="progress-fill transition-all duration-300"
                        style={{ width: `${optimizationProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {efficiency !== null && !isOptimizing && (
                  <div className="efficiency-badge">
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground font-medium">Material Efficiency</div>
                      <div className="text-2xl font-bold text-primary mt-1">{efficiency.toFixed(1)}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Placed</div>
                      <div className="text-lg font-semibold">{arrangedShapes.length}/{shapes.length}</div>
                    </div>
                  </div>
                )}
                
                {/* Import/Export Section */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="w-full glass-panel hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Import DXF
                  </Button>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={handleExport} 
                      variant="secondary"
                      className="glass-panel hover:bg-primary/10"
                      disabled={arrangedShapes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      DXF
                    </Button>
                    <Button 
                      onClick={handleExportSVG} 
                      variant="secondary"
                      className="glass-panel hover:bg-primary/10"
                      disabled={arrangedShapes.length === 0}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      SVG
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

            {/* Shape List */}
            <div className="premium-card">
              <ShapeList 
                shapes={shapes} 
                onRemoveShape={handleRemoveShape}
                onEditShape={handleEditShape}
              />
            </div>
          </div>

          {/* Center - Canvas Area */}
          <div className="xl:col-span-9">
            <Card className="premium-card h-full min-h-[600px]">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary gold-glow status-dot" />
                  Canvas Preview
                  {slab && (
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                      {slab.type === "slab" ? `${slab.width}cm × ${slab.height}cm` : ""} | Grid: 1cm = 10px
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slab ? (
                  <div className="canvas-container">
                    <ShapeCanvas 
                      slab={slab}
                      shapes={arrangedShapes.length > 0 ? arrangedShapes : shapes}
                      onUpdateShapes={handleUpdateShapes}
                    />
                  </div>
                ) : (
                  <div className="canvas-container flex items-center justify-center min-h-[500px]">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 rounded-full glass-panel gold-glow mx-auto flex items-center justify-center">
                        <Layers className="h-10 w-10 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">No Slab Defined</h3>
                        <p className="text-muted-foreground max-w-md">
                          Add a slab first to start designing your marble cutting layout
                        </p>
                      </div>
                    </div>
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
