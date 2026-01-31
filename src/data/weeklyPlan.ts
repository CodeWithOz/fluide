import type { Chunk, ThemeKey } from '../types';

export interface DayPlan {
  theme: string;
  description: string;
  themeKey: ThemeKey;
  chunks?: Chunk[];
  isSpecial?: boolean;
  task?: string;
}

export const WEEKLY_PLAN: Record<string, DayPlan> = {
  Monday: {
    theme: 'Opinions',
    description: 'Learn to give your opinion without hesitation.',
    themeKey: 'Opinions',
    chunks: [
      { id: 'm1', text: "À mon avis", translation: "In my opinion" },
      { id: 'm2', text: "Je pense que", translation: "I think that" },
      { id: 'm3', text: "J'ai l'impression que", translation: "I get the feeling that" },
      { id: 'm4', text: "Selon moi", translation: "According to me" },
      { id: 'm5', text: "Je trouve que", translation: "I find that" },
    ],
  },
  Tuesday: {
    theme: 'Desires & Intentions',
    description: 'Express what you want or plan to do.',
    themeKey: 'Desires & Intentions',
    chunks: [
      { id: 't1', text: "J'ai envie de", translation: "I feel like / I want to" },
      { id: 't2', text: "J'aimerais bien", translation: "I would really like" },
      { id: 't3', text: "J'ai décidé de", translation: "I decided to" },
      { id: 't4', text: "J'essaie de", translation: "I am trying to" },
      { id: 't5', text: "Je compte", translation: "I plan to / I intend to" },
    ],
  },
  Wednesday: {
    theme: 'Obligations',
    description: 'Express necessity and importance.',
    themeKey: 'Obligations',
    chunks: [
      { id: 'w1', text: "Il faut que", translation: "It is necessary that" },
      { id: 'w2', text: "Je dois absolument", translation: "I absolutely must" },
      { id: 'w3', text: "C'est important de", translation: "It is important to" },
      { id: 'w4', text: "Il est nécessaire de", translation: "It is necessary to" },
      { id: 'w5', text: "J'ai besoin de", translation: "I need to" },
    ],
  },
  Thursday: {
    theme: 'Difficulties',
    description: 'Explain what is hard or complicated.',
    themeKey: 'Difficulties',
    chunks: [
      { id: 'th1', text: "J'ai du mal à", translation: "I have a hard time" },
      { id: 'th2', text: "Je n'arrive pas à", translation: "I can't seem to / I can't manage to" },
      { id: 'th3', text: "C'est compliqué de", translation: "It's complicated to" },
      { id: 'th4', text: "Je suis incapable de", translation: "I am unable to" },
      { id: 'th5', text: "Ce n'est pas facile de", translation: "It's not easy to" },
    ],
  },
  Friday: {
    theme: 'Interaction',
    description: 'Questions to keep a conversation going.',
    themeKey: 'Interaction',
    chunks: [
      { id: 'f1', text: "Qu'en penses-tu ?", translation: "What do you think about it?" },
      { id: 'f2', text: "Tu es d'accord ?", translation: "Do you agree?" },
      { id: 'f3', text: "C'est vrai que", translation: "It's true that" },
      { id: 'f4', text: "Tu vois ce que je veux dire ?", translation: "Do you see what I mean?" },
      { id: 'f5', text: "Pas du tout", translation: "Not at all" },
    ],
  },
  Saturday: {
    theme: 'Active Listening',
    description: 'Identify chunks in real content.',
    themeKey: 'Active Listening',
    isSpecial: true,
    task: 'Watch a 5-minute video in French. Write down 3 chunks you recognize.',
  },
  Sunday: {
    theme: 'Weekly Review',
    description: 'Consolidate everything from the week.',
    themeKey: 'Weekly Review',
    isSpecial: true,
    task: "Pick one chunk from each day and tell a short story.",
  },
};

/** Day name -> theme key for custom chunks. Saturday/Sunday use multiple themes for "mix". */
export function getThemeKeyForDay(dayName: string): ThemeKey | ThemeKey[] {
  const plan = WEEKLY_PLAN[dayName];
  if (!plan) return 'Opinions';
  if (dayName === 'Saturday' || dayName === 'Sunday') {
    return ['Opinions', 'Desires & Intentions', 'Obligations', 'Difficulties', 'Interaction'];
  }
  return plan.themeKey as ThemeKey;
}

export function getTodayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

/** Chunks for selection: from WEEKLY_PLAN for the day, plus custom chunks for that theme (or themes for weekend). */
export function getChunksForDay(
  dayName: string,
  customChunksByTheme: Record<string, Chunk[]>
): Chunk[] {
  const plan = WEEKLY_PLAN[dayName];
  if (!plan) return [];

  if (plan.isSpecial && (dayName === 'Saturday' || dayName === 'Sunday')) {
    const themeKeys = getThemeKeyForDay(dayName) as ThemeKey[];
    const all: Chunk[] = [];
    for (const key of themeKeys) {
      const dayPlan = Object.values(WEEKLY_PLAN).find((p) => p.themeKey === key && p.chunks);
      if (dayPlan?.chunks) all.push(...dayPlan.chunks);
      const custom = customChunksByTheme[key] ?? [];
      all.push(...custom);
    }
    return all;
  }

  const base = (plan.chunks ?? []).map((c) => ({ ...c, isCustom: false }));
  const themeKey = plan.themeKey as string;
  const custom = (customChunksByTheme[themeKey] ?? []).map((c) => ({ ...c, isCustom: true }));
  return [...base, ...custom];
}
