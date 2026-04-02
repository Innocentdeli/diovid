"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from '@/lib/ai-stability';

const MODEL_NAME = 'imagen-3.0-generate-001';
const LOCATION = 'us-central1';

// Global throttle to handle strict project quotas
let lastRequestChain = Promise.resolve();
const MIN_GAP_MS = 20000; // Increase to 20s for Imagen 3 safety

export async function generateSceneBackground(prompt: string, referenceImage?: string, characterInfo?: { name: string, vibe: string, traits: string[] }) {
    if (!prompt?.trim()) {
        throw new Error("Prompt is required for image generation");
    }

    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const vertexAI = new VertexAI({ project, location: LOCATION });
    const model = (vertexAI.preview as any).getGenerativeModel({ model: MODEL_NAME });

    try {
        let enhancedPrompt = prompt;
        if (characterInfo) {
            enhancedPrompt = `Cinematic high-fidelity shot. ${prompt}. Character: ${characterInfo.name}, Vibe: ${characterInfo.vibe}, Traits: ${characterInfo.traits.join(', ')}. Dramatic lighting, 8k resolution.`;
        }

        const myRequest = (async () => {
            // Wait for previous requests in the chain to finish
            await lastRequestChain;

            try {
                console.log(`[VIRTUAL PRODUCTION] Creating cinematic set via ${MODEL_NAME} (Vertex AI): ${prompt.substring(0, 100)}...`);

                const result = await reliableRequest(async () => {
                    // Vertex AI Imagen 3 request structure
                    const response = await model.generateContent({
                        contents: [{
                            role: 'user',
                            parts: [{ text: enhancedPrompt }]
                        }],
                        generationConfig: {
                            sampleCount: 1,
                            aspectRatio: "16:9",
                        }
                    });
                    
                    const responseData = await response.response;
                    return responseData;
                }, {
                    maxRetries: 7,
                    baseDelay: 5000,
                    onRetry: (a, e) => console.warn(`[STABILITY] Imagen retry ${a}/7: ${e.message}`)
                });

                // Extract base64 from prediction
                const base64Data = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

                if (base64Data) {
                    return `data:image/jpeg;base64,${base64Data}`;
                }

                throw new Error(`Failed to extract image data from Vertex AI ${MODEL_NAME}`);
            } finally {
                // Enforce the gap even on failure
                await new Promise(resolve => setTimeout(resolve, MIN_GAP_MS));
            }
        })();

        lastRequestChain = myRequest.then(() => { }).catch(() => { });

        return await myRequest;
    } catch (e: any) {
        const safeMessage = e?.message || String(e);
        console.error(`[VIRTUAL PRODUCTION] Image Generation Failed:`, safeMessage);
        throw new Error(`Virtual Production Failed: ${safeMessage}`);
    }
}
