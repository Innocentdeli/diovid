"use server";

import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const vertexAI = new VertexAI({ project, location });

const IMAGEN_MODEL = 'gemini-3-pro-image-preview'; // Nano Banana Pro

export async function generateSceneBackground(prompt: string, referenceImage?: string, characterInfo?: { name: string, vibe: string, traits: string[] }) {
    let attempts = 0;
    const maxRetries = 5;

    while (attempts <= maxRetries) {
        try {
            let enhancedPrompt = prompt;
            if (characterInfo) {
                enhancedPrompt = `Cinematic high-fidelity shot. ${prompt}. Character: ${characterInfo.name}, Vibe: ${characterInfo.vibe}, Traits: ${characterInfo.traits.join(', ')}. Dramatic lighting, 8k resolution.`;
            }
            console.log(`[VIRTUAL PRODUCTION] Creating cinematic set (${attempts + 1}/${maxRetries + 1}): ${prompt.substring(0, 100)}...`);

            const model = vertexAI.getGenerativeModel({ model: IMAGEN_MODEL });

            const parts: any[] = [
                { text: enhancedPrompt }
            ];

            // Include reference image if provided (Face matching / Character consistency)
            if (referenceImage) {
                const base64 = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
                parts.unshift({
                    inlineData: {
                        data: base64.trim(),
                        mimeType: 'image/jpeg'
                    }
                });
            }

            const request = {
                contents: [{ role: 'user', parts }]
            };

            const response = await model.generateContent(request);
            const data = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (data) {
                return `data:image/png;base64,${data}`;
            }

            throw new Error("No image data in response candidates");

        } catch (error: any) {
            attempts++;
            const isQuotaError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');

            if (isQuotaError && attempts <= maxRetries) {
                // More aggressive exponential backoff for severe quota limits
                const waitTime = Math.pow(2, attempts) * 2000 + Math.random() * 2000;
                console.warn(`[STABILITY] Imagen Quota hit. Retrying in ${Math.round(waitTime / 1000)}s... (Attempt ${attempts}/${maxRetries})`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            console.error("Imagen Generation Error:", error.message);

            // High-quality atmospheric fallback if Vertex AI is exhausted or fails
            const keywords = prompt.split(' ').slice(0, 4).join(',').replace(/[^a-zA-Z,]/g, '');
            return `https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&content=${keywords}`;
        }
    }
}
