"use client";

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Music, Volume2, VolumeX, Play, Pause, Square, Download, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getAnalytics } from '@/lib/analytics';

interface MultiModalContextType {
  openPanel: () => void;
  closePanel: () => void;
  isPanelOpen: boolean;
  hasTracks: boolean;
}

const MultiModalContext = createContext<MultiModalContextType | undefined>(undefined);

export function useMultiModal() {
  const ctx = useContext(MultiModalContext);
  if (!ctx) {
    throw new Error('useMultiModal must be used within a MultiModalProvider');
  }
  return ctx;
}

interface VoiceSynthesisOptions {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
  language: string;
  emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
}

interface MusicGenerationOptions {
  genre: string;
  mood: string;
  duration: number;
  tempo: number;
  instruments: string[];
  intensity: number;
}

interface AudioTrack {
  id: string;
  type: 'voice' | 'music' | 'effect';
  name: string;
  url: string;
  duration: number;
  startTime: number;
  volume: number;
  fadeIn?: number;
  fadeOut?: number;
}

interface MultiModalProviderProps {
  children: React.ReactNode;
}

const VOICE_OPTIONS = [
  { id: 'en-US-Neural2-D', name: 'Deep Male', language: 'en-US', gender: 'male' },
  { id: 'en-US-Neural2-F', name: 'Warm Female', language: 'en-US', gender: 'female' },
  { id: 'en-GB-Neural2-A', name: 'British Male', language: 'en-GB', gender: 'male' },
  { id: 'en-GB-Neural2-C', name: 'British Female', language: 'en-GB', gender: 'female' },
];

const MUSIC_GENRES = [
  'ambient', 'electronic', 'rock', 'jazz', 'classical', 'hip-hop', 'pop', 'cinematic'
];

const MUSIC_MOODS = [
  'uplifting', 'dramatic', 'peaceful', 'tense', 'mysterious', 'joyful', 'melancholic', 'energetic'
];

export function MultiModalProvider({ children }: MultiModalProviderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [voiceOptions, setVoiceOptions] = useState<VoiceSynthesisOptions>({
    voice: 'en-US-Neural2-D',
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
    language: 'en-US',
    emotion: 'neutral',
  });
  const [musicOptions, setMusicOptions] = useState<MusicGenerationOptions>({
    genre: 'cinematic',
    mood: 'dramatic',
    duration: 60,
    tempo: 120,
    instruments: ['piano', 'strings'],
    intensity: 0.7,
  });
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const analytics = getAnalytics();

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudio();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioTracks(prev => [...prev, {
          id: `recording-${Date.now()}`,
          type: 'voice',
          name: 'Voice Recording',
          url,
          duration: 0, // Would need to calculate
          startTime: currentTime,
          volume: 1.0,
        }]);
      };

      mediaRecorder.start();
      setIsRecording(true);

      analytics.trackInteraction('multimodal', 'recording_start', {});
    } catch (error) {
      console.error('Recording failed:', error);
    }
  }, [currentTime, analytics]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      analytics.trackInteraction('multimodal', 'recording_stop', {});
    }
  }, [isRecording, analytics]);

  const playAudio = useCallback(() => {
    setIsPlaying(true);
    analytics.trackInteraction('multimodal', 'playback_start', {});
  }, [analytics]);

  const pauseAudio = useCallback(() => {
    setIsPlaying(false);
    analytics.trackInteraction('multimodal', 'playback_pause', {});
  }, [analytics]);

  const stopAudio = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    analytics.trackInteraction('multimodal', 'playback_stop', {});
  }, [analytics]);

  const synthesizeVoice = useCallback(async (text: string) => {
    analytics.trackInteraction('multimodal', 'voice_synthesis', {
      textLength: text.length,
    });
    // Implementation would go here
  }, [analytics]);

  const generateMusic = useCallback(async (options: MusicGenerationOptions) => {
    analytics.trackInteraction('multimodal', 'music_generation', {
      genre: options.genre,
      mood: options.mood,
    });
    // Implementation would go here
  }, [analytics]);

  const removeAudioTrack = useCallback((trackId: string) => {
    setAudioTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const updateAudioTrack = useCallback((trackId: string, updates: Partial<AudioTrack>) => {
    setAudioTracks(prev => prev.map(t => t.id === trackId ? { ...t, ...updates } : t));
  }, []);

  const exportAudio = useCallback(async () => {
    try {
      // Implementation would go here
      analytics.trackInteraction('multimodal', 'export_success', {});
    } catch (error) {
      console.error('Export failed:', error);
      analytics.trackInteraction('multimodal', 'export_error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [audioTracks, analytics]);

  return (
    <MultiModalContext.Provider value={{
      openPanel: () => setIsPanelOpen(true),
      closePanel: () => setIsPanelOpen(false),
      isPanelOpen,
      hasTracks: audioTracks.length > 0,
    }}>
      <div className="relative">
        {children}

        {/* Floating MultiModal Icon - Always Visible */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 flex items-center justify-center group"
        >
          <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {audioTracks.length > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold">
              {audioTracks.length}
            </div>
          )}
        </motion.button>

        {/* Multi-Modal Control Panel */}
        <AnimatePresence>
          {isPanelOpen && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border p-4 z-40"
            >
              <div className="max-w-7xl mx-auto">
                {/* Main Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Recording */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={isRecording ? "danger" : "secondary"}
                        size="sm"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={isRecording ? "animate-pulse" : ""}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        {isRecording ? 'Stop' : 'Record'}
                      </Button>
                    </div>

                    {/* Playback */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={isPlaying ? pauseAudio : playAudio}
                        disabled={audioTracks.length === 0}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={stopAudio}
                        disabled={!isPlaying && currentTime === 0}
                      >
                        <Square className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Voice Synthesis */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // Generate voice from current script
                        const text = "Hello, this is a test voice synthesis.";
                        synthesizeVoice(text);
                      }}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Synthesize Voice
                    </Button>

                    {/* Music Generation */}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => generateMusic(musicOptions)}
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Generate Music
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={exportAudio}
                      disabled={audioTracks.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Audio
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}</span>
                    <div className="flex-1 bg-surface/50 rounded-full h-2">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-200"
                        style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                      />
                    </div>
                    <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toFixed(0).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Audio Tracks */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Audio Tracks</h3>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      // Add sample track for demo
                      setAudioTracks(prev => [...prev, {
                        id: `track-${Date.now()}`,
                        type: 'music',
                        name: 'Background Music',
                        url: 'sample-url',
                        duration: 120,
                        startTime: 0,
                        volume: 0.7,
                      }]);
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Track
                  </Button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2">
                  {audioTracks.map((track) => (
                    <motion.div
                      key={track.id}
                      className="flex-shrink-0 bg-surface/50 rounded-lg p-3 min-w-[200px]"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {track.type === 'voice' && <Mic className="w-4 h-4" />}
                          {track.type === 'music' && <Music className="w-4 h-4" />}
                          {track.type === 'effect' && <Volume2 className="w-4 h-4" />}
                          <span className="text-sm font-medium truncate">{track.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAudioTrack(track.id)}
                        >
                          ×
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <VolumeX className="w-3 h-3" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={track.volume}
                            onChange={(e) => updateAudioTrack(track.id, { volume: parseFloat(e.target.value) })}
                            className="flex-1"
                          />
                          <Volume2 className="w-3 h-3" />
                        </div>

                        <div className="text-xs text-foreground/60">
                          {Math.floor(track.startTime)}s - {Math.floor(track.startTime + track.duration)}s
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MultiModalContext.Provider>
  );
}