import { useState, useRef } from "react";
import { Shape } from "@/types/shapes";
import { ShapeForm } from "@/components/ShapeForm";
import ShapeCanvas from "@/components/ShapeCanvas";
import { ShapeList } from "@/components/ShapeList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { arrangeShapes } from "@/utils/shapeArrangement";
import { optimizeNesting } from "@/utils/optimizedNesting";
import { downloadDXF } from "@/utils/dxfExport";
import { downloadSVG } from "@/utils/svgExport";
import { handleDXFUpload } from "@/utils/dxfImport";
import { 
  Download, Layout, Upload, Sparkles, Scissors, Layers, 
  Plus, AlertCircle, CheckCircle2, TrendingUp, FileText,
  Maximize2, HelpCircle, Zap, BarChart3, PanelRightOpen
} from "lucide-react";
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

  // Calculate waste metrics
  const wastePercentage = efficiency !== null ? (100 - efficiency) : null;
  const slabArea = slab?.type === "slab" ? slab.width * slab.height : 0;
  const usedArea = efficiency !== null ? (slabArea * efficiency) / 100 : 0;
  const wasteArea = slabArea - usedArea;

  const handleAddShape = (shape: Shape) => {
    if (shape.type === "slab") {
      setSlab(shape);
      toast.success("Slab added successfully", {
        description: `${shape.width}cm × ${shape.height}cm workspace ready`,
        icon: <CheckCircle2 className="h-5 w-5 text-success" />
      });
      setEditingShape(null);
    } else {
      if (!slab) {
        toast.error("Slab Required", {
          description: "Please add a slab first to define your workspace",
          icon: <AlertCircle className="h-5 w-5" />
        });
        return;
      }
      
      if (editingShape) {
        setShapes(shapes.map(s => s.id === editingShape.id ? shape : s));
        setArrangedShapes(arrangedShapes.map(s => s.id === editingShape.id ? shape : s));
        toast.success("Shape updated", {
          icon: <CheckCircle2 className="h-5 w-5 text-success" />
        });
        setEditingShape(null);
      } else {
        setShapes([...shapes, shape]);
        toast.success("Shape added", {
          description: `${shapes.length + 1} shapes total`,
          icon: <Plus className="h-5 w-5 text-success" />
        });
      }
    }
  };

  const handleEditShape = (shape: Shape) => {
    setEditingShape(shape);
    toast.info("Edit mode active", {
      description: "Update the shape parameters and save",
    });
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
      toast.error("No slab defined");
      return;
    }
    const arranged = arrangeShapes(shapes, spacing, slab);
    setArrangedShapes(arranged);
    setEfficiency(null);
    toast.success("Quick arrangement complete", {
      description: `${arranged.length}/${shapes.length} shapes placed`,
      icon: <Layout className="h-5 w-5 text-success" />
    });
  };

  const handleOptimize = async () => {
    if (!slab) {
      toast.error("No slab defined");
      return;
    }
    
    if (shapes.length === 0) {
      toast.error("No shapes to optimize");
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
      
      toast.success("Optimization Complete!", {
        description: `${result.efficiency.toFixed(1)}% efficiency • ${result.shapes.length}/${shapes.length} shapes placed`,
        icon: <TrendingUp className="h-5 w-5 text-success" />,
        duration: 5000
      });
      
      if (result.shapes.length < shapes.length) {
        toast.warning("Some shapes didn't fit", {
          description: `${shapes.length - result.shapes.length} shapes couldn't be placed. Consider a larger slab.`,
          duration: 7000
        });
      }
    } catch (error) {
      console.error("Optimization error:", error);
      toast.error("Optimization failed", {
        description: "Please try again or adjust your parameters"
      });
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
        
        // Calculate empty space
        const slabArea = result.slab?.type === "slab" ? result.slab.width * result.slab.height : 0;
        const usedArea = result.shapes.reduce((total, shape) => {
          if ('width' in shape && 'height' in shape) {
            return total + (shape.width * shape.height);
          } else if ('radius' in shape) {
            return total + (Math.PI * shape.radius * shape.radius);
          } else if ('base' in shape && 'height' in shape) {
            return total + ((shape.base * shape.height) / 2);
          }
          return total;
        }, 0);
        const emptySpace = slabArea - usedArea;
        const emptyPercentage = slabArea > 0 ? ((emptySpace / slabArea) * 100) : 0;
        
        toast.success("Import successful", {
          description: `${result.shapes.length} shapes${result.slab ? " and slab" : ""} imported • Empty space: ${emptySpace.toFixed(0)} cm² (${emptyPercentage.toFixed(1)}%)`,
          icon: <CheckCircle2 className="h-5 w-5 text-success" />,
          duration: 7000
        });
      } else {
        toast.warning("No shapes found in DXF file");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Import failed", {
        description: "Please check the file format and try again"
      });
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExport = () => {
    if (arrangedShapes.length === 0) {
      toast.error("Nothing to export", {
        description: "Arrange shapes first before exporting"
      });
      return;
    }
    downloadDXF(arrangedShapes, spacing, includeSlab ? (slab || undefined) : undefined);
    toast.success("DXF exported", {
      description: "File downloaded successfully",
      icon: <Download className="h-5 w-5 text-success" />
    });
  };

  const handleExportSVG = () => {
    if (arrangedShapes.length === 0) {
      toast.error("Nothing to export", {
        description: "Arrange shapes first before exporting"
      });
      return;
    }
    downloadSVG(arrangedShapes, spacing, includeSlab ? (slab || undefined) : undefined);
    toast.success("SVG exported", {
      description: "File downloaded successfully",
      icon: <Download className="h-5 w-5 text-success" />
    });
  };

  // Progressive disclosure: Show relevant UI based on state
  const hasShapes = shapes.length > 0;
  const hasSlab = slab !== null;
  const hasArrangement = arrangedShapes.length > 0;

  return (
    <SidebarProvider defaultOpen={true}>
      <TooltipProvider>
        <div className="h-screen bg-background flex w-full overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Hero Header with Clear Hierarchy */}
              <header className="space-y-4 p-4 border-b border-white/10 bg-background shrink-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl glass-elevated animate-pulse-glow">
                      <Scissors className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-hero bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                        Marble Cut Nesting
                      </h1>
                      <p className="text-body text-muted-foreground mt-2">
                        Professional optimization for precision marble cutting • Save material, reduce waste
                      </p>
                    </div>
                  </div>
                  
                  {/* Quick Stats */}
                  {hasSlab && (
                    <div className="flex gap-3">
                      <div className="metric-display min-w-[100px]">
                        <div className="metric-value text-primary">{shapes.length}</div>
                        <div className="metric-label">Shapes</div>
                      </div>
                      {efficiency !== null && (
                        <div className="metric-display min-w-[120px]">
                          <div className={`metric-value ${efficiency > 70 ? 'text-success' : efficiency > 50 ? 'text-warning' : 'text-destructive'}`}>
                            {efficiency.toFixed(1)}%
                          </div>
                          <div className="metric-label">Efficiency</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </header>

              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 overflow-hidden p-4">
                {/* Left Sidebar - 30% width, secondary visual weight */}
                <div className="xl:col-span-3 space-y-4 overflow-y-auto">
                  {/* Shape Form - Always visible but guided */}
                  <Card className="premium-card">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-subsection flex items-center gap-2">
                          <Plus className="h-5 w-5 text-primary" />
                          Add Shapes
                        </CardTitle>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="tooltip max-w-xs">
                            <p>Start by adding a slab to define your workspace, then add shapes to arrange</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ShapeForm 
                        onAddShape={handleAddShape} 
                        editingShape={editingShape}
                        onCancelEdit={handleCancelEdit}
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Optimization Panel - Progressive disclosure */}
                  {hasSlab && hasShapes && (
                    <Card className="premium-card-elevated border-primary/30">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          <CardTitle className="text-subsection">Optimization</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="spacing" className="text-body font-semibold flex items-center gap-2">
                              Spacing
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent className="tooltip">
                                  <p>Minimum distance between shapes (cm)</p>
                                </TooltipContent>
                              </Tooltip>
                            </Label>
                            <span className="text-caption">{spacing} cm</span>
                          </div>
                          <Input
                            id="spacing"
                            type="number"
                            step="0.1"
                            min="0"
                            max="10"
                            value={spacing}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val >= 0 && val <= 10) {
                                setSpacing(val);
                              } else {
                                toast.error("Invalid spacing", {
                                  description: "Spacing must be between 0 and 10 cm"
                                });
                              }
                            }}
                            className="glass-card"
                          />
                        </div>
                        
                        <div className="space-y-3 pt-2">
                          <Button 
                            onClick={handleOptimize} 
                            disabled={isOptimizing}
                            className="w-full btn-primary h-12 text-base"
                            size="lg"
                          >
                            {isOptimizing ? (
                              <>
                                <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                                Optimizing...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                Optimize Layout
                              </>
                            )}
                          </Button>
                          
                          <Button 
                            onClick={handleArrange} 
                            disabled={isOptimizing}
                            variant="outline"
                            className="w-full glass-panel h-10"
                          >
                            <Layout className="mr-2 h-4 w-4" />
                            Quick Arrange
                          </Button>
                        </div>
                        
                        {isOptimizing && (
                          <div className="space-y-2 p-4 rounded-lg state-info">
                            <div className="flex justify-between text-sm font-medium">
                              <span>Finding optimal layout...</span>
                              <span>{optimizationProgress.toFixed(0)}%</span>
                            </div>
                            <div className="progress-bar h-2.5">
                              <div 
                                className="progress-fill-primary transition-all duration-300"
                                style={{ width: `${optimizationProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {efficiency !== null && !isOptimizing && (
                          <div className="space-y-3 pt-2">
                            <div className={`p-4 rounded-lg ${efficiency > 70 ? 'state-success' : efficiency > 50 ? 'state-warning' : 'state-error'}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold">Material Efficiency</span>
                                <BarChart3 className="h-4 w-4" />
                              </div>
                              <div className="text-3xl font-bold mb-1">{efficiency.toFixed(1)}%</div>
                              <div className="text-micro">
                                {arrangedShapes.length} of {shapes.length} shapes placed
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="metric-display">
                                <div className="metric-value text-success text-xl">
                                  {usedArea.toFixed(0)}
                                </div>
                                <div className="metric-label">Used cm²</div>
                              </div>
                              <div className="metric-display">
                                <div className="metric-value text-destructive text-xl">
                                  {wasteArea.toFixed(0)}
                                </div>
                                <div className="metric-label">Waste cm²</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Main Canvas - 70% width, primary visual weight */}
                <div className="xl:col-span-9 flex flex-col overflow-hidden">
                  {slab ? (
                    <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm">
                      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/5 to-background shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-semibold text-foreground">Canvas</span>
                          {slab && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-sm">
                              <Maximize2 className="h-3.5 w-3.5" />
                              <span className="font-medium">{slab.type === "slab" ? `${slab.width}×${slab.height} cm` : ""}</span>
                            </div>
                          )}
                        </div>
                        <SidebarTrigger>
                          <PanelRightOpen className="h-4 w-4" />
                        </SidebarTrigger>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <ShapeCanvas />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-sm">
                      <div className="empty-state">
                        <div className="w-24 h-24 rounded-2xl glass-elevated animate-pulse-glow mx-auto flex items-center justify-center mb-6">
                          <Layers className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-4 max-w-md">
                          <h3 className="text-section">Get Started</h3>
                          <p className="text-body text-muted-foreground">
                            Begin by adding a slab to define your marble workspace dimensions. 
                            Then add the shapes you need to cut and let the optimizer find the best layout.
                          </p>
                          <div className="flex flex-col gap-2 pt-4">
                            <div className="flex items-center gap-3 text-caption">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">1</div>
                              <span>Add a slab (workspace dimensions)</span>
                            </div>
                            <div className="flex items-center gap-3 text-caption">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">2</div>
                              <span>Add shapes to cut</span>
                            </div>
                            <div className="flex items-center gap-3 text-caption">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">3</div>
                              <span>Click "Optimize Layout" for best arrangement</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Collapsible */}
          <Sidebar side="right" className="border-l">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel className="text-lg font-semibold px-4 py-3">
                  <Layers className="h-5 w-5 inline mr-2" />
                  القائمة
                </SidebarGroupLabel>
                <SidebarGroupContent className="px-4 space-y-4">
                  {/* Export Panel */}
                  {hasArrangement && (
                    <Card className="premium-card border-success/30">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-success" />
                          <CardTitle className="text-subsection">Export</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-caption">Include Slab</Label>
                          <Switch
                            checked={includeSlab}
                            onCheckedChange={setIncludeSlab}
                          />
                        </div>
                        <div className="space-y-2">
                          <Button 
                            onClick={handleExport} 
                            className="w-full btn-success h-10"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export DXF
                          </Button>
                          <Button 
                            onClick={handleExportSVG} 
                            variant="outline"
                            className="w-full glass-panel h-10"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Export SVG
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Import Panel */}
                  <Card className="premium-card">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-subsection flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Import
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="w-full glass-panel h-10"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Import DXF File
                      </Button>
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
                  {hasShapes && (
                    <Card className="premium-card">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-subsection flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Shapes ({shapes.length})
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ShapeList 
                          shapes={shapes} 
                          onRemoveShape={handleRemoveShape}
                          onEditShape={handleEditShape}
                        />
                      </CardContent>
                    </Card>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
        </div>
      </TooltipProvider>
    </SidebarProvider>
  );
};

export default Index;
