const API_URL_KEY = 'dr_api_url';

// API base URL resolution order (most → least specific):
//   1. localStorage override (per-device)
//   2. window.DAALROTI_CONFIG.API_URL  — runtime config from public/app-config.js
//      (editable on the server, e.g. Hostinger, WITHOUT rebuilding)
//   3. VITE_API_URL build-time env
//   4. 'api/' relative default (works on localhost, LAN, domain, subfolders)
export const getApiUrl = () => {
  const runtime = (typeof window !== 'undefined' && window.DAALROTI_CONFIG?.API_URL) || '';
  const saved = localStorage.getItem(API_URL_KEY);
  const url = saved?.trim() || runtime.trim() || import.meta.env.VITE_API_URL || 'api/';
  return url.replace(/\/+$/, ''); // strip trailing slash; callers add "/entries" etc.
};

export const setApiUrl = (url) => {
  const clean = url?.trim() || '';
  if (clean) {
    localStorage.setItem(API_URL_KEY, clean);
  } else {
    localStorage.removeItem(API_URL_KEY);
  }
};

// Real-time (SSE) is enabled by default, but disabled in environments that
// can't hold long-lived connections (e.g. Hostinger shared hosting). When off,
// the app relies on polling instead. Toggle with VITE_REALTIME=false.
export const REALTIME = import.meta.env.VITE_REALTIME !== 'false';

// Subscribe to real-time change events via Server-Sent Events.
// `onChange` runs whenever any device adds/edits/deletes an entry.
// Returns an unsubscribe function. EventSource auto-reconnects on drop.
export const subscribeToChanges = (onChange) => {
  const url = getApiUrl();
  if (!REALTIME || !url || typeof EventSource === 'undefined') return () => {};

  const source = new EventSource(`${url}/events`);
  source.addEventListener('entries-changed', onChange);
  source.onerror = () => {
    // EventSource reconnects automatically; nothing to do here.
  };
  return () => {
    source.removeEventListener('entries-changed', onChange);
    source.close();
  };
};

// Fetch all entries from the MySQL-backed API.
export const fetchEntries = async () => {
  const url = getApiUrl();
  if (!url) return null;

  const response = await fetch(`${url}/entries`);
  if (!response.ok) throw new Error('Failed to fetch entries');
  return response.json();
};

// Lightweight "revision" signature (count + last-change time) for cheap
// multi-device polling — pull full data only when this string changes.
export const fetchRev = async () => {
  const url = getApiUrl();
  if (!url) return null;

  const response = await fetch(`${url}/rev`);
  if (!response.ok) throw new Error('Failed to fetch rev');
  const data = await response.json();
  return data?.rev ?? null;
};

// Create a single entry directly in the database.
export const createEntry = async (entry) => {
  const url = getApiUrl();
  if (!url) throw new Error('No API URL configured');

  const response = await fetch(`${url}/entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to create entry');
  return response.json();
};

// Update a single entry directly in the database.
export const updateEntry = async (id, entry) => {
  const url = getApiUrl();
  if (!url) throw new Error('No API URL configured');

  const response = await fetch(`${url}/entries/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error('Failed to update entry');
  return response.json();
};

// Delete a single entry directly from the database.
export const removeEntry = async (id) => {
  const url = getApiUrl();
  if (!url) throw new Error('No API URL configured');

  const response = await fetch(`${url}/entries/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('Failed to delete entry');
  return response.json();
};

// Bulk-sync the full client dataset (kept for one-off data imports; the app
// itself now writes each entry directly via the functions above).
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
