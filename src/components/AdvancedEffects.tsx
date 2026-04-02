"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, RotateCcw } from 'lucide-react';

interface AdvancedEffectsProps {
  onApply?: (settings: AdvancedEffectsSettings) => void;
}

interface AdvancedEffectsSettings {
  motionBlur: number;
  depthOfField: number;
  dofFocusDistance: number;
  dofAperture: number;
  particles_enabled: boolean;
  particles_intensity: number;
  particles_type: 'dust' | 'bokeh' | 'light' | 'smoke';
  glitch_amount: number;
  chromatic_aberration: number;
  vignette: number;
}

const DEFAULT_SETTINGS: AdvancedEffectsSettings = {
  motionBlur: 0,
  depthOfField: 0,
  dofFocusDistance: 50,
  dofAperture: 5.6,
  particles_enabled: false,
  particles_intensity: 0,
  particles_type: 'dust',
  glitch_amount: 0,
  chromatic_aberration: 0,
  vignette: 0,
};

export default function AdvancedEffects({ onApply }: AdvancedEffectsProps) {
  const [settings, setSettings] = useState<AdvancedEffectsSettings>(DEFAULT_SETTINGS);

  const handleChange = (key: keyof AdvancedEffectsSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyCinematicLook = () => {
    setSettings({
      ...settings,
      motionBlur: 15,
      depthOfField: 20,
      dofFocusDistance: 40,
      dofAperture: 2.8,
      vignette: 30,
      chromatic_aberration: 2,
    });
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
          <Flame size={20} className="text-primary" />
          Advanced Visual Effects
        </h3>
        <p className="text-sm text-foreground/60">Professional motion and visual effects</p>
      </div>

      {/* Quick Presets */}
      <button
        onClick={applyCinematicLook}
        className="w-full px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 text-sm font-semibold text-primary transition-all"
      >
        Apply Cinematic Look
      </button>

      {/* Motion Blur */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Motion Blur</label>
          <span className="text-xs text-primary">{settings.motionBlur}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={settings.motionBlur}
          onChange={(e) => handleChange('motionBlur', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-foreground/40">Camera and subject movement blur</p>
      </motion.div>

      {/* Depth of Field */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.depthOfField > 0}
            onChange={(e) => handleChange('depthOfField', e.target.checked ? 20 : 0)}
            className="w-4 h-4 rounded"
          />
          <label className="text-sm font-medium">Depth of Field (Focus Blur)</label>
        </div>

        {settings.depthOfField > 0 && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Blur Amount</label>
                <span className="text-xs text-primary">{settings.depthOfField}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.depthOfField}
                onChange={(e) => handleChange('depthOfField', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Focus Distance</label>
                <span className="text-xs text-primary">{settings.dofFocusDistance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.dofFocusDistance}
                onChange={(e) => handleChange('dofFocusDistance', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/40">Where the camera focuses</p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Aperture (f-stop)</label>
                <span className="text-xs text-primary">f/{settings.dofAperture.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="22"
                step="0.5"
                value={settings.dofAperture}
                onChange={(e) => handleChange('dofAperture', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/40">Lower = shallower depth of field</p>
            </div>
          </>
        )}
      </div>

      {/* Particles */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={settings.particles_enabled}
            onChange={(e) => handleChange('particles_enabled', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label className="text-sm font-medium">Particle Effects</label>
        </div>

        {settings.particles_enabled && (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground/60">Particle Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['dust', 'bokeh', 'light', 'smoke'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => handleChange('particles_type', type)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                      settings.particles_type === type
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                    }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm">Intensity</label>
                <span className="text-xs text-primary">{settings.particles_intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={settings.particles_intensity}
                onChange={(e) => handleChange('particles_intensity', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </>
        )}
      </div>

      {/* Glitch & Aberration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Glitch Effect</label>
            <span className="text-xs text-primary">{settings.glitch_amount}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={settings.glitch_amount}
            onChange={(e) => handleChange('glitch_amount', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Chromatic Aberration</label>
            <span className="text-xs text-primary">{settings.chromatic_aberration}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={settings.chromatic_aberration}
            onChange={(e) => handleChange('chromatic_aberration', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-foreground/40">RGB color channel separation</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Vignette</label>
            <span className="text-xs text-primary">{settings.vignette}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={settings.vignette}
            onChange={(e) => handleChange('vignette', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-foreground/40">Darken edges for focus</p>
        </div>
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
          Apply Effects
        </button>
      </div>
    </div>
  );
}
