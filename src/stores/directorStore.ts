import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CloudStorage } from '@/lib/supabase';

export interface Character {
    id: string;
    name: string;
    vibe: string;
    traits: string[];
    photo: string | null;
}

export interface Scene {
    scene_id: number;
    duration_seconds: number;
    background_environment: string;
    background_lighting: string;
    camera_shot: string;
    camera_movement: string;
    character_pose: string;
    character_emotion: string;
    character_eye_focus: string;
    animation_contract: {
        face_blink_rate: string;
        face_mouth_activity: string;
        head_motion_type: string;
        head_intensity: number;
        gesture_name: string | null;
        gesture_start_time_seconds: number;
        gesture_end_time_seconds: number;
    };
    dialogue_text: string;
    dialogue_voice_style: string;
    dialogue_lip_sync: boolean;
    transition_out: string;
    backgroundUrl?: string;
    videoUrl?: string;
    visual_direction?: string;
}

export interface PostProductionSettings {
    colorGrading: {
        preset: 'cinematic' | 'warm' | 'cool' | 'vintage' | 'custom';
        brightness: number;
        contrast: number;
        saturation: number;
        temperature: number;
        tint: number;
        shadows: number;
        highlights: number;
        blacks: number;
        whites: number;
        vibrance: number;
        clarity: number;
    };
    audioEffects: {
        preset: 'voice_enhance' | 'music_boost' | 'custom';
        eq: { low: number; mid: number; high: number };
        compression: { ratio: number; threshold: number; attack: number; release: number };
        reverb: { enabled: boolean; amount: number };
        noiseGate: { enabled: boolean; threshold: number };
        deEsser: { enabled: boolean; frequency: number };
        normalization: { enabled: boolean; targetLevel: number };
    };
    visualEffects: {
        motionBlur: number;
        depthOfField: { enabled: boolean; focusDistance: number; aperture: number };
        particles: 'none' | 'dust' | 'bokeh' | 'light' | 'smoke';
        glitch: { enabled: boolean; intensity: number };
        chromaticAberration: number;
        vignette: number;
    };
    greenScreen: {
        enabled: boolean;
        color: 'green' | 'blue' | 'red';
        tolerance: number;
        spillSuppression: number;
        edgeFeather: number;
        backgroundType: 'solid' | 'blur' | 'image' | 'transparent';
        backgroundColor?: string;
        backgroundImage?: string;
    };
    fullBodyAnimation: {
        mode: 'chest-up' | 'full-body' | 'walking' | 'interaction';
        walkSpeed: number;
        direction: 'forward' | 'backward' | 'left' | 'right';
        poseVariation: number;
        interactionType: 'none' | 'pick_up' | 'sit' | 'stand' | 'lean';
        targetObject?: string;
        multiCharacterSpacing: number;
    };
    formatConversion: {
        format: 'mp4' | 'webm' | 'mov' | 'gif' | 'png';
        resolution: '720p' | '1080p' | '2k' | '4k';
        bitrate: string;
        framerate: number;
        codec: 'h264' | 'vp9' | 'prores' | 'av1';
        audioCodec: 'aac' | 'mp3' | 'opus' | 'pcm';
        audioBitrate: string;
        preset: 'youtube' | 'tiktok' | 'instagram' | 'archive' | 'custom';
    };
}

export interface VersionCommit {
    id: string;
    message: string;
    timestamp: number;
    author: string;
    changes: string[];
    branch: string;
}

export interface VersionBranch {
    name: string;
    commits: VersionCommit[];
    createdAt: number;
    description?: string;
}

export interface Asset {
    id: string;
    name: string;
    type: 'background' | 'character' | 'audio' | 'effect' | 'video';
    url: string;
    tags: string[];
    usageCount: number;
    createdAt: number;
    metadata?: Record<string, any>;
}

export interface ReviewComment {
    id: string;
    author: string;
    text: string;
    timestamp: number;
    resolved: boolean;
    replies: ReviewComment[];
    position?: { x: number; y: number; time?: number };
}

export interface FrameEdit {
    frameId: string;
    timestamp: number;
    changes: string[];
    applied: boolean;
}

