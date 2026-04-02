"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { reliableRequest } from '@/lib/ai-stability';

const MODEL_NAME = 'gemini-1.5-flash-001';
const LOCATION = 'us-central1';

export interface Subtitle {
  id: string;
  startTime: number; // milliseconds
  endTime: number;   // milliseconds
  text: string;
  speaker?: string;
  confidence?: number;
}

interface TranscribeParams {
  audioBase64: string;      // base64-encoded audio data (WAV or MP3)
  mimeType?: string;        // e.g. 'audio/wav', 'audio/mp3'
  language?: string;        // BCP-47 language code, e.g. 'en-US'
  enableSpeakerDiarization?: boolean;
}

export async function transcribeAudio({
  audioBase64,
  mimeType = 'audio/wav',
  language = 'en-US',
  enableSpeakerDiarization = false,
}: TranscribeParams): Promise<Subtitle[] | { error: string }> {
  const project = process.env.GOOGLE_CLOUD_PROJECT || 'diovid-project';
  const vertexAI = new VertexAI({ project, location: LOCATION });
  const model = vertexAI.preview.getGenerativeModel({ model: MODEL_NAME });

  try {
    if (!audioBase64?.trim()) {
      return { error: 'No audio data provided' };
    }

    const base64 = audioBase64.includes(',') ? audioBase64.split(',')[1] : audioBase64;

    const prompt = `You are a professional transcription service.
    
Transcribe this audio into a list of subtitle segments. Return ONLY valid JSON — no markdown, no commentary.

Requirements:
- Language: ${language}
- ${enableSpeakerDiarization ? 'Identify speakers as "Speaker 1", "Speaker 2", etc.' : 'Single speaker, no speaker labels needed.'}
- Break into natural sentence-length segments (3-8 seconds each)
- Provide accurate word-level timing

Return this exact JSON structure:
{
  "subtitles": [
    {
      "startTime": 0,
      "endTime": 3200,
      "text": "Transcribed text here",
      "speaker": "Speaker 1",
      "confidence": 0.95
    }
  ]
}

startTime and endTime are in MILLISECONDS.`;

    const resultText = await reliableRequest(async () => {
      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: base64.trim().replace(/\s+/g, ''),
                  mimeType,
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

    if (!resultText) {
      return { error: 'Empty transcription response from Gemini' };
    }

    // Clean up potential markdown formatting
    let cleanText = resultText.trim();
    if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
    }
    if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const parsed = JSON.parse(cleanText.trim());

    if (!Array.isArray(parsed.subtitles)) {
      return { error: 'Unexpected response structure from Gemini' };
    }

    return parsed.subtitles.map((s: any, idx: number) => ({
      id: `sub-${Date.now()}-${idx}`,
      startTime: Number(s.startTime) || 0,
      endTime: Number(s.endTime) || 0,
      text: String(s.text || '').trim(),
      speaker: s.speaker || undefined,
      confidence: s.confidence || undefined,
    })) as Subtitle[];

  } catch (error: any) {
    const safeMessage = error?.message || String(error);
    console.error('[SPEECH-TO-TEXT] Transcription error:', safeMessage);
    return { error: `Transcription failed: ${safeMessage}` };
  }
}
