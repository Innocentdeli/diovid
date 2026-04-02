import { NextRequest, NextResponse } from 'next/server';
import { directStory } from '@/app/actions/orchestrate';
import { generateSceneBackground } from '@/app/actions/generateImage';
import { generateSceneVideo } from '@/app/actions/generateVideo';
import { aiCoWrite } from '@/app/actions/aiWriter';
import { transcribeAudio } from '@/app/actions/speechToText';
import { extractPersona } from '@/app/actions/personaExtraction';
import { CloudStorage, supabase } from '@/lib/supabase';

// Input validation schemas
interface OrchestrateRequest {
  photos: string[];
  script: string;
  characters: Array<{
    name: string;
    vibe: string;
    traits: string[];
  }>;
}

interface GenerateImageRequest {
  prompt: string;
  referenceImage?: string;
  characterInfo?: {
    name: string;
    vibe: string;
    traits: string[];
  };
}

interface GenerateVideoRequest {
  prompt: string;
  referenceImage?: string;
}

interface AIWriteRequest {
  context: {
    scriptSoFar: string;
    selectedText?: string;
    characters: { name: string; vibe: string }[];
    instruction: 'rewrite' | 'continue' | 'improve' | 'scriptify' | 'global_scriptify';
    customPrompt?: string;
    format?: 'story' | 'script';
  };
}

// Rate limiting (simple in-memory store - use Redis in production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  return forwarded?.split(',')[0] || realIP || clientIP || 'unknown';
}

// Input sanitization
function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 10000); // Limit length
}

function validateOrchestrateRequest(body: any): OrchestrateRequest | null {
  if (!body || typeof body !== 'object') return null;

  const { photos, script, characters } = body;

  if (!Array.isArray(photos) || !script || !Array.isArray(characters)) return null;
  if (photos.length > 3) return null; // Limit photos
  if (characters.length === 0 || characters.length > 10) return null; // Reasonable character limits

  // Validate each character
  for (const char of characters) {
    if (!char.name || !char.vibe || !Array.isArray(char.traits)) return null;
    if (char.name.length > 100 || char.vibe.length > 200) return null;
    if (char.traits.length > 10) return null;
  }

  return {
    photos: photos.map(sanitizeString),
    script: sanitizeString(script),
    characters: characters.map(c => ({
      name: sanitizeString(c.name),
      vibe: sanitizeString(c.vibe),
      traits: c.traits.map(sanitizeString)
    }))
  };
}

// API Routes
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limiting
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const url = new URL(request.url);
    const endpoint = url.pathname.split('/api/')[1];

    switch (endpoint) {
      case 'orchestrate':
        return await handleOrchestrate(request);
      case 'generate-image':
        return await handleGenerateImage(request);
      case 'generate-video':
        return await handleGenerateVideo(request);
      case 'ai-write':
        return await handleAIWrite(request);
      case 'projects':
        return await handleProjects(request);
      case 'analytics':
        return await handleAnalyticsPost(request);
      case 'transcribe':
        return await handleTranscribe(request);
      case 'persona':
        return await handlePersonaExtraction(request);
      default:
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Recursive depth checker to prevent serialization errors
function checkMaxDepth(obj: any, maxDepth: number = 5, currentDepth: number = 0): void {
  if (currentDepth > maxDepth) {
    throw new Error(`Object nesting exceeds safe depth of ${maxDepth}`);
  }
  
  if (obj === null || typeof obj !== 'object') return;
  
  if (Array.isArray(obj) && obj.length > 0) {
    // Only check first item for arrays
    checkMaxDepth(obj[0], maxDepth, currentDepth + 1);
  } else {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        checkMaxDepth(obj[key], maxDepth, currentDepth + 1);
      }
    }
  }
}

// Flatten deeply nested arrays to prevent serialization issues
function flattenDeepArrays(obj: any, depth: number = 0, maxDepth: number = 8): any {
  if (depth > maxDepth) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => flattenDeepArrays(item, depth + 1, maxDepth));
  }
  
  const result: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (typeof value === 'object' && value !== null && depth >= maxDepth) {
        // Skip deeply nested objects at max depth
        continue;
      }
      result[key] = flattenDeepArrays(value, depth + 1, maxDepth);
    }
  }
  return result;
}

// Orchestrate endpoint
async function handleOrchestrate(request: NextRequest) {
  const body = await request.json();
  const validated = validateOrchestrateRequest(body);

  if (!validated) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }

  try {
    const result = await directStory(validated.photos, validated.script, validated.characters);
    
    // Aggressively flatten deeply nested arrays to prevent serialization issues
    // Limit nesting to 4 levels max
    const flattened = flattenDeepArrays(result, 0, 4);
    
    // Check flattened result for unsafe nesting (lenient check)
    checkMaxDepth(flattened, 12);
    
    // Wrap in proper response envelope (never raw AI output)
    return NextResponse.json({
      success: true,
      blueprint: flattened
    });
  } catch (error: any) {
    console.error('Orchestration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Orchestration failed' },
      { status: 500 }
    );
  }
}

