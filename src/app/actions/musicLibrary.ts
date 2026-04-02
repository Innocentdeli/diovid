'use server';

import { generateEmbedding, cosineSimilarity } from './embeddings';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  bpm: number;
  mood: string;
  genre: string;
  audioUrl: string;
  thumbnailUrl?: string;
  license: 'free' | 'premium';
  attributionRequired: boolean;
  attribution?: string;
  embedding?: number[]; // Semantic vector
}

export interface MusicLibraryFilter {
  mood?: string;
  genre?: string;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  useSemantic?: boolean;
}

// Curated fallback tracks (royalty-free, CC0 / CC-BY licensed from public archives)
const FALLBACK_TRACKS: MusicTrack[] = [
  {
    id: 'fb-1',
    title: 'Inspiring Corporate',
    artist: 'Pixabay Music',
    duration: 135,
    bpm: 110,
    mood: 'professional',
    genre: 'Corporate',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/07/10/audio_cae988ad8b.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-2',
    title: 'Upbeat Technology',
    artist: 'Pixabay Music',
    duration: 155,
    bpm: 128,
    mood: 'energetic',
    genre: 'Electronic',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/03/12/audio_6a56cd4fef.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-3',
    title: 'Cinematic Epic',
    artist: 'Pixabay Music',
    duration: 180,
    bpm: 90,
    mood: 'dramatic',
    genre: 'Orchestral',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/02/28/audio_e3fa3ee3f1.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-4',
    title: 'Calm Ambient',
    artist: 'Pixabay Music',
    duration: 200,
    bpm: 70,
    mood: 'calm',
    genre: 'Ambient',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/01/15/audio_871a62f4f8.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-5',
    title: 'Happy Background',
    artist: 'Pixabay Music',
    duration: 120,
    bpm: 120,
    mood: 'happy',
    genre: 'Pop',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/11/13/audio_8734e39cd5.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-6',
    title: 'Lofi Study Beats',
    artist: 'Pixabay Music',
    duration: 240,
    bpm: 80,
    mood: 'calm',
    genre: 'Lofi',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/05/20/audio_4fe8f73680.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-7',
    title: 'Motivational Drive',
    artist: 'Pixabay Music',
    duration: 160,
    bpm: 125,
    mood: 'energetic',
    genre: 'Electronic',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/06/08/audio_4fbd20e1a0.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-8',
    title: 'Mysterious Tension',
    artist: 'Pixabay Music',
    duration: 175,
    bpm: 85,
    mood: 'mysterious',
    genre: 'Cinematic',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/04/01/audio_1608a7bba7.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-9',
    title: 'Romantic Piano',
    artist: 'Pixabay Music',
    duration: 195,
    bpm: 65,
    mood: 'romantic',
    genre: 'Classical',
    audioUrl: 'https://cdn.pixabay.com/audio/2024/02/10/audio_6e0dae6e77.mp3',
    license: 'free',
    attributionRequired: false,
  },
  {
    id: 'fb-10',
    title: 'Funky Groove',
    artist: 'Pixabay Music',
    duration: 145,
    bpm: 108,
    mood: 'funky',
    genre: 'Funk',
    audioUrl: 'https://cdn.pixabay.com/audio/2023/12/20/audio_7e17b62b8d.mp3',
    license: 'free',
    attributionRequired: false,
  },
];

/**
 * Search for royalty-free music tracks.
 * Uses Pixabay Music API if NEXT_PUBLIC_PIXABAY_API_KEY is set,
 * otherwise falls back to curated CDN tracks.
 */
