"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, RotateCcw } from 'lucide-react';

interface AudioEffectsProps {
  onApply?: (settings: AudioEffectsSettings) => void;
}

interface AudioEffectsSettings {
  eq_low: number;
  eq_mid: number;
  eq_high: number;
  compression_ratio: number;
  compression_threshold: number;
  compression_attack: number;
  compression_release: number;
  reverb_amount: number;
  reverb_room_size: number;
  noise_gate_threshold: number;
  de_esser_frequency: number;
  de_esser_amount: number;
  normalization_level: number;
}

const DEFAULT_SETTINGS: AudioEffectsSettings = {
  eq_low: 0,
  eq_mid: 0,
  eq_high: 0,
  compression_ratio: 1,
  compression_threshold: -20,
  compression_attack: 0.005,
  compression_release: 0.25,
  reverb_amount: 0,
  reverb_room_size: 0.5,
  noise_gate_threshold: -60,
  de_esser_frequency: 5000,
  de_esser_amount: 0,
  normalization_level: -3,
};

export default function AudioEffects({ onApply }: AudioEffectsProps) {
  const [settings, setSettings] = useState<AudioEffectsSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'eq' | 'compression' | 'reverb' | 'cleanup'>('eq');

  const handleChange = (key: keyof AudioEffectsSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyVoiceEnhance = () => {
    setSettings({
      ...settings,
      eq_low: -2,
      eq_mid: 3,
      eq_high: 2,
      compression_ratio: 4,
      compression_threshold: -18,
      de_esser_amount: 3,
      normalization_level: -2,
    });
  };

  const applyMusicEnhance = () => {
    setSettings({
      ...settings,
      eq_low: 2,
      eq_mid: 1,
      eq_high: 2,
      reverb_amount: 15,
      normalization_level: -1,
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
          <Wand2 size={20} className="text-primary" />
          Advanced Audio Effects
        </h3>
        <p className="text-sm text-foreground/60">Professional audio processing suite</p>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={applyVoiceEnhance}
          className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 text-sm font-semibold text-primary transition-all"
        >
          Voice Enhance
        </button>
        <button
          onClick={applyMusicEnhance}
          className="px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30 hover:bg-secondary/20 text-sm font-semibold text-secondary transition-all"
        >
          Music Boost
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        {['eq', 'compression', 'reverb', 'cleanup'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-foreground/40 hover:text-foreground/60'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* EQ Panel */}
      {activeTab === 'eq' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Low Frequency (Hz)</label>
              <span className="text-xs text-primary">{settings.eq_low.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={settings.eq_low}
              onChange={(e) => handleChange('eq_low', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">200 Hz</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Mid Frequency (Hz)</label>
              <span className="text-xs text-primary">{settings.eq_mid.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={settings.eq_mid}
              onChange={(e) => handleChange('eq_mid', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">2 kHz</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">High Frequency (Hz)</label>
              <span className="text-xs text-primary">{settings.eq_high.toFixed(1)} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="0.1"
              value={settings.eq_high}
              onChange={(e) => handleChange('eq_high', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">8 kHz</p>
          </div>
        </motion.div>
      )}

      {/* Compression Panel */}
      {activeTab === 'compression' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Compression Ratio</label>
              <span className="text-xs text-primary">{settings.compression_ratio.toFixed(1)}:1</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={settings.compression_ratio}
              onChange={(e) => handleChange('compression_ratio', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">How much to reduce loud signals</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Threshold</label>
              <span className="text-xs text-primary">{settings.compression_threshold} dB</span>
            </div>
            <input
              type="range"
              min="-40"
              max="0"
              step="1"
              value={settings.compression_threshold}
              onChange={(e) => handleChange('compression_threshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Level above which compression starts</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Attack Time</label>
              <span className="text-xs text-primary">{(settings.compression_attack * 1000).toFixed(1)} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.1"
              step="0.005"
              value={settings.compression_attack}
              onChange={(e) => handleChange('compression_attack', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Release Time</label>
              <span className="text-xs text-primary">{(settings.compression_release * 1000).toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.05"
              value={settings.compression_release}
              onChange={(e) => handleChange('compression_release', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </motion.div>
      )}

      {/* Reverb Panel */}
      {activeTab === 'reverb' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Reverb Amount</label>
              <span className="text-xs text-primary">{settings.reverb_amount}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.reverb_amount}
              onChange={(e) => handleChange('reverb_amount', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Wet/dry mix for reverberation</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Room Size</label>
              <span className="text-xs text-primary">{(settings.reverb_room_size * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={settings.reverb_room_size}
              onChange={(e) => handleChange('reverb_room_size', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Virtual space size</p>
          </div>
        </motion.div>
      )}

      {/* Cleanup Panel */}
      {activeTab === 'cleanup' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Noise Gate Threshold</label>
              <span className="text-xs text-primary">{settings.noise_gate_threshold} dB</span>
            </div>
            <input
              type="range"
              min="-100"
              max="-20"
              step="5"
              value={settings.noise_gate_threshold}
              onChange={(e) => handleChange('noise_gate_threshold', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Silence anything below this level</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">De-Esser Frequency</label>
              <span className="text-xs text-primary">{settings.de_esser_frequency} Hz</span>
            </div>
            <input
              type="range"
              min="2000"
              max="10000"
              step="500"
              value={settings.de_esser_frequency}
              onChange={(e) => handleChange('de_esser_frequency', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Target frequency for sibilance</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">De-Esser Amount</label>
              <span className="text-xs text-primary">{settings.de_esser_amount} dB</span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={settings.de_esser_amount}
              onChange={(e) => handleChange('de_esser_amount', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Reduce harsh sibilance</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Normalization Target</label>
              <span className="text-xs text-primary">{settings.normalization_level} dB</span>
            </div>
            <input
              type="range"
              min="-12"
              max="0"
              step="0.5"
              value={settings.normalization_level}
              onChange={(e) => handleChange('normalization_level', parseFloat(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-foreground/40 mt-1">Normalize audio level</p>
          </div>
        </motion.div>
      )}

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
