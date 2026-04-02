"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from '@/lib/ai-stability';

const MODEL_NAME = 'gemini-1.5-flash-001';
const LOCATION = 'us-central1';

export interface PersonaProfile {
    suggestedVibe: string;
    suggestedTraits: string[];
    frameAnalysis: {
        framing: 'chest_up' | 'full_body' | 'face_close_up' | 'medium';
        estimatedAge?: string;
        dominantEmotion: string;
        lightingStyle: string;
    };
    presentationStyle: string;
    confidence: number;
}

/**
 * Analyzes a character photo using Gemini Vision on Vertex AI and returns
 * AI-suggested vibe, traits, and framing information.
 */
export async function extractPersona(
    imageBase64: string,
    existingName?: string
): Promise<PersonaProfile | { error: string }> {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const vertexAI = new VertexAI({ project, location: LOCATION });
    const model = vertexAI.preview.getGenerativeModel({ model: MODEL_NAME });

    try {
        const base64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const prompt = `You are an AI character analyst for a video production platform.

Analyze this person's photo and generate a professional character profile.
${existingName ? `This character's name is: ${existingName}` : ''}

Return ONLY valid JSON — no markdown, no extra text.

{
  "suggestedVibe": "A 5-10 word description of their presence and energy (e.g. 'Confident tech leader with a warm approachable energy')",
  "suggestedTraits": ["trait1", "trait2", "trait3", "trait4"],
  "frameAnalysis": {
    "framing": "chest_up | full_body | face_close_up | medium",
    "estimatedAge": "25-35",
    "dominantEmotion": "neutral | confident | friendly | serious | excited | thoughtful | concerned",
    "lightingStyle": "soft | bright | dramatic | natural"
  },
  "presentationStyle": "professional | casual | creative | authoritative | warm",
  "confidence": 0.85
}

Rules:
- suggestedVibe must be specific and useful for directing an AI actor
- suggestedTraits: exactly 4 single-word or short traits (e.g. "articulate", "trustworthy", "energetic", "empathetic")
- Be positive, professional, and production-focused
- confidence is a float 0.0-1.0 representing how clearly you can read the character from the photo`;

        const resultText = await reliableRequest(async () => {
            const result = await model.generateContent({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                inlineData: {
                                    data: base64.trim().replace(/\s+/g, ''),
                                    mimeType: 'image/jpeg',
                                },
                            },
                            { text: prompt },
                        ],
                    },
                ]
            });
            const response = await result.response;
            return response.candidates?.[0]?.content?.parts?.[0]?.text;
        });

        if (!resultText) return { error: 'Empty response from Gemini' };

        // Clean up potential markdown formatting
        let cleanText = resultText.trim();
        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.substring(7);
        }
        if (cleanText.endsWith('```')) {
            cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        
        const parsed: PersonaProfile = JSON.parse(cleanText.trim());

        // Validate required fields
        if (!parsed.suggestedVibe || !Array.isArray(parsed.suggestedTraits)) {
            return { error: 'Invalid persona profile structure returned' };
        }

        return parsed;
    } catch (error: any) {
        console.error('[PERSONA EXTRACTION] Error:', error.message);
        return { error: `Persona extraction failed: ${error.message}` };
    }
}
