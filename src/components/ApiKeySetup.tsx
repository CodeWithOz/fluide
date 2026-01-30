import { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { getApiKey, setApiKey } from '../services/apiKeyService';

interface ApiKeySetupProps {
  onClose: () => void;
  onSave?: () => void;
}

export function ApiKeySetup({ onClose, onSave }: ApiKeySetupProps) {
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getApiKey('gemini');
    if (stored) setGeminiKey(stored);
  }, []);

  const handleSave = () => {
    try {
      setError(null);
      setApiKey('gemini', geminiKey);
      onSave?.();
      onClose();
    } catch (err) {
      console.error('Error saving API key:', err);
      setError('Failed to save API key. Please try again.');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-settings-title"
    >
      <div
        className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="api-settings-title"
          className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"
        >
          <Settings className="h-6 w-6 text-french-blue" />
          API Settings
        </h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="gemini-key"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-key"
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full border-2 border-gray-200 rounded-xl pl-4 pr-10 py-2 text-gray-800 text-sm focus:border-french-blue focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                aria-label={showGeminiKey ? 'Hide key' : 'Show key'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showGeminiKey ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-french-blue hover:underline mt-1 inline-block"
            >
              Get a Gemini API Key →
            </a>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            Keys are stored locally in your browser. localStorage is vulnerable to{' '}
            <a
              href="https://owasp.org/www-community/attacks/xss"
              target="_blank"
              rel="noopener noreferrer"
              className="text-french-blue hover:text-blue-700 underline"
            >
              XSS attacks
            </a>
            . For production, deploy your version of the app from the{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-french-blue hover:text-blue-700 underline"
            >
              source code
            </a>
            {' '}and use environment variables.
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-french-blue hover:bg-blue-700 text-white rounded-xl text-sm font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
