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

The goal is to find CONVERSATIONAL CHUNKS — groups of words (typically 2-5 words) that are spoken together fluidly in real French speech. These chunks should ideally contain a subject and verb, and often a preposition, forming a reusable sentence starter or transition that leads into what the speaker wants to say.

Good examples of what to extract:
- "Je pense que" (I think that) — subject + verb + conjunction, leads into an opinion
- "J'ai envie de" (I feel like) — subject + verb + preposition, leads into a desire
- "Il faut que" (It's necessary that) — impersonal subject + verb + conjunction
- "Je n'arrive pas à" (I can't manage to) — subject + negated verb + preposition
- "Ça dépend de" (It depends on) — subject + verb + preposition
- "Il me semble que" (It seems to me that) — sentence starter with verb

Do NOT extract:
- Single words (e.g. "cependant", "effectivement")
- Simple noun phrases without a verb (e.g. "la situation", "mon avis")
- Complete long sentences — extract only the reusable chunk/starter portion

Every extracted chunk MUST contain at least a verb. Prioritize chunks that serve as sentence starters or conversational transitions — the kind of word groups a learner would drill to speak fluidly without hesitation.

Categorize each chunk into one of these themes:
${THEMES_DESCRIPTION}

For each chunk, provide:
- "text": the French chunk exactly as it should be practiced (2-5 words, must include a verb)
- "translation": a natural English translation
- "phonetic": an approximate pronunciation guide for English speakers (use simple phonetic spelling, e.g. "zhuh pawns kuh")
- "theme": one of "Opinions", "Desires & Intentions", "Obligations", "Difficulties", "Interaction"

Extract as many relevant chunks as you can find. Prefer chunks that are reusable in many contexts rather than highly specific to the text.

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
