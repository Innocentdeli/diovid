"use client";

import { useState } from 'react';
import { Download, Settings, Check, Loader2, Youtube, Instagram, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ExportOptions {
    resolution: '720p' | '1080p' | '4k';
    format: 'mp4' | 'webm' | 'mov';
    aspectRatio: '16:9' | '9:16' | '1:1';
    quality: 'standard' | 'high' | 'premium';
    includeSubtitles: boolean;
    platform?: 'youtube' | 'instagram' | 'twitter' | 'tiktok';
}

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExport: (options: ExportOptions) => Promise<void>;
    isExporting?: boolean;
    exportProgress?: number;
}

const RESOLUTIONS = [
    { value: '720p' as const, label: '720p HD', description: '1280x720' },
    { value: '1080p' as const, label: '1080p Full HD', description: '1920x1080' },
    { value: '4k' as const, label: '4K Ultra HD', description: '3840x2160' },
] as const;

const FORMATS = [
    { value: 'mp4' as const, label: 'MP4', description: 'Universal compatibility' },
    { value: 'webm' as const, label: 'WebM', description: 'Web optimized' },
    { value: 'mov' as const, label: 'MOV', description: 'Professional editing' },
] as const;

const ASPECT_RATIOS = [
    { value: '16:9' as const, label: '16:9 Landscape', description: 'YouTube, TV' },
    { value: '9:16' as const, label: '9:16 Portrait', description: 'TikTok, Stories' },
    { value: '1:1' as const, label: '1:1 Square', description: 'Instagram, LinkedIn' },
] as const;

const PLATFORMS = [
    { value: 'youtube' as const, label: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { value: 'instagram' as const, label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { value: 'twitter' as const, label: 'Twitter/X', icon: Twitter, color: 'text-blue-500' },
    { value: 'tiktok' as const, label: 'TikTok', icon: () => <span className="text-black font-bold">TikTok</span>, color: 'text-black' },
] as const;

export function ExportModal({ isOpen, onClose, onExport, isExporting = false, exportProgress = 0 }: ExportModalProps) {
    const [options, setOptions] = useState<ExportOptions>({
        resolution: '1080p',
        format: 'mp4',
        aspectRatio: '16:9',
        quality: 'high',
        includeSubtitles: false,
    });

    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    const handleExport = async () => {
        try {
            await onExport({
                ...options,
                platform: selectedPlatform as ExportOptions['platform'],
            });
            onClose();
        } catch (error) {
            console.error('Export failed:', error);
        }
    };

    const getEstimatedFileSize = () => {
        const baseSizes = { '720p': 50, '1080p': 150, '4k': 800 };
        const qualityMultipliers = { standard: 0.7, high: 1, premium: 1.5 };
        const formatMultipliers = { mp4: 1, webm: 0.8, mov: 1.2 };

        const baseSize = baseSizes[options.resolution];
        const qualityMultiplier = qualityMultipliers[options.quality];
        const formatMultiplier = formatMultipliers[options.format];

        return Math.round(baseSize * qualityMultiplier * formatMultiplier);
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-2xl w-full mx-4 bg-surface rounded-xl shadow-2xl max-h-[90vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Download className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Export Video</h2>
                            <p className="text-sm text-foreground/70">Choose your export settings</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ×
                    </Button>
                </div>

                <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                    {/* Platform Selection */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Platform (Optional)</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {PLATFORMS.map((platform) => {
                                const Icon = platform.icon;
                                return (
                                    <button
                                        key={platform.value}
                                        onClick={() => setSelectedPlatform(
                                            selectedPlatform === platform.value ? null : platform.value
                                        )}
                                        className={`p-3 rounded-lg border-2 transition-all ${
                                            selectedPlatform === platform.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className={`w-5 h-5 ${platform.color}`} />
                                            <span className="font-medium">{platform.label}</span>
                                            {selectedPlatform === platform.value && (
                                                <Check className="w-4 h-4 text-primary ml-auto" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resolution */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Resolution</h3>
                        <div className="grid grid-cols-1 gap-3">
                            {RESOLUTIONS.map((resolution) => (
                                <button
                                    key={resolution.value}
                                    onClick={() => setOptions(prev => ({ ...prev, resolution: resolution.value }))}
                                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                                        options.resolution === resolution.value
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium">{resolution.label}</div>
                                            <div className="text-sm text-foreground/70">{resolution.description}</div>
                                        </div>
                                        {options.resolution === resolution.value && (
                                            <Check className="w-5 h-5 text-primary" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format & Aspect Ratio */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Format</h3>
                            <div className="space-y-2">
                                {FORMATS.map((format) => (
                                    <button
                                        key={format.value}
                                        onClick={() => setOptions(prev => ({ ...prev, format: format.value }))}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                            options.format === format.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{format.label}</div>
                                                <div className="text-sm text-foreground/70">{format.description}</div>
                                            </div>
                                            {options.format === format.value && (
                                                <Check className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-3">Aspect Ratio</h3>
                            <div className="space-y-2">
                                {ASPECT_RATIOS.map((ratio) => (
                                    <button
                                        key={ratio.value}
                                        onClick={() => setOptions(prev => ({ ...prev, aspectRatio: ratio.value }))}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                            options.aspectRatio === ratio.value
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{ratio.label}</div>
                                                <div className="text-sm text-foreground/70">{ratio.description}</div>
                                            </div>
                                            {options.aspectRatio === ratio.value && (
                                                <Check className="w-4 h-4 text-primary" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quality & Options */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Quality</h3>
                        <div className="flex gap-3 mb-4">
                            {(['standard', 'high', 'premium'] as const).map((quality) => (
                                <button
                                    key={quality}
                                    onClick={() => setOptions(prev => ({ ...prev, quality }))}
                                    className={`px-4 py-2 rounded-lg border-2 capitalize transition-all ${
                                        options.quality === quality
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                >
                                    {quality}
                                </button>
                            ))}
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={options.includeSubtitles}
                                onChange={(e) => setOptions(prev => ({ ...prev, includeSubtitles: e.target.checked }))}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                            />
                            <span className="text-sm">Include subtitles</span>
                        </label>
                    </div>

                    {/* Export Summary */}
                    <div className="bg-surface/50 rounded-lg p-4 mb-6">
                        <h4 className="font-medium mb-2">Export Summary</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-foreground/70">Resolution:</span>
                                <span className="ml-2 font-medium">{options.resolution}</span>
                            </div>
                            <div>
                                <span className="text-foreground/70">Format:</span>
                                <span className="ml-2 font-medium">{options.format.toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="text-foreground/70">Aspect Ratio:</span>
                                <span className="ml-2 font-medium">{options.aspectRatio}</span>
                            </div>
                            <div>
                                <span className="text-foreground/70">Est. Size:</span>
                                <span className="ml-2 font-medium">{getEstimatedFileSize()}MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-surface/50">
                    <div className="text-sm text-foreground/70">
                        {isExporting ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting... {exportProgress}%
                            </div>
                        ) : (
                            `Estimated file size: ${getEstimatedFileSize()}MB`
                        )}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isExporting}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Video
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}