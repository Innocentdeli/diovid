"use server";

import { VertexAI } from '@google-cloud/vertexai';

const project = process.env.GOOGLE_CLOUD_PROJECT || 'project-0f08201b-82f4-4166-ac2';
const location = 'global';
const vertexAI = new VertexAI({
    project,
    location,
    apiEndpoint: 'aiplatform.googleapis.com'
});

const MODEL_NAME = `projects/${project}/locations/${location}/publishers/google/models/gemini-3-flash-preview`;

interface WriterContext {
    scriptSoFar: string;
    selectedText?: string;
    characters: { name: string; vibe: string }[];
    instruction: 'rewrite' | 'continue' | 'improve' | 'check' | 'scriptify' | 'global_scriptify';
    customPrompt?: string;
    format?: 'story' | 'script';
}


export async function aiCoWrite(context: WriterContext) {
    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
        try {
            console.log(`[AI CO-WRITER] Processing ${context.instruction.toUpperCase()} (Attempt ${attempts + 1})...`);

            const generativeModel = vertexAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: {
                    candidateCount: 1,
                },
            });

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

            const request = {
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
            };

            const result = await generativeModel.generateContent(request);
            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) throw new Error("Empty response from Gemini 3 Co-Writer");

            console.log(`[AI CO-WRITER] Successfully generated ${context.instruction}.`);
            return text.trim();

        } catch (error: any) {
            attempts++;
            console.error(`[AI CO-WRITER ATTEMPT ${attempts}] failed:`, error.message);

            if (attempts > maxRetries) {
                throw new Error(`AI Co-Write failed after ${maxRetries} retries: ${error.message}. Check Vertex AI Global Endpoint status.`);
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1500 * attempts));
        }
    }
}
