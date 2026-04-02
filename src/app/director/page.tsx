"use client";

import { useState, useEffect } from 'react';
import { Camera, Send, Sparkles, Mic, Layout, Play, ChevronRight, Video, Zap, Film, Settings, RefreshCw, Share2, Upload, Edit2, Subtitles, Music, Brain, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TiptapEditor from '@/components/TiptapEditor';
import { useDirectorStore, Scene } from '@/stores/directorStore';
import VideoImportPanel from '@/components/VideoImportPanel';
import TimelineEditor from '@/components/TimelineEditor';
import AutoSubtitles from '@/components/AutoSubtitles';
import MusicLibrary from '@/components/MusicLibrary';
import PublishingPanel from '@/components/PublishingPanel';
import { aiCoWrite } from '@/app/actions/aiWriter';

// ─── API Helpers (use plain fetch to avoid Server Action size/timeout limits) ───
async function apiOrchestrate(imageData: string[], userIntent: string, characters: any[]) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('Request timed out after 5 minutes'), 300000); // 5 min
    try {
        const res = await fetch('/api/ai/orchestrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageData, userIntent, characters }),
            signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Orchestration HTTP ${res.status}`);
        return data;
    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Orchestration timed out. The script or images might be too large for your current connection.');
        throw e;
    } finally {
        clearTimeout(timeout);
    }
}

async function apiGenerateImage(prompt: string, characterInfo?: { name: string, vibe: string, traits: string[] }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('Request timed out after 2 minutes'), 120000); // 120s
    try {
        const res = await fetch('/api/ai/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, characterInfo }),
            signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Image gen HTTP ${res.status}`);
        console.log(`[API_GEN_IMAGE] Success. URL length: ${data.imageUrl?.length}`);
        return data.imageUrl as string;
    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Image generation timed out. Google AI is taking longer than usual.');
        throw e;
    } finally {
        clearTimeout(timeout);
    }
}

