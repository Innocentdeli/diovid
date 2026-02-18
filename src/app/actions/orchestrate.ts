"use server";

import { VertexAI, SchemaType } from '@google-cloud/vertexai';

// Initialize Vertex AI (Global Endpoint for Gemini 3)
const project = process.env.GOOGLE_CLOUD_PROJECT || 'project-0f08201b-82f4-4166-ac2';
const location = 'global';
const vertexAI = new VertexAI({
    project,
    location,
    apiEndpoint: 'aiplatform.googleapis.com'
});

const MODEL_NAME = `projects/${project}/locations/${location}/publishers/google/models/gemini-3-flash-preview`;

const responseSchema = {
    type: SchemaType.OBJECT,
    properties: {
        persona: {
            type: SchemaType.OBJECT,
            properties: {
                name: { type: SchemaType.STRING },
                trait: { type: SchemaType.STRING },
                vibe: { type: SchemaType.STRING },
            }
        },
        scenes: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    id: { type: SchemaType.NUMBER },
                    script: {
                        type: SchemaType.ARRAY,
                        items: {
                            type: SchemaType.OBJECT,
                            properties: {
                                type: { type: SchemaType.STRING, description: "acting or narration" },
                                text: { type: SchemaType.STRING },
                                visuals: { type: SchemaType.STRING, description: "Action visual: character pose, expression, and context." },
                                motion_vibe: { type: SchemaType.STRING, description: "Cinematic motion: slow_zoom, dramatic_push, shake, tilt, or pan." },
                                camera_work: { type: SchemaType.STRING, description: "Specific camera instruction (e.g. 'Tight on eyes', 'Low angle push')." },
                                part_duration: { type: SchemaType.NUMBER, description: "Duration in seconds for this specific action/dialogue." },
                                transition: { type: SchemaType.STRING, description: "Transition to next part (e.g. 'dissolve', 'jump_cut', 'blur_fade')." },
                            }
                        }
                    },
                    visuals: { type: SchemaType.STRING, description: "Detailed description for an image generator" },
                    camera: { type: SchemaType.STRING },
                    emotion: { type: SchemaType.STRING },
                    duration: { type: SchemaType.NUMBER }
                }
            }
        }
    }
};

interface Character {
    name: string;
    vibe: string;
    traits: string[];
}

export async function directStory(imageData: string[], userIntent: string, characters: Character[]) {
    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
        try {
            const generativeModel = vertexAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: {
                    responseMimeType: 'application/json',
                    responseSchema: responseSchema,
                    candidateCount: 1,
                },
            });

            // Optimize images: Limit to first 3 images and ensure they are clean base64
            const cleanImages = imageData.slice(0, 3).map(data => {
                const base64 = data.includes(',') ? data.split(',')[1] : data;
                return base64.trim();
            });

            const imageParts = cleanImages.map(data => ({
                inlineData: {
                    data,
                    mimeType: 'image/jpeg',
                },
            }));

            const prompt = `
          You are a world-class Creative Director specialized in "Multimodal Storytelling". 
          TASK: Orchestrate a 3-scene interleaved storyboard based on the cast and intent.
          
          CAST:
          ${characters.map(c => `- ${c.name}: ${c.vibe}`).join('\n')}
          
          INTENT: "${userIntent}"
          
          OUTPUT REQUIREMENTS (CREATIVE STORYTELLER MODE):
          - 3 high-impact scenes.
          - Each scene must have:
            1. script: Array of character-driven dialogues or actions. 
               Type: 'acting' ONLY (Format: "NAME: [text]"). DO NOT include 'narration'.
               Every part MUST be spoken by a character from the CAST.
               Each part MUST have:
               - 'visuals': Detailed action/pose (e.g. "John kneeling, hands trembling").
               - 'motion_vibe': Cinematic motion (e.g. "dramatic_zoom_in", "slow_pan_right", "handheld_shake").
               - 'camera_work': Specific framing (e.g. "Extreme close-up on hands").
               - 'part_duration': Precise timing in seconds (e.g. 3.5).
               - 'transition': Flow to next part (e.g. "dissolve", "jump_cut").
            2. visuals: Vivid atmosphere description for the overall scene background.
            3. camera/emotion/duration: Precise instructions.
        `;

            const request = {
                contents: [{ role: 'user', parts: [...imageParts, { text: prompt }] }],
            };

            const result = await generativeModel.generateContent(request);
            const response = result.response;
            const text = response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from Gemini");

            const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleaned);

        } catch (error: any) {
            attempts++;
            console.error(`Gemini 3 Attempt ${attempts} failed:`, error.message);

            if (attempts > maxRetries) {
                throw new Error(`Orchestration failed after ${maxRetries} retries: ${error.message}. Large images or complex scripts can cause timeouts locally.`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
    }
}
