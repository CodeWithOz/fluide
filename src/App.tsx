import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import {
  WEEKLY_PLAN,
  getTodayName,
  getChunksForDay,
} from './data/weeklyPlan';
import { useCustomChunks, useHistory } from './hooks/useLocalChunks';
import { useDocumentHead } from './hooks/useDocumentHead';
import { useTimerSound } from './hooks/useTimerSound';
import { checkSentenceIntegration } from './services/grammarCheck';
import { hasApiKeyOrEnv } from './services/apiKeyService';
import { ApiKeySetup } from './components/ApiKeySetup';
import {
  STEPS_INFO,
  DRILL_TIMER_SECONDS,
  MONOLOGUE_TIMER_SECONDS,
} from './constants';
import type { Chunk, PracticeStep, FeedbackResponse, ThemeKey, HistorySession } from './types';
import {
  Check,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  Star,
  Mic,
  History as HistoryIcon,
  Library as LibraryIcon,
  PenTool,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Pencil,
  Dumbbell,
} from 'lucide-react';

type Tab = 'practice' | 'library' | 'history';

const THEME_OPTIONS: ThemeKey[] = [
  'Opinions',
  'Desires & Intentions',
  'Obligations',
  'Difficulties',
  'Interaction',
];

const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://fluide.prototypes.haus';

const SEO_METADATA = {
  title: 'Fluide – French Chunking Practice',
  description:
    'Practice French in chunks with Fluide. Weekly plans for giving your opinion, expressing wants, necessity, and real conversation—built for confident speaking.',
  ogTitle: 'Fluide – French Chunking Practice',
  ogDescription:
    'Practice French in chunks with Fluide. Weekly plans for giving your opinion, expressing wants, necessity, and real conversation—built for confident speaking.',
  ogType: 'website' as const,
  ogUrl: SITE_URL,
  canonicalUrl: SITE_URL,
};

