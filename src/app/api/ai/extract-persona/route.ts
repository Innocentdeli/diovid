import { NextRequest, NextResponse } from 'next/server';
import { robustFetch } from '@/lib/robust-fetch';

const API_KEY = process.env.GOOGLE_API_KEY!;
const MODEL = 'gemini-2.0-flash';

export const maxDuration = 300; // 5 mins for safety, though usually fast

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { imageBase64, existingName } = body;

        if (!imageBase64) {
            return NextResponse.json({ error: 'Image is required' }, { status: 400 });
        }

        const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const prompt = `You are an AI character analyst for a video production platform.

Analyze this person's photo and generate a professional character profile.
${existingName ? `This character's name is: ${existingName}` : ''}

Return ONLY valid JSON — no markdown, no extra text.

{
  "suggestedVibe": "A 5-10 word description of their presence and energy",
  "suggestedTraits": ["trait1", "trait2", "trait3", "trait4"],
  "frameAnalysis": {
    "framing": "chest_up",
    "estimatedAge": "25-35",
    "dominantEmotion": "confident",
    "lightingStyle": "natural"
  },
  "presentationStyle": "professional",
  "confidence": 0.85
}`;

        // Use REST API directly — more reliable than SDK in server environments
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

        const response = await robustFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                contents: [{
                    role: 'user',
                    parts: [
                        {
                            inlineData: {
                                data: base64.replace(/\s+/g, ''),
                                mimeType: 'image/jpeg'
                            }
                        },
                        { text: prompt }
                    ]
                }],
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            }
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            const errMsg = data.error?.message || data.error || `HTTP ${response.status}`;
            console.error('[PERSONA] API Error:', errMsg);
            return NextResponse.json({ error: errMsg }, { status: response.status || 500 });
        }

        let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) {
            return NextResponse.json({ error: 'Empty response from Gemini' }, { status: 500 });
        }

        // Strip markdown fences
        text = text.trim();
        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);

        const parsed = JSON.parse(text.trim());

        if (!parsed.suggestedVibe || !Array.isArray(parsed.suggestedTraits)) {
            return NextResponse.json({ error: 'Invalid persona structure returned by AI' }, { status: 500 });
        }

        return NextResponse.json(parsed);

    } catch (err: any) {
        const message = err?.message || String(err);
        console.error('[PERSONA] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
