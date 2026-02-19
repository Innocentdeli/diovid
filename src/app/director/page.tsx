"use client";

import { useState, useEffect } from 'react';
import { Camera, Send, Sparkles, Image as ImageIcon, Mic, Layout, Play, Clock, ChevronRight, Video, Zap, Film } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TiptapEditor from '@/components/TiptapEditor';
import { directStory } from '@/app/actions/orchestrate';
import { generateSceneBackground } from '@/app/actions/generateImage';
import { generateSceneVideo } from '@/app/actions/generateVideo';
import { aiCoWrite } from '@/app/actions/aiWriter';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Badge } from '@/components/ui/Badge';

interface Character {
    id: string;
    name: string;
    vibe: string;
    traits: string[];
    photo: string | null;
}

interface Scene {
    scene_id: number;
    duration_seconds: number;
    background: {
        environment: string;
        lighting: string;
    };
    camera: {
        shot: string;
        movement: string;
    };
    character: {
        pose: string;
        emotion: string;
        eye_focus: string;
    };
    animation_contract: {
        face: {
            blink_rate: string;
            mouth_activity: string;
        };
        head: {
            motion_type: string;
            intensity: number;
        };
        gesture: {
            gesture_name: string | null;
            start_time_seconds: number;
            end_time_seconds: number;
        };
    };
    dialogue: {
        text: string;
        voice_style: string;
        lip_sync: boolean;
    };
    transition_out: string;
    // Generated assets
    backgroundUrl?: string;
    videoUrl?: string;
}

