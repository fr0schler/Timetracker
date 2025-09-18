// Fallback configuration for API URL
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://timeapi.hkp-solutions.de'
    : 'http://localhost:8000');

export const config = {
  apiUrl: API_BASE_URL,
  appName: 'TimeTracker',
} as const;