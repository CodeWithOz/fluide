import type { HistorySession } from '../types';

export function HistoryView({ history }: { history: HistorySession[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Practice history</h2>
      {history.length === 0 ? (
        <p className="text-gray-500">No practice sessions yet. Finish a workout to see it here.</p>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <div
              key={session.id}
              className="bg-white p-5 rounded-xl border border-gray-200 border-l-4 border-l-french-blue"
            >
              <p className="font-bold text-gray-800">
                {new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                {' '}
                <span className="font-normal text-gray-500 text-sm">
                  at {new Date(parseInt(session.id)).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
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
