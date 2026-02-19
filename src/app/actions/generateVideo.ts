"use server";

import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const vertexAI = new VertexAI({ project, location });

const VEO_MODEL = 'veo-3.1-generate-001';

export async function generateSceneVideo(prompt: string, referenceImage?: string) {
    let attempts = 0;
    const maxRetries = 3;

    while (attempts <= maxRetries) {
        try {
            console.log(`[VIRTUAL PRODUCTION] Animating cinematic sequence (${attempts + 1}/${maxRetries + 1}): ${prompt.substring(0, 100)}...`);

            const model = vertexAI.getGenerativeModel({ model: VEO_MODEL });

            const request: any = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `ACTING PERFORMANCE: ${prompt}. Cinematic high-fidelity motion. Ensure the character's face matches the provided reference image perfectly. Smooth, realistic facial movements and expressions.` }
                        ]
                    }
                ],
                generationConfig: {
                    candidateCount: 1,
                }
            };

            // If we have a reference image (from Nano Banana), use it as the seed frame
            if (referenceImage) {
                const base64 = referenceImage.includes(',') ? referenceImage.split(',')[1] : referenceImage;
                request.contents[0].parts.unshift({
                    inlineData: {
                        data: base64.trim(),
                        mimeType: 'image/jpeg'
                    }
                });
            }

            const response = await model.generateContent(request);
            const data = response.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

            if (data) {
                return `data:video/mp4;base64,${data}`;
            }

            const prediction = (response.response as any).predictions?.[0];
            if (prediction?.bytesBase64Encoded) {
                return `data:video/mp4;base64,${prediction.bytesBase64Encoded}`;
            }

            throw new Error("No video data in response candidates or predictions");

        } catch (error: any) {
            attempts++;
            const isQuotaError = error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');

            if (isQuotaError && attempts <= maxRetries) {
                const waitTime = Math.pow(2, attempts) * 3000 + Math.random() * 3000;
                console.warn(`[STABILITY] Veo Quota hit. Retrying in ${Math.round(waitTime / 1000)}s...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue;
            }

            console.error("Veo Generation Error:", error.message);
            return null; // Video is optional, we fall back to the static keyframe
        }
    }
}
