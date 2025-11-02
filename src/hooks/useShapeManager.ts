import { useState } from 'react';
import { Shape } from '../types/shapes';

export const useShapeManager = (initialShapes: Shape[]) => {
  const [shapes, setShapes] = useState<Shape[]>(initialShapes);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedShape = shapes.find(s => s.id === selectedId);

  const updateShape = (id: string, updates: Partial<Shape>) => {
    setShapes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const addShape = (shape: Shape) => {
    setShapes(prev => [...prev, shape]);
  };

  const removeShape = (id: string) => {
    setShapes(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const duplicateShape = (id: string) => {
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    
    const newShape: Shape = {
      ...shape,
      id: `shape-${Date.now()}`,
      x: shape.x + 2,
      y: shape.y + 2
    };
    
    addShape(newShape);
    setSelectedId(newShape.id);
  };

  const replacePreview = (previewShape: Shape, finalId: string) => {
    setShapes(prev => 
      prev.filter(s => s.id !== 'preview-shape').concat({ ...previewShape, id: finalId })
    );
  };

  return {
    shapes,
    setShapes,
    selectedId,
    setSelectedId,
    selectedShape,
    updateShape,
    addShape,
    removeShape,
    duplicateShape,
    replacePreview
  };
};