export interface RenderJob {
    id: string;
    name: string;
    status: 'queued' | 'rendering' | 'completed' | 'failed';
    progress: number;
    estimatedTime: number;
    settings: Partial<PostProductionSettings['formatConversion']>;
    startTime?: number;
    endTime?: number;
    outputUrl?: string;
}

export interface Orchestration {
    video_meta?: {
        aspect_ratio?: string;
        style?: string;
        total_duration_seconds?: number;
    };
    character_profile?: {
        source?: string;
        framing?: string;
        default_pose?: string;
        idle_motion?: boolean;
    };
    scenes: Scene[];
    post_production?: any;
}

interface DirectorState {
    // Characters
    characters: Character[];
    addCharacter: () => void;
    updateCharacter: (id: string, updates: Partial<Character>) => void;
    removeCharacter: (id: string) => void;

    // Content
    storyHtml: string;
    scriptHtml: string;
    setStoryHtml: (html: string) => void;
    setScriptHtml: (html: string) => void;

    // Processing states
    isProcessing: boolean;
    isAiWriting: boolean;
    currentlyProcessingAiAction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify' | null;
    setProcessing: (processing: boolean) => void;
    setAiWriting: (writing: boolean) => void;
    setCurrentlyProcessingAiAction: (action: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify' | null) => void;

    // Orchestration
    orchestration: Orchestration | null;
    setOrchestration: (orch: Orchestration | null) => void;

    // Playback
    isPlaying: boolean;
    currentSceneIdx: number;
    setPlaying: (playing: boolean) => void;
    setCurrentSceneIdx: (idx: number) => void;

    // UI state
    activeStep: number;
    setActiveStep: (step: number) => void;

    // Logs
    productionLogs: string[];
    addProductionLog: (log: string) => void;
    clearProductionLogs: () => void;

    // Professional Post-Production
    postProduction: PostProductionSettings;
    updatePostProduction: (updates: Partial<PostProductionSettings>) => void;
    resetPostProduction: () => void;

    // Version Control
    currentBranch: string;
    branches: VersionBranch[];
    createBranch: (name: string, description?: string) => void;
    switchBranch: (name: string) => void;
    commitChanges: (message: string, changes: string[]) => void;
    getCurrentBranch: () => VersionBranch | null;

    // Asset Library
    assets: Asset[];
    addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'usageCount'>) => void;
    updateAsset: (id: string, updates: Partial<Asset>) => void;
    removeAsset: (id: string) => void;
    searchAssets: (query: string, type?: Asset['type']) => Asset[];

    // Collaboration
    reviewComments: ReviewComment[];
    addReviewComment: (comment: Omit<ReviewComment, 'id' | 'timestamp' | 'replies'>) => void;
    resolveReviewComment: (id: string) => void;
    replyToComment: (parentId: string, reply: Omit<ReviewComment, 'id' | 'timestamp' | 'replies'>) => void;

    // Frame Editor
    frameEdits: FrameEdit[];
    addFrameEdit: (edit: Omit<FrameEdit, 'applied'>) => void;
    applyFrameEdit: (frameId: string) => void;
    undoFrameEdit: (frameId: string) => void;

    // Batch Rendering
    renderJobs: RenderJob[];
    addRenderJob: (job: Omit<RenderJob, 'id' | 'status' | 'progress'>) => void;
    updateRenderJob: (id: string, updates: Partial<RenderJob>) => void;
    removeRenderJob: (id: string) => void;
    startBatchRender: () => void;

    // Cloud sync
    cloudProjectId: string | null;
    isOnline: boolean;
    lastSynced: string | null;
    syncToCloud: (projectName: string) => Promise<boolean>;
    loadFromCloud: (projectId: string) => Promise<boolean>;
    setOnline: (online: boolean) => void;

    // Actions
    resetProject: () => void;
}

