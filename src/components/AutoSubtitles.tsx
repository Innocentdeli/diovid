"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { FileText, Download, Settings, Upload, Play, Mic, Trash2, Edit3, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Subtitle } from '@/app/actions/speechToText';
import { generateSRTSubtitles, generateVTTSubtitles } from '@/lib/subtitleUtils';

export function AutoSubtitles() {
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [fontSize, setFontSize] = useState(16);
  const [position, setPosition] = useState<'bottom' | 'center' | 'top'>('bottom');
  const [enableDiarization, setEnableDiarization] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const LANGUAGES = [
    { code: 'en-US', label: 'English (US)' },
    { code: 'en-GB', label: 'English (UK)' },
    { code: 'es-ES', label: 'Spanish' },
    { code: 'fr-FR', label: 'French' },
    { code: 'de-DE', label: 'German' },
    { code: 'pt-BR', label: 'Portuguese (BR)' },
    { code: 'ja-JP', label: 'Japanese' },
    { code: 'zh-CN', label: 'Chinese (Simplified)' },
    { code: 'ar-SA', label: 'Arabic' },
    { code: 'hi-IN', label: 'Hindi' },
  ];

  const readFileAsBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve({ base64, mimeType: file.type || 'audio/wav' });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateSubtitles = useCallback(async (file: File) => {
    setIsGenerating(true);
    setError(null);

    try {
      const { base64, mimeType } = await readFileAsBase64(file);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          language,
          enableSpeakerDiarization: enableDiarization,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Transcription failed');
      }

      setSubtitles(data.subtitles || []);
    } catch (err: any) {
      setError(err.message || 'Could not transcribe audio');
    } finally {
      setIsGenerating(false);
    }
  }, [language, enableDiarization]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) generateSubtitles(file);
  };

  const deleteSubtitle = (id: string) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };

  const startEdit = (sub: Subtitle) => {
    setEditingId(sub.id);
    setEditText(sub.text);
  };

  const saveEdit = (id: string) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, text: editText } : s));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const downloadSRT = () => {
    const srt = generateSRTSubtitles(subtitles);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadVTT = () => {
    const vtt = generateVTTSubtitles(subtitles);
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.vtt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-4 bg-background p-4 rounded-lg border border-border/30">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <FileText size={20} />
          Auto Subtitles
          <span className="text-xs font-normal text-foreground/50 ml-1">via Gemini AI</span>
        </h2>
        {subtitles.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={downloadSRT}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface/60 border border-border/30 hover:border-primary/50 transition-all flex items-center gap-1.5"
            >
              <Download size={12} /> SRT
            </button>
            <button
              onClick={downloadVTT}
              className="px-3 py-1.5 text-xs rounded-lg bg-surface/60 border border-border/30 hover:border-primary/50 transition-all flex items-center gap-1.5"
            >
              <Download size={12} /> VTT
            </button>
          </div>
        )}
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-foreground/50 mb-1">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-surface/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-foreground/50 mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as 'bottom' | 'center' | 'top')}
            className="w-full bg-surface/50 border border-border/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          >
            <option value="bottom">Bottom</option>
            <option value="center">Center</option>
            <option value="top">Top</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enableDiarization}
            onChange={(e) => setEnableDiarization(e.target.checked)}
            className="rounded border-border/50"
          />
          <span className="text-foreground/70">Speaker identification</span>
        </label>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-foreground/50">Font size</span>
          <input
            type="range" min={10} max={28} value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-xs font-mono w-6">{fontSize}</span>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer border-border/30 hover:border-primary/40"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-foreground/60">Transcribing with Gemini AI...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Mic size={28} className="text-primary/50" />
            <p className="text-sm font-medium">Drop audio/video here to transcribe</p>
            <p className="text-xs text-foreground/40">MP3, WAV, M4A, MP4, WebM supported</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300 flex items-center gap-2"
        >
          <X size={14} /> {error}
        </motion.div>
      )}

      {/* Subtitles List */}
      {subtitles.length > 0 && (
        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-foreground/50 px-1">
            <span>{subtitles.length} subtitle segments</span>
            <button
              onClick={() => setSubtitles([])}
              className="hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <AnimatePresence>
            {subtitles.map((sub) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="p-3 bg-surface/50 rounded-lg border border-border/20 hover:border-primary/20 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <div className="text-[10px] font-mono text-foreground/40 pt-0.5 flex-shrink-0 w-16">
                    {formatTime(sub.startTime)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingId === sub.id ? (
                      <div className="flex gap-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="flex-1 text-sm bg-surface border border-primary/40 rounded px-2 py-1 focus:outline-none resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex flex-col gap-1">
                          <button onClick={() => saveEdit(sub.id)} className="p-1 text-green-400 hover:text-green-300">
                            <Check size={14} />
                          </button>
                          <button onClick={cancelEdit} className="p-1 text-red-400 hover:text-red-300">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{sub.text}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-[10px] text-foreground/40">
                      {sub.speaker && <span>🎙 {sub.speaker}</span>}
                      {sub.confidence && <span>✓ {Math.round(sub.confidence * 100)}%</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={() => startEdit(sub)} className="p-1.5 hover:text-primary transition-colors">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => deleteSubtitle(sub.id)} className="p-1.5 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default AutoSubtitles;
