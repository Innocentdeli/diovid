"use client";

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Zap, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoFile {
  id: string;
  name: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  thumbnail?: string; // data URL
  file: File;
}

/**
 * Extract a thumbnail from a video file using the HTML5 Canvas API.
 * Also reads resolution and duration via the native video element.
 */
async function extractVideoMetadata(file: File): Promise<Partial<VideoFile>> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const url = URL.createObjectURL(file);
    let resolved = false;

    const done = (result: Partial<VideoFile>) => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(url);
        resolve(result);
      }
    };

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const duration = Math.round(video.duration) || 0;

      // Seek to 10% for a more interesting thumbnail frame
      video.currentTime = Math.min(video.duration * 0.1, 1);

      video.onseeked = () => {
        try {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.75);
            done({ width, height, duration, fps: guessFrameRate(file.name), thumbnail });
          } else {
            done({ width, height, duration, fps: 30 });
          }
        } catch {
          done({ width, height, duration, fps: 30 });
        }
      };
    };

    video.onerror = () => done({});
    setTimeout(() => done({}), 8000); // safety timeout

    video.src = url;
  });
}

function guessFrameRate(filename: string): number {
  const lower = filename.toLowerCase();
  if (lower.includes('60fps') || lower.includes('60p')) return 60;
  if (lower.includes('24fps') || lower.includes('24p') || lower.includes('cinema')) return 24;
  if (lower.includes('25fps') || lower.includes('25p')) return 25;
  return 30;
}

export function VideoImportPanel() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);

  const handleVideoUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter((f) => {
      if (!f.type.startsWith('video/')) {
        console.warn(`${f.name} is not a video file`);
        return false;
      }
      return true;
    });

    // Add files immediately with basic info
    const newEntries: VideoFile[] = validFiles.map((f) => ({
      id: `video-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      size: f.size,
      file: f,
    }));

    setVideos((prev) => [...prev, ...newEntries]);

    // Analyze metadata for each file in parallel
    for (const entry of newEntries) {
      setAnalyzingIds((prev) => new Set(prev).add(entry.id));
      extractVideoMetadata(entry.file).then((meta) => {
        setVideos((prev) =>
          prev.map((v) => (v.id === entry.id ? { ...v, ...meta } : v))
        );
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      });
    }
  }, []);

  const removeVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  return (
    <div className="w-full space-y-4 bg-background p-4 rounded-lg border border-border/30">
      <h2 className="text-lg font-bold flex items-center gap-2">
        <Film size={20} />
        Import Video
      </h2>

      {/* Drop Zone */}
      <div
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleVideoUpload(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${dragActive
            ? 'border-primary/60 bg-primary/10 scale-[1.01]'
            : 'border-border/30 hover:border-primary/40'
          }`}
      >
        <input
          type="file"
          multiple
          accept="video/*"
          onChange={(e) => handleVideoUpload(e.target.files)}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer block">
          <Upload className="w-10 h-10 mx-auto mb-3 text-primary/50" />
          <h3 className="font-semibold mb-1">Drop videos here</h3>
          <p className="text-xs text-foreground/40">MP4, WebM, MOV, AVI, MKV — thumbnails auto-generated</p>
        </label>
      </div>

      {/* Video List */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground/70">
            {videos.length} video{videos.length !== 1 ? 's' : ''} imported
          </h3>
          <AnimatePresence>
            {videos.map((video) => {
              const isAnalyzing = analyzingIds.has(video.id);
              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-3 bg-surface/50 border border-border/30 rounded-lg flex items-center gap-3"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-12 rounded overflow-hidden bg-black flex-shrink-0 relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        {isAnalyzing ? (
                          <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <Film size={14} className="text-primary/40" />
                        )}
                      </div>
                    )}
                    {isAnalyzing && video.thumbnail && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate" title={video.name}>{video.name}</h4>
                    <div className="flex gap-3 text-xs text-foreground/50 mt-1 flex-wrap">
                      <span>{formatSize(video.size)}</span>
                      {video.duration !== undefined && (
                        <span>⏱ {formatDuration(video.duration)}</span>
                      )}
                      {video.width && (
                        <span>📐 {video.width}×{video.height}</span>
                      )}
                      {video.fps && (
                        <span>{video.fps}fps</span>
                      )}
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeVideo(video.id)}
                    className="p-2 hover:bg-red-500/20 rounded text-red-400 flex-shrink-0 transition-colors"
                    title="Remove"
                  >
                    <X size={14} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <p className="text-xs text-foreground/40 text-center pt-2">
            ✓ Videos ready for the Timeline. Resolution & thumbnails extracted automatically.
          </p>
        </div>
      )}
    </div>
  );
}

export default VideoImportPanel;