const initialState = {
    characters: [{ id: '1', name: '', vibe: '', traits: [], photo: null }],
    storyHtml: '',
    scriptHtml: '',
    isProcessing: false,
    isAiWriting: false,
    currentlyProcessingAiAction: null,
    orchestration: null,
    isPlaying: false,
    currentSceneIdx: 0,
    activeStep: 0,
    productionLogs: [],
    postProduction: {
        colorGrading: {
            preset: 'cinematic',
            brightness: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            shadows: 0,
            highlights: 0,
            blacks: 0,
            whites: 0,
            vibrance: 0,
            clarity: 0
        },
        audioEffects: {
            preset: 'voice_enhance',
            eq: { low: 0, mid: 0, high: 0 },
            compression: { ratio: 4, threshold: -20, attack: 10, release: 100 },
            reverb: { enabled: false, amount: 25 },
            noiseGate: { enabled: false, threshold: -40 },
            deEsser: { enabled: false, frequency: 5000 },
            normalization: { enabled: true, targetLevel: -12 }
        },
        visualEffects: {
            motionBlur: 0,
            depthOfField: { enabled: false, focusDistance: 5, aperture: 2.8 },
            particles: 'none',
            glitch: { enabled: false, intensity: 25 },
            chromaticAberration: 0,
            vignette: 0
        },
        greenScreen: {
            enabled: false,
            color: 'green',
            tolerance: 50,
            spillSuppression: 50,
            edgeFeather: 10,
            backgroundType: 'solid',
            backgroundColor: '#000000'
        },
        fullBodyAnimation: {
            mode: 'chest-up',
            walkSpeed: 1,
            direction: 'forward',
            poseVariation: 0,
            interactionType: 'none',
            multiCharacterSpacing: 2
        },
        formatConversion: {
            format: 'mp4',
            resolution: '1080p',
            bitrate: '5000',
            framerate: 30,
            codec: 'h264',
            audioCodec: 'aac',
            audioBitrate: '128',
            preset: 'youtube'
        }
    },
    currentBranch: 'main',
    branches: [{
        name: 'main',
        commits: [],
        createdAt: Date.now(),
        description: 'Main production branch'
    }],
    assets: [],
    reviewComments: [],
    frameEdits: [],
    renderJobs: []
};

