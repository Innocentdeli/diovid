"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from "@/lib/ai-stability";

const MODEL_NAME = 'gemini-embedding-2-preview';
const DEFAULT_LOCATION = 'us-central1';

/**
 * Generates an embedding for a given text or multimodal input using Gemini Embedding 2.
 * This model outputs 3072-dimensional vectors by default.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
    const location = process.env.GOOGLE_CLOUD_LOCATION || DEFAULT_LOCATION;

    const vertexAI = new VertexAI({ project, location });
    
    // Note: Gemini Embedding 2 might require specific preview endpoint/method 
    // depending on the exact SDK version. We'll use the generative model interface 
    // as it's part of the Gemini family.
    const model = vertexAI.preview.getGenerativeModel({ model: MODEL_NAME });

    return await reliableRequest(async () => {
        const result = await (model as any).embedContent({
            content: {
                role: 'user',
                parts: [{ text }]
            }
        });
        
        const embedding = result.embedding;
        if (!embedding || !embedding.values) {
            throw new Error("Failed to generate embedding: No values returned");
        }
        
        return embedding.values;
    });
}

/**
 * Calculates the cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
