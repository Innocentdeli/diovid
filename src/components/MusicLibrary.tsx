"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Music, Play, Pause, Volume2, Download, Search, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMusicLibrary, MUSIC_MOODS, type MusicTrack } from '@/app/actions/musicLibrary';

export function MusicLibrary() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [useSemantic, setUseSemantic] = useState(false);
  const [volume, setVolume] = useState(70);
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadTracks = useCallback(async (mood?: string, query?: string) => {
    setIsLoading(true);
    try {
      const result = await searchMusicLibrary({
        mood: mood || undefined,
        searchQuery: query || undefined,
        useSemantic: useSemantic,
        limit: 20,
      });
      setTracks(Array.isArray(result) ? result : []);
    } catch {
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTracks(selectedMood || undefined, searchQuery || undefined);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedMood, useSemantic, loadTracks]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const playTrack = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      // Toggle pause
      if (audioRef.current?.paused) {
        audioRef.current.play();
      } else {
        audioRef.current?.pause();
        setPlayingTrackId(null);
      }
      return;
    }

    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);

    const audio = new Audio(track.audioUrl);
    audio.volume = volume / 100;
    audio.play().catch(console.error);
    audioRef.current = audio;
    setPlayingTrackId(track.id);
    setPlaybackProgress(prev => ({ ...prev, [track.id]: 0 }));

    progressTimerRef.current = setInterval(() => {
      if (audio.duration && !isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;
        setPlaybackProgress(prev => ({ ...prev, [track.id]: progress }));
        if (audio.ended) {
          setPlayingTrackId(null);
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        }
      }
    }, 250);

    audio.addEventListener('ended', () => {
      setPlayingTrackId(null);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    });
  };

  const handleMoodSelect = (mood: string) => {
    const next = selectedMood === mood ? null : mood;
    setSelectedMood(next);
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="w-full space-y-4 bg-background p-4 rounded-lg border border-border/30">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Music size={20} />
          Music Library
          <span className="text-xs font-normal text-foreground/50 ml-1">Royalty-free</span>
        </h2>
        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-foreground/50" />
          <input
            type="range" min={0} max={100} value={volume}
            onChange={(e) => setVolume(parseInt(e.target.value))}
            className="w-20 accent-primary"
          />
          <span className="text-xs text-foreground/40 w-8 text-right">{volume}%</span>
        </div>
      </div>

      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            type="text"
            placeholder={useSemantic ? "Search by vibe or scene (semantic)..." : "Search tracks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface/50 border border-border/30 rounded-lg pl-8 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={() => setUseSemantic(!useSemantic)}
          className={`px-3 py-1 rounded-lg text-[10px] font-mono uppercase tracking-widest border transition-all flex items-center gap-1.5 ${useSemantic
            ? 'bg-primary/20 border-primary text-primary shadow-glow-primary'
            : 'bg-surface/50 border-border/30 text-foreground/40 hover:border-border/60'
            }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${useSemantic ? 'bg-primary animate-pulse' : 'bg-foreground/20'}`} />
          Semantic
        </button>
      </div>

      {/* Mood Filters */}
      <div className="flex gap-2 flex-wrap">
        {MUSIC_MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => handleMoodSelect(mood.id)}
            className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-all ${selectedMood === mood.id
                ? 'bg-primary text-background'
                : 'bg-surface/50 border border-border/30 hover:border-primary/50'
              }`}
          >
            {mood.emoji} {mood.label}
          </button>
        ))}
      </div>

      {/* Track List */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-foreground/40">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading tracks...</span>
          </div>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-10">No tracks found</p>
        ) : (
          <AnimatePresence mode="popLayout">
            {tracks.map((track) => {
              const isPlaying = playingTrackId === track.id;
              const progress = playbackProgress[track.id] || 0;

              return (
                <motion.div
                  key={track.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`p-3 rounded-lg border transition-all ${isPlaying
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface/50 border-border/20 hover:border-primary/30'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Play button */}
                    <button
                      onClick={() => playTrack(track)}
                      className={`p-2.5 rounded-full flex-shrink-0 transition-all ${isPlaying
                          ? 'bg-primary text-background'
                          : 'bg-primary/20 hover:bg-primary/30'
                        }`}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{track.title}</p>
                      <p className="text-xs text-foreground/50">
                        {track.artist} · {formatDuration(track.duration)} · {track.bpm} BPM
                      </p>

                      {/* Progress bar */}
                      {isPlaying && (
                        <div className="mt-2 h-1 bg-primary/20 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {useSemantic && (track as any).similarity && (
                        <span className="text-[10px] text-primary/60 font-mono">
                          {Math.round((track as any).similarity * 100)}% match
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface border border-border/30 font-mono">
                        {track.genre}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-mono">
                        FREE
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-xs text-foreground/60">
        🎵 All tracks are royalty-free (CC0 / Pixabay license). Safe for commercial use — no attribution required.
      </div>
    </div>
  );
}

export default MusicLibrary;
