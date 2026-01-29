export interface Chunk {
  id: string;
  text: string;
  translation: string;
  phonetic?: string;
  /** true if from user (custom); false if from WEEKLY_PLAN */
  isCustom?: boolean;
}

export interface FeedbackResponse {
  isCorrect: boolean;
  correction?: string;
  explanation: string;
}

export type PracticeStep =
  | 'HOME'
  | 'SELECT'
  | 'DRILL'
  | 'INTEGRATE'
  | 'MONOLOGUE'
  | 'COMPLETE';

export interface StepInfo {
  id: number;
  title: string;
  time: string;
  targetMinutes: number;
}

export interface HistorySession {
  date: string;
  theme: string;
  selectedChunks: Chunk[];
  sentences: Record<string, string>;
  monologuePrompt: string;
  monologueText?: string;
  timeAboveTargetMinutes?: number;
}

export type ThemeKey =
  | 'Opinions'
  | 'Desires & Intentions'
  | 'Obligations'
  | 'Difficulties'
  | 'Interaction'
  | 'Active Listening'
  | 'Weekly Review';
