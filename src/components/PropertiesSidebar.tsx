import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Shape } from '../types/shapes';

interface PropertiesSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedShape: Shape | undefined;
  onUpdateMeasurement: (field: string, value: number) => void;
  offsetValue: number;
  setOffsetValue: (value: number) => void;
  filletRadius: number;
  setFilletRadius: (value: number) => void;
}

export const PropertiesSidebar: React.FC<PropertiesSidebarProps> = ({
  isOpen,
  onToggle,
  selectedShape,
  onUpdateMeasurement,
  offsetValue,
  setOffsetValue,
  filletRadius,
  setFilletRadius
}) => {
  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="absolute top-4 right-4 z-10"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={`absolute top-0 right-0 h-full bg-white border-l shadow-lg transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '280px' }}
      >
        <div className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Properties</h3>

          {selectedShape ? (
            <>
              <div className="space-y-3">
                <Label className="font-semibold">Shape: {selectedShape.type}</Label>
                
                {selectedShape.type === 'rectangle' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.width || 0}
                        onChange={(e) => onUpdateMeasurement('width', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.height || 0}
                        onChange={(e) => onUpdateMeasurement('height', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </>
                )}

                {selectedShape.type === 'circle' && (
                  <div className="space-y-1">
                    <Label className="text-xs">Radius (cm)</Label>
                    <Input
                      type="number"
                      value={selectedShape.radius || 0}
                      onChange={(e) => onUpdateMeasurement('radius', parseFloat(e.target.value))}
                      step="0.1"
                      min="0.1"
                    />
                  </div>
                )}

                {selectedShape.type === 'triangle' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Base (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.base || 0}
                        onChange={(e) => onUpdateMeasurement('base', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.height || 0}
                        onChange={(e) => onUpdateMeasurement('height', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </>
                )}

                {selectedShape.type.startsWith('l-shape-') && 'legWidth' in selectedShape && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Width (cm)</Label>
                      <Input
                        type="number"
                        value={'width' in selectedShape ? selectedShape.width : 0}
                        onChange={(e) => onUpdateMeasurement('width', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Height (cm)</Label>
                      <Input
                        type="number"
                        value={'height' in selectedShape ? selectedShape.height : 0}
                        onChange={(e) => onUpdateMeasurement('height', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Leg Width (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.legWidth || 0}
                        onChange={(e) => onUpdateMeasurement('legWidth', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Leg Height (cm)</Label>
                      <Input
                        type="number"
                        value={selectedShape.legHeight || 0}
                        onChange={(e) => onUpdateMeasurement('legHeight', parseFloat(e.target.value))}
                        step="0.1"
                        min="0.1"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="border-t pt-4 space-y-3">
                <Label className="font-semibold">Tools</Label>
                
                <div className="space-y-1">
                  <Label className="text-xs">Offset Distance (cm)</Label>
                  <Input
                    type="number"
                    value={offsetValue}
                    onChange={(e) => setOffsetValue(parseFloat(e.target.value))}
                    step="0.1"
                    min="0.1"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Fillet Radius (cm)</Label>
                  <Input
                    type="number"
                    value={filletRadius}
                    onChange={(e) => setFilletRadius(parseFloat(e.target.value))}
                    step="0.1"
                    min="0.1"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No shape selected</p>
          )}
        </div>
      </div>
    </>
  );
};
