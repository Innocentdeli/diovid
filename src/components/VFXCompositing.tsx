'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Eye, EyeOff, Plus, Trash2, Move, Copy, Settings, Wand2, Scissors, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface CompositingLayer {
  id: string;
  name: string;
  type: 'video' | 'image' | 'text' | 'effect' | 'mask';
  visible: boolean;
  opacity: number;
  blendMode: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  mask?: string;
  effects: string[];
}

interface VFXCompositingProps {
  onLayerUpdate?: (layers: CompositingLayer[]) => void;
}

export default function VFXCompositing({ onLayerUpdate }: VFXCompositingProps) {
  const [layers, setLayers] = useState<CompositingLayer[]>([
    {
      id: 'base_video',
      name: 'Base Video',
      type: 'video',
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      effects: []
    }
  ]);

  const [selectedLayer, setSelectedLayer] = useState<string>('base_video');
  const [showEffects, setShowEffects] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const blendModes = [
    'normal', 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light',
    'color-dodge', 'color-burn', 'darken', 'lighten', 'difference', 'exclusion'
  ];

  const effectPresets = {
    glow: { name: 'Glow Effect', params: { intensity: 50, color: '#ffffff' } },
    shadow: { name: 'Drop Shadow', params: { distance: 10, angle: 45, opacity: 75 } },
    blur: { name: 'Gaussian Blur', params: { radius: 5 } },
    sharpen: { name: 'Sharpen', params: { amount: 100 } },
    vignette: { name: 'Vignette', params: { intensity: 30, roundness: 50 } },
    chromatic: { name: 'Chromatic Aberration', params: { red: 2, green: 0, blue: -2 } },
    film_grain: { name: 'Film Grain', params: { intensity: 25, size: 1 } },
    color_correction: { name: 'Color Correction', params: { brightness: 0, contrast: 0, saturation: 0 } }
  };

  const addLayer = (type: CompositingLayer['type']) => {
    const newLayer: CompositingLayer = {
      id: `layer_${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Layer ${layers.length + 1}`,
      type,
      visible: true,
      opacity: 100,
      blendMode: 'normal',
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
      effects: []
    };

    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  };

  const updateLayer = (layerId: string, updates: Partial<CompositingLayer>) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    ));
    onLayerUpdate?.(layers);
  };

  const deleteLayer = (layerId: string) => {
    if (layerId === 'base_video') return; // Can't delete base layer
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer('base_video');
    }
  };

  const duplicateLayer = (layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const duplicate: CompositingLayer = {
      ...layer,
      id: `layer_${Date.now()}`,
      name: `${layer.name} Copy`,
      position: { x: layer.position.x + 10, y: layer.position.y + 10 }
    };

    setLayers(prev => [...prev, duplicate]);
    setSelectedLayer(duplicate.id);
  };

  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const currentIndex = layers.findIndex(l => l.id === layerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up'
      ? Math.max(0, currentIndex - 1)
      : Math.min(layers.length - 1, currentIndex + 1);

    if (newIndex === currentIndex) return;

    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(currentIndex, 1);
    newLayers.splice(newIndex, 0, movedLayer);

    setLayers(newLayers);
  };

  const addEffect = (layerId: string, effectType: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer || layer.effects.includes(effectType)) return;

    updateLayer(layerId, {
      effects: [...layer.effects, effectType]
    });
  };

  const removeEffect = (layerId: string, effectType: string) => {
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    updateLayer(layerId, {
      effects: layer.effects.filter(e => e !== effectType)
    });
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎬';
      case 'image': return '🖼️';
      case 'text': return '📝';
      case 'effect': return '✨';
      case 'mask': return '🎭';
      default: return '📄';
    }
  };

  const selectedLayerData = layers.find(l => l.id === selectedLayer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">VFX Compositing</h3>
          <p className="text-sm text-gray-400">Professional multi-layer compositing and visual effects</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {layers.length} Layers
          </Badge>
          <Badge variant="neutral">
            {layers.filter(l => l.visible).length} Visible
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Layer Stack */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Layer Stack</h4>
            <div className="flex gap-1">
              {(['video', 'image', 'text', 'effect', 'mask'] as const).map((type) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  onClick={() => addLayer(type)}
                  className="px-2"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedLayer === layer.id
                    ? 'bg-blue-500/20 border border-blue-500'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
                onClick={() => setSelectedLayer(layer.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getLayerIcon(layer.type)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="p-1"
                  >
                    {layer.visible ? (
                      <Eye className="w-3 h-3" />
                    ) : (
                      <EyeOff className="w-3 h-3 opacity-50" />
                    )}
                  </Button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {layer.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {layer.blendMode} • {layer.opacity}%
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1"
                  >
                    ▲
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, 'down');
                    }}
                    disabled={index === layers.length - 1}
                    className="p-1"
                  >
                    ▼
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateLayer(layer.id);
                    }}
                    className="p-1"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  {layer.id !== 'base_video' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteLayer(layer.id);
                      }}
                      className="p-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Layer Properties */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-white mb-4">Layer Properties</h4>

          {selectedLayerData && (
            <div className="space-y-4">
              {/* Basic Properties */}
              <div>
                <label className="text-xs text-gray-400">Layer Name</label>
                <input
                  type="text"
                  value={selectedLayerData.name}
                  onChange={(e) => updateLayer(selectedLayer, { name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400">Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={selectedLayerData.opacity}
                  onChange={(e) => updateLayer(selectedLayer, { opacity: parseInt(e.target.value) })}
                  className="w-full mt-1"
                />
                <div className="text-xs text-gray-400 mt-1">{selectedLayerData.opacity}%</div>
              </div>

              <div>
                <label className="text-xs text-gray-400">Blend Mode</label>
                <select
                  value={selectedLayerData.blendMode}
                  onChange={(e) => updateLayer(selectedLayer, { blendMode: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                >
                  {blendModes.map(mode => (
                    <option key={mode} value={mode}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transform */}
              <div className="pt-4 border-t border-gray-700">
                <h5 className="text-xs font-medium text-white mb-3">Transform</h5>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-400">X Position</label>
                    <input
                      type="number"
                      value={selectedLayerData.position.x}
                      onChange={(e) => updateLayer(selectedLayer, {
                        position: { ...selectedLayerData.position, x: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Y Position</label>
                    <input
                      type="number"
                      value={selectedLayerData.position.y}
                      onChange={(e) => updateLayer(selectedLayer, {
                        position: { ...selectedLayerData.position, y: parseInt(e.target.value) || 0 }
                      })}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Scale</label>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedLayerData.scale}
                      onChange={(e) => updateLayer(selectedLayer, { scale: parseFloat(e.target.value) || 1 })}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Rotation</label>
                    <input
                      type="number"
                      value={selectedLayerData.rotation}
                      onChange={(e) => updateLayer(selectedLayer, { rotation: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Effects Panel */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-white">Effects</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEffects(!showEffects)}
            >
              <Wand2 className="w-4 h-4" />
            </Button>
          </div>

          {selectedLayerData && (
            <div className="space-y-3">
              {/* Applied Effects */}
              <div>
                <h5 className="text-xs font-medium text-gray-400 mb-2">Applied Effects</h5>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedLayerData.effects.map((effect) => (
                    <div key={effect} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                      <span className="text-xs text-white">{effectPresets[effect as keyof typeof effectPresets]?.name || effect}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEffect(selectedLayer, effect)}
                        className="p-1 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                  {selectedLayerData.effects.length === 0 && (
                    <div className="text-xs text-gray-500 italic text-center py-2">
                      No effects applied
                    </div>
                  )}
                </div>
              </div>

              {/* Effect Presets */}
              <AnimatePresence>
                {showEffects && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <h5 className="text-xs font-medium text-gray-400">Add Effect</h5>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {Object.entries(effectPresets).map(([key, preset]) => (
                        <Button
                          key={key}
                          variant="outline"
                          size="sm"
                          onClick={() => addEffect(selectedLayer, key)}
                          disabled={selectedLayerData.effects.includes(key)}
                          className="justify-start text-left"
                        >
                          <Zap className="w-3 h-3 mr-2" />
                          <div>
                            <div className="text-xs font-medium">{preset.name}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-700">
                <h5 className="text-xs font-medium text-gray-400 mb-2">Quick Actions</h5>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLayer(selectedLayer, { opacity: 50 })}
                  >
                    50% Opacity
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLayer(selectedLayer, { blendMode: 'multiply' })}
                  >
                    Multiply
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLayer(selectedLayer, { scale: 1.2 })}
                  >
                    Scale Up
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateLayer(selectedLayer, { rotation: 0, position: { x: 0, y: 0 }, scale: 1 })}
                  >
                    Reset Transform
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Preview Canvas */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white">Compositing Preview</h4>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Render Settings
            </Button>
            <Button variant="primary" size="sm">
              <Scissors className="w-4 h-4 mr-2" />
              Export Composite
            </Button>
          </div>
        </div>

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            width={1920}
            height={1080}
          />

          {/* Layer Preview Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {layers.filter(layer => layer.visible).map((layer, index) => (
              <div
                key={layer.id}
                className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10"
                style={{
                  left: `${50 + layer.position.x}%`,
                  top: `${50 + layer.position.y}%`,
                  transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                  width: '200px',
                  height: '100px',
                  opacity: layer.opacity / 100
                }}
              >
                <div className="absolute -top-6 left-0 text-xs text-blue-400 bg-gray-900 px-2 py-1 rounded">
                  {layer.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          Interactive preview - drag layers to reposition, use properties panel for precise control
        </div>
      </Card>
    </motion.div>
  );
}