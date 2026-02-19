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
        video_meta: {
            type: SchemaType.OBJECT,
            properties: {
                aspect_ratio: { type: SchemaType.STRING, description: "16:9 | 9:16 | 1:1" },
                style: { type: SchemaType.STRING, description: "professional | cinematic | social_media" },
                total_duration_seconds: { type: SchemaType.NUMBER },
            }
        },
        character_profile: {
            type: SchemaType.OBJECT,
            properties: {
                source: { type: SchemaType.STRING },
                framing: { type: SchemaType.STRING, description: "chest_up" },
                default_pose: { type: SchemaType.STRING, description: "standing | seated" },
                idle_motion: { type: SchemaType.BOOLEAN },
            }
        },
        scenes: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    scene_id: { type: SchemaType.NUMBER },
                    duration_seconds: { type: SchemaType.NUMBER },
                    background: {
                        type: SchemaType.OBJECT,
                        properties: {
                            environment: { type: SchemaType.STRING, description: "descriptive but realistic setting" },
                            lighting: { type: SchemaType.STRING, description: "soft | bright | dramatic" },
                        }
                    },
                    camera: {
                        type: SchemaType.OBJECT,
                        properties: {
                            shot: { type: SchemaType.STRING, description: "close_up | medium | medium_wide" },
                            movement: { type: SchemaType.STRING, description: "static | slow_zoom_in | slow_zoom_out | slight_pan_left | slight_pan_right" },
                        }
                    },
                    character: {
                        type: SchemaType.OBJECT,
                        properties: {
                            pose: { type: SchemaType.STRING, description: "standing | seated" },
                            emotion: { type: SchemaType.STRING, description: "neutral | confident | friendly | serious | excited | thoughtful | concerned" },
                            eye_focus: { type: SchemaType.STRING, description: "camera | slight_off_camera" },
                        }
                    },
                    animation_contract: {
                        type: SchemaType.OBJECT,
                        properties: {
                            face: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    blink_rate: { type: SchemaType.STRING, description: "low | medium | high" },
                                    mouth_activity: { type: SchemaType.STRING, description: "speech | idle" },
                                }
                            },
                            head: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    motion_type: { type: SchemaType.STRING, description: "none | nod | shake | tilt" },
                                    intensity: { type: SchemaType.NUMBER, description: "0.0 to 1.0" },
                                }
                            },
                            gesture: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    gesture_name: { type: SchemaType.STRING, description: "hand_wave | open_palms | point_forward | light_hand_emphasis | hands_clasped | arms_relaxed | head_nod | head_shake | null" },
                                    start_time_seconds: { type: SchemaType.NUMBER },
                                    end_time_seconds: { type: SchemaType.NUMBER },
                                }
                            }
                        }
                    },
                    dialogue: {
                        type: SchemaType.OBJECT,
                        properties: {
                            text: { type: SchemaType.STRING },
                            voice_style: { type: SchemaType.STRING, description: "warm | professional | energetic | calm" },
                            lip_sync: { type: SchemaType.BOOLEAN },
                        }
                    },
                    transition_out: { type: SchemaType.STRING, description: "cut | fade | crossfade" },
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
You are an AI VIDEO DIRECTOR, CHARACTER CHOREOGRAPHER, and PRODUCTION ORCHESTRATOR.

Your job is NOT to generate images, audio, or video files.
Your job is to OUTPUT A COMPLETE, STRICT, MACHINE-READABLE VIDEO PRODUCTION PLAN
that a rendering engine can execute to create a human-like acted video.

You MUST assume this is a REAL PRODUCT, not a demo.

CHARACTER CAST:
${characters.map(c => `- ${c.name}: ${c.vibe}`).join('\n')}

USER SCRIPT TO CONVERT:
"${userIntent}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL ASSUMPTIONS (NON-NEGOTIABLE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. The user has uploaded one full-body photo and one half-body or face photo.
2. These photos will be converted into ONE rigged digital human character with:
   - Facial mesh, mouth blend shapes, eye tracking, head rotation, basic hand gestures (upper body only)
3. The character CAN: lip-sync accurately, blink naturally, move head subtly, perform limited realistic gestures.
4. The character CANNOT: walk, run, interact with objects, perform exaggerated or cartoon motion, teleport or violate physics.
5. Default realism constraints: chest-up framing ONLY, subtle motion only, professional presenter style, no uncanny or exaggerated behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCRIPT INTERPRETATION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Split the script into logical SCENES (aim for 3–5 scenes).
- Each scene must feel visually distinct from the previous.
- Every spoken sentence must trigger: an emotion, a gesture OR head movement, a camera decision.
- Avoid static visuals longer than 5–8 seconds.
- Favor realism over spectacle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHARACTER EMOTION SET (ONLY THESE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
neutral | confident | friendly | serious | excited | thoughtful | concerned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GESTURE SET (ONLY THESE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
hand_wave | open_palms | point_forward | light_hand_emphasis | hands_clasped | arms_relaxed | head_nod | head_shake

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAMERA RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Shots: close_up | medium | medium_wide
Movements: static | slow_zoom_in | slow_zoom_out | slight_pan_left | slight_pan_right
Transitions: cut | fade | crossfade

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANIMATION CONTRACT (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every scene MUST include an explicit animation_contract:
- face.blink_rate: low | medium | high
- face.mouth_activity: speech | idle
- head.motion_type: none | nod | shake | tilt
- head.intensity: 0.0 – 1.0
- gesture.gesture_name: one allowed gesture (or null)
- gesture.start_time_seconds: number
- gesture.end_time_seconds: number

Lip-sync rule: mouth moves ONLY during speech. Subtle idle mouth motion between phrases.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUALITY ENFORCEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- No two consecutive scenes may be visually identical.
- No scene may be completely static.
- Acting must feel human, restrained, and believable.
- This must feel like a real presenter, not a slideshow.
- Prioritize clarity, realism, and trust.

OUTPUT: ONLY valid JSON matching the required schema. No markdown. No explanations. No comments. No text outside JSON.
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
