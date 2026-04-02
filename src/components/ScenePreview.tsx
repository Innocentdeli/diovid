"use client";

import { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Eye, X, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Scene } from '@/stores/directorStore';

interface ScenePreviewProps {
    scene: Scene;
    isPlaying?: boolean;
    onPlay?: () => void;
    onPause?: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    onClose?: () => void;
    onGenerateFull?: () => void;
}

export function ScenePreview({
    scene,
    isPlaying = false,
    onPlay,
    onPause,
    onNext,
    onPrevious,
    onClose,
    onGenerateFull,
}: ScenePreviewProps) {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
            <motion.div
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                className="relative max-w-4xl w-full mx-4 bg-surface rounded-xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary">Scene {scene.scene_id}</Badge>
                        <span className="text-sm text-foreground/70">
                            {scene.duration_seconds}s • {scene.camera_shot} • {scene.character_emotion}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Preview Content */}
                <div className="relative aspect-video bg-gradient-to-br from-surface to-surface/50">
                    {scene.backgroundUrl ? (
                        <img
                            src={scene.backgroundUrl}
                            alt={`Scene ${scene.scene_id} background`}
                            className="w-full h-full object-cover"
                        />
                    ) : scene.videoUrl ? (
                        <video
                            src={scene.videoUrl}
                            className="w-full h-full object-cover"
                            controls={false}
                            autoPlay={isPlaying}
                            loop
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Play className="w-8 h-8 text-primary" />
                                </div>
                                <p className="text-foreground/70">Preview not available</p>
                                <p className="text-sm text-foreground/50">Generate full scene to see preview</p>
                            </div>
                        </div>
                    )}

                    {/* Scene Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <div className="flex items-center justify-between text-white">
                            <div>
                                <p className="font-medium">{scene.background_environment}</p>
                                <p className="text-sm opacity-80">{scene.character_pose} • {scene.character_eye_focus}</p>
                            </div>
                            <Badge variant="neutral" className="text-white border-white/30 bg-white/10">
                                {scene.transition_out}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between p-4 bg-surface/50">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onPrevious}
                            disabled={!onPrevious}
                        >
                            <SkipBack className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={isPlaying ? onPause : onPlay}
                        >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNext}
                            disabled={!onNext}
                        >
                            <SkipForward className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onGenerateFull}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Generate Full Scene
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                        >
                            <Share2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Details Panel */}
                <AnimatePresence>
                    {showDetails && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-border bg-surface/30"
                        >
                            <div className="p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="font-medium mb-2">Camera</h4>
                                        <div className="space-y-1 text-sm text-foreground/70">
                                            <p>Shot: {scene.camera_shot}</p>
                                            <p>Movement: {scene.camera_movement}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Character</h4>
                                        <div className="space-y-1 text-sm text-foreground/70">
                                            <p>Pose: {scene.character_pose}</p>
                                            <p>Emotion: {scene.character_emotion}</p>
                                            <p>Eye Focus: {scene.character_eye_focus}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Animation</h4>
                                        <div className="space-y-1 text-sm text-foreground/70">
                                            <p>Blink: {scene.animation_contract.face_blink_rate}</p>
                                            <p>Mouth: {scene.animation_contract.face_mouth_activity}</p>
                                            <p>Head: {scene.animation_contract.head_motion_type}</p>
                                            <p>Gesture: {scene.animation_contract.gesture_name || 'None'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-medium mb-2">Dialogue</h4>
                                        <div className="space-y-1 text-sm text-foreground/70">
                                            <p>Voice: {scene.dialogue_voice_style}</p>
                                            <p>Lip Sync: {scene.dialogue_lip_sync ? 'Yes' : 'No'}</p>
                                            <p className="italic">"{scene.dialogue_text}"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

interface PreviewModalProps {
    scenes: Scene[];
    currentSceneIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onGenerateScene?: (sceneId: number) => void;
    onGenerateAll?: () => void;
}

export function PreviewModal({
    scenes,
    currentSceneIndex,
    isOpen,
    onClose,
    onGenerateScene,
    onGenerateAll,
}: PreviewModalProps) {
    const [localSceneIndex, setLocalSceneIndex] = useState(currentSceneIndex);
    const [isPlaying, setIsPlaying] = useState(false);

    if (!isOpen || scenes.length === 0) return null;

    const currentScene = scenes[localSceneIndex];

    const handleNext = () => {
        setLocalSceneIndex((prev) => (prev + 1) % scenes.length);
        setIsPlaying(false);
    };

    const handlePrevious = () => {
        setLocalSceneIndex((prev) => (prev - 1 + scenes.length) % scenes.length);
        setIsPlaying(false);
    };

    return (
        <ScenePreview
            scene={currentScene}
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onNext={scenes.length > 1 ? handleNext : undefined}
            onPrevious={scenes.length > 1 ? handlePrevious : undefined}
            onClose={onClose}
            onGenerateFull={() => onGenerateScene?.(currentScene.scene_id)}
        />
    );
}