interface Orchestration {
    video_meta: {
        aspect_ratio: string;
        style: string;
        total_duration_seconds: number;
    };
    character_profile: {
        source: string;
        framing: string;
        default_pose: string;
        idle_motion: boolean;
    };
    scenes: Scene[];
}

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
    const [characters, setCharacters] = useState<Character[]>([
        { id: '1', name: '', vibe: '', traits: [], photo: null }
    ]);
    const [storyHtml, setStoryHtml] = useState("");
    const [scriptHtml, setScriptHtml] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isAiWriting, setIsAiWriting] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [orchestration, setOrchestration] = useState<Orchestration | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSceneIdx, setCurrentSceneIdx] = useState(0);

    const [productionLogs, setProductionLogs] = useState<string[]>([]);
    const [currentlyProcessingAiAction, setCurrentlyProcessingAiAction] = useState<'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify' | null>(null);

    // Auto-scroll logs
    useEffect(() => {
        const el = document.getElementById('logs-end');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, [productionLogs]);

    // Voice loading safety
    useEffect(() => {
        window.speechSynthesis.getVoices();
    }, []);

    // Persistence: Load from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('diovid-project');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                if (data.characters) setCharacters(data.characters);
                if (data.scriptHtml) setScriptHtml(data.scriptHtml);
            } catch (e) {
                console.error("Failed to load saved project", e);
            }
        }
    }, []);

    // Persistence: Save to localStorage
    useEffect(() => {
        if (characters.length > 0 || scriptHtml) {
            localStorage.setItem('diovid-project', JSON.stringify({ characters, scriptHtml }));
        }
    }, [characters, scriptHtml]);

    const addCharacter = () => {
        setCharacters([...characters, { id: Date.now().toString(), name: '', vibe: '', traits: [], photo: null }]);
    };

    const updateCharacter = (id: string, updates: Partial<Character>) => {
        setCharacters(characters.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const removeCharacter = (id: string) => {
        if (characters.length > 1) {
            setCharacters(characters.filter(c => c.id !== id));
        }
    };

    const handlePhotoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
                const compressed = await compressImage(reader.result as string);
                updateCharacter(id, { photo: compressed });
            };
            reader.readAsDataURL(file);
        }
    };

    const startDirecting = async () => {
        if (characters.some(c => !c.name) || !scriptHtml) return;
        setIsProcessing(true);
        try {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = scriptHtml;
            const plainTextIntent = tempDiv.textContent || tempDiv.innerText || "";

            const photos = characters.map(c => c.photo).filter(Boolean) as string[];

            const result = await directStory(photos, plainTextIntent, characters.map(c => ({
                name: c.name,
                vibe: c.vibe,
                traits: c.traits
            })));

            setOrchestration({ ...result, scenes: [] });
            setProductionLogs(["🎬 Video Director initialized. Starting production..."]);

            const scenesWithAssets: Scene[] = [];
            for (const [sIdx, scene] of result.scenes.entries()) {
                setProductionLogs(prev => [...prev, `🎬 Scene ${sIdx + 1}: ${scene.background?.environment || 'Setting scene'}...`]);

                // Generate background from environment description
                const bgUrl = await generateSceneBackground(scene.background?.environment || 'cinematic studio');
                setProductionLogs(prev => [...prev, `✅ Background set for Scene ${sIdx + 1}: ${scene.camera?.shot} / ${scene.character?.emotion}`]);

                // Generate acting video from dialogue + character emotion
                let videoUrl = null;
                const char = characters.find(c => c.photo);
                if (char?.photo && scene.dialogue?.text) {
                    const gestureName = scene.animation_contract?.gesture?.gesture_name || 'arms_relaxed';
                    const headMotion = scene.animation_contract?.head?.motion_type || 'none';
                    const visualPrompt = `${scene.character?.emotion} character, ${gestureName}, head ${headMotion}, ${scene.camera?.shot} shot, ${scene.background?.environment}, ${scene.background?.lighting} lighting`;
                    const partUrl = await generateSceneBackground(visualPrompt, char.photo, { name: char.name, vibe: char.vibe, traits: char.traits });
                    if (partUrl) {
                        videoUrl = await generateSceneVideo(visualPrompt, partUrl);
                        setProductionLogs(prev => [...prev, `🎭 Acting clip captured: ${scene.character?.emotion} / ${gestureName} / head:${headMotion}`]);
                    }
                }

                const completedScene = {
                    ...scene,
                    backgroundUrl: bgUrl || `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920`,
                    videoUrl: videoUrl || undefined,
                };

                scenesWithAssets.push(completedScene);
                setOrchestration(prev => prev ? { ...prev, scenes: [...scenesWithAssets] } : null);
            }

            setProductionLogs(prev => [...prev, "🏁 Production Complete! Launching Cinematic Stream..."]);
            setTimeout(() => {
                setActiveStep(2);
                setIsProcessing(false);
            }, 1000);
        } catch (e: any) {
            console.error(e);
            const isFetchError = e.message?.includes('fetch') || e.name === 'TypeError';
            const errorMsg = isFetchError
                ? "Network connection interrupted. This usually happens with large scripts or slow connections. Please try again with a smaller prompt."
                : (e instanceof Error ? e.message : "Production failed. Please check your AI quota or connection.");

            setProductionLogs(prev => [...prev, `❌ ERROR: ${errorMsg}`]);
            alert(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAiCoWrite = async (instruction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify', selectedText?: string, source: 'story' | 'script' = 'story') => {
        setIsAiWriting(true);
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
                if (instruction === 'global_scriptify' || instruction === 'scriptify') {
                    // Always push scriptify results to the PRODUCTION SCRIPT area
                    setScriptHtml(prev => prev + `<p>--- DRAFTED SEQUENCE ---</p>${result}<p>--- END DRAFT ---</p>`);
                } else if (instruction === 'continue') {
                    // Continue in the same area
                    if (source === 'story') {
                        setStoryHtml(prev => prev + `<p>${result}</p>`);
                    } else {
                        setScriptHtml(prev => prev + `<p>${result}</p>`);
                    }
                } else if (instruction === 'rewrite' || instruction === 'improve') {
                    // Update the active area
                    if (source === 'story') {
                        setStoryHtml(prev => prev + `<p><strong>AI suggestion:</strong> ${result}</p>`);
                    } else {
                        setScriptHtml(prev => prev + `<p><strong>AI suggestion:</strong> ${result}</p>`);
                    }
                }
            }
        } catch (e) {
            console.error(e);
            alert(e instanceof Error ? e.message : "AI Assistant encountered an error. Please try again.");
        } finally {
            setIsAiWriting(false);
            setCurrentlyProcessingAiAction(null);
        }
    };

    const playPreview = () => {
        if (!orchestration) return;
        setIsPlaying(true);
        setCurrentSceneIdx(0);


        const synth = window.speechSynthesis;

        const speakScene = (sceneIdx: number) => {
            const currentScene = orchestration.scenes[sceneIdx];
            if (!currentScene) {
                setIsPlaying(false);
                return;
            }

            setCurrentSceneIdx(sceneIdx);

            const dialogueText = currentScene.dialogue?.text;
            if (!dialogueText) {
                // Skip to next scene if no dialogue
                setTimeout(() => speakScene(sceneIdx + 1), 500);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(dialogueText);
            const voices = synth.getVoices();
            const voiceStyle = currentScene.dialogue?.voice_style || 'professional';

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
                const nextIdx = sceneIdx + 1;
                if (nextIdx < orchestration.scenes.length) {
                    setTimeout(() => speakScene(nextIdx), 600);
                } else {
                    setIsPlaying(false);
                }
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
        const dialogueText = scene.dialogue?.text || '';
        return characters.find(c => dialogueText.toLowerCase().includes(c.name.toLowerCase())) || characters[0] || null;
    };

    const activeActor = getCurrentSpeaker();

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-surface text-foreground flex flex-col lg:flex-row overflow-hidden">
            {/* Responsive Navigation - Sidebar on desktop, Bottom nav on mobile */}

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-20 border-r border-border/30 flex-col items-center py-6 gap-6 glass-intense m-4 rounded-2xl h-[calc(100vh-32px)] z-50 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-bold text-xl shadow-lg">
                    D
                </div>
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <nav className="flex flex-col gap-4 flex-1 pt-4">
                    <button
                        onClick={() => setActiveStep(0)}
                        className={cn(
                            "p-3 rounded-xl transition-all relative group",
                            activeStep === 0
                                ? "bg-primary text-white shadow-glow-primary"
                                : "text-foreground/40 hover:text-foreground/70 hover:bg-white/5"
                        )}
                        title="Cast"
                    >
                        <Camera className="w-6 h-6" />
                        {activeStep === 0 && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveStep(1)}
                        className={cn(
                            "p-3 rounded-xl transition-all relative group",
                            activeStep === 1
                                ? "bg-primary text-white shadow-glow-primary"
                                : "text-foreground/40 hover:text-foreground/70 hover:bg-white/5"
                        )}
                        title="Script"
                    >
                        <Layout className="w-6 h-6" />
                        {activeStep === 1 && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveStep(2)}
                        className={cn(
                            "p-3 rounded-xl transition-all relative group",
                            activeStep === 2
                                ? "bg-primary text-white shadow-glow-primary"
                                : "text-foreground/40 hover:text-foreground/70 hover:bg-white/5"
                        )}
                        title="Director Dashboard"
                    >
                        <Video className="w-6 h-6" />
                        {activeStep === 2 && (
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                    </button>
                </nav>

                {/* Bottom status */}
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" title="Connected" />
            </aside>

            {/* Mobile Top Bar */}
            <div className="lg:hidden sticky top-0 z-50 glass-intense border-b border-border/30 backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-bold text-sm">
                            D
                        </div>
                        <span className="font-display font-bold text-sm">DIOVID</span>
                    </div>
                    <StatusIndicator status="active" label="Connected" pulse />
                </div>

                {/* Mobile Tab Navigation */}
                <div className="flex border-t border-border/30">
                    <button
                        onClick={() => setActiveStep(0)}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-3 transition-all relative touch-manipulation min-h-[60px]",
                            activeStep === 0
                                ? "text-primary bg-primary/10"
                                : "text-foreground/40"
                        )}
                    >
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px] font-mono uppercase">Cast</span>
                        {activeStep === 0 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveStep(1)}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-3 transition-all relative touch-manipulation min-h-[60px]",
                            activeStep === 1
                                ? "text-primary bg-primary/10"
                                : "text-foreground/40"
                        )}
                    >
                        <Layout className="w-5 h-5" />
                        <span className="text-[10px] font-mono uppercase">Script</span>
                        {activeStep === 1 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveStep(2)}
                        className={cn(
                            "flex-1 flex flex-col items-center gap-1 py-3 transition-all relative touch-manipulation min-h-[60px]",
                            activeStep === 2
                                ? "text-primary bg-primary/10"
                                : "text-foreground/40"
                        )}
                    >
                        <Video className="w-5 h-5" />
                        <span className="text-[10px] font-mono uppercase">Preview</span>
                        {activeStep === 2 && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                </div>
            </div>

            {/* Main Workspace - Responsive */}
            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 gap-4 sm:gap-6 min-h-screen h-auto">
                <header className="hidden lg:flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-display font-bold tracking-tight mb-2">Director Workspace</h1>
                        <p className="text-foreground/50 text-sm leading-relaxed">Create your story with multi-character interleaved direction.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={() => { localStorage.removeItem('diovid-project'); window.location.reload(); }}
                            className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground/40 hover:text-foreground/80 hover:bg-white/5 rounded-lg transition-all touch-manipulation min-h-[36px]"
                        >
                            Clear & Reset
                        </button>
                        <StatusIndicator status="active" label="Gemini Connected" pulse />
                    </div>
                </header>

                <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 h-auto">
                    {/* Top Row: Cast & Editor - Side by Side */}
                    <div className={cn(
                        "grid grid-cols-1 md:grid-cols-[1fr_2.5fr] gap-4 sm:gap-6 transition-all duration-500 items-start",
                        activeStep === 2 ? "hidden lg:grid" : "grid"
                    )}>

                        {/* Cast Management - Responsive */}
                        <section className={cn(
                            "glass-intense p-4 sm:p-6 transition-all duration-500 border-2 overflow-y-auto custom-scrollbar flex flex-col h-auto max-h-[600px] lg:max-h-[700px]",
                            activeStep === 0
                                ? "border-primary/40 shadow-glow-primary block"
                                : "hidden md:block opacity-60 border-transparent"
                        )}>
                            <div className="flex items-center justify-between mb-4 sm:mb-6">
                                <h2 className="text-base sm:text-lg font-display font-bold flex items-center gap-2 sm:gap-3">
                                    <Badge variant="primary" size="sm">
                                        <span className="text-xs sm:text-sm">1</span>
                                    </Badge>
                                    <span className="hidden sm:inline">Cast Management</span>
                                    <span className="sm:hidden">Cast</span>
                                </h2>
                                <button
                                    onClick={addCharacter}
                                    className="text-xs flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all font-semibold touch-manipulation min-h-[36px]"
                                    aria-label="Add new character to cast"
                                >
                                    <Sparkles size={14} className="animate-pulse" />
                                    <span className="hidden sm:inline">Add Actor</span>
                                    <span className="sm:hidden">Add</span>
                                </button>
                            </div>

                            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                                {characters.map((char) => (
                                    <div key={char.id} className="p-4 rounded-xl bg-surface/50 border border-border/30 hover:border-primary/30 space-y-4 relative group transition-all">
                                        {characters.length > 1 && (
                                            <button
                                                onClick={() => removeCharacter(char.id)}
                                                className="absolute top-3 right-3 w-6 h-6 rounded-lg bg-error/20 text-error hover:bg-error hover:text-white transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold"
                                                aria-label={`Remove ${char.name || 'character'}`}
                                            >
                                                ✕
                                            </button>
                                        )}
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-primary/60 hover:scale-105 transition-all shrink-0 group/upload">
                                                <input
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                    onChange={(e) => handlePhotoUpload(char.id, e)}
                                                    accept="image/*"
                                                    aria-label={`Upload photo for ${char.name || 'character'}`}
                                                />
                                                {char.photo ? (
                                                    <img src={char.photo} className="w-full h-full object-cover" alt={char.name} />
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Camera size={24} className="text-primary/60 group-hover/upload:scale-110 transition-transform" />
                                                        <span className="text-[8px] text-foreground/40 uppercase font-mono">Upload</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={char.name}
                                                    onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                                    placeholder="Actor Name (e.g. John Doe)"
                                                    className="w-full bg-background/80 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/60 focus:bg-background transition-all font-semibold"
                                                    aria-label="Character name"
                                                />
                                                <input
                                                    value={char.vibe}
                                                    onChange={(e) => updateCharacter(char.id, { vibe: e.target.value })}
                                                    placeholder="Actor Vibe (e.g. Grumpy Detective)"
                                                    className="w-full bg-background/60 border border-border/30 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-secondary/60 focus:bg-background transition-all text-foreground/70"
                                                    aria-label="Character vibe or personality"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {activeStep === 0 && (
                                <button
                                    onClick={() => setActiveStep(1)}
                                    className="w-full mt-4 sm:mt-6 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 hover:border-primary/50 active:scale-95 transition-all text-sm font-semibold text-primary flex items-center justify-center gap-2 touch-manipulation min-h-[48px] shrink-0"
                                >
                                    Continue to Scripting
                                    <ChevronRight size={16} />
                                </button>
                            )}
                        </section>

                        {/* Script Editor - Responsive */}
                        <section className={cn(
                            "glass-intense p-4 sm:p-6 transition-all duration-500 flex flex-col border-2 overflow-hidden min-h-[400px] lg:min-h-[400px] h-auto",
                            activeStep === 1
                                ? "border-primary/40 shadow-glow-primary block"
                                : "hidden md:block opacity-60 border-transparent"
                        )}>
                            <h2 className="text-base sm:text-lg font-display font-bold flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                                <Badge variant="primary" size="sm">
                                    <span className="text-xs sm:text-sm">2</span>
                                </Badge>
                                <span className="hidden sm:inline">Script & AI Assistant</span>
                                <span className="sm:hidden">Script</span>
                            </h2>

                            <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 items-start">
                                {/* Story Treatment Area */}
                                <div className="flex flex-col min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                                        <h3 className="text-[10px] sm:text-xs font-bold text-foreground/40 uppercase tracking-widest">Story Treatment</h3>
                                        <span className="text-[9px] sm:text-[10px] text-foreground/20 italic">Draft & Continue</span>
                                    </div>
                                    <TiptapEditor
                                        content={storyHtml}
                                        onChange={setStoryHtml}
                                        onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'story')}
                                        isAiProcessing={isAiWriting}
                                        currentlyProcessing={currentlyProcessingAiAction}
                                        role="story"
                                        className="flex-1 overflow-hidden"
                                    />
                                </div>

                                {/* Production Script Area */}
                                <div className="flex flex-col min-h-0 overflow-hidden">
                                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                                        <h3 className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest">Production Script</h3>
                                        <span className="text-[9px] sm:text-[10px] text-primary/40 italic">Final Dialogue</span>
                                    </div>
                                    <TiptapEditor
                                        content={scriptHtml}
                                        onChange={setScriptHtml}
                                        onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'script')}
                                        isAiProcessing={isAiWriting}
                                        currentlyProcessing={currentlyProcessingAiAction}
                                        role="script"
                                        className="flex-1 overflow-hidden"
                                    />
                                </div>
                            </div>

                            <div className="sticky bottom-0 pt-6 pb-2 bg-gradient-to-t from-background/90 via-background/50 to-transparent backdrop-blur-sm z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-auto">
                                <button
                                    onClick={startDirecting}
                                    disabled={isProcessing || !scriptHtml}
                                    className="w-full button-premium flex items-center justify-center gap-2 sm:gap-3 h-12 sm:h-14 relative overflow-hidden text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-glow-primary"
                                >
                                    <AnimatePresence mode="wait">
                                        {isProcessing ? (
                                            <motion.div
                                                key="processing"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="flex items-center gap-2 sm:gap-3"
                                            >
                                                <Sparkles className="animate-spin" size={18} />
                                                <span className="font-semibold text-sm sm:text-base">Orchestrating...</span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="ready"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                className="flex items-center gap-2 sm:gap-3"
                                            >
                                                <Zap size={18} className="hidden sm:block" />
                                                <span className="font-semibold text-sm sm:text-base">Produce Stream</span>
                                                <Send size={16} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Bottom Row: Preview Area - Full Width */}
                    <div className={cn(
                        "glass-intense rounded-2xl p-4 sm:p-6 lg:p-8 relative flex flex-col border-2 border-border/20 overflow-hidden transition-all duration-500 bg-gradient-to-br from-surface/50 to-background/50 shrink-0",
                        activeStep === 2 ? "min-h-[600px] lg:min-h-[700px] h-auto" : "hidden lg:flex min-h-[400px] xl:min-h-[500px] h-auto"
                    )}>
                        <AnimatePresence mode="wait">
                            {!orchestration && !isProcessing && (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex flex-col items-center justify-center text-center p-6 sm:p-8 lg:p-12 min-h-[400px]"
                                >
                                    <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 sm:mb-8 border-2 border-primary/30 shadow-glow-primary animate-float">
                                        <Film className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-primary" />
                                    </div>
                                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold mb-3 sm:mb-4 tracking-tight gradient-text">Ready for Production</h2>
                                    <p className="text-foreground/50 text-sm sm:text-base leading-relaxed px-4">
                                        Upload your cast and draft a script. Gemini will generate a cinematic multimodal story with audio and visuals.
                                    </p>
                                    <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
                                        <Badge variant="primary" size="sm">AI-Powered</Badge>
                                        <Badge variant="secondary" size="sm">Multimodal</Badge>
                                        <Badge variant="accent" size="sm">Real-time</Badge>
                                    </div>
                                </motion.div>
                            )}

                            {isProcessing && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex bg-black/90 backdrop-blur-xl z-40 overflow-hidden"
                                >
                                    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 h-full">
                                        {/* Left: Production Console - Responsive */}
                                        <div className="border-b lg:border-b-0 lg:border-r border-white/10 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 overflow-hidden bg-gradient-to-br from-background to-surface/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border-2 border-primary/40 shadow-glow-primary">
                                                        <Sparkles size={16} className="sm:w-[18px] sm:h-[18px] text-primary animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xs sm:text-sm font-display font-bold tracking-tight">Production Studio</h3>
                                                        <p className="text-[9px] sm:text-[10px] text-foreground/40 font-mono uppercase tracking-wider">Gemini Engine</p>
                                                    </div>
                                                </div>
                                                <Badge variant="primary" size="sm">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping mr-1" />
                                                    <span className="hidden sm:inline">Live</span>
                                                    <span className="sm:hidden">●</span>
                                                </Badge>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1.5 sm:gap-2 font-mono text-[10px] sm:text-[11px] max-h-[200px] lg:max-h-full">
                                                {productionLogs.map((log, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.05 }}
                                                        className={cn(
                                                            "p-2 sm:p-3 rounded-lg sm:rounded-xl border flex gap-2 sm:gap-3 transition-all",
                                                            i === productionLogs.length - 1
                                                                ? "bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 text-primary shadow-glow-primary"
                                                                : "bg-surface/30 border-border/20 text-foreground/50"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "font-bold tabular-nums text-[9px] sm:text-[10px]",
                                                            i === productionLogs.length - 1 ? "text-primary" : "opacity-30"
                                                        )}>
                                                            {String(i + 1).padStart(2, '0')}
                                                        </span>
                                                        <span className="flex-1 leading-relaxed text-[10px] sm:text-[11px]">{log}</span>
                                                    </motion.div>
                                                ))}
                                                <div id="logs-end" />
                                            </div>

                                            <div className="pt-4 sm:pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 opacity-50">
                                                <div className="flex gap-3 sm:gap-4">
                                                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] uppercase tracking-widest"><Camera size={9} className="sm:w-[10px] sm:h-[10px]" /> IMAGEN</div>
                                                    <div className="flex items-center gap-1 sm:gap-1.5 text-[8px] sm:text-[9px] uppercase tracking-widest"><Video size={9} className="sm:w-[10px] sm:h-[10px]" /> VERTEX</div>
                                                </div>
                                                <div className="w-full sm:w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: `${(orchestration?.scenes.length || 0) * 33}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Visual Feed - Responsive */}
                                        <div className="relative flex flex-col items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-black/40 to-black/80 flex-1">
                                            <AnimatePresence mode="wait">
                                                {orchestration?.scenes && orchestration.scenes.length > 0 ? (
                                                    <motion.div
                                                        key={orchestration.scenes.length}
                                                        initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                        className="relative w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden shadow-2xl border border-white/10 group"
                                                    >
                                                        {(() => {
                                                            const latestScene = orchestration.scenes[orchestration.scenes.length - 1];

                                                            if (latestScene.videoUrl) {
                                                                return (
                                                                    <video
                                                                        src={latestScene.videoUrl}
                                                                        className="w-full h-full object-cover"
                                                                        autoPlay
                                                                        loop
                                                                        muted
                                                                        playsInline
                                                                    />
                                                                );
                                                            } else if (latestScene.backgroundUrl) {
                                                                return (
                                                                    <img
                                                                        src={latestScene.backgroundUrl}
                                                                        className="w-full h-full object-cover"
                                                                        alt="Latest Generation"
                                                                    />
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-4 lg:p-6">
                                                            <div className="text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-widest mb-1 flex items-center gap-1 sm:gap-2">
                                                                <Play size={8} className="sm:w-[10px] sm:h-[10px]" fill="currentColor" /> Live Feed
                                                            </div>
                                                            <div className="text-xs sm:text-sm font-bold truncate max-w-full">
                                                                Scene {orchestration.scenes.length}: {orchestration.scenes[orchestration.scenes.length - 1].background?.environment}
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2">
                                                            <div className="glass px-1.5 sm:px-2 py-0.5 sm:py-1 text-[7px] sm:text-[8px] font-mono tracking-tighter bg-black/60 border-primary/40">SYNC</div>
                                                            <div className="glass px-1.5 sm:px-2 py-0.5 sm:py-1 text-[7px] sm:text-[8px] font-mono tracking-tighter bg-black/60">OK</div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="text-center space-y-3 sm:space-y-4">
                                                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 bg-white/5 relative">
                                                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                                            <Camera className="text-white/20" size={20} />
                                                        </div>
                                                        <h4 className="text-xs sm:text-sm font-bold opacity-40 uppercase tracking-widest">Awaiting First Frame</h4>
                                                        <p className="text-[9px] sm:text-[10px] opacity-20 max-w-[240px] sm:max-w-[280px] mx-auto leading-relaxed px-4">AI is simulating your first scene...</p>
                                                    </div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {orchestration && orchestration.scenes.length > 0 && (
                                <motion.div
                                    key="output"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="flex-1 flex flex-col h-full"
                                >
                                    {/* Cinematic Viewport */}
                                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/5 mb-8 group">
                                        <AnimatePresence mode="wait">
                                            {(() => {
                                                const scene = orchestration.scenes[currentSceneIdx];
                                                const prevScene = orchestration.scenes[currentSceneIdx - 1];
                                                const transitionType = prevScene?.transition_out || 'cut';
                                                const exitAnim =
                                                    transitionType === 'crossfade' ? { opacity: 0, scale: 1.02 } :
                                                        transitionType === 'fade' ? { opacity: 0 } :
                                                    /* cut */                        { opacity: 0 };

                                                return (
                                                    <motion.div
                                                        key={`scene-${currentSceneIdx}`}
                                                        initial={{ opacity: 0, scale: 1.05 }}
                                                        animate={{
                                                            opacity: 1,
                                                            scale: scene.camera?.movement === 'slow_zoom_in' ? [1.05, 1.0] :
                                                                scene.camera?.movement === 'slow_zoom_out' ? [1.0, 1.05] : 1.0,
                                                            x: scene.camera?.movement === 'slight_pan_right' ? [0, 30] :
                                                                scene.camera?.movement === 'slight_pan_left' ? [0, -30] : 0,
                                                        }}
                                                        exit={exitAnim}
                                                        transition={{ duration: 2.5, ease: 'anticipate' }}
                                                        className="absolute inset-0"
                                                    >
                                                        {scene.videoUrl ? (
                                                            <video
                                                                src={scene.videoUrl}
                                                                className="w-full h-full object-cover"
                                                                autoPlay
                                                                loop
                                                                muted
                                                                playsInline
                                                            />
                                                        ) : (
                                                            <img
                                                                src={scene.backgroundUrl}
                                                                className="w-full h-full object-cover"
                                                                alt="Background"
                                                            />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                                                    </motion.div>
                                                );
                                            })()}
                                        </AnimatePresence>

                                        {/* Ambient Life Overlays */}
                                        <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-20">
                                            <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJ4eXhyNnZ4eHhyNnZ4eHhyNnZ4eHhyNnZ4eHhyNnZ4eHhyJnB0PWFwcF9lbWJlZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKMGpxx5tK5jI4M/giphy.gif')] bg-cover opacity-10 grayscale" />
                                            <motion.div
                                                animate={{
                                                    opacity: [0.1, 0.2, 0.1],
                                                    scale: [1, 1.1, 1]
                                                }}
                                                transition={{ repeat: Infinity, duration: 8 }}
                                                className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-white/5"
                                            />
                                        </div>

                                        {/* Cinematic Meta HUD */}
                                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60 border-primary/40 text-primary">
                                                <Video size={10} /> SCENE {currentSceneIdx + 1} • {orchestration.scenes[currentSceneIdx].camera?.movement?.replace(/_/g, ' ') || 'ACTIVE'}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Camera size={10} className="text-white/60" /> {orchestration.scenes[currentSceneIdx].camera?.shot?.replace(/_/g, ' ') || 'medium'}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Sparkles size={10} className="text-secondary" /> {orchestration.scenes[currentSceneIdx].character?.emotion || 'neutral'}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Zap size={10} className="text-yellow-400" /> {orchestration.scenes[currentSceneIdx].animation_contract?.gesture?.gesture_name?.replace(/_/g, ' ') || 'arms relaxed'}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Mic size={10} className="text-green-400" /> BLINK: {orchestration.scenes[currentSceneIdx].animation_contract?.face?.blink_rate || 'medium'}
                                            </div>
                                        </div>

                                        {/* Subtitles / Dialogue Overlay */}
                                        <div className="absolute bottom-12 inset-x-0 flex justify-center px-12 text-center pointer-events-none">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={currentSceneIdx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="max-w-5xl px-8 py-4 rounded-2xl backdrop-blur-xl border bg-primary/20 border-primary/30 font-medium text-white shadow-2xl ring-1 ring-white/10"
                                                >
                                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-1">
                                                        {orchestration.scenes[currentSceneIdx].character?.emotion?.toUpperCase() || 'DIALOGUE'}
                                                    </span>
                                                    <p className="text-base sm:text-lg lg:text-xl leading-relaxed">{orchestration.scenes[currentSceneIdx].dialogue?.text || 'Preparing sequence...'}</p>
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>

                                        {/* Duplicate meta block removed - already rendered above */}

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                            <motion.div
                                                className="h-full bg-primary"
                                                initial={{ width: "0%" }}
                                                animate={{
                                                    width: isPlaying
                                                        ? `${((currentSceneIdx + 1) * 100) / orchestration.scenes.length}%`
                                                        : "100%"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Zone */}
                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-4">
                                            {!isPlaying ? (
                                                <button onClick={playPreview} className="button-premium px-12 py-5 text-xl flex items-center gap-4 bg-primary shadow-[0_0_50px_rgba(var(--primary-rgb),0.3)]">
                                                    <Play size={24} fill="currentColor" /> Play Performance
                                                </button>
                                            ) : (
                                                <div className="glass px-8 py-5 flex items-center gap-4 border-primary/40 text-primary font-bold tracking-[0.2em] uppercase text-sm">
                                                    <div className="w-3 h-3 rounded-full bg-primary animate-ping" />
                                                    Producing: Scene {currentSceneIdx + 1}
                                                </div>
                                            )}
                                            <button onClick={() => setOrchestration(null)} className="glass px-6 rounded-2xl hover:bg-white/5 transition-colors text-foreground/40 text-xs font-mono uppercase tracking-widest">Re-Orchestrate</button>
                                        </div>

                                        <div className="text-right">
                                            <h3 className="text-sm font-bold uppercase tracking-widest gradient-text">Animation Contract</h3>
                                            <p className="text-[10px] text-foreground/30 font-mono">EMOTION: {orchestration.scenes[currentSceneIdx].character?.emotion}</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">EYE: {orchestration.scenes[currentSceneIdx].character?.eye_focus}</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">BLINK: {orchestration.scenes[currentSceneIdx].animation_contract?.face?.blink_rate}</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">MOUTH: {orchestration.scenes[currentSceneIdx].animation_contract?.face?.mouth_activity}</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">HEAD: {orchestration.scenes[currentSceneIdx].animation_contract?.head?.motion_type} ({orchestration.scenes[currentSceneIdx].animation_contract?.head?.intensity?.toFixed(1)})</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">GESTURE: {orchestration.scenes[currentSceneIdx].animation_contract?.gesture?.gesture_name?.replace(/_/g, ' ')}</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">TIMING: {orchestration.scenes[currentSceneIdx].animation_contract?.gesture?.start_time_seconds}s – {orchestration.scenes[currentSceneIdx].animation_contract?.gesture?.end_time_seconds}s</p>
                                            <p className="text-[10px] text-foreground/30 font-mono">VOICE: {orchestration.scenes[currentSceneIdx].dialogue?.voice_style}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
}