async function apiGenerateVideo(prompt: string, imageBase64?: string) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Request timed out after 10 minutes'), 600000); // 10 min
    try {
        const res = await fetch('/api/ai/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, imageBase64 }),
            signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Video gen HTTP ${res.status}`);
        return data.videoUrl as string;
    } catch (e: any) {
        if (e.name === 'AbortError') throw new Error('Video generation timed out. 10 minutes passed without a result.');
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function apiExtractPersona(imageBase64: string, existingName?: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort('Request timed out after 90 seconds'), 90000); // 90s
    try {
        const res = await fetch('/api/ai/extract-persona', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64, existingName }),
            signal: controller.signal
        });
        const data = await res.json();
        if (!res.ok || data.error) return { error: data.error || `Persona HTTP ${res.status}` };
        return data;
    } catch (e: any) {
        if (e.name === 'AbortError') return { error: 'Persona extraction timed out. The image might be too large.' };
        throw e;
    } finally {
        clearTimeout(timeout);
    }
}
import { Badge } from '@/components/ui/Badge';
import { MobileControls } from '@/components/MobileControls';
import { CollaborationProvider, useCollaboration } from '@/components/CollaborationProvider';
import { WorkflowProvider } from '@/components/WorkflowProvider';
import { AITuningProvider, useAITuning } from '@/components/AITuningProvider';
import { MultiModalProvider, useMultiModal } from '@/components/MultiModalProvider';
import { QualityControlProvider } from '@/components/QualityControlProvider';
import LiveDirector from '@/components/LiveDirector';
import ProfessionalProductionPanel from '@/components/ProfessionalProductionPanel';

const compressImage = (base64: string, maxWidth = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (maxWidth / width) * height;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
};

export default function DirectorPage() {
    return (
        <QualityControlProvider>
            <MultiModalProvider>
                <AITuningProvider>
                    <WorkflowProvider>
                        <CollaborationProvider contentId="default-project" currentUser={{ id: 'user-1', name: 'Director', email: 'director@diovid.ai', role: 'owner', isOnline: true, lastSeen: new Date() }}>
                            <MobileControls>
                                <DirectorWorkspace />
                            </MobileControls>
                        </CollaborationProvider>
                    </WorkflowProvider>
                </AITuningProvider>
            </MultiModalProvider>
        </QualityControlProvider>
    );
}

function DirectorWorkspace() {
    // Use Zustand store
    const {
        characters,
        addCharacter,
        updateCharacter,
        removeCharacter,
        storyHtml,
        scriptHtml,
        setStoryHtml,
        setScriptHtml,
        isProcessing,
        isAiWriting,
        currentlyProcessingAiAction,
        setProcessing,
        setAiWriting,
        setCurrentlyProcessingAiAction,
        orchestration,
        setOrchestration,
        isPlaying,
        currentSceneIdx,
        setPlaying,
        setCurrentSceneIdx,
        activeStep,
        setActiveStep,
        productionLogs,
        addProductionLog,
        clearProductionLogs,
        resetProject,
    } = useDirectorStore();

    const { setIsTuningMode } = useAITuning();
    const collaboration = useCollaboration();
    const { openPanel: openAudioPanel, isPanelOpen: isAudioPanelOpen, hasTracks } = useMultiModal();

    const [isAnalysingPersona, setIsAnalysingPersona] = useState<Record<string, boolean>>({});

    // Auto-scroll logs
    useEffect(() => {
        const el = document.getElementById('logs-end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [productionLogs]);

    // Voice loading safety
    useEffect(() => {
        window.speechSynthesis.getVoices();
    }, []);

    // Auto-open audio panel when entering audio step
    useEffect(() => {
        if (activeStep === 2 && !isAudioPanelOpen) {
            // Small delay to ensure smooth transition
            setTimeout(() => openAudioPanel(), 300);
        }
    }, [activeStep, isAudioPanelOpen, openAudioPanel]);

    // Auto-start directing when entering video step
    useEffect(() => {
        if (activeStep === 3 && !orchestration && !isProcessing && characters.some(c => c.name) && scriptHtml) {
            startDirecting();
        }
    }, [activeStep, orchestration, isProcessing, characters, scriptHtml]);

    const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                const compressed = await compressImage(base64);
                updateCharacter(id, { photo: compressed });

                // AI Persona Extraction
                setIsAnalysingPersona(prev => ({ ...prev, [id]: true }));
                try {
                    const char = characters.find(c => c.id === id);
                    const result = await apiExtractPersona(compressed, char?.name);
                    if (result && !('error' in result)) {
                        updateCharacter(id, {
                            vibe: result.suggestedVibe,
                            traits: result.suggestedTraits
                        });
                        addProductionLog(`✨ AI Persona extracted for ${char?.name || 'character'}: ${result.suggestedVibe}`);
                    }
                } catch (err) {
                    console.error('Persona extraction failed:', err);
                } finally {
                    setIsAnalysingPersona(prev => ({ ...prev, [id]: false }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const startDirecting = async () => {
        if (characters.some(c => !c.name) || !scriptHtml) return;
        setProcessing(true);
        clearProductionLogs();
        try {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = scriptHtml;
            const plainTextIntent = tempDiv.textContent || tempDiv.innerText || "";

            const photos = characters.map(c => c.photo).filter(Boolean) as string[];

            addProductionLog("🧠 Orchestrating production plan via Gemini 2.0...");
            const result = await apiOrchestrate(photos, plainTextIntent, characters.map(c => ({
                name: c.name,
                vibe: c.vibe,
                traits: c.traits
            })));
            addProductionLog(`🎬 Plan received: ${result.scenes?.length || 0} scenes proposed.`);

            setCurrentSceneIdx(0);

            // Force-strip any hidden SDK metadata/prototypes that cause Next.js array nesting errors
            const safeResult = JSON.parse(JSON.stringify(result));
            
            // Create orchestration state once, avoiding repeated spreads
            const orchestrationState = { ...safeResult, scenes: [] as Scene[] };
            setOrchestration(orchestrationState);
            addProductionLog("🎬 Video Director initialized. Starting production...");

            // Build scenes locally, update state once per scene
            const scenesWithAssets: Scene[] = [];

            if (!result.scenes || !Array.isArray(result.scenes) || result.scenes.length === 0) {
                throw new Error("The AI Director could not formulate any scenes for this script. Please revise your instructions and try again.");
            }

            for (const [sIdx, scene] of result.scenes.entries()) {
                addProductionLog(`🎬 Scene ${sIdx + 1}: ${scene.background_environment || 'Setting scene'}...`);
                setCurrentSceneIdx(sIdx); // Show progress in Live Feed HUD

                // Generate background from environment description
                addProductionLog(`🎨 Painting background for Scene ${sIdx + 1}...`);
                let bgUrl = null;
                try {
                    bgUrl = await apiGenerateImage(scene.background_environment || 'cinematic studio');
                } catch (imgErr: any) {
                    console.warn('[IMAGE GEN] Background failed, using fallback:', imgErr.message);
                    addProductionLog(`⚠️ Background failed, using cinematic fallback.`);
                }
                
                // Use a unique placeholder to force React key changes even if consecutive scenes fail
                const finalBg = bgUrl || `https://placehold.co/1920x1080/000000/FFFFFF/png?text=Scene+${sIdx+1}+Background+Fallback`;
                addProductionLog(`✅ Scene ${sIdx + 1} background ready.`);

                const partialScene = {
                    ...scene,
                    backgroundUrl: finalBg,
                    videoUrl: undefined
                };
                
                // Add to list and update state immediately so user sees background
                scenesWithAssets.push(JSON.parse(JSON.stringify(partialScene)));
                setOrchestration({ ...orchestrationState, scenes: [...scenesWithAssets] });

                // Generate acting video from dialogue/action + character emotion
                let videoUrl = null;
                const char = characters.find(c => c.name.toLowerCase() === (scene.character_name || '').toLowerCase()) || characters[0];
                
                // Allow video gen even for silent action scenes or without photos
                if (scene.dialogue_text || scene.visual_direction) {
                    const visualPrompt = scene.visual_direction || `${scene.character_emotion} character, ${char.vibe}, ${char.traits?.join(', ')}, ${scene.camera_shot} shot, ${scene.background_environment}, ${scene.background_lighting} lighting`;
                    
                    try {
                        addProductionLog(`🎥 Directing performance for Scene ${sIdx + 1} (Imagen + Veo)...`);
                        videoUrl = await apiGenerateVideo(visualPrompt, char?.photo || undefined);
                        addProductionLog(`🎭 Performance captured: ${scene.character_emotion}`);
                    } catch (videoErr: any) {
                        console.warn('[VIDEO_GEN] Non-fatal failure:', videoErr.message);
                        addProductionLog(`⚠️ Video skipped (using image): ${videoErr.message?.substring(0, 40)}`);
                    }
                } else {
                    addProductionLog(`📽️ Static shot for Scene ${sIdx + 1} (no script context).`);
                }

                const completedScene = {
                    ...partialScene,
                    videoUrl: videoUrl || undefined,
                };
                
                // Update the last scene in the array with the completed video URL
                scenesWithAssets[sIdx] = JSON.parse(JSON.stringify(completedScene));
                
                // Final update for this scene
                setOrchestration({ ...orchestrationState, scenes: [...scenesWithAssets] });

                // Wait for 6s to avoid hitting rate limits between scenes
                if (sIdx < result.scenes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 6000));
                }
            }

            // Ensure the final state is saved one last time
            setOrchestration({ ...orchestrationState, scenes: [...scenesWithAssets] });
            setCurrentSceneIdx(0); // Reset for playback

            addProductionLog("🏁 Production Complete! Launching Cinematic Stream...");
            setTimeout(() => {
                setActiveStep(3); // Stay on video tab
                setProcessing(false);
            }, 1500);
        } catch (e: any) {
            console.error('[DIRECTOR] Production error:', e);
            // Always show the real error, not a generic message
            const errorMsg = (e instanceof Error ? e.message : String(e)) || 'Production failed — please check your API key and try again.';
            addProductionLog(`❌ ERROR: ${errorMsg}`);
            setProcessing(false);
            alert(errorMsg);
        } finally {
            setProcessing(false);
        }
    };

    const handleAiCoWrite = async (instruction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify', selectedText?: string, source: 'story' | 'script' = 'story') => {
        setAiWriting(true);
        setCurrentlyProcessingAiAction(instruction);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = source === 'story' ? storyHtml : scriptHtml;
            const scriptSoFar = tempDiv.textContent || tempDiv.innerText || "";

            const result = await aiCoWrite({
                scriptSoFar: scriptSoFar,
                selectedText,
                characters: characters.map(c => ({ name: c.name, vibe: c.vibe })),
                instruction,
                format: source
            });

            if (result) {
                // Format AI result for proper HTML display
                const formatAiResult = (text: string) => {
                    return text
                        .split('\n')
                        .filter(line => line.trim())
                        .map(line => `<p>${line.trim()}</p>`)
                        .join('');
                };

                const formattedResult = formatAiResult(result);

                if (instruction === 'global_scriptify' || instruction === 'scriptify') {
                    // Always push scriptify results to the PRODUCTION SCRIPT area
                    setScriptHtml(scriptHtml + `<p><strong>--- DRAFTED SEQUENCE ---</strong></p>${formattedResult}<p><strong>--- END DRAFT ---</strong></p>`);
                } else if (instruction === 'continue') {
                    // Continue in the same area
                    if (source === 'story') {
                        setStoryHtml(storyHtml + formattedResult);
                    } else {
                        setScriptHtml(scriptHtml + formattedResult);
                    }
                } else if (instruction === 'rewrite' || instruction === 'improve') {
                    // Update the active area
                    if (source === 'story') {
                        setStoryHtml(storyHtml + `<p><strong>AI suggestion:</strong></p>${formattedResult}`);
                    } else {
                        setScriptHtml(scriptHtml + `<p><strong>AI suggestion:</strong></p>${formattedResult}`);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "AI Assistant encountered an error. Please try again.");
        } finally {
            setAiWriting(false);
            setCurrentlyProcessingAiAction(null);
        }
    };

    const playPreview = () => {
        if (!orchestration) return;
        setPlaying(true);
        setCurrentSceneIdx(0);


        const synth = window.speechSynthesis;

        const speakScene = (sceneIdx: number) => {
            const currentScene = orchestration.scenes[sceneIdx];
            if (!currentScene) {
                setPlaying(false);
                return;
            }

            setCurrentSceneIdx(sceneIdx);

            const rawText = currentScene.dialogue_text;
            const dialogueText = rawText
                .replace(/\[[^\]]*\]/g, '') // Strip [brackets]
                .replace(/\([^)]*\)/g, '')   // Strip (parentheses)
                .replace(/^(Time|Scene|Dialogue|Speaker|John|Jane|Voiceover|Narrator|Character):\s+/i, '')
                .replace(/^[a-z]+\s+[0-9]+:\s+/i, '')
                .replace(/^[0-9]+:[0-9]+\s+/g, '')
                .trim();

            const durationMs = (currentScene.duration_seconds || 5) * 1000;

            if (!dialogueText || dialogueText.length < 1) {
                console.log('[PLAYBACK] Playing silent action scene:', sceneIdx);
                // Wait for the duration of the scene then move on
                setTimeout(() => {
                    const nextIdx = sceneIdx + 1;
                    if (nextIdx < (orchestration?.scenes.length || 0)) {
                        speakScene(nextIdx);
                    } else {
                        setPlaying(false);
                    }
                }, durationMs);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(dialogueText);
            (window as any)._lastUtterance = utterance; // Prevent GC

            const voices = synth.getVoices();
            const voiceStyle = currentScene.dialogue_voice_style || 'professional';

            addProductionLog(`🎭 Performance: "${dialogueText.substring(0, 50)}${dialogueText.length > 50 ? '...' : ''}"`);

            // Map voice_style to speech parameters
            const voiceMap: Record<string, { pitch: number; rate: number }> = {
                warm: { pitch: 1.1, rate: 0.95 },
                professional: { pitch: 1.0, rate: 1.0 },
                energetic: { pitch: 1.2, rate: 1.1 },
                calm: { pitch: 0.9, rate: 0.9 },
            };
            const params = voiceMap[voiceStyle] || voiceMap.professional;
            utterance.pitch = params.pitch;
            utterance.rate = params.rate;

            // Pick a voice
            const enVoices = voices.filter(v => v.lang.startsWith('en'));
            if (enVoices.length > 0) {
                utterance.voice = enVoices[sceneIdx % enVoices.length];
            } else if (voices.length > 0) {
                utterance.voice = voices[0];
            }

            utterance.onend = () => {
                (window as any)._lastUtterance = null;
                const nextIdx = sceneIdx + 1;
                if (nextIdx < (orchestration?.scenes.length || 0)) {
                    setTimeout(() => speakScene(nextIdx), 600);
                } else {
                    setPlaying(false);
                }
            };
            utterance.onerror = (err) => {
                console.error('Speech error:', err);
                setPlaying(false);
            };
            synth.speak(utterance);
        };

        speakScene(0);
    };

    const getCurrentSpeaker = () => {
        if (!orchestration) return null;
        const scene = orchestration.scenes[currentSceneIdx];
        if (!scene) return null;
        // Return the first character whose name appears in the dialogue, or the first character
        const dialogueText = scene.dialogue_text || '';
        return characters.find(c => dialogueText.toLowerCase().includes(c.name.toLowerCase())) || characters[0] || null;
    };

    const activeActor = getCurrentSpeaker();

    const [activeProductionPanel, setActiveProductionPanel] = useState<'import' | 'timeline' | 'subtitles' | 'music' | 'publishing'>('import');
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface text-foreground flex flex-col overflow-hidden">
            {/* Main Workspace */}
            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-12 gap-8 min-h-screen overflow-y-auto">
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-4 lg:mb-8">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-bold text-lg shadow-lg">
                                D
                            </div>
                            <div>
                                <h1 className="text-3xl lg:text-5xl font-display font-bold tracking-tight text-white">Director Workspace</h1>
                                <p className="text-foreground/50 text-sm leading-relaxed">Create your story with multi-character interleaved direction.</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => setIsTuningMode(true)}
                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-primary hover:text-primary-light hover:bg-primary/5 rounded-lg transition-all touch-manipulation min-h-[36px] flex items-center gap-2"
                        >
                            <Brain size={14} /> AI Fine-Tuning
                        </button>
                        <button
                            onClick={() => collaboration?.openPanel()}
                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-secondary hover:text-secondary-light hover:bg-secondary/5 rounded-lg transition-all touch-manipulation min-h-[36px] flex items-center gap-2"
                        >
                            <Users size={14} /> Collaborate
                        </button>
                        <button
                            onClick={() => { localStorage.removeItem('diovid-project'); window.location.reload(); }}
                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground/40 hover:text-foreground/80 hover:bg-white/5 rounded-lg transition-all touch-manipulation min-h-[36px]"
                        >
                            Clear & Reset
                        </button>
                    </div>
                </header>

                {/* Top Row: Cast & Editor */}
                <div className={cn(
                    "grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 lg:gap-10 transition-all duration-500 items-start",
                    activeStep === 3 ? "hidden lg:grid" : "grid"
                )}>
                    {/* Cast Management */}
                    <section className={cn(
                        "glass-intense p-6 lg:p-8 transition-all duration-500 border-2 overflow-y-auto custom-scrollbar flex flex-col h-auto max-h-[700px] lg:max-h-[850px]",
                        activeStep === 0
                            ? "border-primary/40 shadow-glow-primary block"
                            : "hidden lg:block opacity-60 border-transparent lg:max-h-[850px]"
                    )}>
                        <div className="flex items-center justify-between mb-4 sm:mb-6">
                            <h2 className="text-base sm:text-lg font-display font-bold flex items-center gap-2 sm:gap-3">
                                <Badge variant="primary" size="sm">1</Badge>
                                <span>Cast Management</span>
                            </h2>
                            <button onClick={addCharacter} className="text-xs flex items-center gap-2 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all font-semibold">
                                <Sparkles size={14} className="animate-pulse" /> Add Actor
                            </button>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                            {characters.map((char) => (
                                <div key={char.id} className="p-4 rounded-xl bg-surface/50 border border-border/30 hover:border-primary/30 space-y-4 relative group transition-all">
                                    {characters.length > 1 && (
                                        <button
                                            onClick={() => removeCharacter(char.id)}
                                            className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-error/20 text-error hover:bg-error hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-primary/60 hover:scale-105 transition-all shrink-0">
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                onChange={(e) => handlePhotoUpload(char.id, e)}
                                                accept="image/*"
                                            />
                                            {char.photo ? (
                                                <img src={char.photo} className="w-full h-full object-cover" alt={char.name} />
                                            ) : (
                                                <div className="flex flex-col items-center gap-1">
                                                    <Camera size={24} className="text-primary/60" />
                                                    <span className="text-[8px] text-foreground/40 uppercase font-mono">Upload</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <input
                                                value={char.name}
                                                onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                                placeholder="Actor Name"
                                                className="w-full bg-background/80 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 transition-all font-semibold text-white"
                                            />
                                            <input
                                                value={char.vibe}
                                                onChange={(e) => updateCharacter(char.id, { vibe: e.target.value })}
                                                placeholder="Actor Vibe"
                                                className="w-full bg-background/60 border border-border/30 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-secondary/60 transition-all text-white/50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {activeStep === 0 && (
                            <button onClick={() => setActiveStep(1)} className="w-full mt-6 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary flex items-center justify-center gap-2">
                                Continue to Scripting <ChevronRight size={16} />
                            </button>
                        )}
                    </section>

                    {/* Script Editor */}
                    <section className={cn(
                        "glass-intense p-6 lg:p-8 transition-all duration-500 border-2 overflow-hidden min-h-[600px] lg:max-h-[850px]",
                        activeStep === 1 ? "border-primary/40 shadow-glow-primary" : "hidden lg:block opacity-60 border-transparent"
                    )}>
                        <h2 className="text-lg font-display font-bold flex items-center gap-3 mb-6 text-white">
                            <Badge variant="primary" size="sm">2</Badge> Script & AI Assistant
                        </h2>
                        <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100%-120px)]">
                            <div className="flex flex-col min-h-0">
                                <h3 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-2">Story Treatment</h3>
                                <TiptapEditor
                                    content={storyHtml}
                                    onChange={setStoryHtml}
                                    onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'story')}
                                    isAiProcessing={isAiWriting}
                                    currentlyProcessing={currentlyProcessingAiAction}
                                    role="story"
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex flex-col min-h-0">
                                <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Production Script</h3>
                                <TiptapEditor
                                    content={scriptHtml}
                                    onChange={setScriptHtml}
                                    onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'script')}
                                    isAiProcessing={isAiWriting}
                                    currentlyProcessing={currentlyProcessingAiAction}
                                    role="script"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="mt-auto pt-6 px-4">
                            <button onClick={() => setActiveStep(2)} disabled={!scriptHtml} className="w-full button-premium h-14 text-white font-bold flex items-center justify-center gap-3">
                                <Mic size={18} /> Continue to Audio <ChevronRight size={16} />
                            </button>
                        </div>
                    </section>
                </div>

                {/* Audio Studio */}
                <section className={cn(
                    "glass-intense p-6 lg:p-8 transition-all duration-500 border-2 overflow-hidden min-h-[600px] lg:max-h-[850px]",
                    activeStep === 2 ? "border-primary/40 shadow-glow-primary block" : "hidden lg:block opacity-60 border-transparent"
                )}>
                    <h2 className="text-lg font-display font-bold flex items-center gap-3 mb-6 text-white">
                        <Badge variant="primary" size="sm">3</Badge> Audio Production Studio
                    </h2>
                    <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-8">
                        <div className="w-32 h-32 rounded-3xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                            <Mic className="w-16 h-16 text-primary" />
                        </div>
                        <div className="text-center max-w-lg space-y-4">
                            <h3 className="text-2xl font-display font-bold text-white">Professional Audio</h3>
                            <p className="text-white/40">Record voices, generate speech synthesis, or add background scores.</p>
                            <div className="flex gap-4 justify-center">
                                <button onClick={openAudioPanel} className="button-premium px-8 py-4 flex items-center gap-2">
                                    <Mic size={20} /> Open Audio Studio
                                </button>
                                <button onClick={() => setActiveStep(3)} className="glass px-8 py-4 text-white/60 hover:text-white">Skip</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Preview Area (The Final Export Container) */}
                <section className={cn(
                    "glass-intense rounded-3xl p-6 lg:p-10 relative flex flex-col border-2 border-border/20 overflow-hidden min-h-[700px] bg-black/40",
                    activeStep === 3 ? "block" : "hidden"
                )}>
                    <AnimatePresence mode="wait">
                        {isProcessing && (
                            <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 z-50 flex">
                                <div className="grid grid-cols-1 lg:grid-cols-2 w-full h-full">
                                    {/* Left: Console Logs */}
                                    <div className="p-8 border-r border-white/10 flex flex-col gap-6">
                                        <div className="flex items-center gap-3">
                                            <Sparkles className="text-primary animate-pulse" />
                                            <h3 className="font-display font-bold text-white tracking-widest uppercase text-xs">AI Director Engine</h3>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 font-mono text-[10px] text-white/40">
                                            {productionLogs.map((log, i) => (
                                                <div key={i} className={cn("p-2 rounded border transition-all", i === productionLogs.length - 1 ? "bg-primary/10 border-primary/30 text-primary" : "border-white/5")}>
                                                    {log}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Right: Live Monitor */}
                                    <div className="p-8 flex flex-col justify-center items-center bg-white/5">
                                        {orchestration?.scenes && orchestration.scenes.length > 0 ? (
                                            <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-3xl">
                                                {(() => {
                                                    const latest = orchestration.scenes[orchestration.scenes.length - 1];
                                                    return latest.videoUrl ? (
                                                        <video src={latest.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                                                    ) : latest.backgroundUrl ? (
                                                        <img src={latest.backgroundUrl} className="w-full h-full object-cover" alt="Monitor" />
                                                    ) : null;
                                                })()}
                                                <div className="absolute top-4 right-4 px-2 py-1 bg-red-600 text-white text-[8px] font-bold animate-pulse rounded">LIVE FEED</div>
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <div className="animate-spin text-primary"><RefreshCw size={32} /></div>
                                                <p className="text-white/20 uppercase tracking-[0.3em] text-[10px]">Initializing...</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {!orchestration && !isProcessing && (
                            <motion.div key="ready" className="h-[500px] flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-float">
                                    <Film size={48} />
                                </div>
                                <h2 className="text-3xl font-display font-bold text-white">Cinematic Ready</h2>
                                <p className="text-white/40 max-w-md">Gemini is ready to orchestrate your script into a full production.</p>
                                <button onClick={startDirecting} className="button-premium px-12 py-5 text-xl">Command Director</button>
                            </motion.div>
                        )}

                        {orchestration && !isProcessing && (
                            <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
                                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-black shadow-inner border border-white/10 mb-8">
                                    {(() => {
                                        const scene = orchestration.scenes[currentSceneIdx];
                                        if (!scene) return null;
                                        return (
                                            <div className="absolute inset-0">
                                                {scene.videoUrl ? (
                                                    <video key={`vid-${currentSceneIdx}`} src={scene.videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                                                ) : scene.backgroundUrl ? (
                                                    <img key={`img-${currentSceneIdx}`} src={scene.backgroundUrl} className="w-full h-full object-cover" alt="Scene" />
                                                ) : <div className="w-full h-full bg-surface/20 flex items-center justify-center text-white/10 uppercase tracking-widest text-xs">Placeholder</div>}
                                                
                                                {/* On-Screen HUD */}
                                                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="px-2 py-0.5 rounded bg-primary text-black text-[10px] font-bold uppercase">Scene {currentSceneIdx + 1}</div>
                                                        <div className="text-[10px] text-white/40 font-mono italic uppercase">{scene.camera_shot} / {scene.camera_movement}</div>
                                                    </div>
                                                    <div className="text-xl sm:text-2xl font-medium text-white max-w-4xl drop-shadow-lg leading-relaxed italic">
                                                        {scene.dialogue_text || scene.visual_direction || "Action Sequence"}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Progress Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: "0%" }}
                                            animate={{
                                                width: (orchestration.scenes.length > 0)
                                                    ? `${((currentSceneIdx + 1) * 100) / orchestration.scenes.length}%`
                                                    : "0%"
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Action Zone */}
                                <div className="flex justify-between items-start gap-8">
                                    <div className="flex gap-4">
                                        {!isPlaying ? (
                                            <button onClick={playPreview} className="button-premium px-12 py-5 text-xl flex items-center gap-4 bg-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]">
                                                <Play size={24} fill="currentColor" /> Play Performance
                                            </button>
                                        ) : (
                                            <div className="glass px-8 py-5 flex items-center gap-4 border-primary/40 text-primary font-bold tracking-[0.2em] uppercase text-sm">
                                                <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                                                Playing Scene {currentSceneIdx + 1}
                                            </div>
                                        )}
                                        <button onClick={() => setOrchestration(null)} className="glass px-6 rounded-2xl hover:bg-white/5 transition-colors text-foreground/40 text-xs font-mono uppercase tracking-widest">Re-Orchestrate</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-right">
                                        <span className="text-[10px] text-foreground/30 font-mono uppercase">Emotion:</span>
                                        <span className="text-[10px] text-primary/60 font-mono">{orchestration.scenes[currentSceneIdx]?.character_emotion || 'neutral'}</span>
                                        
                                        <span className="text-[10px] text-foreground/30 font-mono uppercase">Eye Focus:</span>
                                        <span className="text-[10px] text-primary/60 font-mono">{orchestration.scenes[currentSceneIdx]?.character_eye_focus || 'camera'}</span>
                                        
                                        <span className="text-[10px] text-foreground/30 font-mono uppercase">Gesture:</span>
                                        <span className="text-[10px] text-primary/60 font-mono">{(orchestration.scenes[currentSceneIdx]?.animation_contract?.gesture_name || 'arms_relaxed').replace(/_/g, ' ')}</span>
                                        
                                        <span className="text-[10px] text-foreground/30 font-mono uppercase">Scene:</span>
                                        <span className="text-[10px] text-primary/60 font-mono">{currentSceneIdx + 1} / {orchestration.scenes.length}</span>
                                    </div>
                                </div>

                                {/* Live Director & Production Workflow Panels */}
                                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 xl:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-display font-bold flex items-center gap-2 text-white">
                                            <Sparkles size={20} className="text-secondary" />
                                            Real-time Multimodal Direction
                                        </h3>
                                        <LiveDirector />
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-display font-bold flex items-center gap-2 text-white">
                                            <Sparkles size={20} className="text-primary" />
                                            Professional Production Studio
                                        </h3>
                                        <ProfessionalProductionPanel onExport={() => console.log('Export')} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            </main>

            {/* Mobile Bottom Navigation - Floating Premium Design */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 z-50">
                <nav className="glass-intense rounded-2xl border border-white/10 shadow-2xl flex items-center justify-around p-2 backdrop-blur-2xl">
                    {[
                        { id: 0, label: 'Cast', icon: Camera },
                        { id: 1, label: 'Script', icon: Layout },
                        { id: 2, label: 'Audio', icon: Mic },
                        { id: 3, label: 'Preview', icon: Video },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveStep(tab.id)}
                            className={cn(
                                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all relative",
                                activeStep === tab.id
                                    ? "bg-primary/20 text-primary"
                                    : "text-foreground/40"
                            )}
                        >
                            <tab.icon size={20} className={cn(activeStep === tab.id && "animate-pulse")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
                            {activeStep === tab.id && (
                                <motion.div
                                    layoutId="mobile-tab-pill"
                                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
