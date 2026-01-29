import type { StepInfo } from './types';

export const STEPS_INFO: readonly StepInfo[] = [
  { id: 1, title: 'Selection', time: '2 min', targetMinutes: 2 },
  { id: 2, title: 'The Drill', time: '3 min', targetMinutes: 3 },
  { id: 3, title: 'Integration', time: '5 min', targetMinutes: 5 },
  { id: 4, title: 'Monologue', time: '2-5 min', targetMinutes: 5 },
];

export const DRILL_TIMER_SECONDS = 30;
export const MONOLOGUE_TIMER_SECONDS = 60;

export const FLUIDE_CUSTOM_CHUNKS_KEY = 'fluideCustomChunks';
export const FLUIDE_HISTORY_KEY = 'fluideHistory';