export const useDirectorStore = create<DirectorState>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Character actions
            addCharacter: () => set((state) => ({
                characters: [...state.characters, {
                    id: Date.now().toString(),
                    name: '',
                    vibe: '',
                    traits: [],
                    photo: null
                }]
            })),

            updateCharacter: (id, updates) => set((state) => ({
                characters: state.characters.map(c =>
                    c.id === id ? { ...c, ...updates } : c
                )
            })),

            removeCharacter: (id) => set((state) => ({
                characters: state.characters.length > 1
                    ? state.characters.filter(c => c.id !== id)
                    : state.characters
            })),

            // Content setters
            setStoryHtml: (html) => set({ storyHtml: html }),
            setScriptHtml: (html) => set({ scriptHtml: html }),

            // Processing setters
            setProcessing: (processing) => set({ isProcessing: processing }),
            setAiWriting: (writing) => set({ isAiWriting: writing }),
            setCurrentlyProcessingAiAction: (action) => set({ currentlyProcessingAiAction: action }),

            // Orchestration
            setOrchestration: (orch) => set({ orchestration: orch }),

            // Playback
            setPlaying: (playing) => set({ isPlaying: playing }),
            setCurrentSceneIdx: (idx) => set({ currentSceneIdx: idx }),

            // UI
            setActiveStep: (step) => set({ activeStep: step }),

            // Logs
            addProductionLog: (log) => set((state) => ({
                productionLogs: [...state.productionLogs, log]
            })),
            clearProductionLogs: () => set({ productionLogs: [] }),

            // Professional Post-Production
            postProduction: initialState.postProduction as PostProductionSettings,
            updatePostProduction: (updates) => set((state) => ({
                postProduction: { ...state.postProduction, ...updates }
            })),
            resetPostProduction: () => set({ postProduction: initialState.postProduction as PostProductionSettings }),

            // Version Control
            currentBranch: initialState.currentBranch,
            branches: initialState.branches,
            createBranch: (name, description) => set((state) => ({
                branches: [...state.branches, {
                    name,
                    commits: [],
                    createdAt: Date.now(),
                    description
                }]
            })),
            switchBranch: (name) => set({ currentBranch: name }),
            commitChanges: (message, changes) => set((state) => {
                const currentBranch = state.branches.find(b => b.name === state.currentBranch);
                if (!currentBranch) return state;

                const newCommit: VersionCommit = {
                    id: `commit_${Date.now()}`,
                    message,
                    timestamp: Date.now(),
                    author: 'User',
                    changes,
                    branch: state.currentBranch
                };

                return {
                    branches: state.branches.map(branch =>
                        branch.name === state.currentBranch
                            ? { ...branch, commits: [...branch.commits, newCommit] }
                            : branch
                    )
                };
            }),
            getCurrentBranch: () => {
                const state = get();
                return state.branches.find(b => b.name === state.currentBranch) || null;
            },

            // Asset Library
            assets: initialState.assets,
            addAsset: (asset) => set((state) => ({
                assets: [...state.assets, {
                    ...asset,
                    id: `asset_${Date.now()}`,
                    createdAt: Date.now(),
                    usageCount: 0
                }]
            })),
            updateAsset: (id, updates) => set((state) => ({
                assets: state.assets.map(asset =>
                    asset.id === id ? { ...asset, ...updates } : asset
                )
            })),
            removeAsset: (id) => set((state) => ({
                assets: state.assets.filter(asset => asset.id !== id)
            })),
            searchAssets: (query, type) => {
                const state = get();
                return state.assets.filter(asset => {
                    const matchesQuery = asset.name.toLowerCase().includes(query.toLowerCase()) ||
                                       asset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
                    const matchesType = !type || asset.type === type;
                    return matchesQuery && matchesType;
                });
            },

            // Collaboration
            reviewComments: initialState.reviewComments,
            addReviewComment: (comment) => set((state) => ({
                reviewComments: [...state.reviewComments, {
                    ...comment,
                    id: `comment_${Date.now()}`,
                    timestamp: Date.now(),
                    resolved: false,
                    replies: []
                }]
            })),
            resolveReviewComment: (id) => set((state) => ({
                reviewComments: state.reviewComments.map(comment =>
                    comment.id === id ? { ...comment, resolved: true } : comment
                )
            })),
            replyToComment: (parentId, reply) => set((state) => ({
                reviewComments: state.reviewComments.map(comment =>
                    comment.id === parentId ? {
                        ...comment,
                        replies: [...comment.replies, {
                            ...reply,
                            id: `reply_${Date.now()}`,
                            timestamp: Date.now(),
                            resolved: false,
                            replies: []
                        }]
                    } : comment
                )
            })),

            // Frame Editor
            frameEdits: initialState.frameEdits,
            addFrameEdit: (edit) => set((state) => ({
                frameEdits: [...state.frameEdits, { ...edit, applied: false }]
            })),
            applyFrameEdit: (frameId) => set((state) => ({
                frameEdits: state.frameEdits.map(edit =>
                    edit.frameId === frameId ? { ...edit, applied: true } : edit
                )
            })),
            undoFrameEdit: (frameId) => set((state) => ({
                frameEdits: state.frameEdits.map(edit =>
                    edit.frameId === frameId ? { ...edit, applied: false } : edit
                )
            })),

            // Batch Rendering
            renderJobs: initialState.renderJobs,
            addRenderJob: (job) => set((state) => ({
                renderJobs: [...state.renderJobs, {
                    ...job,
                    id: `job_${Date.now()}`,
                    status: 'queued',
                    progress: 0
                }]
            })),
            updateRenderJob: (id, updates) => set((state) => ({
                renderJobs: state.renderJobs.map(job =>
                    job.id === id ? { ...job, ...updates } : job
                )
            })),
            removeRenderJob: (id) => set((state) => ({
                renderJobs: state.renderJobs.filter(job => job.id !== id)
            })),
            startBatchRender: () => {
                // This would trigger the actual rendering process
                // For now, just mark jobs as rendering
                set((state) => ({
                    renderJobs: state.renderJobs.map(job =>
                        job.status === 'queued' ? { ...job, status: 'rendering', startTime: Date.now() } : job
                    )
                }));
            },

            // Cloud sync
            cloudProjectId: null,
            isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
            lastSynced: null,

            syncToCloud: async (projectName: string) => {
                try {
                    const project = await CloudStorage.saveProject({
                        name: projectName,
                        characters: get().characters,
                        scriptHtml: get().scriptHtml,
                        storyHtml: get().storyHtml,
                        // Don't save orchestration - it's too large and can be regenerated
                        orchestration: null,
                    });

                    if (project) {
                        set({
                            cloudProjectId: project.id,
                            lastSynced: new Date().toISOString(),
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Cloud sync failed:', error);
                    return false;
                }
            },

            loadFromCloud: async (projectId: string) => {
                try {
                    const project = await CloudStorage.loadProject(projectId);
                    if (project) {
                        set({
                            characters: project.characters,
                            scriptHtml: project.script_html,
                            storyHtml: project.story_html,
                            orchestration: project.orchestration,
                            cloudProjectId: project.id,
                            lastSynced: project.updated_at,
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.error('Cloud load failed:', error);
                    return false;
                }
            },

            setOnline: (online) => set({ isOnline: online }),

            // Reset
            resetProject: () => set(initialState as unknown as DirectorState),
        }),
        {
            name: 'diovid-director-storage',
            storage: createJSONStorage(() => {
                // Safe serializer that prevents deep nesting issues
                const safeStringify = (obj: any): string => {
                    try {
                        const str = JSON.stringify(obj);
                        // Check size - if over 5MB, it's too large
                        if (str.length > 5 * 1024 * 1024) {
                            throw new Error('Serialized state too large');
                        }
                        return str;
                    } catch (error) {
                        console.error('Failed to serialize state:', error);
                        // Return empty state marker on serialization failure
                        return JSON.stringify({});
                    }
                };

                return {
                    getItem: (key) => localStorage.getItem(key),
                    setItem: (key, value) => {
                        try {
                            // Re-stringify with our safe method to catch deep nesting
                            const validated = safeStringify(JSON.parse(value));
                            localStorage.setItem(key, validated);
                        } catch (error) {
                            const message = error instanceof Error ? error.message : String(error);
                            if (message.includes('nesting') || message.includes('Serialized state')) {
                                console.warn('State too complex to persist - skipping localStorage save', message);
                                // Silently fail on serialization issues - don't throw
                                return;
                            }
                            if (message.includes('QuotaExceededError')) {
                                console.warn('LocalStorage quota exceeded - clearing old data');
                                try {
                                    localStorage.removeItem(key);
                                } catch (e) {
                                    console.error('Failed to clear localStorage:', e);
                                }
                                return;
                            }
                            console.error('Unexpected localStorage error:', error);
                        }
                    },
                    removeItem: (key) => {
                        try {
                            localStorage.removeItem(key);
                        } catch (error) {
                            console.error('Failed to remove from localStorage:', error);
                        }
                    },
                };
            }),
            partialize: (state) => {
                // Explicitly exclude large/complex state that causes serialization issues
                const partialState: any = {
                    characters: state.characters.map(c => ({
                        id: c.id,
                        name: c.name,
                        vibe: c.vibe,
                        traits: Array.isArray(c.traits) ? c.traits.slice(0, 10) : [], // Limit traits
                        photo: c.photo ? c.photo.substring(0, 100000) : null, // Limit photo size
                    })),
                    scriptHtml: state.scriptHtml.substring(0, 100000), // Limit HTML size
                    storyHtml: state.storyHtml.substring(0, 100000), // Limit HTML size
                    currentBranch: state.currentBranch,
                    branches: state.branches.slice(0, 20), // Limit branches
                    assets: state.assets.slice(0, 50), // Limit assets
                    reviewComments: state.reviewComments.slice(0, 100), // Limit comments
                    frameEdits: state.frameEdits.slice(0, 100), // Limit edits
                    renderJobs: state.renderJobs.slice(0, 50), // Limit jobs
                    // EXCLUDED: orchestration (runtime only)
                    // EXCLUDED: postProduction (can be regenerated from defaults)
                    // EXCLUDED: productionLogs (session-only, can get very large)
                };
                return partialState;
            },
        }
    )
);