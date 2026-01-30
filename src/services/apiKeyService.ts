/**
 * API Key Management Service
 * Handles storage and retrieval of API keys from localStorage
 * with fallback to environment variables for backward compatibility.
 */

const STORAGE_KEY_PREFIX = 'fluide_api_key_';

export type ApiKeyProvider = 'gemini';

/**
 * Get an API key from localStorage for a specific provider.
 */
export function getApiKey(provider: ApiKeyProvider): string | null {
  try {
    const key = localStorage.getItem(`${STORAGE_KEY_PREFIX}${provider}`);
    return key || null;
  } catch (error) {
    console.error(`Error reading ${provider} API key from localStorage:`, error);
    return null;
  }
}

/**
 * Set an API key in localStorage for a specific provider.
 */
export function setApiKey(provider: ApiKeyProvider, key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${provider}`, key.trim());
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${provider}`);
    }
  } catch (error) {
    console.error(`Error saving ${provider} API key to localStorage:`, error);
    throw error;
  }
}

/**
 * Get API key from localStorage, falling back to environment variable.
 * Checks localStorage first, then import.meta.env for Vite.
 */
export function getApiKeyOrEnv(provider: ApiKeyProvider): string | null {
  const storedKey = getApiKey(provider);
  if (storedKey) {
    return storedKey;
  }
  const envKey =
    provider === 'gemini'
      ? (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)
      : undefined;
  return envKey ?? null;
}

/**
 * Check if a specific provider has an API key available (from localStorage or env).
 */
export function hasApiKeyOrEnv(provider: ApiKeyProvider): boolean {
  return getApiKeyOrEnv(provider) !== null;
}
