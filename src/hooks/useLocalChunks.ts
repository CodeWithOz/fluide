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
    return JSON.parse(raw);
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
      const existing = prev.findIndex((h) => h.date === session.date);
      const next =
        existing >= 0
          ? prev.map((h, i) => (i === existing ? session : h))
          : [session, ...prev];
      return next.sort((a, b) => (b.date > a.date ? 1 : -1));
    });
  }, []);

  return { history, addSession };
}
