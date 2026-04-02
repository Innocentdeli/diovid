import { NextRequest, NextResponse } from 'next/server';
import { robustFetch } from '@/lib/robust-fetch';

const API_KEY = process.env.GOOGLE_API_KEY!;
const MODEL = 'gemini-2.0-flash';

export const maxDuration = 300; // 5 mins for orchestration

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { imageData, userIntent, characters } = body;

        if (!userIntent?.trim()) {
            return NextResponse.json({ error: 'Script content is required' }, { status: 400 });
        }
        if (!characters?.length) {
            return NextResponse.json({ error: 'At least one character is required' }, { status: 400 });
        }

        const imageParts = (imageData || []).slice(0, 3).map((data: string) => {
            const base64 = data.includes(',') ? data.split(',')[1] : data;
            return {
                inlineData: {
                    data: base64.replace(/\s+/g, ''),
                    mimeType: 'image/jpeg',
                }
            };
        });

        const prompt = `You are an AI VIDEO DIRECTOR. Convert this script into a production plan.
Split into 2-4 logical scenes. Every scene must have: an emotion, gesture, camera shot, and dialogue.

CHARACTER CAST:
${characters.map((c: any) => `- ${c.name}: ${c.vibe || 'professional presenter'}`).join('\n')}

USER SCRIPT:
"${userIntent}"

Return ONLY valid JSON:
{
  "scenes": [
    {
      "scene_id": 1,
      "duration_seconds": 5,
      "background_environment": "string",
      "camera_shot": "medium",
      "character_emotion": "confident",
      "dialogue_text": "string (ACTUAL SPOKEN WORDS ONLY - NO metadata, NO 'Time:', NO character names)",
      "character_name": "string (the name of the character speaking)",
      "visual_direction": "string (A detailed 20-30 word visual prompt describing the character's look, their emotion, and the background for this specific shot)",
      "animation_gesture": "arms_relaxed",
      "animation_head_motion": "none",
      "background_lighting": "cinematic"
    }
  ]
}`;

        console.log(`[ORCHESTRATOR] Planning via REST ${MODEL}... (using robustFetch)`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        const response = await robustFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                contents: [{
                    role: 'user',
                    parts: [...imageParts, { text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            }
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            const errMsg = data.error?.message || data.error || `HTTP ${response.status}`;
            console.error('[ORCHESTRATOR] API Error:', errMsg);
            return NextResponse.json({ error: errMsg }, { status: response.status || 500 });
        }

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            return NextResponse.json({ error: 'Empty response from Gemini orchestrator' }, { status: 500 });
        }

        // Strip markdown fences
        text = text.trim();
        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);

        const parsed = JSON.parse(text.trim());

        if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
            return NextResponse.json({ error: 'No scenes returned from AI Director' }, { status: 500 });
        }

        // Normalize each scene to safe plain values
        parsed.scenes = parsed.scenes.map((scene: any, i: number) => ({
            scene_id: Number(scene.scene_id) || (i + 1),
            duration_seconds: Number(scene.duration_seconds) || 5,
            background_environment: String(scene.background_environment || 'cinematic studio'),
            camera_shot: String(scene.camera_shot || 'medium'),
            character_emotion: String(scene.character_emotion || 'neutral'),
            dialogue_text: String(scene.dialogue_text || scene.dialogue || scene.text || '')
                .replace(/\[[^\]]*\]/g, '') // Remove [bracketed text]
                .replace(/\([^)]*\)/g, '')   // Remove (parenthetical text)
                .replace(/^(Time|Scene|Dialogue|Speaker|John|Jane|Voiceover|Narrator):\s+/i, '')
                .replace(/^[a-z]+\s+[0-9]+:\s+/i, '') // e.g. "Scene 1: "
                .replace(/^[0-9]+:[0-9]+\s+/g, '')     // e.g. "0:05 "
                .trim(),
            character_name: String(scene.character_name || characters[0]?.name || ''),
            visual_direction: String(scene.visual_direction || ''),
            animation_gesture: String(scene.animation_gesture || 'arms_relaxed'),
            animation_head_motion: String(scene.animation_head_motion || 'none'),
            background_lighting: String(scene.background_lighting || 'cinematic'),
            camera_movement: 'static',
            transition_out: 'cut',
            animation_contract: {
                face_blink_rate: 'medium',
                face_mouth_activity: 'speech',
                head_motion_type: String(scene.animation_head_motion || 'none'),
                head_intensity: 0.5,
                gesture_name: String(scene.animation_gesture || 'arms_relaxed'),
                gesture_start_time_seconds: 0,
                gesture_end_time_seconds: 0,
            }
        }));

        return NextResponse.json(parsed);

    } catch (err: any) {
        const message = err?.message || String(err);
        console.error('[ORCHESTRATOR] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
