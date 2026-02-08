import { GoogleGenAI, Type } from '@google/genai';
import { getApiKeyOrEnv } from './apiKeyService';
import type { ThemeKey } from '../types';

export interface ExtractedPhrase {
  id: string;
  text: string;
  translation: string;
  phonetic: string;
  theme: ThemeKey;
}

function getClient() {
  const apiKey = getApiKeyOrEnv('gemini');
  if (!apiKey) throw new Error('API key required for phrase extraction');
  return new GoogleGenAI({ apiKey });
}

const THEMES_DESCRIPTION = `
- "Opinions": Phrases for expressing opinions, views, and beliefs (e.g. "À mon avis", "Je pense que", "Il me semble que")
- "Desires & Intentions": Phrases for expressing wants, wishes, plans, and intentions (e.g. "J'ai envie de", "J'aimerais bien", "Je compte")
- "Obligations": Phrases for expressing necessity, duty, and obligation (e.g. "Il faut que", "Je dois", "On est obligé de")
- "Difficulties": Phrases for expressing difficulty, struggle, and challenges (e.g. "J'ai du mal à", "Je n'arrive pas à", "C'est difficile de")
- "Interaction": Phrases for interacting in conversation — asking questions, agreeing, disagreeing, reacting (e.g. "Qu'en penses-tu?", "Tu es d'accord?", "Ça dépend")
`.trim();

export async function extractPhrases(frenchText: string): Promise<ExtractedPhrase[]> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: `You are a French language teaching assistant. Analyze the following French text and extract useful phrases/expressions/chunks that a French learner should practice.

Focus on extracting:
- Idiomatic expressions and set phrases
- Useful conversational chunks (2-5 words typically)
- Common collocations and verb phrases
- Discourse markers and connectors
- Expressions that fit naturally into spoken French

Categorize each phrase into one of these themes:
${THEMES_DESCRIPTION}

For each phrase, provide:
- "text": the French phrase exactly as it should be practiced
- "translation": a natural English translation
- "phonetic": an approximate pronunciation guide for English speakers (use simple phonetic spelling, e.g. "zhuh pawns kuh")
- "theme": one of "Opinions", "Desires & Intentions", "Obligations", "Difficulties", "Interaction"

Extract as many relevant phrases as you can find. Prefer phrases that are reusable in many contexts rather than highly specific vocabulary. Do not include single words unless they are particularly useful discourse markers.

French text to analyze:
"""
${frenchText}
"""`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          phrases: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                translation: { type: Type.STRING },
                phonetic: { type: Type.STRING },
                theme: { type: Type.STRING },
              },
              required: ['text', 'translation', 'phonetic', 'theme'],
            },
          },
        },
        required: ['phrases'],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error('No response from AI');

  const parsed = JSON.parse(text) as {
    phrases: { text: string; translation: string; phonetic: string; theme: string }[];
  };

  const validThemes = new Set<string>([
    'Opinions',
    'Desires & Intentions',
    'Obligations',
    'Difficulties',
    'Interaction',
  ]);

  return parsed.phrases
    .filter((p) => validThemes.has(p.theme))
    .map((p) => ({
      id: `extract-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: p.text,
      translation: p.translation,
      phonetic: p.phonetic,
      theme: p.theme as ThemeKey,
    }));
}
