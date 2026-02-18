"use client";

import { useState, useEffect } from 'react';
import { Camera, Send, Sparkles, Image as ImageIcon, Mic, Layout, Play, Clock, ChevronRight, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import TiptapEditor from '@/components/TiptapEditor';
import { directStory } from '@/app/actions/orchestrate';
import { generateSceneBackground } from '@/app/actions/generateImage';
import { aiCoWrite } from '@/app/actions/aiWriter';

interface Character {
    id: string;
    name: string;
    vibe: string;
    traits: string[];
    photo: string | null;
}

interface Scene {
    id: number;
    script: {
        type: 'acting' | 'narration';
        text: string;
        visuals?: string;
        partUrl?: string;
        motion_vibe?: string;
        camera_work?: string;
        part_duration?: number;
        transition?: string;
    }[];
    visuals: string;
    backgroundUrl?: string;
    camera: string;
    emotion: string;
    duration: number;
}

interface Orchestration {
    persona: {
        name: string;
        trait: string;
        vibe: string;
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
    const [currentPartIdx, setCurrentPartIdx] = useState(0);
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

            setOrchestration({ ...result, scenes: [] }); // Set initial structure
            setProductionLogs(["Creative Director initialized. Starting production..."]);

            const scenesWithBackgrounds: Scene[] = [];
            for (const [sIdx, scene] of result.scenes.entries()) {
                setProductionLogs(prev => [...prev, `🎬 Orchestrating Scene ${sIdx + 1}: ${scene.visuals.substring(0, 40)}...`]);

                // 1. Generate Main Scene Background sequentially
                const bgUrl = await generateSceneBackground(scene.visuals);
                setProductionLogs(prev => [...prev, `✅ Background generated for Scene ${sIdx + 1}`]);

                // 2. Generate per-part visuals sequentially for Live Acting
                const scriptWithVisuals = [];
                for (const [pIdx, part] of scene.script.entries()) {
                    let partUrl = null;
                    if (part.type === 'acting') {
                        const nameMatch = part.text.match(/^([^:]+):/);
                        const name = nameMatch ? nameMatch[1].trim() : "Actor";
                        setProductionLogs(prev => [...prev, `🎭 Filming Actor performance (${pIdx + 1}): ${name}...`]);

                        const char = characters.find(c =>
                            name && (c.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.name.toLowerCase()))
                        );

                        // Call generator with the character's face as reference and their vibe/traits
                        partUrl = await generateSceneBackground(
                            part.visuals || scene.visuals,
                            char?.photo || undefined,
                            char ? { name: char.name, vibe: char.vibe, traits: char.traits } : undefined
                        );
                        setProductionLogs(prev => [...prev, `📸 Visual captured for ${name}`]);
                    }
                    scriptWithVisuals.push({ ...part, partUrl: partUrl || bgUrl });
                }

                const completedScene = {
                    ...scene,
                    backgroundUrl: bgUrl || `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920`,
                    script: scriptWithVisuals
                };

                scenesWithBackgrounds.push(completedScene);

                // Update orchestration incrementally so user sees results
                setOrchestration(prev => prev ? { ...prev, scenes: [...scenesWithBackgrounds] } : null);
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
        setCurrentPartIdx(0);

        const synth = window.speechSynthesis;

        const speakPart = (sceneIdx: number, partIdx: number) => {
            const currentScene = orchestration.scenes[sceneIdx];
            if (!currentScene) {
                setIsPlaying(false);
                return;
            }
            const part = currentScene.script[partIdx];

            if (!part) {
                // Scene finished, move to next scene
                if (sceneIdx + 1 < orchestration.scenes.length) {
                    setTimeout(() => {
                        setCurrentSceneIdx(sceneIdx + 1);
                        setCurrentPartIdx(0);
                        speakPart(sceneIdx + 1, 0);
                    }, 500);
                } else {
                    setIsPlaying(false);
                }
                return;
            }

            setCurrentSceneIdx(sceneIdx);
            setCurrentPartIdx(partIdx);

            let speechText = part.text;
            if (part.type === 'acting') {
                speechText = part.text.replace(/^[^:]+:\s*/, '');
            }

            const utterance = new SpeechSynthesisUtterance(speechText);
            const voices = synth.getVoices();

            if (part.type === 'narration') {
                // Narrator: Deeper, slower, British/Professional vibe
                utterance.voice = voices.find(v => v.name.includes('Google') || v.name.includes('Female')) || voices[0];
                utterance.pitch = 0.85;
                utterance.rate = 0.85;
            } else {
                // Actor: More natural, slightly higher pitch, faster
                utterance.voice = voices.find(v => v.name.includes('Natural') || v.name.includes('Male') || v.lang.startsWith('en-US')) || voices[1];
                utterance.pitch = 1.05;
                utterance.rate = 1.0;
            }

            // Use Gemini's interleaved duration or fallback to speech length
            utterance.onend = () => {
                // Buffer to allow visuals to catch up or motion to finish
                setTimeout(() => speakPart(sceneIdx, partIdx + 1), 500);
            };
            synth.speak(utterance);
        };

        speakPart(0, 0);
    };

    const getCurrentSpeaker = () => {
        if (!orchestration) return null;
        const part = orchestration.scenes[currentSceneIdx]?.script[currentPartIdx];
        if (!part || part.type !== 'acting') return null;

        // Extract name from "NAME: text" format
        const nameMatch = part.text.match(/^([^:]+):/);
        const name = nameMatch ? nameMatch[1].trim() : null;
        if (!name) return null;

        return characters.find(c =>
            c.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(c.name.toLowerCase())
        ) || null;
    };

    const activeActor = getCurrentSpeaker();

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-20 border-r border-border flex flex-col items-center py-8 gap-8 glass m-4 rounded-3xl h-[calc(100vh-32px)] z-50">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-xl">D</div>
                <nav className="flex flex-col gap-6 flex-1 pt-12">
                    <button onClick={() => setActiveStep(0)} className={cn("p-3 rounded-xl transition-all", activeStep === 0 ? "bg-primary text-white" : "text-foreground/40")} title="Cast"><Camera className="w-6 h-6" /></button>
                    <button onClick={() => setActiveStep(1)} className={cn("p-3 rounded-xl transition-all", activeStep === 1 ? "bg-primary text-white" : "text-foreground/40")} title="Script"><Layout className="w-6 h-6" /></button>
                    <button onClick={() => setActiveStep(2)} className={cn("p-3 rounded-xl transition-all", activeStep === 2 ? "bg-primary text-white" : "text-foreground/40")} title="Director Dashboard"><Video className="w-6 h-6" /></button>
                </nav>
            </aside>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col p-8 gap-8 h-screen overflow-hidden">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Director Workspace</h1>
                        <p className="text-foreground/40 text-sm">Create your story with multi-character interleaved direction.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => { localStorage.removeItem('diovid-project'); window.location.reload(); }}
                            className="text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
                        >
                            Clear & Reset
                        </button>
                        <div className="glass px-4 py-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-mono uppercase tracking-widest opacity-60">Gemini 3 Global Connected</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-12 gap-8 overflow-hidden">
                    {/* Left Panel: Cast & Editor (Visible based on activeStep) */}
                    <div className={cn("col-span-12 lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar transition-all duration-500", activeStep === 2 ? "hidden lg:flex" : "flex")}>

                        {/* Cast Management */}
                        <section className={cn("glass p-6 transition-all duration-500", activeStep === 0 ? "border-primary/50 ring-1 ring-primary/20" : "opacity-60")}>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary text-xs">1</div>
                                    Cast Management
                                </h2>
                                <button onClick={addCharacter} className="text-xs flex items-center gap-1 text-primary hover:underline">
                                    <Sparkles size={12} /> Add Actor
                                </button>
                            </div>

                            <div className="space-y-4">
                                {characters.map((char) => (
                                    <div key={char.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative group">
                                        {characters.length > 1 && (
                                            <button
                                                onClick={() => removeCharacter(char.id)}
                                                className="absolute top-2 right-2 text-foreground/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center overflow-hidden relative cursor-pointer hover:border-primary/40 transition-colors shrink-0">
                                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoUpload(char.id, e)} />
                                                {char.photo ? (
                                                    <img src={char.photo} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Camera size={20} className="text-foreground/20" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={char.name}
                                                    onChange={(e) => updateCharacter(char.id, { name: e.target.value })}
                                                    placeholder="Actor Name (e.g. John Doe)"
                                                    className="w-full bg-white/5 border-white/10 rounded-lg px-3 py-1 text-sm outline-none focus:border-primary/40 transition-all font-bold"
                                                />
                                                <input
                                                    value={char.vibe}
                                                    onChange={(e) => updateCharacter(char.id, { vibe: e.target.value })}
                                                    placeholder="Actor Vibe (e.g. Grumpy Detective)"
                                                    className="w-full bg-white/5 border-white/10 rounded-lg px-3 py-1 text-xs outline-none focus:border-primary/40 transition-all opacity-60"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {activeStep === 0 && (
                                <button onClick={() => setActiveStep(1)} className="w-full mt-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium">Continue to Scripting</button>
                            )}
                        </section>

                        {/* Script Editor */}
                        <section className={cn("glass p-6 transition-all duration-500 flex-1 flex flex-col min-h-0", activeStep === 1 ? "border-primary/50 ring-1 ring-primary/20" : "opacity-60")}>
                            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-primary text-xs">2</div>
                                Script & AI Assistant
                            </h2>

                            <div className="flex-1 min-h-[500px] grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Story Treatment Area */}
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold text-foreground/40 uppercase tracking-widest">Story Treatment</h3>
                                        <span className="text-[10px] text-foreground/20 italic">Draft & Continue Story</span>
                                    </div>
                                    <TiptapEditor
                                        content={storyHtml}
                                        onChange={setStoryHtml}
                                        onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'story')}
                                        isAiProcessing={isAiWriting}
                                        currentlyProcessing={currentlyProcessingAiAction}
                                        role="story"
                                    />
                                </div>

                                {/* Production Script Area */}
                                <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest">Production Script</h3>
                                        <span className="text-[10px] text-primary/40 italic">Final Acting Dialogue</span>
                                    </div>
                                    <TiptapEditor
                                        content={scriptHtml}
                                        onChange={setScriptHtml}
                                        onAiAction={(inst, text) => handleAiCoWrite(inst, text, 'script')}
                                        isAiProcessing={isAiWriting}
                                        currentlyProcessing={currentlyProcessingAiAction}
                                        role="script"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={startDirecting}
                                disabled={isProcessing || !scriptHtml}
                                className="w-full mt-6 button-premium flex items-center justify-center gap-2 h-14 relative overflow-hidden"
                            >
                                <AnimatePresence>
                                    {isProcessing ? (
                                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                                            <Sparkles className="animate-spin" size={20} /> Orchestrating...
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }} className="flex items-center gap-2">
                                            Produce Multimodal Stream <Send size={16} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </section>
                    </div>

                    {/* Right Panel: Preview Area */}
                    <div className={cn("col-span-12 glass rounded-3xl p-8 relative flex flex-col h-full bg-black/40 border-white/5 overflow-hidden transition-all duration-500", activeStep === 2 ? "lg:col-span-12" : "lg:col-span-7")}>

                        <AnimatePresence mode="wait">
                            {!orchestration && !isProcessing && (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col items-center justify-center text-center p-12"
                                >
                                    <div className="w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                                        <Play className="w-10 h-10 text-primary border-primary/20" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-3 tracking-tight">Ready for Production</h2>
                                    <p className="text-foreground/30 max-w-sm text-sm">Upload your cast and draft a script. Gemini 3 will then generate a cinematic multimodal story with audio and visuals.</p>
                                </motion.div>
                            )}

                            {isProcessing && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex bg-black/80 backdrop-blur-xl z-40 overflow-hidden"
                                >
                                    <div className="flex-1 grid grid-cols-2 h-full">
                                        {/* Left: Production Console */}
                                        <div className="border-r border-white/10 p-8 flex flex-col gap-6 overflow-hidden bg-black/20">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
                                                        <Sparkles size={16} className="text-primary animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold tracking-tight">Production Studio</h3>
                                                        <p className="text-[10px] text-white/40 font-mono">GEN-3 ENGINE | GLOBAL</p>
                                                    </div>
                                                </div>
                                                <div className="glass px-2 py-1 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                                                    <span className="text-[9px] font-mono opacity-60 uppercase">Live Feed</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 font-mono text-[11px]">
                                                {productionLogs.map((log, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className={cn(
                                                            "p-3 rounded-lg border flex gap-3 transition-colors",
                                                            i === productionLogs.length - 1
                                                                ? "bg-primary/5 border-primary/20 text-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                                                                : "bg-white/5 border-white/5 text-white/40"
                                                        )}
                                                    >
                                                        <span className="opacity-30">{String(i + 1).padStart(2, '0')}</span>
                                                        <span className="flex-1">{log}</span>
                                                    </motion.div>
                                                ))}
                                                <div id="logs-end" />
                                            </div>

                                            <div className="pt-6 border-t border-white/10 flex items-center justify-between opacity-50">
                                                <div className="flex gap-4">
                                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest"><Camera size={10} /> IMAGEN 3</div>
                                                    <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest"><Video size={10} /> VERTEX AI</div>
                                                </div>
                                                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className="h-full bg-primary"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: `${(orchestration?.scenes.length || 0) * 33}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Visual Feed */}
                                        <div className="relative flex flex-col items-center justify-center p-12 bg-gradient-to-br from-black/40 to-black/80">
                                            <AnimatePresence mode="wait">
                                                {orchestration?.scenes && orchestration.scenes.length > 0 ? (
                                                    <motion.div
                                                        key={orchestration.scenes.length}
                                                        initial={{ opacity: 0, scale: 0.95, rotate: -2 }}
                                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                                        className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/10 group"
                                                    >
                                                        <img
                                                            src={orchestration.scenes[orchestration.scenes.length - 1].backgroundUrl}
                                                            className="w-full h-full object-cover"
                                                            alt="Latest Scene"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                                                            <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                                                                <Play size={10} fill="currentColor" /> Live Visual Feed
                                                            </div>
                                                            <div className="text-sm font-bold truncate max-w-full">
                                                                Scene {orchestration.scenes.length}: {orchestration.scenes[orchestration.scenes.length - 1].visuals}
                                                            </div>
                                                        </div>
                                                        <div className="absolute top-4 right-4 flex gap-2">
                                                            <div className="glass px-2 py-1 text-[8px] font-mono tracking-tighter bg-black/60 border-primary/40">GEN_SYNC: OK</div>
                                                            <div className="glass px-2 py-1 text-[8px] font-mono tracking-tighter bg-black/60">FPS: 00</div>
                                                        </div>
                                                    </motion.div>
                                                ) : (
                                                    <div className="text-center space-y-4">
                                                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-4 bg-white/5 relative">
                                                            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                                                            <Camera className="text-white/20" size={24} />
                                                        </div>
                                                        <h4 className="text-sm font-bold opacity-40 uppercase tracking-widest">Awaiting First Frame</h4>
                                                        <p className="text-[10px] opacity-20 max-w-[200px] mx-auto leading-relaxed">Vertex AI is simulating the cinematic environment for your first scene...</p>
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
                                            <motion.div
                                                key={`${currentSceneIdx}-${currentPartIdx}`}
                                                initial={{
                                                    opacity: 0,
                                                    scale: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('zoom_in') ? 1.3 : 1.1,
                                                    x: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('pan_right') ? -100 :
                                                        orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('pan_left') ? 100 : 0,
                                                    y: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('tilt_up') ? 50 : 0
                                                }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('zoom_in') ? 1.0 : 1.05,
                                                    x: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('pan_right') ? 50 :
                                                        orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('pan_left') ? -50 : 0,
                                                    y: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('tilt_up') ? -20 : 0,
                                                    rotate: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('shake') ? [0, -2, 2, -2, 0] : 0
                                                }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{
                                                    duration: orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.includes('slow') ? 6 : 2.5,
                                                    ease: "anticipate",
                                                    rotate: { repeat: Infinity, duration: 0.15 }
                                                }}
                                                className="absolute inset-0"
                                            >
                                                <img
                                                    src={orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.partUrl || orchestration.scenes[currentSceneIdx].backgroundUrl}
                                                    className="w-full h-full object-cover"
                                                    alt="Background"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                                            </motion.div>
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

                                        {/* Cinematic Meta (Updated for Motion) */}
                                        <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60 border-primary/40 text-primary">
                                                <Video size={10} /> SCENE {currentSceneIdx + 1} • {orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.motion_vibe?.replace('_', ' ') || 'ACTIVE'}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Camera size={10} className="text-white/60" /> {orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.camera_work || orchestration.scenes[currentSceneIdx].camera}
                                            </div>
                                        </div>

                                        {/* Subtitles / Script Overlay */}
                                        <div className="absolute bottom-12 inset-x-0 flex justify-center px-12 text-center pointer-events-none">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={currentSceneIdx + '-' + currentPartIdx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className={cn(
                                                        "max-w-3xl px-8 py-4 rounded-2xl backdrop-blur-xl border",
                                                        orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.type === 'narration'
                                                            ? "bg-black/40 border-white/10 italic text-foreground/80"
                                                            : "bg-primary/20 border-primary/30 font-medium text-white shadow-2xl ring-1 ring-white/10"
                                                    )}
                                                >
                                                    <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-40 block mb-1">
                                                        {orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.type || 'DIRECTOR'}
                                                    </span>
                                                    <p className="text-lg leading-relaxed">{orchestration.scenes[currentSceneIdx].script[currentPartIdx]?.text || 'Preparing sequence...'}</p>
                                                </motion.div>
                                            </AnimatePresence>
                                        </div>

                                        {/* Cinematic Meta */}
                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Video size={10} className="text-primary" /> SCENE {currentSceneIdx + 1} / {orchestration.scenes.length}
                                            </div>
                                            <div className="glass px-3 py-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-black/60">
                                                <Camera size={10} className="text-white/60" /> {orchestration.scenes[currentSceneIdx].camera}
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                                            <motion.div
                                                className="h-full bg-primary"
                                                initial={{ width: "0%" }}
                                                animate={{
                                                    width: isPlaying
                                                        ? `${((currentSceneIdx * 100) / orchestration.scenes.length) + ((currentPartIdx + 1) * (100 / orchestration.scenes.length / orchestration.scenes[currentSceneIdx].script.length))}%`
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
                                            <h3 className="text-sm font-bold uppercase tracking-widest gradient-text">Director's Analysis</h3>
                                            <p className="text-[10px] text-foreground/30 font-mono">EMOTION: {orchestration.scenes[currentSceneIdx].emotion}</p>
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
