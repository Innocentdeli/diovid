"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from "@/lib/ai-stability";

const MODEL_NAME = 'gemini-2.0-flash-001';
const LOCATION = 'us-central1';

interface Character {
    name: string;
    vibe: string;
    traits: string[];
}

export async function directStory(imageData: string[], userIntent: string, characters: Character[]) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const vertexAI = new VertexAI({ project, location: LOCATION });
    const model = vertexAI.preview.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
            responseMimeType: 'application/json',
        }
    });

    if (!userIntent?.trim()) {
        throw new Error("Script content is required for orchestration");
    }

    if (characters.length === 0) {
        throw new Error("At least one character is required");
    }

    // Optimize images for Vertex AI (clean base64, no whitespace)
    const imageParts = imageData.slice(0, 3).map(data => {
        let base64 = data;
        if (base64.includes(',')) {
            base64 = base64.split(',')[1];
        }
        return {
            inlineData: {
                data: base64.replace(/\s+/g, ''),
                mimeType: 'image/jpeg',
            },
        };
    });

    const prompt = `
You are an AI VIDEO DIRECTOR. Your goal is to convert the script into a production plan.
OUTPUT ONLY VALID JSON. THE ROOT MUST BE AN OBJECT WITH A "scenes" ARRAY.

CHARACTER CAST:
${characters.map(c => `- ${c.name}: ${c.vibe}`).join('\n')}

USER SCRIPT:
"${userIntent}"

SCENE SCHEMA:
{
  "scenes": [
    {
      "scene_id": number,
      "duration_seconds": number,
      "background_environment": string,
      "camera_shot": "close_up" | "medium" | "medium_wide",
      "character_emotion": "neutral" | "confident" | "friendly" | "serious" | "excited" | "thoughtful" | "concerned",
      "dialogue_text": string,
      "animation_gesture": "hand_wave" | "open_palms" | "point_forward" | "light_hand_emphasis" | "hands_clasped" | "arms_relaxed" | "head_nod" | "head_shake",
      "animation_head_motion": "none" | "nod" | "shake" | "tilt"
    }
  ]
}
`;

    console.log(`[ORCHESTRATOR] Planning production via Vertex AI (${MODEL_NAME})...`);

    try {
        const responseData = await reliableRequest(async () => {
            const result = await model.generateContent({
                contents: [{
                    role: 'user',
                    parts: [...imageParts, { text: prompt }]
                }]
            });
            const response = await result.response;
            return response;
        });

        const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("Empty response from Vertex AI");

        // Clean up potential markdown formatting
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
        if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);

        const parsed = JSON.parse(cleanText.trim());
        
        // Defensive normalization for the frontend
        if (parsed.scenes && Array.isArray(parsed.scenes)) {
            parsed.scenes = parsed.scenes.map((scene: any) => ({
                scene_id: scene.scene_id || 0,
                duration_seconds: scene.duration_seconds || 5,
                background_environment: scene.background_environment || 'cinematic studio',
                background_lighting: 'cinematic',
                camera_shot: scene.camera_shot || 'medium',
                camera_movement: 'static',
                character_pose: 'standing',
                character_emotion: scene.character_emotion || 'neutral',
                character_eye_focus: 'camera',
                dialogue_text: scene.dialogue_text || '',
                dialogue_voice_style: 'professional',
                dialogue_lip_sync: true,
                transition_out: 'cut',
                animation_contract: {
                    face_blink_rate: 'medium',
                    face_mouth_activity: 'speech',
                    head_motion_type: scene.animation_head_motion || 'none',
                    head_intensity: 0.5,
                    gesture_name: scene.animation_gesture || 'arms_relaxed',
                    gesture_start_time_seconds: 0,
                    gesture_end_time_seconds: 0,
                }
            }));
        } else {
            throw new Error("Orchestration failed: No scenes generated");
        }

        return parsed;

    } catch (error: any) {
        const safeMessage = error?.message || String(error);
        console.error(`[ORCHESTRATOR] CRITICAL FAILURE:`, safeMessage);
        throw new Error(`Orchestration Failed: ${safeMessage}`);
    }
}
