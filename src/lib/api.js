const API_URL_KEY = 'dr_api_url';
// In dev, Vite proxies "/api" to the Express server (see vite.config.js).
// In production set VITE_API_URL to the deployed server's base URL.
const DEFAULT_API_URL = import.meta.env.VITE_API_URL || '/api';

export const getApiUrl = () => {
  const saved = localStorage.getItem(API_URL_KEY);
  return (saved?.trim() || DEFAULT_API_URL).replace(/\/+$/, '');
};

export const setApiUrl = (url) => {
  const clean = url?.trim() || '';
  if (clean) {
    localStorage.setItem(API_URL_KEY, clean);
  } else {
    localStorage.removeItem(API_URL_KEY);
  }
};

// Fetch all entries from the MySQL-backed API.
export const fetchEntries = async () => {
  const url = getApiUrl();
  if (!url) return null;

  const response = await fetch(`${url}/entries`);
  if (!response.ok) throw new Error('Failed to fetch entries');
  return response.json();
};

// Bulk-sync the full client dataset to the server.
export const syncEntries = async (entries) => {
  const url = getApiUrl();
  if (!url) return null;

  const response = await fetch(`${url}/entries/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entries),
  });
  if (!response.ok) throw new Error('Failed to sync entries');
  return response.json();
};
