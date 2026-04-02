// filepath: src/components/TimelineEditor.tsx
"use client";

import { useState } from 'react';
import { ChevronDown, Trash2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineClip {
  id: string;
  sceneId: string;
  startTime: number;
  duration: number;
  title: string;
  type: 'scene' | 'broll' | 'transition' | 'title';
}

export function TimelineEditor() {
  const [clips, setClips] = useState<TimelineClip[]>([]);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const addClip = (sceneId: string) => {
    const lastClip = clips[clips.length - 1];
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;

    const newClip: TimelineClip = {
      id: Math.random().toString(36),
      sceneId,
      startTime,
      duration: 4,
      title: `Scene ${clips.length + 1}`,
      type: 'scene',
    };

    setClips([...clips, newClip]);
  };

  const updateClip = (id: string, updates: Partial<TimelineClip>) => {
    setClips(clips.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteClip = (id: string) => {
    setClips(clips.filter((c) => c.id !== id));
  };

  const duplicateClip = (id: string) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;

    const lastClip = clips[clips.length - 1];
    const newClip: TimelineClip = {
      ...clip,
      id: Math.random().toString(36),
      startTime: lastClip.startTime + lastClip.duration,
    };

    setClips([...clips, newClip]);
  };

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="w-full space-y-4 bg-background p-4 rounded-lg border border-border/30">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Timeline Editor</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 rounded"
          >
            −
          </button>
          <span className="text-xs opacity-50">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(zoom + 0.1)}
            className="px-2 py-1 text-xs bg-primary/20 hover:bg-primary/30 rounded"
          >
            +
          </button>
          <span className="text-xs ml-4">
            Total: {totalDuration.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div className="bg-surface/50 rounded-lg p-4 overflow-x-auto min-h-[300px] border border-border/20">
        {clips.length === 0 ? (
          <div className="h-full flex items-center justify-center opacity-30 text-center">
            <p className="text-sm">No clips added yet. Add scenes to build your timeline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Ruler */}
            <div
              className="flex border-b border-border/20 pb-2"
              style={{ width: `${totalDuration * 100 * zoom}px` }}
            >
              {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                <div
                  key={i}
                  className="text-[10px] text-foreground/30 flex-shrink-0"
                  style={{ width: `${100 * zoom}px` }}
                >
                  {i}s
                </div>
              ))}
            </div>

            {/* Clips */}
            {clips.map((clip) => (
              <motion.div
                key={clip.id}
                layout
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedClip === clip.id
                    ? 'border-primary/60 bg-primary/10'
                    : 'border-border/30 hover:border-primary/40'
                }`}
                onClick={() => setSelectedClip(clip.id)}
                style={{
                  width: `${clip.duration * 100 * zoom}px`,
                  marginLeft: `${clip.startTime * 100 * zoom}px`,
                }}
              >
                <div className="flex items-start justify-between min-h-[40px]">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{clip.title}</p>
                    <p className="text-[10px] text-foreground/50">
                      {clip.startTime.toFixed(1)}s – {clip.duration.toFixed(1)}s
                    </p>
                  </div>

                  {selectedClip === clip.id && (
                    <div className="flex gap-1 opacity-100 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateClip(clip.id);
                        }}
                        className="p-1 hover:bg-primary/20 rounded transition-all"
                        title="Duplicate clip"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteClip(clip.id);
                        }}
                        className="p-1 hover:bg-error/20 rounded transition-all"
                        title="Delete clip"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Clip Details Panel */}
      {selectedClip && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-surface/30 rounded-lg border border-border/30 space-y-3"
        >
          <h3 className="font-semibold text-sm">Clip Properties</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-70">Title</label>
              <input
                value={
                  clips.find((c) => c.id === selectedClip)?.title || ''
                }
                onChange={(e) => updateClip(selectedClip, { title: e.target.value })}
                className="w-full px-2 py-1.5 bg-background border border-border/30 rounded text-xs mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold opacity-70">Duration (s)</label>
              <input
                type="number"
                step="0.1"
                value={
                  clips.find((c) => c.id === selectedClip)?.duration || 0
                }
                onChange={(e) =>
                  updateClip(selectedClip, {
                    duration: parseFloat(e.target.value),
                  })
                }
                className="w-full px-2 py-1.5 bg-background border border-border/30 rounded text-xs mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold opacity-70">Type</label>
            <select
              value={
                clips.find((c) => c.id === selectedClip)?.type || 'scene'
              }
              onChange={(e) =>
                updateClip(selectedClip, {
                  type: e.target.value as TimelineClip['type'],
                })
              }
              className="w-full px-2 py-1.5 bg-background border border-border/30 rounded text-xs mt-1"
            >
              <option value="scene">Scene (AI Generated)</option>
              <option value="broll">B-Roll (Imported Video)</option>
              <option value="transition">Transition</option>
              <option value="title">Title Card</option>
            </select>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default TimelineEditor;
