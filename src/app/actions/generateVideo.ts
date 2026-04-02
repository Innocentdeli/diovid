"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from '@/lib/ai-stability';

const MODEL_NAME = 'veo-3.1-generate-001';
const LOCATION = 'us-central1'; // Most stable region for video models

export async function generateSceneVideo(prompt: string, referenceImage?: string) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const vertexAI = new VertexAI({ project, location: LOCATION });
    const model = vertexAI.preview.getGenerativeModel({ model: MODEL_NAME });

    try {
        console.log(`[VIRTUAL PRODUCTION] Animating cinematic sequence via ${MODEL_NAME} (Vertex AI): ${prompt.substring(0, 100)}...`);

        const request = {
            contents: [{
                role: 'user',
                parts: [
                    { text: `ACTING PERFORMANCE: ${prompt}. Cinematic high-fidelity motion. Smooth, realistic facial movements and expressions.` },
                    ...(referenceImage ? [{
                        inlineData: {
                            data: referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage,
                            mimeType: 'image/jpeg'
                        }
                    }] : [])
                ]
            }]
        };

        const result = await reliableRequest(async () => {
            const response = await model.generateContent(request);
            // Note: Veo 3.1 on Vertex often returns a long-running operation or a direct response depending on the specific model version
            // For the preview version, we handle it defensively
            const responseData = await response.response;
            return responseData;
        }, {
            maxRetries: 3,
            baseDelay: 5000,
            onRetry: (a, e) => console.warn(`[STABILITY] Veo retry ${a}/3: ${e.message}`)
        });

        // Vertex SDK handles the response parts. We look for the video blob.
        const videoPart = result.candidates?.[0]?.content?.parts?.find(p => (p as any).videoMetadata || p.inlineData?.mimeType?.startsWith('video/'));
        
        if (videoPart?.inlineData?.data) {
            return `data:video/mp4;base64,${videoPart.inlineData.data}`;
        }

        // If it's a newer version that returns a URI or different structure
        const videoText = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (videoText && videoText.startsWith('data:video')) {
            return videoText;
        }

        throw new Error("Video generation failed to return media data");

    } catch (error: any) {
        const safeMessage = error?.message || String(error);
        console.error(`[VIRTUAL PRODUCTION] Veo Generation Error:`, safeMessage);
        throw new Error(`Video Production Failed: ${safeMessage}`);
    }
}