export async function searchMusicLibrary(
  filters: MusicLibraryFilter = {}
): Promise<MusicTrack[] | { error: string }> {
  try {
    const useSemantic = filters.useSemantic && filters.searchQuery;
    let queryEmbedding: number[] | null = null;

    if (useSemantic) {
      console.log(`[MUSIC] Generating query embedding for: "${filters.searchQuery}"`);
      queryEmbedding = await generateEmbedding(filters.searchQuery!);
    }

    const apiKey = process.env.PIXABAY_API_KEY;

    if (apiKey) {
      const params = new URLSearchParams({
        key: apiKey,
        per_page: String(filters.limit || 20),
        page: String(Math.floor((filters.offset || 0) / (filters.limit || 20)) + 1),
      });

      if (filters.searchQuery) params.set('q', filters.searchQuery);

      const response = await fetch(
        `https://pixabay.com/api/music/?${params}`,
        { next: { revalidate: 3600 } } // cache for 1 hour
      );

      if (response.ok) {
        const data = await response.json();
        const hits = data.hits || [];

        const tracks: MusicTrack[] = hits.map((hit: any) => ({
          id: String(hit.id),
          title: hit.tags?.split(',')[0]?.trim() || 'Untitled',
          artist: 'Pixabay Artist',
          duration: Math.round(hit.duration || 120),
          bpm: hit.bpm || 100,
          mood: filters.mood || inferMood(hit.tags || ''),
          genre: inferGenre(hit.tags || ''),
          audioUrl: hit.audio || hit.url,
          thumbnailUrl: hit.previewURL,
          license: 'free' as const,
          attributionRequired: false,
          attribution: `Music by Pixabay (pixabay.com)`,
        }));

        // Apply client-side mood filter if requested
        const filtered = filters.mood
          ? tracks.filter(t => t.mood.toLowerCase().includes(filters.mood!.toLowerCase()))
          : tracks;

        return filtered.length > 0 ? filtered : FALLBACK_TRACKS;
      }
    }

    // Fallback: return curated tracks filtered by mood/query if supplied
    let tracks = [...FALLBACK_TRACKS];

    if (useSemantic && queryEmbedding) {
      console.log(`[MUSIC] Performing semantic similarity search...`);
      // In a real app, tracks would be in a vector DB.
      // Here we generate/retrieve embeddings for our local tracks on the fly (cached in production)
      const scoredTracks = await Promise.all(tracks.map(async (track) => {
        // Simple semantic representation: Title + Mood + Genre
        const trackText = `${track.title} ${track.mood} ${track.genre}`;
        const trackEmbedding = await generateEmbedding(trackText);
        const similarity = cosineSimilarity(queryEmbedding!, trackEmbedding);
        return { ...track, similarity };
      }));

      // Sort by similarity
      tracks = scoredTracks
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .filter(t => (t.similarity || 0) > 0.6); // Threshold
    } else {
      if (filters.mood) {
        const moodLower = filters.mood.toLowerCase();
        const filtered = tracks.filter(t => t.mood.toLowerCase().includes(moodLower));
        if (filtered.length > 0) tracks = filtered;
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const filtered = tracks.filter(
          t => t.title.toLowerCase().includes(q) || t.genre.toLowerCase().includes(q)
        );
        if (filtered.length > 0) tracks = filtered;
      }
    }

    return tracks.slice(0, filters.limit || 20);
  } catch (error) {
    console.error('[MUSIC LIBRARY] Search error:', error);
    return FALLBACK_TRACKS;
  }
}

export async function getTrendingMusic(limit = 20): Promise<MusicTrack[]> {
  const result = await searchMusicLibrary({ limit });
  return Array.isArray(result) ? result : FALLBACK_TRACKS.slice(0, limit);
}

export async function getMusicByMood(mood: string, limit = 20): Promise<MusicTrack[]> {
  const result = await searchMusicLibrary({ mood, limit });
  return Array.isArray(result) ? result : FALLBACK_TRACKS.slice(0, limit);
}

// ─── Utility helpers ───────────────────────────────────────────────────────────

function inferMood(tags: string): string {
  const lower = tags.toLowerCase();
  if (lower.includes('happy') || lower.includes('upbeat') || lower.includes('cheerful')) return 'happy';
  if (lower.includes('sad') || lower.includes('melancholic')) return 'romantic';
  if (lower.includes('calm') || lower.includes('relax') || lower.includes('ambient')) return 'calm';
  if (lower.includes('energy') || lower.includes('fast') || lower.includes('intense')) return 'energetic';
  if (lower.includes('dramatic') || lower.includes('epic') || lower.includes('cinematic')) return 'dramatic';
  if (lower.includes('mystery') || lower.includes('dark')) return 'mysterious';
  if (lower.includes('corporate') || lower.includes('business')) return 'professional';
  return 'professional';
}

function inferGenre(tags: string): string {
  const lower = tags.toLowerCase();
  if (lower.includes('electronic') || lower.includes('techno')) return 'Electronic';
  if (lower.includes('jazz')) return 'Jazz';
  if (lower.includes('classical') || lower.includes('piano') || lower.includes('orchestra')) return 'Orchestral';
  if (lower.includes('lofi') || lower.includes('lo-fi')) return 'Lofi';
  if (lower.includes('ambient')) return 'Ambient';
  if (lower.includes('rock')) return 'Rock';
  if (lower.includes('pop')) return 'Pop';
  if (lower.includes('hip hop') || lower.includes('hiphop')) return 'Hip Hop';
  return 'Cinematic';
}

export const MUSIC_MOODS = [
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'energetic', label: 'Energetic', emoji: '⚡' },
  { id: 'calm', label: 'Calm', emoji: '😌' },
  { id: 'dramatic', label: 'Dramatic', emoji: '🎭' },
  { id: 'happy', label: 'Happy', emoji: '😊' },
  { id: 'mysterious', label: 'Mysterious', emoji: '🌙' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
  { id: 'funky', label: 'Funky', emoji: '🔥' },
];

export const MUSIC_GENRES = [
  'Ambient', 'Electronic', 'Hip Hop', 'Jazz', 'Pop',
  'Rock', 'Classical', 'Orchestral', 'Lofi', 'Cinematic', 'Funk',
];
