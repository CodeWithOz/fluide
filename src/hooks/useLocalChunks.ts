import { useState, useEffect, useCallback } from 'react';
import type { Chunk, HistorySession, ThemeKey } from '../types';
import {
  FLUIDE_CUSTOM_CHUNKS_KEY,
  FLUIDE_HISTORY_KEY,
} from '../constants';

export type CustomChunksByTheme = Record<string, Chunk[]>;

function loadCustomChunks(): CustomChunksByTheme {
  try {
    const raw = localStorage.getItem(FLUIDE_CUSTOM_CHUNKS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCustomChunks(data: CustomChunksByTheme) {
  localStorage.setItem(FLUIDE_CUSTOM_CHUNKS_KEY, JSON.stringify(data));
}

function loadHistory(): HistorySession[] {
  try {
    const raw = localStorage.getItem(FLUIDE_HISTORY_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as HistorySession[];

    // Migrate legacy sessions without id field
    return sessions.map((session, index) => {
      if (!session.id) {
        // Generate deterministic ID from date + index for legacy sessions
        // Use date timestamp as base to ensure chronological ordering
        const dateTimestamp = new Date(session.date).getTime();
        const legacyId = `${dateTimestamp}-legacy-${index}`;
        return { ...session, id: legacyId };
      }
      return session;
    });
  } catch {
    return [];
  }
}

function saveHistory(data: HistorySession[]) {
  localStorage.setItem(FLUIDE_HISTORY_KEY, JSON.stringify(data));
}

export function useCustomChunks() {
  const [customChunks, setCustomChunks] = useState<CustomChunksByTheme>(loadCustomChunks);

  useEffect(() => {
    saveCustomChunks(customChunks);
  }, [customChunks]);

  const addChunk = useCallback(
    (theme: ThemeKey, chunk: Omit<Chunk, 'id' | 'isCustom'>) => {
      const id = `custom-${theme.replace(/\s/g, '-')}-${Date.now()}`;
      const newChunk: Chunk = { ...chunk, id, isCustom: true };
      setCustomChunks((prev) => ({
        ...prev,
        [theme]: [...(prev[theme] ?? []), newChunk],
      }));
    },
    []
  );

  const updateChunk = useCallback(
    (theme: ThemeKey, chunkId: string, updates: Partial<Pick<Chunk, 'text' | 'translation' | 'phonetic'>>) => {
      setCustomChunks((prev) => {
        const list = prev[theme] ?? [];
        const next = list.map((c) =>
          c.id === chunkId ? { ...c, ...updates } : c
        );
        return { ...prev, [theme]: next };
      });
    },
    []
  );

  const deleteChunk = useCallback((theme: ThemeKey, chunkId: string) => {
    setCustomChunks((prev) => {
      const list = (prev[theme] ?? []).filter((c) => c.id !== chunkId);
      if (list.length === 0) {
        const { [theme]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [theme]: list };
    });
  }, []);

  const moveChunkToTheme = useCallback(
    (fromTheme: ThemeKey, chunkId: string, toTheme: ThemeKey) => {
      setCustomChunks((prev) => {
        const fromList = prev[fromTheme] ?? [];
        const chunk = fromList.find((c) => c.id === chunkId);
        if (!chunk) return prev;
        const newFrom = fromList.filter((c) => c.id !== chunkId);
        const newTo = [...(prev[toTheme] ?? []), { ...chunk }];
        const next = { ...prev, [fromTheme]: newFrom, [toTheme]: newTo };
        if (newFrom.length === 0) {
          const { [fromTheme]: __, ...rest } = next;
          return rest;
        }
        return next;
      });
    },
    []
  );

  return {
    customChunks,
    addChunk,
    updateChunk,
    deleteChunk,
    moveChunkToTheme,
  };
}

export function useHistory() {
  const [history, setHistory] = useState<HistorySession[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addSession = useCallback((session: HistorySession) => {
    setHistory((prev) => {
      const next = [session, ...prev];
      return next.sort((a, b) => {
        // Sort by date descending, then by id descending (timestamp)
        if (a.date !== b.date) {
          return b.date > a.date ? 1 : -1;
        }
        // Extract numeric timestamp from id (handles both "12345" and "12345-legacy-0" formats)
        const getTimestamp = (id: string) => {
          const num = parseInt(id.split('-')[0]);
          return isNaN(num) ? 0 : num;
        };
        return getTimestamp(b.id) - getTimestamp(a.id);
      });
    });
  }, []);

  return { history, addSession };
}
