"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Trash2, RotateCcw } from 'lucide-react';

interface FullBodyAnimationProps {
  onApply?: (settings: FullBodyAnimationSettings) => void;
}

interface FullBodyAnimationSettings {
  animation_mode: 'chest_up' | 'full_body' | 'walking' | 'interaction';
  walk_speed: number;
  walk_direction: 'forward' | 'backward' | 'left' | 'right';
  interaction_type: 'pick_up' | 'sit' | 'stand' | 'lean' | 'none';
  interaction_target: string;
  pose_variation: number;
  movement_intensity: number;
  idle_motion: boolean;
  character_spacing: number;
  multi_char_interaction: boolean;
}

const DEFAULT_SETTINGS: FullBodyAnimationSettings = {
  animation_mode: 'chest_up',
  walk_speed: 1,
  walk_direction: 'forward',
  interaction_type: 'none',
  interaction_target: '',
  pose_variation: 50,
  movement_intensity: 50,
  idle_motion: true,
  character_spacing: 50,
  multi_char_interaction: false,
};

export default function FullBodyAnimation({ onApply }: FullBodyAnimationProps) {
  const [settings, setSettings] = useState<FullBodyAnimationSettings>(DEFAULT_SETTINGS);
  const [characters, setCharacters] = useState<Array<{ id: string; name: string }>>([]);

  const handleChange = (key: keyof FullBodyAnimationSettings, value: any) => {
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
          <Users size={20} className="text-primary" />
          Full Body Animation & Interactions
        </h3>
        <p className="text-sm text-foreground/60">Advanced character movement and scene interactions</p>
      </div>

      {/* Animation Mode */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Animation Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {(['chest_up', 'full_body', 'walking', 'interaction'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleChange('animation_mode', mode)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                settings.animation_mode === mode
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-white/5 text-foreground/60 hover:bg-white/10'
              }`}
            >
              {mode.includes('_') ? mode.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Full Body / Walking */}
      {(settings.animation_mode === 'full_body' || settings.animation_mode === 'walking') && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
          {settings.animation_mode === 'walking' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Walk Speed</label>
                  <span className="text-xs text-primary">{settings.walk_speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={settings.walk_speed}
                  onChange={(e) => handleChange('walk_speed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Walk Direction</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['forward', 'backward', 'left', 'right'] as const).map(dir => (
                    <button
                      key={dir}
                      onClick={() => handleChange('walk_direction', dir)}
                      className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                        settings.walk_direction === dir
                          ? 'bg-primary text-white'
                          : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                      }`}
                    >
                      {dir.charAt(0).toUpperCase() + dir.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Pose Variation</label>
              <span className="text-xs text-primary">{settings.pose_variation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.pose_variation}
              onChange={(e) => handleChange('pose_variation', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40">Variety in natural poses</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Movement Intensity</label>
              <span className="text-xs text-primary">{settings.movement_intensity}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.movement_intensity}
              onChange={(e) => handleChange('movement_intensity', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.idle_motion}
              onChange={(e) => handleChange('idle_motion', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            Subtle idle motion when stationary
          </label>
        </motion.div>
      )}

      {/* Interactions */}
      {settings.animation_mode === 'interaction' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
          <div className="space-y-2">
            <label className="text-xs font-medium">Interaction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['pick_up', 'sit', 'stand', 'lean', 'none'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleChange('interaction_type', type)}
                  className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                    settings.interaction_type === type
                      ? 'bg-primary text-white'
                      : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                  }`}
                >
                  {type.includes('_') ? type.split('_').join(' ') : type}
                </button>
              ))}
            </div>
          </div>

          {settings.interaction_type !== 'none' && (
            <input
              type="text"
              placeholder="Describe the target object (e.g., 'coffee cup', 'chair')"
              value={settings.interaction_target}
              onChange={(e) => handleChange('interaction_target', e.target.value)}
              className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
            />
          )}
        </motion.div>
      )}

      {/* Multi-Character Interaction */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={settings.multi_char_interaction}
            onChange={(e) => handleChange('multi_char_interaction', e.target.checked)}
            className="w-4 h-4 rounded"
          />
          Enable Multi-Character Interaction
        </label>

        {settings.multi_char_interaction && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Character Spacing</label>
                <span className="text-xs text-primary">{settings.character_spacing}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="10"
                value={settings.character_spacing}
                onChange={(e) => handleChange('character_spacing', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-foreground/40">Distance between characters</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">Characters in Scene</label>
                <button className="p-1 rounded hover:bg-white/10 transition-colors">
                  <Plus size={16} className="text-primary" />
                </button>
              </div>
              <div className="space-y-2">
                {characters.map(char => (
                  <div key={char.id} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                    <span className="text-xs">{char.name}</span>
                    <button className="p-1 rounded hover:bg-error/20 transition-colors">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
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
          Apply Animation
        </button>
      </div>
    </div>
  );
}
