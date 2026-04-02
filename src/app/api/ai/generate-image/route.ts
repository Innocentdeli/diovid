import { NextRequest, NextResponse } from 'next/server';
import { robustFetch } from '@/lib/robust-fetch';

const API_KEY = process.env.GOOGLE_API_KEY!;
const IMAGEN_MODEL = 'imagen-4.0-generate-001';

export const maxDuration = 300; // 5 mins for safety, though usually fast

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { prompt, characterInfo } = body;

        if (!prompt?.trim()) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        let enhancedPrompt = prompt;
        if (characterInfo) {
            enhancedPrompt = `Cinematic high-fidelity shot. ${prompt}. Character: ${characterInfo.name}, Vibe: ${characterInfo.vibe}, Traits: ${characterInfo.traits?.join(', ')}. Dramatic lighting, 8k resolution.`;
        }

        console.log(`[IMAGE GEN] Generating via ${IMAGEN_MODEL}: ${prompt.substring(0, 80)}... (using robustFetch)`);

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict?key=${API_KEY}`;

        const response = await robustFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                instances: [{ prompt: enhancedPrompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: '16:9',
                    outputMimeType: 'image/jpeg'
                }
            }
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            const errMsg = data.error?.message || data.error || `HTTP ${response.status}`;
            console.error('[IMAGE GEN] API Error:', errMsg);
            return NextResponse.json({ error: errMsg }, { status: response.status || 500 });
        }

        const base64 = data.predictions?.[0]?.bytesBase64Encoded;
        if (!base64) {
            return NextResponse.json({ error: 'No image data in API response' }, { status: 500 });
        }

        return NextResponse.json({ imageUrl: `data:image/jpeg;base64,${base64}` });

    } catch (err: any) {
        const message = err?.message || String(err);
        console.error('[IMAGE GEN] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
