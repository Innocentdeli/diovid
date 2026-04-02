"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers, RotateCcw } from 'lucide-react';

interface GreenScreenProps {
  onApply?: (settings: GreenScreenSettings) => void;
}

interface GreenScreenSettings {
  enabled: boolean;
  color: 'green' | 'blue' | 'red';
  tolerance: number;
  spill_suppression: number;
  edge_feather: number;
  replacement_mode: 'solid' | 'blur' | 'image';
  replacement_color: string;
  blur_strength: number;
}

const DEFAULT_SETTINGS: GreenScreenSettings = {
  enabled: false,
  color: 'green',
  tolerance: 50,
  spill_suppression: 30,
  edge_feather: 5,
  replacement_mode: 'blur',
  replacement_color: '#000000',
  blur_strength: 20,
};

export default function GreenScreen({ onApply }: GreenScreenProps) {
  const [settings, setSettings] = useState<GreenScreenSettings>(DEFAULT_SETTINGS);

  const handleChange = (key: keyof GreenScreenSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleApply = () => {
    onApply?.(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Layers size={20} className="text-primary" />
          Chroma Key / Green Screen
        </h3>
        <p className="text-sm text-foreground/60">Advanced background replacement with color keying</p>
      </div>

      {/* Enable */}
      <div className="flex items-center gap-3 bg-white/5 rounded-lg p-4 border border-white/10">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => handleChange('enabled', e.target.checked)}
          className="w-4 h-4 rounded"
        />
        <label className="text-sm font-medium">Enable Chroma Keying</label>
      </div>

      {settings.enabled && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Color Selection */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Chroma Color</label>
            <div className="grid grid-cols-3 gap-2">
              {(['green', 'blue', 'red'] as const).map(color => (
                <button
                  key={color}
                  onClick={() => handleChange('color', color)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    settings.color === color
                      ? `ring-2 ring-${color}-500`
                      : `bg-${color}-900/20 text-${color}-300 hover:bg-${color}-900/40`
                  }`}
                  style={{
                    backgroundColor: settings.color === color ? 
                      (color === 'green' ? '#004D00' : color === 'blue' ? '#000050' : '#500000') : 
                      (color === 'green' ? '#002D00' : color === 'blue' ? '#000030' : '#300000'),
                  }}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tolerance */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Color Tolerance</label>
              <span className="text-xs text-primary">{settings.tolerance}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={settings.tolerance}
              onChange={(e) => handleChange('tolerance', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40">How strictly to match the chroma color</p>
          </div>

          {/* Spill Suppression */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Spill Suppression</label>
              <span className="text-xs text-primary">{settings.spill_suppression}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.spill_suppression}
              onChange={(e) => handleChange('spill_suppression', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40">Remove color fringing on edges</p>
          </div>

          {/* Edge Feather */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Edge Feather</label>
              <span className="text-xs text-primary">{settings.edge_feather}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={settings.edge_feather}
              onChange={(e) => handleChange('edge_feather', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40">Soften edges between kept and removed areas</p>
          </div>

          {/* Background Replacement */}
          <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
            <label className="text-sm font-medium">Background Replacement</label>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground/60">Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {(['solid', 'blur', 'image'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleChange('replacement_mode', mode)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      settings.replacement_mode === mode
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                    }`}
                  >
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {settings.replacement_mode === 'solid' && (
              <div className="space-y-2">
                <label className="text-xs font-medium">Solid Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.replacement_color}
                    onChange={(e) => handleChange('replacement_color', e.target.value)}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.replacement_color}
                    onChange={(e) => handleChange('replacement_color', e.target.value)}
                    className="flex-1 px-3 py-2 rounded bg-white/5 border border-white/10 text-xs"
                  />
                </div>
              </div>
            )}

            {settings.replacement_mode === 'blur' && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm">Blur Strength</label>
                  <span className="text-xs text-primary">{settings.blur_strength}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.blur_strength}
                  onChange={(e) => handleChange('blur_strength', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {settings.replacement_mode === 'image' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/60">Upload Background Image</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                  <p className="text-xs text-foreground/40">Drop image or click to upload</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Preview */}
      <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-surface/50 to-background/50 border border-white/10 flex items-center justify-center">
        <p className="text-xs text-foreground/40">Chroma key preview</p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={resetSettings}
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Reset
        </button>
        <button
          onClick={handleApply}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow-primary"
        >
          Apply Keying
        </button>
      </div>
    </div>
  );
}
