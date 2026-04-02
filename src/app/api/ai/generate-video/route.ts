import { NextRequest, NextResponse } from 'next/server';
import { robustFetch } from '@/lib/robust-fetch';

const API_KEY = process.env.GOOGLE_API_KEY!;
const VEO_MODEL = 'veo-2.0-generate-001'; // veo-2 is stable; veo-3 preview may 404

export const maxDuration = 600; // 10 mins for video generation + polling // 5 minutes for video generation

export async function POST(req: NextRequest) {
    try {
        if (!API_KEY) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { prompt, imageBase64 } = body;

        if (!prompt?.trim()) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        console.log(`[VIDEO GEN] Starting Veo generation: ${prompt.substring(0, 80)}... (using robustFetch)`);

        const startUrl = `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning?key=${API_KEY}`;

        // Build instance with optional image conditioning
        const instance: any = {
            prompt: `Cinematic video: ${prompt}. Smooth, photorealistic footage.`
        };
        
        if (imageBase64) {
            const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
            instance.image = {
                bytesBase64Encoded: base64.replace(/\s+/g, ''),
                mimeType: 'image/jpeg'
            };
        }

        const startResponse = await robustFetch(startUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                instances: [instance],
                parameters: {
                    aspectRatio: '16:9',
                    durationSeconds: 5,
                }
            }
        });

        const startData = await startResponse.json();

        if (!startResponse.ok || startData.error) {
            const errMsg = startData.error?.message || startData.error || `HTTP ${startResponse.status}`;
            console.error('[VIDEO GEN] Start error:', errMsg);
            return NextResponse.json({ error: errMsg }, { status: startResponse.status || 500 });
        }

        const opName = startData.name;
        if (!opName) {
            return NextResponse.json({ error: 'No operation name returned from Veo API' }, { status: 500 });
        }

        console.log(`[VIDEO GEN] Operation started: ${opName}. Polling...`);

        // Poll for up to 10 minutes (60 polls × 10s)
        for (let i = 0; i < 60; i++) {
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Retry each individual poll up to 3 times to survive transient network blips
            let pollData: any = null;
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    const pollResponse = await robustFetch(
                        `https://generativelanguage.googleapis.com/v1beta/${opName}?key=${API_KEY}`
                    );
                    pollData = await pollResponse.json();
                    break; // success
                } catch (pollErr: any) {
                    console.warn(`[VIDEO GEN] Poll attempt ${attempt + 1}/3 failed: ${pollErr.message}. Retrying in 2s...`);
                    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
                    else throw pollErr; // all 3 attempts failed, let outer catch handle
                }
            }
            if (!pollData) continue;

            if (pollData.error) {
                const errMsg = pollData.error?.message || JSON.stringify(pollData.error).substring(0, 100);
                console.error('[VIDEO GEN] Poll error:', errMsg);
                return NextResponse.json({ error: errMsg }, { status: 500 });
            }

            if (pollData.done) {
                const videoBase64 = pollData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri
                    || pollData.response?.video?.bytesBase64Encoded;

                if (videoBase64) {
                    console.log(`[VIDEO GEN] ✅ Complete after ${i + 1} polls`);
                    // If it's a URI, return it directly; if base64, wrap it
                    const videoUrl = videoBase64.startsWith('http')
                        ? videoBase64
                        : `data:video/mp4;base64,${videoBase64}`;
                    return NextResponse.json({ videoUrl });
                }

                console.error('[VIDEO GEN] Done but no video data found:', JSON.stringify(pollData).substring(0, 200));
                return NextResponse.json({ error: 'Video generation completed but no video data was returned' }, { status: 500 });
            }

            console.log(`[VIDEO GEN] Polling... (${i + 1}/60)`);
        }

        return NextResponse.json({ error: 'Video generation timed out after 10 minutes' }, { status: 504 });

    } catch (err: any) {
        const message = err?.message || String(err);
        console.error('[VIDEO GEN] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
