'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut, Scissors, RotateCcw, Save, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Frame {
  id: string;
  timestamp: number;
  imageData: string;
  changes: string[];
}

interface FrameEditorProps {
  videoUrl?: string;
  onFrameEdit?: (frameId: string, changes: any) => void;
}

export default function FrameEditor({ videoUrl, onFrameEdit }: FrameEditorProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedTool, setSelectedTool] = useState<'select' | 'crop' | 'brush' | 'text'>('select');
  const [frames, setFrames] = useState<Frame[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Initialize video and extract frames
  useEffect(() => {
    if (videoUrl && videoRef.current) {
      const video = videoRef.current;
      video.addEventListener('loadedmetadata', () => {
        setDuration(video.duration);
        setTotalFrames(Math.floor(video.duration * 30)); // Assume 30fps
        extractFrames();
      });
    }
  }, [videoUrl]);

  const extractFrames = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const frameRate = 30; // Extract 1 frame per second
    const newFrames: Frame[] = [];

    for (let time = 0; time < video.duration; time += 1/frameRate) {
      video.currentTime = time;
      await new Promise(resolve => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0);
          const imageData = canvas.toDataURL('image/png');
          newFrames.push({
            id: `frame_${time.toFixed(2)}`,
            timestamp: time,
            imageData,
            changes: []
          });
          resolve(void 0);
        };
      });
    }

    setFrames(newFrames);
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleFrameNavigation = (direction: 'prev' | 'next') => {
    const newFrame = direction === 'next'
      ? Math.min(currentFrame + 1, totalFrames - 1)
      : Math.max(currentFrame - 1, 0);
    setCurrentFrame(newFrame);

    if (videoRef.current) {
      videoRef.current.currentTime = (newFrame / totalFrames) * duration;
    }
  };

  const handleTimelineClick = (event: React.MouseEvent) => {
    if (!timelineRef.current || !videoRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setCurrentFrame(Math.floor((newTime / duration) * totalFrames));
  };

  const applyEdit = (editType: string, params: any) => {
    const currentFrameData = frames[currentFrame];
    if (!currentFrameData) return;

    const updatedFrames = frames.map((frame, index) =>
      index === currentFrame
        ? {
            ...frame,
            changes: [...frame.changes, `${editType}: ${JSON.stringify(params)}`]
          }
        : frame
    );

    setFrames(updatedFrames);
    onFrameEdit?.(currentFrameData.id, { editType, params });
  };

  const undoLastEdit = () => {
    const currentFrameData = frames[currentFrame];
    if (!currentFrameData || currentFrameData.changes.length === 0) return;

    const updatedFrames = frames.map((frame, index) =>
      index === currentFrame
        ? {
            ...frame,
            changes: frame.changes.slice(0, -1)
          }
        : frame
    );

    setFrames(updatedFrames);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Frame-by-Frame Editor</h3>
          <p className="text-sm text-gray-400">Edit individual frames with precision tools</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Frame {currentFrame + 1} of {totalFrames}
          </Badge>
          <Badge variant="neutral">
            {formatTime(currentTime)} / {formatTime(duration)}
          </Badge>
        </div>
      </div>

      {/* Video Preview */}
      <Card className="p-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-64 object-contain"
            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
              setCurrentFrame(Math.floor((e.currentTarget.currentTime / duration) * totalFrames));
            }}
            onLoadedData={() => setTotalFrames(Math.floor(duration * 30))}
          />

          {/* Canvas Overlay for Editing */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFrameNavigation('prev')}
            disabled={currentFrame === 0}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFrameNavigation('next')}
            disabled={currentFrame === totalFrames - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="mt-4 h-12 bg-gray-800 rounded-lg cursor-pointer relative"
          onClick={handleTimelineClick}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-0 w-1 h-full bg-white rounded-full transform -translate-x-0.5"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>
      </Card>

      {/* Editing Tools */}
      <div className="grid grid-cols-2 gap-6">
        {/* Tool Selection */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-white mb-3">Editing Tools</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'select', label: 'Select', icon: '🎯' },
              { id: 'crop', label: 'Crop', icon: '✂️' },
              { id: 'brush', label: 'Brush', icon: '🖌️' },
              { id: 'text', label: 'Text', icon: '📝' }
            ].map((tool) => (
              <Button
                key={tool.id}
                variant={selectedTool === tool.id ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool(tool.id as any)}
                className="justify-start"
              >
                <span className="mr-2">{tool.icon}</span>
                {tool.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={undoLastEdit}
              disabled={!frames[currentFrame]?.changes.length}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => applyEdit('save', { timestamp: Date.now() })}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Frame
            </Button>
          </div>
        </Card>

        {/* Frame History */}
        <Card className="p-4">
          <h4 className="text-sm font-medium text-white mb-3">Frame Changes</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {frames[currentFrame]?.changes.map((change, index) => (
              <div key={index} className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                {change}
              </div>
            )) || (
              <div className="text-xs text-gray-500 italic">No changes yet</div>
            )}
          </div>

          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">Frame Rate: 30 fps</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Duration: {formatTime(duration)}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-white mb-3">Quick Edits</h4>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('brightness', { value: 10 })}
          >
            Brightness +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('contrast', { value: 10 })}
          >
            Contrast +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('saturation', { value: 10 })}
          >
            Saturation +
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('blur', { radius: 2 })}
          >
            Blur
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('sharpen', { amount: 50 })}
          >
            Sharpen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyEdit('denoise', { strength: 25 })}
          >
            Denoise
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}