// Generate image endpoint
async function handleGenerateImage(request: NextRequest) {
  const body = await request.json();

  if (!body.prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  const prompt = sanitizeString(body.prompt);
  const referenceImage = body.referenceImage ? sanitizeString(body.referenceImage) : undefined;
  const characterInfo = body.characterInfo ? {
    name: sanitizeString(body.characterInfo.name),
    vibe: sanitizeString(body.characterInfo.vibe),
    traits: body.characterInfo.traits?.map(sanitizeString) || []
  } : undefined;

  try {
    const result = await generateSceneBackground(prompt, referenceImage, characterInfo);
    return NextResponse.json({ url: result });
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}

// Generate video endpoint
async function handleGenerateVideo(request: NextRequest) {
  const body = await request.json();

  if (!body.prompt) {
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  const prompt = sanitizeString(body.prompt);
  const referenceImage = body.referenceImage ? sanitizeString(body.referenceImage) : undefined;

  try {
    const result = await generateSceneVideo(prompt, referenceImage);
    return NextResponse.json({ url: result });
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    );
  }
}

// AI writing endpoint
async function handleAIWrite(request: NextRequest) {
  const body = await request.json();

  if (!body.context) {
    return NextResponse.json(
      { error: 'Context is required' },
      { status: 400 }
    );
  }

  const context = body.context;

  // Validate context
  if (!context.scriptSoFar || !Array.isArray(context.characters) || !context.instruction) {
    return NextResponse.json(
      { error: 'Invalid context format' },
      { status: 400 }
    );
  }

  const validatedContext = {
    scriptSoFar: sanitizeString(context.scriptSoFar),
    selectedText: context.selectedText ? sanitizeString(context.selectedText) : undefined,
    characters: context.characters.map((c: any) => ({
      name: sanitizeString(c.name),
      vibe: sanitizeString(c.vibe)
    })),
    instruction: context.instruction,
    customPrompt: context.customPrompt ? sanitizeString(context.customPrompt) : undefined,
    format: context.format
  };

  try {
    const result = await aiCoWrite(validatedContext);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('AI writing error:', error);
    return NextResponse.json(
      { error: error.message || 'AI writing failed' },
      { status: 500 }
    );
  }
}

// Projects endpoint
async function handleProjects(request: NextRequest) {
  const method = request.method;

  try {
    switch (method) {
      case 'GET':
        const projects = await CloudStorage.loadUserProjects();
        return NextResponse.json(projects);

      case 'POST':
        const body = await request.json();
        const projectName = sanitizeString(body.name || 'Untitled Project');
        const project = await CloudStorage.saveProject({
          name: projectName,
          characters: body.characters || [],
          scriptHtml: sanitizeString(body.scriptHtml || ''),
          storyHtml: sanitizeString(body.storyHtml || ''),
          orchestration: null, // Don't save orchestration - too large and can be regenerated
          isPublic: body.isPublic || false,
          tags: body.tags || []
        });
        return NextResponse.json(project);

      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error: any) {
    console.error('Projects API error:', error);
    return NextResponse.json(
      { error: error.message || 'Projects operation failed' },
      { status: 500 }
    );
  }
}

// Analytics POST handler — stores events in Supabase
async function handleAnalyticsPost(request: NextRequest) {
  try {
    const body = await request.json();
    const events = body.events;
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ ok: true }); // silently accept empty
    }

    // Best-effort insert — don't block on errors
    supabase
      .from('analytics_events')
      .insert(
        events.map((e: any) => ({
          event_name: String(e.name || 'unknown').substring(0, 100),
          properties: e.properties || {},
          session_id: String(e.sessionId || ''),
          url: String(e.url || '').substring(0, 500),
          created_at: new Date(e.timestamp || Date.now()).toISOString(),
        }))
      )
      .then(({ error }) => {
        if (error) console.warn('[ANALYTICS] Insert warning:', error.message);
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never fail analytics
  }
}

// Transcription endpoint — delegates to Gemini STT
async function handleTranscribe(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.audioBase64) {
      return NextResponse.json({ error: 'audioBase64 is required' }, { status: 400 });
    }

    const result = await transcribeAudio({
      audioBase64: body.audioBase64,
      mimeType: body.mimeType || 'audio/wav',
      language: body.language || 'en-US',
      enableSpeakerDiarization: body.enableSpeakerDiarization || false,
    });

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ subtitles: result });
  } catch (error: any) {
    console.error('[TRANSCRIBE] Error:', error);
    return NextResponse.json({ error: error.message || 'Transcription failed' }, { status: 500 });
  }
}

// Persona extraction endpoint
async function handlePersonaExtraction(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const result = await extractPersona(body.imageBase64, body.existingName);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[PERSONA] Error:', error);
    return NextResponse.json({ error: error.message || 'Persona extraction failed' }, { status: 500 });
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const endpoint = url.pathname.split('/api/')[1];

  // Analytics insights
  if (endpoint === 'analytics/insights') {
    const timeframe = url.searchParams.get('timeframe') || 'week';
    const days = timeframe === 'day' ? 1 : timeframe === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_name')
      .gte('created_at', since);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const row of data || []) {
      counts[row.event_name] = (counts[row.event_name] || 0) + 1;
    }

    return NextResponse.json({ timeframe, totalEvents: (data || []).length, byEvent: counts });
  }

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}