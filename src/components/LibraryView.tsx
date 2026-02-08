import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { WEEKLY_PLAN } from '../data/weeklyPlan';
import type { Chunk, ThemeKey } from '../types';

const THEME_OPTIONS: ThemeKey[] = [
  'Opinions',
  'Desires & Intentions',
  'Obligations',
  'Difficulties',
  'Interaction',
];

export function LibraryView({
  customChunks,
  updateChunk,
  deleteChunk,
  editingChunkId,
  editingTheme,
  setEditingChunkId,
  setEditingTheme,
  editForm,
  setEditForm,
  addChunk,
  onBulkAdd,
}: {
  customChunks: Record<string, Chunk[]>;
  updateChunk: (theme: ThemeKey, id: string, u: Partial<Chunk>) => void;
  deleteChunk: (theme: ThemeKey, id: string) => void;
  editingChunkId: string | null;
  editingTheme: ThemeKey | null;
  setEditingChunkId: (id: string | null) => void;
  setEditingTheme: (t: ThemeKey | null) => void;
  editForm: { text: string; translation: string; phonetic: string };
  setEditForm: (f: { text: string; translation: string; phonetic: string }) => void;
  addChunk: (theme: ThemeKey, chunk: Omit<Chunk, 'id' | 'isCustom'>) => void;
  onBulkAdd: () => void;
}) {
  const [newTheme, setNewTheme] = useState<ThemeKey>('Opinions');
  const [newFrench, setNewFrench] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const allThemes = [...THEME_OPTIONS];
  const prePopulated: Record<string, Chunk[]> = {};
  (Object.values(WEEKLY_PLAN) as { themeKey: ThemeKey; chunks?: Chunk[] }[]).forEach((p) => {
    if (p.chunks) {
      const key = p.themeKey;
      prePopulated[key] = (prePopulated[key] ?? []).concat(p.chunks.map((c) => ({ ...c, isCustom: false })));
    }
  });

  const handleAdd = () => {
    if (!newFrench.trim() || !newEnglish.trim()) return;
    addChunk(newTheme, {
      text: newFrench.trim(),
      translation: newEnglish.trim(),
      phonetic: newPhonetic.trim() || undefined,
    });
    setNewFrench('');
    setNewEnglish('');
    setNewPhonetic('');
  };

  const startEdit = (chunk: Chunk, theme: ThemeKey) => {
    setEditingChunkId(chunk.id);
    setEditingTheme(theme);
    setEditForm({
      text: chunk.text,
      translation: chunk.translation,
      phonetic: chunk.phonetic ?? '',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Chunk Library</h2>
        <button
          type="button"
          onClick={onBulkAdd}
          className="px-4 py-2 bg-french-blue text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
        >
          Bulk Add from Text
        </button>
      </div>
      {allThemes.map((theme) => {
        const pre = prePopulated[theme] ?? [];
        const custom = customChunks[theme] ?? [];
        const chunks = [...pre, ...custom];
        if (chunks.length === 0) return null;
        return (
          <div key={theme}>
            <h3 className="text-french-blue font-semibold mb-3">{theme}</h3>
            <div className="grid gap-3">
              {chunks.map((chunk) => {
                const isCustom = chunk.isCustom === true;
                const isEditing = editingChunkId === chunk.id;
                if (isEditing && isCustom) {
                  return (
                    <div
                      key={chunk.id}
                      className="bg-white p-4 rounded-xl border-2 border-french-blue flex flex-col gap-2"
                    >
                      <input
                        value={editForm.text}
                        onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                        className="border border-gray-200 rounded-lg p-2"
                        placeholder="French"
                      />
                      <input
                        value={editForm.translation}
                        onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
                        className="border border-gray-200 rounded-lg p-2"
                        placeholder="English"
                      />
                      <input
                        value={editForm.phonetic}
                        onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
                        className="border border-gray-200 rounded-lg p-2"
                        placeholder="Phonetic (optional)"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingTheme) {
                              updateChunk(editingTheme, chunk.id, {
                                text: editForm.text,
                                translation: editForm.translation,
                                phonetic: editForm.phonetic || undefined,
                              });
                            }
                            setEditingChunkId(null);
                            setEditingTheme(null);
                          }}
                          className="px-3 py-1 bg-french-blue text-white rounded-lg text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingChunkId(null); setEditingTheme(null); }}
                          className="px-3 py-1 text-gray-600 rounded-lg text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }
                return (
                  <div
                    key={chunk.id}
                    className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-hand font-bold text-french-blue">{chunk.text}</p>
                      <p className="text-sm text-gray-500">{chunk.translation}</p>
                      {chunk.phonetic && (
                        <p className="text-xs text-gray-400 italic">{chunk.phonetic}</p>
                      )}
                    </div>
                    {isCustom && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(chunk, theme as ThemeKey)}
                          className="p-2 text-gray-500 hover:text-french-blue"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        {deleteConfirm === chunk.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                deleteChunk(theme as ThemeKey, chunk.id);
                                setDeleteConfirm(null);
                              }}
                              className="px-2 py-1 bg-french-red text-white rounded text-sm"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-gray-600 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm(chunk.id)}
                            className="p-2 text-gray-500 hover:text-french-red"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">Add custom chunk</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
            <select
              value={newTheme}
              onChange={(e) => setNewTheme(e.target.value as ThemeKey)}
              className="w-full p-2 border-2 border-gray-200 rounded-lg"
            >
              {THEME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">French</label>
            <input
              value={newFrench}
              onChange={(e) => setNewFrench(e.target.value)}
              placeholder="J'ai du mal à"
              className="w-full p-2 border-2 border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">English</label>
            <input
              value={newEnglish}
              onChange={(e) => setNewEnglish(e.target.value)}
              placeholder="I have a hard time"
              className="w-full p-2 border-2 border-gray-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phonetic (optional)</label>
            <input
              value={newPhonetic}
              onChange={(e) => setNewPhonetic(e.target.value)}
              placeholder="zhay-du-mal-ah"
              className="w-full p-2 border-2 border-gray-200 rounded-lg"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newFrench.trim() || !newEnglish.trim()}
            className="px-4 py-2 bg-french-blue text-white rounded-lg font-semibold disabled:opacity-50"
          >
            Add chunk
          </button>
        </div>
      </div>
    </div>
  );
}
