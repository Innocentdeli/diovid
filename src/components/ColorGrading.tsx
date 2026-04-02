"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sliders, RotateCcw, Download } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ColorGradingProps {
  onApply?: (settings: ColorGradingSettings) => void;
}

interface ColorGradingSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  temperature: number;
  tint: number;
  shadows: number;
  highlights: number;
  blacks: number;
  whites: number;
  vibrance: number;
  clarity: number;
}

const DEFAULT_SETTINGS: ColorGradingSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  temperature: 0,
  tint: 0,
  shadows: 0,
  highlights: 0,
  blacks: 0,
  whites: 0,
  vibrance: 0,
  clarity: 0,
};

const PRESETS = {
  cinematic: {
    brightness: -10,
    contrast: 15,
    saturation: -5,
    hue: 0,
    temperature: -20,
    tint: 5,
    shadows: 10,
    highlights: -5,
    blacks: -15,
    whites: 5,
    vibrance: 10,
    clarity: 20,
  },
  warm: {
    brightness: 5,
    contrast: 10,
    saturation: 15,
    hue: 0,
    temperature: 40,
    tint: 10,
    shadows: 0,
    highlights: 10,
    blacks: 0,
    whites: 5,
    vibrance: 20,
    clarity: 10,
  },
  cool: {
    brightness: 0,
    contrast: 5,
    saturation: -10,
    hue: 0,
    temperature: -40,
    tint: -10,
    shadows: 0,
    highlights: 5,
    blacks: 0,
    whites: 0,
    vibrance: 0,
    clarity: 15,
  },
  vintage: {
    brightness: 10,
    contrast: -10,
    saturation: -30,
    hue: 5,
    temperature: 30,
    tint: 15,
    shadows: -5,
    highlights: -10,
    blacks: 10,
    whites: -5,
    vibrance: -20,
    clarity: 0,
  },
};

export default function ColorGrading({ onApply }: ColorGradingProps) {
  const [settings, setSettings] = useState<ColorGradingSettings>(DEFAULT_SETTINGS);
  const [presetName, setPresetName] = useState<string>('custom');

  const handleSliderChange = (key: keyof ColorGradingSettings, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setPresetName('custom');
  };

  const applyPreset = (preset: keyof typeof PRESETS) => {
    setSettings(PRESETS[preset]);
    setPresetName(preset);
    onApply?.(PRESETS[preset]);
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setPresetName('custom');
  };

  const handleApply = () => {
    onApply?.(settings);
  };

  const getFilterStyle = (): React.CSSProperties => {
    return {
      filter: `
        brightness(${100 + settings.brightness}%)
        contrast(${100 + settings.contrast}%)
        saturate(${100 + settings.saturation}%)
        hue-rotate(${settings.hue}deg)
        opacity(1)
      `,
    };
  };

  const sliders = [
    { key: 'brightness', label: 'Brightness', min: -100, max: 100 },
    { key: 'contrast', label: 'Contrast', min: -100, max: 100 },
    { key: 'saturation', label: 'Saturation', min: -100, max: 100 },
    { key: 'hue', label: 'Hue Shift', min: -180, max: 180 },
    { key: 'temperature', label: 'Temperature', min: -100, max: 100 },
    { key: 'tint', label: 'Tint', min: -50, max: 50 },
    { key: 'shadows', label: 'Shadows', min: -100, max: 100 },
    { key: 'highlights', label: 'Highlights', min: -100, max: 100 },
    { key: 'blacks', label: 'Blacks Point', min: -50, max: 50 },
    { key: 'whites', label: 'Whites Point', min: -50, max: 50 },
    { key: 'vibrance', label: 'Vibrance', min: -100, max: 100 },
    { key: 'clarity', label: 'Clarity', min: -100, max: 100 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <Sliders size={20} className="text-primary" />
          Color Grading Studio
        </h3>
        <p className="text-sm text-foreground/60">Professional color correction and grading tools</p>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Quick Presets</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(PRESETS).map(([name]) => (
            <button
              key={name}
              onClick={() => applyPreset(name as keyof typeof PRESETS)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                presetName === name
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-white/5 text-foreground/70 hover:bg-white/10'
              }`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Preview</p>
        <div 
          className="w-full aspect-video rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-white/10"
          style={getFilterStyle()}
        >
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-foreground/60">Color preview</p>
              <p className="text-xs text-foreground/40 mt-1">Preset: {presetName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Color Sliders */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Adjustments</p>
        {sliders.map(({ key, label, min, max }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{label}</label>
              <span className="text-xs text-primary font-mono">
                {settings[key as keyof ColorGradingSettings]}
              </span>
            </div>
            <input
              type="range"
              min={min}
              max={max}
              value={settings[key as keyof ColorGradingSettings]}
              onChange={(e) => handleSliderChange(key as keyof ColorGradingSettings, Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, rgba(91, 127, 255, 0.2) 0%, rgba(91, 127, 255, 0.6) ${
                  ((settings[key as keyof ColorGradingSettings] - min) / (max - min)) * 100
                }%, rgba(255, 255, 255, 0.1) ${((settings[key as keyof ColorGradingSettings] - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`,
              }}
            />
          </motion.div>
        ))}
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
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow-primary flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Apply Grade
        </button>
      </div>
    </div>
  );
}
