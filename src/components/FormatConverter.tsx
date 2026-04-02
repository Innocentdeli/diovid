"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCw, FileIcon, Download } from 'lucide-react';

const FORMATS = [
  { id: 'mp4', label: 'MP4 (H.264)', bitrates: ['5 Mbps', '10 Mbps', '20 Mbps'] },
  { id: 'webm', label: 'WebM (VP9)', bitrates: ['4 Mbps', '8 Mbps', '15 Mbps'] },
  { id: 'mov', label: 'MOV (ProRes)', bitrates: ['50 Mbps', '100 Mbps', '150 Mbps'] },
  { id: 'gif', label: 'GIF Animated', bitrates: ['Low', 'Medium', 'High'] },
  { id: 'png', label: 'PNG Sequence', bitrates: ['Lossless'] },
];

const QUALITY_PRESETS = [
  { name: 'YouTube', resolution: '1080p', bitrate: '10 Mbps', codec: 'H.264' },
  { name: 'TikTok', resolution: '1080p', bitrate: '6 Mbps', codec: 'H.264' },
  { name: 'Instagram', resolution: '1080p', bitrate: '8 Mbps', codec: 'H.264' },
  { name: 'Archive', resolution: '4K', bitrate: '50 Mbps', codec: 'H.264' },
];

interface FormatConverterProps {
  onConvert?: (settings: FormatSettings) => void;
}

interface FormatSettings {
  format: string;
  resolution: '720p' | '1080p' | '2K' | '4K';
  bitrate: string;
  framerate: 24 | 30 | 60;
  codec: string;
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
  audioCodec: 'aac' | 'mp3' | 'opus';
  audioBitrate: '128k' | '192k' | '256k' | '320k';
}

const DEFAULT_SETTINGS: FormatSettings = {
  format: 'mp4',
  resolution: '1080p',
  bitrate: '10 Mbps',
  framerate: 30,
  codec: 'H.264',
  preset: 'medium',
  audioCodec: 'aac',
  audioBitrate: '192k',
};

export default function FormatConverter({ onConvert }: FormatConverterProps) {
  const [settings, setSettings] = useState<FormatSettings>(DEFAULT_SETTINGS);

  const handleChange = (key: keyof FormatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof QUALITY_PRESETS[0]) => {
    setSettings({
      ...settings,
      resolution: preset.resolution as any,
      bitrate: preset.bitrate,
    });
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const handleConvert = () => {
    onConvert?.(settings);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
          <FileIcon size={20} className="text-primary" />
          Format Converter & Bitrate Optimizer
        </h3>
        <p className="text-sm text-foreground/60">Convert to multiple formats and optimize quality</p>
      </div>

      {/* Quick Presets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-foreground/40 uppercase tracking-widest">Platform Presets</p>
        <div className="grid grid-cols-2 gap-2">
          {QUALITY_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-foreground/70 transition-all text-left"
            >
              <div className="font-medium text-foreground">{preset.name}</div>
              <div className="text-[10px] text-foreground/40">{preset.resolution} • {preset.bitrate}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <label className="text-xs font-semibold text-foreground/60 uppercase tracking-widest">Output Format</label>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(fmt => (
            <button
              key={fmt.id}
              onClick={() => handleChange('format', fmt.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                settings.format === fmt.id
                  ? 'bg-primary text-white shadow-glow-primary'
                  : 'bg-white/5 text-foreground/60 hover:bg-white/10'
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Video Settings */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
        <h4 className="text-sm font-semibold">Video Settings</h4>

        <div className="space-y-2">
          <label className="text-xs font-medium">Resolution</label>
          <select
            value={settings.resolution}
            onChange={(e) => handleChange('resolution', e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
          >
            <option>720p</option>
            <option>1080p</option>
            <option>2K</option>
            <option>4K</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Framerate</label>
          <div className="grid grid-cols-3 gap-2">
            {[24, 30, 60].map(fps => (
              <button
                key={fps}
                onClick={() => handleChange('framerate', fps)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  settings.framerate === fps
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                }`}
              >
                {fps} fps
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-xs font-medium">Target Bitrate</label>
            <span className="text-xs text-primary">{settings.bitrate}</span>
          </div>
          <input
            type="text"
            value={settings.bitrate}
            onChange={(e) => handleChange('bitrate', e.target.value)}
            placeholder="e.g., 10 Mbps"
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Encoding Preset</label>
          <select
            value={settings.preset}
            onChange={(e) => handleChange('preset', e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
          >
            <option>ultrafast</option>
            <option>fast</option>
            <option>medium</option>
            <option>slow</option>
            <option>veryslow</option>
          </select>
          <p className="text-xs text-foreground/40">Slower = better quality but longer processing</p>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="bg-white/5 rounded-lg p-4 space-y-4 border border-white/10">
        <h4 className="text-sm font-semibold">Audio Settings</h4>

        <div className="space-y-2">
          <label className="text-xs font-medium">Audio Codec</label>
          <div className="grid grid-cols-3 gap-2">
            {(['aac', 'mp3', 'opus'] as const).map(codec => (
              <button
                key={codec}
                onClick={() => handleChange('audioCodec', codec)}
                className={`px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                  settings.audioCodec === codec
                    ? 'bg-primary text-white'
                    : 'bg-white/5 text-foreground/60 hover:bg-white/10'
                }`}
              >
                {codec.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium">Audio Bitrate</label>
          <select
            value={settings.audioBitrate}
            onChange={(e) => handleChange('audioBitrate', e.target.value)}
            className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-xs outline-none focus:border-primary/60"
          >
            <option>128k</option>
            <option>192k</option>
            <option>256k</option>
            <option>320k</option>
          </select>
        </div>
      </div>

      {/* Info */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
        <p className="text-xs text-primary">
          <strong>Estimated file size:</strong> Will be calculated during conversion based on duration and bitrate.
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button
          onClick={resetSettings}
          className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2"
        >
          <RotateCw size={16} />
          Reset
        </button>
        <button
          onClick={handleConvert}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-glow-primary flex items-center justify-center gap-2"
        >
          <Download size={16} />
          Convert
        </button>
      </div>
    </div>
  );
}
