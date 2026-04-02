'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Settings, Download, CheckCircle, AlertCircle, Clock, Zap, Layers, FileVideo } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface RenderJob {
  id: string;
  name: string;
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  format: string;
  resolution: string;
  bitrate: string;
  startTime?: number;
  endTime?: number;
}

interface BatchRenderingProps {
  onBatchComplete?: (jobs: RenderJob[]) => void;
}

export default function BatchRendering({ onBatchComplete }: BatchRenderingProps) {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('youtube');
  const [customSettings, setCustomSettings] = useState({
    format: 'mp4',
    resolution: '1920x1080',
    bitrate: '5000',
    framerate: '30',
    codec: 'h264'
  });

  const presets = {
    youtube: {
      name: 'YouTube HD',
      format: 'mp4',
      resolution: '1920x1080',
      bitrate: '8000',
      framerate: '30',
      codec: 'h264'
    },
    tiktok: {
      name: 'TikTok Vertical',
      format: 'mp4',
      resolution: '1080x1920',
      bitrate: '4000',
      framerate: '30',
      codec: 'h264'
    },
    instagram: {
      name: 'Instagram Story',
      format: 'mp4',
      resolution: '1080x1920',
      bitrate: '3500',
      framerate: '30',
      codec: 'h264'
    },
    archive: {
      name: 'Archive Quality',
      format: 'mov',
      resolution: '3840x2160',
      bitrate: '25000',
      framerate: '24',
      codec: 'prores'
    }
  };

  const addRenderJob = (name: string, settings = customSettings) => {
    const newJob: RenderJob = {
      id: `job_${Date.now()}`,
      name,
      status: 'queued',
      progress: 0,
      estimatedTime: calculateEstimatedTime(settings),
      format: settings.format,
      resolution: settings.resolution,
      bitrate: settings.bitrate
    };

    setJobs(prev => [...prev, newJob]);
  };

  const calculateEstimatedTime = (settings: any) => {
    // Estimate based on resolution, bitrate, and format complexity
    const resolutionMultiplier = settings.resolution === '3840x2160' ? 4 :
                                settings.resolution === '1920x1080' ? 1 : 0.5;
    const bitrateMultiplier = parseInt(settings.bitrate) / 5000;
    const codecMultiplier = settings.codec === 'prores' ? 2 : 1;

    return Math.round(30 * resolutionMultiplier * bitrateMultiplier * codecMultiplier);
  };

  const startBatchRender = async () => {
    if (jobs.length === 0) return;

    setIsRendering(true);

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      // Update job status to rendering
      setJobs(prev => prev.map(j =>
        j.id === job.id
          ? { ...j, status: 'rendering', startTime: Date.now() }
          : j
      ));

      // Simulate rendering progress
      await simulateRender(job.id, job.estimatedTime);
    }

    setIsRendering(false);
    onBatchComplete?.(jobs);
  };

  const simulateRender = async (jobId: string, duration: number) => {
    const steps = 100;
    const stepDuration = (duration * 1000) / steps;

    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration));

      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              progress: i,
              status: i === 100 ? 'completed' : 'rendering',
              endTime: i === 100 ? Date.now() : undefined
            }
          : job
      ));
    }
  };

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const clearCompleted = () => {
    setJobs(prev => prev.filter(job => job.status !== 'completed'));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'rendering':
        return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'rendering':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const totalEstimatedTime = jobs.reduce((total, job) => total + job.estimatedTime, 0);
  const completedJobs = jobs.filter(job => job.status === 'completed').length;
  const progressPercentage = jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Batch Rendering</h3>
          <p className="text-sm text-gray-400">Render multiple videos with optimized settings</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {completedJobs}/{jobs.length} Complete
          </Badge>
          <Badge variant="neutral">
            {Math.round(progressPercentage)}%
          </Badge>
        </div>
      </div>

      {/* Preset Selection */}
      <Card className="p-4">
        <h4 className="text-sm font-medium text-white mb-3">Render Presets</h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(presets).map(([key, preset]) => (
            <div
              key={key}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPreset === key
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => {
                setSelectedPreset(key);
                setCustomSettings(preset);
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <FileVideo className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">{preset.name}</span>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>{preset.resolution} • {preset.framerate}fps</div>
                <div>{preset.bitrate}kbps • {preset.format.toUpperCase()}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Custom Settings */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h5 className="text-sm font-medium text-white mb-3">Custom Settings</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400">Format</label>
              <select
                value={customSettings.format}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, format: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
                <option value="avi">AVI</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Resolution</label>
              <select
                value={customSettings.resolution}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, resolution: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="1920x1080">1920x1080 (Full HD)</option>
                <option value="1280x720">1280x720 (HD)</option>
                <option value="3840x2160">3840x2160 (4K)</option>
                <option value="1080x1920">1080x1920 (Vertical)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Bitrate (kbps)</label>
              <input
                type="number"
                value={customSettings.bitrate}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, bitrate: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                min="500"
                max="50000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Framerate</label>
              <select
                value={customSettings.framerate}
                onChange={(e) => setCustomSettings(prev => ({ ...prev, framerate: e.target.value }))}
                className="w-full mt-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
              >
                <option value="24">24 fps</option>
                <option value="30">30 fps</option>
                <option value="60">60 fps</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Job Queue */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-white">Render Queue</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addRenderJob(`Render Job ${jobs.length + 1}`)}
            >
              <Layers className="w-4 h-4 mr-2" />
              Add Job
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
              disabled={completedJobs === 0}
            >
              Clear Completed
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-sm font-medium text-white">{job.name}</div>
                    <div className="text-xs text-gray-400">
                      {job.resolution} • {job.bitrate}kbps • {job.format.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getStatusColor(job.status)}`}>
                      {job.status === 'rendering' ? `${job.progress}%` : job.status}
                    </div>
                    <div className="text-xs text-gray-400">
                      ~{job.estimatedTime}s
                    </div>
                  </div>

                  {job.status === 'completed' && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeJob(job.id)}
                    disabled={job.status === 'rendering'}
                  >
                    ✕
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {jobs.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>No render jobs in queue</div>
              <div className="text-xs">Add jobs to start batch rendering</div>
            </div>
          )}
        </div>
      </Card>

      {/* Batch Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-white">
              Total Estimated Time: {Math.round(totalEstimatedTime / 60)}m {totalEstimatedTime % 60}s
            </div>
            <div className="text-xs text-gray-400">
              {jobs.length} jobs • Optimized for parallel processing
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={jobs.length === 0 || isRendering}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={startBatchRender}
              disabled={jobs.length === 0 || isRendering}
            >
              {isRendering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Rendering...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Start Batch Render
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isRendering && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Batch Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}