export default function App() {
  useDocumentHead(SEO_METADATA);
  const { playTimerSound, stopTimerSound, warmUp: warmUpAudio } = useTimerSound();
  const { customChunks, addChunk, updateChunk, deleteChunk } = useCustomChunks();
  const { history, addSession } = useHistory();

  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [activeDay, setActiveDay] = useState(getTodayName);
  const [currentStep, setCurrentStep] = useState<PracticeStep>('HOME');
  const [selectedChunks, setSelectedChunks] = useState<Chunk[]>([]);
  const [sentences, setSentences] = useState<Record<string, string>>({});
  const [feedbackByChunk, setFeedbackByChunk] = useState<Record<string, FeedbackResponse | null>>({});
  const [grammarErrorByChunk, setGrammarErrorByChunk] = useState<Record<string, string | null>>({});
  const [monologuePrompt, setMonologuePrompt] = useState('');
  const [monologueTimeLeft, setMonologueTimeLeft] = useState(MONOLOGUE_TIMER_SECONDS);
  const [isMonologueTimerActive, setIsMonologueTimerActive] = useState(false);
  const [drillChunkIndex, setDrillChunkIndex] = useState(0);
  const [drillTimeLeft, setDrillTimeLeft] = useState(DRILL_TIMER_SECONDS);
  const [isDrillTimerActive, setIsDrillTimerActive] = useState(false);
  const [timeLoggedDrillSeconds, setTimeLoggedDrillSeconds] = useState(0);
  const [timeLoggedMonologueSeconds, setTimeLoggedMonologueSeconds] = useState(0);
  const [checkingChunkId, setCheckingChunkId] = useState<string | null>(null);
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editingTheme, setEditingTheme] = useState<ThemeKey | null>(null);
  const [editForm, setEditForm] = useState<{ text: string; translation: string; phonetic: string }>({
    text: '',
    translation: '',
    phonetic: '',
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  const plan = WEEKLY_PLAN[activeDay];
  const chunksForDay = getChunksForDay(activeDay, customChunks);
  const drillTargetSeconds = STEPS_INFO[1].targetMinutes * 60;
  const monologueTargetSeconds = STEPS_INFO[3].targetMinutes * 60;
  const drillTargetReached = timeLoggedDrillSeconds >= drillTargetSeconds;
  const monologueTargetReached = timeLoggedMonologueSeconds >= monologueTargetSeconds;
  const drillMinutesAbove = timeLoggedDrillSeconds > drillTargetSeconds
    ? Math.round((timeLoggedDrillSeconds - drillTargetSeconds) / 60 * 10) / 10
    : 0;
  const monologueMinutesAbove = timeLoggedMonologueSeconds > monologueTargetSeconds
    ? Math.round((timeLoggedMonologueSeconds - monologueTargetSeconds) / 60 * 10) / 10
    : 0;

  useEffect(() => {
    if (activeDay !== getTodayName()) return;
    setActiveDay(getTodayName());
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isMonologueTimerActive && monologueTimeLeft > 0) {
      interval = setInterval(() => {
        setMonologueTimeLeft((p) => p - 1);
        setTimeLoggedMonologueSeconds((p) => p + 1);
      }, 1000);
    } else if (monologueTimeLeft === 0 && isMonologueTimerActive) {
      playTimerSound();
      setIsMonologueTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonologueTimerActive, monologueTimeLeft, playTimerSound]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isDrillTimerActive && drillTimeLeft > 0) {
      interval = setInterval(() => {
        setDrillTimeLeft((p) => p - 1);
        setTimeLoggedDrillSeconds((p) => p + 1);
      }, 1000);
    } else if (drillTimeLeft === 0 && isDrillTimerActive) {
      playTimerSound();
      setIsDrillTimerActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDrillTimerActive, drillTimeLeft, playTimerSound]);

  // Stop timers and sound when user changes practice step
  useEffect(() => {
    stopTimerSound();
    setIsDrillTimerActive(false);
    setIsMonologueTimerActive(false);
  }, [currentStep, stopTimerSound]);

  const handleStart = () => {
    if (plan?.isSpecial && (activeDay === 'Saturday' || activeDay === 'Sunday')) {
      const all: Chunk[] = [];
      THEME_OPTIONS.forEach((theme) => {
        const dayPlan = Object.values(WEEKLY_PLAN).find((p) => p.themeKey === theme && p.chunks);
        if (dayPlan?.chunks) all.push(...dayPlan.chunks);
        all.push(...(customChunks[theme] ?? []));
      });
      const shuffled = [...all].sort(() => 0.5 - Math.random()).slice(0, 3);
      setSelectedChunks(shuffled);
      setCurrentStep('DRILL');
      setDrillChunkIndex(0);
      setDrillTimeLeft(DRILL_TIMER_SECONDS);
      setIsDrillTimerActive(false);
      setTimeLoggedDrillSeconds(0);
    } else {
      setSelectedChunks([]);
      setCurrentStep('SELECT');
    }
  };

  const toggleChunkSelection = (chunk: Chunk) => {
    if (selectedChunks.some((c) => c.id === chunk.id)) {
      setSelectedChunks(selectedChunks.filter((c) => c.id !== chunk.id));
    } else if (selectedChunks.length < 3) {
      setSelectedChunks([...selectedChunks, chunk]);
    }
  };

  const handleSentenceChange = (id: string, text: string) => {
    setSentences((prev) => ({ ...prev, [id]: text }));
    setFeedbackByChunk((prev) => ({ ...prev, [id]: null }));
    setGrammarErrorByChunk((prev) => ({ ...prev, [id]: null }));
  };

  const handleCheckGrammar = async (chunkId: string) => {
    if (!hasApiKeyOrEnv('gemini')) {
      setShowApiKeyModal(true);
      return;
    }
    const chunk = selectedChunks.find((c) => c.id === chunkId);
    const sentence = sentences[chunkId]?.trim();
    if (!chunk || !sentence) return;
    setCheckingChunkId(chunkId);
    setGrammarErrorByChunk((prev) => ({ ...prev, [chunkId]: null }));
    setFeedbackByChunk((prev) => ({ ...prev, [chunkId]: null }));
    try {
      const result = await checkSentenceIntegration(chunk.text, sentence);
      setFeedbackByChunk((prev) => ({ ...prev, [chunkId]: result }));
    } catch {
      setGrammarErrorByChunk((prev) => ({ ...prev, [chunkId]: 'Something went wrong.' }));
    } finally {
      setCheckingChunkId(null);
    }
  };

  const handleApiKeyModalClose = () => setShowApiKeyModal(false);

  const handleApiKeySave = () => { };

  const handleFinishWorkout = () => {
    const theme = plan?.theme ?? activeDay;
    addSession({
      date: new Date().toISOString().split('T')[0],
      theme,
      selectedChunks,
      sentences,
      monologuePrompt,
      timeAboveTargetMinutes: monologueMinutesAbove > 0 ? monologueMinutesAbove : undefined,
    });
    setCurrentStep('COMPLETE');
  };

  const resetToHome = () => {
    setCurrentStep('HOME');
    setSelectedChunks([]);
    setSentences({});
    setFeedbackByChunk({});
    setGrammarErrorByChunk({});
    setMonologuePrompt('');
    setMonologueTimeLeft(MONOLOGUE_TIMER_SECONDS);
    setIsMonologueTimerActive(false);
    setTimeLoggedMonologueSeconds(0);
    setDrillChunkIndex(0);
    setDrillTimeLeft(DRILL_TIMER_SECONDS);
    setIsDrillTimerActive(false);
    setTimeLoggedDrillSeconds(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (activeTab === 'library') {
    return (
      <>
        <Layout currentDay={activeDay} onOpenSettings={() => setShowApiKeyModal(true)}>
          <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <Dumbbell size={16} /> Practice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className="px-4 py-2 text-french-blue border-b-2 border-french-blue font-medium flex items-center gap-1"
          >
            <LibraryIcon size={16} /> Chunk Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <HistoryIcon size={16} /> History
          </button>
        </div>
        <LibraryView
          customChunks={customChunks}
          updateChunk={updateChunk}
          deleteChunk={deleteChunk}
          editingChunkId={editingChunkId}
          editingTheme={editingTheme}
          setEditingChunkId={(id) => { setEditingChunkId(id); if (!id) setEditingTheme(null); }}
          setEditingTheme={setEditingTheme}
          editForm={editForm}
          setEditForm={setEditForm}
          addChunk={addChunk}
        />
        </Layout>
        {showApiKeyModal && (
          <ApiKeySetup onClose={handleApiKeyModalClose} onSave={handleApiKeySave} />
        )}
      </>
    );
  }

  if (activeTab === 'history') {
    return (
      <>
        <Layout currentDay={activeDay} onOpenSettings={() => setShowApiKeyModal(true)}>
          <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <Dumbbell size={16} /> Practice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <LibraryIcon size={16} /> Chunk Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="px-4 py-2 text-french-blue border-b-2 border-french-blue font-medium flex items-center gap-1"
          >
            <HistoryIcon size={16} /> History
          </button>
        </div>
          <HistoryView history={history} />
        </Layout>
        {showApiKeyModal && (
          <ApiKeySetup onClose={handleApiKeyModalClose} onSave={handleApiKeySave} />
        )}
      </>
    );
  }

  const handleLogoClick = () => {
    if (window.confirm("Leave practice? Your progress won't be saved.")) {
      resetToHome();
    }
  };

  return (
    <>
    <Layout
      currentDay={activeDay}
      onOpenSettings={() => setShowApiKeyModal(true)}
      onLogoClick={
        currentStep !== 'HOME' && currentStep !== 'COMPLETE'
          ? handleLogoClick
          : undefined
      }
    >
      <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('practice')}
            className="px-4 py-2 text-french-blue border-b-2 border-french-blue font-medium flex items-center gap-1"
          >
            <Dumbbell size={16} /> Practice
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <LibraryIcon size={16} /> Chunk Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="px-4 py-2 text-gray-600 hover:text-french-blue font-medium flex items-center gap-1"
          >
            <HistoryIcon size={16} /> History
          </button>
        </div>

      {currentStep !== 'HOME' && currentStep !== 'COMPLETE' && (
        <StepIndicator currentStep={currentStep} />
      )}

      {currentStep === 'HOME' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
          <div className="text-center space-y-4">
            <span className="inline-block bg-blue-100 text-french-blue text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Today is {activeDay}
            </span>
            <h1 className="text-3xl font-hand font-bold text-french-blue">
              {plan?.theme}
            </h1>
            <p className="text-gray-600 max-w-md mx-auto">{plan?.description}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 w-full max-w-md">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-french-blue" />
              Daily Routine
            </h3>
            <ul className="space-y-3">
                {STEPS_INFO.map((step) => (
                <li
                  key={step.id}
                  className="flex items-center justify-between text-gray-600 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {step.id}
                    </div>
                    {step.title}
                  </div>
                  <span className="text-gray-400 font-medium">Target: {step.time}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={handleStart}
            className="w-full max-w-md bg-french-blue hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
          >
            Start Practice
            <ChevronRight size={20} />
          </button>
          <div className="mt-8 pt-8 border-t border-gray-100 w-full max-w-md">
            <p className="text-xs text-center text-gray-400 mb-3">Practice a different day?</p>
            <div className="flex justify-between px-2">
              {(Object.keys(WEEKLY_PLAN) as (keyof typeof WEEKLY_PLAN)[]).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setActiveDay(day)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    activeDay === day ? 'bg-french-blue text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentStep === 'SELECT' && chunksForDay.length > 0 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Step 1: Selection</h2>
            <p className="text-gray-500">Choose 2–3 chunks. Target: 2 min.</p>
          </div>
          <div className="grid gap-4">
            {chunksForDay.map((chunk) => {
              const isSelected = selectedChunks.some((c) => c.id === chunk.id);
              return (
                <button
                  key={chunk.id}
                  type="button"
                  onClick={() => toggleChunkSelection(chunk)}
                  disabled={!isSelected && selectedChunks.length >= 3}
                  className={`p-5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-french-blue bg-blue-50 shadow-md'
                      : selectedChunks.length >= 3
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-french-blue/50'
                  }`}
                >
                  <div>
                    <h3 className={`text-lg font-bold font-hand ${isSelected ? 'text-french-blue' : 'text-gray-700'}`}>
                      {chunk.text}
                    </h3>
                    <p className="text-sm text-gray-500">{chunk.translation}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-french-blue bg-french-blue' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep('DRILL')}
              disabled={selectedChunks.length === 0}
              className="px-6 py-3 bg-french-blue text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 flex items-center gap-2"
            >
              Continue to Drill
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 'DRILL' && selectedChunks.length > 0 && (
        <div className="flex flex-col py-6">
          <div className="text-center mb-6">
            <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Chunk {drillChunkIndex + 1} of {selectedChunks.length}
            </span>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">The Drill</h2>
            <p className="text-gray-500 text-sm">Target: 3 min total. Repeat aloud, no pauses.</p>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center space-y-6 my-8">
            <div className="relative bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full text-center">
              <h3 className="text-3xl font-hand font-bold text-french-blue mb-2">
                {selectedChunks[drillChunkIndex].text}
              </h3>
              {selectedChunks[drillChunkIndex].phonetic && (
                <p className="text-lg text-gray-600 italic mb-2">
                  {selectedChunks[drillChunkIndex].phonetic}
                </p>
              )}
              <p className="text-gray-500">{selectedChunks[drillChunkIndex].translation}</p>
              <div className="mt-8">
                <p className="text-sm text-gray-500 mb-2">30s drill timer</p>
                <div className="text-4xl font-mono font-bold text-french-blue mb-4">
                  {formatTime(drillTimeLeft)}
                </div>
                <div className="flex justify-center gap-2">
                  {!isDrillTimerActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        warmUpAudio();
                        stopTimerSound();
                        if (drillTimeLeft === 0) setDrillTimeLeft(DRILL_TIMER_SECONDS);
                        setIsDrillTimerActive(true);
                      }}
                      className="px-6 py-2 bg-french-blue text-white rounded-full font-bold flex items-center gap-2"
                    >
                      <Play size={18} /> Start
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsDrillTimerActive(false)}
                      className="px-6 py-2 bg-amber-500 text-white rounded-full font-bold flex items-center gap-2"
                    >
                      <Pause size={18} /> Pause
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      stopTimerSound();
                      setIsDrillTimerActive(false);
                      setDrillTimeLeft(DRILL_TIMER_SECONDS);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <RotateCcw size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Logged toward 3 min: {formatTime(Math.min(timeLoggedDrillSeconds, drillTargetSeconds))}
                  {drillTargetReached && (
                    <span className="block text-green-600 font-semibold mt-1">Target reached</span>
                  )}
                  {drillMinutesAbove > 0 && (
                    <span className="block text-amber-600 mt-1">{drillMinutesAbove} min above target</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex justify-between w-full mt-8">
            {drillChunkIndex > 0 ? (
              <button
                type="button"
                onClick={() => setDrillChunkIndex((p) => p - 1)}
                className="px-4 py-2 text-gray-600 hover:text-french-blue"
              >
                Previous
              </button>
            ) : (
              <span />
            )}
            {drillChunkIndex < selectedChunks.length - 1 ? (
              <button
                type="button"
                onClick={() => setDrillChunkIndex((p) => p + 1)}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-bold flex items-center gap-2"
              >
                Next chunk
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep('INTEGRATE')}
                className="px-6 py-3 bg-french-blue text-white rounded-xl font-bold flex items-center gap-2"
              >
                I've drilled them
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {currentStep === 'INTEGRATE' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Step 3: Integration</h2>
            <p className="text-gray-500">Create a sentence for each chunk. Target: 5 min.</p>
          </div>
          <div className="space-y-6">
            {selectedChunks.map((chunk) => (
              <div key={chunk.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
                <div className="mb-3">
                  <span className="text-sm font-bold text-french-blue bg-blue-50 px-2 py-1 rounded">
                    {chunk.text}
                  </span>
                  <span className="ml-2 text-sm text-gray-400">{chunk.translation}</span>
                </div>
                <textarea
                  value={sentences[chunk.id] ?? ''}
                  onChange={(e) => handleSentenceChange(chunk.id, e.target.value)}
                  placeholder={`e.g. ${chunk.text}...`}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-french-blue focus:ring-0 resize-none h-28"
                  rows={2}
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCheckGrammar(chunk.id)}
                    disabled={checkingChunkId === chunk.id || !(sentences[chunk.id]?.trim())}
                    className="flex items-center gap-2 text-sm font-bold text-french-blue hover:text-blue-700 disabled:opacity-50"
                  >
                    {checkingChunkId === chunk.id ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Check my grammar
                  </button>
                </div>
                {grammarErrorByChunk[chunk.id] && (
                  <div className="mt-4 p-4 rounded-xl border bg-red-50 border-red-200">
                    <p className="text-sm text-red-700 font-medium">
                      {grammarErrorByChunk[chunk.id]}
                    </p>
                  </div>
                )}
                {feedbackByChunk[chunk.id] && (
                  <div
                    className={`mt-4 p-4 rounded-xl border ${
                      feedbackByChunk[chunk.id]!.isCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 p-1 rounded-full ${
                          feedbackByChunk[chunk.id]!.isCorrect
                            ? 'bg-green-200 text-green-700'
                            : 'bg-orange-200 text-orange-700'
                        }`}
                      >
                        {feedbackByChunk[chunk.id]!.isCorrect ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <PenTool size={16} />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`font-bold ${
                            feedbackByChunk[chunk.id]!.isCorrect
                              ? 'text-green-800'
                              : 'text-orange-800'
                          }`}
                        >
                          {feedbackByChunk[chunk.id]!.isCorrect ? 'Excellent!' : 'Needs a tweak'}
                        </h4>
                        {!feedbackByChunk[chunk.id]!.isCorrect &&
                          feedbackByChunk[chunk.id]!.correction && (
                            <p className="mt-1 font-medium text-gray-800">
                              Correction:{' '}
                              <span className="text-green-600">
                                {feedbackByChunk[chunk.id]!.correction}
                              </span>
                            </p>
                          )}
                        <p className="mt-2 text-sm text-gray-600">
                          {feedbackByChunk[chunk.id]!.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentStep('MONOLOGUE')}
              className="px-6 py-3 bg-french-blue text-white rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2"
            >
              Start Monologue
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 'MONOLOGUE' && (
        <div className="space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-french-red text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Mini-Monologue</h2>
            <p className="text-gray-500 mt-2">Target: 2–5 min. Speak freely, use your chunks.</p>
          </div>
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your topic / prompt</label>
            <input
              type="text"
              value={monologuePrompt}
              onChange={(e) => setMonologuePrompt(e.target.value)}
              placeholder="e.g. My day, Learning French"
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-french-blue"
            />
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs max-w-md mx-auto">
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {selectedChunks.map((c) => (
                <span
                  key={c.id}
                  className="bg-blue-50 text-french-blue px-3 py-1 rounded-full text-sm font-bold border border-blue-100"
                >
                  {c.text}
                </span>
              ))}
            </div>
            <div className="text-5xl font-mono font-bold text-gray-800 mb-4 text-center tabular-nums">
              {formatTime(monologueTimeLeft)}
            </div>
            <div className="flex justify-center gap-2 mb-4">
              {!isMonologueTimerActive ? (
                <button
                  type="button"
                  onClick={() => {
                    warmUpAudio();
                    stopTimerSound();
                    if (monologueTimeLeft === 0) setMonologueTimeLeft(MONOLOGUE_TIMER_SECONDS);
                    setIsMonologueTimerActive(true);
                  }}
                  className="px-8 py-3 bg-french-blue text-white rounded-full font-bold flex items-center gap-2"
                >
                  <Play size={18} /> Start
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMonologueTimerActive(false)}
                  className="px-8 py-3 bg-amber-500 text-white rounded-full font-bold flex items-center gap-2"
                >
                  <Pause size={18} /> Pause
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  stopTimerSound();
                  setIsMonologueTimerActive(false);
                  setMonologueTimeLeft(MONOLOGUE_TIMER_SECONDS);
                }}
                className="p-3 text-gray-400 hover:text-gray-600"
              >
                <RotateCcw size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Logged toward target: {formatTime(Math.min(timeLoggedMonologueSeconds, monologueTargetSeconds))}
              {monologueTargetReached && (
                <span className="block text-green-600 font-semibold mt-1">Target reached</span>
              )}
              {monologueMinutesAbove > 0 && (
                <span className="block text-amber-600 mt-1">{monologueMinutesAbove} min above target</span>
              )}
            </p>
            <div className="mt-6 text-left bg-gray-50 p-4 rounded-xl">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Recall cheat sheet</p>
              <ul className="space-y-2">
                {selectedChunks.map((c) => (
                  <li key={c.id}>
                    <span className="font-medium text-french-blue">{c.text}</span>
                    {sentences[c.id] && (
                      <span className="block text-sm text-gray-600 mt-0.5">→ {sentences[c.id]}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleFinishWorkout}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 flex items-center gap-2"
            >
              Finish Workout
              <Check size={18} />
            </button>
          </div>
        </div>
      )}

      {currentStep === 'COMPLETE' && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center py-10">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Star className="w-12 h-12 text-green-600 fill-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">C'est fini !</h2>
          <p className="text-gray-600 max-w-md mb-8">
            Great job. Consistency is the key to fluency.
          </p>
          <div className="bg-white p-6 rounded-xl border border-gray-200 w-full max-w-sm mb-8 text-left">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Today's stats</h3>
            <div className="flex justify-between text-sm text-gray-500 border-b border-gray-100 pb-2 mb-2">
              <span>Chunks practiced</span>
              <span className="font-bold text-gray-800">{selectedChunks.length}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Theme</span>
              <span className="font-bold text-gray-800">{plan?.theme ?? activeDay}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={resetToHome}
            className="px-8 py-3 bg-french-blue text-white rounded-xl font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      )}
      </Layout>
      {showApiKeyModal && (
        <ApiKeySetup onClose={handleApiKeyModalClose} onSave={handleApiKeySave} />
      )}
    </>
  );
}

function LibraryView({
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
      <h2 className="text-xl font-bold text-gray-800">Chunk Library</h2>
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

function HistoryView({ history }: { history: HistorySession[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Practice history</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No practice sessions yet. Finish a workout to see it here.</p>
      ) : (
        <div className="space-y-4">
          {history.map((session, idx) => (
            <div
              key={`${session.date}-${idx}`}
              className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-french-blue"
            >
              <p className="font-bold text-gray-800">
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-french-blue mt-1">Theme: {session.theme}</p>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-600">Chunks practiced</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {session.selectedChunks.map((c) => (
                    <span
                      key={c.id}
                      className="bg-blue-50 text-french-blue px-2 py-1 rounded text-sm"
                    >
                      {c.text}
                    </span>
                  ))}
                </div>
              </div>
              {Object.keys(session.sentences).filter((k) => session.sentences[k]).length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Sentences: {Object.keys(session.sentences).filter((k) => session.sentences[k]).length}
                </p>
              )}
              {session.monologuePrompt && (
                <p className="text-sm text-gray-500 mt-1">Monologue topic: {session.monologuePrompt}</p>
              )}
              {session.timeAboveTargetMinutes != null && session.timeAboveTargetMinutes > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {session.timeAboveTargetMinutes} min above target
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
