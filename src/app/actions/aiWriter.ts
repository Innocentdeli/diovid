"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from '@/lib/ai-stability';

const MODEL_NAME = 'gemini-2.0-flash-001';
const LOCATION = 'us-central1';

interface WriterContext {
    scriptSoFar: string;
    selectedText?: string;
    characters: { name: string; vibe: string }[];
    instruction: 'rewrite' | 'continue' | 'improve' | 'check' | 'scriptify' | 'global_scriptify';
    customPrompt?: string;
    format?: 'story' | 'script';
}

export async function aiCoWrite(context: WriterContext) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const vertexAI = new VertexAI({ project, location: LOCATION });
    const model = vertexAI.preview.getGenerativeModel({ model: MODEL_NAME });

    try {
        console.log(`[AI CO-WRITER] Processing ${context.instruction.toUpperCase()} via ${MODEL_NAME} (Vertex AI)...`);

        const prompt = `
          You are an expert Script Doctor and Creative Director for the Diovid production suite.
          
          TASK: ${context.instruction.toUpperCase()}
          
          PRODUCTION CONTEXT:
          - CAST: ${context.characters.map(c => `${c.name} (${c.vibe})`).join(', ')}
          - DRAFT SO FAR: "${context.scriptSoFar}"
          - SELECTED TEXT: "${context.selectedText || 'None'}"
          
          ${context.customPrompt ? `DIRECTOR'S NOTE: ${context.customPrompt}` : ''}
          
      REQUIREMENTS:
      - Maintain the established character voices and tone.
      ${context.instruction === 'continue' ? `
      - MATCH THE TARGET FORMAT: The user is writing a ${context.format === 'story' ? 'NARRATIVE STORYLINE' : 'PROFESSIONAL SCRIPT'}.
      - If format is 'story', continue with narrative prose.
      - If format is 'script', continue with "NAME: [dialogue]" lines.
      - DO NOT transform narrative into a script. Simply extend the story beat naturally.
      - PROVIDE at least 2-3 substantive sentences or lines of dialogue.` : `
      - Follow "Full Live Acting" rules: Format as "NAME: [dialogue and internal performance labels]".
      ${(context.instruction === 'scriptify' || context.instruction === 'global_scriptify') ? '- TRANSFORM the provided summary, narration, or notes into a full, professional acting script.' : ''}
      `}
      - Return ONLY the new text. No meta-commentary, intros, or repetitions of the prompt.
      - DO NOT return an empty response. If unsure, describe the immediate next physical action or line of dialogue.
         `;

        const resultText = await reliableRequest(async () => {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            });
            const response = await result.response;
            return response.candidates?.[0]?.content?.parts?.[0]?.text;
        });

        if (!resultText) throw new Error("Empty response from AI Co-Writer");

        console.log(`[AI CO-WRITER] Successfully generated ${context.instruction}.`);
        return resultText.trim();

    } catch (error: any) {
        const safeMessage = error?.message || String(error);
        console.error(`[AI CO-WRITER] CRITICAL FAILURE:`, safeMessage);
        throw new Error(`AI Co-Writer Failed: ${safeMessage}`);
    }
}
