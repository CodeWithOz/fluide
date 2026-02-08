import { useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
  X,
  Plus,
  Sparkles,
} from 'lucide-react';
import { extractPhrases, type ExtractedPhrase } from '../services/phraseExtraction';
import { hasApiKeyOrEnv } from '../services/apiKeyService';
import type { Chunk, ThemeKey } from '../types';

const THEME_OPTIONS: ThemeKey[] = [
  'Opinions',
  'Desires & Intentions',
  'Obligations',
  'Difficulties',
  'Interaction',
];

const THEME_COLORS: Record<string, string> = {
  Opinions: 'bg-blue-100 text-blue-800',
  'Desires & Intentions': 'bg-purple-100 text-purple-800',
  Obligations: 'bg-amber-100 text-amber-800',
  Difficulties: 'bg-red-100 text-red-800',
  Interaction: 'bg-green-100 text-green-800',
};

export function BulkAddView({
  onBack,
  addChunk,
  onNeedApiKey,
}: {
  onBack: () => void;
  addChunk: (theme: ThemeKey, chunk: Omit<Chunk, 'id' | 'isCustom'>) => void;
  onNeedApiKey: () => void;
}) {
  const [inputText, setInputText] = useState('');
  const [extractedPhrases, setExtractedPhrases] = useState<ExtractedPhrase[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ text: '', translation: '', phonetic: '', theme: '' as ThemeKey });
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleExtract = async () => {
    if (!inputText.trim()) return;
    if (!hasApiKeyOrEnv('gemini')) {
      onNeedApiKey();
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const newPhrases = await extractPhrases(inputText.trim());
      // Merge with existing: append new, deduplicate by text+theme
      setExtractedPhrases((prev) => {
        const existingKeys = new Set(prev.map((p) => `${p.text}::${p.theme}`));
        const unique = newPhrases.filter((p) => !existingKeys.has(`${p.text}::${p.theme}`));
        return [...prev, ...unique];
      });
    } catch {
      setError('Failed to extract phrases. Please check your API key and try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemove = (id: string) => {
    setExtractedPhrases((prev) => prev.filter((p) => p.id !== id));
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleStartEdit = (phrase: ExtractedPhrase) => {
    setEditingId(phrase.id);
    setEditForm({
      text: phrase.text,
      translation: phrase.translation,
      phonetic: phrase.phonetic,
      theme: phrase.theme,
    });
  };

  const handleSaveEdit = (id: string) => {
    setExtractedPhrases((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, text: editForm.text, translation: editForm.translation, phonetic: editForm.phonetic, theme: editForm.theme }
          : p
      )
    );
    setAddedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setEditingId(null);
  };

  const handleAddToLibrary = (phrase: ExtractedPhrase) => {
    addChunk(phrase.theme, {
      text: phrase.text,
      translation: phrase.translation,
      phonetic: phrase.phonetic || undefined,
    });
    setAddedIds((prev) => new Set(prev).add(phrase.id));
  };

  const handleAddAll = () => {
    const toAdd = extractedPhrases.filter((p) => !addedIds.has(p.id));
    for (const phrase of toAdd) {
      addChunk(phrase.theme, {
        text: phrase.text,
        translation: phrase.translation,
        phonetic: phrase.phonetic || undefined,
      });
    }
    setAddedIds(new Set(extractedPhrases.map((p) => p.id)));
  };

  const unadded = extractedPhrases.filter((p) => !addedIds.has(p.id));
  const phrasesByTheme = THEME_OPTIONS.map((theme) => ({
    theme,
    phrases: extractedPhrases.filter((p) => p.theme === theme),
  })).filter((g) => g.phrases.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-french-blue rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Bulk Add Phrases</h2>
          <p className="text-sm text-gray-500">
            Paste French text and extract practice phrases automatically
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          French text (transcript, article, etc.)
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste your French text here... e.g. a transcript from a podcast, an article, or any French text you want to learn from."
          className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-french-blue focus:ring-0 resize-none h-40 text-sm"
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExtract}
            disabled={isExtracting || !inputText.trim()}
            className="px-5 py-2.5 bg-french-blue text-white rounded-lg font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="animate-spin" size={16} /> Extracting...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Extract Phrases
              </>
            )}
          </button>
          {extractedPhrases.length > 0 && (
            <p className="text-sm text-gray-500">
              Re-extract to find more phrases — existing results are kept.
            </p>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
        )}
      </div>

      {/* Extracted phrases */}
      {extractedPhrases.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Extracted Phrases ({extractedPhrases.length})
            </h3>
            {unadded.length > 0 && (
              <button
                type="button"
                onClick={handleAddAll}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg font-semibold text-sm hover:bg-emerald-600 flex items-center gap-2"
              >
                <Plus size={16} /> Add All to Library ({unadded.length})
              </button>
            )}
          </div>

          {phrasesByTheme.map(({ theme, phrases }) => (
            <div key={theme}>
              <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${THEME_COLORS[theme] ?? ''}`}>
                  {theme}
                </span>
                <span className="text-gray-400">({phrases.length})</span>
              </h4>
              <div className="grid gap-3">
                {phrases.map((phrase) => {
                  const isAdded = addedIds.has(phrase.id);
                  const isEditing = editingId === phrase.id;

                  if (isEditing) {
                    return (
                      <div
                        key={phrase.id}
                        className="bg-white p-4 rounded-xl border-2 border-french-blue space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">French</label>
                            <input
                              value={editForm.text}
                              onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">English</label>
                            <input
                              value={editForm.translation}
                              onChange={(e) => setEditForm({ ...editForm, translation: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Phonetic</label>
                            <input
                              value={editForm.phonetic}
                              onChange={(e) => setEditForm({ ...editForm, phonetic: e.target.value })}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Theme</label>
                            <select
                              value={editForm.theme}
                              onChange={(e) => setEditForm({ ...editForm, theme: e.target.value as ThemeKey })}
                              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                            >
                              {THEME_OPTIONS.map((t) => (
                                <option key={t} value={t}>{t}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(phrase.id)}
                            className="px-3 py-1.5 bg-french-blue text-white rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <Check size={14} /> Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-1"
                          >
                            <X size={14} /> Cancel
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={phrase.id}
                      className={`bg-white p-4 rounded-xl border flex items-center justify-between gap-4 ${
                        isAdded ? 'border-green-200 bg-green-50/50' : 'border-gray-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-hand font-bold text-french-blue">{phrase.text}</p>
                        <p className="text-sm text-gray-500">{phrase.translation}</p>
                        {phrase.phonetic && (
                          <p className="text-xs text-gray-400 italic">{phrase.phonetic}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isAdded ? (
                          <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <Check size={12} /> Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToLibrary(phrase)}
                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg"
                            title="Add to library"
                          >
                            <Plus size={18} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(phrase)}
                          className="p-2 text-gray-400 hover:text-french-blue hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(phrase.id)}
                          className="p-2 text-gray-400 hover:text-french-red hover:bg-red-50 rounded-lg"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
