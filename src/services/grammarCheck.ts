import { GoogleGenAI, Type } from '@google/genai';
import type { FeedbackResponse } from '../types';
import { getApiKeyOrEnv } from './apiKeyService';

function getClient() {
  const apiKey = getApiKeyOrEnv('gemini');
  if (!apiKey) throw new Error('API key required for grammar check');
  return new GoogleGenAI({ apiKey });
}

export async function checkSentenceIntegration(
  chunk: string,
  sentence: string
): Promise<FeedbackResponse> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `The student is learning the French chunk: "${chunk}".
They wrote this sentence using it: "${sentence}".
Check if the grammar is correct and if the chunk is used naturally.
If incorrect, provide the correction.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isCorrect: { type: Type.BOOLEAN },
          correction: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['isCorrect', 'explanation'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from AI');
  return JSON.parse(text) as FeedbackResponse;
}
